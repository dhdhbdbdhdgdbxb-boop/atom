import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verify2FAToken } from '@/lib/2fa';

export async function POST(request) {
  try {
    const { adminId, token } = await request.json();

    // Get admin with 2FA secret
    const admin = await prisma.admin.findUnique({
      where: { id: adminId }
    });

    if (!admin || !admin.twoFaSecret || !admin.twoFaEnabled) {
      return NextResponse.json({ success: false, error: 'Admin not found or 2FA not enabled' }, { status: 404 });
    }

    // Verify token
    const isValid = verify2FAToken(admin.twoFaSecret, token);

    return NextResponse.json({
      success: true,
      valid: isValid
    });

  } catch (error) {
    console.error('[2FA] Verify failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}