import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

// Определяем строку подключения к базе данных в зависимости от режима запуска
const getDatabaseUrl = () => {
  // Если есть переменная окружения DATABASE_URL, используем её
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  
  // Определяем режим запуска по NODE_ENV
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (isProduction) {
    // Production режим - используем переменные окружения
    const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, DB_PORT } = process.env;
    return `mysql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`;
  } else {
    // Development режим (npm run dev)
    return 'mysql://root:@localhost:3306/my_database';
  }
};

const databaseUrl = getDatabaseUrl();

// Логирование для отладки в продакшене
if (process.env.DEBUG === 'true') {
  console.log('Database URL:', databaseUrl);
  console.log('NODE_ENV:', process.env.NODE_ENV);
  console.log('NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
}

const prisma = globalForPrisma.prisma || new PrismaClient({
  log: ['query', 'error', 'warn'],
  datasources: {
    db: {
      url: databaseUrl
    }
  },
  __internal: {
    engine: {
      binaryTargets: ['native']
    }
  }
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export { prisma };
export default prisma;