'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Search, ChevronDown, LogOut, UserRound, Wallet } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useLanguage } from '../i18n/LanguageContext';
import { useBalance } from '../hooks/useBalance';
import LanguageSwitcherWrapper from './LanguageSwitcherWrapper';
import SearchModal from './SearchModal';

function Header() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { t, language, loading: languageLoading } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const userDropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // Определяем язык на основе URL для избежания проблем с гидратацией
  const getLanguageFromPath = () => {
    if (pathname?.startsWith('/ru')) return 'ru';
    if (pathname?.startsWith('/en')) return 'en';
    return 'en'; // по умолчанию английский
  };

  const currentLanguage = getLanguageFromPath();

  const { balance, loading: balanceLoading, initialLoading, error: balanceError, fetchBalance } =
    useBalance(5000);

  const refreshBalance = useCallback(async () => {
    if (fetchBalance) {
      await fetchBalance();
    }
  }, [fetchBalance]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setIsUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (status === 'authenticated' && session?.user) {
      // Не показываем skeleton при обычных обновлениях
      refreshBalance();
      const handleFocus = () => refreshBalance();
      window.addEventListener('focus', handleFocus);
      return () => window.removeEventListener('focus', handleFocus);
    } else if (status === 'unauthenticated') {
      // Пользователь вышел из системы - сбрасываем состояние
      setIsUserDropdownOpen(false);
    }
  }, [status, session, refreshBalance]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 1);
    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Закрытие меню при клике на ссылку
  useEffect(() => {
    const handleClick = () => setIsMenuOpen(false);
    const links = mobileMenuRef.current?.querySelectorAll('a');
    links?.forEach(link => link.addEventListener('click', handleClick));
    return () => {
      links?.forEach(link => link.removeEventListener('click', handleClick));
    };
  }, [isMenuOpen]);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleUserDropdown = () => setIsUserDropdownOpen(!isUserDropdownOpen);

  const handleSignOut = async () => {
    try {
      await signOut({ redirect: false });
      setIsUserDropdownOpen(false);
      router.push(currentLanguage === 'en' ? '/' : `/${currentLanguage}`);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const formatBalanceDisplay = () => {
    // Показываем skeleton только при первоначальной загрузке
    if (initialLoading) {
      return [];
    }

    const balanceUsd = parseFloat(balance.balanceUsd || 0);
    const balanceRub = parseFloat(balance.balanceRub || 0);

    const formatAmount = (amount) => {
      return amount % 1 === 0 ? amount.toString() : amount.toFixed(2);
    };

    const availableBalances = [];

    // Добавляем только валюты с положительным балансом
    if (balanceUsd > 0) availableBalances.push({ 
      amount: formatAmount(balanceUsd), 
      currency: 'USD', 
      symbol: '$', 
      hasBalance: true 
    });
    
    if (balanceRub > 0) availableBalances.push({ 
      amount: formatAmount(balanceRub), 
      currency: 'RUB', 
      symbol: '₽', 
      hasBalance: true 
    });

    // Если обе валюты имеют 0 баланс
    if (availableBalances.length === 0) {
      // Показываем только одну валюту в зависимости от языка
      if (language === 'ru') {
        availableBalances.push({ 
          amount: '0', 
          currency: 'RUB', 
          symbol: '₽', 
          hasBalance: false 
        });
      } else {
        availableBalances.push({ 
          amount: '0', 
          currency: 'USD', 
          symbol: '$', 
          hasBalance: false 
        });
      }
    }

    return availableBalances;
  };

  const navTabs = [
    { key: 'catalog', href: `/${language}/catalog` },
    { key: 'news', href: `/${language}/news` },
    { key: 'reviews', href: 'https://www.trustpilot.com/review/atomcheats.com' },
    { key: 'faq', href: `/${language}/faq` }
  ];

  // Функция для отображения баланса с состоянием обновления
  const renderBalance = () => {
    // Показываем skeleton только при первоначальной загрузке
    if (initialLoading) {
      return (
        <>
          {[1, 2].map((i) => (
            <div
              key={i}
              className="flex items-center space-x-2"
            >
              <div className="w-12 h-6 bg-slate-700 rounded-md animate-pulse"></div>
            </div>
          ))}
        </>
      );
    }

    // При обновлении баланса просто показываем значения без анимации
    return formatBalanceDisplay().map((balanceItem, index) => (
      <div 
        key={index} 
        className="flex items-center space-x-2"
      >
        <span className={`text-sm font-medium ${balanceItem.hasBalance ? 'text-slate-300' : 'text-slate-400'}`}>
          {balanceItem.symbol}{balanceItem.amount}
        </span>
      </div>
    ));
  };

  // Функция для отображения баланса в мобильном меню
  const renderMobileBalance = () => {
    if (initialLoading) {
      return (
        <div className="flex space-x-4">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="w-16 h-6 bg-slate-700 rounded-md animate-pulse"
            ></div>
          ))}
        </div>
      );
    }

    return (
      <div className="flex space-x-4">
        {formatBalanceDisplay().map((balanceItem, index) => (
          <div key={index} className="text-white">
            {balanceItem.symbol}{balanceItem.amount}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 border-b transition-all duration-300 ${
          isScrolled ? 'backdrop-blur-2xl bg-slate-900/50 border-slate-800' : 'bg-transparent border-transparent'
        }`}
      >
        <div className="w-full px-4 sm:px-8 lg:px-48">
          <div className="flex items-center justify-between h-20">

            {/* Logo */}
            <Link href={currentLanguage === 'en' ? '/' : `/${currentLanguage}`} className="flex items-center space-x-3 cursor-pointer flex-shrink-0">
              <Image
                src="/images/logo.svg"
                alt="AtomCheats Logo"
                width={40}
                height={40}
                className="w-10 h-10"
                priority
              />
              <span className="ml-3 text-xl font-semibold text-white">
                {languageLoading ? 'AtomCheats' : t('header.logo', 'AtomCheats')}
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center justify-center flex-1 mx-8">
              <div className="flex items-center space-x-8">
                {languageLoading ? (
                  // Skeleton для навигации при загрузке языка
                  <>
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="w-16 h-6 bg-slate-700 rounded-md animate-pulse"
                      ></div>
                    ))}
                  </>
                ) : (
                  navTabs.map((tab) =>
                    (tab.key === 'catalog' || tab.key === 'news' || tab.key === 'faq') ? (
                      <Link key={tab.key} href={tab.href}>
                        <div className="text-slate-300 hover:text-white cursor-pointer">
                          {t(`header.navigation.${tab.key}`, tab.key)}
                        </div>
                      </Link>
                    ) : (
                      <a key={tab.key} href={tab.href} target="_blank" rel="noopener noreferrer" className="text-slate-300 hover:text-white cursor-pointer">
                        {t(`header.navigation.${tab.key}`, tab.key)}
                      </a>
                    )
                  )
                )}
              </div>
            </nav>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-4 flex-shrink-0">
              <button
                className="p-2 text-slate-400 hover:text-white cursor-pointer"
                aria-label={languageLoading ? 'Поиск...' : t('header.searchPlaceholder', 'Поиск...')}
                onClick={() => setIsSearchModalOpen(true)}
              >
                <Search className="w-5 h-5" />
              </button>

              <LanguageSwitcherWrapper variant="default" />

              <div className="h-6 w-px bg-slate-600"></div>

              {status === 'loading' ? (
                // Skeleton для состояния загрузки сессии
                <div className="flex items-center space-x-4">
                  {/* Skeleton для баланса */}
                  <div className="flex items-center space-x-3">
                    {[1, 2].map((i) => (
                      <div
                        key={i}
                        className="flex items-center space-x-2"
                      >
                        <div className="w-12 h-6 bg-slate-700 rounded-md animate-pulse"></div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Skeleton для пользователя */}
                  <div className="relative">
                    <div
                      className="flex items-center space-x-3 px-4 py-2"
                    >
                      <div className="w-24 h-6 bg-slate-700 rounded-md animate-pulse"></div>
                      <div className="w-3 h-3 bg-slate-700 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ) : status === 'authenticated' && session?.user ? (
                <div className="flex items-center space-x-4">
                  {/* Balance Display in Header */}
                  <div className="hidden md:flex items-center space-x-3">
                    {renderBalance()}
                  </div>
                  
                  <div className="relative" ref={userDropdownRef}>
                    <button
                      className="flex items-center space-x-3 px-4 py-2 text-slate-300 hover:bg-white/10 rounded-lg cursor-pointer"
                      onClick={toggleUserDropdown}
                    >
                      <span>{session.user.username || session.user.name}</span>
                      <ChevronDown className={`w-3 h-3 transition-transform ${isUserDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isUserDropdownOpen && (
                      <div
                        className="absolute right-0 mt-2 w-64 bg-slate-900/80 rounded-xl shadow-xl border border-white/20 py-2 backdrop-blur-sm"
                      >
                        <div className="px-4 py-3 border-b border-white/10">
                          <div className="text-sm text-white font-semibold">{session.user.username || session.user.name}</div>
                          <div className="text-xs text-slate-300">{session.user.email}</div>
                        </div>

                        <Link href="/profile" onClick={() => setIsUserDropdownOpen(false)}>
                          <div className="flex items-center space-x-3 px-4 py-2 text-white hover:bg-white/10 cursor-pointer transition-colors">
                            <UserRound className="w-4 h-4" />
                            <span>{t('header.userMenu.profile', 'Профиль')}</span>
                          </div>
                        </Link>

                        <Link href="/deposit" onClick={() => setIsUserDropdownOpen(false)}>
                          <div className="flex items-center space-x-3 px-4 py-2 text-white hover:bg-white/10 cursor-pointer transition-colors">
                            <Wallet className="w-4 h-4" />
                            <span>{t('header.userMenu.deposit', 'Пополнить баланс')}</span>
                          </div>
                        </Link>

                        <div className="h-px bg-white/10 my-1"></div>

                        <div
                          className="flex items-center space-x-3 px-4 py-2 text-red-400 hover:bg-red-500/10 cursor-pointer transition-colors"
                          onClick={handleSignOut}
                        >
                          <LogOut className="w-4 h-4" />
                          <span>{t('header.userMenu.signOut', 'Выйти')}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center space-x-5">
                  <Link href="/auth?mode=login" className="text-slate-300 hover:text-white transition-colors">
                    {t('header.authButtons.signIn', 'Sign In')}
                  </Link>
                  <Link href="/auth?mode=register" className="text-slate-300 hover:text-white transition-colors">
                    {t('header.authButtons.signUp', 'Sign Up')}
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Actions */}
            <div className="md:hidden flex items-center space-x-4">
              <button 
                className="p-2 text-white hover:bg-white/10 rounded-lg cursor-pointer"
                onClick={() => setIsSearchModalOpen(true)}
                aria-label={languageLoading ? 'Поиск...' : t('header.searchPlaceholder', 'Поиск...')}
              >
                <Search className="w-5 h-5" />
              </button>
              
              <button 
                className="p-2 text-white hover:bg-white/10 rounded-lg cursor-pointer"
                onClick={toggleMenu}
                aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <div className="space-y-1">
                  <div className="w-6 h-0.5 bg-white"></div>
                  <div className="w-6 h-0.5 bg-white"></div>
                  <div className="w-6 h-0.5 bg-white"></div>
                </div>}
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* Mobile Menu - отдельно от хедера */}
      {isMenuOpen && (
        <>
          {/* Overlay */}
          <div
            key="overlay"
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm md:hidden"
            onClick={toggleMenu}
          />
          
          {/* Menu Panel */}
          <div
            key="menu"
            ref={mobileMenuRef}
            className="fixed top-0 right-0 bottom-0 w-full max-w-sm z-50 md:hidden bg-slate-900 shadow-xl"
          >
            <div className="flex items-center justify-between p-6 border-b border-slate-700">
              <div className="flex items-center space-x-3">
                <Image
                  src="/images/logo.svg"
                  alt="AtomCheats Logo"
                  width={32}
                  height={32}
                  className="w-8 h-8"
                />
                <span className="text-lg font-semibold text-white">
                  {t('header.logo', 'AtomCheats')}
                </span>
              </div>
              <button 
                onClick={toggleMenu}
                className="p-2 hover:bg-white/10 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(100vh-80px)]">
              {languageLoading ? (
                // Skeleton для мобильной навигации при загрузке языка
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-full h-12 bg-slate-800/50 rounded-lg animate-pulse"
                    ></div>
                  ))}
                </div>
              ) : (
                navTabs.map((tab) => 
                  (tab.key === 'catalog' || tab.key === 'news' || tab.key === 'faq') ? (
                    <Link key={tab.key} href={tab.href}>
                      <div className="text-white px-4 py-3 cursor-pointer hover:bg-white/10 rounded-lg transition-colors">
                        {t(`header.navigation.${tab.key}`, tab.key)}
                      </div>
                    </Link>
                  ) : (
                    <a key={tab.key} href={tab.href} target="_blank" rel="noopener noreferrer">
                      <div className="text-white px-4 py-3 cursor-pointer hover:bg-white/10 rounded-lg transition-colors">
                        {t(`header.navigation.${tab.key}`, tab.key)}
                      </div>
                    </a>
                  )
                )
              )}
              
              {/* Search in mobile menu */}
              <div className="px-4 py-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder={languageLoading ? 'Поиск...' : t('header.searchPlaceholder', 'Поиск...')}
                    className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsSearchModalOpen(true);
                    }}
                    readOnly
                  />
                </div>
              </div>
              
              {/* Auth buttons in mobile menu */}
              {status === 'loading' ? (
                // Skeleton для мобильного меню при загрузке
                <div className="px-4 space-y-3">
                  <div
                    className="w-full h-10 bg-slate-800/50 rounded-lg animate-pulse"
                  ></div>
                  <div
                    className="w-full h-10 bg-slate-800/50 rounded-lg animate-pulse"
                  ></div>
                </div>
              ) : status === 'authenticated' && session?.user ? (
                // Информация пользователя в мобильном меню
                <div className="px-4 space-y-4">
                  <div className="px-4 py-3 bg-slate-800/50 rounded-lg">
                    <div className="text-sm text-white font-semibold">
                      {session.user.username || session.user.name}
                    </div>
                    <div className="text-xs text-slate-300 mt-1">
                      {session.user.email}
                    </div>
                  </div>
                  
                  {/* Balance in mobile menu */}
                  <div className="px-4 py-3 bg-slate-800/50 rounded-lg">
                    <div className="text-sm text-slate-400 mb-2">
                      {t('header.balance', 'Баланс')}
                    </div>
                    {renderMobileBalance()}
                  </div>
                  
                  <Link
                    href="/profile"
                    onClick={toggleMenu}
                    className="flex items-center space-x-3 px-4 py-3 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg text-white transition-colors cursor-pointer"
                  >
                    <UserRound className="w-4 h-4" />
                    <span>{t('header.userMenu.profile', 'Профиль')}</span>
                  </Link>
                  
                  <Link
                    href="/deposit"
                    onClick={toggleMenu}
                    className="flex items-center space-x-3 px-4 py-3 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg text-white transition-colors cursor-pointer"
                  >
                    <Wallet className="w-4 h-4" />
                    <span>{t('header.userMenu.deposit', 'Пополнить баланс')}</span>
                  </Link>
                  
                  <div className="h-px bg-white/10 my-2"></div>
                  
                  <button
                    onClick={() => {
                      handleSignOut();
                      toggleMenu();
                    }}
                    className="flex items-center space-x-3 w-full px-4 py-3 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t('header.userMenu.signOut', 'Выйти')}</span>
                  </button>
                </div>
              ) : (
                <div className="px-4 space-y-3">
                  <Link
                    href="/auth?mode=login"
                    onClick={toggleMenu}
                    className="block w-full text-center py-3 bg-slate-800/50 hover:bg-slate-700/50 rounded-lg text-white transition-colors"
                  >
                    {t('header.authButtons.signIn', 'Войти')}
                  </Link>
                  <Link
                    href="/auth?mode=register"
                    onClick={toggleMenu}
                    className="block w-full text-center py-3 bg-cyan-600 hover:bg-cyan-700 rounded-lg text-white transition-colors"
                  >
                    {t('header.authButtons.signUp', 'Регистрация')}
                  </Link>
                </div>
              )}
              
              {/* Language switcher in mobile menu */}
              <div className="px-4 pt-4 border-t border-slate-700">
                <div className="text-sm text-slate-400 mb-3">
                  {languageLoading ? 'Сменить язык' : t('header.changeLanguage', 'Сменить язык')}
                </div>
                <LanguageSwitcherWrapper variant="mobile" onSelect={toggleMenu} />
              </div>
            </div>
          </div>
        </>
      )}

      <SearchModal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)} />
    </>
  );
}

export default Header;