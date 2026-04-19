import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth.js';
import { generate2FASecret } from '@/lib/2fa';

const AVAILABLE_TABS = {
  'dashboard': {
    name: 'Панель управления',
    description: 'Обзор системы и статистика'
  },
  'games-products': {
    name: 'Игры и товары',
    description: 'Управление играми, категориями и товарами'
  },
  'order-logs': {
    name: 'Заказы',
    description: 'Управление заказами'
  },
  'users': {
    name: 'Пользователи',
    description: 'Управление пользователями системы'
  },
  'coupons': {
    name: 'Купоны',
    description: 'Управление купонами и промокодами'
  },
  'admins': {
    name: 'Администраторы',
    description: 'Управление администраторами и их правами доступа'
  },
  'activity-log': {
    name: 'Лог действий',
    description: 'История действий в системе'
  },
  'settings': {
    name: 'Параметры',
    description: 'Настройки системы и параметры'
  },
  'payment-fees': {
    name: 'Комиссии платежей',
    description: 'Управление комиссиями платежных модулей'
  }
};

export async function GET(request) {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.success) {
      return Response.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const [admins, total] = await Promise.all([
      prisma.admin.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          login: true,
          permissions: true,
          owner: true,
          frozen: true,
          createdAt: true,
          lastLogin: true,
          twoFaEnabled: true,
          twoFaSecret: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.admin.count()
    ]);

    const adminsWithTabs = admins.map(admin => {
      const allowedTabs = admin.permissions ? JSON.parse(admin.permissions) : [];
      
      return {
        ...admin,
        allowedTabs,
        tabsCount: allowedTabs.length
      };
    });

    return Response.json({
      success: true,
      admins: adminsWithTabs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      },
      availableTabs: Object.entries(AVAILABLE_TABS).map(([key, value]) => ({
        id: key,
        name: value.name,
        description: value.description
      }))
    });

  } catch (error) {
    console.error('Get admins error:', error);
    return Response.json(
      { success: false, error: 'Ошибка при получении списка администраторов' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.success) {
      return Response.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    // Проверяем, что текущий пользователь - владелец (только владелец может создавать админов)
    if (!authResult.admin.owner) {
      return Response.json(
        { success: false, error: 'Только владелец может создавать новых администраторов' },
        { status: 403 }
      );
    }

    const { login, password, allowedTabs = [] } = await request.json();

    if (!login || !password) {
      return Response.json(
        { success: false, error: 'Логин и пароль обязательны' },
        { status: 400 }
      );
    }

    if (login.length < 3) {
      return Response.json(
        { success: false, error: 'Логин должен содержать минимум 3 символа' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return Response.json(
        { success: false, error: 'Пароль должен содержать минимум 8 символов' },
        { status: 400 }
      );
    }

    if (!Array.isArray(allowedTabs)) {
      return Response.json(
        { success: false, error: 'Неверный формат разрешенных вкладок' },
        { status: 400 }
      );
    }

    // Проверяем, что все выбранные вкладки существуют
    const invalidTabs = allowedTabs.filter(tab => !AVAILABLE_TABS[tab]);
    if (invalidTabs.length > 0) {
      return Response.json(
        { success: false, error: `Неверные вкладки: ${invalidTabs.join(', ')}` },
        { status: 400 }
      );
    }

    const existingAdmin = await prisma.admin.findUnique({
      where: { login }
    });

    if (existingAdmin) {
      return Response.json(
        { success: false, error: 'Администратор с таким логином уже существует' },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const permissions = JSON.stringify(allowedTabs);

    // Generate 2FA secret automatically for all new admins
    const { secret } = generate2FASecret(login);

    const newAdmin = await prisma.admin.create({
      data: {
        login,
        password: hashedPassword,
        permissions,
        twoFaSecret: secret,
        twoFaEnabled: true // Always enabled for new admins
      },
      select: {
        id: true,
        login: true,
        permissions: true,
        owner: true,
        frozen: true,
        createdAt: true,
        twoFaEnabled: true
      }
    });

    return Response.json({
      success: true,
      admin: {
        ...newAdmin,
        allowedTabs,
        tabsCount: allowedTabs.length
      },
      twoFaSecret: secret, // Return secret for QR code generation
      message: 'Администратор успешно создан с включенным 2FA'
    });

  } catch (error) {
    console.error('Create admin error:', error);
    return Response.json(
      { success: false, error: 'Ошибка при создании администратора' },
      { status: 500 }
    );
  }
}