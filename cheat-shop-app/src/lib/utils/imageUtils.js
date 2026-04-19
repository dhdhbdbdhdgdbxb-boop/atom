/**
 * Утилиты для работы с изображениями
 */

const CDN_URL = process.env.NEXT_PUBLIC_CDN_URL || '';

/**
 * Возвращает полный URL медиафайла, подставляя CDN если задан
 * @param {string} url - Относительный или абсолютный URL
 * @returns {string}
 */
export function getMediaUrl(url) {
  if (!url) return url;
  // Уже абсолютный URL — не трогаем
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  // Локальный путь — добавляем CDN
  if (CDN_URL && url.startsWith('/uploads/')) return `${CDN_URL}${url}`;
  return url;
}

/**
 * Добавляет cache-busting параметр к URL изображения
 * @param {string} imageUrl - URL изображения
 * @param {boolean} forceRefresh - Принудительное обновление (использует текущее время)
 * @returns {string} URL с cache-busting параметром
 */
export function addCacheBuster(imageUrl, forceRefresh = false) {
  if (!imageUrl) return imageUrl;
  
  // Если это внешний URL, не модифицируем
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // Генерируем cache-busting параметр
  const cacheBuster = forceRefresh ? Date.now() : 'v1';
  const separator = imageUrl.includes('?') ? '&' : '?';
  
  return `${imageUrl}${separator}t=${cacheBuster}`;
}

/**
 * Инвалидирует кэш изображения на клиенте
 * @param {string} imageUrl - URL изображения для инвалидации
 */
export function invalidateImageCache(imageUrl) {
  if (typeof window === 'undefined') return;
  
  // Удаляем из кэша браузера
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        caches.open(name).then(cache => {
          cache.delete(imageUrl);
        });
      });
    });
  }
}

/**
 * Предзагружает изображение с новым cache-busting параметром
 * @param {string} imageUrl - URL изображения
 * @returns {Promise<void>}
 */
export function preloadImage(imageUrl) {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      resolve();
      return;
    }
    
    const img = new window.Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = addCacheBuster(imageUrl, true);
  });
}

/**
 * Обновляет все изображения на странице с указанным URL
 * @param {string} oldUrl - Старый URL изображения
 * @param {string} newUrl - Новый URL изображения (опционально)
 */
export function refreshImagesOnPage(oldUrl, newUrl = null) {
  if (typeof window === 'undefined') return;
  
  const targetUrl = newUrl || oldUrl;
  const urlWithCacheBuster = addCacheBuster(targetUrl, true);
  
  // Обновляем все img элементы
  document.querySelectorAll('img').forEach(img => {
    const imgSrc = img.src.split('?')[0]; // Убираем существующие параметры
    const targetSrc = targetUrl.startsWith('/') 
      ? window.location.origin + targetUrl 
      : targetUrl;
    
    if (imgSrc === targetSrc || img.src.includes(oldUrl)) {
      img.src = urlWithCacheBuster;
    }
  });
  
  // Обновляем background-image в стилях
  document.querySelectorAll('[style*="background-image"]').forEach(el => {
    const style = el.style.backgroundImage;
    if (style.includes(oldUrl)) {
      el.style.backgroundImage = style.replace(
        oldUrl,
        urlWithCacheBuster
      );
    }
  });
}
