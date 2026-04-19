/**
 * API для получения последнего времени обновления каталога
 * Используется для проверки наличия новых данных
 */

import prisma from '@/lib/prisma';

// GET /api/catalog/last-update - Получение последнего времени обновления
export async function GET(request) {
  try {
    // Получаем последнее время изменения игр
    const lastGameUpdate = await prisma.game.findFirst({
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true }
    });

    // Получаем последнее время изменения категорий
    const lastCategoryUpdate = await prisma.category.findFirst({
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true }
    });

    // Получаем последнее время изменения продуктов
    const lastProductUpdate = await prisma.product.findFirst({
      orderBy: { updatedAt: 'desc' },
      select: { updatedAt: true }
    });

    // Определяем самое последнее время обновления
    const lastUpdate = Math.max(
      lastGameUpdate?.updatedAt?.getTime() || 0,
      lastCategoryUpdate?.updatedAt?.getTime() || 0,
      lastProductUpdate?.updatedAt?.getTime() || 0
    );

    return Response.json({
      success: true,
      lastUpdate: lastUpdate || Date.now()
    });

  } catch (error) {
    console.error('Last update API error:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}