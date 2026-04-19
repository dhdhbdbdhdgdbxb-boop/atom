import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import productVariantService from '@/lib/services/productVariantService';
import revenueService from '@/lib/services/revenueService';
import { sendDiscordWebhook } from '@/lib/services/webhookService';
import emailService from '@/lib/services/emailService';

export async function POST(request) {
  try {
    const body = await request.json();
    
    console.log('=== CRYPTOCLOUD WEBHOOK RECEIVED ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Body:', JSON.stringify(body, null, 2));
    console.log('Headers:', Object.fromEntries(request.headers.entries()));
    console.log('====================================');

    const {
      status,
      invoice_id,
      amount_crypto,
      currency,
      order_id,
      token
    } = body;

    // Проверяем наличие обязательных полей
    if (!status || !order_id) {
      console.error('Missing required fields in webhook');
      console.error('status:', status);
      console.error('order_id:', order_id);
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Для тестового режима токен может отсутствовать
    if (!token) {
      console.warn('No token provided - possibly test mode');
    }

    console.log('Processing payment with status:', status, 'for order:', order_id);

    // Обрабатываем успешный платеж
    if (status === 'success' || status === 'paid') {
      try {
        // Находим заказ
        const order = await prisma.order.findUnique({
          where: { id: order_id },
          include: {
            product: {
              include: {
                translations: true
              }
            },
            variant: true
          }
        });

        if (!order) {
          console.error('Order not found:', order_id);
          return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Проверяем, не был ли заказ уже обработан
        if (order.status === 'completed') {
          console.log('[WEBHOOK] Order already completed:', order_id);
          console.log('[WEBHOOK] Checking if email needs to be sent...');
          
          // Even if order is completed, we should try to send email if it wasn't sent
          // This handles cases where webhook is called multiple times or email failed previously
          if (order.email) {
            try {
              // Get keys for email (they should still be available in user_purchases)
              const userPurchase = await prisma.userPurchase.findFirst({
                where: { orderId: order.id }
              });
              
              if (userPurchase && userPurchase.keys) {
                const keys = userPurchase.keys.split(', ');
                
                // Get product name
                const ruTranslation = order.product?.translations?.find(t => t.language === 'ru');
                const enTranslation = order.product?.translations?.find(t => t.language === 'en');
                const productName = ruTranslation?.name || enTranslation?.name || order.product?.translations?.[0]?.name || 'Unknown Product';
                
                const emailData = {
                  email: order.email,
                  orderId: order.id,
                  productName: productName,
                  keys: keys,
                  totalAmount: order.totalUsd > 0 ? order.totalUsd : order.totalRub,
                  currency: order.totalUsd > 0 ? 'USD' : 'RUB'
                };
                
                console.log('[WEBHOOK] Attempting to send email for completed order...');
                const emailResult = await emailService.sendOrderCompletedEmail(emailData);
                
                if (emailResult.success) {
                  console.log('[WEBHOOK] ✅ Email sent for completed order:', order.email);
                } else {
                  console.error('[WEBHOOK] ❌ Failed to send email for completed order:', emailResult.error);
                }
              } else {
                console.log('[WEBHOOK] No keys found in user_purchases for completed order');
              }
            } catch (emailError) {
              console.error('[WEBHOOK] Error sending email for completed order:', emailError);
            }
          }
          
          return NextResponse.json({ message: 'Order already processed' }, { status: 200 });
        }

        // Проверяем наличие ключей
        const hasKeys = await productVariantService.checkAvailableKeys(
          order.variantId,
          order.quantity || 1
        );

        if (!hasKeys) {
          console.error('No available keys for order:', order_id);
          // Обновляем заказ как неудачный
          await prisma.order.update({
            where: { id: order_id },
            data: {
              status: 'failed',
              paymentStatus: 'failed'
            }
          });
          return NextResponse.json({ error: 'No available keys' }, { status: 400 });
        }

        // Получаем ключи
        const keys = await productVariantService.getKeysForOrder(
          order.variantId,
          order.quantity || 1
        );

        if (!keys || keys.length === 0) {
          console.error('Failed to get keys for order:', order_id);
          // Обновляем заказ как неудачный
          await prisma.order.update({
            where: { id: order_id },
            data: {
              status: 'failed',
              paymentStatus: 'failed'
            }
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
            paymentData: JSON.stringify({
              provider: 'cryptocloud',
              invoiceId: invoice_id,
              amountCrypto: amount_crypto,
              currency: currency,
              completedAt: new Date().toISOString()
            })
          }
        });

        // Сохраняем ключи в таблицу user_purchases (только для авторизованных пользователей)
        if (order.userId) {
          await prisma.userPurchase.create({
            data: {
              orderId: order.id,
              userId: order.userId,
              productId: order.productId,
              variantId: order.variantId,
              price: order.totalUsd || order.totalRub,
              currency: order.totalUsd > 0 ? 'usd' : 'rub',
              keys: keys.join(', '),
              quantity: order.quantity || 1,
              instruction: order.variant?.instructions || '',
              couponCode: order.couponCode,
              couponDiscount: order.couponDiscount
            }
          });
          console.log('Keys added to user profile:', order.userId);
        }

        // Отправляем вебхук при успешной оплате
        await sendDiscordWebhook(order);

        // Записываем доход в статистику
        try {
          const revenueAmount = order.totalUsd > 0 ? order.totalUsd : order.totalRub;
          const revenueCurrency = order.totalUsd > 0 ? 'USD' : 'RUB';
          await revenueService.recordRevenue(revenueAmount, revenueCurrency);
        } catch (revenueError) {
          console.error('Failed to record revenue:', revenueError);
          // Не прерываем выполнение, если не удалось записать доход
        }

        // Определяем язык пользователя (по умолчанию русский)
        const userLanguage = 'ru'; // Можно добавить определение языка из заказа, если оно там есть

        // Получаем локализованное название продукта
        const ruTranslation = order.product?.translations?.find(t => t.language === 'ru');
        const enTranslation = order.product?.translations?.find(t => t.language === 'en');
        const productName = userLanguage === 'ru' 
          ? (ruTranslation?.name || order.product?.translations?.[0]?.name || 'Unknown Product')
          : (enTranslation?.name || order.product?.translations?.[0]?.name || 'Unknown Product');

        // Получаем локализованное название варианта
        const variantName = userLanguage === 'ru' 
          ? (order.variant?.daysLabelRu || order.variant?.name || 'Unknown Variant')
          : (order.variant?.daysLabelEn || order.variant?.name || 'Unknown Variant');

        // Отправляем email с ключами
        if (order.email) {
          try {
            console.log('[EMAIL] Preparing to send order completion email...');
            console.log('[EMAIL] Order details:', {
              orderId: order.id,
              email: order.email,
              productName: productName,
              keysCount: keys.length,
              totalUsd: order.totalUsd,
              totalRub: order.totalRub
            });

            const emailData = {
              email: order.email,
              orderId: order.id,
              productName: productName,
              keys: keys,
              totalAmount: order.totalUsd > 0 ? order.totalUsd : order.totalRub,
              currency: order.totalUsd > 0 ? 'USD' : 'RUB'
            };
            
            console.log('[EMAIL] Calling emailService.sendOrderCompletedEmail...');
            const emailResult = await emailService.sendOrderCompletedEmail(emailData);
            console.log('[EMAIL] Email service result:', emailResult);
            
            if (emailResult.success) {
              console.log('[EMAIL] ✅ Order completion email sent successfully to:', order.email);
              console.log('[EMAIL] Message ID:', emailResult.messageId);
            } else {
              console.error('[EMAIL] ❌ Failed to send email:', emailResult.error);
            }
          } catch (emailError) {
            console.error('[EMAIL] ❌ Exception while sending order completion email:', emailError);
          }
        } else {
          console.warn('[EMAIL] ⚠️ No email provided for order:', order_id);
        }

        // Логируем успешную оплату через CryptoCloud
        const couponLog = order.couponCode ? `, Coupon=${order.couponCode} (${order.couponDiscount}%)` : '';
        await prisma.log.create({
          data: {
            user: order.email,
            timestamp: BigInt(Date.now()),
            description: `CryptoCloud оплата: ID=${order.id}, Product="${productName}", Variant="${variantName}", Price=$${order.totalUsd}/₽${order.totalRub}, Status=completed, Email=${order.email}${couponLog}`
          }
        });

        console.log('Order completed successfully:', order_id);
        return NextResponse.json({ message: 'Payment processed successfully' }, { status: 200 });

      } catch (error) {
        console.error('Error processing payment:', error);
        return NextResponse.json({ error: 'Failed to process payment' }, { status: 500 });
      }
    }

    // Для других статусов просто логируем
    console.log('Payment status:', status, 'for order:', order_id);
    return NextResponse.json({ message: 'Webhook received' }, { status: 200 });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET handler для проверки webhook
export async function GET(request) {
  console.log('=== CRYPTOCLOUD WEBHOOK GET REQUEST ===');
  console.log('Timestamp:', new Date().toISOString());
  console.log('URL:', request.url);
  console.log('Headers:', Object.fromEntries(request.headers.entries()));
  console.log('=======================================');
  
  return NextResponse.json({ 
    message: 'CryptoCloud webhook endpoint is active',
    timestamp: new Date().toISOString()
  }, { status: 200 });
}
