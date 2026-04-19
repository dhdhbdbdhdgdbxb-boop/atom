import { UserService } from '@/lib/userService';
import { createToken } from '@/lib/auth';

// Коды ошибок для клиента
const ErrorCodes = {
  USER_EXISTS: 'USER_EXISTS',
  EMAIL_EXISTS: 'EMAIL_EXISTS',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR'
};

export async function POST(request) {
  try {
    const { username, email, password } = await request.json();

    // Валидация
    if (!username || !email || !password) {
      return Response.json(
        { 
          success: false, 
          error: 'Все поля обязательны для заполнения',
          code: ErrorCodes.VALIDATION_ERROR 
        },
        { status: 400 }
      );
    }

    if (username.length < 3) {
      return Response.json(
        { 
          success: false, 
          error: 'Имя пользователя должно содержать минимум 3 символа',
          code: ErrorCodes.VALIDATION_ERROR 
        },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return Response.json(
        { 
          success: false, 
          error: 'Пароль должен содержать минимум 6 символов',
          code: ErrorCodes.VALIDATION_ERROR 
        },
        { status: 400 }
      );
    }

    // Проверяем существование пользователя
    const userExists = await UserService.userExists(username, email);

    if (userExists.usernameExists) {
      return Response.json(
        { 
          success: false, 
          error: 'Пользователь с таким именем уже существует',
          code: ErrorCodes.USER_EXISTS 
        },
        { status: 409 }
      );
    }

    if (userExists.emailExists) {
      return Response.json(
        { 
          success: false, 
          error: 'Пользователь с таким email уже существует',
          code: ErrorCodes.EMAIL_EXISTS 
        },
        { status: 409 }
      );
    }

    // Создаем пользователя
    const user = await UserService.createUser({
      username,
      email,
      password
    });

    // Получаем IP-адрес из заголовков
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || request.ip || 'unknown';
    
    // Логируем создание аккаунта пользователя с IP-адресом и подробной информацией
    const { prisma } = await import('@/lib/prisma');
    await prisma.log.create({
      data: {
        user: username,
        timestamp: BigInt(Date.now()),
        description: `Создание аккаунта пользователя: логин="${username}", email="${email}", IP="${ipAddress}"`
      }
    });

    const token = createToken(user);
    
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
    }, {
      headers: {
        'Set-Cookie': `authToken=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}`
      }
    });

  } catch (error) {
    if (error.message === 'Username already exists') {
      return Response.json(
        {
          success: false,
          error: 'Пользователь с таким именем уже существует',
          code: ErrorCodes.USER_EXISTS
        },
        { status: 409 }
      );
    } else if (error.message === 'Email already exists') {
      return Response.json(
        {
          success: false,
          error: 'Пользователь с таким email уже существует',
          code: ErrorCodes.EMAIL_EXISTS
        },
        { status: 409 }
      );
    }
    
    console.error('Registration error:', error);
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