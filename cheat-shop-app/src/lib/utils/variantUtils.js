/**
 * Утилиты для работы с вариантами продуктов
 */

/**
 * Безопасный парсинг ключей из строки
 * @param {string} keysStr - Строка с ключами (JSON массив или один на строку)
 * @returns {Array} - Массив ключей
 */
function parseKeys(keysStr) {
  if (!keysStr) return [];

  try {
    // Пробуем парсить как JSON
    const parsed = JSON.parse(keysStr);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [parsed];
  } catch (e) {
    // Если не JSON, то считаем, что один ключ на строку
    return keysStr.split('\n').filter(key => key.trim() !== '');
  }
}

/**
 * Получение количества ключей с безопасным парсингом
 * @param {string} keysStr - Строка с ключами
 * @returns {string} - Текст для отображения
 */
function getKeysCountText(keysStr) {
  if (!keysStr) return 'Нет ключей';

  try {
    const keys = parseKeys(keysStr);
    return `Доступно ключей: ${keys.length}`;
  } catch (e) {
    console.error('Ошибка парсинга ключей:', e);
    return 'Ошибка в формате ключей';
  }
}

/**
 * Поиск варианта по параметрам
 * @param {Array} variants - Список вариантов
 * @param {Object} params - Параметры поиска
 * @param {string} [params.type] - Тип варианта (Lite/Full)
 * @param {string} [params.region] - Регион (CIS/Global)
 * @param {number} [params.days] - Длительность в днях
 * @returns {Object|null} - Найденный вариант или null
 */
function findVariant(variants, params = {}) {
  const { type, region, days } = params;

  return variants.find(variant =>
    (!type || variant.type.toLowerCase() === type.toLowerCase()) &&
    (!region || variant.region.toLowerCase() === region.toLowerCase()) &&
    (!days || variant.days === days) &&
    variant.isActive
  );
}

/**
 * Получение минимальной цены из вариантов
 * @param {Array} variants - Список вариантов
 * @param {Object} [params] - Параметры фильтрации
 * @returns {number} - Минимальная цена
 */
function getMinPrice(variants, params = {}) {
  const filteredVariants = filterVariants(variants, params);
  if (filteredVariants.length === 0) {
    return 0;
  }

  return Math.min(...filteredVariants.map(v => parseFloat(v.price)));
}

/**
 * Получение доступных опций для вариантов
 * @param {Array} variants - Список вариантов
 * @returns {Object} - Доступные опции
 */
function getAvailableOptions(variants) {
  const types = [...new Set(variants.map(v => v.type))];
  const regions = [...new Set(variants.map(v => v.region))];
  const days = [...new Set(variants.map(v => v.days))];

  return {
    types,
    regions,
    days
  };
}

/**
 * Фильтрация вариантов по параметрам
 * @param {Array} variants - Список вариантов
 * @param {Object} params - Параметры фильтрации
 * @param {string} [params.type] - Тип варианта
 * @param {string} [params.region] - Регион
 * @param {number} [params.days] - Длительность в днях
 * @param {boolean} [params.isActive] - Только активные варианты
 * @returns {Array} - Отфильтрованные варианты
 */
function filterVariants(variants, params = {}) {
  const { type, region, days, isActive = true } = params;

  return variants.filter(variant => {
    return (!type || variant.type.toLowerCase() === type.toLowerCase()) &&
           (!region || variant.region.toLowerCase() === region.toLowerCase()) &&
           (!days || variant.days === days) &&
           (isActive === undefined || variant.isActive === isActive);
  });
}

/**
 * Валидация данных варианта
 * @param {Object} variantData - Данные варианта
 * @returns {Object} - Результат валидации
 */
function validateVariantData(variantData) {
  const errors = [];

  // Валидация типа (принимаем как в верхнем, так и в нижнем регистре)
  const validTypes = ['Lite', 'Full', 'lite', 'full'];
  if (!variantData.type || !validTypes.includes(variantData.type)) {
    errors.push('Тип должен быть Lite или Full');
  }

  // Валидация региона (принимаем как в верхнем, так и в нижнем регистре)
  const validRegions = ['CIS', 'Global', 'cis', 'global'];
  if (!variantData.region || !validRegions.includes(variantData.region)) {
    errors.push('Регион должен быть CIS или Global');
  }

  // Валидация дней
  if (!variantData.days || ![1, 3, 7, 30].includes(Number(variantData.days))) {
    errors.push('Длительность должна быть 1, 3, 7 или 30 дней');
  }

  // Валидация цены
  const price = variantData.price !== undefined ? variantData.price : (variantData.priceUsd || variantData.priceRub);
  if (price === undefined || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
    errors.push('Цена должна быть положительным числом');
  }

  // Валидация валюты
  if (variantData.currency && !['RUB', 'USD'].includes(variantData.currency)) {
    errors.push('Валюта должна быть RUB или USD');
  }

  return {
    valid: errors.length === 0,
    errors,
    message: errors.length > 0 ? errors.join(', ') : 'Валидация пройдена успешно'
  };
}

/**
 * Проверка уникальности варианта
 * @param {Array} variants - Существующие варианты
 * @param {Object} variantData - Данные нового варианта
 * @param {number} [excludeId] - ID варианта для исключения (при редактировании)
 * @returns {boolean} - Уникален ли вариант
 */
function isVariantUnique(variants, variantData, excludeId = null) {
  return !variants.some(v =>
    v.id !== excludeId &&
    v.type === variantData.type &&
    v.region === variantData.region &&
    v.days === variantData.days
  );
}

/**
 * Форматирование цены с валютой
 * @param {number} price - Цена
 * @param {string} currency - Валюта
 * @param {string} [language] - Язык (опционально, для отображения значка валюты)
 * @returns {string} - Отформатированная цена
 */
function formatPrice(price, currency, language = 'ru') {
  const numericPrice = parseFloat(price);

  if (isNaN(numericPrice)) {
    return '0';
  }

  switch (currency) {
    case 'USD':
      return `$${numericPrice.toFixed(2)}`;
    case 'RUB':
    default:
      return `${Math.round(numericPrice)} ₽`;
  }
}

export {
  parseKeys,
  getKeysCountText,
  findVariant,
  getMinPrice,
  getAvailableOptions,
  filterVariants,
  validateVariantData,
  isVariantUnique,
  formatPrice
};