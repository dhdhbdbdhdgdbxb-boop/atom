import prisma from './prisma.js';
import bcrypt from 'bcryptjs';

// Утилитарная функция для обработки ошибок Prisma
const handlePrismaError = (error, operation = 'database operation') => {
  if (error.code === 'P1001') {
    console.error(`Database connection error during ${operation}:`, error.message);
    // Возвращаем null вместо выброса исключения для недоступности БД
    return null;
  }
  if (error.code === 'P2002') {
    const conflictField = error.meta?.target?.[0];
    throw new Error(conflictField === 'username' ?
      'Username already exists' : 'Email already exists');
  }
  console.error(`Database error during ${operation}:`, error);
  throw error;
};

export class UserService {
  // Создание нового пользователя
  static async createUser(userData) {
    const { username, email, password } = userData;
    
    // Хешируем пароль
    const hashedPassword = await bcrypt.hash(password, 12);
    
    try {
      return await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        // Новые поля баланса по умолчанию
        balanceUsd: 0,
        balanceRub: 0
      },
      select: {
        id: true,
        username: true,
        email: true,
        balanceUsd: true,
        balanceRub: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true
        // Не возвращаем пароль
      }
      });
    } catch (error) {
      handlePrismaError(error, 'user creation');
    }
  }

  // Поиск пользователя по email
  static async findByEmail(email) {
    try {
      return await prisma.user.findUnique({
        where: { email }
      });
    } catch (error) {
      handlePrismaError(error, 'find user by email');
    }
  }

  // Поиск пользователя по username
  static async findByUsername(username) {
    try {
      return await prisma.user.findUnique({
        where: { username }
      });
    } catch (error) {
      handlePrismaError(error, 'find user by username');
    }
  }

  // Поиск пользователя по ID
  static async findById(id) {
    try {
      return await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          username: true,
          email: true,
          balanceUsd: true,
          balanceRub: true,
          createdAt: true,
          updatedAt: true,
          lastLogin: true
          // Не возвращаем пароль
        }
      });
    } catch (error) {
      const result = handlePrismaError(error, 'find user by ID');
      if (result === null) return null; // База данных недоступна
      // Если handlePrismaError выбросил исключение, оно будет проброшено дальше
    }
  }

  // Проверка существования пользователя
  static async userExists(username, email) {
    try {
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { username },
            { email }
          ]
        }
      });
      
      return {
        exists: !!user,
        usernameExists: user?.username === username,
        emailExists: user?.email === email
      };
    } catch (error) {
      handlePrismaError(error, 'check user existence');
    }
  }

  // Обновление последнего входа
  static async updateLastLogin(userId) {
    try {
      return await prisma.user.update({
        where: { id: userId },
        data: { lastLogin: new Date() }
      });
    } catch (error) {
      handlePrismaError(error, 'update last login');
    }
  }

  // Проверка пароля
  static async verifyPassword(user, password) {
    return await bcrypt.compare(password, user.password);
  }

  // Обновление пользователя
  static async updateUser(userId, updateData) {
    return await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        balanceUsd: true,
        balanceRub: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true
      }
    });
  }

  // Обновление баланса пользователя
  static async updateUserBalance(userId, balanceData) {
    const { balanceUsd, balanceRub } = balanceData;
    
    return await prisma.user.update({
      where: { id: userId },
      data: {
        ...(balanceUsd !== undefined && { balanceUsd }),
        ...(balanceRub !== undefined && { balanceRub })
      },
      select: {
        id: true,
        username: true,
        email: true,
        balanceUsd: true,
        balanceRub: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true
      }
    });
  }

  // Инкрементальное обновление баланса пользователя
  static async incrementUserBalance(userId, incrementData) {
    const { balanceUsd, balanceRub } = incrementData;
    
    return await prisma.user.update({
      where: { id: userId },
      data: {
        ...(balanceUsd !== undefined && {
          balanceUsd: {
            increment: balanceUsd
          }
        }),
        ...(balanceRub !== undefined && {
          balanceRub: {
            increment: balanceRub
          }
        })
      },
      select: {
        id: true,
        username: true,
        email: true,
        balanceUsd: true,
        balanceRub: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true
      }
    });
  }

  // Удаление пользователя
  static async deleteUser(userId) {
    return await prisma.user.delete({
      where: { id: userId }
    });
  }

  // Получение всех пользователей (для админки)
  static async getAllUsers(skip = 0, take = 10) {
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take,
        select: {
          id: true,
          username: true,
          email: true,
          balanceUsd: true,
          balanceRub: true,
          createdAt: true,
          updatedAt: true,
          lastLogin: true
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count()
    ]);

    return {
      users,
      total,
      pages: Math.ceil(total / take)
    };
  }

  // Получение пользователя с балансом для сессии
  static async findByEmailWithBalance(email) {
    return await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        username: true,
        email: true,
        balanceUsd: true,
        balanceRub: true,
        createdAt: true,
        updatedAt: true,
        lastLogin: true
        // Не возвращаем пароль
      }
    });
  }
}