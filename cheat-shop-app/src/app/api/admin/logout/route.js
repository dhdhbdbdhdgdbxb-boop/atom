export async function POST(request) {
  try {
    return Response.json(
      {
        success: true,
        message: 'Выход выполнен успешно'
      },
      {
        headers: {
          'Set-Cookie': 'admin_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict'
        }
      }
    );

  } catch (error) {
    console.error('Admin logout error:', error);
    
    return Response.json(
      { 
        success: false, 
        error: 'Внутренняя ошибка сервера'
      },
      { status: 500 }
    );
  }
}