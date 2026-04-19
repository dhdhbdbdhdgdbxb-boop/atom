import { NextResponse } from 'next/server';
import { createCryptocloudPayment, getCryptocloudConfig } from '@/lib/services/cryptocloudService';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const { amount, currency, orderId, email, description, type = 'order' } = await request.json();

    // Проверяем обязательные поля
    if (!amount || !currency || !email) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: amount, currency, email'
      }, { status: 400 });
    }

    // Проверяем, включен ли CryptoCloud
    const config = getCryptocloudConfig();
    if (!config.enabled) {
      return NextResponse.json({
        success: false,
        error: 'CryptoCloud payment method is disabled'
      }, { status: 400 });
    }

    let finalOrderId = orderId;
    let finalDescription = description;

    // Если это депозит, создаем временный заказ
    if (type === 'deposit') {
      // Создаем временную запись для депозита
      const depositRecord = await prisma.order.create({
        data: {
          id: `deposit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          productId: null,
          variantId: null,
          email: email,
          totalAmount: parseFloat(amount),
          currency: currency.toUpperCase(),
          status: 'pending',
          paymentMethod: 'cryptocloud',
          type: 'deposit',
          createdAt: new Date()
        }
      });
      
      finalOrderId = depositRecord.id;
      finalDescription = `Balance deposit: ${amount} ${currency.toUpperCase()}`;
    } else if (orderId) {
      // Проверяем существование заказа
      const existingOrder = await prisma.order.findUnique({
        where: { id: orderId }
      });

      if (!existingOrder) {
        return NextResponse.json({
          success: false,
          error: 'Order not found'
        }, { status: 404 });
      }

      // Проверяем, что заказ еще не оплачен
      if (existingOrder.status === 'completed') {
        return NextResponse.json({
          success: false,
          error: 'Order already completed'
        }, { status: 400 });
      }

      // Обновляем метод оплаты заказа только если он еще не установлен
      if (existingOrder.paymentMethod !== 'cryptocloud') {
        await prisma.order.update({
          where: { id: orderId },
          data: {
            paymentMethod: 'cryptocloud'
          }
        });
      }

      finalDescription = `Order payment: ${existingOrder.id}`;
    }

    // Создаем платеж через CryptoCloud
    const paymentResult = await createCryptocloudPayment({
      amount,
      currency,
      orderId: finalOrderId,
      email,
      description: finalDescription
    });

    // Сохраняем информацию о платеже
    if (finalOrderId) {
      await prisma.order.update({
        where: { id: finalOrderId },
        data: {
          paymentData: JSON.stringify({
            provider: 'cryptocloud',
            invoiceId: paymentResult.invoiceId,
            paymentUrl: paymentResult.paymentUrl,
            createdAt: new Date().toISOString()
          })
        }
      });
    }

    return NextResponse.json({
      success: true,
      paymentUrl: paymentResult.paymentUrl,
      invoiceId: paymentResult.invoiceId,
      orderId: finalOrderId
    });

  } catch (error) {
    console.error('CryptoCloud payment creation error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create payment'
    }, { status: 500 });
  }
}