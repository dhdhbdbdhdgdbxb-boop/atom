import { auth } from '@/auth';
import { UserService } from '@/lib/userService';
import bcrypt from 'bcryptjs';

export async function PATCH(request) {
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

    const { username, email, password } = await request.json();
    const userId = parseInt(session.user.id);

    // Валидация данных
    if (!username && !email && !password) {
      return Response.json(
        { 
          success: false, 
          error: 'Необходимо указать хотя бы одно поле для обновления',
          code: 'VALIDATION_ERROR' 
        },
        { status: 400 }
      );
    }

    // Подготавливаем данные для обновления
    const updateData = {};
    
    if (username && username.trim()) {
      // Проверяем уникальность никнейма
      const existingUser = await UserService.findByUsername(username.trim());
      if (existingUser && existingUser.id !== userId) {
        return Response.json(
          { 
            success: false, 
            error: 'Это имя пользователя уже занято',
            code: 'USERNAME_EXISTS' 
          },
          { status: 400 }
        );
      }
      updateData.username = username.trim();
    }

    if (email && email.trim()) {
      // Проверяем уникальность email
      const existingUser = await UserService.findByEmail(email.trim());
      if (existingUser && existingUser.id !== userId) {
        return Response.json(
          { 
            success: false, 
            error: 'Этот email уже используется',
            code: 'EMAIL_EXISTS' 
          },
          { status: 400 }
        );
      }
      updateData.email = email.trim();
    }

    if (password && password.trim().length >= 6) {
      // Хешируем новый пароль
      const hashedPassword = await bcrypt.hash(password.trim(), 12);
      updateData.password = hashedPassword;
    } else if (password && password.trim().length > 0) {
      return Response.json(
        { 
          success: false, 
          error: 'Пароль должен содержать минимум 6 символов',
          code: 'PASSWORD_TOO_SHORT' 
        },
        { status: 400 }
      );
    }

    // Обновляем пользователя
    const updatedUser = await UserService.updateUser(userId, updateData);

    return Response.json({
      success: true,
      message: 'Данные успешно обновлены',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
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

// GET - получение профиля пользователя
export async function GET(request) {
  try {
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

    const user = await UserService.findById(parseInt(session.user.id));

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
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        balanceUsd: parseFloat(user.balanceUsd.toString()),
        balanceRub: parseFloat(user.balanceRub.toString()),
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
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
