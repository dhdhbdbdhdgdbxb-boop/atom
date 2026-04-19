'use client';

import { useState, useRef, useEffect } from 'react';
import { Shield, ShoppingCart, Search, Zap, Users, CheckCircle, Star, Lock, ChevronRight, Package } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CatalogAutoUpdater from '@/components/CatalogAutoUpdater';
import PageVisitTracker from '@/components/PageVisitTracker';
import StructuredData from '@/components/StructuredData';
import { useLanguage } from '@/i18n/LanguageContext';
import Image from 'next/image';
import SearchModal from '@/components/SearchModal';

const badgeVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.15,
      duration: 0.5,
      type: "spring",
      stiffness: 70,
    },
  }),
};

const titleVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { delay: 0.3, duration: 0.7, type: "spring" } },
};

const paraVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { delay: 0.5, duration: 0.7, type: "spring" } },
};

const buttonVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: (i) => ({
    opacity: 1,
    scale: 1,
    transition: { delay: 0.7 + i * 0.1, duration: 0.4, type: "spring" },
  }),
};

const statVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: 1 + i * 0.15, duration: 0.5, type: "spring" },
  }),
};

const imageVariants = {
  hidden: { opacity: 0, x: 50 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { delay: 0.8, duration: 0.7, type: "spring" }
  },
};

const productVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, type: "spring" },
  }),
};

const FeatureCard = ({ feature, index, isActive }) => {
  const cardRef = useRef(null);

  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);

  const handleMove = (e) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();

    setPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={cardRef}
      className="relative bg-slate-800/30 border border-slate-700/50 rounded-2xl 
                 p-6 lg:p-8 overflow-hidden cursor-pointer h-full flex flex-col"
      onMouseMove={handleMove}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {/* SMOOTH APPEAR / DISAPPEAR */}
      <AnimatePresence>
        {visible && (
          <>
            {/* Outer glow */}
            <motion.div
              key="outer"
              className="absolute w-32 h-32 rounded-full blur-3xl pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                transform: `translate(${pos.x}px, ${pos.y}px) translate(-50%, -50%)`,
                background:
                  "radial-gradient(circle, rgba(34,211,238,0.2), transparent)",
              }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />

            {/* Inner glow */}
            <motion.div
              key="inner"
              className="absolute w-20 h-20 rounded-full blur-2xl pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.8 }}
              exit={{ opacity: 0 }}
              style={{
                transform: `translate(${pos.x}px, ${pos.y}px) translate(-50%, -50%)`,
                background:
                  "radial-gradient(circle, rgba(59,130,246,0.25), transparent)",
              }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </>
        )}
      </AnimatePresence>

      {/* CONTENT */}
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-2 bg-cyan-500/10 rounded-xl">
            {feature.icon}
          </div>

          <h3
            className="text-xl font-semibold text-white"
            style={{ fontFamily: "var(--font-manrope)" }}
          >
            {feature.title}
          </h3>
        </div>

        <p
          className="text-slate-400/60 leading-relaxed flex-1"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          {feature.description}
        </p>
      </div>
    </div>
  );
};

