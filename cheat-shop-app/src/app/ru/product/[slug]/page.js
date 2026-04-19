import ProductPageClient from '../../../(pages)/product/[slug]/ProductPageClient';
import { notFound } from 'next/navigation';
import prisma from '../../../../lib/prisma';

// Функция для получения данных продукта для SEO
async function getProductData(slug) {
  try {
    console.log('=== SERVER SIDE PRODUCT FETCH (RU) ===');
    console.log('Fetching product for SEO, slug:', slug);
    
    const product = await prisma.product.findFirst({
      where: { 
        slug,
        isActive: true 
      },
      include: {
        translations: true,
        variants: {
          where: { isActive: true }
        },
        media: {
          orderBy: { sortOrder: 'asc' }
        },
        game: true,
        category: {
          include: {
            translations: true
          }
        },
        features: true,
        systemRequirementItems: true
      }
    });

    console.log('Server side product found (RU):', !!product);
    return product;
  } catch (error) {
    console.error('Error fetching product for SEO (RU):', error);
    return null;
  }
}

// Генерация метаданных для SEO (русская версия)
export async function generateMetadata({ params }) {
  // Await params if it's a promise (Next.js 15+)
  const resolvedParams = await Promise.resolve(params);
  const product = await getProductData(resolvedParams.slug);
  
  if (!product) {
    return {
      title: 'Продукт не найден - AtomCheats',
      description: 'Запрашиваемый продукт не найден.',
    };
  }

  // Получаем переводы продукта (приоритет русскому)
  const ruTranslation = product.translations?.find(t => t.language === 'ru');
  const enTranslation = product.translations?.find(t => t.language === 'en');
  const defaultTranslation = ruTranslation || enTranslation || product.translations?.[0];

  // Базовая информация о продукте
  const productName = defaultTranslation?.name || product.name || 'Продукт';
  const productDescription = defaultTranslation?.description || 'Премиальное игровое решение';
  
  // SEO данные из базы данных
  const metaTitle = defaultTranslation?.metaTitle || '';
  const metaDescription = defaultTranslation?.metaDescription || '';
  const metaKeywords = defaultTranslation?.metaKeywords || '';
  
  // Информация о игре и категории
  const gameName = product.game?.name || '';
  
  const categoryTranslation = product.category?.translations?.find(t => t.language === 'ru') ||
                             product.category?.translations?.find(t => t.language === 'en') ||
                             product.category?.translations?.[0];
  const categoryName = categoryTranslation?.name || product.category?.name || '';
  
  // Получаем минимальную цену
  const minPriceRub = product.variants?.length > 0 ? 
    product.variants.reduce((min, variant) => 
      Math.min(min, parseFloat(variant.priceRub || Infinity)), Infinity) : 0;
  const minPriceUsd = product.variants?.length > 0 ? 
    product.variants.reduce((min, variant) => 
      Math.min(min, parseFloat(variant.priceUsd || Infinity)), Infinity) : 0;

  // Проверяем, что цена валидна
  const finalMinPriceRub = minPriceRub === Infinity ? 0 : minPriceRub;
  const finalMinPriceUsd = minPriceUsd === Infinity ? 0 : minPriceUsd;

  // Статус продукта (русские переводы)
  const statusMap = {
    'undetected': 'Необнаружимый',
    'detected': 'Обнаружен', 
    'useAtOwnRisk': 'На свой страх и риск',
    'onUpdate': 'На обновлении'
  };
  const productStatus = statusMap[product.status] || 'Доступен';

  // Формируем SEO заголовок (используем metaTitle из БД или генерируем автоматически)
  const seoTitle = metaTitle || `${productName} - ${gameName} ${categoryName} | AtomCheats`;
  
  // Формируем SEO описание (используем metaDescription из БД или генерируем автоматически)
  let seoDescription = metaDescription;
  if (!seoDescription) {
    const descriptionText = productDescription.length > 120 ? 
      productDescription.slice(0, 120) + '...' : productDescription;
    seoDescription = `Купить ${productName} для ${gameName}. ${descriptionText} Цена от ${finalMinPriceRub}₽. Статус: ${productStatus}. Мгновенная доставка, гарантия качества, поддержка 24/7.`;
  }

  // Ключевые слова (используем metaKeywords из БД или генерируем автоматически)
  let keywords = metaKeywords;
  if (!keywords) {
    keywords = [
      productName.toLowerCase(),
      gameName.toLowerCase(),
      categoryName.toLowerCase(),
      'чит',
      'хак',
      'читы',
      gameName.toLowerCase() + ' чит',
      gameName.toLowerCase() + ' хак',
      'atomcheats',
      'читы для игр',
      'премиум читы',
      'необнаружимые читы',
      'безопасные читы',
      'купить чит',
      productStatus.toLowerCase(),
      'аимбот',
      'валлхак',
      'ESP',
      'мгновенная доставка',
      'поддержка 24/7'
    ].filter(Boolean).join(', ');
  }

  // Получаем первое изображение продукта
  const productImage = product.media?.find(m => m.type === 'image')?.url || '/images/og-image.jpg';
  const fullImageUrl = productImage.startsWith('http') ? productImage : `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}${productImage}`;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  // Структурированные данные для поисковых систем (русская версия)
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": productName,
    "description": productDescription,
    "brand": {
      "@type": "Brand",
      "name": "AtomCheats"
    },
    "category": categoryName,
    "inLanguage": "ru-RU",
    "offers": {
      "@type": "AggregateOffer",
      "priceCurrency": "RUB",
      "lowPrice": finalMinPriceRub,
      "highPrice": product.variants?.length > 0 ? 
        product.variants.reduce((max, variant) => 
          Math.max(max, parseFloat(variant.priceRub || 0)), 0) : finalMinPriceRub,
      "availability": product.status === 'detected' ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      "seller": {
        "@type": "Organization",
        "name": "AtomCheats"
      },
      "priceValidUntil": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    },
    "image": fullImageUrl,
    "url": `${baseUrl}/ru/product/${resolvedParams.slug}`,
    "additionalProperty": [
      {
        "@type": "PropertyValue",
        "name": "Игра",
        "value": gameName
      },
      {
        "@type": "PropertyValue", 
        "name": "Статус",
        "value": productStatus
      },
      {
        "@type": "PropertyValue",
        "name": "Категория", 
        "value": categoryName
      }
    ],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "reviewCount": "150",
      "bestRating": "5",
      "worstRating": "1"
    }
  };

  return {
    title: seoTitle,
    description: seoDescription,
    keywords: keywords,
    authors: [{ name: "AtomCheats Team" }],
    creator: "AtomCheats",
    publisher: "AtomCheats",
    category: "Игровое ПО",
    classification: "Игровые инструменты",
    metadataBase: new URL(baseUrl),
    
    // Canonical и языковые альтернативы
    alternates: {
      canonical: `/ru/product/${resolvedParams.slug}`,
      languages: {
        'ru': `/ru/product/${resolvedParams.slug}`,
        'en': `/product/${resolvedParams.slug}`,
        'x-default': `/product/${resolvedParams.slug}`,
      },
    },
    
    // Open Graph
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      url: `/ru/product/${resolvedParams.slug}`,
      siteName: "AtomCheats",
      locale: "ru_RU",
      type: "website",
      images: [
        {
          url: fullImageUrl,
          width: 1200,
          height: 630,
          alt: productName,
        },
      ],
    },
    
    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      site: '@AtomCheats',
      creator: '@AtomCheats',
      title: seoTitle,
      description: seoDescription,
      images: [fullImageUrl],
    },
    
    // Robots
    robots: {
      index: product.status !== 'detected', // Не индексируем обнаруженные читы
      follow: true,
      googleBot: {
        index: product.status !== 'detected',
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },

    // Дополнительные мета-теги
    other: {
      'product:price:amount': finalMinPriceRub,
      'product:price:currency': 'RUB',
      'product:availability': product.status === 'detected' ? 'out of stock' : 'in stock',
      'product:condition': 'new',
      'product:category': categoryName,
      'product:brand': 'AtomCheats',
      'theme-color': '#0f172a',
      'color-scheme': 'dark',
      'format-detection': 'telephone=no',
    },

    // Verification
    verification: {
      google: process.env.GOOGLE_VERIFICATION,
      yandex: process.env.YANDEX_VERIFICATION,
    },

    // JSON-LD структурированные данные
    script: [
      {
        type: 'application/ld+json',
        children: JSON.stringify(structuredData),
      },
    ],
  };
}

export default async function RussianProductPage({ params }) {
  console.log('=== RUSSIAN PRODUCT PAGE SERVER ===');
  console.log('Params received:', JSON.stringify(params));
  console.log('Slug from params:', params?.slug);
  
  // Await params if it's a promise (Next.js 15+)
  const resolvedParams = await Promise.resolve(params);
  const slug = resolvedParams?.slug;
  
  console.log('Resolved slug:', slug);
  
  if (!slug) {
    console.error('No slug in params!');
    notFound();
  }
  
  return <ProductPageClient slug={slug} />;
}