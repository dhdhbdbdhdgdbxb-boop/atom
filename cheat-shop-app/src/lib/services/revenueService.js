import prisma from '@/lib/prisma';

class RevenueService {
  /**
   * Записывает доход в таблицу daily_revenue
   * @param {number} amount - Сумма дохода
   * @param {string} currency - Валюта ('USD' или 'RUB')
   */
  async recordRevenue(amount, currency) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Устанавливаем время на начало дня

      // Проверяем, есть ли уже запись за сегодня
      let dailyRevenue = await prisma.dailyRevenue.findUnique({
        where: { date: today }
      });

      if (dailyRevenue) {
        // Обновляем существующую запись
        const updateData = {};
        if (currency.toLowerCase() === 'usd') {
          updateData.revenueUsd = {
            increment: parseFloat(amount)
          };
        } else if (currency.toLowerCase() === 'rub') {
          updateData.revenueRub = {
            increment: parseFloat(amount)
          };
        }

        await prisma.dailyRevenue.update({
          where: { date: today },
          data: updateData
        });
      } else {
        // Создаем новую запись
        const createData = {
          date: today,
          revenueUsd: currency.toLowerCase() === 'usd' ? parseFloat(amount) : 0,
          revenueRub: currency.toLowerCase() === 'rub' ? parseFloat(amount) : 0
        };

        await prisma.dailyRevenue.create({
          data: createData
        });
      }

      console.log(`Revenue recorded: ${amount} ${currency} for ${today.toISOString().split('T')[0]}`);
    } catch (error) {
      console.error('Error recording revenue:', error);
      throw error;
    }
  }

  /**
   * Получает данные о доходах за указанный период
   * @param {number} days - Количество дней назад
   * @returns {Array} Массив данных о доходах
   */
  async getRevenueData(days = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);

      const revenueData = await prisma.dailyRevenue.findMany({
        where: {
          date: {
            gte: startDate
          }
        },
        orderBy: {
          date: 'asc'
        }
      });

      return revenueData;
    } catch (error) {
      console.error('Error fetching revenue data:', error);
      throw error;
    }
  }

  /**
   * Получает общий доход за указанный период
   * @param {number} days - Количество дней назад
   * @returns {Object} Объект с общими доходами в USD и RUB
   */
  async getTotalRevenue(days = 7) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);

      const result = await prisma.dailyRevenue.aggregate({
        where: {
          date: {
            gte: startDate
          }
        },
        _sum: {
          revenueUsd: true,
          revenueRub: true
        }
      });

      return {
        totalUsd: result._sum.revenueUsd || 0,
        totalRub: result._sum.revenueRub || 0
      };
    } catch (error) {
      console.error('Error fetching total revenue:', error);
      throw error;
    }
  }

  /**
   * Получает данные о доходах за указанный диапазон дат
   * @param {Date} startDate - Начальная дата
   * @param {Date} endDate - Конечная дата
   * @returns {Array} Массив данных о доходах
   */
  async getRevenueDataByDateRange(startDate, endDate) {
    try {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const revenueData = await prisma.dailyRevenue.findMany({
        where: {
          date: {
            gte: start,
            lte: end
          }
        },
        orderBy: {
          date: 'asc'
        }
      });

      return revenueData;
    } catch (error) {
      console.error('Error fetching revenue data by date range:', error);
      throw error;
    }
  }

  /**
   * Получает общий доход за указанный диапазон дат
   * @param {Date} startDate - Начальная дата
   * @param {Date} endDate - Конечная дата
   * @returns {Object} Объект с общими доходами в USD и RUB
   */
  async getTotalRevenueByDateRange(startDate, endDate) {
    try {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      const result = await prisma.dailyRevenue.aggregate({
        where: {
          date: {
            gte: start,
            lte: end
          }
        },
        _sum: {
          revenueUsd: true,
          revenueRub: true
        }
      });

      return {
        totalUsd: result._sum.revenueUsd || 0,
        totalRub: result._sum.revenueRub || 0
      };
    } catch (error) {
      console.error('Error fetching total revenue by date range:', error);
      throw error;
    }
  }
}

const revenueService = new RevenueService();
export default revenueService;