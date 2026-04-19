import bcrypt from 'bcryptjs';
import prisma from '@/lib/prisma';
import { createAdminToken, createAdminResponse } from '@/lib/adminAuth.js';
import { verify2FAToken } from '@/lib/2fa';

// Коды ошибок
const ErrorCodes = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  ADMIN_NOT_FOUND: 'ADMIN_NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  SERVER_ERROR: 'SERVER_ERROR',
  ACCESS_DENIED: 'ACCESS_DENIED',
  TWO_FA_REQUIRED: 'TWO_FA_REQUIRED',
  INVALID_2FA_TOKEN: 'INVALID_2FA_TOKEN'
};

export async function POST(request) {
  try {
    const { login, password, twoFaToken } = await request.json();

    // Валидация
    if (!login || !password) {
      return Response.json(
        { 
          success: false, 
          error: 'Логин и пароль обязательны для заполнения',
          code: ErrorCodes.VALIDATION_ERROR 
        },
        { status: 400 }
      );
    }

    // Ищем администратора
    const admin = await prisma.admin.findUnique({
      where: { login },
      select: {
        id: true,
        login: true,
        password: true,
        permissions: true,
        owner: true,
        frozen: true,
        createdAt: true,
        lastLogin: true,
        twoFaEnabled: true,
        twoFaSecret: true
      }
    });

    if (!admin) {
      return Response.json(
        {
          success: false,
          error: 'Неверные учетные данные',
          code: ErrorCodes.ADMIN_NOT_FOUND
        },
        { status: 401 }
      );
    }

    // Проверяем заблокирован ли администратор
    if (admin.frozen) {
      return Response.json(
        {
          success: false,
          error: 'Доступ заблокирован',
          code: ErrorCodes.ACCESS_DENIED
        },
        { status: 403 }
      );
    }

    // Проверяем пароль
    const isPasswordValid = await bcrypt.compare(password, admin.password);

    if (!isPasswordValid) {
      return Response.json(
        {
          success: false,
          error: 'Неверные учетные данные',
          code: ErrorCodes.INVALID_CREDENTIALS
        },
        { status: 401 }
      );
    }

    // Проверяем 2FA для всех админов (включая owner)
    console.log('[2FA DEBUG] Admin login attempt:', {
      login: admin.login,
      owner: admin.owner,
      twoFaEnabled: admin.twoFaEnabled,
      hasSecret: !!admin.twoFaSecret,
      secretLength: admin.twoFaSecret ? admin.twoFaSecret.length : 0,
      twoFaTokenProvided: !!twoFaToken
    });

    if (admin.twoFaEnabled && admin.twoFaSecret) {
      console.log('[2FA DEBUG] 2FA is required for this admin');
      if (!twoFaToken) {
        console.log('[2FA DEBUG] No 2FA token provided, requesting it');
        return Response.json(
          {
            success: false,
            error: 'Требуется код двухфакторной аутентификации',
            code: ErrorCodes.TWO_FA_REQUIRED,
            requiresTwoFA: true
          },
          { status: 200 } // 200 чтобы фронтенд мог обработать
        );
      }

      // Проверяем 2FA токен
      console.log('[2FA DEBUG] Verifying 2FA token');
      const is2FAValid = verify2FAToken(admin.twoFaSecret, twoFaToken);
      console.log('[2FA DEBUG] 2FA token valid:', is2FAValid);
      if (!is2FAValid) {
        return Response.json(
          {
            success: false,
            error: 'Неверный код двухфакторной аутентификации',
            code: ErrorCodes.INVALID_2FA_TOKEN,
            requiresTwoFA: true
          },
          { status: 401 }
        );
      }
    } else {
      console.log('[2FA DEBUG] 2FA not required - twoFaEnabled:', admin.twoFaEnabled, 'hasSecret:', !!admin.twoFaSecret);
    }

    // Обновляем последний вход администратора
    await prisma.admin.update({
      where: { id: admin.id },
      data: { lastLogin: new Date() }
    });

    // Парсим permissions
    let parsedPermissions = [];
    if (admin.permissions) {
      try {
        parsedPermissions = JSON.parse(admin.permissions);
      } catch (e) {
        console.error('Error parsing permissions:', e);
        parsedPermissions = [];
      }
    }

    const responseData = {
      success: true,
      message: 'Вход в панель администратора выполнен успешно',
      admin: {
        id: admin.id,
        login: admin.login,
        permissions: parsedPermissions,
        owner: admin.owner,
        frozen: admin.frozen,
        createdAt: admin.createdAt,
        lastLogin: new Date()
      }
    };

    return createAdminResponse(responseData, admin);

  } catch (error) {
    console.error('Admin login error:', error);
    
    return Response.json(
      { 
        success: false, 
        error: 'Внутренняя ошибка сервера',
        code: ErrorCodes.SERVER_ERROR 
      },
      { status: 500 }
    );
  }
}