export default function HomeClient({ locale }) {
  const { t, language, loading: languageLoading } = useLanguage();
  const router = useRouter();
  const [activeFeature, setActiveFeature] = useState(null);
  const [catalogData, setCatalogData] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Устанавливаем mounted состояние после гидратации
  useEffect(() => {
    setMounted(true);
  }, []);

  // Устанавливаем язык из параметра locale при монтировании
  useEffect(() => {
    if (locale && locale !== language) {
      // Обновляем контекст языка, если locale отличается
      // Это будет обработано в LanguageContext
    }
  }, [locale, language]);

  // Функция для генерации правильных ссылок с учетом языка
  const getLocalizedLink = (path) => {
    if (!mounted) return path; // До гидратации возвращаем базовый путь
    
    const currentLang = locale || language;
    if (currentLang === 'en') {
      return `/en${path}`;
    } else if (currentLang === 'ru') {
      return `/ru${path}`;
    }
    return path; // для корневых страниц без префикса
  };

  // Load catalog data from API
  const loadCatalogData = async () => {
    setIsLoadingData(true);
    try {
      const currentLang = locale || language || 'ru';
      const response = await fetch(`/api/catalog?lang=${currentLang}`);
      const data = await response.json();

      if (data.success && Array.isArray(data.data.main)) {
        setCatalogData(data.data.main);
      }
    } catch (error) {
      console.error('Error loading catalog data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  // Load data on component mount and when language changes
  useEffect(() => {
    loadCatalogData();
  }, [language, locale]);

  // Format price based on current language
  const formatPriceForDisplay = (price, currency) => {
    if (!price) return '';
    
    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice)) return '0';
    
    const currentLang = !mounted ? 'en' : (locale || language);
    if (currentLang === 'en' || currency === 'USD') {
      return `$${numericPrice.toFixed(2)}`;
    } else {
      return `${Math.round(numericPrice)} ₽`;
    }
  };

  // Get products data directly from API (already formatted correctly)
  const gameProducts = catalogData;

  // Fill with "Coming soon" if fewer products than required
  const createProductsArray = (products, requiredCount) => {
    const filled = [...products];
     
    // Fill remaining slots with "Coming soon" products
    while (filled.length < requiredCount) {
      filled.push({
        id: `coming-soon-${filled.length}`,
        name: 'Coming soon',
        productCount: 0,
        priceFrom: '',
        type: 'placeholder'
      });
    }
     
    return filled;
  };

  // Get products for different screen sizes
  const mobileProducts = createProductsArray(gameProducts, 6);
  const desktopProducts = createProductsArray(gameProducts, 12);

  // Handle card click
  const handleCardClick = (item) => {
    if (item.type === 'placeholder') return;
    
    if (item.linkType === 'internal') {
      router.push(item.target);
    } else if (item.linkType === 'external') {
      window.open(item.target, '_blank');
    }
  };

  // Get cheat status color
  const getCheatStatusColor = (status) => {
    switch (status) {
      case 'undetected': return 'bg-green-500/20 text-green-300 border border-green-500/30';
      case 'detected': return 'bg-red-500/20 text-red-300 border border-red-500/30';
      case 'useAtOwnRisk': return 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30';
      default: return 'bg-slate-500/20 text-slate-300 border border-slate-500/30';
    }
  };

  // Get cheat status text
  const getCheatStatusText = (status) => {
    switch (status) {
      case 'undetected': return t('catalog.undetected', 'Undetected');
      case 'detected': return t('catalog.detected', 'Detected');
      case 'useAtOwnRisk': return t('catalog.useAtOwnRisk', 'Use at own risk');
      default: return status;
    }
  };

  // Get localized content
  const badges = [
    {
      icon: <ShoppingCart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />,
      label: t('main.hero.badges.sales', 'Over 1000 sales'),
    },
    {
      icon: <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />,
      label: t('main.hero.badges.reliable', 'Reliable cheats'),
    },
  ];

  const stats = [
    {
      value: t('main.hero.stats.successfulDeals.value', '100%'),
      desc: t('main.hero.stats.successfulDeals.desc', 'Successful deals completed'),
    },
    {
      value: t('main.hero.stats.products.value', '200+'),
      desc: t('main.hero.stats.products.desc', 'Products in catalog'),
    },
    {
      value: t('main.hero.stats.games.value', '100+'),
      desc: t('main.hero.stats.games.desc', 'Supported game projects'),
    },
  ];

  const features = [
    {
      icon: <Zap className="w-6 h-6 text-cyan-400" />,
      title: t('main.features.items.0.title', 'Instant delivery'),
      description: t('main.features.items.0.description', 'Automatic product delivery immediately after payment, no waiting')
    },
    {
      icon: <Shield className="w-6 h-6 text-cyan-400" />,
      title: t('main.features.items.1.title', '100% safety'),
      description: t('main.features.items.1.description', 'All products undergo thorough detection testing')
    },
    {
      icon: <Users className="w-6 h-6 text-cyan-400" />,
      title: t('main.features.items.2.title', '24/7 support'),
      description: t('main.features.items.2.description', 'Our support team is always ready to help at any time')
    },
    {
      icon: <CheckCircle className="w-6 h-6 text-cyan-400" />,
      title: t('main.features.items.3.title', 'Quality guarantee'),
      description: t('main.features.items.3.description', 'Refund in case of product malfunction')
    },
    {
      icon: <Star className="w-6 h-6 text-cyan-400" />,
      title: t('main.features.items.4.title', 'Premium quality'),
      description: t('main.features.items.4.description', 'Only verified and quality products from the best developers')
    },
    {
      icon: <Lock className="w-6 h-6 text-cyan-400" />,
      title: t('main.features.items.5.title', 'Confidentiality'),
      description: t('main.features.items.5.description', 'Complete anonymity and protection of your personal data')
    }
  ];

  return (
    <>
      <CatalogAutoUpdater />
      <StructuredData />
      <Header />
      <PageVisitTracker />
      <main className="min-h-screen" role="main">
        {/* Hero Section */}
        <section 
          className="
            flex items-center justify-center
            min-h-screen h-screen
            relative
          "
          aria-labelledby="hero-title"
        >
          {/* Background image - full width on desktop, contained on mobile */}
          <div 
            className="absolute inset-0 z-0 lg:left-0 lg:right-0"
            style={{
              backgroundImage: 'url(/images/background-1.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
          />
          
          {/* Background dimming for better text readability */}
          <div className="absolute inset-0 bg-[#0f172a]/90 z-0 lg:left-0 lg:right-0" />
          
          <motion.div
            className="
              flex items-center justify-center
              min-h-screen h-screen
              relative w-full
            "
            initial="hidden"
            animate="visible"
          >
          <div className="w-full space-y-10 px-4 sm:px-8 lg:px-48 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-16 xl:gap-24 lg:items-center relative z-10">
            {/* Left side: content */}
            <div className="space-y-10">
              {/* Badges */}
              <div className="flex flex-wrap gap-2 sm:gap-3 justify-start">
                {badges.map((badge, i) => (
                  <motion.div
                    className="bg-slate-800 border border-slate-700 text-slate-300 px-3 py-1.5 sm:px-5 sm:py-2.5 rounded-[12px] sm:rounded-[15px] text-xs sm:text-sm font-medium flex items-center gap-1.5 sm:gap-2"
                    key={badge.label}
                    variants={badgeVariants}
                    custom={i}
                    initial="hidden"
                    animate="visible"
                  >
                    {badge.icon}
                    {badge.label}
                  </motion.div>
                ))}
              </div>

              {/* Main Title */}
              <motion.div
                className="space-y-6 text-left"
                variants={titleVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.h1
                  id="hero-title"
                  className="text-2xl lg:text-3xl xl:text-4xl font-bold tracking-tight text-white"
                  style={{ fontFamily: 'var(--font-manrope)' }}
                  variants={titleVariants}
                >
                  {t('main.hero.title.line1', 'Play by your rules')}
                  <span className="block text-cyan-400 mt-2">{t('main.hero.title.line2', 'Turn advantage into victory')}</span>
                </motion.h1>

                <motion.p
                  className="text-xl lg:text-2xl text-slate-400 font-light max-w-2xl"
                  style={{ fontFamily: 'var(--font-inter)' }}
                  variants={paraVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {t('main.hero.description', 'The best premium solutions for online games. Reliable cheats, security and priority support for every client.')}
                </motion.p>
              </motion.div>

              {/* CTA Buttons */}
              <div className="flex flex-row pt-4 justify-start items-center sm:gap-4 gap-0">
                <div className="flex-1 sm:flex-none">
                  <Link href={getLocalizedLink('/catalog')}>
                    <motion.div
                      className="bg-cyan-600 hover:bg-cyan-700 text-white px-8 py-3.5 rounded-[15px] font-semibold text-base transition-colors flex items-center gap-2 cursor-pointer justify-center hover:cursor-pointer w-full sm:w-auto"
                      variants={buttonVariants}
                      custom={0}
                      initial="hidden"
                      animate="visible"
                    >
                      {t('main.hero.buttons.viewCatalog', 'View catalog')}
                    </motion.div>
                  </Link>
                </div>
                
                {/* Mobile search button */}
                <motion.button
                  type="button"
                  className="
                    sm:hidden
                    border border-slate-600 text-slate-300
                    w-14 h-14 rounded-[15px]
                    font-regular text-base
                    bg-slate-900 hover:border-slate-500
                    transition-colors
                    cursor-pointer
                    flex items-center justify-center
                    flex-none
                    hover:cursor-pointer
                    ml-4
                  "
                  style={{ fontFamily: 'var(--font-inter)' }}
                  variants={buttonVariants}
                  custom={1}
                  initial="hidden"
                  animate="visible"
                  onClick={() => setIsSearchModalOpen(true)}
                >
                  <Search className="w-5 h-5 text-slate-400" />
                </motion.button>
                
                {/* Desktop search button */}
                <motion.div
                  className="hidden sm:block relative w-[290px]"
                  variants={buttonVariants}
                  custom={1}
                  initial="hidden"
                  animate="visible"
                >
                  <motion.button
                    type="button"
                    className="
                      border border-slate-600/50 text-slate-300
                      px-10 py-3.5 rounded-[15px]
                      font-regular text-base
                      transition-colors pr-4
                      cursor-pointer w-full
                      text-left
                      backdrop-blur-sm bg-white/5
                      hover:cursor-pointer
                    "
                    style={{ paddingLeft: '2.5rem', fontFamily: 'var(--font-inter)' }}
                    onClick={() => setIsSearchModalOpen(true)}
                  >
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none">
                      <Search className="w-5 h-5" />
                    </span>
                    <span className="opacity-60 text-slate-300 text-base">
                      {t('common.search', 'Search...')}
                    </span>
                  </motion.button>
                </motion.div>
              </div>

              {/* Stats */}
              <div className="hidden sm:flex flex-wrap gap-6 sm:gap-12 pt-8 sm:pt-12 justify-start">
                {stats.map((stat, i) => (
                  <motion.div
                    className="
                      flex flex-col items-start
                      text-left
                      min-w-[100px] sm:min-w-[110px]
                    "
                    key={stat.value}
                    variants={statVariants}
                    custom={i}
                    initial="hidden"
                    animate="visible"
                  >
                    <div className="flex items-center gap-2 sm:gap-3 justify-start">
                      <div className="text-2xl sm:text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-inter)' }}>
                        {stat.value}
                      </div>
                    </div>
                    <div
                      className="text-slate-500 text-xs sm:text-sm font-medium mt-1.5 sm:mt-2 max-w-[140px]">
                      {stat.desc}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.div 
              className="hidden lg:flex items-center justify-center"
              variants={imageVariants}
              initial="hidden"
              animate="visible"
            >
              <div className="relative w-full max-w-4xl">
                <Image
                  src="/images/hero.png"
                  alt={!mounted 
                    ? "AtomCheats - premium gaming solutions for cheats"
                    : (language === 'ru' 
                      ? "AtomCheats - премиальные игровые решения для читов" 
                      : "AtomCheats - premium gaming solutions for cheats")
                  }
                  width={800}
                  height={600}
                  className="w-full h-auto max-h-[800px] object-contain"
                  priority={true}
                />
                <div className="absolute inset-0 rounded-2xl"></div>
              </div>
            </motion.div>
          </div>
          </motion.div>
        </section>

        {/* Products Section - FIRST after Hero */}
        <section className="py-20 bg-slate-900" aria-labelledby="products-title">
          <div className="w-full px-4 sm:px-8 lg:px-48">
            <header className="sr-only">
              <h2 id="products-title">{t('main.products.title', 'Наши продукты')}</h2>
              <p>{t('main.products.subtitle', 'Широкий выбор решений для популярных игр')}</p>
            </header>
            {/* Loading State */}
            {isLoadingData ? (
              <div className="text-center py-16">
                <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-slate-400 text-lg">Загрузка данных...</p>
              </div>
            ) : (
              <>
                {/* Mobile version - 6 cards with original layout */}
                <div className="grid grid-cols-1 gap-6 lg:hidden">
                  {mobileProducts.map((game, index) => (
                    <motion.div
                      key={game.id}
                      className="relative rounded-2xl p-6 flex flex-col justify-end cursor-pointer aspect-[3/4] min-h-[320px] transition-all duration-200 overflow-hidden hover:brightness-75"
                      onClick={() => handleCardClick(game)}
                      variants={productVariants}
                      custom={index}
                      initial="hidden"
                      animate="visible"
                      style={{
                        backgroundImage: game.backgroundImage ? `url(${game.backgroundImage})` : undefined,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        backgroundColor: game.backgroundImage ? 'transparent' : '#1e293b'
                      }}
                    >
                      {/* Dark overlay for better text readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent rounded-2xl" />
                      
                      {/* Cheat status badge - only for products with cheatStatus */}
                      {game.type === 'product' && game.cheatStatus && (
                        <div className={`absolute top-4 right-4 px-2 py-1 rounded-lg text-xs font-medium ${getCheatStatusColor(game.cheatStatus)} z-10`}>
                          {getCheatStatusText(game.cheatStatus)}
                        </div>
                      )}

                      {/* Bottom block with name, count and price */}
                      <div className="flex justify-between items-end mt-auto relative z-10">
                        {/* Left side: Name and quantity */}
                        <div className="flex flex-col">
                          <h3 className="text-white text-sm font-normal leading-tight drop-shadow-lg">
                            {game.name}
                          </h3>
                          <span className="text-slate-200 text-xs font-normal leading-tight drop-shadow">
                            {game.productCount} {!mounted ? 'products' : ((locale || language) === 'en' ? 'products' : 'товаров')}
                          </span>
                        </div>

                        {/* Right side: Price */}
                        <div className="text-white text-base font-normal text-right drop-shadow-lg">
                          {!mounted ? 'from ' : ((locale || language) === 'en' ? 'from ' : 'от ')}{formatPriceForDisplay(game.priceFrom, (locale || language) === 'en' ? 'USD' : 'RUB')}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Desktop version - 12 cards with original layout */}
                <div className="hidden lg:grid lg:grid-cols-4 gap-6 relative">
                  {desktopProducts.map((game, index) => {
                    const isLastRow = index >= 8; // Last 4 cards (indexes 8-11)
                    
                    return (
                      <motion.div
                        key={game.id}
                        className="relative rounded-2xl p-6 flex flex-col justify-end cursor-pointer aspect-[3/4] min-h-[320px] transition-all duration-200 overflow-hidden hover:brightness-75"
                        onClick={() => handleCardClick(game)}
                        variants={productVariants}
                        custom={index}
                        initial="hidden"
                        animate="visible"
                        style={{
                          backgroundImage: game.backgroundImage ? `url(${game.backgroundImage})` : undefined,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          backgroundRepeat: 'no-repeat',
                          backgroundColor: game.backgroundImage ? 'transparent' : '#1e293b'
                        }}
                      >
                        {/* Dark overlay for better text readability */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent rounded-2xl" />
                        
                        {/* Gradient dimming for last row - only on desktop */}
                        {isLastRow && (
                          <div className="absolute inset-0 bg-gradient-to-b from-slate-900/90 via-slate-900/90 to-slate-900/90 rounded-2xl" />
                        )}

                        {/* Cheat status badge - only for products with cheatStatus */}
                        {game.type === 'product' && game.cheatStatus && (
                          <div className={`absolute top-4 right-4 px-2 py-1 rounded-lg text-xs font-medium ${getCheatStatusColor(game.cheatStatus)} z-10`}>
                            {getCheatStatusText(game.cheatStatus)}
                          </div>
                        )}
                        
                        {/* Bottom block with name, count and price */}
                        <div className={`flex justify-between items-end mt-auto relative z-10 ${
                          isLastRow ? 'opacity-30' : ''
                        }`}>
                          {/* Left side: Name and quantity */}
                          <div className="flex flex-col">
                            <h3 className="text-white text-sm font-normal leading-tight drop-shadow-lg">
                              {game.name}
                            </h3>
                            <span className="text-slate-200 text-xs font-normal leading-tight drop-shadow">
                              {game.productCount} {!mounted ? 'products' : ((locale || language) === 'en' ? 'products' : 'товаров')}
                            </span>
                          </div>

                          {/* Right side: Price */}
                          <div className="text-white text-base font-normal text-right drop-shadow-lg">
                            {!mounted ? 'from ' : ((locale || language) === 'en' ? 'from ' : 'от ')}{game.priceFrom}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                  
                  {/* "View all" button over the last row - for desktop */}
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 z-20">
                    <Link href={getLocalizedLink('/catalog')}>
                      <div className="bg-white text-slate-900 px-8 py-4 rounded-xl font-medium hover:bg-white/90 transition-colors shadow-lg">
                        {t('main.hero.buttons.viewAll', 'View all')}
                      </div>
                    </Link>
                  </div>
                </div>

                {/* "View all" button for mobile devices */}
                <div className="flex lg:hidden justify-center mt-8">
                  <Link href={getLocalizedLink('/catalog')}>
                    <div className="bg-white text-slate-900 px-8 py-4 rounded-xl font-medium hover:bg-white/90 transition-colors shadow-lg w-full max-w-xs">
                      {t('main.hero.buttons.viewAll', 'View all')}
                    </div>
                  </Link>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Features Section - SECOND after Products */}
        <section className="py-20 bg-slate-900/50 border-y border-slate-800" aria-labelledby="features-title">
          <div className="w-full px-4 sm:px-8 lg:px-48">
            <header className="text-center mb-16">
              <h2 
                id="features-title"
                className="text-3xl lg:text-4xl font-bold text-white mb-4"
                style={{ fontFamily: 'var(--font-manrope)' }}
              >
                {t('main.features.title', 'Why choose us')}
              </h2>
              <p
                className="text-lg text-white/20 max-w-2xl mx-auto"
                style={{ fontFamily: 'var(--font-inter)' }}
              >
                {t('main.features.subtitle', 'We provide the best service on the market')}
              </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 relative z-10 auto-rows-fr">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  onMouseEnter={() => setActiveFeature(index)}
                  onMouseLeave={() => setActiveFeature(null)}
                  className="h-full"
                >
                  <FeatureCard 
                    feature={feature} 
                    index={index} 
                    isActive={activeFeature === index} 
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <SearchModal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)} />
    </>
  );
}