import prisma from '@/lib/prisma';

/**
 * Отправляет вебхук в Discord при успешной оплате заказа
 * @param {Object} order - Объект заказа
 * @param {string} order.id - ID заказа
 * @param {number} order.productId - ID продукта
 * @param {number} order.variantId - ID варианта
 * @param {string} order.email - Email пользователя
 * @param {string} order.paymentMethod - Метод оплаты
 * @param {number} order.totalUsd - Сумма в USD
 * @param {number} order.totalRub - Сумма в RUB
 * @param {string} order.status - Статус заказа
 */
export async function sendDiscordWebhook(order) {
  try {
    // Получаем настройки из базы данных
    const settings = await prisma.settings.findFirst();
    
    if (!settings || !settings.discordWebhook) {
      console.log('Discord Webhook URL не настроен');
      return;
    }
    
    // Получаем информацию о продукте и варианте
    const product = await prisma.product.findUnique({
      where: { id: order.productId },
      include: {
        translations: true,
        variants: true
      }
    });
    
    if (!product) {
      console.log('Продукт не найден');
      return;
    }
    
    const variant = product.variants.find(v => v.id === order.variantId);
    
    if (!variant) {
      console.log('Вариант продукта не найден');
      return;
    }
    
    // Получаем русское название продукта
    const ruTranslation = product.translations.find(t => t.language === 'ru');
    const productName = ruTranslation ? ruTranslation.name : product.translations[0]?.name || 'Unknown Product';
    
    // Формируем данные для вебхука
    const webhookData = {
      content: null,
      embeds: [
        {
          title: `New completed order for $${order.totalUsd}`,
          url: `http://localhost:3000/order?orderId=${order.id}`,
          color: 3317247,
          fields: [
            {
              name: "Cheat Name",
              value: `1x, ${productName}, Variant of product at $${order.totalUsd}`
            },
            {
              name: "Payment gateway",
              value: order.paymentMethod
            },
            {
              name: "Order ID",
              value: order.id
            },
            {
              name: "Variant of product",
              value: variant.name || 'Unknown variant'
            },
            {
              name: "The entered email",
              value: order.email
            }
          ],
          timestamp: new Date().toISOString(),
          footer: {
            text: `Order completed at: ${new Date().toLocaleString('en-US', {
              timeZone: 'Europe/Moscow',
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })}`
          }
        }
      ],
      attachments: []
    };
    
    // Отправляем вебхук
    const response = await fetch(settings.discordWebhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookData),
    });
    
    if (!response.ok) {
      console.error('Ошибка при отправке вебхука в Discord:', await response.text());
    } else {
      console.log('Вебхук успешно отправлен в Discord');
    }
    
  } catch (error) {
    console.error('Ошибка при отправке вебхука в Discord:', error);
  }
}

/**
 * Отправляет вебхук при завершении заказа
 * @param {string} orderId - ID заказа
 */
export async function sendOrderCompletedWebhook(orderId) {
  try {
    // Получаем заказ из базы данных
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });
    
    if (!order) {
      console.log('Заказ не найден');
      return;
    }
    
    // Отправляем вебхук только для завершенных заказов
    if (order.status === 'completed') {
      await sendDiscordWebhook(order);
    }
    
  } catch (error) {
    console.error('Ошибка при отправке вебхука о завершении заказа:', error);
  }
}