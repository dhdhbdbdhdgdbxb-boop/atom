import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth.js';

// Коды ошибок
const ErrorCodes = {
  ADMIN_EXISTS: 'ADMIN_EXISTS',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  INVALID_ADMIN_KEY: 'INVALID_ADMIN_KEY'
};

// Предустановленные роли с их разрешениями
const ROLE_PERMISSIONS = {
  'admin': {
    permissions: ['admin.list', 'products.all', 'categories.all', 'games.all', 'statistics.all', 'audit.all']
  },
  'status_manager': {
    permissions: ['products.status']
  }
};

export async function POST(request) {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.success) {
      return Response.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }
    if (!authResult.admin.owner) {
      return Response.json(
        { success: false, error: 'Только владелец может создавать администраторов', code: 'FORBIDDEN' },
        { status: 403 }
      );
    }

    const { login, password, role = 'admin', permissions } = await request.json();

    // Валидация
    if (!login || !password) {
      return Response.json(
        {
          success: false,
          error: 'Логин и пароль обязательны для заполнения',
          code: ErrorCodes.VALIDATION_ERROR
        },
        { status: 400 }
      );
    }

    // Проверяем длину логина и пароля
    if (login.length < 3) {
      return Response.json(
        {
          success: false,
          error: 'Логин должен содержать минимум 3 символа',
          code: ErrorCodes.VALIDATION_ERROR
        },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return Response.json(
        {
          success: false,
          error: 'Пароль должен содержать минимум 8 символов',
          code: ErrorCodes.VALIDATION_ERROR
        },
        { status: 400 }
      );
    }

    // Проверяем уникальность логина
    const existingAdmin = await prisma.admin.findUnique({
      where: { login },
      select: { id: true }
    });

    if (existingAdmin) {
      return Response.json(
        {
          success: false,
          error: 'Администратор с таким логином уже существует',
          code: ErrorCodes.ADMIN_EXISTS
        },
        { status: 409 }
      );
    }

    // Проверяем валидность роли
    if (!ROLE_PERMISSIONS[role]) {
      return Response.json(
        {
          success: false,
          error: 'Неверная роль',
          code: ErrorCodes.VALIDATION_ERROR
        },
        { status: 400 }
      );
    }

    // Используем разрешения роли или переданные разрешения
    const finalPermissions = permissions && permissions.length > 0
      ? permissions
      : ROLE_PERMISSIONS[role].permissions;

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 12);

    // Создаем администратора
    const newAdmin = await prisma.admin.create({
      data: {
        login,
        password: hashedPassword,
        permissions: JSON.stringify(finalPermissions)
      },
      select: {
        id: true,
        login: true,
        permissions: true,
        owner: true,
        frozen: true,
        createdAt: true,
        lastLogin: true
      }
    });

    // Получаем IP-адрес из заголовков
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || request.ip || 'unknown';
    
    // Логируем создание аккаунта с IP-адресом и подробной информацией
    await prisma.log.create({
      data: {
        user: login,
        timestamp: BigInt(Date.now()),
        description: `Создание аккаунта администратора: логин="${login}", роль="${role}", IP="${ipAddress}", разрешения=${JSON.stringify(finalPermissions)}`
      }
    });

    const responseData = {
      success: true,
      message: `Администратор с ролью "${role}" успешно зарегистрирован`,
      admin: newAdmin
    };

    return Response.json(responseData);

  } catch (error) {
    console.error('Admin register error:', error);
    
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