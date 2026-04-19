import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verify2FAToken } from '@/lib/2fa';
import { requireAdmin } from '@/lib/adminAuth';

export async function POST(request) {
  try {
    const adminAuth = await requireAdmin(request);
    if (!adminAuth.success) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { adminId, token } = await request.json();

    // Check if requesting admin is owner or requesting for themselves
    if (!adminAuth.admin.owner && adminAuth.admin.id !== adminId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    // Get admin with 2FA secret
    const admin = await prisma.admin.findUnique({
      where: { id: adminId }
    });

    if (!admin || !admin.twoFaSecret) {
      return NextResponse.json({ success: false, error: 'Admin not found or 2FA not set up' }, { status: 404 });
    }

    // Verify token
    const isValid = verify2FAToken(admin.twoFaSecret, token);
    if (!isValid) {
      return NextResponse.json({ success: false, error: 'Invalid 2FA token' }, { status: 400 });
    }

    // Enable 2FA
    await prisma.admin.update({
      where: { id: adminId },
      data: {
        twoFaEnabled: true
      }
    });

    return NextResponse.json({
      success: true,
      message: '2FA enabled successfully'
    });

  } catch (error) {
    console.error('[2FA] Enable failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}