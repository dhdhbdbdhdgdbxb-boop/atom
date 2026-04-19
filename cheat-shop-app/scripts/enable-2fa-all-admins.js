#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';
import { generate2FASecret } from '../src/lib/2fa.js';

const prisma = new PrismaClient();

async function enableTwoFAForAllAdmins() {
  try {
    console.log('🔐 Enabling 2FA for all existing admins...\n');

    // Find all admins without 2FA
    const admins = await prisma.admin.findMany({
      where: {
        OR: [
          { twoFaEnabled: false },
          { twoFaSecret: null }
        ]
      }
    });

    if (admins.length === 0) {
      console.log('✅ All admins already have 2FA enabled!');
      return;
    }

    console.log(`Found ${admins.length} admin(s) without 2FA:`);
    
    for (const admin of admins) {
      console.log(`\n👤 Processing admin: ${admin.login} ${admin.owner ? '(Owner)' : ''}`);
      
      // Generate 2FA secret if not exists
      let secret = admin.twoFaSecret;
      if (!secret) {
        const { secret: newSecret } = generate2FASecret(admin.login);
        secret = newSecret;
        console.log(`  🔑 Generated new secret`);
      } else {
        console.log(`  🔑 Using existing secret`);
      }

      // Update admin with 2FA enabled
      await prisma.admin.update({
        where: { id: admin.id },
        data: {
          twoFaSecret: secret,
          twoFaEnabled: true
        }
      });

      console.log(`  ✅ 2FA enabled for ${admin.login}`);
    }

    console.log('\n🎉 2FA has been enabled for all admins!');
    console.log('\n📋 Next steps:');
    console.log('1. Go to admin panel /admin/dashboard?tab=admins');
    console.log('2. Click the Shield icon next to each admin');
    console.log('3. Share the QR code with each admin to set up their authenticator app');

  } catch (error) {
    console.error('❌ Error enabling 2FA for admins:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
enableTwoFAForAllAdmins();