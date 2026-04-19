#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';
import { generate2FASecret, generateQRCode } from '../src/lib/2fa.js';
import QRCode from 'qrcode';

const prisma = new PrismaClient();

async function setupOwner2FA() {
  try {
    console.log('🔐 Setting up 2FA for owner account...\n');

    // Find owner admin
    const owner = await prisma.admin.findFirst({
      where: { owner: true }
    });

    if (!owner) {
      console.error('❌ Owner account not found!');
      process.exit(1);
    }

    console.log(`👑 Found owner: ${owner.login}`);

    // Generate 2FA secret
    const { secret, otpauthUrl } = generate2FASecret(owner.login);

    // Update owner with 2FA
    await prisma.admin.update({
      where: { id: owner.id },
      data: {
        twoFaSecret: secret,
        twoFaEnabled: true
      }
    });

    console.log('\n📱 2FA Setup Complete!');
    console.log('=' .repeat(50));
    console.log(`🔑 Secret Key: ${secret}`);
    console.log(`🔗 Auth URL: ${otpauthUrl}`);
    console.log('=' .repeat(50));

    // Generate QR code for console
    try {
      const qrString = await QRCode.toString(otpauthUrl, { 
        type: 'terminal',
        small: true 
      });
      console.log('\n📊 QR Code:');
      console.log(qrString);
    } catch (qrError) {
      console.log('\n⚠️  Could not generate terminal QR code');
      console.log('Use the secret key above to manually add to your authenticator app');
    }

    console.log('\n📋 Instructions:');
    console.log('1. Open Google Authenticator or similar TOTP app');
    console.log('2. Scan the QR code above OR manually enter the secret key');
    console.log('3. The app will generate 6-digit codes every 30 seconds');
    console.log('4. Use these codes when logging into admin panel');
    console.log('\n✅ Owner 2FA has been enabled successfully!');

  } catch (error) {
    console.error('❌ Error setting up owner 2FA:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
setupOwner2FA();