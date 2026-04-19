import Home from '../(root)/page';

export default function RussianHomePage() {
  return <Home locale="ru" />;
}

export async function generateMetadata() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://localhost:3000';
  
  return {
    title: "AtomCheats - Премиальные читы для игр | CS2, Valorant, Apex Legends",
    description: "Купить премиальные читы для CS2, Valorant, Apex Legends, Fortnite с мгновенной доставкой. 100% необнаружимые, поддержка 24/7, пожизненные обновления. Более 10,000 довольных игроков.",
    keywords: [
      // Основные ключевые слова
      "читы для игр", "премиум читы", "необнаружимые читы", "игровые хаки",
      // Игровые ключевые слова
      "чит CS2", "хак Counter Strike 2", "чит Valorant", "хак Valorant",
      "чит Apex Legends", "чит Fortnite", "чит PUBG", "чит Warzone",
      // Функциональные ключевые слова
      "аимбот", "валлхак", "ESP", "триггербот", "радар хак",
      // Качественные ключевые слова
      "безопасные читы", "приватные читы", "VIP читы", "мгновенная доставка",
      "пожизненные обновления", "поддержка 24/7", "гарантия возврата денег"
    ].join(", "),
    authors: [{ name: "Команда AtomCheats" }],
    creator: "AtomCheats",
    publisher: "AtomCheats",
    category: "Игровое ПО",
    classification: "Игровые инструменты",
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: '/ru',
      languages: {
        'ru': '/ru',
        'en': '/',
        'x-default': '/',
      },
    },
    openGraph: {
      title: "AtomCheats - Премиальные читы для игр | Необнаружимые игровые решения",
      description: "Премиальные необнаружимые читы для CS2, Valorant, Apex Legends и других игр. Мгновенная доставка, пожизненные обновления, поддержка 24/7. Более 10,000 довольных игроков.",
      url: '/ru',
      siteName: "AtomCheats",
      locale: "ru_RU",
      type: "website",
      images: [
        {
          url: '/images/og-image.jpg',
          width: 1200,
          height: 630,
          alt: 'AtomCheats - Премиальные читы для CS2, Valorant, Apex Legends',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@AtomCheats',
      creator: '@AtomCheats',
      title: "AtomCheats - Премиальные читы для игр",
      description: "Премиальные необнаружимые читы для CS2, Valorant, Apex Legends и других игр. Мгновенная доставка, пожизненные обновления, поддержка 24/7.",
      images: ['/images/og-image.jpg'],
    },
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
    verification: {
      google: process.env.GOOGLE_VERIFICATION,
      yandex: process.env.YANDEX_VERIFICATION,
    },
    other: {
      'theme-color': '#0f172a',
      'color-scheme': 'dark',
      'format-detection': 'telephone=no',
    },
  };
}