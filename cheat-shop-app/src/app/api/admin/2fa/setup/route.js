import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generate2FASecret, generateQRCode } from '@/lib/2fa';
import { requireAdmin } from '@/lib/adminAuth';

export async function POST(request) {
  try {
    const adminAuth = await requireAdmin(request);
    if (!adminAuth.success) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { adminId } = await request.json();

    // Check if requesting admin is owner or requesting for themselves
    if (!adminAuth.admin.owner && adminAuth.admin.id !== adminId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Get admin details
    const admin = await prisma.admin.findUnique({
      where: { id: adminId }
    });

    if (!admin) {
      return NextResponse.json({ success: false, error: 'Admin not found' }, { status: 404 });
    }

    // Generate 2FA secret
    const { secret, otpauthUrl } = generate2FASecret(admin.login);
    
    // Generate QR code
    const qrCode = await generateQRCode(otpauthUrl);

    // Store secret in database (not enabled yet)
    await prisma.admin.update({
      where: { id: adminId },
      data: {
        twoFaSecret: secret,
        twoFaEnabled: false
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        secret,
        qrCode,
        manualEntryKey: secret
      }
    });

  } catch (error) {
    console.error('[2FA] Setup failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}