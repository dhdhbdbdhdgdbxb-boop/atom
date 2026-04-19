import CatalogSlugPageClient from '../../../(pages)/catalog/[...slug]/page';

// Генерация метаданных для SEO (английская версия подкатегорий каталога)
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
    // /en/catalog/game/category
    const gameName = formatSlugToName(slugs[0]);
    const categoryName = formatSlugToName(slugs[1]);
    
    title = `${categoryName} for ${gameName} - Buy Cheats | AtomCheats`;
    description = `Premium ${categoryName} cheats for ${gameName}. Undetected cheats with aimbot, wallhack, ESP. Instant delivery, 24/7 support, quality guarantee.`;
    canonicalPath = `/en/catalog/${slugs[0]}/${slugs[1]}`;
  } else if (slugs.length === 1) {
    // /en/catalog/game
    const gameName = formatSlugToName(slugs[0]);
    
    title = `${gameName} Cheats - Catalog | AtomCheats`;
    description = `Complete catalog of ${gameName} cheats. Aimbot, wallhack, ESP, triggerbot. Undetected cheats with instant delivery and 24/7 support.`;
    canonicalPath = `/en/catalog/${slugs[0]}`;
  } else {
    // /en/catalog
    title = "Game Cheats Catalog - CS2, Valorant, Apex Legends | AtomCheats";
    description = "Complete catalog of premium game cheats for popular games: CS2, Valorant, Apex Legends, Fortnite. Undetected cheats with aimbot, wallhack, ESP.";
    canonicalPath = '/en/catalog';
  }

  return {
    title,
    description,
    keywords: [
      // Primary keywords
      "game cheats catalog", "buy game cheats", "premium cheats", "cheat store",
      // Game-specific keywords
      "CS2 cheat", "Valorant cheat", "Apex Legends cheat", "Fortnite cheat",
      // Feature keywords
      "aimbot", "wallhack", "ESP", "triggerbot", "radar hack",
      // Quality keywords
      "undetected cheats", "safe cheats", "private cheats",
      "instant delivery", "24/7 support", "quality guarantee",
      // Page-specific
      slugs.length > 0 ? formatSlugToName(slugs[0]) : "",
      slugs.length > 1 ? formatSlugToName(slugs[1]) : ""
    ].filter(Boolean).join(", "),
    authors: [{ name: "AtomCheats Team" }],
    creator: "AtomCheats",
    publisher: "AtomCheats",
    category: "Gaming Software",
    classification: "Gaming Tools",
    metadataBase: new URL(baseUrl),
    
    // Canonical и языковые альтернативы
    alternates: {
      canonical: canonicalPath,
      languages: {
        'ru': canonicalPath.replace('/en/', '/ru/'),
        'en': canonicalPath,
        'x-default': canonicalPath.replace('/en/', '/'),
      },
    },
    
    // Open Graph
    openGraph: {
      title,
      description,
      url: canonicalPath,
      siteName: "AtomCheats",
      locale: "en_US",
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

export default function EnglishCatalogSlugPage({ params }) {
  return <CatalogSlugPageClient />;
}