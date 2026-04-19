import { auth } from '../../../../auth';
import { UserService } from '../../../../lib/userService';

// POST - Обновление баланса пользователя
export async function POST(request) {
  try {
    // Проверяем сессию NextAuth
    const session = await auth();
    
    if (!session || !session.user) {
      return Response.json(
        { 
          success: false, 
          error: 'Пользователь не авторизован',
          code: 'UNAUTHORIZED' 
        },
        { status: 401 }
      );
    }

    const { balanceUsd, balanceRub, defaultCurrency, increment = false } = await request.json();
    
    // Валидация
    if (balanceUsd !== undefined && (typeof balanceUsd !== 'number' || balanceUsd < 0)) {
      return Response.json(
        { 
          success: false, 
          error: 'Некорректный баланс USD',
          code: 'VALIDATION_ERROR' 
        },
        { status: 400 }
      );
    }

    if (balanceRub !== undefined && (typeof balanceRub !== 'number' || balanceRub < 0)) {
      return Response.json(
        { 
          success: false, 
          error: 'Некорректный баланс RUB',
          code: 'VALIDATION_ERROR' 
        },
        { status: 400 }
      );
    }

    if (defaultCurrency && !['USD', 'RUB'].includes(defaultCurrency)) {
      return Response.json(
        { 
          success: false, 
          error: 'Недопустимая валюта по умолчанию',
          code: 'VALIDATION_ERROR' 
        },
        { status: 400 }
      );
    }

    // Обновляем баланс пользователя
    let user;
    if (increment) {
      // Инкрементальное обновление баланса
      const incrementData = {};
      if (balanceUsd !== undefined) incrementData.balanceUsd = balanceUsd;
      if (balanceRub !== undefined) incrementData.balanceRub = balanceRub;
      
      user = await UserService.incrementUserBalance(parseInt(session.user.id), incrementData);
    } else {
      // Стандартное обновление баланса
      const updateData = {};
      if (balanceUsd !== undefined) updateData.balanceUsd = balanceUsd;
      if (balanceRub !== undefined) updateData.balanceRub = balanceRub;
      
      user = await UserService.updateUserBalance(parseInt(session.user.id), updateData);
    }

    return Response.json({
      success: true,
      message: 'Баланс успешно обновлен',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        balanceUsd: user.balanceUsd,
        balanceRub: user.balanceRub
      }
    });

  } catch (error) {
    console.error('Update balance error:', error);
    
    // Специальная обработка ошибок подключения к БД
    if (error.message === 'Database temporarily unavailable. Please try again later.') {
      return Response.json(
        { 
          success: false, 
          error: 'База данных временно недоступна. Попробуйте позже.',
          code: 'DATABASE_UNAVAILABLE' 
        },
        { status: 503 }
      );
    }
    
    return Response.json(
      { 
        success: false, 
        error: 'Внутренняя ошибка сервера',
        code: 'SERVER_ERROR' 
      },
      { status: 500 }
    );
  }
}

// GET - Получение баланса пользователя
export async function GET(request) {
  try {
    // Проверяем сессию NextAuth
    const session = await auth();
    
    if (!session || !session.user) {
      return Response.json(
        { 
          success: false, 
          error: 'Пользователь не авторизован',
          code: 'UNAUTHORIZED' 
        },
        { status: 401 }
      );
    }

    // Получаем пользователя с балансом
    const user = await UserService.findById(parseInt(session.user.id));

    if (user === null) {
      // База данных недоступна
      return Response.json(
        { 
          success: false, 
          error: 'База данных временно недоступна',
          code: 'DATABASE_UNAVAILABLE' 
        },
        { status: 503 }
      );
    }

    if (!user) {
      return Response.json(
        { 
          success: false, 
          error: 'Пользователь не найден',
          code: 'USER_NOT_FOUND' 
        },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      balance: {
        balanceUsd: user.balanceUsd,
        balanceRub: user.balanceRub
      }
    });

  } catch (error) {
    console.error('Get balance error:', error);
    
    // Специальная обработка ошибок подключения к БД
    if (error.message === 'Database temporarily unavailable. Please try again later.') {
      return Response.json(
        { 
          success: false, 
          error: 'База данных временно недоступна. Попробуйте позже.',
          code: 'DATABASE_UNAVAILABLE' 
        },
        { status: 503 }
      );
    }
    
    return Response.json(
      { 
        success: false, 
        error: 'Внутренняя ошибка сервера',
        code: 'SERVER_ERROR' 
      },
      { status: 500 }
    );
  }
}
