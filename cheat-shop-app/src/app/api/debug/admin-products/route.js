import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth.js';

export async function GET(request) {
  try {
    console.log('=== DEBUG ADMIN PRODUCTS ===');
    
    // Проверяем аутентификацию
    const authResult = await requireAdmin(request);
    console.log('Auth result:', authResult);
    
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, error: authResult.error },
        { status: authResult.status }
      );
    }
    
    // Пробуем импортировать prisma
    let prisma;
    try {
      const prismaModule = await import('@/lib/prisma');
      prisma = prismaModule.prisma || prismaModule.default;
      console.log('Prisma imported successfully:', !!prisma);
    } catch (error) {
      console.error('Prisma import error:', error);
      return NextResponse.json({
        success: false,
        error: 'Failed to import prisma: ' + error.message
      }, { status: 500 });
    }
    
    if (!prisma) {
      return NextResponse.json({
        success: false,
        error: 'prisma is not defined after import'
      }, { status: 500 });
    }
    
    // Пробуем подключиться к базе данных
    try {
      await prisma.$connect();
      console.log('Database connected successfully');
    } catch (error) {
      console.error('Database connection error:', error);
      return NextResponse.json({
        success: false,
        error: 'Database connection failed: ' + error.message
      }, { status: 500 });
    }
    
    // Пробуем получить продукты
    try {
      const products = await prisma.product.findMany({
        take: 10,
        select: {
          id: true,
          slug: true,
          name: true,
          isActive: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      console.log('Products found:', products.length);
      
      return NextResponse.json({
        success: true,
        products,
        count: products.length,
        message: 'Products loaded successfully'
      });
      
    } catch (error) {
      console.error('Database query error:', error);
      return NextResponse.json({
        success: false,
        error: 'Database query failed: ' + error.message
      }, { status: 500 });
    } finally {
      await prisma.$disconnect();
    }
    
  } catch (error) {
    console.error('=== DEBUG ADMIN PRODUCTS ERROR ===');
    console.error('Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}