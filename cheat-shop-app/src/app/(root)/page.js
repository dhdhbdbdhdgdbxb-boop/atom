import HomeClient from './HomeClient';

// Метаданные для корневой страницы (английская версия)
export async function generateMetadata() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://localhost:3000';
  
  return {
    title: "AtomCheats - Premium Game Cheats & Hacks | CS2, Valorant, Apex Legends",
    description: "Get premium game cheats for CS2, Valorant, Apex Legends, Fortnite with instant delivery. 100% undetected, 24/7 support, lifetime updates. Join 10,000+ satisfied gamers worldwide.",
    keywords: [
      // Primary keywords
      "game cheats", "premium cheats", "undetected cheats", "gaming hacks",
      // Game-specific keywords
      "CS2 cheat", "Counter Strike 2 hack", "Valorant cheat", "Valorant hack",
      "Apex Legends cheat", "Fortnite cheat", "PUBG cheat", "Warzone cheat",
      // Feature keywords
      "aimbot", "wallhack", "ESP", "triggerbot", "radar hack",
      // Quality keywords
      "safe cheats", "private cheats", "VIP cheats", "instant delivery",
      "lifetime updates", "24/7 support", "money back guarantee"
    ].join(", "),
    authors: [{ name: "AtomCheats Team" }],
    creator: "AtomCheats",
    publisher: "AtomCheats",
    category: "Gaming Software",
    classification: "Gaming Tools",
    metadataBase: new URL(baseUrl),
    alternates: {
      canonical: '/',
      languages: {
        'en': '/',
        'ru': '/ru',
        'x-default': '/',
      },
    },
    openGraph: {
      title: "AtomCheats - Premium Game Cheats & Hacks | Undetected Gaming Solutions",
      description: "Premium undetected cheats for CS2, Valorant, Apex Legends & more. Instant delivery, lifetime updates, 24/7 support. Join 10,000+ satisfied gamers.",
      url: '/',
      siteName: "AtomCheats",
      locale: "en_US",
      type: "website",
      images: [
        {
          url: '/images/og-image.jpg',
          width: 1200,
          height: 630,
          alt: 'AtomCheats - Premium Game Cheats for CS2, Valorant, Apex Legends',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      site: '@AtomCheats',
      creator: '@AtomCheats',
      title: "AtomCheats - Premium Game Cheats & Hacks",
      description: "Premium undetected cheats for CS2, Valorant, Apex Legends & more. Instant delivery, lifetime updates, 24/7 support.",
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

export default function Home({ locale }) {
  return <HomeClient locale={locale} />;
}