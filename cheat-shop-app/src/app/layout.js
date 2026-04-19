import { Inter, Manrope } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import { LanguageProvider } from "@/i18n/LanguageContext";
import { NotificationProvider } from "@/components/NotificationComponent";
// import ChatWidget from "@/components/ChatWidget";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  // Определяем локаль из URL или используем английский по умолчанию
  let locale = 'en';
  
  // Если есть params.locale, используем его
  if (resolvedParams?.locale) {
    locale = resolvedParams.locale;
  } else if (typeof window !== 'undefined') {
    // На клиенте определяем из pathname
    const pathname = window.location.pathname;
    if (pathname.startsWith('/ru')) {
      locale = 'ru';
    }
  }
  
  const seoData = {
    ru: {
      title: "AtomCheats - Премиальные читы для игр | Безопасные решения",
      description: "Лучшие читы для популярных игр: CS2, Valorant, Apex Legends, Fortnite. Мгновенная доставка, 100% безопасность, поддержка 24/7. Более 1000 довольных клиентов.",
      keywords: "читы для игр, чит CS2, чит Valorant, чит Apex Legends, чит Fortnite, безопасные читы, премиум читы, игровые читы",
      openGraph: {
        title: "AtomCheats - Премиальные читы для игр",
        description: "Безопасные читы для популярных игр с мгновенной доставкой и гарантией качества",
        siteName: "AtomCheats",
        locale: "ru_RU",
        type: "website",
      }
    },
    en: {
      title: "AtomCheats - Premium Game Cheats | Safe Gaming Solutions",
      description: "Best cheats for popular games: CS2, Valorant, Apex Legends, Fortnite. Instant delivery, 100% safety, 24/7 support. Over 1000 satisfied customers.",
      keywords: "game cheats, CS2 cheat, Valorant cheat, Apex Legends cheat, Fortnite cheat, safe cheats, premium cheats, gaming cheats",
      openGraph: {
        title: "AtomCheats - Premium Game Cheats",
        description: "Safe cheats for popular games with instant delivery and quality guarantee",
        siteName: "AtomCheats",
        locale: "en_US",
        type: "website",
      }
    }
  };

  const currentSeo = seoData[locale] || seoData.en;

  return {
    title: currentSeo.title,
    description: currentSeo.description,
    keywords: currentSeo.keywords,
    authors: [{ name: "AtomCheats" }],
    creator: "AtomCheats",
    publisher: "AtomCheats",
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://localhost:3000'),
    alternates: {
      canonical: locale === 'ru' ? '/ru' : '/',
      languages: {
        'ru': '/ru',
        'en': '/',
        'x-default': '/',
      },
    },
    openGraph: {
      ...currentSeo.openGraph,
      url: locale === 'ru' ? '/ru' : '/',
      images: [
        {
          url: '/images/og-image.jpg',
          width: 1200,
          height: 630,
          alt: currentSeo.openGraph.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: currentSeo.title,
      description: currentSeo.description,
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
  };
}

export default function RootLayout({ children, params }) {
  // Функция для определения локали
  const getLocaleFromPath = () => {
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      if (pathname.startsWith('/en')) {
        return 'en';
      } else if (pathname.startsWith('/ru')) {
        return 'ru';
      }
    }
    return 'en'; // По умолчанию английский
  };

  // Определяем локаль из params или из URL
  const locale = params?.locale || getLocaleFromPath();
  
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        
        {/* SEO мета-теги */}
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="googlebot" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="bingbot" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
        {/* Preconnect для улучшения производительности */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS prefetch для внешних ресурсов */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        
        {/* Hreflang теги для мультиязычности */}
        <link rel="alternate" hrefLang="en" href={process.env.NEXT_PUBLIC_SITE_URL || 'https://localhost:3000'} />
        <link rel="alternate" hrefLang="ru" href={`${process.env.NEXT_PUBLIC_SITE_URL || 'https://localhost:3000'}/ru`} />
        <link rel="alternate" hrefLang="x-default" href={process.env.NEXT_PUBLIC_SITE_URL || 'https://localhost:3000'} />
      </head>
      <body
        className={`${inter.variable} ${manrope.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        <LanguageProvider initialLocale={locale}>
          <NotificationProvider>
            <Providers>
              {children}
            </Providers>
            {/* <ChatWidget /> */}
          </NotificationProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}