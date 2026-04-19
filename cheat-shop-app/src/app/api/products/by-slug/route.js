import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(request) {
  const startTime = Date.now();
  
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    
    console.log('=== PRODUCT BY SLUG API ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Request URL:', request.url);
    console.log('Requested slug:', slug);
    console.log('Slug type:', typeof slug);
    console.log('Slug length:', slug?.length);
    
    if (!slug) {
      console.log('ERROR: No slug provided');
      return NextResponse.json(
        { success: false, error: 'Product slug is required' },
        { status: 400 }
      );
    }

    console.log('Searching for product in database...');
    console.log('Database connection status: attempting to connect...');
    
    // Проверяем подключение к базе данных
    await prisma.$connect();
    console.log('Database connection: SUCCESS');
    
    // Получаем продукт по slug с полной информацией
    const product = await prisma.product.findFirst({
      where: {
        slug,
        isActive: true // Только активные продукты
      },
      include: {
        translations: true,
        features: {
          include: {
            children: true
          },
          orderBy: { sortOrder: 'asc' }
        },
        systemRequirements: true,
        systemRequirementItems: {
          orderBy: { sortOrder: 'asc' }
        },
        variants: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' }
        },
        media: {
          orderBy: { sortOrder: 'asc' }
        },
        game: true,
        category: {
          include: {
            translations: true
          }
        }
      }
    });

    console.log('Product found:', !!product);
    if (product) {
      console.log('Product details:', {
        id: product.id,
        slug: product.slug,
        isActive: product.isActive,
        variantsCount: product.variants?.length || 0,
        translationsCount: product.translations?.length || 0,
        mediaCount: product.media?.length || 0
      });
    } else {
      console.log('Product not found for slug:', slug);
      console.log('Searching for similar products...');
      
      // Попробуем найти похожие продукты для диагностики
      const similarProducts = await prisma.product.findMany({
        where: {
          slug: {
            contains: slug.substring(0, 10)
          }
        },
        select: {
          id: true,
          slug: true,
          isActive: true
        },
        take: 5
      });
      console.log('Similar products found:', similarProducts);
    }

    if (!product) {
      console.log('Product not found for slug:', slug);
      
      // Попробуем найти похожие продукты для диагностики
      const similarProducts = await prisma.product.findMany({
        where: {
          slug: {
            contains: slug.substring(0, Math.min(10, slug.length))
          }
        },
        select: {
          id: true,
          slug: true,
          isActive: true,
          translations: {
            select: { name: true, language: true }
          }
        },
        take: 5
      });
      console.log('Similar products found:', similarProducts);

      return NextResponse.json(
        { 
          success: false, 
          error: 'Product not found',
          suggestions: similarProducts.map(p => ({
            slug: p.slug,
            name: p.translations?.[0]?.name ?? p.slug,
            isActive: p.isActive
          }))
        },
        { status: 404 }
      );
    }

    // Удаляем инструкции из вариантов перед отправкой
    const productWithoutInstructions = {
      ...product,
      variants: product.variants.map(variant => {
        const { instructions, ...variantWithoutInstructions } = variant;
        return variantWithoutInstructions;
      })
    };
    
    const processingTime = Date.now() - startTime;
    console.log('Returning product data with ID:', productWithoutInstructions.id);
    console.log('Processing time:', processingTime, 'ms');
    console.log('=== END PRODUCT BY SLUG API ===');
    
    return NextResponse.json({
      success: true,
      product: productWithoutInstructions
    }, { status: 200 });
  } catch (error) {
    console.error('=== PRODUCT BY SLUG ERROR ===');
    console.error('Error details:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : 'Database connection error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}