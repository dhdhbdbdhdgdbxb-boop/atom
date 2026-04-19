// Game API Routes
import { requireAdmin } from '@/lib/adminAuth.js';
import prisma from '@/lib/prisma.js';

// GET /api/admin/games - Get all games
export async function GET(request) {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.success) {
      return Response.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const games = await prisma.game.findMany({
      orderBy: [
        { createdAt: 'desc' }
      ],
      include: {
        _count: {
          select: {
            products: true
          }
        }
      }
    });

    return Response.json({
      success: true,
      games
    });

  } catch (error) {
    console.error('Get games error:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/games - Create new game
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
    const { name, description, icon, background, image, isActive, isNew } = body;

    // Валидация обязательных полей
    if (!name || !name.trim()) {
      return Response.json(
        { success: false, error: 'Game name is required' },
        { status: 400 }
      );
    }

    // Generate slug automatically from name
    const slug = name.toLowerCase().trim().replace(/\s+/g, '-');

    // Check if slug already exists
    const existingGame = await prisma.game.findUnique({
      where: { name }
    });

    if (existingGame) {
      return Response.json(
        { success: false, error: 'Game with this name already exists' },
        { status: 400 }
      );
    }

    const game = await prisma.game.create({
      data: {
        name: name.trim(),
        slug: slug,
        description: description || '',
        icon: icon || '',
        background: background || '',
        image: image || '',
        isActive: isActive !== undefined ? isActive : true,
        isNew: isNew || false
      }
    });

    // Получаем IP-адрес из заголовков
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || request.ip || 'unknown';
    
    // Логируем создание игры
    await prisma.log.create({
      data: {
        user: authResult.admin.login,
        timestamp: BigInt(Date.now()),
        description: `Создание игры: название="${name}", slug="${slug}", IP="${ipAddress}"`
      }
    });

    // Инвалидация кэша после создания новой игры
    try {
      const catalogService = await import('@/lib/services/catalogService');
      await catalogService.default.invalidateCache();
      
      // Дополнительно вызываем HTTP endpoint для инвалидации кэша
      // (полезно если приложение работает в нескольких процессах)
      if (process.env.NEXT_PUBLIC_SITE_URL) {
        fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/catalog/invalidate-cache`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'all' })
        }).catch(err => console.log('HTTP cache invalidation failed:', err.message));
      }
    } catch (cacheError) {
      console.error('Cache invalidation error:', cacheError);
      // Не прерываем выполнение из-за ошибки кэша
    }

    return Response.json({
      success: true,
      game
    }, { status: 201 });

  } catch (error) {
    console.error('Create game error:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/games - Update game
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

    // Проверяем существование игры
    const existingGame = await prisma.game.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingGame) {
      return Response.json(
        { success: false, error: 'Game not found' },
        { status: 404 }
      );
    }

    // Filter out invalid fields that shouldn't be in the update data
    const allowedFields = ['name', 'description', 'icon', 'background', 'image', 'isActive', 'isNew'];
    const filteredUpdateData = {};
    
    for (const field of allowedFields) {
      if (updateData.hasOwnProperty(field)) {
        filteredUpdateData[field] = updateData[field];
      }
    }

    // Generate new slug if name is being updated
    if (filteredUpdateData.name && filteredUpdateData.name !== existingGame.name) {
      const newSlug = filteredUpdateData.name.toLowerCase().trim().replace(/\s+/g, '-');
      
      // Check if new slug already exists
      const existingSlug = await prisma.game.findUnique({
        where: { slug: newSlug }
      });
      
      if (existingSlug && existingSlug.id !== existingGame.id) {
        return Response.json(
          { success: false, error: 'Game with this slug already exists' },
          { status: 400 }
        );
      }
      
      filteredUpdateData.slug = newSlug;
    }

    if (!existingGame) {
      return Response.json(
        { success: false, error: 'Game not found' },
        { status: 404 }
      );
    }


    const game = await prisma.game.update({
      where: { id: parseInt(id) },
      data: filteredUpdateData,
      include: {
        _count: {
          select: {
            categories: true,
            products: true
          }
        }
      }
    });

    // Инвалидация кэша после обновления игры
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
      game
    });

  } catch (error) {
    console.error('Update game error:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/games - Delete game
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
        { success: false, error: 'Game ID is required' },
        { status: 400 }
      );
    }

    // Check if game has categories or products
    const gameWithCounts = await prisma.game.findUnique({
      where: { id: parseInt(id) },
      include: {
        _count: {
          select: {
            categories: true,
            products: true
          }
        }
      }
    });

    if (!gameWithCounts) {
      return Response.json(
        { success: false, error: 'Game not found' },
        { status: 404 }
      );
    }

    if (gameWithCounts._count.categories > 0 || gameWithCounts._count.products > 0) {
      return Response.json(
        { success: false, error: 'Cannot delete game with categories or products' },
        { status: 400 }
      );
    }

    const gameToDelete = await prisma.game.findUnique({
      where: { id: parseInt(id) }
    });

    // Удаляем файлы изображений игры с диска
    const { deleteFile } = await import('@/lib/utils/fileUtils');
    const filesToDelete = [];
    
    if (gameToDelete.image) filesToDelete.push(gameToDelete.image);
    if (gameToDelete.background) filesToDelete.push(gameToDelete.background);
    if (gameToDelete.icon) filesToDelete.push(gameToDelete.icon);
    
    if (filesToDelete.length > 0) {
      console.log(`🗑️ Удаляем ${filesToDelete.length} файлов игры:`, filesToDelete);
      for (const filePath of filesToDelete) {
        const deleteResult = await deleteFile(filePath);
        console.log(`🗑️ Удаление файла ${filePath}: ${deleteResult ? 'успешно' : 'не удалось'}`);
      }
    }

    await prisma.game.delete({
      where: { id: parseInt(id) }
    });

    // Получаем IP-адрес из заголовков
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || request.ip || 'unknown';
    
    // Логируем удаление игры
    await prisma.log.create({
      data: {
        user: authResult.admin.login,
        timestamp: BigInt(Date.now()),
        description: `Удаление игры: название="${gameToDelete.name}", slug="${gameToDelete.slug}", IP="${ipAddress}"`
      }
    });

    // Инвалидация кэша после удаления игры
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
      message: 'Game deleted successfully'
    });

  } catch (error) {
    console.error('Delete game error:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}