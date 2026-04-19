import { NextResponse } from 'next/server';
import { validateCoupon } from '@/lib/services/couponService';

export async function POST(request) {
  try {
    const { code, productId } = await request.json();
    
    if (!code || !productId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await validateCoupon(code, productId);
  
    if (!result.valid) {
      return NextResponse.json(
        { valid: false, error: result.error },
        { status: 404 }
      );
    }
  
    return NextResponse.json(
      { valid: true, coupon: result.coupon },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error validating coupon:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}