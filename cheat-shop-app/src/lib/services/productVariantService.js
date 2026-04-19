/**
 * Сервис для работы с вариантами продуктов
 * Новая версия с транзакционной безопасностью и механизмом резервирования ключей
 */

import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import {
  parseKeys,
  getKeysCountText,
  findVariant,
  getMinPrice,
  getAvailableOptions,
  filterVariants,
  validateVariantData,
  isVariantUnique,
  formatPrice
} from '@/lib/utils/variantUtils';

// Экспортируем функцию валидации для использования в других сервисах
export { validateVariantData };

class ProductVariantService {
  /**
   * Получение всех вариантов продукта
   * @param {number} productId - ID продукта
   * @returns {Promise<Array>} - Список вариантов
   */
  async getVariantsByProductId(productId) {
    const variants = await prisma.productVariant.findMany({
      where: { productId },
      orderBy: { sortOrder: 'asc' }
    });

    // Парсим инструкции для каждого варианта
    return variants.map(variant => ({
      ...variant,
      instructions: this.parseInstructions(variant.instructions)
    }));
  }

  /**
   * Получение варианта по ID
   * @param {number} variantId - ID варианта
   * @returns {Promise<Object|null>} - Вариант или null
   */
  async getVariantById(variantId) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId }
    });

    if (!variant) {
      return null;
    }

    return {
      ...variant,
      instructions: this.parseInstructions(variant.instructions)
    };
  }

  /**
   * Создание нового варианта продукта
   * @param {number} productId - ID продукта
   * @param {Object} variantData - Данные варианта
   * @returns {Promise<Object>} - Созданный вариант
   */
  async createVariant(productId, variantData) {
    // Валидация данных
    const validation = validateVariantData(variantData);
    if (!validation.valid) {
      throw new Error(validation.message);
    }

    // Проверка уникальности
    const existingVariants = await this.getVariantsByProductId(productId);
    if (!isVariantUnique(existingVariants, variantData)) {
      throw new Error('Вариант с такими параметрами уже существует');
    }

    // Преобразование данных
    const data = {
      productId,
      type: variantData.type,
      region: variantData.region,
      days: variantData.days,
      daysLabelRu: variantData.daysLabelRu || '',
      daysLabelEn: variantData.daysLabelEn || '',
      priceUsd: parseFloat(variantData.priceUsd || 0),
      priceRub: parseFloat(variantData.priceRub || 0),
      keys: Array.isArray(variantData.keys) ? JSON.stringify(variantData.keys) : (variantData.keys || ''),
      isActive: variantData.isActive !== undefined ? variantData.isActive : true,
      sortOrder: variantData.sortOrder || 0,
      instructions: this.formatInstructions(variantData.instructions)
    };

    return await prisma.productVariant.create({
      data
    });
  }

  /**
   * Обновление варианта продукта
   * @param {number} variantId - ID варианта
   * @param {Object} variantData - Данные для обновления
   * @returns {Promise<Object>} - Обновленный вариант
   */
  async updateVariant(variantId, variantData) {
    // Валидация данных
    const validation = validateVariantData(variantData);
    if (!validation.valid) {
      throw new Error(validation.message);
    }

    // Проверка уникальности (исключая текущий вариант)
    const existingVariant = await this.getVariantById(variantId);
    if (!existingVariant) {
      throw new Error('Вариант не найден');
    }

    const existingVariants = await this.getVariantsByProductId(existingVariant.productId);
    if (!isVariantUnique(existingVariants, variantData, variantId)) {
      throw new Error('Вариант с такими параметрами уже существует');
    }

    // Преобразование данных
    const data = {
      type: variantData.type,
      region: variantData.region,
      days: variantData.days,
      daysLabelRu: variantData.daysLabelRu || '',
      daysLabelEn: variantData.daysLabelEn || '',
      priceUsd: parseFloat(variantData.priceUsd || variantData.price || 0),
      priceRub: parseFloat(variantData.priceRub || variantData.price || 0),
      keys: Array.isArray(variantData.keys) ? JSON.stringify(variantData.keys) : (variantData.keys || ''),
      isActive: variantData.isActive !== undefined ? variantData.isActive : existingVariant.isActive,
      sortOrder: variantData.sortOrder !== undefined ? variantData.sortOrder : existingVariant.sortOrder,
      instructions: this.formatInstructions(variantData.instructions)
    };

    return await prisma.productVariant.update({
      where: { id: variantId },
      data
    });
  }

  /**
   * Удаление варианта продукта
   * @param {number} variantId - ID варианта
   * @returns {Promise<Object>} - Удаленный вариант
   */
  async deleteVariant(variantId) {
    return await prisma.productVariant.delete({
      where: { id: variantId }
    });
  }

  /**
   * Поиск варианта по параметрам
   * @param {number} productId - ID продукта
   * @param {Object} params - Параметры поиска
   * @returns {Promise<Object|null>} - Найденный вариант или null
   */
  async findVariant(productId, params) {
    const variants = await this.getVariantsByProductId(productId);
    return findVariant(variants, params);
  }

  /**
   * Получение минимальной цены для продукта
   * @param {number} productId - ID продукта
   * @param {Object} [params] - Параметры фильтрации
   * @returns {Promise<number>} - Минимальная цена
   */
  async getMinPrice(productId, params = {}) {
    const variants = await this.getVariantsByProductId(productId);
    const { language = 'ru' } = params;
    
    const filteredVariants = filterVariants(variants, params);
    if (filteredVariants.length === 0) {
      return 0;
    }

    // Определяем цену в зависимости от языка
    const prices = filteredVariants.map(v => {
      return language === 'en' ? parseFloat(v.priceUsd || 0) : parseFloat(v.priceRub || 0);
    });

    return Math.min(...prices);
  }

  /**
   * Получение минимальной цены для игры
   * @param {number} gameId - ID игры
   * @returns {Promise<number>} - Минимальная цена
   */
  async getMinPriceForGame(gameId, language = 'ru') {
    const products = await prisma.product.findMany({
      where: {
        gameId,
        isActive: true
      },
      select: { id: true }
    });

    if (products.length === 0) {
      return 0;
    }

    const minPrices = await Promise.all(
      products.map(product => this.getMinPrice(product.id, { language }))
    );

    return Math.min(...minPrices);
  }

  /**
   * Получение минимальной цены для категории
   * @param {number} categoryId - ID категории
   * @returns {Promise<number>} - Минимальная цена
   */
  async getMinPriceForCategory(categoryId, language = 'ru') {
    const products = await prisma.product.findMany({
      where: {
        categoryId,
        isActive: true
      },
      select: { id: true }
    });

    if (products.length === 0) {
      return 0;
    }

    const minPrices = await Promise.all(
      products.map(product => this.getMinPrice(product.id, { language }))
    );

    return Math.min(...minPrices);
  }

  /**
   * Получение доступных опций для продукта
   * @param {number} productId - ID продукта
   * @returns {Promise<Object>} - Доступные опции
   */
  async getAvailableOptions(productId) {
    const variants = await this.getVariantsByProductId(productId);
    return getAvailableOptions(variants);
  }

  /**
   * Обновление порядка сортировки вариантов
   * @param {Array} updates - Массив обновлений {id, sortOrder}
   * @returns {Promise<Array>} - Обновленные варианты
   */
  async reorderVariants(updates) {
    return await Promise.all(
      updates.map(update =>
        prisma.productVariant.update({
          where: { id: update.id },
          data: { sortOrder: update.sortOrder }
        })
      )
    );
  }

  /**
   * Получение информации о ключах для варианта
   * @param {number} variantId - ID варианта
   * @returns {Promise<Object>} - Информация о ключах
   */
  async getKeysInfo(variantId) {
    const variant = await this.getVariantById(variantId);
    if (!variant) {
      throw new Error('Вариант не найден');
    }

    const keys = parseKeys(variant.keys);
    return {
      count: keys.length,
      text: getKeysCountText(variant.keys),
      keys,
      instructions: variant.instructions
    };
  }

  /**
   * Проверка наличия свободных ключей для варианта
   * @param {number} variantId - ID варианта
   * @param {number} quantity - Количество ключей
   * @returns {Promise<boolean>} - Достаточно ли ключей
   */
  async checkAvailableKeys(variantId, quantity) {
    const variant = await prisma.productVariant.findUnique({
      where: { id: variantId },
    });

    if (!variant) {
      throw new Error('Вариант не найден');
    }

    const keys = parseKeys(variant.keys);
    return keys.length >= quantity;
  }

  /**
   * Получение и удаление ключей для заказа (без резервирования)
   * @param {number} variantId - ID варианта
   * @param {number} quantity - Количество ключей
   * @returns {Promise<Array<string>|null>} - Массив ключей или null, если ключей недостаточно
   */
  async getKeysForOrder(variantId, quantity) {
    return await prisma.$transaction(async (tx) => {
      // Блокируем вариант для предотвращения race condition
      const variant = await tx.productVariant.findUnique({
        where: { id: variantId },
      });

      if (!variant) {
        throw new Error('Вариант не найден');
      }

      const keys = parseKeys(variant.keys);

      // Проверяем, есть ли достаточно ключей
      if (keys.length < quantity) {
        return null;
      }

      // Получаем первые quantity ключей из массива
      const keysToReturn = keys.slice(0, quantity);

      // Удаляем использованные ключи из базы данных
      const updatedKeys = keys.filter(key => !keysToReturn.includes(key));

      // Обновляем вариант с новым списком ключей
      await tx.productVariant.update({
        where: { id: variantId },
        data: {
          keys: JSON.stringify(updatedKeys)
        }
      });

      return keysToReturn;
    });
  }

  /**
   * Подтверждение использования зарезервированных ключей
   * @param {string} orderId - ID заказа
   * @returns {Promise<Array<string>>} - Массив подтвержденных ключей
   */
  async confirmReservedKeys(orderId) {
    return await prisma.$transaction(async (tx) => {
      // Находим все зарезервированные ключи для данного заказа
      const reservedKeys = await tx.reservedKey.findMany({
        where: {
          orderId,
          status: 'reserved'
        }
      });

      if (reservedKeys.length === 0) {
        return [];
      }

      // Обновляем статус ключей на 'used'
      await tx.reservedKey.updateMany({
        where: {
          orderId,
          status: 'reserved'
        },
        data: {
          status: 'used',
          usedAt: new Date()
        }
      });

      return reservedKeys.map(rk => rk.key);
    });
  }

  /**
   * Отмена резервирования ключей (если заказ не завершен)
   * @param {string} orderId - ID заказа
   * @returns {Promise<Array<string>>} - Массив отмененных ключей
   */
  async cancelReservedKeys(orderId) {
    return await prisma.$transaction(async (tx) => {
      // Находим все зарезервированные ключи для данного заказа
      const reservedKeys = await tx.reservedKey.findMany({
        where: {
          orderId,
          status: 'reserved'
        }
      });

      if (reservedKeys.length === 0) {
        return [];
      }

      // Получаем вариант для возврата ключей
      const variantId = reservedKeys[0].variantId;
      const variant = await tx.productVariant.findUnique({
        where: { id: variantId }
      });

      if (!variant) {
        throw new Error('Вариант не найден');
      }

      const currentKeys = parseKeys(variant.keys);

      // Добавляем ключи обратно в вариант
      const restoredKeys = [...currentKeys, ...reservedKeys.map(rk => rk.key)];

      await tx.productVariant.update({
        where: { id: variantId },
        data: {
          keys: JSON.stringify(restoredKeys)
        }
      });

      // Обновляем статус ключей на 'cancelled'
      await tx.reservedKey.updateMany({
        where: {
          orderId,
          status: 'reserved'
        },
        data: {
          status: 'cancelled',
          cancelledAt: new Date()
        }
      });

      return reservedKeys.map(rk => rk.key);
    });
  }

  /**
   * Получение одного свободного ключа для варианта (старая функция для совместимости)
   * @param {number} variantId - ID варианта
   * @returns {Promise<string|null>} - Один свободный ключ или null, если ключей нет
   */
  async getSingleAvailableKey(variantId) {
    const variant = await this.getVariantById(variantId);
    if (!variant) {
      throw new Error('Вариант не найден');
    }

    const keys = parseKeys(variant.keys);
    
    // Проверяем, есть ли ключи
    if (keys.length === 0) {
      return null;
    }
  
    // Получаем первый ключ из массива
    const keyToReturn = keys[0];
    
    // Удаляем использованный ключ из базы данных
    await this.removeUsedKey(variantId, keyToReturn);
    
    // Возвращаем ключ
    return keyToReturn;
  }

  /**
   * Получение нескольких свободных ключей для варианта (старая функция для совместимости)
   * @param {number} variantId - ID варианта
   * @param {number} quantity - Количество ключей
   * @returns {Promise<Array<string>|null>} - Массив свободных ключей или null, если ключей недостаточно
   */
  async getMultipleAvailableKeys(variantId, quantity) {
    const variant = await this.getVariantById(variantId);
    if (!variant) {
      throw new Error('Вариант не найден');
    }

    const keys = parseKeys(variant.keys);
    
    // Проверяем, есть ли достаточно ключей
    if (keys.length < quantity) {
      return null;
    }
  
    // Получаем первые quantity ключей из массива
    const keysToReturn = keys.slice(0, quantity);
    
    // Удаляем использованные ключи из базы данных
    for (const key of keysToReturn) {
      await this.removeUsedKey(variantId, key);
    }
    
    // Возвращаем ключи
    return keysToReturn;
  }

  /**
   * Удаление использованного ключа из варианта
   * @param {number} variantId - ID варианта
   * @param {string} keyToRemove - Ключ для удаления
   * @returns {Promise<Object>} - Обновленный вариант
   */
  async removeUsedKey(variantId, keyToRemove) {
    const variant = await this.getVariantById(variantId);
    if (!variant) {
      throw new Error('Вариант не найден');
    }

    const keys = parseKeys(variant.keys);
    
    // Удаляем использованный ключ
    const updatedKeys = keys.filter(key => key !== keyToRemove);
    
    // Обновляем вариант с новым списком ключей
    return await prisma.productVariant.update({
      where: { id: variantId },
      data: {
        keys: JSON.stringify(updatedKeys)
      }
    });
  }

  /**
   * Форматирование инструкций для сохранения в базу данных
   * @param {Object|string|null} instructions - Инструкции в виде объекта или строки
   * @returns {string|null} - Отформатированная строка для сохранения
   */
  formatInstructions(instructions) {
    if (!instructions) {
      return '';
    }

    // Если это уже строка, возвращаем как есть
    if (typeof instructions === 'string') {
      return instructions;
    }

    // Если это объект с ru и en полями, конвертируем в формат "RU: ... | EN: ..."
    if (typeof instructions === 'object') {
      const ru = instructions.ru || '';
      const en = instructions.en || '';
      
      // Форматируем инструкции в формат "RU: ... | EN: ..."
      return `RU: ${ru.trim()} | EN: ${en.trim()}`;
    }

    return '';
  }

  /**
   * Парсинг инструкций из строки в объект
   * @param {string|null} instructions - Инструкции в строковом формате
   * @returns {string} - Простая строка с инструкциями
   */
  parseInstructions(instructions) {
    if (!instructions || typeof instructions !== 'string') {
      return '';
    }

    // Возвращаем строку как есть, удаляя префиксы RU: и EN: если они есть
    return instructions.replace(/RU:\s*|EN:\s*|\|/g, '').trim();
  }
}

// Создаем экземпляр и присваиваем переменной
const productVariantService = new ProductVariantService();

// Экспортируем экземпляр
export default productVariantService;