import { requireAdmin } from '@/lib/adminAuth.js';
import prisma from '@/lib/prisma.js';

// GET /api/admin/logs - Get all logs
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
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 50;
    const skip = (page - 1) * limit;

    const logs = await prisma.log.findMany({
      orderBy: [
        { timestamp: 'desc' }
      ],
      skip: skip,
      take: limit
    });

    // Преобразуем BigInt в строку для сериализации в JSON
    const serializedLogs = logs.map(log => ({
      ...log,
      timestamp: log.timestamp.toString()
    }));

    const totalLogs = await prisma.log.count();

    return Response.json({
      success: true,
      logs: serializedLogs,
      pagination: {
        page,
        limit,
        total: totalLogs,
        totalPages: Math.ceil(totalLogs / limit)
      }
    });

  } catch (error) {
    console.error('Get logs error:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/logs - Clear all logs
export async function DELETE(request) {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.success) {
      return Response.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    // Владельцы имеют доступ ко всем операциям
    if (!authResult.admin.owner) {
      const hasPermission = authResult.admin.permissions && (
        authResult.admin.permissions.includes('system.logs') ||
        authResult.admin.permissions.includes('activity-log')
      );
      
      if (!hasPermission) {
        return Response.json(
          { success: false, error: 'Недостаточно прав доступа' },
          { status: 403 }
        );
      }
    }

    await prisma.log.deleteMany({});

    return Response.json({
      success: true,
      message: 'Все логи успешно удалены'
    });

  } catch (error) {
    console.error('Clear logs error:', error);
    return Response.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}