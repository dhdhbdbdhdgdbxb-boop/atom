import { UserService } from '@/lib/userService';
import { verifyToken } from '@/lib/auth';

// Получение списка пользователей (для админки)
export async function GET(request) {
  try {
    const authResult = await verifyToken(request);
    
    if (!authResult.success) {
      return Response.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }
    
    // Здесь можно добавить проверку роли администратора
    // if (!authResult.user.isAdmin) { ... }
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const skip = (page - 1) * limit;
    
    const result = await UserService.getAllUsers(skip, limit);
    
    return Response.json({
      success: true,
      users: result.users,
      pagination: {
        page,
        limit,
        total: result.total,
        pages: result.pages
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
