import { requireAdmin } from '@/lib/adminAuth.js';

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

    return Response.json({
      success: true,
      admin: result.admin
    });

  } catch (error) {
    console.error('Admin profile error:', error);
    
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