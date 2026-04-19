'use client';

import { usePathname } from 'next/navigation';
import { useLanguage } from '@/i18n/LanguageContext';

export default function HreflangTags() {
  const pathname = usePathname();
  const { language } = useLanguage();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://localhost:3000';
  
  // Определяем путь без локали
  let pathWithoutLocale = pathname;
  
  if (pathname.startsWith('/en')) {
    pathWithoutLocale = pathname.replace('/en', '') || '/';
  } else if (pathname.startsWith('/ru')) {
    pathWithoutLocale = pathname.replace('/ru', '') || '/';
  }
  
  // Для главной страницы используем корневой путь
  const cleanPath = pathWithoutLocale === '/' ? '' : pathWithoutLocale;
  
  return (
    <>
      {/* Русская версия - корневой домен */}
      <link 
        rel="alternate" 
        hrefLang="ru" 
        href={`${baseUrl}${cleanPath}`} 
      />
      {/* Английская версия - с префиксом /en */}
      <link 
        rel="alternate" 
        hrefLang="en" 
        href={`${baseUrl}/en${cleanPath}`} 
      />
      {/* По умолчанию - русская версия */}
      <link 
        rel="alternate" 
        hrefLang="x-default" 
        href={`${baseUrl}${cleanPath}`} 
      />
    </>
  );
}