// Генерация метаданных для SEO (основная английская версия каталога)
export async function generateMetadata() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  
  return {
    title: "Game Cheats Catalog - CS2, Valorant, Apex Legends | AtomCheats",
    description: "Complete catalog of premium game cheats for popular games: CS2, Valorant, Apex Legends, Fortnite. Undetected cheats with aimbot, wallhack, ESP. Instant delivery, 24/7 support.",
    keywords: [
      // Primary keywords
      "game cheats catalog", "buy game cheats", "premium cheats", "cheat store",
      // Game-specific keywords
      "CS2 cheat", "Counter Strike 2 hack", "Valorant cheat", "Apex Legends cheat", 
      "Fortnite cheat", "PUBG cheat", "Warzone cheat",
      // Feature keywords
      "aimbot", "wallhack", "ESP", "triggerbot", "radar hack",
      // Quality keywords
      "undetected cheats", "safe cheats", "private cheats", "VIP cheats",
      "instant delivery", "24/7 support", "quality guarantee"
    ].join(", "),
    authors: [{ name: "AtomCheats Team" }],
    creator: "AtomCheats",
    publisher: "AtomCheats",
    category: "Gaming Software",
    classification: "Gaming Tools",
    metadataBase: new URL(baseUrl),
    
    // Canonical и языковые альтернативы
    alternates: {
      canonical: '/catalog',
      languages: {
        'ru': '/ru/catalog',
        'en': '/catalog',
        'x-default': '/catalog',
      },
    },
    
    // Open Graph
    openGraph: {
      title: "Game Cheats Catalog - CS2, Valorant, Apex Legends | AtomCheats",
      description: "Complete catalog of premium undetected game cheats. Aimbot, wallhack, ESP for CS2, Valorant, Apex Legends. Instant delivery, 24/7 support.",
      url: '/catalog',
      siteName: "AtomCheats",
      locale: "en_US",
      type: "website",
      images: [
        {
          url: '/images/og-image.jpg',
          width: 1200,
          height: 630,
          alt: 'AtomCheats - Game Cheats Catalog',
        },
      ],
    },
    
    // Twitter Card
    twitter: {
      card: 'summary_large_image',
      site: '@AtomCheats',
      creator: '@AtomCheats',
      title: "Game Cheats Catalog | AtomCheats",
      description: "Premium undetected cheats for CS2, Valorant, Apex Legends. Aimbot, wallhack, ESP. Instant delivery, 24/7 support.",
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

export default function CatalogLayout({ children }) {
  return children;
}