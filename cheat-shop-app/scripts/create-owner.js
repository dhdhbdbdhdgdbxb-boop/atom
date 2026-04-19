import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createOwner() {
  try {
    // Запрашиваем данные для создания владельца
    const login = process.argv[2];
    const password = process.argv[3];

    if (!login || !password) {
      console.error('Usage: node create-owner.js <login> <password>');
      process.exit(1);
    }

    // Проверяем, существует ли уже владелец
    const existingOwner = await prisma.admin.findFirst({
      where: { owner: true }
    });

    if (existingOwner) {
      console.log('Владелец уже существует:', existingOwner.login);
      process.exit(0);
    }

    // Проверяем, существует ли администратор с таким логином
    const existingAdmin = await prisma.admin.findUnique({
      where: { login }
    });

    if (existingAdmin) {
      console.error('Администратор с таким логином уже существует');
      process.exit(1);
    }

    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 12);

    // Создаем владельца с полными правами
    const owner = await prisma.admin.create({
      data: {
        login,
        password: hashedPassword,
        permissions: JSON.stringify([
          'admin.create',
          'admin.read',
          'admin.update',
          'admin.delete',
          'admin.list',
          'user.create',
          'user.read',
          'user.update',
          'user.delete',
          'user.list',
          'system.settings',
          'system.backup',
          'system.logs',
          'products.create',
          'products.read',
          'products.update',
          'products.delete',
          'products.list',
          'orders.create',
          'orders.read',
          'orders.update',
          'orders.delete',
          'orders.list',
          'balance.read',
          'balance.update',
          'reports.read',
          'reports.generate'
        ]),
        owner: true,
        frozen: false
      }
    });

    console.log('Владелец успешно создан:');
    console.log('Логин:', owner.login);
    console.log('ID:', owner.id);
    console.log('Права: Все права (owner)');

    // Логируем создание владельца
    await prisma.log.create({
      data: {
        user: 'system',
        timestamp: BigInt(Date.now()),
        description: `Создание владельца: логин="${login}", ID="${owner.id}"`
      }
    });

  } catch (error) {
    console.error('Ошибка при создании владельца:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createOwner();