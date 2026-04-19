import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth.js';

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

// PUT /api/admin/admins/[id] - Обновление администратора
export async function PUT(request, { params }) {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.success) {
      return Response.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const { login, allowedTabs, frozen } = await request.json();

    if (!login || !Array.isArray(allowedTabs)) {
      return Response.json(
        { success: false, error: 'Логин и разрешенные вкладки обязательны' },
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

    // Проверяем существование администратора
    const existingAdmin = await prisma.admin.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingAdmin) {
      return Response.json(
        { success: false, error: 'Администратор не найден' },
        { status: 404 }
      );
    }

    // Нельзя изменять владельца
    if (existingAdmin.owner) {
      return Response.json(
        { success: false, error: 'Нельзя изменять владельца системы' },
        { status: 403 }
      );
    }

    // Проверяем уникальность логина (если он изменился)
    if (login !== existingAdmin.login) {
      const loginExists = await prisma.admin.findUnique({
        where: { login }
      });

      if (loginExists) {
        return Response.json(
          { success: false, error: 'Администратор с таким логином уже существует' },
          { status: 409 }
        );
      }
    }

    const permissions = JSON.stringify(allowedTabs);

    const updatedAdmin = await prisma.admin.update({
      where: { id: parseInt(id) },
      data: {
        login,
        permissions,
        frozen: frozen || false
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

    return Response.json({
      success: true,
      admin: {
        ...updatedAdmin,
        allowedTabs,
        tabsCount: allowedTabs.length
      },
      message: 'Администратор успешно обновлен'
    });

  } catch (error) {
    console.error('Update admin error:', error);
    return Response.json(
      { success: false, error: 'Ошибка при обновлении администратора' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/admins/[id] - Удаление администратора
export async function DELETE(request, { params }) {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.success) {
      return Response.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const resolvedParams = await params;
    const { id } = resolvedParams;

    // Проверяем существование администратора
    const existingAdmin = await prisma.admin.findUnique({
      where: { id: parseInt(id) }
    });

    if (!existingAdmin) {
      return Response.json(
        { success: false, error: 'Администратор не найден' },
        { status: 404 }
      );
    }

    // Нельзя удалять владельца
    if (existingAdmin.owner) {
      return Response.json(
        { success: false, error: 'Нельзя удалить владельца системы' },
        { status: 403 }
      );
    }

    await prisma.admin.delete({
      where: { id: parseInt(id) }
    });

    return Response.json({
      success: true,
      message: 'Администратор успешно удален'
    });

  } catch (error) {
    console.error('Delete admin error:', error);
    return Response.json(
      { success: false, error: 'Ошибка при удалении администратора' },
      { status: 500 }
    );
  }
}