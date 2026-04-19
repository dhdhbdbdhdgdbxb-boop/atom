import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { createAntilopayPayment } from '@/lib/services/antilopayService';

export async function POST(request) {
  try {
    const { orderId, amount, productName, email, successUrl, failUrl } = await request.json();

    if (!orderId || !amount || !email) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: orderId, amount, email' },
        { status: 400 }
      );
    }

    // Проверяем существование заказа
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    const result = await createAntilopayPayment({
      orderId,
      amount,
      productName: productName || 'Товар',
      email,
      successUrl,
      failUrl
    });

    // Сохраняем payment_id в заказе
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentData: {
          antilopay_payment_id: result.paymentId
        }
      }
    });

    return NextResponse.json({
      success: true,
      paymentId: result.paymentId,
      paymentUrl: result.paymentUrl
    });

  } catch (error) {
    console.error('Antilopay payment creation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create payment' },
      { status: 500 }
    );
  }
}
