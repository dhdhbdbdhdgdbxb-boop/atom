'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ReactMarkdown from 'react-markdown';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import 'highlight.js/styles/github-dark.css';
import {
  User, Mail, Calendar, Settings, Shield,
  ShoppingBag, Headphones, Gift, History, Activity, ChevronRight, Copy, LogOut
} from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

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
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  }
};

// Анимация для карточек как на главной странице
const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      type: "spring",
      stiffness: 70,
    }
  }
};

// Компонент карточки с анимацией как на главной
const AnimatedCard = ({ children, index = 0, className = "" }) => {
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
    <motion.div
      ref={cardRef}
      className={`relative bg-slate-800/30 border border-slate-700/50 rounded-2xl overflow-hidden backdrop-blur-sm ${className}`}
      variants={cardVariants}
      custom={index}
      initial="hidden"
      animate="visible"
      onMouseMove={handleMove}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {/* SMOOTH APPEAR / DISAPPEAR - такая же анимация как на главной */}
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
                background: "radial-gradient(circle, rgba(34,211,238,0.2), transparent)",
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
                background: "radial-gradient(circle, rgba(59,130,246,0.25), transparent)",
              }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            />
          </>
        )}
      </AnimatePresence>

      {/* CONTENT */}
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};

// Компонент для рендеринга Markdown в стиле GitHub
const GitHubMarkdown = ({ content, language = 'ru' }) => {
  const getLocalizedInstruction = (instruction) => {
    if (!instruction) return '';
    
    // Удаляем "Инструкция:" если оно есть в начале
    let cleanInstruction = instruction.replace(/^Инструкция:\s*/i, '');
    
    // Разделяем по вертикальной черте
    const parts = cleanInstruction.split('|').map(part => part.trim());
    
    if (parts.length >= 2) {
      // Первая часть - русская (содержит RU: или русский текст)
      let ruText = parts[0];
      ruText = ruText.replace(/^RU:\s*/, '').trim();
      
      // Вторая часть - английская (содержит EN: или английский текст)
      let enText = parts[1];
      enText = enText.replace(/^EN:\s*/, '').trim();
      
      // Возвращаем в зависимости от языка
      return language === 'ru' ? ruText : enText;
    }
    
    // Если не удалось распарсить, возвращаем как есть
    return cleanInstruction;
  };

  return (
    <div className="markdown-body">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={{
          // Заголовки с отступами как в GitHub
          h1: ({node, ...props}) => (
            <h1 
              className="text-2xl font-bold mt-6 mb-4 pb-2 border-b border-gray-700" 
              {...props} 
            />
          ),
          h2: ({node, ...props}) => (
            <h2 
              className="text-xl font-bold mt-6 mb-4 pb-2 border-b border-gray-700" 
              {...props} 
            />
          ),
          h3: ({node, ...props}) => (
            <h3 className="text-lg font-bold mt-5 mb-3" {...props} />
          ),
          h4: ({node, ...props}) => (
            <h4 className="text-base font-bold mt-4 mb-2" {...props} />
          ),
          h5: ({node, ...props}) => (
            <h5 className="text-sm font-bold mt-3 mb-2" {...props} />
          ),
          h6: ({node, ...props}) => (
            <h6 className="text-xs font-bold mt-2 mb-1" {...props} />
          ),
          
          // Параграфы
          p: ({node, ...props}) => (
            <p className="my-3 leading-relaxed" {...props} />
          ),
          
          // Списки
          ul: ({node, ...props}) => (
            <ul className="my-3 ml-6 list-disc" {...props} />
          ),
          ol: ({node, ...props}) => (
            <ol className="my-3 ml-6 list-decimal" {...props} />
          ),
          li: ({node, ...props}) => (
            <li className="my-1" {...props} />
          ),
          
          // Ссылки
          a: ({node, ...props}) => (
            <a 
              className="text-blue-400 hover:text-blue-300 underline" 
              target="_blank" 
              rel="noopener noreferrer"
              {...props} 
            />
          ),
          
          // Код (inline)
          code: ({node, inline, className, ...props}) => {
            if (inline) {
              return (
                <code 
                  className="bg-gray-800 text-gray-200 px-1.5 py-0.5 rounded text-sm font-mono" 
                  {...props} 
                />
              );
            }
            return <code className={className} {...props} />;
          },
          
          // Блоки кода
          pre: ({node, ...props}) => (
            <pre 
              className="my-4 p-4 bg-gray-900 rounded-lg overflow-x-auto" 
              {...props} 
            />
          ),
          
          // Таблицы
          table: ({node, ...props}) => (
            <table className="my-4 min-w-full border-collapse border border-gray-700" {...props} />
          ),
          thead: ({node, ...props}) => (
            <thead className="bg-gray-800" {...props} />
          ),
          tbody: ({node, ...props}) => (
            <tbody {...props} />
          ),
          tr: ({node, ...props}) => (
            <tr className="border-b border-gray-700" {...props} />
          ),
          th: ({node, ...props}) => (
            <th className="px-4 py-2 text-left font-bold border-r border-gray-700" {...props} />
          ),
          td: ({node, ...props}) => (
            <td className="px-4 py-2 border-r border-gray-700" {...props} />
          ),
          
          // Горизонтальная линия
          hr: ({node, ...props}) => (
            <hr className="my-8 border-gray-700" {...props} />
          ),
          
          // Цитаты
          blockquote: ({node, ...props}) => (
            <blockquote 
              className="my-4 pl-4 border-l-4 border-gray-600 italic text-gray-300" 
              {...props} 
            />
          ),
          
          // Жирный текст
          strong: ({node, ...props}) => (
            <strong className="font-bold" {...props} />
          ),
          
          // Курсив
          em: ({node, ...props}) => (
            <em className="italic" {...props} />
          ),
          
          // Зачеркнутый текст
          del: ({node, ...props}) => (
            <del className="line-through" {...props} />
          ),
        }}
      >
        {getLocalizedInstruction(content)}
      </ReactMarkdown>
      <style jsx global>{`
        .markdown-body {
          color: #e5e7eb;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif;
          line-height: 1.6;
        }
        
        .markdown-body h1,
        .markdown-body h2,
        .markdown-body h3,
        .markdown-body h4,
        .markdown-body h5,
        .markdown-body h6 {
          color: #f3f4f6;
          font-weight: 600;
          line-height: 1.25;
        }
        
        .markdown-body h1 {
          font-size: 2em;
        }
        
        .markdown-body h2 {
          font-size: 1.5em;
        }
        
        .markdown-body h3 {
          font-size: 1.25em;
        }
        
        .markdown-body code {
          font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
          font-size: 0.875em;
        }
        
        .markdown-body pre code {
          font-size: 0.9em;
        }
        
        .markdown-body ul,
        .markdown-body ol {
          padding-left: 2em;
        }
        
        .markdown-body blockquote {
          padding-left: 1em;
          color: #9ca3af;
        }
        
        .markdown-body img {
          max-width: 100%;
          border-radius: 6px;
        }
        
        .markdown-body table {
          display: block;
          width: 100%;
          overflow: auto;
        }
        
        .markdown-body table th {
          font-weight: 600;
          background-color: #374151;
        }
        
        .markdown-body table tr:nth-child(2n) {
          background-color: #1f2937;
        }
      `}</style>
    </div>
  );
};

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState('settings');
  const [notifications, setNotifications] = useState([]);

  // Перенаправляем на страницу авторизации, если пользователь не авторизован
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth?mode=login');
    }
  }, [status, router]);

  // Функция для получения локализованного контента
  const getLocalizedContent = () => {
    return {
      title: t('profile.title', 'Профиль пользователя'),
      subtitle: t('profile.subtitle', 'Управление вашей учетной записью'),
      username: t('profile.username', 'Имя пользователя'),
      email: t('profile.email', 'Email'),
      memberSince: t('profile.memberSince', 'Участник с'),
      accountType: t('profile.accountType', 'Тип аккаунта'),
      regularUser: t('profile.regularUser', 'Обычный пользователь'),
      logout: t('profile.logout', 'Выйти из аккаунта'),
      notAuthorized: t('profile.notAuthorized', 'Пожалуйста, авторизуйтесь для просмотра профиля'),
      loading: t('profile.loading', 'Загрузка...'),
      settings: t('profile.settings', 'Настройки'),
      purchaseHistory: t('profile.purchaseHistory', 'История покупок'),
      onlineSupport: t('profile.onlineSupport', 'Онлайн поддержка'),
      bonuses: t('profile.bonuses', 'Бонусы'),
      userInfo: t('profile.userInfo', 'Информация о пользователе'),
      currentBalance: t('profile.currentBalance', 'Текущий баланс'),
      activity: t('profile.activity', 'Активность'),
      balanceUSD: t('profile.balanceUSD', 'Баланс (USD)'),
      balanceRUB: t('profile.balanceRUB', 'Баланс (RUB)'),
      copyUsername: t('profile.copyUsername', 'Скопировать имя пользователя'),
      copyEmail: t('profile.copyEmail', 'Скопировать email'),
      noPurchases: t('profile.noPurchases', 'Пока нет покупок'),
      supportAvailable: t('profile.supportAvailable', 'Доступна в любое время'),
      bonusesComing: t('profile.bonusesComing', 'Доступные бонусы появятся здесь'),
      emailCopied: t('profile.emailCopied', 'Email скопирован в буфер обмена'),
      usernameCopied: t('profile.usernameCopied', 'Имя пользователя скопировано в буфер обмена'),
      copyError: t('profile.copyError', 'Ошибка при копировании'),
      logoutError: t('profile.logoutError', 'Ошибка при выходе из аккаунта'),
      instruction: t('profile.instruction', 'Инструкция')
    };
  };

  // Состояние для покупок
  const [purchases, setPurchases] = useState([]);
  const [loadingPurchases, setLoadingPurchases] = useState(false);

  // Функции для копирования данных
  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(session.user.email);
      showNotification('success', currentContent.emailCopied);
    } catch (err) {
      console.error('Failed to copy email: ', err);
      showNotification('error', currentContent.copyError);
    }
  };

  const handleCopyUsername = async () => {
    try {
      const username = session.user.username || session.user.name || '';
      await navigator.clipboard.writeText(username);
      showNotification('success', currentContent.usernameCopied);
    } catch (err) {
      console.error('Failed to copy username: ', err);
      showNotification('error', currentContent.copyError);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut({ redirect: false });
      router.push(`/${language}`);
    } catch (error) {
      console.error('Error signing out:', error);
      showNotification('error', currentContent.logoutError);
    }
  };

  const showNotification = (type, message) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, type, message }]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    }, 4000);
  };

  // Загрузка покупок пользователя
  const fetchPurchases = async () => {
    if (!session?.user?.id) return;

    try {
      setLoadingPurchases(true);
      const response = await fetch(`/api/user-purchases?userId=${session.user.id}`);
      const data = await response.json();

      if (data.success) {
        setPurchases(data.userPurchases || []);
      } else {
        console.error('Failed to fetch purchases:', data.error);
        showNotification('error', 'Failed to load purchase history');
      }
    } catch (error) {
      console.error('Error fetching purchases:', error);
      showNotification('error', 'Error loading purchase history');
    } finally {
      setLoadingPurchases(false);
    }
  };

  // Загружаем покупки при открытии вкладки
  useEffect(() => {
    if (activeTab === 'purchaseHistory' && session?.user?.id) {
      fetchPurchases();
    }
  }, [activeTab, session?.user?.id]);

  const currentContent = getLocalizedContent();

  if (status === 'loading') {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-slate-900 pt-20 flex items-center justify-center">
          <div className="text-white text-lg">{currentContent.loading}</div>
        </div>
        <Footer />
      </>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-slate-900 pt-20 flex items-center justify-center">
          <div className="text-white text-lg">{currentContent.notAuthorized}</div>
        </div>
        <Footer />
      </>
    );
  }

  // Данные вкладок
  const tabs = [
    { id: 'settings', label: currentContent.settings, icon: Settings },
    { id: 'purchaseHistory', label: currentContent.purchaseHistory, icon: ShoppingBag },
    { id: 'onlineSupport', label: currentContent.onlineSupport, icon: Headphones },
    { id: 'bonuses', label: currentContent.bonuses, icon: Gift }
  ];

  // Функция для рендера контента вкладок
  const renderTabContent = () => {
    switch (activeTab) {
      case 'settings':
        return (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <AnimatedCard index={0} className="p-6">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-cyan-400" />
                {currentContent.userInfo}
              </h3>
              <div className="space-y-4">
                {/* Username Field - ТОЛЬКО ДЛЯ КОПИРОВАНИЯ */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-slate-300 text-sm">{currentContent.username}</span>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm">{session.user.username || session.user.name}</span>
                      <button
                        onClick={handleCopyUsername}
                        className="p-1 hover:bg-white/10 rounded transition-colors cursor-pointer"
                        title={currentContent.copyUsername}
                      >
                        <Copy className="w-3 h-3 text-slate-300 hover:text-white" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Email Field - ТОЛЬКО ДЛЯ КОПИРОВАНИЯ */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="text-slate-300 text-sm">{currentContent.email}</span>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-white text-sm">{session.user.email}</span>
                      <button
                        onClick={handleCopyEmail}
                        className="p-1 hover:bg-white/10 rounded transition-colors cursor-pointer"
                        title={currentContent.copyEmail}
                      >
                        <Copy className="w-3 h-3 text-slate-300 hover:text-white" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Member Since - ТОЛЬКО ДЛЯ ЧТЕНИЯ */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-700/50">
                  <span className="text-slate-300 text-sm">{currentContent.memberSince}</span>
                  <span className="text-white text-sm">25.10.2025</span>
                </div>

                {/* Account Type - ТОЛЬКО ДЛЯ ЧТЕНИЯ */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-700/50">
                  <span className="text-slate-300 text-sm">{currentContent.accountType}</span>
                  <span className="text-white text-sm">{currentContent.regularUser}</span>
                </div>
              </div>
            </AnimatedCard>
          </motion.div>
        );

      case 'purchaseHistory':
        return (
          <motion.div
            key="purchaseHistory"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <AnimatedCard index={0} className="p-6">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-cyan-400" />
                {currentContent.purchaseHistory}
              </h3>
              
              {loadingPurchases ? (
                <div className="text-center py-8">
                  <p className="text-white/50 font-light">Loading purchases...</p>
                </div>
              ) : purchases.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-white/50 font-light">{currentContent.noPurchases}</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {purchases.map((purchase) => {
                    const productName = purchase.product?.translations?.find(t => t.language === language)?.name ||
                                       purchase.product?.translations?.find(t => t.language === 'ru')?.name ||
                                       purchase.product?.translations?.find(t => t.language === 'en')?.name ||
                                       purchase.product?.name || 'Unknown Product';
       
                    return (
                      <div key={purchase.id} className="border border-gray-700/50 rounded-lg overflow-hidden">
                        {/* Заголовок покупки */}
                        <div className="bg-gray-800/50 p-4 border-b border-gray-700/50">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex-1">
                              <h4 className="text-white font-medium text-base truncate">{productName}</h4>
                              <p className="text-slate-400 text-sm mt-1">
                                {new Date(purchase.createdAt).toLocaleDateString()} • {purchase.price} {purchase.currency}
                              </p>
                              <p className="text-slate-500 text-xs mt-1">
                                {purchase.orderId} • {new Date(purchase.createdAt).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Основной контент */}
                        <div className="p-4 space-y-4">
                          {/* Ключи */}
                          {purchase.keys && (
                            <div className="bg-gray-800/30 p-3 rounded-lg">
                              <h5 className="text-slate-300 text-sm font-medium mb-2">{t('profile.keys', 'Keys')}:</h5>
                              <div className="relative group">
                                <pre className="text-white text-sm font-mono bg-gray-900 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap break-all">
                                  {purchase.keys}
                                </pre>
                                <button
                                  onClick={async () => {
                                    try {
                                      await navigator.clipboard.writeText(purchase.keys);
                                      showNotification('success', 'Ключи скопированы в буфер обмена');
                                    } catch (err) {
                                      console.error('Failed to copy keys: ', err);
                                      showNotification('error', 'Ошибка при копировании ключей');
                                    }
                                  }}
                                  className="absolute top-2 right-2 p-1 bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                  title="Скопировать ключи"
                                >
                                  <Copy className="w-4 h-4 text-gray-300" />
                                </button>
                              </div>
                            </div>
                          )}
                          
                          {/* Инструкция */}
                          {purchase.instruction && (
                            <div className="bg-gray-800/30 p-3 rounded-lg">
                              <h5 className="text-slate-300 text-sm font-medium mb-3">{currentContent.instruction}:</h5>
                              <GitHubMarkdown
                                content={purchase.instruction}
                                language={language}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </AnimatedCard>
          </motion.div>
        );

      case 'onlineSupport':
        return (
          <motion.div
            key="onlineSupport"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <AnimatedCard index={0} className="p-6">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <Headphones className="w-5 h-5 text-cyan-400" />
                {currentContent.onlineSupport}
              </h3>
              <div className="text-center py-8">
                <p className="text-white/50 font-light">{currentContent.supportAvailable}</p>
              </div>
            </AnimatedCard>
          </motion.div>
        );

      case 'bonuses':
        return (
          <motion.div
            key="bonuses"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <AnimatedCard index={0} className="p-6">
              <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                <Gift className="w-5 h-5 text-cyan-400" />
                {currentContent.bonuses}
              </h3>
              <div className="text-center py-8">
                <p className="text-white/50 font-light">{currentContent.bonusesComing}</p>
              </div>
            </AnimatedCard>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Header />
      
      {/* Background Image */}
      <div 
        className="absolute top-0 left-0 w-full h-full bg-cover bg-top bg-no-repeat pointer-events-none z-0"
        style={{ backgroundImage: 'url(/images/backgrounds/grid.png)' }}
      />
      
      <div className="min-h-screen pt-20 relative z-10">
        {/* Hero Section - removed title and subtitle */}
        <div className="relative">
          <div className="w-full px-4 sm:px-8 lg:px-48 py-4">
            <motion.div
              className="text-left"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Empty content - minimalistic approach */}
            </motion.div>
          </div>
        </div>

        {/* Main Content */}
        <section className="py-4">
          <div className="w-full px-4 sm:px-8 lg:px-48">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              
              {/* Левая боковая панель */}
              <motion.div
                className="lg:col-span-1"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {/* Информация о пользователе */}
                <AnimatedCard index={0} className="p-4 mb-4">
                  <div className="flex flex-col gap-1">
                    <h3 className="text-lg font-medium text-white leading-tight">
                      {session.user.username || session.user.name}
                    </h3>
                    <p className="text-slate-300 text-sm leading-tight">{session.user.email}</p>
                  </div>
                </AnimatedCard>

                {/* Навигация по вкладкам */}
                <AnimatedCard index={1} className="p-3">
                  <div className="space-y-1">
                    {tabs.map((tab, index) => {
                      const IconComponent = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors text-sm cursor-pointer ${
                            activeTab === tab.id
                              ? 'bg-white/5 text-white'
                              : 'text-slate-300 hover:bg-white/5 hover:text-white'
                          }`}
                          onClick={() => setActiveTab(tab.id)}
                        >
                          <IconComponent className="w-4 h-4" />
                          <span>{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Кнопка выхода */}
                  <div className="mt-4 pt-3 border-t border-white/10">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-sm cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>{currentContent.logout}</span>
                    </button>
                  </div>
                </AnimatedCard>
              </motion.div>

              {/* Правая рабочая область */}
              <motion.div
                className="lg:col-span-3"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <AnimatePresence mode="wait">
                  {renderTabContent()}
                </AnimatePresence>
              </motion.div>
            </div>
          </div>
        </section>
      </div>

      {/* Уведомления */}
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 300, scale: 0.3 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.5, transition: { duration: 0.2 } }}
            className={`fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm ${
              notification.type === 'success'
                ? 'bg-green-500 text-white'
                : notification.type === 'error'
                ? 'bg-red-500 text-white'
                : 'bg-blue-500 text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === 'success' ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              ) : notification.type === 'error' ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              )}
              <span className="text-sm font-medium">{notification.message}</span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      <Footer />
    </>
  );
}