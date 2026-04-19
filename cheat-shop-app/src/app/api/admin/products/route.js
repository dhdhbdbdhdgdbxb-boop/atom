/**
 * API маршруты для управления продуктами
 * Использует сервисный слой для бизнес-логики
 */

import { requireAdmin } from '@/lib/adminAuth.js';
import prisma from '@/lib/prisma';
import productService from '@/lib/services/productService';
import productVariantService from '@/lib/services/productVariantService';
import catalogService from '@/lib/services/catalogService';

// GET /api/admin/products - Получение всех продуктов
export async function GET(request) {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.success) {
      return Response.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const gameId = searchParams.get('gameId');
    const status = searchParams.get('status');
    const isNew = searchParams.get('isNew');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')) : undefined;
    const fields = searchParams.get('fields');

    const where = {};
    if (categoryId) where.categoryId = parseInt(categoryId);
    if (gameId) where.gameId = parseInt(gameId);
    if (status) where.status = status;
    if (isNew !== null) where.isNew = isNew === 'true';

    // Проверяем, что prisma доступен
    if (!prisma) {
      console.error('Prisma is not available');
      return Response.json(
        { success: false, error: 'Database connection not available' },
        { status: 500 }
      );
    }

    // Получаем продукты с вариантами, переводами и медиа
    const products = await prisma.product.findMany({
      where,
      orderBy: [
        { createdAt: 'desc' }
      ],
      include: {
        translations: true,
        variants: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }] },
        media: true,
        category: { include: { game: true } },
        game: true
      },
      ...(limit && { take: limit })
    });

    return Response.json({
      success: true,
      products
    });

  } catch (error) {
    console.error('Get products error:', error);
    return Response.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/products - Создание нового продукта
export async function POST(request) {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.success) {
      return Response.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const body = await request.json();
    console.log('📦 Creating product with data:', JSON.stringify(body, null, 2));

    // ВРЕМЕННО: Удаляем SEO поля из переводов до обновления production БД
    if (body.translations && Array.isArray(body.translations)) {
      body.translations = body.translations.map(translation => {
        const { metaTitle, metaDescription, metaKeywords, ...rest } = translation;
        if (metaTitle || metaDescription || metaKeywords) {
          console.warn('⚠️ SEO fields removed from translation (not supported yet)');
        }
        return rest;
      });
    }

    // Валидация обязательных полей
    const hasName = body.translations && body.translations.some(t => t.name && t.name.trim());
    if (!hasName) {
      console.log('❌ Validation failed: Product name is required');
      return Response.json(
        { success: false, error: 'Product name is required' },
        { status: 400 }
      );
    }

    if (!body.slug || !body.slug.trim()) {
      console.log('❌ Validation failed: Product slug is required');
      return Response.json(
        { success: false, error: 'Product slug is required' },
        { status: 400 }
      );
    }

    // Категория не обязательна, если товар создается под игрой
    if (!body.categoryId && !body.gameId) {
      console.log('❌ Validation failed: Either Category ID or Game ID is required');
      return Response.json(
        { success: false, error: 'Either Category ID or Game ID is required' },
        { status: 400 }
      );
    }

    // Проверка вариантов
    if (body.variants && !Array.isArray(body.variants)) {
      console.log('❌ Validation failed: Variants must be an array');
      return Response.json(
        { success: false, error: 'Variants must be an array' },
        { status: 400 }
      );
    }

    if (body.variants && body.variants.length === 0) {
      console.log('❌ Validation failed: Product must have at least one variant');
      return Response.json(
        { success: false, error: 'Product must have at least one variant' },
        { status: 400 }
      );
    }

    console.log('✅ Validation passed, creating product...');

    // Создаем продукт с вариантами через сервис
    const product = await productService.createProduct(body);
    console.log('✅ Product created successfully:', product.id);

    // Инвалидируем кэш каталога
    try {
      await catalogService.invalidateCache();
      console.log('✅ Cache invalidated successfully');
      
      // Дополнительно вызываем HTTP endpoint для инвалидации кэша
      if (process.env.NEXT_PUBLIC_SITE_URL) {
        fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/catalog/invalidate-cache`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'all' })
        }).catch(err => console.log('HTTP cache invalidation failed:', err.message));
      }
    } catch (cacheError) {
      console.error('Cache invalidation error:', cacheError);
    }

    console.log('✅ Returning success response');
    return Response.json({
      success: true,
      product
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Create product error:', error);
    console.error('Error stack:', error.stack);
    return Response.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: error.message.includes('slug') ? 400 : 500 }
    );
  }
}

// PUT /api/admin/products - Обновление продукта
export async function PUT(request) {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.success) {
      return Response.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const body = await request.json();
    const { id, ...updateData } = body;

    // ВРЕМЕННО: Удаляем SEO поля из переводов до обновления production БД
    if (updateData.translations && Array.isArray(updateData.translations)) {
      updateData.translations = updateData.translations.map(translation => {
        const { metaTitle, metaDescription, metaKeywords, ...rest } = translation;
        if (metaTitle || metaDescription || metaKeywords) {
          console.warn('⚠️ SEO fields removed from translation (not supported yet)');
        }
        return rest;
      });
    }

    // Проверяем, что prisma доступен
    if (!prisma) {
      console.error('Prisma is not available');
      return Response.json(
        { success: false, error: 'Database connection not available' },
        { status: 500 }
      );
    }

    // Проверяем существование продукта
    const existingProduct = await prisma.product.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingProduct) {
      return Response.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Проверяем права доступа
    const userPermissions = authResult.admin.permissions || [];
    const canUpdateStatusOnly = userPermissions.includes('products.status') &&
                               !userPermissions.includes('products.all') &&
                               !authResult.admin.owner;

    if (canUpdateStatusOnly) {
      // Менеджер статусов может обновлять только статус
      if (Object.keys(updateData).length > 1 || (updateData.status === undefined)) {
        return Response.json(
          { success: false, error: 'You only have permission to change product status' },
          { status: 403 }
        );
      }

      // Обновляем только статус
      const product = await prisma.product.update({
        where: { id: parseInt(id) },
        data: { status: updateData.status },
        include: {
          category: {
            include: {
              game: true
            }
          },
          game: true,
          variants: true
        }
      });

      // Инвалидируем кэш каталога
      try {
        await catalogService.invalidateCache();
        
        // Дополнительно вызываем HTTP endpoint для инвалидации кэша
        if (process.env.NEXT_PUBLIC_SITE_URL) {
          fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/catalog/invalidate-cache`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'all' })
          }).catch(err => console.log('HTTP cache invalidation failed:', err.message));
        }
      } catch (cacheError) {
        console.error('Cache invalidation error:', cacheError);
      }

      return Response.json({
        success: true,
        product
      });
    }

    // Полный доступ для других ролей
    // Валидация slug на уникальность при изменении
    if (updateData.slug && updateData.slug !== existingProduct.slug) {
      const existingSlug = await prisma.product.findUnique({
        where: { slug: updateData.slug }
      });
      
      if (existingSlug) {
        return Response.json(
          { success: false, error: 'Product with this slug already exists' },
          { status: 400 }
        );
      }
    }

    // Обновляем продукт через сервис
    const product = await productService.updateProduct(id, updateData);

    // Инвалидируем кэш каталога
    try {
      await catalogService.invalidateCache();
      
      // Дополнительно вызываем HTTP endpoint для инвалидации кэша
      if (process.env.NEXT_PUBLIC_SITE_URL) {
        fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/catalog/invalidate-cache`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'all' })
        }).catch(err => console.log('HTTP cache invalidation failed:', err.message));
      }
    } catch (cacheError) {
      console.error('Cache invalidation error:', cacheError);
    }

    return Response.json({
      success: true,
      product
    });

  } catch (error) {
    console.error('Update product error:', error);
    return Response.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/products - Удаление продукта
export async function DELETE(request) {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.success) {
      return Response.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return Response.json(
        { success: false, error: 'Product ID is required' },
        { status: 400 }
      );
    }

    // Удаляем продукт через сервис
    await productService.deleteProduct(parseInt(id));

    // Инвалидируем кэш каталога
    try {
      await catalogService.invalidateCache();
      
      // Дополнительно вызываем HTTP endpoint для инвалидации кэша
      if (process.env.NEXT_PUBLIC_SITE_URL) {
        fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/catalog/invalidate-cache`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'all' })
        }).catch(err => console.log('HTTP cache invalidation failed:', err.message));
      }
    } catch (cacheError) {
      console.error('Cache invalidation error:', cacheError);
    }

    return Response.json({
      success: true,
      message: 'Product deleted successfully'
    });

  } catch (error) {
    console.error('Delete product error:', error);
    return Response.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/admin/products/reorder - Изменение порядка продуктов
export async function PATCH(request) {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.success) {
      return Response.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const body = await request.json();
    const { updates } = body;

    if (!Array.isArray(updates)) {
      return Response.json(
        { success: false, error: 'Updates must be an array' },
        { status: 400 }
      );
    }

    // Обновляем порядок через сервис
    await productService.reorderProducts(updates);

    // Инвалидируем кэш каталога
    try {
      await catalogService.invalidateCache();
      
      // Дополнительно вызываем HTTP endpoint для инвалидации кэша
      if (process.env.NEXT_PUBLIC_SITE_URL) {
        fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/catalog/invalidate-cache`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'all' })
        }).catch(err => console.log('HTTP cache invalidation failed:', err.message));
      }
    } catch (cacheError) {
      console.error('Cache invalidation error:', cacheError);
    }

    return Response.json({
      success: true,
      message: 'Products reordered successfully'
    });

  } catch (error) {
    console.error('Reorder products error:', error);
    return Response.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}