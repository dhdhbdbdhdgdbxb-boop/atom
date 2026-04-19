import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth.js';
import couponService from '@/lib/services/couponService';

// GET /api/admin/coupons - Get all coupons (admin only)
export async function GET(request) {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const coupons = await couponService.getAllCoupons();

    return NextResponse.json({
      success: true,
      coupons
    });

  } catch (error) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch coupons', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/admin/coupons - Create a new coupon (admin only)
export async function POST(request) {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const requestBody = await request.json();
    const { code, discount, expiresAt, maxUses, productIds } = requestBody;

    // Проверяем обязательные поля
    if (!code || !discount || !expiresAt) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const coupon = await couponService.createCoupon({
      code,
      discount,
      expiresAt,
      maxUses,
      productIds
    });

    return NextResponse.json(
      { success: true, coupon },
      { status: 201 }
    );

  } catch (error) {
    console.error('Error creating coupon:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create coupon', details: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/admin/coupons/[id] - Update a coupon (admin only)
export async function PUT(request) {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const requestBody = await request.json();
    const { id, code, discount, expiresAt, maxUses, productIds } = requestBody;

    // Проверяем обязательные поля
    if (!id || !code || !discount || !expiresAt) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const coupon = await couponService.updateCoupon(id, {
      code,
      discount,
      expiresAt,
      maxUses,
      productIds
    });

    return NextResponse.json(
      { success: true, coupon },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error updating coupon:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update coupon', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/coupons/[id] - Delete a coupon (admin only)
export async function DELETE(request) {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    // Получаем ID из параметров запроса
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Проверяем обязательные поля
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Coupon ID is required' },
        { status: 400 }
      );
    }

    const coupon = await couponService.deleteCoupon(parseInt(id));

    return NextResponse.json(
      { success: true, coupon },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error deleting coupon:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete coupon', details: error.message },
      { status: 500 }
    );
  }
}