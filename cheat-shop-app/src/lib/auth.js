import jwt from 'jsonwebtoken';
import { UserService } from './userService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware для проверки JWT токена
export async function verifyToken(request) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        success: false,
        error: 'Токен авторизации не предоставлен',
        status: 401
      };
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await UserService.findById(decoded.userId);
      
      if (!user) {
        return {
          success: false,
          error: 'Пользователь не найден',
          status: 404
        };
      }

      return {
        success: true,
        user,
        decoded
      };
    } catch (jwtError) {
      return {
        success: false,
        error: 'Недействительный токен',
        status: 401
      };
    }
  } catch (error) {
    console.error('Token verification error:', error);
    return {
      success: false,
      error: 'Ошибка проверки токена',
      status: 500
    };
  }
}

// Функция для создания JWT токена
export function createToken(user) {
  return jwt.sign(
    { 
      userId: user.id,
      email: user.email,
      username: user.username
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Функция для проверки роли администратора
export async function verifyAdmin(request) {
  const authResult = await verifyToken(request);
  
  if (!authResult.success) {
    return authResult;
  }
  
  // Здесь можно добавить проверку роли администратора
  // if (!authResult.user.isAdmin) {
  //   return {
  //     success: false,
  //     error: 'Недостаточно прав доступа',
  //     status: 403
  //   };
  // }
  
  return authResult;
}