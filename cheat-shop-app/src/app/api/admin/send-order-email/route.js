import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { prisma } from '@/lib/prisma';
import emailService from '@/lib/services/emailService';
import productVariantService from '@/lib/services/productVariantService';

export async function POST(request) {
  try {
    const adminAuth = await requireAdmin(request);
    if (!adminAuth.success) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ 
        success: false, 
        error: 'Order ID is required' 
      }, { status: 400 });
    }

    console.log('[MANUAL EMAIL] Looking up order:', orderId);
    
    // Find the order with all related data
    const order = await prisma.order.findUnique({
      where: { id: orderId },
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
      return NextResponse.json({
        success: false,
        error: 'Order not found'
      }, { status: 404 });
    }

    if (!order.email) {
      return NextResponse.json({
        success: false,
        error: 'No email address for this order'
      }, { status: 400 });
    }

    if (order.status !== 'completed') {
      return NextResponse.json({
        success: false,
        error: 'Order is not completed'
      }, { status: 400 });
    }

    console.log('[MANUAL EMAIL] Found order:', {
      id: order.id,
      email: order.email,
      status: order.status,
      productId: order.productId,
      variantId: order.variantId
    });

    // Get keys for this order
    const keys = await productVariantService.getKeysForOrder(
      order.variantId,
      order.quantity || 1
    );

    if (!keys || keys.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No keys available for this order'
      }, { status: 400 });
    }

    console.log('[MANUAL EMAIL] Found keys:', keys.length);

    // Get localized product name
    const ruTranslation = order.product?.translations?.find(t => t.language === 'ru');
    const enTranslation = order.product?.translations?.find(t => t.language === 'en');
    const productName = ruTranslation?.name || enTranslation?.name || order.product?.translations?.[0]?.name || 'Unknown Product';

    // Prepare email data
    const emailData = {
      email: order.email,
      orderId: order.id,
      productName: productName,
      keys: keys,
      totalAmount: order.totalUsd > 0 ? order.totalUsd : order.totalRub,
      currency: order.totalUsd > 0 ? 'USD' : 'RUB'
    };

    console.log('[MANUAL EMAIL] Sending email with data:', {
      email: emailData.email,
      orderId: emailData.orderId,
      productName: emailData.productName,
      keysCount: emailData.keys.length,
      totalAmount: emailData.totalAmount,
      currency: emailData.currency
    });

    // Send email
    const emailResult = await emailService.sendOrderCompletedEmail(emailData);
    
    if (emailResult.success) {
      console.log('[MANUAL EMAIL] ✅ Email sent successfully!');
      
      return NextResponse.json({
        success: true,
        message: `Email sent successfully to ${order.email}`,
        messageId: emailResult.messageId,
        orderDetails: {
          orderId: order.id,
          email: order.email,
          productName: productName,
          keysCount: keys.length
        }
      });
    } else {
      console.error('[MANUAL EMAIL] ❌ Failed to send email:', emailResult.error);
      
      return NextResponse.json({
        success: false,
        error: `Failed to send email: ${emailResult.error}`
      }, { status: 500 });
    }

  } catch (error) {
    console.error('[MANUAL EMAIL] ❌ Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}