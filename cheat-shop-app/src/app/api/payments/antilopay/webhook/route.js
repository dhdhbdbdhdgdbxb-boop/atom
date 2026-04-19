import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAntilopayWebhook } from '@/lib/services/antilopayService';
import productVariantService from '@/lib/services/productVariantService';
import revenueService from '@/lib/services/revenueService';
import { sendDiscordWebhook } from '@/lib/services/webhookService';
import emailService from '@/lib/services/emailService';

export async function POST(request) {
  try {
    const rawBody = await request.text();

    console.log('=== ANTILOPAY WEBHOOK RECEIVED ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Body:', rawBody);
    console.log('==================================');

    let body;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // Верификация подписи
    const signature = request.headers.get('X-Apay-Sign');
    if (signature) {
      const isValid = verifyAntilopayWebhook(rawBody, signature);
      if (!isValid) {
        console.error('Antilopay webhook: invalid signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
      }
    } else {
      console.warn('Antilopay webhook: no signature header');
    }

    const { status, order_id, payment_id, amount } = body;

    if (!order_id) {
      return NextResponse.json({ error: 'Missing order_id' }, { status: 400 });
    }

    console.log('Antilopay webhook status:', status, 'order:', order_id);

    // Обрабатываем только успешные платежи
    if (status?.toUpperCase() !== 'SUCCESS' && status?.toUpperCase() !== 'PAID') {
      console.log('Antilopay webhook: skipping status:', status);
      return NextResponse.json({ message: 'Webhook received' }, { status: 200 });
    }

    try {
      const order = await prisma.order.findUnique({
        where: { id: order_id },
        include: {
          product: { include: { translations: true } },
          variant: true
        }
      });

      if (!order) {
        console.error('Antilopay webhook: order not found:', order_id);
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      if (order.status === 'completed') {
        console.log('Antilopay webhook: order already completed:', order_id);
        return NextResponse.json({ message: 'Already processed' }, { status: 200 });
      }

      // Проверяем наличие ключей
      const hasKeys = await productVariantService.checkAvailableKeys(
        order.variantId,
        order.quantity || 1
      );

      if (!hasKeys) {
        await prisma.order.update({
          where: { id: order_id },
          data: { status: 'failed', paymentStatus: 'failed' }
        });
        return NextResponse.json({ error: 'No available keys' }, { status: 400 });
      }

      // Получаем ключи
      const keys = await productVariantService.getKeysForOrder(
        order.variantId,
        order.quantity || 1
      );

      if (!keys || keys.length === 0) {
        await prisma.order.update({
          where: { id: order_id },
          data: { status: 'failed', paymentStatus: 'failed' }
        });
        return NextResponse.json({ error: 'Failed to get keys' }, { status: 500 });
      }

      // Обновляем статус заказа
      await prisma.order.update({
        where: { id: order_id },
        data: {
          status: 'completed',
          paymentStatus: 'completed',
          paidAt: new Date(),
          paymentData: {
            provider: 'antilopay',
            paymentId: payment_id,
            amount,
            completedAt: new Date().toISOString()
          }
        }
      });

      // Сохраняем ключи в user_purchases для авторизованных пользователей
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

      // Discord вебхук
      await sendDiscordWebhook(order);

      // Записываем доход
      try {
        await revenueService.recordRevenue(order.totalRub, 'RUB');
      } catch (revenueError) {
        console.error('Failed to record revenue:', revenueError);
      }

      // Получаем название продукта
      const ruTranslation = order.product?.translations?.find(t => t.language === 'ru');
      const productName = ruTranslation?.name || order.product?.translations?.[0]?.name || 'Unknown Product';

      // Отправляем email
      if (order.email) {
        try {
          const emailResult = await emailService.sendOrderCompletedEmail({
            email: order.email,
            orderId: order.id,
            productName,
            keys,
            totalAmount: order.totalRub,
            currency: 'RUB'
          });

          if (emailResult.success) {
            console.log('[ANTILOPAY] ✅ Email sent to:', order.email);
          } else {
            console.error('[ANTILOPAY] ❌ Email failed:', emailResult.error);
          }
        } catch (emailError) {
          console.error('[ANTILOPAY] ❌ Email exception:', emailError);
        }
      }

      // Лог
      const couponLog = order.couponCode ? `, Coupon=${order.couponCode} (${order.couponDiscount}%)` : '';
      await prisma.log.create({
        data: {
          user: order.email,
          timestamp: BigInt(Date.now()),
          description: `Antilopay оплата: ID=${order.id}, Product="${productName}", Price=₽${order.totalRub}, Status=completed, Email=${order.email}${couponLog}`
        }
      });

      console.log('Antilopay: order completed:', order_id);
      return NextResponse.json({ message: 'Payment processed successfully' }, { status: 200 });

    } catch (error) {
      console.error('Antilopay webhook processing error:', error);
      return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 });
    }

  } catch (error) {
    console.error('Antilopay webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Antilopay webhook endpoint is active',
    timestamp: new Date().toISOString()
  }, { status: 200 });
}
