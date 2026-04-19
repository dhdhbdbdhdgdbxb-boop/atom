import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import emailService from '@/lib/services/emailService';

export async function POST(request) {
  const adminAuth = await requireAdmin(request);
  if (!adminAuth.success) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { email, orderDetails } = await request.json();

    if (!email || !orderDetails) {
      return NextResponse.json(
        { success: false, error: 'Email and order details are required' },
        { status: 400 }
      );
    }

    const result = await emailService.sendOrderCompletedEmail({ email, ...orderDetails });

    return NextResponse.json(
      { success: result.success, message: 'Order confirmation email sent successfully' },
      { status: result.success ? 200 : 500 }
    );
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to send order confirmation email' },
      { status: 500 }
    );
  }
}
