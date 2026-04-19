import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '10');

    // Преобразуем поисковый запрос в нижний регистр для регистронезависимого поиска
    const searchLower = search.toLowerCase();

    const productsWhereClause = search
      ? {
          translations: {
            some: {
              OR: [
                {
                  name: {
                    contains: searchLower
                  }
                },
                {
                  description: {
                    contains: searchLower
                  }
                }
              ]
            }
          }
        }
      : {};
    
    const gamesWhereClause = search
      ? {
          OR: [
            {
              name: {
                contains: searchLower
              }
            },
            {
              description: {
                contains: searchLower
              }
            }
          ]
        }
      : {};

    console.log('Search term:', search);
    console.log('Products where clause:', JSON.stringify(productsWhereClause, null, 2));
    console.log('Games where clause:', JSON.stringify(gamesWhereClause, null, 2));

    const products = await prisma.product.findMany({
      where: productsWhereClause,
      take: limit,
      include: {
        translations: true,
        media: {
          where: { isMainImage: true },
          take: 1
        },
        variants: {
          where: { isActive: true },
          orderBy: { priceUsd: 'asc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    const games = await prisma.game.findMany({
      where: gamesWhereClause,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        products: {
          include: {
            variants: {
              where: { isActive: true },
              orderBy: { priceUsd: 'asc' },
              take: 1
            }
          }
        }
      }
    });

    // Calculate product count and min price for each game
    const gamesWithStats = games.map(game => {
      const activeProducts = game.products.filter(product =>
        product.variants && product.variants.length > 0
      );
      
      const productCount = activeProducts.length;
      
      // Find minimum price across all variants
      let minPriceUsd = null;
      let minPriceRub = null;
      if (activeProducts.length > 0) {
        const pricesUsd = activeProducts.flatMap(product =>
          product.variants.map(variant => variant.priceUsd)
        );
        const pricesRub = activeProducts.flatMap(product =>
          product.variants.map(variant => variant.priceRub)
        );
        minPriceUsd = Math.min(...pricesUsd);
        minPriceRub = Math.min(...pricesRub);
      }
      
      return {
        ...game,
        productCount,
        minPrice: minPriceUsd, // для обратной совместимости
        minPriceUsd,
        minPriceRub
      };
    });

    console.log('Found products:', products.length);
    console.log('Found games:', games.length);

    return NextResponse.json({
      success: true,
      products,
      games: gamesWithStats,
    }, { status: 200 });
  } catch (error) {
    console.error('Error searching products:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}