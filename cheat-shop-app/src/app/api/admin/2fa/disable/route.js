import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
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

    // Disable 2FA
    await prisma.admin.update({
      where: { id: adminId },
      data: {
        twoFaEnabled: false,
        twoFaSecret: null
      }
    });

    return NextResponse.json({
      success: true,
      message: '2FA disabled successfully'
    });

  } catch (error) {
    console.error('[2FA] Disable failed:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}