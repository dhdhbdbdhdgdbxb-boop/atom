'use client';

import { createContext, useContext, useState, useEffect, useRef } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children, initialLocale = 'en' }) => {
  // Функция для определения языка при инициализации
  const getInitialLanguage = () => {
    // На сервере всегда используем переданную локаль
    if (typeof window === 'undefined') {
      return initialLocale;
    }

    // Сначала проверяем куки
    const cookieLocale = document.cookie
      .split('; ')
      .find(row => row.startsWith('locale=') || row.startsWith('selectedLang='))
      ?.split('=')[1];
    
    if (cookieLocale && ['ru', 'en'].includes(cookieLocale)) {
      console.log('[LANG] Using locale from cookie:', cookieLocale);
      return cookieLocale;
    }

    // Затем проверяем localStorage (для обратной совместимости)
    const savedLang = localStorage.getItem('selectedLang');
    if (savedLang && ['ru', 'en'].includes(savedLang)) {
      console.log('[LANG] Using locale from localStorage:', savedLang);
      // Сохраняем в куки для будущих запросов
      document.cookie = `locale=${savedLang}; max-age=${365 * 24 * 60 * 60}; path=/; samesite=lax`;
      return savedLang;
    }

    // На клиенте определяем язык по URL path
    const pathname = window.location.pathname;
    
    if (pathname.startsWith('/ru')) {
      return 'ru';
    } else {
      // / и /en — английский
      return 'en';
    }
  };

  const [language, setLanguage] = useState(() => getInitialLanguage());
  const [translations, setTranslations] = useState({});
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const translationsCache = useRef({});

  // Available languages
  const languages = {
    ru: { name: 'Русский', code: 'ru' },
    en: { name: 'English', code: 'en' }
  };

  // Устанавливаем mounted состояние и синхронизируем язык
  useEffect(() => {
    setMounted(true);
    
    // После монтирования проверяем, нужно ли обновить язык
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;

      // Если у пользователя уже есть сохранённый язык — не перезаписываем
      const hasSavedLang =
        document.cookie.includes('selectedLang=') ||
        document.cookie.includes('locale=') ||
        localStorage.getItem('selectedLang');

      if (!hasSavedLang) {
        let urlLocale = 'en';
        if (pathname.startsWith('/ru')) urlLocale = 'ru';

        if (urlLocale !== language) {
          setLanguage(urlLocale);
          localStorage.setItem('selectedLang', urlLocale);
        }
      }
      
      // Автоматическое определение локали по IP при первом посещении
      const autoDetectLocale = async () => {
        // Проверяем, есть ли уже сохраненная локаль
        const hasLocaleCookie = document.cookie.includes('locale=');
        const hasLocalStorage = localStorage.getItem('selectedLang');
        
        // Если нет сохраненной локали, определяем по IP
        if (!hasLocaleCookie && !hasLocalStorage) {
          try {
            console.log('[LANG] Auto-detecting locale by IP...');
            const response = await fetch('/api/locale');
            const data = await response.json();
            
            if (data.success && data.locale && data.source === 'ip') {
              console.log('[LANG] Detected locale by IP:', data.locale);
              
              // Если определенная локаль отличается от текущей
              if (data.locale !== language) {
                setLanguage(data.locale);
                localStorage.setItem('selectedLang', data.locale);
                
                // Перенаправляем на правильную локаль если нужно
                const currentPath = window.location.pathname;
                let newPath;
                
                if (data.locale === 'ru') {
                  // Для русского убираем префикс /en
                  newPath = currentPath.replace('/en', '') || '/';
                } else {
                  // Для английского добавляем префикс /en
                  newPath = currentPath.startsWith('/en') ? currentPath : `/en${currentPath === '/' ? '' : currentPath}`;
                }
                
                if (newPath !== currentPath) {
                  console.log('[LANG] Redirecting to:', newPath);
                  window.location.href = newPath;
                }
              }
            }
          } catch (error) {
            console.error('[LANG] Error auto-detecting locale:', error);
          }
        }
      };
      
      // Запускаем автоопределение с задержкой, чтобы не влиять на гидратацию
      setTimeout(autoDetectLocale, 1000);
    }
  }, [initialLocale]);

  // Отслеживаем изменения URL для обновления языка
  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return;
    
    const handleUrlChange = () => {
      const pathname = window.location.pathname;
      
      let urlLocale = 'en';
      if (pathname.startsWith('/ru')) urlLocale = 'ru';
      
      if (urlLocale !== language) {
        setLanguage(urlLocale);
        localStorage.setItem('selectedLang', urlLocale);
        document.cookie = `locale=${urlLocale}; max-age=${365 * 24 * 60 * 60}; path=/; samesite=lax`;
      }
    };

    // Слушаем изменения в истории браузера
    window.addEventListener('popstate', handleUrlChange);
    
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
    };
  }, [mounted, language]);

  // Load translations when language changes
  useEffect(() => {
    const loadTranslations = async () => {
      // Проверяем кэш перед загрузкой
      if (translationsCache.current[language]) {
        setTranslations(translationsCache.current[language]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Load all translation files
        const translationModules = await Promise.all([
          import(`./locales/${language}/common.json`),
          import(`./locales/${language}/header.json`),
          import(`./locales/${language}/main.json`),
          import(`./locales/${language}/catalog.json`),
          import(`./locales/${language}/auth.json`),
          import(`./locales/${language}/profile.json`),
          import(`./locales/${language}/admin.json`),
          import(`./locales/${language}/footer.json`),
          import(`./locales/${language}/product.json`),
          import(`./locales/${language}/deposit.json`),
          import(`./locales/${language}/order.json`),
          import(`./locales/${language}/search.json`),
          import(`./locales/${language}/faq.json`),
          import(`./locales/${language}/news.json`),
          import(`./locales/${language}/reviews.json`)
        ]);

        // Merge all translations into a single object
        const mergedTranslations = {};
        translationModules.forEach(module => {
          Object.assign(mergedTranslations, module.default);
        });

        // Сохраняем в кэш
        translationsCache.current[language] = mergedTranslations;
        setTranslations(mergedTranslations);
      } catch (error) {
        console.error('Failed to load translations:', error);
        // Set fallback translations
        setTranslations({});
      } finally {
        setLoading(false);
      }
    };

    // Загружаем переводы только если язык действительно изменился
    if (language) {
      loadTranslations();
    }
  }, [language]);

  // Предзагрузка переводов другого языка в фоне
  useEffect(() => {
    if (!mounted || loading) return;

    const preloadOtherLanguage = async () => {
      const otherLang = language === 'ru' ? 'en' : 'ru';
      
      // Если уже загружен, пропускаем
      if (translationsCache.current[otherLang]) return;

      try {
        // Загружаем переводы другого языка в фоне
        const translationModules = await Promise.all([
          import(`./locales/${otherLang}/common.json`),
          import(`./locales/${otherLang}/header.json`),
          import(`./locales/${otherLang}/main.json`),
          import(`./locales/${otherLang}/catalog.json`),
          import(`./locales/${otherLang}/auth.json`),
          import(`./locales/${otherLang}/profile.json`),
          import(`./locales/${otherLang}/admin.json`),
          import(`./locales/${otherLang}/footer.json`),
          import(`./locales/${otherLang}/product.json`),
          import(`./locales/${otherLang}/deposit.json`),
          import(`./locales/${otherLang}/order.json`),
          import(`./locales/${otherLang}/search.json`),
          import(`./locales/${otherLang}/faq.json`),
          import(`./locales/${otherLang}/news.json`),
          import(`./locales/${otherLang}/reviews.json`)
        ]);

        const mergedTranslations = {};
        translationModules.forEach(module => {
          Object.assign(mergedTranslations, module.default);
        });

        // Сохраняем в кэш
        translationsCache.current[otherLang] = mergedTranslations;
      } catch (error) {
        console.error('Failed to preload translations:', error);
      }
    };

    // Запускаем предзагрузку с небольшой задержкой
    const timeoutId = setTimeout(preloadOtherLanguage, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [mounted, loading, language]);

  // Change language function - now saves to cookies and localStorage
  const changeLanguage = async (newLanguage) => {
    if (newLanguage === language) return;
    
    console.log('[LANG] Changing language to:', newLanguage);

    // Сохраняем куки сразу
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedLang', newLanguage);
      document.cookie = `selectedLang=${newLanguage}; max-age=${365 * 24 * 60 * 60}; path=/; samesite=lax`;
      document.cookie = `locale=${newLanguage}; max-age=${365 * 24 * 60 * 60}; path=/; samesite=lax`;
    }

    // Сохраняем через API
    try {
      await fetch('/api/locale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: newLanguage }),
      });
    } catch {}

    // Редиректим на URL с правильным префиксом языка
    if (typeof window !== 'undefined') {
      const pathname = window.location.pathname;
      let newPath;

      // Убираем текущий языковой префикс
      const stripped = pathname.replace(/^\/(ru|en)/, '') || '/';

      if (newLanguage === 'ru') {
        newPath = `/ru${stripped === '/' ? '' : stripped}`;
      } else {
        // en — без префикса (корень) или /en
        newPath = stripped;
      }

      if (newPath !== pathname) {
        window.location.href = newPath;
      } else {
        setLanguage(newLanguage);
      }
    }
  };

  // Helper function for interpolation
  const interpolate = (str, params) => {
    if (typeof str !== 'string') return str;
    return str.replace(/{([^}]+)}/g, (match, p1) => {
      return params[p1] !== undefined ? params[p1] : match;
    });
  };

  // Translation function with interpolation support
  const t = (key, paramsOrFallback = {}, fallback = '') => {
    let params = {};
    let fb = fallback;

    if (typeof paramsOrFallback === 'string') {
      fb = paramsOrFallback;
    } else {
      params = paramsOrFallback;
    }

    // Проверяем, что key является строкой
    if (!key || typeof key !== 'string') {
      return fb || key || '';
    }

    if (!translations || Object.keys(translations).length === 0) {
      return interpolate(fb || key, params);
    }
    
    const keys = key.split('.');
    let value = translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return interpolate(fb || key, params);
      }
    }
    
    return interpolate(typeof value === 'string' ? value : (fb || key), params);
  };

  const value = {
    language,
    languages,
    translations,
    t,
    changeLanguage,
    loading
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};