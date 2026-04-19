import ProductPageClient from '../../../(pages)/product/[slug]/ProductPageClient';
import { notFound } from 'next/navigation';
import prisma from '../../../../lib/prisma';

// Функция для получения данных продукта для SEO
async function getProductData(slug) {
  try {
    console.log('=== SERVER SIDE PRODUCT FETCH (EN) ===');
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

    console.log('Server side product found (EN):', !!product);
    return product;
  } catch (error) {
    console.error('Error fetching product for SEO (EN):', error);
    return null;
  }
}

// Генерация метаданных для SEO (английская версия)
export async function generateMetadata({ params }) {
  // Await params if it's a promise (Next.js 15+)
  const resolvedParams = await Promise.resolve(params);
  const product = await getProductData(resolvedParams.slug);
  
  if (!product) {
    return {
      title: 'Product Not Found - AtomCheats',
      description: 'The requested product could not be found.',
    };
  }

  // Получаем переводы продукта (приоритет английскому)
  const enTranslation = product.translations?.find(t => t.language === 'en');
  const ruTranslation = product.translations?.find(t => t.language === 'ru');
  const defaultTranslation = enTranslation || ruTranslation || product.translations?.[0];

  // Базовая информация о продукте
  const productName = defaultTranslation?.name || product.name || 'Product';
  const productDescription = defaultTranslation?.description || 'Premium gaming solution';
  
  // Информация о игре и категории
  const gameName = product.game?.name || '';
  
  const categoryTranslation = product.category?.translations?.find(t => t.language === 'en') ||
                             product.category?.translations?.find(t => t.language === 'ru') ||
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

  // Статус продукта (английские переводы)
  const statusMap = {
    'undetected': 'Undetected',
    'detected': 'Detected', 
    'useAtOwnRisk': 'Use at Own Risk',
    'onUpdate': 'On Update'
  };
  const productStatus = statusMap[product.status] || 'Available';

  // Формируем SEO заголовок
  const seoTitle = `${productName} - ${gameName} ${categoryName} Cheat | AtomCheats`;
  
  // Формируем SEO описание
  const descriptionText = productDescription.length > 120 ? 
    productDescription.slice(0, 120) + '...' : productDescription;
  const seoDescription = `Buy ${productName} for ${gameName}. ${descriptionText} Price from $${finalMinPriceUsd}. Status: ${productStatus}. Instant delivery, quality guarantee, 24/7 support.`;

  // Ключевые слова (английские)
  const keywords = [
    productName.toLowerCase(),
    gameName.toLowerCase(),
    categoryName.toLowerCase(),
    'cheat',
    'hack',
    'cheats',
    gameName.toLowerCase() + ' cheat',
    gameName.toLowerCase() + ' hack',
    'atomcheats',
    'game cheats',
    'premium cheats',
    'undetected cheats',
    'safe cheats',
    'buy cheat',
    productStatus.toLowerCase(),
    'aimbot',
    'wallhack',
    'ESP',
    'instant delivery',
    '24/7 support',
    'gaming software',
    'private cheats',
    'VIP cheats'
  ].filter(Boolean).join(', ');

  // Получаем первое изображение продукта
  const productImage = product.media?.find(m => m.type === 'image')?.url || '/images/og-image.jpg';
  const fullImageUrl = productImage.startsWith('http') ? productImage : `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}${productImage}`;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  // Структурированные данные для поисковых систем (английская версия)
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
    "inLanguage": "en-US",
    "offers": {
      "@type": "AggregateOffer",
      "priceCurrency": "USD",
      "lowPrice": finalMinPriceUsd,
      "highPrice": product.variants?.length > 0 ? 
        product.variants.reduce((max, variant) => 
          Math.max(max, parseFloat(variant.priceUsd || 0)), 0) : finalMinPriceUsd,
      "availability": product.status === 'detected' ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      "seller": {
        "@type": "Organization",
        "name": "AtomCheats"
      },
      "priceValidUntil": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    },
    "image": fullImageUrl,
    "url": `${baseUrl}/en/product/${resolvedParams.slug}`,
    "additionalProperty": [
      {
        "@type": "PropertyValue",
        "name": "Game",
        "value": gameName
      },
      {
        "@type": "PropertyValue", 
        "name": "Status",
        "value": productStatus
      },
      {
        "@type": "PropertyValue",
        "name": "Category", 
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
    category: "Gaming Software",
    classification: "Gaming Tools",
    metadataBase: new URL(baseUrl),
    
    // Canonical и языковые альтернативы
    alternates: {
      canonical: `/en/product/${resolvedParams.slug}`,
      languages: {
        'ru': `/ru/product/${resolvedParams.slug}`,
        'en': `/en/product/${resolvedParams.slug}`,
        'x-default': `/product/${resolvedParams.slug}`,
      },
    },
    
    // Open Graph
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      url: `/en/product/${resolvedParams.slug}`,
      siteName: "AtomCheats",
      locale: "en_US",
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
      'product:price:amount': finalMinPriceUsd,
      'product:price:currency': 'USD',
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

export default async function EnglishProductPage({ params }) {
  console.log('=== ENGLISH PRODUCT PAGE SERVER ===');
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