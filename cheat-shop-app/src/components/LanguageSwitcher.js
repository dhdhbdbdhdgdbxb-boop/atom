'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Globe, ChevronDown } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import Image from 'next/image';

const LanguageSwitcher = ({ className = '', variant = 'default' }) => {
  const { language, languages, changeLanguage, loading } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef(null);

  // Устанавливаем mounted состояние после гидратации
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLanguageChange = async (langCode) => {
    await changeLanguage(langCode);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (typeof window !== 'undefined') {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, []);

  const dropdownVariants = {
    hidden: { opacity: 0, y: -10, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 0.2, ease: 'easeOut' }
    },
    exit: {
      opacity: 0,
      y: -10,
      scale: 0.95,
      transition: { duration: 0.15, ease: 'easeIn' }
    }
  };

  if (variant === 'default') {
    return (
      <div className={`relative ${className}`} ref={dropdownRef}>
        <motion.button
          className="flex items-center space-x-1 p-2 text-slate-400 hover:text-white transition-colors cursor-pointer rounded-lg hover:bg-white/5"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Change language"
          whileHover={{ opacity: 0.8 }}
        >
          <Globe className="w-4 h-4" />
          <span className="text-sm font-medium" style={{ fontFamily: 'var(--font-inter)' }}>
            {mounted ? (languages[language]?.name || 'Русский') : 'Русский'}
          </span>
          <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </motion.button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="absolute right-0 mt-2 w-28 rounded-lg border border-slate-700 backdrop-blur-2xl bg-slate-900/95 shadow-xl py-1"
              variants={dropdownVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {Object.entries(languages).map(([code, lang]) => (
                <button
                  key={code}
                  className={`w-full text-center py-2 text-sm transition-colors cursor-pointer ${
                    mounted && language === code
                      ? 'text-cyan-400 bg-cyan-600/10'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                  style={{ fontFamily: 'var(--font-inter)' }}
                  onClick={() => handleLanguageChange(code)}
                >
                  {lang.name}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (variant === 'mobile') {
    return (
      <div className={`w-full max-w-xs flex space-x-2 ${className}`}>
        {Object.entries(languages).map(([code, lang]) => (
          <motion.button
            key={code}
            className={`flex-1 flex items-center justify-center space-x-1 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
              mounted && language === code
                ? 'bg-cyan-600/20 text-cyan-400 border border-cyan-600/30'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
            }`}
            style={{ fontFamily: 'var(--font-inter)' }}
            onClick={() => handleLanguageChange(code)}
            whileHover={{ opacity: 0.8 }}
          >
            <Globe className="w-3 h-3" />
            <span className="text-sm">{lang.name}</span>
          </motion.button>
        ))}
      </div>
    );
  }

  if (variant === 'footer') {
    return (
      <motion.button
        className="px-2 py-1 lg:px-4 lg:py-2 rounded-lg bg-slate-800 text-slate-200 cursor-pointer font-medium flex items-center justify-center hover:bg-slate-700 transition-colors"
        style={{ fontFamily: 'var(--font-inter)' }}
        onClick={() => handleLanguageChange(mounted && language === 'ru' ? 'en' : 'ru')}
        whileHover={{ opacity: 0.8 }}
      >
        <Image
          src={mounted && language === 'ru' ? '/images/flags/en.png' : '/images/flags/ru.png'}
          alt={mounted && language === 'ru' ? 'English flag' : 'Русский флаг'}
          width={20}
          height={14}
          className="inline-block align-middle rounded-sm"
        />
        <span className="ml-1 lg:ml-2 text-xs lg:text-sm">
          {mounted && language === 'ru' ? 'English' : 'Русский'}
        </span>
      </motion.button>
    );
  }

  return null;
};

export default LanguageSwitcher;