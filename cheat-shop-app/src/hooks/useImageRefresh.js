/**
 * Хук для автоматического обновления изображений после загрузки
 */

import { useEffect, useCallback } from 'react';
import { addCacheBuster, refreshImagesOnPage } from '@/lib/utils/imageUtils';

export function useImageRefresh() {
  /**
   * Обновляет изображение с указанным URL на странице
   */
  const refreshImage = useCallback((imageUrl) => {
    if (!imageUrl) return;
    refreshImagesOnPage(imageUrl);
  }, []);

  /**
   * Добавляет cache-busting параметр к URL
   */
  const getCacheBustedUrl = useCallback((imageUrl, forceRefresh = false) => {
    return addCacheBuster(imageUrl, forceRefresh);
  }, []);

  /**
   * Обновляет все изображения на странице
   */
  const refreshAllImages = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    document.querySelectorAll('img').forEach(img => {
      const src = img.src;
      img.src = addCacheBuster(src, true);
    });
  }, []);

  return {
    refreshImage,
    getCacheBustedUrl,
    refreshAllImages
  };
}
