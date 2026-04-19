/**
 * API маршруты для управления картинками продукта
 * Использует сервисный слой для бизнес-логики
 */

import { requireAdmin } from '@lib/adminAuth';
import productImageService from '@lib/services/productImageService';
import catalogService from '@lib/services/catalogService';

// GET /api/admin/products/[id]/images - Получение всех картинок продукта
export async function GET(request, { params }) {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.success) {
      return Response.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const productId = parseInt(id);

    if (!productId) {
      return Response.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const images = await productImageService.getProductImages(productId);

    return Response.json({
      success: true,
      images
    });

  } catch (error) {
    console.error('Get product images error:', error);
    return Response.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/products/[id]/images - Добавление новой картинки
export async function POST(request, { params }) {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.success) {
      return Response.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const productId = parseInt(id);
    const body = await request.json();

    if (!productId) {
      return Response.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }

    if (!body.imageUrl || !body.imageUrl.trim()) {
      return Response.json(
        { success: false, error: 'Image URL is required' },
        { status: 400 }
      );
    }

    const imageData = {
      productId,
      imageUrl: body.imageUrl.trim(),
      sortOrder: body.sortOrder || 0,
      isPrimary: body.isPrimary || false
    };

    const image = await productImageService.createImage(imageData);

    // Инвалидируем кэш каталога
    await catalogService.invalidateCache();

    return Response.json({
      success: true,
      image
    }, { status: 201 });

  } catch (error) {
    console.error('Create product image error:', error);
    return Response.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/products/[id]/images - Обновление картинки
export async function PUT(request, { params }) {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.success) {
      return Response.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const body = await request.json();
    const { imageId, ...updateData } = body;

    if (!imageId) {
      return Response.json(
        { success: false, error: 'Image ID is required' },
        { status: 400 }
      );
    }

    const image = await productImageService.updateImage(imageId, updateData);

    // Инвалидируем кэш каталога
    await catalogService.invalidateCache();

    return Response.json({
      success: true,
      image
    });

  } catch (error) {
    console.error('Update product image error:', error);
    return Response.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/products/[id]/images - Удаление картинки
export async function DELETE(request, { params }) {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.success) {
      return Response.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('imageId');

    if (!imageId) {
      return Response.json(
        { success: false, error: 'Image ID is required' },
        { status: 400 }
      );
    }

    // Получаем информацию об изображении перед удалением
    const { default: prisma } = await import('@/lib/prisma');
    const imageToDelete = await prisma.productImage.findUnique({
      where: { id: parseInt(imageId) }
    });

    if (!imageToDelete) {
      return Response.json(
        { success: false, error: 'Image not found' },
        { status: 404 }
      );
    }

    // Удаляем изображение из БД
    const image = await productImageService.deleteImage(parseInt(imageId));

    // Удаляем файл с диска
    const { deleteFile } = await import('@/lib/utils/fileUtils');
    if (imageToDelete.imageUrl) {
      const deleteResult = await deleteFile(imageToDelete.imageUrl);
      console.log(`🗑️ Удаление файла изображения ${imageToDelete.imageUrl}: ${deleteResult ? 'успешно' : 'не удалось'}`);
    }

    // Инвалидируем кэш каталога
    await catalogService.invalidateCache();

    return Response.json({
      success: true,
      message: 'Image deleted successfully',
      image
    });

  } catch (error) {
    console.error('Delete product image error:', error);
    return Response.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/products/[id]/images/reorder - Изменение порядка картинок
export async function PATCH(request, { params }) {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.success) {
      return Response.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();
    const { updates } = body;

    if (!Array.isArray(updates)) {
      return Response.json(
        { success: false, error: 'Updates must be an array' },
        { status: 400 }
      );
    }

    // Обновляем порядок через сервис
    await productImageService.reorderImages(updates);

    // Инвалидируем кэш каталога
    await catalogService.invalidateCache();

    return Response.json({
      success: true,
      message: 'Images reordered successfully'
    });

  } catch (error) {
    console.error('Reorder product images error:', error);
    return Response.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}