import prisma from '@/lib/prisma';
import { requireAdmin } from '@/lib/adminAuth.js';

// POST - Применение миграции баланса
export async function POST(request) {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.success) {
      return Response.json({ success: false, error: authResult.error }, { status: authResult.status });
    }
    if (!authResult.admin.owner) {
      return Response.json({ success: false, error: 'Только владелец может выполнять миграции' }, { status: 403 });
    }

    console.log('Начинаем применение миграции баланса...');
    
    // Выполняем миграцию SQL
    // Переименовываем balance в balance_usd
    await prisma.$executeRaw`ALTER TABLE users CHANGE COLUMN balance balance_usd DECIMAL(10, 2) DEFAULT 0.00`;
    
    // Добавляем balance_ru
    await prisma.$executeRaw`ALTER TABLE users ADD COLUMN balance_ru DECIMAL(10, 2) DEFAULT 0.00 AFTER balance_usd`;
    
    console.log('Миграция успешно применена!');
    
    return Response.json({
      success: true,
      message: 'Миграция баланса успешно применена',
      changes: {
        renamed_balance_to_usd: true,
        added_balance_ru: true
      }
    });

  } catch (error) {
    console.error('Ошибка применения миграции:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Ошибка применения миграции: ' + error.message,
        details: error
      },
      { status: 500 }
    );
  }
}

// GET - Проверка статуса миграции
export async function GET(request) {
  try {
    const authResult = await requireAdmin(request);
    if (!authResult.success) {
      return Response.json({ success: false, error: authResult.error }, { status: authResult.status });
    }
    if (!authResult.admin.owner) {
      return Response.json({ success: false, error: 'Только владелец может проверять статус миграций' }, { status: 403 });
    }

    // Проверяем, существуют ли новые поля
    const result = await prisma.$queryRaw`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'users' 
      AND COLUMN_NAME IN ('balance_usd', 'balance_ru')
    `;
    
    const columns = result.map(row => row.COLUMN_NAME);
    
    return Response.json({
      success: true,
      migrationStatus: {
        hasBalanceUsd: columns.includes('balance_usd'),
        hasBalanceRu: columns.includes('balance_ru'),
        allColumnsExist: columns.length === 2
      },
      existingColumns: columns
    });

  } catch (error) {
    console.error('Ошибка проверки миграции:', error);
    return Response.json(
      { 
        success: false, 
        error: 'Ошибка проверки миграции: ' + error.message
      },
      { status: 500 }
    );
  }
}