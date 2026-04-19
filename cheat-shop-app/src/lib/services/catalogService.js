/**
 * Сервис для работы с каталогом продуктов
 */

import prisma from '@/lib/prisma';
import productVariantService from './productVariantService';
import cache from '@/lib/utils/cacheUtils';
import { formatPrice } from '@/lib/utils/variantUtils';

class CatalogService {
  /**
   * Получение игр с минимальными ценами
   * @returns {Promise<Array>} - Список игр с ценами
   */
  async getGamesWithMinPrices(language = 'ru') {
    console.log(`🔍 Загружаем игры из БД для языка: ${language}`);
    
    // Добавляем кэширование для оптимизации с тегами
    const cacheKey = `games_with_prices_${language}`;
    const cached = cache.get(cacheKey);
    if (cached) {
      console.log(`📦 Используем кэшированные игры для языка: ${language}`);
      return cached;
    }
    
    const games = await prisma.game.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' }, // Используем sortOrder вместо name для лучшей производительности
      select: {
        id: true,
        name: true,
        slug: true,
        image: true,
        background: true,
        icon: true,
        isActive: true,
        sortOrder: true,
        _count: {
          select: {
            products: {
              where: { isActive: true }
            }
          }
        }
      }
    });

    console.log(`📦 Найдено игр в БД: ${games.length}`);

    const gamesWithPrices = await Promise.all(
      games.map(async (game) => {
      const minPrice = await productVariantService.getMinPriceForGame(game.id, language);
        const currency = language === 'en' ? 'USD' : 'RUB';

        return {
          ...game,
          minPrice,
          formattedPrice: formatPrice(minPrice, currency, language),
          productCount: game._count.products,
          backgroundImage: game.image || game.background || game.icon || null
        };
      })
    );

    // Кэшируем результат на 2 минуты с тегами
    cache.set(cacheKey, gamesWithPrices, 120, ['games', 'catalog']);
    
    return gamesWithPrices;
  }

  /**
   * Получение валюты для игры
   */
  async getGameCurrency(gameId, language = 'ru') {
    const product = await prisma.product.findFirst({
      where: {
        gameId,
        isActive: true
      },
      include: {
        variants: {
          where: { isActive: true },
          take: 1
        }
      }
    });

    return language === 'en' ? 'USD' : 'RUB';
  }

  /**
   * Получение категорий для игры
   */
  async getCategoriesForGame(gameSlug, language = 'ru') {
    console.log(`🔍 Загружаем категории из БД для игры: ${gameSlug}, язык: ${language}`);
    
    const game = await prisma.game.findUnique({
      where: { slug: gameSlug, isActive: true }
    });

    if (!game) {
      console.log(`❌ Игра не найдена: ${gameSlug}`);
      return [];
    }

    const categories = await prisma.category.findMany({
      where: {
        gameId: game.id,
        isActive: true
      },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: {
            products: {
              where: { isActive: true }
            }
          }
        },
        translations: true
      }
    });

    console.log(`📦 Найдено категорий в БД: ${categories.length}`);

    const categoriesWithPrices = await Promise.all(
      categories.map(async (category) => {
        const minPrice = await productVariantService.getMinPriceForCategory(category.id, language);
        const currency = language === 'en' ? 'USD' : 'RUB';

        // Получаем перевод для текущего языка
        const translation = category.translations?.find(t => t.language === language) ||
                         category.translations?.find(t => t.language === 'ru') ||
                         category.translations?.[0] || null;

        console.log(`📝 Категория ${category.id} (${category.slug}): переводы =`, category.translations);
        console.log(`📝 Выбранный перевод для языка ${language}:`, translation);

        return {
          ...category,
          name: translation?.name || category.name,
          description: translation?.description || category.description,
          minPrice,
          formattedPrice: formatPrice(minPrice, currency, language),
          productCount: category._count.products
        };
      })
    );

    return categoriesWithPrices;
  }

  /**
   * Получение валюты для категории
   */
  async getCategoryCurrency(categoryId, language = 'ru') {
    const product = await prisma.product.findFirst({
      where: {
        categoryId,
        isActive: true
      },
      include: {
        variants: {
          where: { isActive: true },
          take: 1
        }
      }
    });

    return language === 'en' ? 'USD' : 'RUB';
  }

  /**
   * Проверка существования категории
   */
  async getCategoryInfo(gameSlug, categorySlug, language = 'ru') {
    console.log(`🔍 Проверяем существование категории: ${gameSlug}/${categorySlug}`);

    const game = await prisma.game.findUnique({
      where: {
        slug: gameSlug,
        isActive: true
      }
    });

    if (!game) {
      console.log(`❌ Игра не найдена: ${gameSlug}`);
      return null;
    }

    let category = await prisma.category.findUnique({
      where: {
        slug_gameId: {
          slug: categorySlug,
          gameId: game.id
        }
      },
      include: {
        game: true,
        translations: true
      }
    });

    if (!category) {
      category = await prisma.category.findFirst({
        where: {
          name: categorySlug,
          gameId: game.id,
          isActive: true
        },
        include: {
          game: true,
          translations: true
        }
      });
    }

    if (!category) {
      console.log(`❌ Категория не найдена: ${categorySlug}`);
      return null;
    }

    console.log(`✅ Найдена категория: ${category.name}`);

    // Получаем перевод для текущего языка
    const translation = category.translations?.find(t => t.language === language) ||
                       category.translations?.find(t => t.language === 'ru') ||
                       category.translations?.[0] || null;

    console.log(`📝 getCategoryInfo: Категория ${category.id} (${category.slug}): переводы =`, category.translations);
    console.log(`📝 getCategoryInfo: Выбранный перевод для языка ${language}:`, translation);

    return {
      ...category,
      name: translation?.name || category.name,
      description: translation?.description || category.description
    };
  }

  /**
   * Получение продуктов для категории
   */
  async getProductsForCategory(gameSlug, categorySlug, language = 'ru') {
    console.log(`🔍 Загружаем продукты из БД для игры: ${gameSlug}, категории: ${categorySlug}, язык: ${language}`);

    const game = await prisma.game.findUnique({
      where: {
        slug: gameSlug,
        isActive: true
      }
    });

    if (!game) {
      console.log(`❌ Игра не найдена: ${gameSlug}`);
      return [];
    }

    let category = await prisma.category.findUnique({
      where: {
        slug_gameId: {
          slug: categorySlug,
          gameId: game.id
        }
      },
      include: {
        game: true,
        translations: true
      }
    });

    console.log(`🔍 Поиск по slug: ${category ? 'найдено' : 'не найдено'}`);

    if (!category) {
      category = await prisma.category.findFirst({
        where: {
          name: categorySlug,
          gameId: game.id,
          isActive: true
        },
        include: {
          game: true
        }
      });

      console.log(`🔍 По названию: ${category ? 'найдено' : 'не найдено'}`);
    }

    if (!category) {
      console.log(`❌ Категория не найдена: ${categorySlug}`);
      return [];
    }

    console.log(`✅ Найдена категория: ${category.name}`);

    const products = await prisma.product.findMany({
     where: {
       categoryId: category.id,
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

    console.log(`📦 Найдено товаров в БД: ${products.length}`);

   return products.map(product => {
     const minVariant = product.variants[0] || null;
     
     // Определяем валюту и цену в зависимости от языка
     const currency = language === 'en' ? 'USD' : 'RUB';
     let minPrice = language === 'en' ? minVariant?.priceUsd || 0 : minVariant?.priceRub || 0;
     
     // Если цена не определена, используем альтернативное поле
     if (minPrice === 0 && minVariant) {
       const altPrice = minVariant.price || 0;
       if (altPrice > 0) {
         minPrice = altPrice;
       }
     }
     
     // Находим перевод для текущего языка
     const translation = product.translations?.find(t => t.language === language) ||
                        product.translations?.find(t => t.language === 'ru') ||
                        product.translations?.[0] || null;
     
     // Формируем медиа данные
     const media = product.media ? product.media.map(mediaItem => ({
       ...mediaItem,
       url: mediaItem.url || mediaItem.imageUrl || mediaItem.filePath || ''
     })) : [];
     
     return {
       ...product,
       minPrice,
       formattedPrice: formatPrice(minPrice, currency, language),
       variantsCount: product.variants.length,
       name: translation?.name || product.name,
       description: translation?.description || product.description,
       backgroundImage: product.image,
       media: media
     };
   });
  }

  /**
   * Поиск по каталогу
   */
  async searchCatalog(query, language = 'ru') {
    console.log(`🔍 Выполняем поиск в БД: "${query}", язык: ${language}`);
    
    if (!query || query.trim().length === 0) return [];

    const searchQuery = query.toLowerCase().trim();

    const games = await prisma.game.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: searchQuery, mode: 'insensitive' } },
          { description: { contains: searchQuery, mode: 'insensitive' } }
        ]
      },
      include: {
        _count: {
          select: {
            products: { where: { isActive: true } }
          }
        }
      }
    });

    const categories = await prisma.category.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: searchQuery, mode: 'insensitive' } },
          { description: { contains: searchQuery, mode: 'insensitive' } },
          {
            translations: {
              some: {
                OR: [
                  { name: { contains: searchQuery, mode: 'insensitive' } },
                  { description: { contains: searchQuery, mode: 'insensitive' } }
                ]
              }
            }
          }
        ]
      },
      include: {
        game: true,
        _count: {
          select: {
            products: { where: { isActive: true } }
          }
        },
        translations: true
      }
    });

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: searchQuery, mode: 'insensitive' } },
          { description: { contains: searchQuery, mode: 'insensitive' } },
          { status: { contains: searchQuery, mode: 'insensitive' } }
        ]
      },
      include: {
        game: true,
        category: true,
        variants: {
          where: { isActive: true },
          orderBy: { priceUsd: 'asc' }
        }
      }
    });

    console.log(`📦 Результаты поиска: игр=${games.length}, категорий=${categories.length}, товаров=${products.length}`);

    const results = [];

    // Игры
    for (const game of games) {
      const minPrice = await productVariantService.getMinPriceForGame(game.id);
      const currency = await this.getGameCurrency(game.id, language);

      results.push({
        type: 'game',
        id: game.slug,
        name: game.name,
        description: game.description,
        productCount: game._count.products,
        priceFrom: formatPrice(minPrice, currency, language),
        background: game.background || 'bg-gradient-to-br from-orange-500/20 to-red-600/20',
        backgroundImage: game.backgroundImage,
        icon: game.icon,
        linkType: 'internal',
        target: `/catalog?game=${game.slug}`,
        isNew: game.isNew,
        relevance: this.calculateRelevance(game.name, game.description, searchQuery)
      });
    }

    // Категории
    for (const category of categories) {
      const minPrice = await productVariantService.getMinPriceForCategory(category.id);
      const currency = await this.getCategoryCurrency(category.id, language);

      // Получаем перевод для текущего языка
      const translation = category.translations?.find(t => t.language === language) ||
                         category.translations?.find(t => t.language === 'ru') ||
                         category.translations?.[0] || null;

      results.push({
        type: 'category',
        id: `${category.game.slug}-${category.slug}`,
        name: translation?.name || category.name,
        description: translation?.description || category.description,
        productCount: category._count.products,
        priceFrom: formatPrice(minPrice, currency, language),
        background: category.background || 'bg-gradient-to-br from-purple-500/20 to-pink-600/20',
        backgroundImage: category.image,
        icon: category.icon,
        linkType: 'internal',
        target: `/catalog?game=${category.game.slug}&category=${category.slug}`,
        isNew: category.isNew,
        gameSlug: category.game.slug,
        gameName: category.game.name,
        relevance: this.calculateRelevance(translation?.name || category.name, translation?.description || category.description, searchQuery)
      });
    }

    // Продукты
    for (const product of products) {
      const minVariant = product.variants[0] || null;
      const currency = language === 'en' ? 'USD' : 'RUB';
      const minPrice = language === 'en' ? minVariant?.priceUsd || 0 : minVariant?.priceRub || 0;

      results.push({
        type: 'product',
        id: product.slug,
        name: product.name,
        description: product.description,
        productCount: 1,
        priceFrom: formatPrice(minPrice, currency, language),
        backgroundImage: product.image,
        icon: product.icon,
        linkType: 'internal',
        target: `/product/${product.slug}`,
        cheatStatus: product.status,
        isNew: product.isNew,
        gameSlug: product.game.slug,
        gameName: product.game.name,
        categorySlug: product.category?.slug,
        categoryName: product.category?.name,
        relevance: this.calculateRelevance(
          product.name,
          product.description,
          product.status,
          searchQuery
        )
      });
    }

    return results.sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * Релевантность
   */
  calculateRelevance(...fields) {
    const query = arguments[arguments.length - 1];

    let relevance = 0;

    if (fields[0]?.toLowerCase() === query.toLowerCase()) relevance += 100;

    if (fields[0]?.toLowerCase().startsWith(query.toLowerCase()))
      relevance += 50;

    if (fields[0]?.toLowerCase().includes(query.toLowerCase()))
      relevance += 20;

    if (fields[1]?.toLowerCase().includes(query.toLowerCase()))
      relevance += 10;

    return relevance;
  }
}

// Методы инвалидации кэша
CatalogService.prototype.invalidateCache = async function () {
  console.log('🗑️ Инвалидируем весь кэш каталога');
  cache.invalidateCatalogCache();
};

CatalogService.prototype.invalidateGameCache = async function (gameSlug = null) {
  console.log(`🗑️ Инвалидируем кэш игры: ${gameSlug || 'все'}`);
  cache.invalidateByTags(['games', 'catalog']);
};

CatalogService.prototype.invalidateCategoryCache = async function (gameSlug = null, categorySlug = null) {
  console.log(`🗑️ Инвалидируем кэш категории: ${categorySlug || 'все'}`);
  cache.invalidateByTags(['categories', 'catalog']);
};

CatalogService.prototype.invalidateProductCache = async function (gameSlug = null, categorySlug = null) {
  console.log(`🗑️ Инвалидируем кэш продуктов`);
  cache.invalidateByTags(['products', 'catalog']);
};

// ✅ фиксим ESLint: экспортируем именованную переменную
const catalogService = new CatalogService();

export default catalogService;
