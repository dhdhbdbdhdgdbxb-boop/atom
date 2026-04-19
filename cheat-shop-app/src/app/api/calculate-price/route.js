import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import paymentFeeService from '@/lib/services/paymentFeeService';

// POST /api/calculate-price - Рассчитать цену с комиссией
export async function POST(request) {
  try {
    const { productId, variantId, paymentMethod, quantity = 1, couponCode } = await request.json();

    if (!productId || !variantId || !paymentMethod) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Получаем информацию о продукте и варианте
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) },
      include: {
        variants: {
          where: { id: parseInt(variantId) }
        }
      }
    });

    if (!product || !product.variants.length) {
      return NextResponse.json(
        { success: false, error: 'Product or variant not found' },
        { status: 404 }
      );
    }

    const variant = product.variants[0];
    
    // Базовые цены с учетом количества
    let baseAmountUsd = parseFloat(variant.priceUsd) * quantity;
    let baseAmountRub = parseFloat(variant.priceRub) * quantity;

    // Применяем скидку от купона, если указан
    let couponDiscount = 0;
    if (couponCode) {
      try {
        const couponService = require('@/lib/services/couponService').default;
        const validationResult = await couponService.validateCoupon(couponCode, parseInt(productId));
        
        if (validationResult.valid) {
          couponDiscount = validationResult.coupon.discount;
          const discountAmountUsd = (baseAmountUsd * couponDiscount) / 100;
          const discountAmountRub = (baseAmountRub * couponDiscount) / 100;
          
          baseAmountUsd = baseAmountUsd - discountAmountUsd;
          baseAmountRub = baseAmountRub - discountAmountRub;
        }
      } catch (couponError) {
        console.error('Error validating coupon:', couponError);
        // Продолжаем без купона в случае ошибки
      }
    }

    // Рассчитываем комиссии для USD и RUB
    const usdCalculation = await paymentFeeService.calculateTotalWithFee(
      baseAmountUsd, 
      'usd', 
      paymentMethod
    );

    const rubCalculation = await paymentFeeService.calculateTotalWithFee(
      baseAmountRub, 
      'rub', 
      paymentMethod
    );

    return NextResponse.json({
      success: true,
      calculation: {
        productId: parseInt(productId),
        variantId: parseInt(variantId),
        paymentMethod,
        quantity,
        couponCode: couponCode || null,
        couponDiscount,
        usd: usdCalculation,
        rub: rubCalculation,
        originalPrices: {
          usd: parseFloat(variant.priceUsd) * quantity,
          rub: parseFloat(variant.priceRub) * quantity
        }
      }
    });

  } catch (error) {
    console.error('Error calculating price:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to calculate price' },
      { status: 500 }
    );
  }
}

// GET /api/calculate-price - Получить расчеты для всех методов оплаты
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const variantId = searchParams.get('variantId');
    const quantity = parseInt(searchParams.get('quantity')) || 1;
    const couponCode = searchParams.get('couponCode');

    if (!productId || !variantId) {
      return NextResponse.json(
        { success: false, error: 'Missing productId or variantId' },
        { status: 400 }
      );
    }

    // Получаем информацию о продукте и варианте
    const product = await prisma.product.findUnique({
      where: { id: parseInt(productId) },
      include: {
        variants: {
          where: { id: parseInt(variantId) }
        }
      }
    });

    if (!product || !product.variants.length) {
      return NextResponse.json(
        { success: false, error: 'Product or variant not found' },
        { status: 404 }
      );
    }

    const variant = product.variants[0];
    
    // Базовые цены с учетом количества
    let baseAmountUsd = parseFloat(variant.priceUsd) * quantity;
    let baseAmountRub = parseFloat(variant.priceRub) * quantity;

    // Применяем скидку от купона, если указан
    let couponDiscount = 0;
    if (couponCode) {
      try {
        const couponService = require('@/lib/services/couponService').default;
        const validationResult = await couponService.validateCoupon(couponCode, parseInt(productId));
        
        if (validationResult.valid) {
          couponDiscount = validationResult.coupon.discount;
          const discountAmountUsd = (baseAmountUsd * couponDiscount) / 100;
          const discountAmountRub = (baseAmountRub * couponDiscount) / 100;
          
          baseAmountUsd = baseAmountUsd - discountAmountUsd;
          baseAmountRub = baseAmountRub - discountAmountRub;
        }
      } catch (couponError) {
        console.error('Error validating coupon:', couponError);
      }
    }

    // Рассчитываем комиссии для всех методов оплаты
    const calculations = await paymentFeeService.calculateFeesForAllMethods(
      baseAmountUsd, 
      baseAmountRub
    );

    return NextResponse.json({
      success: true,
      productId: parseInt(productId),
      variantId: parseInt(variantId),
      quantity,
      couponCode: couponCode || null,
      couponDiscount,
      originalPrices: {
        usd: parseFloat(variant.priceUsd) * quantity,
        rub: parseFloat(variant.priceRub) * quantity
      },
      calculations
    });

  } catch (error) {
    console.error('Error getting price calculations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get price calculations' },
      { status: 500 }
    );
  }
}