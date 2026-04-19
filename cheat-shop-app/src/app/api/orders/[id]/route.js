import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sendOrderCompletedWebhook } from '@/lib/services/webhookService';
import { requireAdmin } from '@/lib/adminAuth.js';
import { auth } from '@/auth';
import revenueService from '@/lib/services/revenueService';

export async function GET(request, { params }) {
  try {
    const resolvedParams = await params;
    const orderId = resolvedParams.id;

    console.log('=== ORDER LOOKUP DEBUG ===');
    console.log('Requested Order ID:', orderId);
    console.log('Order ID type:', typeof orderId);
    console.log('Order ID length:', orderId?.length);

    if (!orderId) {
      console.log('ERROR: Order ID is missing');
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Получаем заказ из базы данных
    console.log('Searching for order in database...');
    let order = await prisma.order.findUnique({
      where: {
        id: orderId
      }
    });

    // Если заказ не найден, попробуем найти по части ID (fallback)
    if (!order && orderId.length > 8) {
      console.log('Exact order not found, trying partial match...');
      const partialOrders = await prisma.order.findMany({
        where: {
          id: {
            startsWith: orderId.substring(0, 8)
          }
        },
        take: 1
      });
      
      if (partialOrders.length > 0) {
        order = partialOrders[0];
        console.log('Found order by partial match:', order.id);
      }
    }

    console.log('Database query result:', order ? 'FOUND' : 'NOT FOUND');
    if (order) {
      console.log('Found order details:', {
        id: order.id,
        status: order.status,
        email: order.email,
        createdAt: order.createdAt
      });
    } else {
      // Попробуем найти похожие заказы для диагностики
      console.log('Searching for similar orders...');
      const recentOrders = await prisma.order.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, createdAt: true }
      });
      console.log('Recent orders in database:', recentOrders);
    }

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, order },
      { status: 200 }
    );
  } catch (error) {
    console.error('=== ORDER LOOKUP ERROR ===');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch order', details: error.message },
      { status: 500 }
    );
  }
}

// PATCH /api/orders/[id] - Update order status (admin only)
export async function PATCH(request, { params }) {
  try {
    const resolvedParams = await params;
    const orderId = resolvedParams.id;
    const { status } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { success: false, error: 'Status is required' },
        { status: 400 }
      );
    }

    // Получаем текущий заказ
    const currentOrder = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!currentOrder) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Если статус меняется на completed и у заказа нет userId, пытаемся связать его с пользователем
    let updatedOrder;
    if (status === 'completed' && !currentOrder.userId) {
      // Получаем данные пользователя из сессии, если он авторизован
      let sessionUserId = null;
      try {
        const session = await auth();
        if (session?.user?.id) {
          sessionUserId = parseInt(session.user.id);
        }
      } catch (error) {
        console.log('User not authenticated');
      }

      // Обновляем статус заказа и добавляем userId, если пользователь авторизован
      updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: status,
          paymentStatus: status === 'completed' ? 'completed' : 'pending',
          userId: sessionUserId
        }
      });
    } else {
      // Обновляем статус заказа без изменения userId
      updatedOrder = await prisma.order.update({
        where: {
          id: orderId
        },
        data: {
          status: status,
          paymentStatus: status === 'completed' ? 'completed' : 'pending'
        }
      });
    }


    // Отправляем вебхук при завершении заказа
    if (status === 'completed') {
      await sendOrderCompletedWebhook(orderId);

      // Записываем доход в статистику только если заказ не был уже завершён
      if (currentOrder.status !== 'completed') {
        try {
          const revenueAmount = parseFloat(updatedOrder.totalUsd) > 0
            ? updatedOrder.totalUsd
            : updatedOrder.totalRub;
          const revenueCurrency = parseFloat(updatedOrder.totalUsd) > 0 ? 'USD' : 'RUB';
          await revenueService.recordRevenue(revenueAmount, revenueCurrency);
        } catch (revenueError) {
          console.error('Failed to record revenue on manual order completion:', revenueError);
        }
      }
    }

    return NextResponse.json(
      { success: true, order: updatedOrder },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update order status', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/orders/[id] - Delete an order (admin only)
export async function DELETE(request, { params }) {
  try {
    // Проверяем аутентификацию администратора
    const authResult = await requireAdmin(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }

    const resolvedParams = await params;
    const orderId = resolvedParams.id;

    console.log('Attempting to delete order with ID:', orderId);

    if (!orderId) {
      return NextResponse.json(
        { success: false, error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Сначала проверяем существует ли заказ
    const existingOrder = await prisma.order.findUnique({
      where: {
        id: orderId
      }
    });

    console.log('Found order:', existingOrder);

    if (!existingOrder) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Проверяем наличие связанных записей в user_purchases
    const userPurchases = await prisma.userPurchase.findMany({
      where: {
        orderId: orderId
      }
    });

    // Если есть связанные записи в user_purchases, обнуляем orderId перед удалением заказа
    if (userPurchases.length > 0) {
      console.log('Found related user purchases, setting orderId to null:', userPurchases);
      
      // Обнуляем orderId в связанных записях user_purchases
      await prisma.userPurchase.updateMany({
        where: {
          orderId: orderId
        },
        data: {
          orderId: null
        }
      });
    }

    // Удаляем заказ из базы данных только если нет связанных записей
    const deletedOrder = await prisma.order.delete({
      where: {
        id: orderId
      }
    });

    console.log('Deleted order:', deletedOrder);

    return NextResponse.json(
      { success: true, message: 'Order deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete order', details: error.message },
      { status: 500 }
    );
  }
}