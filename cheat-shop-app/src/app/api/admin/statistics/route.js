import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import revenueService from '@/lib/services/revenueService';

export async function GET() {
  try {
    const [
      totalUsers,
      totalAdmins,
      totalGames,
      totalRevenue,
      completedOrdersCount,
      paymentMethodStats,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.admin.count(),
      prisma.game.count(),
      revenueService.getTotalRevenue(7),
      // Всего завершённых заказов за всё время
      prisma.order.count({ where: { status: 'completed' } }),
      // Разбивка по методам оплаты (завершённые заказы)
      prisma.order.groupBy({
        by: ['paymentMethod'],
        where: { status: 'completed' },
        _count: { id: true },
        _sum: { totalUsd: true, totalRub: true },
        orderBy: { _count: { id: 'desc' } },
      }),
    ]);

    return NextResponse.json({
      success: true,
      statistics: {
        users: totalUsers,
        admins: totalAdmins,
        games: totalGames,
        revenue: totalRevenue.totalUsd,
        revenueRub: totalRevenue.totalRub,
        completedOrders: completedOrdersCount,
        paymentMethods: paymentMethodStats.map(m => ({
          method: m.paymentMethod,
          count: m._count.id,
          totalUsd: parseFloat(m._sum.totalUsd || 0),
          totalRub: parseFloat(m._sum.totalRub || 0),
        })),
      }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch statistics'
    }, { status: 500 });
  }
}
