import jwt from 'jsonwebtoken';
import prisma from './prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Функция для проверки JWT токена администратора
export async function verifyAdminToken(token) {
  try {
    if (!token) {
      return {
        success: false,
        error: 'Токен не предоставлен',
        status: 401
      };
    }

    // Декодируем JWT токен
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Проверяем, что это токен администратора
    if (decoded.type !== 'admin' || !decoded.adminId) {
      return {
        success: false,
        error: 'Недействительный токен администратора',
        status: 401
      };
    }

    // Проверяем, что администратор существует и не заблокирован
    const admin = await prisma.admin.findUnique({
      where: { id: decoded.adminId },
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

    if (!admin) {
      return {
        success: false,
        error: 'Администратор не найден',
        status: 404
      };
    }

    if (admin.frozen) {
      return {
        success: false,
        error: 'Доступ администратора заблокирован',
        status: 403
      };
    }

    // Парсим permissions из JSON строки
    let parsedPermissions = [];
    if (admin.permissions) {
      try {
        parsedPermissions = JSON.parse(admin.permissions);
      } catch (e) {
        console.error('Error parsing permissions:', e);
        parsedPermissions = [];
      }
    }

    return {
      success: true,
      admin: {
        id: admin.id,
        login: admin.login,
        permissions: parsedPermissions,
        owner: admin.owner,
        frozen: admin.frozen,
        createdAt: admin.createdAt,
        lastLogin: admin.lastLogin
      },
      decoded
    };

  } catch (error) {
    console.error('Admin token verification error:', error);
    
    if (error.name === 'TokenExpiredError') {
      return {
        success: false,
        error: 'Токен истек',
        status: 401
      };
    }
    
    return {
      success: false,
      error: 'Недействительный токен',
      status: 401
    };
  }
}

// Функция для создания JWT токена администратора
export function createAdminToken(admin) {
  return jwt.sign(
    {
      adminId: admin.id,
      login: admin.login,
      permissions: admin.permissions || [],
      owner: admin.owner,
      type: 'admin'
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

// Функция для проверки прав доступа администратора (deprecated)
export function checkAdminPermission(admin, requiredAccess) {
  // Функция больше не используется, так как теперь все управляется через permissions
  console.warn('checkAdminPermission is deprecated, use permissions instead');
  return admin.owner; // Владельцы имеют все права
}

// Middleware для API routes
export async function requireAdmin(request) {
  try {
    // Получаем токен из заголовков авторизации
    const authHeader = request.headers.get('authorization');
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else {
      // Пытаемся получить токен из cookies (для серверных компонентов)
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        const cookies = Object.fromEntries(
          cookieHeader.split('; ').map(c => c.split('='))
        );
        token = cookies.admin_token;
      }
    }

    const verificationResult = await verifyAdminToken(token);
    
    if (!verificationResult.success) {
      return {
        success: false,
        error: verificationResult.error,
        status: verificationResult.status,
        admin: null
      };
    }

    return {
      success: true,
      admin: verificationResult.admin,
      status: 200
    };

  } catch (error) {
    console.error('Admin middleware error:', error);
    return {
      success: false,
      error: 'Ошибка проверки авторизации',
      status: 500,
      admin: null
    };
  }
}

export async function requireAdminPermission(request, requiredPermission) {
  try {
    const adminResult = await requireAdmin(request);
    
    if (!adminResult.success) {
      return adminResult;
    }

    const admin = adminResult.admin;
    
    // Владельцы имеют ВСЕ права доступа
    if (admin.owner) {
      return {
        success: true,
        admin: admin,
        status: 200
      };
    }

    // Проверяем наличие разрешения для обычных админов
    const hasPermission = admin.permissions && admin.permissions.includes(requiredPermission);
    
    if (!hasPermission) {
      return {
        success: false,
        error: 'Недостаточно прав доступа',
        status: 403,
        admin: admin
      };
    }

    return {
      success: true,
      admin: admin,
      status: 200
    };

  } catch (error) {
    console.error('Admin permission check error:', error);
    return {
      success: false,
      error: 'Ошибка проверки прав доступа',
      status: 500,
      admin: null
    };
  }
}

// Функция для проверки, является ли админ владельцем
export function isAdminOwner(admin) {
  return admin.owner === true;
}

// Функция для получения списка всех прав доступа
export function getAvailablePermissions() {
  return {
    admin: [
      'admin.create',
      'admin.read',
      'admin.update',
      'admin.delete',
      'admin.list'
    ],
    user: [
      'user.create',
      'user.read',
      'user.update',
      'user.delete',
      'user.list'
    ],
    system: [
      'system.settings',
      'system.backup',
      'system.logs'
    ],
    products: [
      'products.create',
      'products.read',
      'products.update',
      'products.delete',
      'products.list'
    ],
    orders: [
      'orders.create',
      'orders.read',
      'orders.update',
      'orders.delete',
      'orders.list'
    ],
    balance: [
      'balance.read',
      'balance.update'
    ],
    reports: [
      'reports.read',
      'reports.generate'
    ]
  };
}

// Функция для создания ответа с токеном в cookies
export function createAdminResponse(data, admin) {
  const token = createAdminToken(admin);
  
  // Парсим permissions из JSON строки
  let parsedPermissions = [];
  if (admin.permissions) {
    try {
      parsedPermissions = JSON.parse(admin.permissions);
    } catch (e) {
      console.error('Error parsing permissions:', e);
      parsedPermissions = [];
    }
  }
  
  return Response.json({
    success: true,
    ...data,
    admin: {
      id: admin.id,
      login: admin.login,
      permissions: parsedPermissions,
      owner: admin.owner,
      frozen: admin.frozen,
      createdAt: admin.createdAt,
      lastLogin: admin.lastLogin
    },
    token: token
  }, {
    headers: {
      'Set-Cookie': `admin_token=${token}; HttpOnly; Path=/; Max-Age=86400; SameSite=Strict`
    }
  });
}

// Функция для создания ответа с ошибкой авторизации
export function createAuthErrorResponse(message, status = 401) {
  return Response.json(
    { 
      success: false, 
      error: message,
      code: 'AUTH_ERROR'
    },
    { 
      status,
      headers: {
        'Set-Cookie': 'admin_token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict'
      }
    }
  );
}