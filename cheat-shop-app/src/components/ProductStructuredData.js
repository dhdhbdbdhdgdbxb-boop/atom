'use client';

import { useLanguage } from '@/i18n/LanguageContext';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function ProductStructuredData({ product }) {
  const { language } = useLanguage();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Не рендерим на сервере, чтобы избежать проблем с гидратацией
  if (!mounted || !product) {
    return null;
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://localhost:3000";
  const currentUrl = `${baseUrl}${pathname}`;
  
  // Получаем переводы продукта
  const translation = product.translations?.find(t => t.language === language) ||
                     product.translations?.find(t => t.language === 'en') ||
                     product.translations?.[0];

  const productName = translation?.name || product.name || 'Product';
  const productDescription = translation?.description || 'Premium gaming solution';
  
  // Информация о игре и категории
  const gameName = product.game?.name || '';
  const categoryTranslation = product.category?.translations?.find(t => t.language === language) ||
                             product.category?.translations?.find(t => t.language === 'en') ||
                             product.category?.translations?.[0];
  const categoryName = categoryTranslation?.name || product.category?.name || '';
  
  // Получаем цены
  const minPriceRub = product.variants?.length > 0 ? 
    product.variants.reduce((min, variant) => 
      Math.min(min, parseFloat(variant.priceRub || Infinity)), Infinity) : 0;
  const minPriceUsd = product.variants?.length > 0 ? 
    product.variants.reduce((min, variant) => 
      Math.min(min, parseFloat(variant.priceUsd || Infinity)), Infinity) : 0;

  const finalMinPriceRub = minPriceRub === Infinity ? 0 : minPriceRub;
  const finalMinPriceUsd = minPriceUsd === Infinity ? 0 : minPriceUsd;

  // Получаем изображение продукта
  const productImage = product.media?.find(m => m.type === 'image')?.url || '/images/og-image.jpg';
  const fullImageUrl = productImage.startsWith('http') ? productImage : `${baseUrl}${productImage}`;

  // Статус продукта
  const statusMap = {
    'undetected': language === 'ru' ? 'Необнаружимый' : 'Undetected',
    'detected': language === 'ru' ? 'Обнаружен' : 'Detected', 
    'useAtOwnRisk': language === 'ru' ? 'На свой страх и риск' : 'Use at Own Risk',
    'onUpdate': language === 'ru' ? 'На обновлении' : 'On Update'
  };
  const productStatus = statusMap[product.status] || (language === 'ru' ? 'Доступен' : 'Available');

  // Основные структурированные данные продукта
  const productData = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": productName,
    "description": productDescription,
    "brand": {
      "@type": "Brand",
      "name": "AtomCheats"
    },
    "category": categoryName,
    "inLanguage": language === 'ru' ? "ru-RU" : "en-US",
    "offers": {
      "@type": "AggregateOffer",
      "priceCurrency": language === 'ru' ? "RUB" : "USD",
      "lowPrice": language === 'ru' ? finalMinPriceRub : finalMinPriceUsd,
      "highPrice": product.variants?.length > 0 ? 
        product.variants.reduce((max, variant) => 
          Math.max(max, parseFloat(language === 'ru' ? variant.priceRub : variant.priceUsd || 0)), 0) : 
        (language === 'ru' ? finalMinPriceRub : finalMinPriceUsd),
      "availability": product.status === 'detected' ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
      "seller": {
        "@type": "Organization",
        "name": "AtomCheats"
      },
      "priceValidUntil": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    },
    "image": fullImageUrl,
    "url": currentUrl,
    "additionalProperty": [
      {
        "@type": "PropertyValue",
        "name": language === 'ru' ? "Игра" : "Game",
        "value": gameName
      },
      {
        "@type": "PropertyValue", 
        "name": language === 'ru' ? "Статус" : "Status",
        "value": productStatus
      },
      {
        "@type": "PropertyValue",
        "name": language === 'ru' ? "Категория" : "Category", 
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

  // Breadcrumb данные
  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": language === 'ru' ? "Главная" : "Home",
        "item": language === 'ru' ? `${baseUrl}/ru` : baseUrl
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": language === 'ru' ? "Каталог" : "Catalog",
        "item": language === 'ru' ? `${baseUrl}/ru/catalog` : `${baseUrl}/catalog`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": gameName,
        "item": language === 'ru' ? `${baseUrl}/ru/catalog?game=${gameName}` : `${baseUrl}/catalog?game=${gameName}`
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": productName,
        "item": currentUrl
      }
    ]
  };

  // WebPage данные
  const webPageData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": productName,
    "description": productDescription,
    "url": currentUrl,
    "inLanguage": language === 'ru' ? "ru-RU" : "en-US",
    "datePublished": product.createdAt ? new Date(product.createdAt).toISOString() : new Date().toISOString(),
    "dateModified": product.updatedAt ? new Date(product.updatedAt).toISOString() : new Date().toISOString(),
    "isPartOf": {
      "@type": "WebSite",
      "name": "AtomCheats",
      "url": baseUrl
    },
    "about": {
      "@type": "VideoGame",
      "name": gameName,
      "genre": categoryName,
      "gamePlatform": "PC"
    },
    "mainEntity": {
      "@id": `${currentUrl}#product`
    }
  };

  // SoftwareApplication данные (для читов)
  const softwareData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "@id": `${currentUrl}#product`,
    "name": productName,
    "description": productDescription,
    "applicationCategory": "Game",
    "operatingSystem": "Windows",
    "offers": productData.offers,
    "aggregateRating": productData.aggregateRating,
    "publisher": {
      "@type": "Organization",
      "name": "AtomCheats"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productData)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbData)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(webPageData)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(softwareData)
        }}
      />
    </>
  );
}