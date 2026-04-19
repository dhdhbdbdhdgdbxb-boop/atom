import prisma from '../../../../lib/prisma';

// Функция для получения данных игры и категории для SEO
async function getCatalogData(slugs) {
  try {
    console.log('=== CATALOG SEO FETCH ===');
    console.log('Fetching catalog data for SEO, slugs:', slugs);
    
    if (!slugs || slugs.length === 0) {
      return { type: 'main', data: null };
    }

    const gameSlug = slugs[0];
    const categorySlug = slugs[1];

    // Ищем игру
    const game = await prisma.game.findFirst({
      where: { 
        slug: gameSlug,
        isActive: true 
      }
    });

    if (!game) {
      console.log('Game not found:', gameSlug);
      return { type: 'notfound', data: null };
    }

    if (categorySlug) {
      // Ищем категорию в этой игре
      const category = await prisma.category.findFirst({
        where: {
          slug: categorySlug,
          gameId: game.id,
          isActive: true
        },
        include: {
          translations: true
        }
      });

      if (!category) {
        console.log('Category not found:', categorySlug, 'in game:', gameSlug);
        return { type: 'notfound', data: null };
      }

      // Получаем количество продуктов в категории
      const productCount = await prisma.product.count({
        where: {
          categoryId: category.id,
          isActive: true
        }
      });

      return {
        type: 'category',
        data: {
          game,
          category,
          productCount
        }
      };
    } else {
      // Только игра - получаем количество продуктов и категорий
      const productCount = await prisma.product.count({
        where: {
          gameId: game.id,
          isActive: true
        }
      });

      const categoryCount = await prisma.category.count({
        where: {
          gameId: game.id,
          isActive: true
        }
      });

      return {
        type: 'game',
        data: {
          game,
          productCount,
          categoryCount
        }
      };
    }
  } catch (error) {
    console.error('Error fetching catalog data for SEO:', error);
    return { type: 'error', data: null };
  }
}

