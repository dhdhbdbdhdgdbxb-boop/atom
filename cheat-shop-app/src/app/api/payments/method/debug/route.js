import { auth } from '@/auth';
import { UserService } from '@/lib/userService';
import prisma from '@/lib/prisma';

export async function POST(request) {
  // Проверка DEBUG режима
  if (process.env.DEBUG !== 'true') {
    return Response.json(
      { 
        success: false, 
        error: 'Debug метод оплаты отключен',
        code: 'DEBUG_METHOD_DISABLED' 
      },
      { status: 403 }
    );
  }

  try {
    // Проверяем сессию пользователя
    const session = await auth();
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
    const userId = parseInt(session.user.id);

    // Валидация данных
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

    // Обновляем баланс пользователя
    const updatedUser = await UserService.incrementUserBalance(
      userId,
      {
        balanceUsd: currency === 'USD' ? parseFloat(amount) : 0,
        balanceRub: currency === 'RUB' ? parseFloat(amount) : 0
      }
    );

    // Пытаемся связать заказ с пользователем, если он авторизован
    try {
      const session2 = await auth();
      if (session2?.user?.id) {
        const sessionUserId = parseInt(session2.user.id);
        // Ищем заказ по userId и дате (формат: "userid_timestamp")
        const orderId = `${userId}_${Date.now()}`;
        const order = await prisma.order.findUnique({
          where: { id: orderId }
        });
        
        // Если заказ найден и у него нет userId, обновляем его
        if (order && !order.userId) {
          await prisma.order.update({
            where: { id: orderId },
            data: { userId: sessionUserId }
          });
          console.log('Order linked to user:', sessionUserId);
        }
      }
    } catch (error) {
      console.error('Error linking order to user:', error);
    }


    return Response.json({
      success: true,
      message: 'Баланс успешно пополнен',
      balance: {
        usd: parseFloat(updatedUser.balanceUsd),
        rub: parseFloat(updatedUser.balanceRub)
      }
    });

  } catch (error) {
    console.error('Debug payment error:', error);
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