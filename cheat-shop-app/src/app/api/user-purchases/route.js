import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(request) {
  try {
    const { orderId, userId, productId, variantId, price, currency, instruction, keys, quantity = 1 } = await request.json();

    // Проверяем обязательные поля
    if (!orderId || !userId || !productId || !variantId || !price || !currency) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Создаем запись в UserPurchase
    const userPurchase = await prisma.userPurchase.create({
      data: {
        orderId,
        userId,
        productId,
        variantId,
        price,
        currency,
        instruction: instruction || '',
        keys: keys || '',
        quantity: quantity
      }
    });

    // Обновляем таблицу daily_revenue
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalAmount = price * quantity;

    // Ищем запись за сегодня
    let dailyRevenue = await prisma.dailyRevenue.findFirst({
      where: {
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });

    if (dailyRevenue) {
      // Если запись существует, обновляем ее
      dailyRevenue = await prisma.dailyRevenue.update({
        where: { id: dailyRevenue.id },
        data: {
          revenueUsd: currency === 'USD' ? {
            increment: totalAmount
          } : undefined,
          revenueRub: currency === 'RUB' ? {
            increment: totalAmount
          } : undefined
        }
      });
    } else {
      // Если записи нет, создаем новую
      dailyRevenue = await prisma.dailyRevenue.create({
        data: {
          date: today,
          revenueUsd: currency === 'USD' ? totalAmount : 0,
          revenueRub: currency === 'RUB' ? totalAmount : 0
        }
      });
    }

    return NextResponse.json(
      { success: true, userPurchase, dailyRevenue },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating user purchase:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create user purchase', details: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    let userPurchases;
    if (userId) {
      // Если передан userId, фильтруем покупки по пользователю
      userPurchases = await prisma.userPurchase.findMany({
        where: {
          userId: parseInt(userId)
        },
        orderBy: [
          { createdAt: 'desc' }
        ],
        include: {
          product: {
            include: {
              translations: true
            }
          },
          variant: true
        }
      });
    } else {
      // Иначе возвращаем все покупки (для администраторов)
      userPurchases = await prisma.userPurchase.findMany({
        orderBy: [
          { createdAt: 'desc' }
        ]
      });
    }

    return NextResponse.json(
      { success: true, userPurchases },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching user purchases:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch user purchases', details: error.message },
      { status: 500 }
    );
  }
}