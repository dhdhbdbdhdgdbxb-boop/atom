/**
 * Утилиты для кэширования данных
 */

class CacheUtils {
  constructor() {
    this.cache = new Map();
    this.tags = new Map(); // Карта тегов для группировки кеша
    this.defaultTTL = 300; // 5 минут по умолчанию
  }

  /**
   * Получение данных из кэша
   * @param {string} key - Ключ кэша
   * @returns {any} - Данные или undefined
   */
  get(key) {
    const item = this.cache.get(key);
    if (!item) return undefined;

    // Проверяем срок жизни кэша
    if (item.expires && item.expires < Date.now()) {
      this.cache.delete(key);
      this._removeFromTags(key);
      return undefined;
    }

    return item.data;
  }

  /**
   * Сохранение данных в кэш
   * @param {string} key - Ключ кэша
   * @param {any} data - Данные для сохранения
   * @param {number} [ttl] - Время жизни в секундах
   * @param {string[]} [tags] - Теги для группировки кеша
   */
  set(key, data, ttl, tags = []) {
    const expires = ttl ? Date.now() + ttl * 1000 : Date.now() + this.defaultTTL * 1000;
    this.cache.set(key, { data, expires, tags });
    
    // Добавляем ключ к соответствующим тегам
    tags.forEach(tag => {
      if (!this.tags.has(tag)) {
        this.tags.set(tag, new Set());
      }
      this.tags.get(tag).add(key);
    });
  }

  /**
   * Удаление данных из кэша
   * @param {string} key - Ключ кэша
   */
  delete(key) {
    const item = this.cache.get(key);
    if (item) {
      this._removeFromTags(key);
    }
    this.cache.delete(key);
  }

  /**
   * Инвалидация кеша по тегам
   * @param {string[]} tags - Теги для инвалидации
   */
  invalidateByTags(tags) {
    tags.forEach(tag => {
      const keys = this.tags.get(tag);
      if (keys) {
        keys.forEach(key => {
          this.cache.delete(key);
        });
        this.tags.delete(tag);
      }
    });
  }

  /**
   * Инвалидация всего кэша каталога
   */
  invalidateCatalogCache() {
    const catalogTags = ['games', 'categories', 'products', 'catalog'];
    this.invalidateByTags(catalogTags);
    
    // Также удаляем все ключи, содержащие catalog-related данные
    const keysToDelete = [];
    for (const [key] of this.cache) {
      if (key.includes('games_with_prices') || 
          key.includes('categories_') || 
          key.includes('products_') ||
          key.includes('catalog_')) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.delete(key));
    console.log(`🗑️ Инвалидирован кэш каталога: удалено ${keysToDelete.length} ключей`);
  }

  /**
   * Очистка кэша
   */
  clear() {
    this.cache.clear();
    this.tags.clear();
  }

  /**
   * Получение данных с кэшированием
   * @param {string} key - Ключ кэша
   * @param {Function} fetchFn - Функция для получения данных, если их нет в кэше
   * @param {number} [ttl] - Время жизни в секундах
   * @param {string[]} [tags] - Теги для группировки кеша
   * @returns {Promise<any>} - Данные
   */
  async getOrSet(key, fetchFn, ttl, tags = []) {
    // Проверяем кэш
    const cachedData = this.get(key);
    if (cachedData !== undefined) {
      return cachedData;
    }

    // Получаем данные из источника
    const data = await fetchFn();

    // Сохраняем в кэш
    this.set(key, data, ttl, tags);

    return data;
  }

  /**
   * Удаление ключа из всех тегов
   * @private
   */
  _removeFromTags(key) {
    this.tags.forEach((keys, tag) => {
      keys.delete(key);
      if (keys.size === 0) {
        this.tags.delete(tag);
      }
    });
  }

  /**
   * Получение статистики кеша
   */
  getStats() {
    return {
      cacheSize: this.cache.size,
      tagsCount: this.tags.size,
      totalTaggedKeys: Array.from(this.tags.values()).reduce((sum, keys) => sum + keys.size, 0)
    };
  }
}

// Создаем экземпляр кэша
const cache = new CacheUtils();

export default cache;