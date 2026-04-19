import prisma from '@/lib/prisma';

class PaymentFeeService {
  /**
   * Получить комиссию для платежного метода
   * @param {string} paymentMethod - Метод оплаты
   * @returns {Promise<Object|null>} Объект с комиссией или null
   */
  async getPaymentFee(paymentMethod) {
    try {
      const paymentFee = await prisma.paymentFee.findUnique({
        where: { 
          paymentMethod: paymentMethod
        }
      });

      // Возвращаем только если активна
      return paymentFee?.isActive ? paymentFee : null;
    } catch (error) {
      console.error('Error getting payment fee:', error);
      return null;
    }
  }

  /**
   * Рассчитать итоговую сумму с комиссией
   * @param {number} baseAmount - Базовая сумма товара
   * @param {string} currency - Валюта (usd/rub)
   * @param {string} paymentMethod - Метод оплаты
   * @returns {Promise<Object>} Объект с расчетами
   */
  async calculateTotalWithFee(baseAmount, currency, paymentMethod) {
    try {
      const paymentFee = await this.getPaymentFee(paymentMethod);
      
      if (!paymentFee) {
        // Если комиссия не найдена, возвращаем базовую сумму без изменений
        return {
          baseAmount: parseFloat(baseAmount),
          percentageFee: 0,
          fixedFee: 0,
          totalFee: 0,
          totalAmount: parseFloat(baseAmount),
          currency: currency.toUpperCase(),
          paymentMethod
        };
      }

      const baseAmountFloat = parseFloat(baseAmount);
      const percentageFeeFloat = parseFloat(paymentFee.percentageFee);
      
      // Выбираем фиксированную комиссию в зависимости от валюты
      const fixedFee = currency.toLowerCase() === 'usd' 
        ? parseFloat(paymentFee.fixedFeeUsd)
        : parseFloat(paymentFee.fixedFeeRub);

      // Рассчитываем процентную комиссию
      const percentageFeeAmount = (baseAmountFloat * percentageFeeFloat) / 100;
      
      // Общая комиссия = процентная + фиксированная
      const totalFee = percentageFeeAmount + fixedFee;
      
      // Итоговая сумма = базовая сумма + общая комиссия
      const totalAmount = baseAmountFloat + totalFee;

      return {
        baseAmount: baseAmountFloat,
        percentageFee: percentageFeeAmount,
        fixedFee: fixedFee,
        totalFee: totalFee,
        totalAmount: totalAmount,
        currency: currency.toUpperCase(),
        paymentMethod,
        feeSettings: {
          percentageRate: percentageFeeFloat,
          fixedFeeUsd: parseFloat(paymentFee.fixedFeeUsd),
          fixedFeeRub: parseFloat(paymentFee.fixedFeeRub)
        }
      };
    } catch (error) {
      console.error('Error calculating total with fee:', error);
      
      // В случае ошибки возвращаем базовую сумму
      return {
        baseAmount: parseFloat(baseAmount),
        percentageFee: 0,
        fixedFee: 0,
        totalFee: 0,
        totalAmount: parseFloat(baseAmount),
        currency: currency.toUpperCase(),
        paymentMethod,
        error: error.message
      };
    }
  }

  /**
   * Получить все активные платежные методы с комиссиями
   * @returns {Promise<Array>} Массив платежных методов
   */
  async getAllActivePaymentFees() {
    try {
      const paymentFees = await prisma.paymentFee.findMany({
        where: { isActive: true },
        orderBy: { paymentMethod: 'asc' }
      });

      return paymentFees;
    } catch (error) {
      console.error('Error getting all payment fees:', error);
      return [];
    }
  }

  /**
   * Рассчитать комиссии для всех доступных методов оплаты
   * @param {number} baseAmountUsd - Базовая сумма в USD
   * @param {number} baseAmountRub - Базовая сумма в RUB
   * @returns {Promise<Object>} Объект с расчетами для всех методов
   */
  async calculateFeesForAllMethods(baseAmountUsd, baseAmountRub) {
    try {
      const paymentFees = await this.getAllActivePaymentFees();
      const calculations = {};

      for (const paymentFee of paymentFees) {
        // Рассчитываем для USD
        const usdCalculation = await this.calculateTotalWithFee(
          baseAmountUsd, 
          'usd', 
          paymentFee.paymentMethod
        );

        // Рассчитываем для RUB
        const rubCalculation = await this.calculateTotalWithFee(
          baseAmountRub, 
          'rub', 
          paymentFee.paymentMethod
        );

        calculations[paymentFee.paymentMethod] = {
          usd: usdCalculation,
          rub: rubCalculation,
          isActive: paymentFee.isActive
        };
      }

      return calculations;
    } catch (error) {
      console.error('Error calculating fees for all methods:', error);
      return {};
    }
  }
}

export default new PaymentFeeService();