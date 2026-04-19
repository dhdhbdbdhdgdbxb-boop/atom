'use client';

import { useLanguage } from '@/i18n/LanguageContext';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function CatalogStructuredData({ catalogData = {} }) {
  const { language } = useLanguage();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  // Не рендерим на сервере, чтобы избежать проблем с гидратацией
  if (!mounted) {
    return null;
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://localhost:3000";
  const currentUrl = `${baseUrl}${pathname}`;
  
  // Breadcrumb данные для каталога
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
        "item": currentUrl
      }
    ]
  };

  // WebPage данные для каталога
  const webPageData = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": language === 'ru' ? "Каталог читов для игр" : "Game Cheats Catalog",
    "description": language === 'ru' 
      ? "Полный каталог премиальных читов для популярных игр: CS2, Valorant, Apex Legends, Fortnite. Необнаружимые читы с аимботом, валлхаком, ESP."
      : "Complete catalog of premium game cheats for popular games: CS2, Valorant, Apex Legends, Fortnite. Undetected cheats with aimbot, wallhack, ESP.",
    "url": currentUrl,
    "inLanguage": language === 'ru' ? "ru-RU" : "en-US",
    "isPartOf": {
      "@type": "WebSite",
      "name": "AtomCheats",
      "url": baseUrl
    },
    "about": {
      "@type": "Thing",
      "name": language === 'ru' ? "Читы для игр" : "Game Cheats",
      "description": language === 'ru' 
        ? "Каталог безопасных и надежных читов для популярных онлайн игр"
        : "Catalog of safe and reliable cheats for popular online games"
    }
  };

  // ItemList данные для игр в каталоге
  const gamesData = catalogData.main && Array.isArray(catalogData.main) ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": language === 'ru' ? "Игры" : "Games",
    "description": language === 'ru' 
      ? "Список игр для которых доступны читы"
      : "List of games for which cheats are available",
    "numberOfItems": catalogData.main.length,
    "itemListElement": catalogData.main.map((game, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "VideoGame",
        "name": game.name,
        "genre": game.category || "Action",
        "gamePlatform": "PC",
        "url": `${currentUrl}?game=${game.slug || game.id}`,
        "offers": {
          "@type": "AggregateOffer",
          "priceCurrency": language === 'ru' ? "RUB" : "USD",
          "lowPrice": game.priceFrom ? parseFloat(game.priceFrom.replace(/[^\d.]/g, '')) : 0,
          "offerCount": game.productCount || 1,
          "availability": "https://schema.org/InStock"
        }
      }
    }))
  } : null;

  // FAQ данные для каталога
  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": language === 'ru' ? "Какие игры поддерживаются?" : "Which games are supported?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": language === 'ru' 
            ? "Мы поддерживаем все популярные игры: CS2, Valorant, Apex Legends, Fortnite, PUBG, Warzone и многие другие."
            : "We support all popular games: CS2, Valorant, Apex Legends, Fortnite, PUBG, Warzone and many others."
        }
      },
      {
        "@type": "Question",
        "name": language === 'ru' ? "Как выбрать подходящий чит?" : "How to choose the right cheat?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": language === 'ru' 
            ? "Выберите игру из каталога, затем категорию читов. Каждый продукт имеет подробное описание функций и статус обнаружения."
            : "Choose a game from the catalog, then a cheat category. Each product has a detailed description of features and detection status."
        }
      },
      {
        "@type": "Question",
        "name": language === 'ru' ? "Что означают статусы читов?" : "What do cheat statuses mean?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": language === 'ru' 
            ? "Необнаружимый - полностью безопасен, Обнаружен - временно недоступен, На обновлении - скоро будет доступен."
            : "Undetected - completely safe, Detected - temporarily unavailable, On Update - will be available soon."
        }
      }
    ]
  };

  return (
    <>
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
      {gamesData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(gamesData)
          }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqData)
        }}
      />
    </>
  );
}