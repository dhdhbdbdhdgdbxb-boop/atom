import { requireAdmin } from '@/lib/adminAuth.js';
import { UserService } from '@/lib/userService.js';

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

    // Владельцы имеют доступ ко всем операциям
    // Обычные админы должны иметь соответствующие разрешения
    if (!result.admin.owner) {
      const hasPermission = result.admin.permissions && (
        result.admin.permissions.includes('user.list') || 
        result.admin.permissions.includes('users')
      );
      
      if (!hasPermission) {
        return Response.json(
          { success: false, error: 'Недостаточно прав доступа' },
          { status: 403 }
        );
      }
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const skip = (page - 1) * limit;
    
    const resultData = await UserService.getAllUsers(skip, limit);
    
    return Response.json({
      success: true,
      users: resultData.users,
      pagination: {
        page,
        limit,
        total: resultData.total,
        pages: resultData.pages
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    return Response.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
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

    // Владельцы имеют доступ ко всем операциям
    if (!result.admin.owner) {
      const hasPermission = result.admin.permissions && (
        result.admin.permissions.includes('user.update') || 
        result.admin.permissions.includes('users')
      );
      
      if (!hasPermission) {
        return Response.json(
          { success: false, error: 'Недостаточно прав доступа' },
          { status: 403 }
        );
      }
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');
    
    if (!userId) {
      return Response.json(
        { success: false, error: 'ID пользователя не указан' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { username, balanceUsd, balanceRub } = body;
    
    const updatedUser = await UserService.updateUser(parseInt(userId), {
      username,
      balanceUsd: parseFloat(balanceUsd),
      balanceRub: parseFloat(balanceRub)
    });
    
    return Response.json({
      success: true,
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    return Response.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
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

    // Владельцы имеют доступ ко всем операциям
    if (!result.admin.owner) {
      const hasPermission = result.admin.permissions && (
        result.admin.permissions.includes('user.delete') || 
        result.admin.permissions.includes('users')
      );
      
      if (!hasPermission) {
        return Response.json(
          { success: false, error: 'Недостаточно прав доступа' },
          { status: 403 }
        );
      }
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('id');
    
    if (!userId) {
      return Response.json(
        { success: false, error: 'ID пользователя не указан' },
        { status: 400 }
      );
    }

    await UserService.deleteUser(parseInt(userId));
    
    return Response.json({
      success: true,
      message: 'Пользователь успешно удален'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return Response.json(
      { success: false, error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}