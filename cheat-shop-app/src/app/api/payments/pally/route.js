import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('Pally payment request body:', JSON.stringify(body));

    const { orderId, amount, currency = 'RUB', productName, email } = body;

    if (!orderId || !amount || !email) {
      console.error('Pally missing fields:', { orderId: !!orderId, amount: !!amount, email: !!email });
      return NextResponse.json(
        { success: false, error: `Missing required fields: ${[!orderId && 'orderId', !amount && 'amount', !email && 'email'].filter(Boolean).join(', ')}` },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 });
    }

    const apiToken = process.env.PALLY_API_TOKEN;
    const shopId = process.env.PALLY_SHOP_ID;

    if (!apiToken || !shopId) {
      return NextResponse.json(
        { success: false, error: 'Pally not configured: missing PALLY_API_TOKEN or PALLY_SHOP_ID' },
        { status: 500 }
      );
    }

    const roundedAmount = Math.round(parseFloat(amount));
    console.log('Pally sending amount:', roundedAmount, 'currency:', currency.toUpperCase());

    // Отправляем как URLSearchParams (application/x-www-form-urlencoded)
    const params = new URLSearchParams();
    params.append('amount', String(roundedAmount));
    params.append('order_id', orderId);
    params.append('description', productName || 'Order');
    params.append('name', productName || 'Order');
    params.append('type', 'normal');
    params.append('shop_id', shopId);
    params.append('currency_in', currency.toUpperCase());
    params.append('payer_pays_commission', '1');
    params.append('custom', orderId);

    const response = await fetch('https://pal24.pro/api/v1/bill/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString(),
      signal: AbortSignal.timeout(10000)
    });

    const data = await response.json();
    console.log('Pally create payment response:', JSON.stringify(data, null, 2));

    if (data.success !== 'true' && data.success !== true) {
      throw new Error(data.message || data.error || `HTTP ${response.status}`);
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentData: {
          pally_bill_id: data.bill_id,
          pally_link_url: data.link_url
        }
      }
    });

    return NextResponse.json({
      success: true,
      paymentUrl: data.link_page_url,
      billId: data.bill_id
    });

  } catch (error) {
    console.error('Pally payment creation error:', error);
    const isTimeout = error.name === 'TimeoutError' || error?.cause?.code === 'UND_ERR_CONNECT_TIMEOUT';
    return NextResponse.json(
      { success: false, error: isTimeout ? 'Pally недоступен, попробуйте другой способ оплаты' : (error.message || 'Failed to create payment') },
      { status: 500 }
    );
  }
}
