import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import emailService from '@/lib/services/emailService';

export async function POST(request) {
  try {
    const adminAuth = await requireAdmin(request);
    if (!adminAuth.success) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { testEmail } = await request.json();

    if (!testEmail) {
      return NextResponse.json({ 
        success: false, 
        error: 'Test email address is required' 
      }, { status: 400 });
    }

    // Test SMTP connection first
    const connectionTest = await emailService.testConnection();
    if (!connectionTest.success) {
      return NextResponse.json({
        success: false,
        error: `SMTP connection failed: ${connectionTest.error}`
      }, { status: 500 });
    }

    // Send test email
    const testOrderData = {
      email: testEmail,
      orderId: 'TEST-' + Date.now(),
      productName: 'Test Product - CS2 Cheat',
      keys: ['TEST-KEY-123456', 'TEST-KEY-789012'],
      totalAmount: 29.99,
      currency: 'USD'
    };

    const result = await emailService.sendOrderCompletedEmail(testOrderData);

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `Test email sent successfully to ${testEmail}`,
        messageId: result.messageId
      });
    } else {
      return NextResponse.json({
        success: false,
        error: `Failed to send test email: ${result.error}`
      }, { status: 500 });
    }

  } catch (error) {
    console.error('[EMAIL TEST] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const adminAuth = await requireAdmin(request);
    if (!adminAuth.success) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Test SMTP connection
    const result = await emailService.testConnection();
    
    return NextResponse.json({
      success: result.success,
      message: result.success ? 'SMTP connection successful' : `SMTP connection failed: ${result.error}`,
      config: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === 'true',
        user: process.env.SMTP_USER,
        from: process.env.SMTP_FROM
      }
    });

  } catch (error) {
    console.error('[EMAIL TEST] Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}