import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import prisma from '@/lib/prisma';
import productVariantService from '@/lib/services/productVariantService';
import revenueService from '@/lib/services/revenueService';
import { sendDiscordWebhook } from '@/lib/services/webhookService';
import emailService from '@/lib/services/emailService';

export async function POST(request) {
  const rawBody = await request.text();
  const sig = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  console.log('=== STRIPE WEBHOOK RECEIVED ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('===============================');

  let event;

  try {
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } else {
      console.warn('Stripe webhook: signature check skipped');
      event = JSON.parse(rawBody);
    }
  } catch (err) {
    console.error('Stripe webhook signature error:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  console.log('Stripe event type:', event.type);

  if (event.type !== 'payment_intent.succeeded') {
    return NextResponse.json({ message: 'Webhook received' }, { status: 200 });
  }

  const paymentIntent = event.data.object;
  const orderId = paymentIntent.metadata?.orderId;

  if (!orderId) {
    console.error('Stripe webhook: no orderId in metadata');
    return NextResponse.json({ error: 'Missing orderId in metadata' }, { status: 400 });
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        product: { include: { translations: true } },
        variant: true
      }
    });

    if (!order) {
      console.error('Stripe webhook: order not found:', orderId);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.status === 'completed') {
      console.log('Stripe webhook: order already completed:', orderId);
      return NextResponse.json({ message: 'Already processed' }, { status: 200 });
    }

    // Проверяем наличие ключей
    const hasKeys = await productVariantService.checkAvailableKeys(
      order.variantId,
      order.quantity || 1
    );

    if (!hasKeys) {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'failed', paymentStatus: 'failed' }
      });
      return NextResponse.json({ error: 'No available keys' }, { status: 400 });
    }

    const keys = await productVariantService.getKeysForOrder(
      order.variantId,
      order.quantity || 1
    );

    if (!keys || keys.length === 0) {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'failed', paymentStatus: 'failed' }
      });
      return NextResponse.json({ error: 'Failed to get keys' }, { status: 500 });
    }

    // Обновляем заказ
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'completed',
        paymentStatus: 'completed',
        paidAt: new Date(),
        paymentData: {
          provider: 'stripe',
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          completedAt: new Date().toISOString()
        }
      }
    });

    // Сохраняем ключи для авторизованных пользователей
    if (order.userId) {
      await prisma.userPurchase.create({
        data: {
          orderId: order.id,
          userId: order.userId,
          productId: order.productId,
          variantId: order.variantId,
          price: order.totalUsd,
          currency: 'usd',
          keys: keys.join(', '),
          quantity: order.quantity || 1,
          instruction: order.variant?.instructions || '',
          couponCode: order.couponCode,
          couponDiscount: order.couponDiscount
        }
      });
    }

    // Discord вебхук
    await sendDiscordWebhook(order);

    // Записываем доход
    try {
      await revenueService.recordRevenue(order.totalUsd, 'USD');
    } catch (revenueError) {
      console.error('Failed to record revenue:', revenueError);
    }

    // Название продукта
    const ruTranslation = order.product?.translations?.find(t => t.language === 'ru');
    const productName = ruTranslation?.name || order.product?.translations?.[0]?.name || 'Unknown Product';

    // Email
    if (order.email) {
      try {
        const emailResult = await emailService.sendOrderCompletedEmail({
          email: order.email,
          orderId: order.id,
          productName,
          keys,
          totalAmount: order.totalUsd,
          currency: 'USD'
        });

        if (emailResult.success) {
          console.log('[STRIPE] ✅ Email sent to:', order.email);
        } else {
          console.error('[STRIPE] ❌ Email failed:', emailResult.error);
        }
      } catch (emailError) {
        console.error('[STRIPE] ❌ Email exception:', emailError);
      }
    }

    // Лог
    const couponLog = order.couponCode ? `, Coupon=${order.couponCode} (${order.couponDiscount}%)` : '';
    await prisma.log.create({
      data: {
        user: order.email,
        timestamp: BigInt(Date.now()),
        description: `Stripe оплата: ID=${order.id}, Product="${productName}", Price=$${order.totalUsd}, Status=completed, Email=${order.email}${couponLog}`
      }
    });

    console.log('Stripe: order completed:', orderId);
    return NextResponse.json({ message: 'Payment processed successfully' }, { status: 200 });

  } catch (error) {
    console.error('Stripe webhook processing error:', error);
    return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Stripe webhook endpoint is active',
    timestamp: new Date().toISOString()
  }, { status: 200 });
}
