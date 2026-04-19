import { requireAdmin } from '@/lib/adminAuth.js';
import prisma from '@/lib/prisma.js';

export async function GET(request) {
  try {
    const result = await requireAdmin(request);
    
    if (!result.success) {
      return Response.json(
        {
          success: false,
          error: result.error,
          code: 'AUTH_ERROR'
        },
        {
          status: result.status,
          headers: {
            'Set-Cookie': 'admin_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict'
          }
        }
      );
    }

    const admin = result.admin;
    
    // Только владельцы могут просматривать список всех администраторов
    if (!admin.owner) {
      return Response.json(
        {
          success: false,
          error: 'Недостаточно прав доступа. Только владельцы могут просматривать список администраторов.',
          code: 'INSUFFICIENT_PERMISSIONS'
        },
        { status: 403 }
      );
    }

    // Получаем список всех админов с их permissions
    const admins = await prisma.admin.findMany({
      select: {
        id: true,
        login: true,
        owner: true,
        frozen: true,
        permissions: true,
        createdAt: true,
        lastLogin: true
      },
      orderBy: {
        id: 'asc'
      }
    });

    // Парсим permissions для каждого админа
    const adminsWithParsedPermissions = admins.map(admin => {
      let parsedPermissions = [];
      if (admin.permissions) {
        try {
          parsedPermissions = JSON.parse(admin.permissions);
        } catch (e) {
          console.error('Error parsing permissions for admin', admin.id, ':', e);
          parsedPermissions = [];
        }
      }

      return {
        ...admin,
        permissions: parsedPermissions
      };
    });

    return Response.json({
      success: true,
      admins: adminsWithParsedPermissions
    });

  } catch (error) {
    console.error('Admin list error:', error);
    
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