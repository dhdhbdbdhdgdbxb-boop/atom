import { NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import productVariantService from '@/lib/services/productVariantService';
import revenueService from '@/lib/services/revenueService';
import { sendDiscordWebhook } from '@/lib/services/webhookService';
import emailService from '@/lib/services/emailService';

// Подпись: strtoupper(md5(OutSum + ":" + InvId + ":" + apiToken))
function verifySignature(OutSum, InvId, SignatureValue, apiToken) {
  const hash = crypto
    .createHash('md5')
    .update(`${OutSum}:${InvId}:${apiToken}`)
    .digest('hex')
    .toUpperCase();
  return hash === SignatureValue?.toUpperCase();
}

export async function POST(request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let params;

    if (contentType.includes('application/json')) {
      params = await request.json();
    } else {
      const rawBody = await request.text();
      params = Object.fromEntries(new URLSearchParams(rawBody));
    }

    console.log('=== PALLY WEBHOOK RECEIVED ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Params:', JSON.stringify(params, null, 2));
    console.log('==============================');

    const { Status, InvId, OutSum, Commission, CurrencyIn, TrsId, custom, SignatureValue } = params;

    if (!Status || !InvId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Проверяем подпись
    const apiToken = process.env.PALLY_API_TOKEN;
    if (apiToken && SignatureValue) {
      const valid = verifySignature(OutSum, InvId, SignatureValue, apiToken);
      if (!valid) {
        console.error('Pally webhook: invalid signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
      }
    } else {
      console.warn('Pally webhook: signature check skipped');
    }

    if (Status?.toUpperCase() !== 'SUCCESS') {
      console.log('Pally webhook: non-success status:', Status);
      return NextResponse.json({ message: 'Webhook received' }, { status: 200 });
    }

    const order_id = InvId;

    const order = await prisma.order.findUnique({
      where: { id: order_id },
      include: {
        product: { include: { translations: true } },
        variant: true
      }
    });

    if (!order) {
      console.error('Pally webhook: order not found:', order_id);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.status === 'completed') {
      console.log('Pally webhook: order already completed:', order_id);
      return NextResponse.json({ message: 'Already processed' }, { status: 200 });
    }

    const hasKeys = await productVariantService.checkAvailableKeys(order.variantId, order.quantity || 1);
    if (!hasKeys) {
      await prisma.order.update({ where: { id: order_id }, data: { status: 'failed', paymentStatus: 'failed' } });
      return NextResponse.json({ error: 'No available keys' }, { status: 400 });
    }

    const keys = await productVariantService.getKeysForOrder(order.variantId, order.quantity || 1);
    if (!keys || keys.length === 0) {
      await prisma.order.update({ where: { id: order_id }, data: { status: 'failed', paymentStatus: 'failed' } });
      return NextResponse.json({ error: 'Failed to get keys' }, { status: 500 });
    }

    await prisma.order.update({
      where: { id: order_id },
      data: {
        status: 'completed',
        paymentStatus: 'completed',
        paidAt: new Date(),
        paymentData: {
          provider: 'pally',
          trsId: TrsId,
          outSum: OutSum,
          commission: Commission,
          currency: CurrencyIn,
          completedAt: new Date().toISOString()
        }
      }
    });

    if (order.userId) {
      await prisma.userPurchase.create({
        data: {
          orderId: order.id,
          userId: order.userId,
          productId: order.productId,
          variantId: order.variantId,
          price: order.totalRub,
          currency: 'rub',
          keys: keys.join(', '),
          quantity: order.quantity || 1,
          instruction: order.variant?.instructions || '',
          couponCode: order.couponCode,
          couponDiscount: order.couponDiscount
        }
      });
    }

    await sendDiscordWebhook(order);

    try {
      await revenueService.recordRevenue(order.totalRub, 'RUB');
    } catch (e) { console.error('Revenue error:', e); }

    const ruTranslation = order.product?.translations?.find(t => t.language === 'ru');
    const productName = ruTranslation?.name || order.product?.translations?.[0]?.name || 'Unknown Product';

    if (order.email) {
      try {
        await emailService.sendOrderCompletedEmail({
          email: order.email,
          orderId: order.id,
          productName,
          keys,
          totalAmount: order.totalRub,
          currency: 'RUB'
        });
      } catch (e) { console.error('Pally email error:', e); }
    }

    const couponLog = order.couponCode ? `, Coupon=${order.couponCode} (${order.couponDiscount}%)` : '';
    await prisma.log.create({
      data: {
        user: order.email,
        timestamp: BigInt(Date.now()),
        description: `Pally оплата: ID=${order.id}, Product="${productName}", Price=₽${order.totalRub}, TrsId=${TrsId}, Status=completed, Email=${order.email}${couponLog}`
      }
    });

    console.log('Pally: order completed:', order_id);
    return NextResponse.json({ message: 'Payment processed successfully' }, { status: 200 });

  } catch (error) {
    console.error('Pally webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Pally webhook endpoint is active', timestamp: new Date().toISOString() });
}
