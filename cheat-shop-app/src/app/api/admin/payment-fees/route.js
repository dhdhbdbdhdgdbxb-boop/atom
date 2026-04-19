import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth';

// GET /api/admin/payment-fees - Получить все комиссии платежных методов
export async function GET(request) {
  try {
    const result = await requireAdmin(request);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    const paymentFees = await prisma.paymentFee.findMany({
      orderBy: { paymentMethod: 'asc' }
    });

    return NextResponse.json({
      success: true,
      paymentFees
    });

  } catch (error) {
    console.error('Error fetching payment fees:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payment fees' },
      { status: 500 }
    );
  }
}

// POST /api/admin/payment-fees - Создать новый платежный метод с комиссией
export async function POST(request) {
  try {
    const result = await requireAdmin(request);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    const { paymentMethod, percentageFee, fixedFeeUsd, fixedFeeRub, isActive } = await request.json();

    if (!paymentMethod) {
      return NextResponse.json(
        { success: false, error: 'Payment method is required' },
        { status: 400 }
      );
    }

    // Проверяем, что процентная комиссия не превышает 100%
    if (percentageFee < 0 || percentageFee > 100) {
      return NextResponse.json(
        { success: false, error: 'Percentage fee must be between 0 and 100' },
        { status: 400 }
      );
    }

    // Проверяем, что фиксированные комиссии не отрицательные
    if (fixedFeeUsd < 0 || fixedFeeRub < 0) {
      return NextResponse.json(
        { success: false, error: 'Fixed fees cannot be negative' },
        { status: 400 }
      );
    }

    const paymentFee = await prisma.paymentFee.create({
      data: {
        paymentMethod,
        percentageFee: parseFloat(percentageFee) || 0,
        fixedFeeUsd: parseFloat(fixedFeeUsd) || 0,
        fixedFeeRub: parseFloat(fixedFeeRub) || 0,
        isActive: isActive !== undefined ? isActive : true
      }
    });

    return NextResponse.json({
      success: true,
      paymentFee
    });

  } catch (error) {
    console.error('Error creating payment fee:', error);
    
    // Проверяем на дублирование платежного метода
    if (error.code === 'P2002') {
      return NextResponse.json(
        { success: false, error: 'Payment method already exists' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create payment fee' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/payment-fees - Обновить комиссию платежного метода
export async function PUT(request) {
  try {
    const result = await requireAdmin(request);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    const { id, paymentMethod, percentageFee, fixedFeeUsd, fixedFeeRub, isActive } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Payment fee ID is required' },
        { status: 400 }
      );
    }

    // Проверяем, что процентная комиссия не превышает 100%
    if (percentageFee < 0 || percentageFee > 100) {
      return NextResponse.json(
        { success: false, error: 'Percentage fee must be between 0 and 100' },
        { status: 400 }
      );
    }

    // Проверяем, что фиксированные комиссии не отрицательные
    if (fixedFeeUsd < 0 || fixedFeeRub < 0) {
      return NextResponse.json(
        { success: false, error: 'Fixed fees cannot be negative' },
        { status: 400 }
      );
    }

    const paymentFee = await prisma.paymentFee.update({
      where: { id: parseInt(id) },
      data: {
        paymentMethod,
        percentageFee: parseFloat(percentageFee),
        fixedFeeUsd: parseFloat(fixedFeeUsd),
        fixedFeeRub: parseFloat(fixedFeeRub),
        isActive
      }
    });

    return NextResponse.json({
      success: true,
      paymentFee
    });

  } catch (error) {
    console.error('Error updating payment fee:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Payment fee not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update payment fee' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/payment-fees - Удалить комиссию платежного метода
export async function DELETE(request) {
  try {
    const result = await requireAdmin(request);
    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: result.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Payment fee ID is required' },
        { status: 400 }
      );
    }

    await prisma.paymentFee.delete({
      where: { id: parseInt(id) }
    });

    return NextResponse.json({
      success: true,
      message: 'Payment fee deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting payment fee:', error);
    
    if (error.code === 'P2025') {
      return NextResponse.json(
        { success: false, error: 'Payment fee not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to delete payment fee' },
      { status: 500 }
    );
  }
}