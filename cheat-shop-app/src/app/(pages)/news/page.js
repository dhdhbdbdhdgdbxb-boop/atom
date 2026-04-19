'use client';

import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLanguage } from '@/i18n/LanguageContext';
import { Settings } from 'lucide-react';

export default function NewsPage() {
  const { t } = useLanguage();

  const getLocalizedContent = () => {
    return {
      title: t('news.title', 'Новости'),
      inDevelopmentTitle: t('news.inDevelopment.title', 'Страница в разработке')
    };
  };

  const currentContent = getLocalizedContent();

  return (
    <>
      <Header />
      
      <div 
        className="absolute top-0 left-0 w-full h-full bg-cover bg-top bg-no-repeat pointer-events-none z-0"
        style={{ backgroundImage: 'url(/images/backgrounds/grid.png)' }}
      />
      
      <div className="min-h-screen pt-20 relative z-10">
        <div className="w-full px-4 sm:px-8 lg:px-48 py-16">
          <motion.div
            className="text-center max-w-md mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Settings className="w-8 h-8 text-slate-400" />
            </div>
            
            <h1 className="text-3xl font-bold text-white mb-4">
              {currentContent.title}
            </h1>
            
            <p className="text-slate-400">
              {currentContent.inDevelopmentTitle}
            </p>
          </motion.div>
        </div>
      </div>

      <Footer />
    </>
  );
}