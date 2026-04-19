import { NextResponse } from 'next/server';
import catalogService from '@/lib/services/catalogService';
import cache from '@/lib/utils/cacheUtils';
import { requireAdmin } from '@/lib/adminAuth';

export async function POST(request) {
  const adminAuth = await requireAdmin(request);
  if (!adminAuth.success) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type, gameSlug, categorySlug } = body;

    console.log(`🗑️ Запрос на инвалидацию кэша: type=${type}, gameSlug=${gameSlug}, categorySlug=${categorySlug}`);

    switch (type) {
      case 'all':
        await catalogService.invalidateCache();
        break;
      case 'games':
        await catalogService.invalidateGameCache(gameSlug);
        break;
      case 'categories':
        await catalogService.invalidateCategoryCache(gameSlug, categorySlug);
        break;
      case 'products':
        await catalogService.invalidateProductCache(gameSlug, categorySlug);
        break;
      default:
        // По умолчанию инвалидируем весь кэш каталога
        await catalogService.invalidateCache();
    }

    const stats = cache.getStats();
    console.log(`📊 Статистика кэша после инвалидации:`, stats);

    return NextResponse.json({
      success: true,
      message: `Cache invalidated for type: ${type}`,
      cacheStats: stats
    });

  } catch (error) {
    console.error('Cache invalidation error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const stats = cache.getStats();
    
    return NextResponse.json({
      success: true,
      cacheStats: stats
    });
  } catch (error) {
    console.error('Get cache stats error:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}