/**
 * API для уведомления об обновлениях каталога
 * Используется для отправки уведомлений клиентам о необходимости обновления данных
 */

import catalogService from '@/lib/services/catalogService';
import { requireAdmin } from '@/lib/adminAuth';

export async function POST(request) {
  const adminAuth = await requireAdmin(request);
  if (!adminAuth.success) {
    return Response.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type, gameSlug, categorySlug } = body;

    // Инвалидируем кеш в зависимости от типа изменения
    switch (type) {
      case 'game':
        await catalogService.invalidateGameCache(gameSlug);
        break;
      case 'category':
        await catalogService.invalidateCategoryCache(gameSlug, categorySlug);
        break;
      case 'product':
        await catalogService.invalidateProductCache(gameSlug, categorySlug);
        break;
      default:
        await catalogService.invalidateCache();
        break;
    }

    return Response.json({
      success: true,
      message: 'Cache invalidated successfully',
      timestamp: Date.now()
    });

  } catch (error) {
    console.error('Notify update API error:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}