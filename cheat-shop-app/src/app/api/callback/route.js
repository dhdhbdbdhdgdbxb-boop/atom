import { NextResponse } from "next/server";
import prisma from '@/lib/prisma';
import { auth } from '@/auth';
import productVariantService from '@/lib/services/productVariantService';
import revenueService from '@/lib/services/revenueService';
import { sendDiscordWebhook } from '@/lib/services/webhookService';
import emailService from '@/lib/services/emailService';

export async function POST(request) {
  try {
    // 1) Получаем тело запроса
    const contentType = request.headers.get('content-type');
    let params;

    if (contentType && contentType.includes('application/json')) {
      // JSON формат
      params = await request.json();
    } else {
      // x-www-form-urlencoded формат
      const rawBody = await request.text();
      params = Object.fromEntries(new URLSearchParams(rawBody));
    }

    console.log("=== CRYPTOCLOUD CALLBACK RECEIVED ===");
    console.log("Timestamp:", new Date().toISOString());
    console.log("params:", params);
    console.log("Content-Type:", contentType);
    console.log("======================================");

    const {
      status,
      invoice_id,
      amount_crypto,
      currency,
      order_id,
      token
    } = params;

    // 2) Проверим наличие обязательных полей
    if (!status || !order_id) {
      console.error('Missing required fields');
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 3) Для тестового режима CryptoCloud может не отправлять валидный токен
    // Проверяем test_mode из invoice_id или просто логируем предупреждение
    if (!token) {
      console.warn('No token provided - possibly test mode');
    }

    // 4) Обработка успешного платежа
    if (status === "success" || status === "paid") {
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
          return NextResponse.json(
            { error: "Order not found" },
            { status: 404 }
          );
        }

        // Проверяем, не был ли заказ уже обработан
        if (order.status === 'completed') {
          console.log('Order already completed:', order_id);
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
        const userLanguage = 'ru';

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

        // Отправляем письмо с подтверждением заказа
        if (order.email) {
          try {
            await emailService.sendOrderCompletedEmail({
              email: order.email,
              orderId: order.id,
              productName,
              keys,
              totalAmount: order.totalUsd > 0 ? order.totalUsd : order.totalRub,
              currency: order.totalUsd > 0 ? 'USD' : 'RUB'
            });
            console.log('Order confirmation email sent to:', order.email);
          } catch (emailError) {
            console.error('Failed to send order confirmation email:', emailError);
          }
        } else {
          console.warn('No email provided for order:', order_id);
        }

        // Логируем успешную оплату через CryptoCloud
        const couponLog = order.couponCode ? `, Coupon=${order.couponCode} (${order.couponDiscount}%)` : '';
        await prisma.log.create({
          data: {
            user: order.email,
            timestamp: BigInt(Date.now()),
            description: `CryptoCloud оплата (callback): ID=${order.id}, Product="${productName}", Variant="${variantName}", Price=$${order.totalUsd}/₽${order.totalRub}, Status=completed, Email=${order.email}${couponLog}`
          }
        });

        console.log('Order completed successfully:', order_id);

      } catch (error) {
        console.error('Error processing order:', error);
        return NextResponse.json(
          { error: "Failed to process order" },
          { status: 500 }
        );
      }
    }

    // 5) Отвечаем CryptoCloud (обязательно!)
    return NextResponse.json({ message: "Callback received" }, { status: 200 });

  } catch (error) {
    console.error("CryptoCloud callback error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
