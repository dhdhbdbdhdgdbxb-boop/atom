import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const { orderId, amountUsd, email, productName } = await request.json();

    if (!orderId || !amountUsd || !email) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: orderId, amountUsd, email' },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Stripe принимает сумму в центах (целое число)
    const amountInCents = Math.round(parseFloat(amountUsd) * 100);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      description: productName || 'Order',
      receipt_email: email,
      metadata: {
        orderId,
        email
      }
    });

    // Сохраняем paymentIntent id в заказе
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentData: {
          stripe_payment_intent_id: paymentIntent.id
        }
      }
    });

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });

  } catch (error) {
    console.error('Stripe payment creation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create payment' },
      { status: 500 }
    );
  }
}
