'use client';

import { useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';

export default function LocaleChecker({ currentLocale }) {
  const { language, changeLanguage } = useLanguage();

  useEffect(() => {
    // Устанавливаем язык согласно текущей локали, если он отличается
    if (currentLocale && language !== currentLocale) {
      changeLanguage(currentLocale);
    }
  }, [currentLocale, language, changeLanguage]);

  return null;
}