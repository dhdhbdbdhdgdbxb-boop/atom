import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth.js';

// POST /api/admin/migrate-permissions - Миграция старых разрешений в новый формат
export async function POST(request) {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.success) {
      return Response.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    // Проверяем, что текущий пользователь - владелец
    if (!authResult.admin.owner) {
      return Response.json(
        { success: false, error: 'Только владелец может выполнить миграцию' },
        { status: 403 }
      );
    }

    // Получаем всех админов с разрешениями
    const admins = await prisma.admin.findMany({
      where: {
        permissions: {
          not: null
        }
      }
    });

    const oldToNewMapping = {
      'admin.list': ['dashboard', 'admins'],
      'products.all': ['games-products'],
      'categories.all': ['games-products'],
      'games.all': ['games-products'],
      'statistics.all': ['dashboard'],
      'audit.all': ['activity-log'],
      'products.status': ['games-products'],
      'orders.all': ['order-logs'],
      'users.all': ['users'],
      'coupons.all': ['coupons'],
      'settings.all': ['settings']
    };

    let migratedCount = 0;
    let skippedCount = 0;

    for (const admin of admins) {
      try {
        const permissions = JSON.parse(admin.permissions);
        
        // Проверяем, нужна ли миграция (если это старый формат)
        if (permissions.length > 0 && typeof permissions[0] === 'string' && permissions[0].includes('.')) {
          // Это старый формат, нужна миграция
          const newTabs = new Set();
          
          for (const permission of permissions) {
            const mappedTabs = oldToNewMapping[permission] || [];
            mappedTabs.forEach(tab => newTabs.add(tab));
          }
          
          // Если админ имел полные права, даем доступ ко всем вкладкам
          if (permissions.includes('admin.list') && permissions.includes('products.all') && permissions.includes('statistics.all')) {
            newTabs.add('dashboard');
            newTabs.add('games-products');
            newTabs.add('order-logs');
            newTabs.add('users');
            newTabs.add('coupons');
            newTabs.add('admins');
            newTabs.add('activity-log');
            newTabs.add('settings');
          }
          
          const newPermissions = JSON.stringify(Array.from(newTabs));
          
          await prisma.admin.update({
            where: { id: admin.id },
            data: { permissions: newPermissions }
          });
          
          migratedCount++;
        } else {
          // Уже новый формат или пустые разрешения
          skippedCount++;
        }
      } catch (error) {
        console.error(`Error migrating admin ${admin.id}:`, error);
        skippedCount++;
      }
    }

    return Response.json({
      success: true,
      message: `Миграция завершена. Обновлено: ${migratedCount}, пропущено: ${skippedCount}`,
      migrated: migratedCount,
      skipped: skippedCount
    });

  } catch (error) {
    console.error('Migration error:', error);
    return Response.json(
      { success: false, error: 'Ошибка при миграции разрешений' },
      { status: 500 }
    );
  }
}