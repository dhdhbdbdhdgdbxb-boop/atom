/**
 * API маршруты для управления категориями
 * Поддерживает создание категорий с переводами на несколько языков
 */

import { requireAdmin } from '@/lib/adminAuth.js';
import prisma from '@/lib/prisma';

// GET /api/admin/categories - Получение всех категорий
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
    const gameId = searchParams.get('gameId');

    const where = {};
    if (gameId) where.gameId = parseInt(gameId);

    const categories = await prisma.category.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
      include: {
        translations: true,
        game: true
      }
    });

    return Response.json({
      success: true,
      categories
    });

  } catch (error) {
    console.error('Get categories error:', error);
    return Response.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/categories - Создание новой категории
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

    // Валидация обязательных полей
    if (!body.slug || !body.slug.trim()) {
      return Response.json(
        { success: false, error: 'Category slug is required' },
        { status: 400 }
      );
    }

    if (!body.gameId) {
      return Response.json(
        { success: false, error: 'Game ID is required' },
        { status: 400 }
      );
    }

    // Проверка уникальности slug для игры
    const existingSlug = await prisma.category.findFirst({
      where: {
        slug: body.slug,
        gameId: parseInt(body.gameId)
      }
    });

    if (existingSlug) {
      return Response.json(
        { success: false, error: 'Category with this slug already exists for this game' },
        { status: 400 }
      );
    }

    // Создание категории
    const category = await prisma.category.create({
      data: {
        slug: body.slug.toLowerCase().trim(),
        description: body.description,
        icon: body.icon,
        background: body.background,
        image: body.image,
        isActive: body.isActive !== undefined ? body.isActive : true,
        sortOrder: body.sortOrder || 0,
        isNew: body.isNew || false,
        gameId: parseInt(body.gameId)
      },
      include: {
        translations: true,
        game: true
      }
    });

    // Создание переводов для категории
    if (body.translations && body.translations.length > 0) {
      const translationPromises = body.translations.map(translation =>
        prisma.categoryTranslation.create({
          data: {
            categoryId: category.id,
            language: translation.language,
            name: translation.name
          }
        })
      );

      await Promise.all(translationPromises);
    }

    // Возвращаем категорию с переводами
    const createdCategory = await prisma.category.findUnique({
      where: { id: category.id },
      include: {
        translations: true,
        game: true
      }
    });

    // Инвалидация кэша после создания категории
    try {
      const catalogService = await import('@/lib/services/catalogService');
      await catalogService.default.invalidateCache();
      
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
      category: createdCategory
    }, { status: 201 });

  } catch (error) {
    console.error('Create category error:', error);
    return Response.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/categories - Обновление категории
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

    // Проверяем существование категории
    const existingCategory = await prisma.category.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingCategory) {
      return Response.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // Обновление категории
    const category = await prisma.category.update({
      where: { id: parseInt(id) },
      data: {
        slug: updateData.slug,
        description: updateData.description,
        icon: updateData.icon,
        background: updateData.background,
        image: updateData.image,
        isActive: updateData.isActive,
        sortOrder: updateData.sortOrder,
        isNew: updateData.isNew,
        gameId: updateData.gameId
      },
      include: {
        translations: true,
        game: true
      }
    });

    // Обновление переводов
    if (updateData.translations && updateData.translations.length > 0) {
      // Удаляем старые переводы
      await prisma.categoryTranslation.deleteMany({
        where: { categoryId: category.id }
      });

      // Создаем новые переводы
      const translationPromises = updateData.translations.map(translation =>
        prisma.categoryTranslation.create({
          data: {
            categoryId: category.id,
            language: translation.language,
            name: translation.name
          }
        })
      );

      await Promise.all(translationPromises);
    }

    // Возвращаем обновленную категорию с переводами
    const updatedCategory = await prisma.category.findUnique({
      where: { id: category.id },
      include: {
        translations: true,
        game: true
      }
    });

    // Инвалидация кэша после обновления категории
    try {
      const catalogService = await import('@/lib/services/catalogService');
      await catalogService.default.invalidateCache();
      
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
      category: updatedCategory
    });

  } catch (error) {
    console.error('Update category error:', error);
    return Response.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/categories - Удаление категории
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
        { success: false, error: 'Category ID is required' },
        { status: 400 }
      );
    }

    // Получаем информацию о категории перед удалением
    const categoryToDelete = await prisma.category.findUnique({
      where: { id: parseInt(id) }
    });

    if (!categoryToDelete) {
      return Response.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // Удаляем файлы изображений категории с диска
    const { deleteFile } = await import('@/lib/utils/fileUtils');
    const filesToDelete = [];
    
    if (categoryToDelete.image) filesToDelete.push(categoryToDelete.image);
    if (categoryToDelete.background) filesToDelete.push(categoryToDelete.background);
    if (categoryToDelete.icon) filesToDelete.push(categoryToDelete.icon);
    
    if (filesToDelete.length > 0) {
      console.log(`🗑️ Удаляем ${filesToDelete.length} файлов категории:`, filesToDelete);
      for (const filePath of filesToDelete) {
        const deleteResult = await deleteFile(filePath);
        console.log(`🗑️ Удаление файла ${filePath}: ${deleteResult ? 'успешно' : 'не удалось'}`);
      }
    }

    // Удаляем категорию
    await prisma.category.delete({
      where: { id: parseInt(id) }
    });

    // Инвалидация кэша после удаления категории
    try {
      const catalogService = await import('@/lib/services/catalogService');
      await catalogService.default.invalidateCache();
      
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
      message: 'Category deleted successfully'
    });

  } catch (error) {
    console.error('Delete category error:', error);
    return Response.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}