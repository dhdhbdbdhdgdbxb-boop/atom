import CatalogPageClient from '../../(pages)/catalog/page';

// Генерация метаданных для SEO (русская версия каталога)
export async function generateMetadata() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
  return {
    title: "Каталог читов для игр - CS2, Valorant, Apex Legends | AtomCheats",
    description: "Полный каталог премиальных читов для популярных игр: CS2, Valorant, Apex Legends, Fortnite. Необнаружимые читы с аимботом, валлхаком, ESP. Мгновенная доставка, поддержка 24/7.",
    keywords: [
      // Основные ключевые слова
      "каталог читов", "читы для игр", "купить читы", "премиум читы",
      // Игровые ключевые слова
      "чит CS2", "чит Counter Strike 2", "чит Valorant", "чит Apex Legends", 
      "чит Fortnite", "чит PUBG", "чит Warzone",
      // Функциональные ключевые слова
      "аимбот", "валлхак", "ESP", "триггербот", "радар хак",
      // Качественные ключевые слова
      "необнаружимые читы", "безопасные читы", "приватные читы", "VIP читы",
      "мгновенная доставка", "поддержка 24/7", "гарантия качества"
    ].join(", "),
    authors: [{ name: "Команда AtomCheats" }],
    creator: "AtomCheats",
    publisher: "AtomCheats",
    category: "Игровое ПО",
    classification: "Игровые инструменты",
    metadataBase: new URL(baseUrl),
    
    // Canonical и языковые альтернативы
    alternates: {
      canonical: '/ru/catalog',
      languages: {
        'ru': '/ru/catalog',
        'en': '/catalog',
        'x-default': '/catalog',
      },
    },
    
    // Open Graph
    openGraph: {
      title: "Каталог читов для игр - CS2, Valorant, Apex Legends | AtomCheats",
      description: "Полный каталог премиальных необнаружимых читов для популярных игр. Аимбот, валлхак, ESP для CS2, Valorant, Apex Legends. Мгновенная доставка, поддержка 24/7.",
      url: '/ru/catalog',
      siteName: "AtomCheats",
      locale: "ru_RU",
      type: "website",
      images: [
        {
          url: '/images/og-image.jpg',
          width: 1200,
          height: 630,
          alt: 'AtomCheats - Каталог читов для игр',
        },
      ],
    },
    
    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      site: '@AtomCheats',
      creator: '@AtomCheats',
      title: "Каталог читов для игр | AtomCheats",
      description: "Премиальные необнаружимые читы для CS2, Valorant, Apex Legends. Аимбот, валлхак, ESP. Мгновенная доставка, поддержка 24/7.",
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

export default function RussianCatalogPage() {
  return <CatalogPageClient />;
}