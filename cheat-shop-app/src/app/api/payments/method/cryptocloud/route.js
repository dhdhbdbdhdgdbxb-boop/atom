import { auth } from '@/auth';

export async function POST(request) {
  try {
    const session = await auth();

    // Авторизация
    if (!session?.user?.id) {
      return Response.json(
        {
          success: false,
          error: 'Требуется авторизация',
          code: 'UNAUTHORIZED'
        },
        { status: 401 }
      );
    }

    const { amount, currency } = await request.json();

    // Валидация суммы
    if (!amount || isNaN(amount) || amount <= 0) {
      return Response.json(
        {
          success: false,
          error: 'Некорректная сумма',
          code: 'INVALID_AMOUNT'
        },
        { status: 400 }
      );
    }

    if (!['USD', 'RUB'].includes(currency)) {
      return Response.json(
        {
          success: false,
          error: 'Неподдерживаемая валюта',
          code: 'INVALID_CURRENCY'
        },
        { status: 400 }
      );
    }

    // API данные CryptoCloud
    const API_KEY = process.env.CRYPTOCLOUD_API_KEY;
    const SHOP_ID = process.env.CRYPTOCLOUD_SHOP_ID;
    const API_URL =
      process.env.CRYPTOCLOUD_API_URL ||
      'https://api.cryptocloud.plus/v2/invoice/create';

    if (!API_KEY || !SHOP_ID) {
      return Response.json(
        {
          success: false,
          error: 'CryptoCloud не настроен',
          code: 'CONFIG_ERROR'
        },
        { status: 500 }
      );
    }

    // Формируем тело запроса
    const payload = {
      amount: Number(amount),
      shop_id: SHOP_ID,
      currency: currency,
      order_id: `${session.user.id}_${Date.now()}`, // айди оплаты
      description: `Пополнение баланса для пользователя #${session.user.id}`
    };

    // Делаем запрос в CryptoCloud
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: API_KEY
      },
      body: JSON.stringify(payload)
    });

const raw = await response.text();
console.log("-------- RAW CRYPTOCLOUD RESPONSE --------");
console.log(raw);
console.log("-------- END RAW RESPONSE --------");

// Попробуем преобразовать в JSON
let data;
try {
  data = JSON.parse(raw);
} catch (e) {
  throw new Error(
    "CryptoCloud вернул не JSON. Пришёл HTML, скорее всего это ошибка SSL/403/Cloudflare. RAW показан в логах."
  );
}


    // CryptoCloud вернул ошибку
    if (!data?.success) {
      return Response.json(
        {
          success: false,
          error: data?.message || 'Ошибка платежного провайдера',
          code: 'CRYPTOCLOUD_API_ERROR'
        },
        { status: 400 }
      );
    }

    // Все ок → возвращаем ссылку на оплату
    return Response.json({
      success: true,
      message: 'Счёт успешно создан',
      invoiceId: data.result.invoice_id,
      payUrl: data.result.link
    });

  } catch (error) {
    console.error('CryptoCloud payment error:', error);
    return Response.json(
      {
        success: false,
        error: 'Ошибка сервера',
        code: 'SERVER_ERROR'
      },
      { status: 500 }
    );
  }
}
