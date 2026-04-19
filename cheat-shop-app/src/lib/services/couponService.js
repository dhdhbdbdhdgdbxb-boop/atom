/**
 * Сервис для работы с купонами
 */

import prisma from '@/lib/prisma';

class CouponService {
  /**
   * Создание нового купона
   * @param {Object} couponData - Данные купона
   * @returns {Promise<Object>} - Созданный купон
   */
  async createCoupon(couponData) {
    const { code, discount, expiresAt, maxUses, productIds } = couponData;

    // Преобразуем массив productIds в строку
    const games = productIds && productIds.length > 0 ? JSON.stringify(productIds) : '[]';

    return await prisma.coupon.create({
      data: {
        code,
        discount,
        expiresAt: new Date(expiresAt),
        maxUses: maxUses || 0,
        games
      }
    });
  }

  /**
   * Получение всех купонов
   * @returns {Promise<Array>} - Список купонов
   */
  async getAllCoupons() {
    return await prisma.coupon.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  /**
   * Получение купона по ID
   * @param {number} couponId - ID купона
   * @returns {Promise<Object|null>} - Купон или null
   */
  async getCouponById(couponId) {
    return await prisma.coupon.findUnique({
      where: { id: couponId }
    });
  }

  /**
   * Получение купона по коду
   * @param {string} code - Код купона
   * @returns {Promise<Object|null>} - Купон или null
   */
  async getCouponByCode(code) {
    return await prisma.coupon.findUnique({
      where: { code }
    });
  }

  /**
   * Обновление купона
   * @param {number} couponId - ID купона
   * @param {Object} couponData - Данные для обновления
   * @returns {Promise<Object>} - Обновленный купон
   */
  async updateCoupon(couponId, couponData) {
    const { code, discount, expiresAt, maxUses, productIds } = couponData;

    // Преобразуем массив productIds в строку
    const games = productIds && productIds.length > 0 ? JSON.stringify(productIds) : '[]';

    return await prisma.coupon.update({
      where: { id: couponId },
      data: {
        code,
        discount,
        expiresAt: new Date(expiresAt),
        maxUses: maxUses || 0,
        games
      }
    });
  }

  /**
   * Удаление купона
   * @param {number} couponId - ID купона
   * @returns {Promise<Object>} - Удаленный купон
   */
  async deleteCoupon(couponId) {
    return await prisma.coupon.delete({
      where: { id: couponId }
    });
  }

  /**
   * Проверка купона
   * @param {string} code - Код купона
   * @param {number} gameId - ID игры
   * @returns {Promise<Object>} - Результат проверки
   */
  async validateCoupon(code, productId) {
    const coupon = await this.getCouponByCode(code);

    if (!coupon) {
      return { valid: false, error: 'Coupon not found' };
    }

    if (!coupon.isActive) {
      return { valid: false, error: 'Coupon is not active' };
    }

    if (new Date() > new Date(coupon.expiresAt)) {
      return { valid: false, error: 'Coupon has expired' };
    }

    if (coupon.maxUses > 0 && coupon.currentUses >= coupon.maxUses) {
      return { valid: false, error: 'Coupon usage limit reached' };
    }

    // Проверяем, доступен ли купон для данного товара
    const products = JSON.parse(coupon.games);
    if (products.length > 0 && !products.includes(productId)) {
      return { valid: false, error: 'Coupon not valid for this product' };
    }

    return { valid: true, coupon };
  }

  /**
   * Увеличение счётчика использования купона
   * @param {string} code - Код купона
   * @returns {Promise<Object>} - Обновленный купон
   */
  async incrementCouponUsage(code) {
    // Получаем текущий купон для логирования
    const coupon = await this.getCouponByCode(code);
    
    // Обновляем счетчик использования
    const updatedCoupon = await prisma.coupon.update({
      where: { code },
      data: {
        currentUses: {
          increment: 1
        }
      }
    });
    
    // Логируем использование купона
    await prisma.log.create({
      data: {
        user: 'system',
        timestamp: BigInt(Date.now()),
        description: `Использование купона: Code=${code}, Discount=${coupon.discount}%, CurrentUses=${updatedCoupon.currentUses}`
      }
    });
    
    return updatedCoupon;
  }
}

// Создаем экземпляр и присваиваем переменной
const couponService = new CouponService();

// Экспортируем экземпляр
export default couponService;

// Экспортируем функцию проверки купона для использования в API
 export const validateCoupon = couponService.validateCoupon.bind(couponService);