import { NextResponse } from 'next/server';
import productVariantService from '@/lib/services/productVariantService';
import { requireAdmin } from '@/lib/adminAuth';

// All key endpoints require admin auth — keys are sensitive product inventory

// GET /api/variants/[id]/keys - Получение одного или нескольких свободных ключей
// Новая версия с поддержкой резервирования ключей
export async function GET(request, { params }) {
  const adminAuth = await requireAdmin(request);
  if (!adminAuth.success) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const resolvedParams = await params;
    const variantId = parseInt(resolvedParams.id);
    const { searchParams } = new URL(request.url);
    const quantity = parseInt(searchParams.get('quantity')) || 1;
    const orderId = searchParams.get('orderId'); // Необязательный параметр для резервирования

    if (!variantId) {
      return NextResponse.json(
        { success: false, error: 'Variant ID is required' },
        { status: 400 }
      );
    }

    // Если передан orderId, используем новую систему получения ключей
    if (orderId) {
      const keys = await productVariantService.getKeysForOrder(variantId, quantity);
       
      if (!keys || keys.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No available keys' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { success: true, keys },
        { status: 200 }
      );
    }
    // Если запрашивается один ключ без резервирования, используем старый метод
    else if (quantity === 1) {
      const key = await productVariantService.getSingleAvailableKey(variantId);

      if (!key) {
        return NextResponse.json(
          { success: false, error: 'No available keys' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { success: true, key },
        { status: 200 }
      );
    }
    // Если запрашивается несколько ключей без резервирования, используем старый метод
    else {
      const keys = await productVariantService.getMultipleAvailableKeys(variantId, quantity);

      if (!keys || keys.length === 0) {
        return NextResponse.json(
          { success: false, error: 'No available keys' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { success: true, keys },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error('Error getting key:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get key', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/variants/[id]/keys - Удаление использованного ключа
export async function DELETE(request, { params }) {
  const adminAuth = await requireAdmin(request);
  if (!adminAuth.success) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const resolvedParams = await params;
    const variantId = parseInt(resolvedParams.id);
    const { key } = await request.json();

    if (!variantId || !key) {
      return NextResponse.json(
        { success: false, error: 'Variant ID and key are required' },
        { status: 400 }
      );
    }

    const updatedVariant = await productVariantService.removeUsedKey(variantId, key);

    return NextResponse.json(
      { success: true, variant: updatedVariant },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error removing key:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to remove key', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/variants/[id]/keys/get - Получение ключей для заказа
// Новый маршрут для получения ключей
export async function POST(request, { params }) {
  const adminAuth = await requireAdmin(request);
  if (!adminAuth.success) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const resolvedParams = await params;
    const variantId = parseInt(resolvedParams.id);
    const { orderId, quantity = 1 } = await request.json();

    if (!variantId || !orderId) {
      return NextResponse.json(
        { success: false, error: 'Variant ID and order ID are required' },
        { status: 400 }
      );
    }

    const keys = await productVariantService.getKeysForOrder(variantId, quantity);

    if (!keys || keys.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No available keys' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, keys },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error getting keys:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get keys', details: error.message },
      { status: 500 }
    );
  }
}

