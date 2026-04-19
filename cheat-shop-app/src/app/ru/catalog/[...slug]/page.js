import CatalogSlugPageClient from '../../../(pages)/catalog/[...slug]/page';

// Генерация метаданных для SEO (русская версия подкатегорий каталога)
export async function generateMetadata({ params }) {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const resolvedParams = await params;
  const slugs = resolvedParams.slug || [];
  
  // Функция для форматирования slug в читаемое название
  const formatSlugToName = (slug) => {
    if (!slug) return '';
    try {
      let decoded = decodeURIComponent(slug);
      decoded = decoded.replace(/-/g, ' ');
      decoded = decoded.replace(/\b\w/g, l => l.toUpperCase());
      return decoded;
    } catch (error) {
      return slug.replace(/-/g, ' ');
    }
  };

  let title, description, canonicalPath;
  
  if (slugs.length === 2) {
    // /ru/catalog/game/category
    const gameName = formatSlugToName(slugs[0]);
    const categoryName = formatSlugToName(slugs[1]);
    
    title = `${categoryName} для ${gameName} - Купить читы | AtomCheats`;
    description = `Премиальные читы ${categoryName} для ${gameName}. Необнаружимые читы с аимботом, валлхаком, ESP. Мгновенная доставка, поддержка 24/7, гарантия качества.`;
    canonicalPath = `/ru/catalog/${slugs[0]}/${slugs[1]}`;
  } else if (slugs.length === 1) {
    // /ru/catalog/game
    const gameName = formatSlugToName(slugs[0]);
    
    title = `Читы для ${gameName} - Каталог | AtomCheats`;
    description = `Полный каталог читов для ${gameName}. Аимбот, валлхак, ESP, триггербот. Необнаружимые читы с мгновенной доставкой и поддержкой 24/7.`;
    canonicalPath = `/ru/catalog/${slugs[0]}`;
  } else {
    // /ru/catalog
    title = "Каталог читов для игр - CS2, Valorant, Apex Legends | AtomCheats";
    description = "Полный каталог премиальных читов для популярных игр: CS2, Valorant, Apex Legends, Fortnite. Необнаружимые читы с аимботом, валлхаком, ESP.";
    canonicalPath = '/ru/catalog';
  }

  return {
    title,
    description,
    keywords: [
      // Основные ключевые слова
      "каталог читов", "читы для игр", "купить читы", "премиум читы",
      // Игровые ключевые слова
      "чит CS2", "чит Valorant", "чит Apex Legends", "чит Fortnite",
      // Функциональные ключевые слова
      "аимбот", "валлхак", "ESP", "триггербот", "радар хак",
      // Качественные ключевые слова
      "необнаружимые читы", "безопасные читы", "приватные читы",
      "мгновенная доставка", "поддержка 24/7", "гарантия качества",
      // Специфичные для страницы
      slugs.length > 0 ? formatSlugToName(slugs[0]) : "",
      slugs.length > 1 ? formatSlugToName(slugs[1]) : ""
    ].filter(Boolean).join(", "),
    authors: [{ name: "Команда AtomCheats" }],
    creator: "AtomCheats",
    publisher: "AtomCheats",
    category: "Игровое ПО",
    classification: "Игровые инструменты",
    metadataBase: new URL(baseUrl),
    
    // Canonical и языковые альтернативы
    alternates: {
      canonical: canonicalPath,
      languages: {
        'ru': canonicalPath,
        'en': canonicalPath.replace('/ru/', '/'),
        'x-default': canonicalPath.replace('/ru/', '/'),
      },
    },
    
    // Open Graph
    openGraph: {
      title,
      description,
      url: canonicalPath,
      siteName: "AtomCheats",
      locale: "ru_RU",
      type: "website",
      images: [
        {
          url: '/images/og-image.jpg',
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    
    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      site: '@AtomCheats',
      creator: '@AtomCheats',
      title,
      description,
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
    },

    // Verification
    verification: {
      google: process.env.GOOGLE_VERIFICATION,
      yandex: process.env.YANDEX_VERIFICATION,
    },
  };
}

export default function RussianCatalogSlugPage({ params }) {
  return <CatalogSlugPageClient />;
}