import { UserService } from '@/lib/userService';
import jwt from 'jsonwebtoken';

// Коды ошибок для клиента
const ErrorCodes = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR'
};

// Секретный ключ для JWT (в продакшене используйте переменные окружения)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    // Валидация
    if (!email || !password) {
      return Response.json(
        { 
          success: false, 
          error: 'Все поля обязательны для заполнения',
          code: ErrorCodes.VALIDATION_ERROR 
        },
        { status: 400 }
      );
    }

    // Ищем пользователя по email с балансом
    const user = await UserService.findByEmailWithBalance(email);

    if (!user) {
      return Response.json(
        { 
          success: false, 
          error: 'Неверный email или пароль',
          code: ErrorCodes.INVALID_CREDENTIALS 
        },
        { status: 401 }
      );
    }

    // Проверяем пароль
    const isPasswordValid = await UserService.verifyPassword(user, password);

    if (!isPasswordValid) {
      return Response.json(
        { 
          success: false, 
          error: 'Неверный email или пароль',
          code: ErrorCodes.INVALID_CREDENTIALS 
        },
        { status: 401 }
      );
    }

    // Создаем JWT токен
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email,
        username: user.username
      },
      JWT_SECRET,
      { expiresIn: '7d' } // Токен действителен 7 дней
    );

    // Обновляем последний вход пользователя
    await UserService.updateLastLogin(user.id);

    return Response.json({
      success: true,
      message: 'Вход выполнен успешно',
      token: token,
      userId: user.id,
      username: user.username,
      email: user.email,
      balanceUsd: user.balanceUsd,
      balanceRub: user.balanceRub
    });

  } catch (error) {
    console.error('Login error:', error);
    
    return Response.json(
      { 
        success: false, 
        error: 'Внутренняя ошибка сервера',
        code: ErrorCodes.SERVER_ERROR 
      },
      { status: 500 }
    );
  }
}