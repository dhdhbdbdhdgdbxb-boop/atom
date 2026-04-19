#!/usr/bin/env node

import { config } from 'dotenv';
import { PrismaClient } from '@prisma/client';
import emailService from '../src/lib/services/emailService.js';
import productVariantService from '../src/lib/services/productVariantService.js';

// Load environment variables
config();

const prisma = new PrismaClient();

async function sendOrderEmail(orderId) {
  try {
    console.log('Looking up order:', orderId);
    
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
      console.error('Order not found:', orderId);
      return;
    }

    console.log('Found order:', {
      id: order.id,
      email: order.email,
      status: order.status,
      productId: order.productId,
      variantId: order.variantId
    });

    if (!order.email) {
      console.error('No email address for order:', orderId);
      return;
    }

    // Get keys for this order
    console.log('Getting keys for variant:', order.variantId, 'quantity:', order.quantity || 1);
    const keys = await productVariantService.getKeysForOrder(
      order.variantId,
      order.quantity || 1
    );

    if (!keys || keys.length === 0) {
      console.error('No keys available for order:', orderId);
      return;
    }

    console.log('Found keys:', keys.length);

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

    console.log('Sending email with data:', {
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
      console.log('✅ Email sent successfully!');
      console.log('Message ID:', emailResult.messageId);
    } else {
      console.error('❌ Failed to send email:', emailResult.error);
    }

  } catch (error) {
    console.error('❌ Error sending order email:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Get order ID from command line argument
const orderId = process.argv[2];
if (!orderId) {
  console.error('Usage: node scripts/send-order-email.js <order-id>');
  process.exit(1);
}

sendOrderEmail(orderId);