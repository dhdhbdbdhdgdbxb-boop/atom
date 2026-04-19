'use client';

import Head from 'next/head';
import { useLanguage } from '@/i18n/LanguageContext';
import { usePathname } from 'next/navigation';

export default function SEOHead({ 
  title, 
  description, 
  keywords, 
  canonical, 
  ogImage = '/images/og-image.jpg',
  structuredData = null 
}) {
  const { language } = useLanguage();
  const pathname = usePathname();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://localhost:3000';
  
  // Определяем текущий URL
  const currentUrl = `${baseUrl}${pathname}`;
  
  // Определяем альтернативные языковые версии
  const getAlternateUrls = () => {
    let basePath = pathname;
    
    // Убираем языковые префиксы из пути
    if (pathname.startsWith('/en')) {
      basePath = pathname.replace('/en', '') || '/';
    } else if (pathname.startsWith('/ru')) {
      basePath = pathname.replace('/ru', '') || '/';
    }
    
    return {
      ru: basePath === '/' ? baseUrl : `${baseUrl}${basePath}`,
      en: basePath === '/' ? `${baseUrl}/en` : `${baseUrl}/en${basePath}`,
      default: basePath === '/' ? baseUrl : `${baseUrl}${basePath}`
    };
  };
  
  const alternateUrls = getAlternateUrls();
  
  return (
    <Head>
      {/* Основные мета-теги */}
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content="index, follow" />
      <meta name="language" content={language === 'ru' ? 'Russian' : 'English'} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonical || currentUrl} />
      
      {/* Hreflang теги */}
      <link rel="alternate" hrefLang="ru" href={alternateUrls.ru} />
      <link rel="alternate" hrefLang="en" href={alternateUrls.en} />
      <link rel="alternate" hrefLang="x-default" href={alternateUrls.default} />
      
      {/* Open Graph теги */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={`${baseUrl}${ogImage}`} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="AtomCheats" />
      <meta property="og:locale" content={language === 'ru' ? 'ru_RU' : 'en_US'} />
      
      {/* Twitter Card теги */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${baseUrl}${ogImage}`} />
      
      {/* Дополнительные мета-теги */}
      <meta name="author" content="AtomCheats" />
      <meta name="publisher" content="AtomCheats" />
      <meta name="theme-color" content="#0f172a" />
      
      {/* Структурированные данные */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData)
          }}
        />
      )}
    </Head>
  );
}