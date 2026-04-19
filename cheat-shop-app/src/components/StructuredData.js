'use client';

import { useLanguage } from '@/i18n/LanguageContext';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function StructuredData() {
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
  
  // Определяем текущую страницу
  const isHomePage = pathname === '/' || pathname === '/ru' || pathname === '/en';
  
  const organizationData = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "AtomCheats",
    "alternateName": "Atom Cheats",
    "url": baseUrl,
    "logo": {
      "@type": "ImageObject",
      "url": `${baseUrl}/images/logo.svg`,
      "width": 200,
      "height": 60
    },
    "description": language === 'ru' 
      ? "Премиальные необнаружимые читы для популярных игр с гарантией безопасности и мгновенной доставкой. Более 10,000 довольных клиентов."
      : "Premium undetected cheats for popular games with safety guarantee and instant delivery. Over 10,000 satisfied customers.",
    "foundingDate": "2023",
    "slogan": language === 'ru' 
      ? "Лучшие читы для геймеров"
      : "Best cheats for gamers",
    "contactPoint": [
      {
        "@type": "ContactPoint",
        "contactType": "customer service",
        "availableLanguage": ["Russian", "English"],
        "hoursAvailable": {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": [
            "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
          ],
          "opens": "00:00",
          "closes": "23:59"
        }
      },
      {
        "@type": "ContactPoint",
        "contactType": "technical support",
        "availableLanguage": ["Russian", "English"]
      }
    ],
    "areaServed": "Worldwide",
    "knowsAbout": [
      "Game Cheats", "Gaming Software", "CS2 Cheats", "Valorant Cheats", 
      "Apex Legends Cheats", "Fortnite Cheats", "Aimbot", "Wallhack", "ESP"
    ],
    "sameAs": [
      // Добавьте ссылки на социальные сети, если есть
    ]
  };

  const websiteData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "AtomCheats",
    "alternateName": "Atom Cheats",
    "url": baseUrl,
    "description": language === 'ru' 
      ? "Премиальные необнаружимые читы для популярных игр с гарантией безопасности и мгновенной доставкой. Поддержка 24/7, пожизненные обновления."
      : "Premium undetected cheats for popular games with safety guarantee and instant delivery. 24/7 support, lifetime updates.",
    "inLanguage": language === 'ru' ? "ru-RU" : "en-US",
    "audience": {
      "@type": "Audience",
      "audienceType": "Gamers"
    },
    "keywords": language === 'ru' 
      ? "читы для игр, чит CS2, чит Valorant, чит Apex Legends, аимбот, валлхак, ESP"
      : "game cheats, CS2 cheat, Valorant cheat, Apex Legends cheat, aimbot, wallhack, ESP",
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${baseUrl}/search?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    },
    "publisher": {
      "@type": "Organization",
      "name": "AtomCheats"
    }
  };

  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": language === 'ru' ? "Главная" : "Home",
        "item": currentUrl
      }
    ]
  };

  // Дополнительные структурированные данные для главной страницы
  const webPageData = isHomePage ? {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": language === 'ru' 
      ? "AtomCheats - Премиальные читы для игр" 
      : "AtomCheats - Premium Game Cheats",
    "description": language === 'ru' 
      ? "Лучшие необнаружимые читы для популярных игр: CS2, Valorant, Apex Legends, Fortnite. Мгновенная доставка, 100% безопасность, поддержка 24/7. Более 10,000 довольных клиентов."
      : "Best undetected cheats for popular games: CS2, Valorant, Apex Legends, Fortnite. Instant delivery, 100% safety, 24/7 support. Over 10,000 satisfied customers.",
    "url": currentUrl,
    "inLanguage": language === 'ru' ? "ru-RU" : "en-US",
    "datePublished": "2023-01-01",
    "dateModified": new Date().toISOString().split('T')[0],
    "isPartOf": {
      "@type": "WebSite",
      "name": "AtomCheats",
      "url": baseUrl
    },
    "about": {
      "@type": "Thing",
      "name": language === 'ru' ? "Читы для игр" : "Game Cheats",
      "description": language === 'ru' 
        ? "Безопасные и надежные читы для популярных онлайн игр с функциями аимбота, валлхака и ESP"
        : "Safe and reliable cheats for popular online games with aimbot, wallhack and ESP features"
    },
    "mainEntity": {
      "@type": "ItemList",
      "name": language === 'ru' ? "Популярные игры" : "Popular Games",
      "description": language === 'ru' 
        ? "Читы для самых популярных онлайн игр с гарантией необнаружимости"
        : "Cheats for the most popular online games with undetected guarantee",
      "numberOfItems": 4,
      "itemListElement": [
        {
          "@type": "VideoGame",
          "name": "Counter-Strike 2",
          "alternateName": "CS2",
          "genre": "First-person shooter",
          "gamePlatform": "PC",
          "publisher": "Valve Corporation",
          "description": language === 'ru' 
            ? "Тактический шутер от первого лица"
            : "Tactical first-person shooter"
        },
        {
          "@type": "VideoGame", 
          "name": "Valorant",
          "genre": "First-person shooter",
          "gamePlatform": "PC",
          "publisher": "Riot Games",
          "description": language === 'ru' 
            ? "Тактический шутер с уникальными способностями"
            : "Tactical shooter with unique abilities"
        },
        {
          "@type": "VideoGame",
          "name": "Apex Legends", 
          "genre": "Battle royale",
          "gamePlatform": "PC",
          "publisher": "Electronic Arts",
          "description": language === 'ru' 
            ? "Командная королевская битва"
            : "Team-based battle royale"
        },
        {
          "@type": "VideoGame",
          "name": "Fortnite",
          "genre": "Battle royale", 
          "gamePlatform": "PC",
          "publisher": "Epic Games",
          "description": language === 'ru' 
            ? "Популярная королевская битва"
            : "Popular battle royale game"
        }
      ]
    },
    "offers": {
      "@type": "AggregateOffer",
      "priceCurrency": "USD",
      "lowPrice": "9.99",
      "highPrice": "99.99",
      "offerCount": "50+",
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "Organization",
        "name": "AtomCheats"
      }
    }
  } : null;

  // Добавляем FAQ структурированные данные
  const faqData = isHomePage ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": language === 'ru' ? "Безопасны ли ваши читы?" : "Are your cheats safe?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": language === 'ru' 
            ? "Да, все наши читы проходят тщательное тестирование и имеют защиту от обнаружения. Мы гарантируем безопасность использования."
            : "Yes, all our cheats undergo thorough testing and have anti-detection protection. We guarantee safe usage."
        }
      },
      {
        "@type": "Question",
        "name": language === 'ru' ? "Как быстро я получу доступ?" : "How quickly will I get access?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": language === 'ru' 
            ? "Доступ предоставляется мгновенно после оплаты. Вы получите инструкции по установке на email."
            : "Access is provided instantly after payment. You will receive installation instructions via email."
        }
      },
      {
        "@type": "Question",
        "name": language === 'ru' ? "Есть ли поддержка?" : "Is there support available?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": language === 'ru' 
            ? "Да, мы предоставляем поддержку 24/7 через Discord и Telegram. Наша команда всегда готова помочь."
            : "Yes, we provide 24/7 support via Discord and Telegram. Our team is always ready to help."
        }
      }
    ]
  } : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationData)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteData)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbData)
        }}
      />
      {webPageData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(webPageData)
          }}
        />
      )}
      {faqData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(faqData)
          }}
        />
      )}
    </>
  );
}