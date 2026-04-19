/**
 * Публичный API каталога - для страницы каталога на фронтенде
 * Использует сервисный слой для бизнес-логики и кэширования
 */

import catalogService from '@/lib/services/catalogService';
import { formatPrice } from '@/lib/utils/variantUtils';
import prisma from '@/lib/prisma';
import { getMediaUrl } from '@/lib/utils/imageUtils';

// GET /api/catalog - Получение данных каталога для публичного отображения
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    let gameSlug = searchParams.get('game');
    let categorySlug = searchParams.get('category');
    const searchQuery = searchParams.get('search');
    const isNew = searchParams.get('isNew');
    const language = searchParams.get('lang') || 'ru';

    console.log(`🔍 API каталога: game=${gameSlug}, category=${categorySlug}, search=${searchQuery}, lang=${language}`);
    console.log(`🔍 Декодированные параметры: game=${gameSlug}, category=${categorySlug}`);
    console.log(`🌐 ЯЗЫК ЗАПРОСА: ${language}, тип: ${typeof language}`);

    // Добавляем заголовки кэширования для оптимизации
    const headers = {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=300', // Кэш на 1 минуту, фоновое обновление 5 минут
    };

    // Декодируем URL-encoded параметры
    if (gameSlug) {
      gameSlug = decodeURIComponent(gameSlug);
      console.log(`🔍 Декодированная игра: ${gameSlug}`);
    }
    if (categorySlug) {
      categorySlug = decodeURIComponent(categorySlug);
      console.log(`🔍 Декодированная категория: ${categorySlug}`);
    }

    let data = {};

    // Если есть поисковый запрос, выполняем поиск
    if (searchQuery) {
      console.log(`🔍 Выполняем поиск: "${searchQuery}"`);
      const searchResults = await catalogService.searchCatalog(searchQuery, language);
      
      data.search = searchResults;
      console.log(`✅ Поиск завершен, найдено результатов: ${searchResults.length}`);
      
      return Response.json({
        success: true,
        data
      }, { headers });
    }

    if (!gameSlug && !categorySlug) {
      // Главный уровень - получаем игры
      console.log(`🎮 Загружаем главную страницу каталога`);
      const games = await catalogService.getGamesWithMinPrices(language);

      data.main = games.map(game => ({
        id: game.slug,
        name: game.name,
        productCount: game.productCount,
        priceFrom: game.formattedPrice,
        background: game.background || 'bg-gradient-to-br from-orange-500/20 to-red-600/20',
        backgroundImage: game.backgroundImage,
        icon: game.icon,
        type: 'game',
        linkType: 'internal',
        target: `/catalog/${game.slug}`,
        isNew: game.isNew
      }));

      console.log(`✅ Загружено игр: ${data.main.length}`);

    } else if (gameSlug && !categorySlug) {
      // Уровень игры - получаем категории для этой игры
      console.log(`📁 Загружаем категории для игры: ${gameSlug}`);
      
      // Сначала загружаем информацию об игре для хлебных крошек
      const game = await prisma.game.findUnique({
        where: { slug: gameSlug }
      });

      console.log(`🎮 Найдена игра:`, game);

      // Добавляем информацию об игре в данные для хлебных крошек
      if (game) {
        data.main = [{
          id: game.slug,
          slug: game.slug,
          name: game.name,
          type: 'game'
        }];
      }

      const categories = await catalogService.getCategoriesForGame(gameSlug, language);

      let productsWithoutCategory = [];
      if (game) {
        productsWithoutCategory = await prisma.product.findMany({
          where: {
            gameId: game.id,
            categoryId: null,
            isActive: true
          },
          include: {
            variants: {
              where: { isActive: true },
              orderBy: { priceUsd: 'asc' }
            },
            translations: true,
            media: {
              orderBy: { sortOrder: 'asc' }
            }
          },
          orderBy: { id: 'asc' }
        });
      }

      console.log(`📦 Товары без категории: ${productsWithoutCategory.length}`);

      // Если есть категории, показываем их
      if (categories.length > 0) {
        console.log(`✅ Найдено категорий: ${categories.length}`);
        console.log(`📁 Категории:`, categories.map(c => ({ id: c.id, slug: c.slug, name: c.name })));
        data[gameSlug] = categories.map(category => ({
          id: category.slug,
          name: category.name,
          productCount: category.productCount,
          priceFrom: category.formattedPrice,
          background: category.background || 'bg-gradient-to-br from-purple-500/20 to-pink-600/20',
          backgroundImage: getMediaUrl(category.image),
          icon: category.icon,
          type: 'category',
          linkType: 'internal',
          target: `/catalog/${gameSlug}/${category.slug}`,
          isNew: category.isNew
        }));
      } else {
        console.log(`📦 Категорий нет, загружаем товары напрямую`);
        // Если нет категорий, показываем товары напрямую
        data[gameSlug] = productsWithoutCategory.map(product => {
          const minVariant = product.variants[0] || null;
          const currency = language === 'en' ? 'USD' : 'RUB';
          const minPrice = language === 'en' ? minVariant?.priceUsd || 0 : minVariant?.priceRub || 0;
          console.log(`💰 Товар без категории: язык=${language}, валюта=${currency}, цена=${minPrice}, форматированная=${formatPrice(minPrice, currency, language)}`);
          const translation = product.translations?.find(t => t.language === language) || product.translations?.[0] || null;
          const media = product.media ? product.media.map(mediaItem => ({
            ...mediaItem,
            url: mediaItem.url || mediaItem.imageUrl || mediaItem.filePath || ''
          })) : [];

          return {
            id: product.slug,
            name: translation?.name || product.name,
            productCount: 1,
            priceFrom: formatPrice(minPrice, currency, language),
            backgroundImage: getMediaUrl(product.image),
            icon: product.icon,
            type: 'product',
            linkType: 'internal',
            target: `/product/${product.slug}`,
            cheatStatus: product.status,
            isNew: product.isNew,
            media: media
          };
        });
      }

      // Если есть товары без категории и есть категории, добавляем их в отдельный раздел
      if (productsWithoutCategory.length > 0 && categories.length > 0) {
        data[`${gameSlug}-products`] = productsWithoutCategory.map(product => {
          const minVariant = product.variants[0] || null;
          const currency = language === 'en' ? 'USD' : 'RUB';
          const minPrice = language === 'en' ? minVariant?.priceUsd || 0 : minVariant?.priceRub || 0;
          const translation = product.translations?.find(t => t.language === language) || product.translations?.[0] || null;
          const media = product.media ? product.media.map(mediaItem => ({
            ...mediaItem,
            url: mediaItem.url || mediaItem.imageUrl || mediaItem.filePath || ''
          })) : [];

          return {
            id: product.slug,
            name: translation?.name || product.name,
            productCount: 1,
            priceFrom: formatPrice(minPrice, currency, language),
            backgroundImage: getMediaUrl(product.image),
            icon: product.icon,
            type: 'product',
            linkType: 'internal',
            target: `/product/${product.slug}`,
            cheatStatus: product.status,
            isNew: product.isNew,
            media: media
          };
        });
      }

    } else if (gameSlug && categorySlug) {
      // Уровень категории - получаем продукты для этой категории
      console.log(`📦 Загружаем товары для категории: ${gameSlug}/${categorySlug}`);
      
      // Сначала проверяем, существует ли категория
      const categoryInfo = await catalogService.getCategoryInfo(gameSlug, categorySlug, language);
      
      if (!categoryInfo) {
        console.log(`❌ Категория не найдена: ${gameSlug}/${categorySlug}`);
        return Response.json(
          { success: false, error: 'Category not found' },
          { status: 404 }
        );
      }

      // Загружаем информацию об игре для хлебных крошек
      const game = await prisma.game.findUnique({
        where: { slug: gameSlug }
      });

      // Добавляем информацию об игре в данные для хлебных крошек
      if (game) {
        data.main = [{
          id: game.slug,
          slug: game.slug,
          name: game.name,
          type: 'game'
        }];
      }

      // Теперь получаем товары для категории
      const products = await catalogService.getProductsForCategory(gameSlug, categorySlug, language);
      const finalProducts = products;

      console.log(`✅ Найдено товаров: ${finalProducts.length}`);
      
      // Добавляем информацию о категории в данные
      data[`${gameSlug}-${categorySlug}-category`] = {
        id: categoryInfo.slug,
        name: categoryInfo.name,
        type: 'category'
      };

      data[`${gameSlug}-${categorySlug}`] = finalProducts.map(product => {
        // Получаем минимальную цену из вариантов
        const minPrice = product.minPrice;
        const currency = language === 'en' ? 'USD' : 'RUB';
        console.log(`💰 Товар в категории: язык=${language}, валюта=${currency}, цена=${minPrice}, форматированная=${formatPrice(minPrice, currency, language)}`);

        return {
          id: product.slug,
          name: product.name,
          productCount: 1,
          priceFrom: formatPrice(minPrice, currency, language),
          backgroundImage: getMediaUrl(product.image),
          icon: product.icon,
          type: 'product',
          linkType: 'internal',
          target: `/product/${product.slug}`,
          cheatStatus: product.status,
          isNew: product.isNew,
          media: product.media || [],
          debug: {
            productId: product.id,
            categoryId: product.categoryId,
            gameId: product.gameId,
            variantsCount: product.variantsCount || 0,
            isActive: product.isActive
          }
        };
      });
    }

    console.log(`✅ API каталога завершен успешно, ключи данных: ${Object.keys(data).join(', ')}`);
    console.log(`📊 Размеры данных:`, Object.entries(data).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.length : typeof value}`));

    return Response.json({
      success: true,
      data
    }, { headers });

  } catch (error) {
    console.error('❌ Ошибка API каталога:', error);
    return Response.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}