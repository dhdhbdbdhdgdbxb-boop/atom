import prisma from "../prisma";
import { createHash } from "crypto";

// Функция для генерации уникального идентификатора посетителя
function generateViewerId(req) {
  // Используем IP-адрес и User-Agent для генерации уникального идентификатора
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";
  
  // Создаем хэш из IP и User-Agent для уникальности
  const hash = createHash("md5");
  hash.update(ip + userAgent);
  return hash.digest("hex");
}

// Функция для записи посещения
async function trackPageVisit(req) {
  const viewerId = generateViewerId(req);
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";
  
  try {
    // Используем upsert для избежания дублирования
    const pageVisit = await prisma.pageVisit.upsert({
      where: { viewerId },
      update: {
        // Обновляем дату последнего посещения, но не меняем isUnique
        date: new Date(),
      },
      create: {
        viewerId,
        ipAddress: ip,
        userAgent,
        isUnique: true, // Новый посетитель всегда уникальный
        date: new Date(),
      },
    });
    
    // Возвращаем информацию о том, был ли это новый посетитель
    return { isUnique: pageVisit.isUnique };
  } catch (error) {
    console.error('Error tracking page visit:', error);
    // В случае ошибки возвращаем false для isUnique
    return { isUnique: false };
  }
}

// Функция для получения статистики посещений
async function getPageVisitStats() {
  const totalVisits = await prisma.pageVisit.count();
  const uniqueVisits = await prisma.pageVisit.count({
    where: { isUnique: true },
  });
  
  return { totalVisits, uniqueVisits };
}

// Функция для получения статистики посещений по периодам
async function getPageVisitStatsByPeriod(period) {
  const now = new Date();
  let startDate;
  
  switch (period) {
    case '24H':
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      break;
    case '7D':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30D':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  }
  
  const visits = await prisma.pageVisit.findMany({
    where: {
      date: {
        gte: startDate,
        lte: now,
      },
    },
    orderBy: {
      date: 'asc',
    },
  });
  
  // Группируем посещения по часам или дням
  const groupedStats = [];
  
  if (period === '24H') {
    // Группировка по часам
    for (let i = 0; i < 24; i++) {
      const hourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), i, 0, 0);
      const hourEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), i, 59, 59);
      
      const hourVisits = visits.filter(visit => {
        const visitDate = new Date(visit.date);
        return visitDate >= hourStart && visitDate <= hourEnd;
      });
      
      groupedStats.push({
        time: `${i}:00`,
        total: hourVisits.length,
        unique: hourVisits.filter(v => v.isUnique).length,
      });
    }
  } else {
    // Группировка по дням
    const daysCount = period === '7D' ? 7 : 30;
    
    for (let i = 0; i < daysCount; i++) {
      const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0);
      const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59);
      
      const dayVisits = visits.filter(visit => {
        const visitDate = new Date(visit.date);
        return visitDate >= dayStart && visitDate <= dayEnd;
      });
      
      groupedStats.push({
        date: day.toISOString().split('T')[0],
        total: dayVisits.length,
        unique: dayVisits.filter(v => v.isUnique).length,
      });
    }
    
    groupedStats.reverse(); // Сортируем по возрастанию даты
  }
  
  return groupedStats;
}

export { trackPageVisit, getPageVisitStats, getPageVisitStatsByPeriod };