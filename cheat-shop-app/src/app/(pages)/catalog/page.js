'use client';

import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CatalogAutoUpdater from '@/components/CatalogAutoUpdater';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

// Утилитарная функция для декодирования и форматирования названий
const formatNameFromSlug = (slug) => {
  if (!slug) return '';
  
  try {
    // Декодируем URL-encoded строку
    let decoded = decodeURIComponent(slug);
    
    // Заменяем дефисы на пробелы
    decoded = decoded.replace(/-/g, ' ');
    
    // Заменяем специальные символы
    decoded = decoded.replace(/%3A/g, ':');
    decoded = decoded.replace(/\(/g, '(');
    decoded = decoded.replace(/\)/g, ')');
    
    // Делаем первую букву каждого слова заглавной
    decoded = decoded.replace(/\b\w/g, l => l.toUpperCase());
    
    return decoded;
  } catch (error) {
    console.error('Error decoding slug:', error);
    return slug.replace(/-/g, ' ');
  }
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  }
};

function CatalogContent() {
  const { language: lang, t } = useLanguage();
  const [currentLevel, setCurrentLevel] = useState('main');
  const [currentGame, setCurrentGame] = useState(null);
  const [currentCategory, setCurrentCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [languageChanged, setLanguageChanged] = useState(false);
  
  const router = useRouter();
  const searchParams = useSearchParams();

  // Обрабатываем query parameters при загрузке
  useEffect(() => {
    const game = searchParams.get('game');
    const category = searchParams.get('category');
    const search = searchParams.get('search') || '';
    
    setSearchQuery(search);
    
    if (search) {
      setCurrentLevel('search');
      setCurrentGame(null);
      setCurrentCategory(null);
    } else if (category && game) {
      setCurrentLevel('category');
      setCurrentGame(game);
      setCurrentCategory(category);
    } else if (game) {
      setCurrentLevel('game');
      setCurrentGame(game);
      setCurrentCategory(null);
    } else {
      setCurrentLevel('main');
      setCurrentGame(null);
      setCurrentCategory(null);
    }
  }, [searchParams]);

  // Функция для получения контента с помощью t
  const getLocalizedContent = () => {
    return {
      title: t('catalog.title', "Каталог товаров"),
      subtitle: t('catalog.subtitle', "Выберите игру или категорию для просмотра товаров"),
      products: t('catalog.products', "продуктов"),
      from: t('catalog.from', "от"),
      catalog: t('catalog.catalog', "Каталог"),
      undetected: t('catalog.undetected', "Undetected"),
      detected: t('catalog.detected', "Detected"),
      useAtOwnRisk: t('catalog.useAtOwnRisk', "Use at own risk"),
      searchPlaceholder: t('catalog.searchPlaceholder', "Поиск игр и товаров..."),
      backToCatalog: t('catalog.backToCatalog', "Назад в каталог"),
      backToGame: t('catalog.backToGame', "Назад к игре"),
      resultsFound: t('catalog.resultsFound', "результатов найдено"),
      games: t('catalog.games', "игр"),
      categories: t('catalog.categories', "категорий"),
      product: t('catalog.product', "товар"),
      productsLabel: t('catalog.productsLabel', "Товары"),
      categoriesLabel: t('catalog.categoriesLabel', "Категории"),
      gamesLabel: t('catalog.gamesLabel', "Игры"),
      selectProduct: t('catalog.selectProduct', "Выберите товар для покупки"),
      selectCategory: t('catalog.selectCategory', "Выберите категорию товаров"),
      searching: t('catalog.searching', "Поиск..."),
      loadingData: t('catalog.loadingData', "Загрузка данных..."),
      nothingFound: t('catalog.nothingFound', "Ничего не найдено"),
      tryDifferentQuery: t('catalog.tryDifferentQuery', "Попробуйте изменить поисковый запрос или"),
      returnToCatalog: t('catalog.returnToCatalog', "вернуться в каталог")
    };
  };

  const currentContent = getLocalizedContent();

  // Database state
  const [catalogData, setCatalogData] = useState({});
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Handle search
  const handleSearch = useCallback(async (query) => {
    const searchValue = query.trim();
    setSearchQuery(searchValue);
    setIsSearching(true);

    if (searchValue) {
      const newParams = new URLSearchParams();
      newParams.set('search', searchValue);
      router.push(`/catalog?${newParams.toString()}`);
    } else {
      router.push('/catalog');
    }
    setIsSearching(false);
  }, [router]);

  // Load catalog data from API
  const loadCatalogData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      const params = new URLSearchParams();
      if (currentGame) params.append('game', currentGame);
      if (currentCategory) params.append('category', currentCategory);
      if (searchQuery && currentLevel === 'search') {
        params.append('search', searchQuery);
      }
      params.append('lang', lang);
      
      // Добавляем timestamp для обхода кеша браузера
      params.append('_t', Date.now().toString());
      
      // Добавляем заголовки для оптимизации кэширования
      const response = await fetch(`/api/catalog?${params.toString()}`, {
        headers: {
          'Cache-Control': 'max-age=60', // Кэш на 1 минуту
        }
      });
      const data = await response.json();

      if (data.success) {
        setCatalogData(data.data);
      } else {
        console.error('❌ Ошибка загрузки каталога:', data.error);
      }
    } catch (error) {
      console.error('❌ Ошибка загрузки данных каталога:', error);
    } finally {
      setIsLoadingData(false);
      setIsInitialLoad(false);
    }
  }, [currentGame, currentCategory, searchQuery, currentLevel, lang]);

  // Reload data when language changes
  useEffect(() => {
    if (lang) {
      loadCatalogData();
    }
  }, [lang, loadCatalogData]);

  // Debounced search
  useEffect(() => {
    if (searchQuery && currentLevel !== 'search') {
      const timeoutId = setTimeout(() => {
        handleSearch(searchQuery);
      }, 500);

      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, currentLevel, handleSearch]);

  // Handle search input change
  const handleSearchInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  // Load data when level changes
  useEffect(() => {
    loadCatalogData();
  }, [currentLevel, currentGame, currentCategory, loadCatalogData]);

  // Clear search when navigating away from search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    const newParams = new URLSearchParams();
    if (currentGame) newParams.set('game', currentGame);
    if (currentCategory) newParams.set('category', currentCategory);
    router.push(`/catalog?${newParams.toString()}`);
  }, [currentGame, currentCategory, router]);

  // Функция для получения данных для текущего уровня
  const getCurrentData = () => {
    let data = [];
    
    if (currentLevel === 'search') {
      data = catalogData.search || [];
    } else if (currentLevel === 'category' && currentGame && currentCategory) {
      data = catalogData[`${currentGame}-${currentCategory}`] || [];
      
      if (data.length === 0) {
        const alternativeKey = Object.keys(catalogData).find(key =>
          key.includes(currentGame) && key.includes(currentCategory)
        );
        if (alternativeKey) {
          data = catalogData[alternativeKey] || [];
        }
      }
    } else if (currentLevel === 'game' && currentGame) {
      data = catalogData[currentGame] || [];
    } else {
      data = Array.isArray(catalogData.main) ? catalogData.main : [];
    }

    return data;
  };

  // Функция для получения типа результата
  const getResultTypeLabel = (type) => {
    switch (type) {
      case 'game': return currentContent.gamesLabel;
      case 'category': return currentContent.categoriesLabel;
      case 'product': return currentContent.productsLabel;
      default: return type;
    }
  };

  // Функция для получения хлебных крошек
  const getBreadcrumbs = () => {
    const breadcrumbs = [
      {
        name: currentContent.catalog,
        path: '/catalog',
        active: currentLevel === 'main'
      }
    ];

    if (currentLevel === 'game' && currentGame) {
      // Ищем игру в данных main по slug
      const gameData = Array.isArray(catalogData.main) 
        ? catalogData.main.find(item => item.id === currentGame || item.slug === currentGame) 
        : null;
      
      // Используем только название из данных, без fallback
      const gameName = gameData?.name || '';
      
      if (gameName) {
        breadcrumbs.push(
          { name: gameName, path: `/catalog?game=${currentGame}`, active: true }
        );
      }
    } else if (currentLevel === 'category' && currentGame && currentCategory) {
      // Ищем игру в данных main по slug
      const gameData = Array.isArray(catalogData.main) 
        ? catalogData.main.find(item => item.id === currentGame || item.slug === currentGame) 
        : null;
      
      // Используем только название из данных, без fallback
      const gameName = gameData?.name || '';
      
      // Ищем локализованное имя категории в данных
      let categoryName = null;
      
      // Сначала ищем в специальном ключе для информации о категории
      const categoryKey = `${currentGame}-${currentCategory}-category`;
      if (catalogData[categoryKey]) {
        categoryName = catalogData[categoryKey].name;
      } else {
        // Ищем в данных игры (список категорий)
        const gameCategories = catalogData[currentGame];
        if (Array.isArray(gameCategories)) {
          const categoryData = gameCategories.find(item => 
            item.id === currentCategory || item.slug === currentCategory
          );
          if (categoryData) {
            categoryName = categoryData.name;
          }
        }
      }
      
      // Добавляем хлебные крошки только если есть названия
      if (gameName && categoryName) {
        breadcrumbs.push(
          { name: gameName, path: `/catalog?game=${currentGame}`, active: false },
          { name: categoryName, path: `/catalog?game=${currentGame}&category=${currentCategory}`, active: true }
        );
      }
    }

    return breadcrumbs;
  };

  // Функция для получения заголовка текущего уровня
  const getCurrentTitle = () => {
    if (currentLevel === 'category' && currentGame && currentCategory) {
      // Если данные еще не загружены, не показываем заголовок
      if (isLoadingData && isInitialLoad) {
        return '';
      }
      
      // Ищем локализованное имя категории в данных
      let categoryName = null;
      
      // Сначала ищем в специальном ключе для информации о категории
      const categoryKey = `${currentGame}-${currentCategory}-category`;
      if (catalogData[categoryKey]) {
        categoryName = catalogData[categoryKey].name;
      } else {
        // Ищем в данных игры (список категорий)
        const gameCategories = catalogData[currentGame];
        if (Array.isArray(gameCategories)) {
          const categoryData = gameCategories.find(item => 
            item.id === currentCategory || item.slug === currentCategory
          );
          if (categoryData) {
            categoryName = categoryData.name;
          }
        }
      }
      
      // Возвращаем только найденное название или пустую строку
      return categoryName || '';
    } else if (currentLevel === 'game' && currentGame) {
      // Если данные еще не загружены, не показываем заголовок
      if (isLoadingData && isInitialLoad) {
        return '';
      }
      
      // Находим игру в данных main, используя slug или id
      const gameData = Array.isArray(catalogData.main) 
        ? catalogData.main.find(item => item.id === currentGame || item.slug === currentGame) 
        : null;
      
      // Возвращаем только найденное название или пустую строку
      return gameData?.name || '';
    } else {
      return currentContent.title;
    }
  };

  // Функция для получения подзаголовка текущего уровня
  const getCurrentSubtitle = () => {
    if (currentLevel === 'category') {
      return currentContent.selectProduct;
    } else if (currentLevel === 'game') {
      return currentContent.selectCategory;
    } else {
      return currentContent.subtitle;
    }
  };

  // Функция для обработки клика по карточке
  const handleCardClick = (item) => {
    if (item.linkType === 'internal') {
      // Преобразуем старые URL в новые slug-based URL
      if (item.target.includes('/catalog?game=') && item.target.includes('&category=')) {
        const url = new URL(item.target, window.location.origin);
        const game = url.searchParams.get('game');
        const category = url.searchParams.get('category');
        router.push(`/catalog/${encodeURIComponent(game)}/${encodeURIComponent(category)}`);
      } else if (item.target.includes('/catalog?game=')) {
        const url = new URL(item.target, window.location.origin);
        const game = url.searchParams.get('game');
        router.push(`/catalog/${encodeURIComponent(game)}`);
      } else {
        router.push(item.target);
      }
    } else if (item.linkType === 'external') {
      window.open(item.target, '_blank');
    }
  };

  // Функция для получения заголовка результата поиска
  const getSearchResultsTitle = () => {
    const data = getCurrentData();
    const totalCount = data.length;
    const gamesCount = data.filter(item => item.type === 'game').length;
    const categoriesCount = data.filter(item => item.type === 'category').length;
    const productsCount = data.filter(item => item.type === 'product').length;

    return `${totalCount} ${currentContent.resultsFound} - ${gamesCount} ${currentContent.games}, ${categoriesCount} ${currentContent.categories}, ${productsCount} ${currentContent.products}`;
  };

  // Функция для обработки клика по хлебным крошкам
  const handleBreadcrumbClick = useCallback((path) => {
    if (path === '/catalog' && currentLevel === 'search') {
      clearSearch();
    } else {
      router.push(path);
    }
  }, [currentLevel, clearSearch, router]);

  // Функция для получения цвета статуса чита
  const getCheatStatusColor = (status) => {
    switch (status) {
      case 'undetected': return 'bg-slate-800/80 text-green-300';
      case 'detected': return 'bg-slate-800/80 text-red-300';
      case 'useAtOwnRisk': return 'bg-slate-800/80 text-yellow-300';
      case 'onUpdate': return 'bg-slate-800/80 text-blue-300';
      default: return 'bg-slate-800/80 text-slate-300';
    }
  };

  // Функция для получения цвета кружка статуса
  const getCheatStatusDotColor = (status) => {
    switch (status) {
      case 'undetected': return 'bg-green-300';
      case 'detected': return 'bg-red-300';
      case 'useAtOwnRisk': return 'bg-yellow-300';
      case 'onUpdate': return 'bg-blue-300';
      default: return 'bg-slate-300';
    }
  };

  // Функция для получения иконки типа
  const getTypeIcon = (type) => {
    switch (type) {
      case 'game': return '🎮';
      case 'category': return '📁';
      case 'product': return '📦';
      default: return '📄';
    }
  };

  // Функция для получения текста статуса чита
  const getCheatStatusText = (status) => {
    switch (status) {
      case 'undetected': return currentContent.undetected;
      case 'detected': return currentContent.detected;
      case 'useAtOwnRisk': return currentContent.useAtOwnRisk;
      case 'onUpdate': return currentContent.onUpdate || 'On update';
      default: return status;
    }
  };

  const currentData = getCurrentData();
  const breadcrumbs = getBreadcrumbs();

  return (
    <>
      <CatalogAutoUpdater />
      <Header />
      
      {/* Background Image */}
      <div
        className="absolute top-0 left-0 w-full h-full bg-cover bg-top bg-no-repeat pointer-events-none z-0"
        style={{ backgroundImage: 'url(/images/backgrounds/grid.png)' }}
      />
      
      <div className="min-h-screen pt-20 relative z-10">
        {/* Hero Section */}
        <div className="relative">
          <div className="w-full px-4 sm:px-8 lg:px-48 py-8">
            {/* Хлебные крошки с стрелочками */}
            <motion.div
              className="flex items-center gap-2 mb-4 flex-wrap"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {breadcrumbs.map((breadcrumb, index) => (
                <div key={index} className="flex items-center gap-2">
                  {index > 0 && (
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  )}
                  {breadcrumb.active ? (
                    <span className="text-cyan-400 font-medium text-sm">
                      {breadcrumb.name}
                    </span>
                  ) : (
                    <button
                      onClick={() => handleBreadcrumbClick(breadcrumb.path)}
                      className="text-slate-400 hover:text-cyan-300 transition-colors text-sm font-medium hover:cursor-pointer"
                    >
                      {breadcrumb.name}
                    </button>
                  )}
                </div>
              ))}
            </motion.div>
            
            <div className="text-left max-w-4xl">
              <motion.h1
                className="text-4xl lg:text-5xl font-bold text-white mb-3"
                style={{ fontFamily: 'var(--font-manrope)' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                {getCurrentTitle()}
              </motion.h1>
              <motion.p
                className="text-lg text-slate-400 mb-4"
                style={{ fontFamily: 'var(--font-inter)' }}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                {getCurrentSubtitle()}
              </motion.p>
            </div>
          </div>
        </div>

        {/* Products Grid Section */}
        <section className="py-8">
          <div className="w-full px-4 sm:px-8 lg:px-48">
            {/* Search Section */}
            <div className="mb-6">
              <div className="flex-1 bg-slate-800 rounded-xl p-3 border border-slate-700 max-w-md">
                <div className="flex items-center gap-3">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchInputChange}
                    placeholder={currentContent.searchPlaceholder}
                    className="bg-transparent border-none outline-none text-white placeholder-slate-400 w-full text-sm"
                    disabled={isSearching}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        if (currentLevel === 'search') {
                          clearSearch();
                        }
                      }}
                      className="text-slate-400 hover:text-white transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Search Results Header */}
            {currentLevel === 'search' && currentData.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xl text-slate-300 mb-2">
                  {getSearchResultsTitle()}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {currentData.map((item) => (
                    <span
                      key={`${item.type}-${item.id}`}
                      className="px-2 py-1 bg-slate-700 text-slate-300 text-xs rounded-full"
                    >
                      {getTypeIcon(item.type)} {getResultTypeLabel(item.type)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Loading State */}
            {(isLoadingData && isInitialLoad) ? (
              <div className="text-center py-16">
                <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : currentData.length === 0 && !isLoadingData ? (
              <div className="text-center py-16">
                {currentLevel === 'search' ? (
                  <>
                    <div className="text-slate-400 text-lg mb-4">{currentContent.nothingFound}</div>
                    <p className="text-slate-500">
                      {currentContent.tryDifferentQuery}{' '}
                      <button
                        onClick={clearSearch}
                        className="text-cyan-400 hover:text-cyan-300 transition-colors"
                      >
                        {currentContent.returnToCatalog}
                      </button>
                    </p>
                  </>
                ) : (
                  <>
                    <div className="text-slate-400 text-lg mb-4">Нет доступных товаров</div>
                    <p className="text-slate-500">
                      В данной категории пока нет товаров или они временно недоступны
                    </p>
                  </>
                )}
              </div>
            ) : (
              <>
                {/* Mobile version - all cards */}
                <div className="grid grid-cols-1 gap-6 lg:hidden">
                  {currentData.map((item) => {
                    return (
                      <div
                        key={item.id}
                        className={`relative rounded-2xl p-6 cursor-pointer transition-all duration-200 overflow-hidden hover:brightness-75 ${item.type === 'product' ? 'flex-row aspect-[16/9] min-h-[200px]' : 'flex flex-col justify-end aspect-[3/4] min-h-[320px]'}`}
                        style={{
                          backgroundImage: item.backgroundImage ? `url(${item.backgroundImage})` : undefined,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          backgroundRepeat: 'no-repeat',
                          backgroundColor: item.backgroundImage ? 'transparent' : '#1e293b'
                        }}
                        onClick={() => handleCardClick(item)}
                      >
                        {/* Dark overlay for better text readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent rounded-2xl" />
                        
                        {/* Cheat status badge - only for products with cheatStatus */}
                        {item.type === 'product' && item.cheatStatus && (
                          <div className={`absolute top-4 right-4 px-2 py-1 rounded-lg text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30 z-10`}>
                            {getCheatStatusText(item.cheatStatus)}
                          </div>
                        )}

                        {/* Bottom block with name, count and price */}
                        <div className="flex justify-between items-end mt-auto relative z-10">
                          {/* Left side: Name and quantity */}
                          <div className="flex flex-col">
                            <h3 className="text-white text-sm font-normal leading-tight drop-shadow-lg">
                              {item.name}
                            </h3>
                            {item.type !== 'product' && (
                              <span className="text-slate-200 text-xs font-normal leading-tight drop-shadow">
                                {item.productCount} {currentContent.products}
                              </span>
                            )}
                          </div>

                          {/* Right side: Price */}
                          <div className="text-white text-base font-normal text-right drop-shadow-lg">
                            {item.type === 'product' ? currentContent.from + ' ' : ''}{item.priceFrom}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop version - 4 columns like main page */}
                <div className="hidden lg:grid lg:grid-cols-4 gap-6">
                  {currentData.map((item) => {
                    return (
                      <div
                        key={item.id}
                        className="relative rounded-2xl p-6 flex flex-col justify-end cursor-pointer aspect-[3/4] min-h-[320px] transition-all duration-200 overflow-hidden hover:brightness-75"
                        style={{
                          backgroundImage: item.backgroundImage ? `url(${item.backgroundImage})` : undefined,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          backgroundRepeat: 'no-repeat',
                          backgroundColor: item.backgroundImage ? 'transparent' : '#1e293b'
                        }}
                        onClick={() => handleCardClick(item)}
                      >
                        {/* Dark overlay for better text readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent rounded-2xl" />
                        
                        {/* Cheat status badge - only for products with cheatStatus */}
                        {item.type === 'product' && item.cheatStatus && (
                          <div className={`absolute top-4 right-4 px-2 py-1 rounded-lg text-xs font-medium bg-green-500/20 text-green-300 border border-green-500/30 z-10`}>
                            {getCheatStatusText(item.cheatStatus)}
                          </div>
                        )}
                        
                        {/* Bottom block with name, count and price */}
                        <div className="flex justify-between items-end mt-auto relative z-10">
                          {/* Left side: Name and quantity */}
                          <div className="flex flex-col">
                            <h3 className="text-white text-sm font-normal leading-tight drop-shadow-lg">
                              {item.name}
                            </h3>
                            {item.type !== 'product' && (
                              <span className="text-slate-200 text-xs font-normal leading-tight drop-shadow">
                                {item.productCount} {currentContent.products}
                              </span>
                            )}
                          </div>

                          {/* Right side: Price */}
                          <div className="text-white text-base font-normal text-right drop-shadow-lg">
                            {item.type === 'product' ? currentContent.from + ' ' : ''}{item.priceFrom}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={
      <>
        <Header />
        <div
          className="absolute top-0 left-0 w-full h-full bg-cover bg-top bg-no-repeat pointer-events-none z-0"
          style={{ backgroundImage: 'url(/images/backgrounds/grid.png)' }}
        />
        <div className="min-h-screen pt-20 relative z-10 flex items-center justify-center">
          <div className="text-white text-xl">Загрузка каталога...</div>
        </div>
        <Footer />
      </>
    }>
      <CatalogContent />
    </Suspense>
  );
}
