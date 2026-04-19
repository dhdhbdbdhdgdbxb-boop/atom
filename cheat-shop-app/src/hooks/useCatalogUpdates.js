import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Хук для автоматического обновления каталога
 * Проверяет обновления каталога и перезагружает страницу при необходимости
 */
export function useCatalogUpdates() {
  const router = useRouter();

  const checkForUpdates = useCallback(async () => {
    try {
      const response = await fetch('/api/catalog/last-update');
      const data = await response.json();
      
      if (data.success && data.lastUpdate) {
        const lastUpdate = new Date(data.lastUpdate);
        const storedUpdate = localStorage.getItem('catalog_last_update');
        
        if (storedUpdate) {
          const storedDate = new Date(storedUpdate);
          
          // Если данные обновились, перезагружаем страницу
          if (lastUpdate > storedDate) {
            console.log('[CATALOG] Updates detected, refreshing page...');
            localStorage.setItem('catalog_last_update', lastUpdate.toISOString());
            router.refresh();
          }
        } else {
          // Первый запуск - сохраняем текущее время
          localStorage.setItem('catalog_last_update', lastUpdate.toISOString());
        }
      }
    } catch (error) {
      console.error('[CATALOG] Update check failed:', error);
    }
  }, [router]);

  useEffect(() => {
    // Проверяем обновления при загрузке
    checkForUpdates();

    // Устанавливаем интервал проверки каждые 30 секунд
    const interval = setInterval(checkForUpdates, 30000);

    return () => clearInterval(interval);
  }, [checkForUpdates]);

  return { checkForUpdates };
}

/**
 * Функция для принудительной инвалидации кэша каталога
 */
export async function invalidateCatalogCache(type = 'all', gameSlug = null, categorySlug = null) {
  try {
    const response = await fetch('/api/catalog/invalidate-cache', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        gameSlug,
        categorySlug
      })
    });

    const data = await response.json();
    
    if (data.success) {
      console.log('[CACHE] Catalog cache invalidated successfully');
      // Обновляем локальное время последнего обновления
      localStorage.setItem('catalog_last_update', new Date().toISOString());
      return true;
    } else {
      console.error('[CACHE] Invalidation failed:', data.error);
      return false;
    }
  } catch (error) {
    console.error('[CACHE] Invalidation request failed:', error);
    return false;
  }
}