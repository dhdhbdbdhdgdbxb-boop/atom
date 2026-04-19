/**
 * API для очистки неиспользуемых файлов
 */

import { requireAdmin } from '@/lib/adminAuth';
import { cleanupFilesAPI } from '@/lib/utils/cleanupFiles';

// GET /api/admin/cleanup-files - Проверка неиспользуемых файлов (тестовый режим)
export async function GET(request) {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.success) {
      return Response.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    // Проверяем права доступа (только владелец может очищать файлы)
    if (!authResult.admin.owner) {
      return Response.json(
        { success: false, error: 'Only owner can access file cleanup' },
        { status: 403 }
      );
    }

    const result = await cleanupFilesAPI(true); // Тестовый режим

    return Response.json(result);

  } catch (error) {
    console.error('Cleanup files check error:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/cleanup-files - Удаление неиспользуемых файлов
export async function DELETE(request) {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.success) {
      return Response.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    // Проверяем права доступа (только владелец может очищать файлы)
    if (!authResult.admin.owner) {
      return Response.json(
        { success: false, error: 'Only owner can delete files' },
        { status: 403 }
      );
    }

    const result = await cleanupFilesAPI(false); // Реальное удаление

    // Логируем операцию очистки
    if (result.success && result.data.deleted > 0) {
      const { default: prisma } = await import('@/lib/prisma');
      const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || request.ip || 'unknown';
      
      await prisma.log.create({
        data: {
          user: authResult.admin.login,
          timestamp: BigInt(Date.now()),
          description: `Очистка файлов: удалено=${result.data.deleted}, ошибок=${result.data.errors}, IP="${ipAddress}"`
        }
      });
    }

    return Response.json(result);

  } catch (error) {
    console.error('Cleanup files delete error:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}