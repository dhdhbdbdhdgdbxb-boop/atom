import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { requireAdmin } from '@/lib/adminAuth.js';
import { sendDiscordWebhook } from '@/lib/services/webhookService';
import emailService from '@/lib/services/emailService';
import { auth } from '@/auth';
import productVariantService from '@/lib/services/productVariantService';
import revenueService from '@/lib/services/revenueService';
import paymentFeeService from '@/lib/services/paymentFeeService';

// GET /api/orders - Get all orders (admin only)
export async function GET(request) {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const orders = await prisma.order.findMany({
      orderBy: [
        { createdAt: 'desc' }
      ],
      include: {
        product: {
          include: {
            translations: true
          }
        },
        variant: true
      }
    });

    // Форматируем заказы с названиями продуктов и вариантов
    const formattedOrders = orders.map(order => {
      // Получаем русское название продукта
      const ruTranslation = order.product?.translations?.find(t => t.language === 'ru');
      const productName = ruTranslation ? ruTranslation.name : order.product?.translations?.[0]?.name || 'Unknown Product';
      
      // Получаем название варианта
      const variantName = order.variant?.name || 'Unknown Variant';
      
      return {
        ...order,
        productName,
        variantName
      };
    });

    return NextResponse.json({
      success: true,
      orders: formattedOrders
    });

  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch orders', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/orders - Create a new order
// Новая версия с поддержкой резервирования ключей
export async function POST(request) {
  try {
    // Читаем тело запроса один раз и сохраняем
    const requestBody = await request.json();
    
    console.log('=== ORDER CREATION DEBUG ===');
    console.log('Request body received:', JSON.stringify(requestBody, null, 2));
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));
    
    const { productId, variantId, email, referralCode, paymentMethod, userId, currency, orderId: existingOrderId, quantity = 1, language, couponCode } = requestBody;

    console.log('Extracted values:', {
      productId,
      variantId,
      email,
      paymentMethod,
      userId,
      currency,
      quantity,
      language,
      couponCode
    });

    // КРИТИЧЕСКАЯ ПРОВЕРКА БЕЗОПАСНОСТИ: Блокируем оплату с баланса для неавторизованных пользователей
    // Получаем данные пользователя из сессии сразу для проверок безопасности
    let sessionUserId = null;
    try {
      const session = await auth();
      if (session?.user?.id) {
        sessionUserId = parseInt(session.user.id);
      }
    } catch (error) {
      console.log('Session check failed:', error);
    }
    
    const isBalancePayment = paymentMethod === 'balance' || paymentMethod === 'balanceRub' || paymentMethod === 'balanceUsd';
    
    if (isBalancePayment) {
      console.log('=== BALANCE PAYMENT SECURITY CHECK ===');
      console.log('paymentMethod is balance, checking authorization...');
      console.log('sessionUserId:', sessionUserId);
      console.log('userId from request:', userId);
      
      if (!sessionUserId) {
        console.log('SECURITY VIOLATION: Attempt to use balance payment without authentication');
        console.log('IP Address:', ipAddress);
        console.log('Email:', email);
        console.log('User Agent:', request.headers.get('user-agent'));
        
        return NextResponse.json(
          { success: false, error: 'Authentication required for balance payment' },
          { status: 401 }
        );
      }
      
      if (userId && parseInt(userId) !== sessionUserId) {
        console.log('SECURITY VIOLATION: userId mismatch - session:', sessionUserId, 'request:', userId);
        console.log('IP Address:', ipAddress);
        console.log('Email:', email);
        console.log('User Agent:', request.headers.get('user-agent'));
        
        return NextResponse.json(
          { success: false, error: 'User ID mismatch - unauthorized balance access attempt' },
          { status: 403 }
        );
      }
    }

    // Получаем IP-адрес из заголовков
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || request.ip || 'unknown';

    // Проверяем обязательные поля
    if (!productId || !variantId || !paymentMethod) {
      console.log('=== MISSING REQUIRED FIELDS ===');
      console.log('productId:', productId, 'type:', typeof productId);
      console.log('variantId:', variantId, 'type:', typeof variantId);
      console.log('email:', email, 'type:', typeof email);
      console.log('paymentMethod:', paymentMethod, 'type:', typeof paymentMethod);
      
      return NextResponse.json(
        { success: false, error: 'Missing required fields', details: { productId: !!productId, variantId: !!variantId, email: !!email, paymentMethod: !!paymentMethod } },
        { status: 400 }
      );
    }

    // Для неавторизованных пользователей генерируем временный email если он не указан
    let orderEmail = email;
    if (!orderEmail || orderEmail === '') {
      orderEmail = `guest_${Date.now()}@temp.atomcheats.com`;
    }

    // Получаем информацию о продукте и варианте
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) },
      include: {
        translations: true,
        variants: true
      }
    });

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    const variant = product.variants.find(v => v.id === parseInt(variantId));
    if (!variant) {
      return NextResponse.json(
        { success: false, error: 'Variant not found' },
        { status: 404 }
      );
    }

    // Обработка оплаты с баланса
    let orderUserId = null;
    let paymentCurrency = null;
    
    // Если пользователь авторизован, используем его ID
    if (sessionUserId) {
      orderUserId = sessionUserId;
    }

    // Переменная isBalancePayment уже определена выше на строке 104

    if (isBalancePayment && userId) {
      // КРИТИЧЕСКИ ВАЖНО: Проверяем, что пользователь авторизован и userId соответствует сессии
      if (!sessionUserId || parseInt(userId) !== sessionUserId) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized: Cannot use balance payment without proper authentication' },
          { status: 401 }
        );
      }

      // Получаем пользователя для проверки баланса
      const user = await prisma.user.findUnique({
        where: { id: parseInt(userId) }
      });
   
      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }
   
      // Определяем валюту для списания в зависимости от метода оплаты
      if (paymentMethod === 'balanceRub') {
        paymentCurrency = 'rub';
      } else if (paymentMethod === 'balanceUsd') {
        paymentCurrency = 'usd';
      } else {
        // Для старого метода 'balance' используем переданную валюту или USD по умолчанию
        paymentCurrency = currency || 'usd';
      }
   
      // Проверяем баланс с учетом скидки
      let requiredAmount = (paymentCurrency === 'usd' ? variant.priceUsd : variant.priceRub) * quantity;
      let couponDiscount = 0;
       
      // Применяем скидку от купона, если он указан
      if (couponCode) {
        const couponService = require('@/lib/services/couponService').default;
        const validationResult = await couponService.validateCoupon(couponCode, parseInt(productId));
         
        if (validationResult.valid) {
          couponDiscount = validationResult.coupon.discount;
          const discountAmount = (requiredAmount * couponDiscount) / 100;
          requiredAmount = requiredAmount - discountAmount;
        }
      }
      
      const userBalance = paymentCurrency === 'usd' ? user.balanceUsd : user.balanceRub;
   
      if (userBalance < requiredAmount) {
        return NextResponse.json(
          { success: false, error: 'Insufficient balance' },
          { status: 400 }
        );
      }
   
      orderUserId = user.id;
    }

    // Получаем русское название продукта
    const ruTranslation = product.translations.find(t => t.language === 'ru');
    const productName = ruTranslation ? ruTranslation.name : product.translations[0]?.name || 'Unknown Product';

    let order;
    let isNewOrder = false;
    let finalPriceUsd = 0;
    let finalPriceRub = 0;
    let couponDiscount = 0;
    
    // Если передан orderId и оплата с баланса, обновляем существующий заказ
    if (existingOrderId && isBalancePayment) {
      // Применяем купон, если он указан
      let appliedCouponDiscount = 0;
      if (couponCode) {
        const couponService = require('@/lib/services/couponService').default;
        const validationResult = await couponService.validateCoupon(couponCode, parseInt(productId));
        
        if (validationResult.valid) {
          appliedCouponDiscount = validationResult.coupon.discount;
        }
      }
      
      // Рассчитываем итоговые суммы с учетом скидки
      const basePriceUsd = variant.priceUsd * quantity;
      const basePriceRub = variant.priceRub * quantity;
      const discountAmountUsd = (basePriceUsd * appliedCouponDiscount) / 100;
      const discountAmountRub = (basePriceRub * appliedCouponDiscount) / 100;
      finalPriceUsd = basePriceUsd - discountAmountUsd;
      finalPriceRub = basePriceRub - discountAmountRub;
      
      // Убедимся, что итоговая сумма не отрицательная
      finalPriceUsd = Math.max(0, finalPriceUsd);
      finalPriceRub = Math.max(0, finalPriceRub);
      
      order = await prisma.order.update({
        where: { id: existingOrderId },
        data: {
          status: 'completed',
          paymentStatus: 'completed',
          paymentMethod,
          userId: orderUserId,
          email: orderEmail,
          couponCode,
          couponDiscount: appliedCouponDiscount,
          totalUsd: finalPriceUsd,
          totalRub: finalPriceRub,
          quantity: quantity
        }
      });
      
      // Увеличиваем счетчик использования купона, если он был применен
      if (couponCode && appliedCouponDiscount > 0) {
        const couponService = require('@/lib/services/couponService').default;
        await couponService.incrementCouponUsage(couponCode);
      }
    } else {
      // Иначе создаем новый заказ
      const orderId = uuidv4();
      console.log('=== CREATING NEW ORDER ===');
      console.log('Generated Order ID:', orderId);
      console.log('Order ID type:', typeof orderId);
      console.log('Order ID length:', orderId.length);
      
      // Применяем купон, если он указан
      if (couponCode) {
        const couponService = require('@/lib/services/couponService').default;
        const validationResult = await couponService.validateCoupon(couponCode, parseInt(productId));
        
        if (validationResult.valid) {
          couponDiscount = validationResult.coupon.discount;
          
          // Увеличиваем счетчик использования купона
          await couponService.incrementCouponUsage(couponCode);
        }
      }
    
      // Рассчитываем итоговые суммы с учетом скидки
      const basePriceUsd = variant.priceUsd * quantity;
      const basePriceRub = variant.priceRub * quantity;
      const discountAmountUsd = (basePriceUsd * couponDiscount) / 100;
      const discountAmountRub = (basePriceRub * couponDiscount) / 100;
      finalPriceUsd = basePriceUsd - discountAmountUsd;
      finalPriceRub = basePriceRub - discountAmountRub;
      
      // Убедимся, что итоговая сумма не отрицательная
      finalPriceUsd = Math.max(0, finalPriceUsd);
      finalPriceRub = Math.max(0, finalPriceRub);
    
      console.log('Creating order with data:', {
        id: orderId,
        productId: parseInt(productId),
        variantId: parseInt(variantId),
        userId: orderUserId,
        email,
        paymentMethod,
        totalUsd: finalPriceUsd,
        totalRub: finalPriceRub
      });

      order = await prisma.order.create({
        data: {
          id: orderId,
          productId: parseInt(productId),
          variantId: parseInt(variantId),
          userId: orderUserId,
          email: orderEmail,
          referralCode,
          paymentMethod,
          couponCode,
          couponDiscount,
          totalUsd: finalPriceUsd,
          totalRub: finalPriceRub,
          quantity: quantity,
          status: isBalancePayment ? 'completed' : 'pending',
          paymentStatus: isBalancePayment ? 'completed' : 'pending'
        }
      });
      
      console.log('Order created successfully:', {
        id: order.id,
        status: order.status,
        createdAt: order.createdAt
      });
      
      isNewOrder = true;
    }

    // Если оплата с баланса и заказ завершен, получаем ключи и сохраняем их
    if (isBalancePayment && order.status === 'completed') {
      // Проверяем наличие ключей
      const hasKeys = await productVariantService.checkAvailableKeys(
        parseInt(variantId),
        quantity
      );

      if (!hasKeys) {
        // Если нет ключей, отменяем заказ
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'failed',
            paymentStatus: 'failed'
          }
        });

        return NextResponse.json(
          { success: false, error: 'No available keys' },
          { status: 400 }
        );
      }

      // Получаем ключи
      const keys = await productVariantService.getKeysForOrder(
        parseInt(variantId),
        quantity
      );

      if (!keys || keys.length === 0) {
        // Если не удалось получить ключи, отменяем заказ
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'failed',
            paymentStatus: 'failed'
          }
        });

        return NextResponse.json(
          { success: false, error: 'No available keys' },
          { status: 400 }
        );
      }


      // Списываем средства с баланса только если сумма больше нуля и пользователь авторизован
      const amountToDeduct = (paymentCurrency === 'usd' ? finalPriceUsd : finalPriceRub);
       
      if (amountToDeduct > 0 && orderUserId) {
        await prisma.user.update({
          where: { id: orderUserId },
          data: {
            balanceUsd: paymentCurrency === 'usd' ? { decrement: amountToDeduct } : undefined,
            balanceRub: paymentCurrency === 'rub' ? { decrement: amountToDeduct } : undefined
          }
        });
      }
      
      // Увеличиваем счетчик использования купона, если он был применен
      if (couponCode && couponDiscount > 0) {
        const couponService = require('@/lib/services/couponService').default;
        await couponService.incrementCouponUsage(couponCode);
      }

      // Сохраняем ключи в таблицу user_purchases (только для авторизованных пользователей)
      if (orderUserId) {
        await prisma.userPurchase.create({
          data: {
            orderId: order.id,
            userId: orderUserId,
            productId: parseInt(productId),
            variantId: parseInt(variantId),
            price: paymentCurrency === 'usd' ? finalPriceUsd : finalPriceRub,
            currency: paymentCurrency,
            keys: keys.join(', '),
            quantity: quantity,
            instruction: variant?.instructions || '',
            couponCode: order.couponCode,
            couponDiscount: order.couponDiscount
          }
        });
      }

      // Отправляем вебхук при успешной оплате с баланса
      await sendDiscordWebhook(order);
      
      // Записываем доход в статистику
      try {
        await revenueService.recordRevenue(
          paymentCurrency === 'usd' ? finalPriceUsd : finalPriceRub,
          paymentCurrency.toUpperCase()
        );
      } catch (revenueError) {
        console.error('Failed to record revenue:', revenueError);
        // Не прерываем выполнение, если не удалось записать доход
      }
      
      // Определяем язык пользователя
      const userLanguage = language || 'ru';
      
      // Получаем локализованное название продукта
      const localizedTranslation = product.translations.find(t => t.language === userLanguage);
      const localizedProductName = localizedTranslation ? localizedTranslation.name : productName;
      
      // Получаем локализованное название варианта
      const localizedVariantName = userLanguage === 'ru' ? variant.daysLabelRu : variant.daysLabelEn;
      
      // Отправляем письмо с подтверждением заказа
      try {
        console.log('[BALANCE ORDER EMAIL] Preparing to send order completion email...');
        console.log('[BALANCE ORDER EMAIL] Order details:', {
          orderId: order.id,
          email: orderEmail,
          productName: localizedProductName,
          keysCount: keys.length,
          totalUsd: order.totalUsd,
          totalRub: order.totalRub
        });

        const emailData = {
          email: orderEmail,
          orderId: order.id,
          productName: localizedProductName,
          keys: keys,
          totalAmount: order.totalUsd > 0 ? order.totalUsd : order.totalRub,
          currency: order.totalUsd > 0 ? 'USD' : 'RUB'
        };
        
        console.log('[BALANCE ORDER EMAIL] Calling emailService.sendOrderCompletedEmail...');
        const emailResult = await emailService.sendOrderCompletedEmail(emailData);
        console.log('[BALANCE ORDER EMAIL] Email service result:', emailResult);
        
        if (emailResult.success) {
          console.log('[BALANCE ORDER EMAIL] ✅ Order completion email sent successfully to:', orderEmail);
          console.log('[BALANCE ORDER EMAIL] Message ID:', emailResult.messageId);
        } else {
          console.error('[BALANCE ORDER EMAIL] ❌ Failed to send email:', emailResult.error);
        }
      } catch (emailError) {
        console.error('[BALANCE ORDER EMAIL] ❌ Exception while sending order confirmation email:', emailError);
      }
    }
    // Если оплата не с баланса, проверяем наличие ключей, но не выдаем их
    else if (!isBalancePayment && isNewOrder) {
      // Проверяем наличие ключей
      const hasKeys = await productVariantService.checkAvailableKeys(
        parseInt(variantId),
        quantity
      );

      if (!hasKeys) {
        // Если нет ключей, отменяем заказ
        await prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'failed',
            paymentStatus: 'failed'
          }
        });

        return NextResponse.json(
          { success: false, error: 'No available keys' },
          { status: 400 }
        );
      }
    }

    // Логируем создание или обновление заказа с необходимой информацией
    const currencyLog = paymentCurrency ? ` (${paymentCurrency.toUpperCase()})` : '';
    const actionType = existingOrderId ? 'Обновление' : 'Создание';
    const couponLog = couponCode ? `, Coupon=${couponCode} (${couponDiscount}%)` : '';
    await prisma.log.create({
      data: {
        user: orderEmail,
        timestamp: BigInt(Date.now()),
        description: `${actionType} заказа: ID=${order.id}, Product="${productName}", Variant="${variant.name}", Price=$${order.totalUsd}/₽${order.totalRub}${currencyLog}, Payment=${paymentMethod}, Status=${order.status}, IP=${ipAddress}, Email=${orderEmail}${couponLog}`
      }
    });

    return NextResponse.json(
      { success: true, order },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create order', details: error.message },
      { status: 500 }
    );
  }
}