// Генерация метаданных для SEO (английская версия)
export async function generateCatalogMetadata({ params, language = 'en' }) {
  const resolvedParams = await params;
  const { type, data } = await getCatalogData(resolvedParams.slug);
  
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const isRussian = language === 'ru';
  
  // Дефолтные значения для случая, когда данные не найдены
  if (type === 'notfound' || type === 'error' || !data) {
    return {
      title: isRussian ? 'Страница не найдена - AtomCheats' : 'Page Not Found - AtomCheats',
      description: isRussian ? 'Запрашиваемая страница каталога не найдена.' : 'The requested catalog page could not be found.',
    };
  }

  let seoTitle, seoDescription, seoKeywords, canonicalPath, ogTitle, ogDescription;

  if (type === 'category') {
    const { game, category, productCount } = data;
    
    // Получаем локализованное название категории
    const categoryTranslation = category.translations?.find(t => t.language === language) ||
                               category.translations?.find(t => t.language === 'ru') ||
                               category.translations?.[0];
    const categoryName = categoryTranslation?.name || category.slug;

    if (isRussian) {
      seoTitle = `${categoryName} для ${game.name} - Читы и хаки | AtomCheats`;
      seoDescription = `Купить ${categoryName.toLowerCase()} для ${game.name}. ${productCount} товаров в каталоге. Необнаружимые читы с аимботом, валлхаком, ESP. Мгновенная доставка, поддержка 24/7.`;
      seoKeywords = [
        `${categoryName.toLowerCase()} ${game.name.toLowerCase()}`,
        `читы ${game.name.toLowerCase()}`,
        `хаки ${game.name.toLowerCase()}`,
        `${game.name.toLowerCase()} чит`,
        `${game.name.toLowerCase()} хак`,
        categoryName.toLowerCase(),
        'читы для игр',
        'необнаружимые читы',
        'премиум читы',
        'купить чит',
        'аимбот',
        'валлхак',
        'ESP',
        'мгновенная доставка',
        'поддержка 24/7',
        'atomcheats'
      ].join(', ');
      canonicalPath = `/ru/catalog/${resolvedParams.slug.join('/')}`;
      ogTitle = `${categoryName} для ${game.name} | AtomCheats`;
      ogDescription = `${productCount} товаров в категории ${categoryName} для ${game.name}. Необнаружимые читы с гарантией качества.`;
    } else {
      seoTitle = `${categoryName} for ${game.name} - Cheats & Hacks | AtomCheats`;
      seoDescription = `Buy ${categoryName.toLowerCase()} for ${game.name}. ${productCount} products in catalog. Undetected cheats with aimbot, wallhack, ESP. Instant delivery, 24/7 support.`;
      seoKeywords = [
        `${categoryName.toLowerCase()} ${game.name.toLowerCase()}`,
        `${game.name.toLowerCase()} cheats`,
        `${game.name.toLowerCase()} hacks`,
        `${game.name.toLowerCase()} cheat`,
        `${game.name.toLowerCase()} hack`,
        categoryName.toLowerCase(),
        'game cheats',
        'undetected cheats',
        'premium cheats',
        'buy cheat',
        'aimbot',
        'wallhack',
        'ESP',
        'instant delivery',
        '24/7 support',
        'atomcheats'
      ].join(', ');
      canonicalPath = `/catalog/${resolvedParams.slug.join('/')}`;
      ogTitle = `${categoryName} for ${game.name} | AtomCheats`;
      ogDescription = `${productCount} products in ${categoryName} category for ${game.name}. Undetected cheats with quality guarantee.`;
    }
  } else if (type === 'game') {
    const { game, productCount, categoryCount } = data;

    if (isRussian) {
      seoTitle = `${game.name} - Читы и хаки для игры | AtomCheats`;
      seoDescription = `Читы для ${game.name}. ${productCount} товаров в ${categoryCount} категориях. Необнаружимые читы с аимботом, валлхаком, ESP. Мгновенная доставка, поддержка 24/7.`;
      seoKeywords = [
        `читы ${game.name.toLowerCase()}`,
        `хаки ${game.name.toLowerCase()}`,
        `${game.name.toLowerCase()} чит`,
        `${game.name.toLowerCase()} хак`,
        `${game.name.toLowerCase()} читы`,
        'читы для игр',
        'необнаружимые читы',
        'премиум читы',
        'купить чит',
        'аимбот',
        'валлхак',
        'ESP',
        'мгновенная доставка',
        'поддержка 24/7',
        'atomcheats'
      ].join(', ');
      canonicalPath = `/ru/catalog/${resolvedParams.slug[0]}`;
      ogTitle = `${game.name} читы | AtomCheats`;
      ogDescription = `${productCount} читов для ${game.name} в ${categoryCount} категориях. Необнаружимые читы с гарантией качества.`;
    } else {
      seoTitle = `${game.name} - Cheats & Hacks for Game | AtomCheats`;
      seoDescription = `Cheats for ${game.name}. ${productCount} products in ${categoryCount} categories. Undetected cheats with aimbot, wallhack, ESP. Instant delivery, 24/7 support.`;
      seoKeywords = [
        `${game.name.toLowerCase()} cheats`,
        `${game.name.toLowerCase()} hacks`,
        `${game.name.toLowerCase()} cheat`,
        `${game.name.toLowerCase()} hack`,
        `${game.name.toLowerCase()} cheating`,
        'game cheats',
        'undetected cheats',
        'premium cheats',
        'buy cheat',
        'aimbot',
        'wallhack',
        'ESP',
        'instant delivery',
        '24/7 support',
        'atomcheats'
      ].join(', ');
      canonicalPath = `/catalog/${resolvedParams.slug[0]}`;
      ogTitle = `${game.name} cheats | AtomCheats`;
      ogDescription = `${productCount} cheats for ${game.name} in ${categoryCount} categories. Undetected cheats with quality guarantee.`;
    }
  }

  return {
    title: seoTitle,
    description: seoDescription,
    keywords: seoKeywords,
    authors: [{ name: "AtomCheats Team" }],
    creator: "AtomCheats",
    publisher: "AtomCheats",
    category: "Gaming Software",
    classification: "Gaming Tools",
    metadataBase: new URL(baseUrl),
    
    // Canonical и языковые альтернативы
    alternates: {
      canonical: canonicalPath,
      languages: {
        'ru': `/ru/catalog/${resolvedParams.slug.join('/')}`,
        'en': `/catalog/${resolvedParams.slug.join('/')}`,
        'x-default': `/catalog/${resolvedParams.slug.join('/')}`,
      },
    },
    
    // Open Graph
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: canonicalPath,
      siteName: "AtomCheats",
      locale: isRussian ? "ru_RU" : "en_US",
      type: "website",
      images: [
        {
          url: '/images/og-image.jpg',
          width: 1200,
          height: 630,
          alt: ogTitle,
        },
      ],
    },
    
    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      site: '@AtomCheats',
      creator: '@AtomCheats',
      title: ogTitle,
      description: ogDescription,
      images: ['/images/og-image.jpg'],
    },
    
    // Robots
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },

    // Дополнительные мета-теги
    other: {
      'theme-color': '#0f172a',
      'color-scheme': 'dark',
      'format-detection': 'telephone=no',
      'catalog:type': type,
      'catalog:game': data.game?.name || '',
      'catalog:category': type === 'category' ? (data.category?.translations?.find(t => t.language === language)?.name || data.category?.slug) : '',
      'catalog:products': type === 'category' ? data.productCount : (type === 'game' ? data.productCount : ''),
    },

    // Verification
    verification: {
      google: process.env.GOOGLE_VERIFICATION,
      yandex: process.env.YANDEX_VERIFICATION,
    },
  };
}