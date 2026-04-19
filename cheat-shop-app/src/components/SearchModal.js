import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../i18n/LanguageContext';
import { formatPrice } from '../lib/utils/variantUtils';
import { getMediaUrl } from '../lib/utils/imageUtils';

const SearchModal = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState({ products: [], games: [] });
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef(null);
  const router = useRouter();
  const searchTimeout = useRef(null);
  const { t, language } = useLanguage();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 300);
    }
    
    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [isOpen]);

  const performSearch = async (searchValue) => {
    if (!searchValue.trim()) {
      setSearchResults({ products: [], games: [] });
      return;
    }

    setIsLoading(true);
    try {
      console.log('Searching for:', searchValue);
      const searchLower = searchValue.toLowerCase();
      const response = await fetch(`/api/search?search=${encodeURIComponent(searchLower)}`);
      const data = await response.json();
      console.log('Search API response:', data);
      setSearchResults({ products: data.products || [], games: data.games || [] });
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    searchTimeout.current = setTimeout(() => {
      performSearch(value);
    }, 300);
  };

  const handleProductClick = (slug) => {
    onClose();
    setTimeout(() => {
      router.push(`/product/${slug}`);
    }, 300);
  };

  const handleGameClick = (slug) => {
    onClose();
    setTimeout(() => {
      router.push(`/catalog?game=${slug}`);
    }, 300);
  };

  const handleClose = () => {
    onClose();
    setSearchTerm('');
    setSearchResults({ products: [], games: [] });
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
  };

  const hasResults = searchResults.products.length > 0 || searchResults.games.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed inset-0 z-50 backdrop-blur-lg bg-black/50"
            onClick={handleClose}
          />
          
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ 
              duration: 0.4, 
              ease: [0.22, 1, 0.36, 1],
              delay: 0.1 
            }}
            className="fixed inset-0 z-50 overflow-hidden pointer-events-none"
          >
            <motion.div
              initial={{ y: -100 }}
              animate={{ y: 0 }}
              transition={{ 
                duration: 0.5, 
                ease: [0.22, 1, 0.36, 1],
                delay: 0.2 
              }}
              className="backdrop-blur-sm border-b border-gray-800/50 p-4 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="max-w-4xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                  <motion.h2 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-xl font-semibold text-white"
                  >
                    {t('search.title', 'Search Products and Games')}
                  </motion.h2>
                  <motion.button
                    initial={{ opacity: 0, rotate: 90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    transition={{ delay: 0.4 }}
                    onClick={handleClose}
                    className="text-gray-400 hover:text-white p-2 rounded-lg"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </motion.button>
                </div>
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="relative"
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder={t('search.placeholder', 'Search for products and games...')}
                    className="w-full px-6 py-4 bg-gray-900/80 backdrop-blur-sm border border-gray-700/50 rounded-xl text-white placeholder-gray-400 focus:outline-none text-lg"
                    autoFocus
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <button
                        onClick={() => performSearch(searchTerm)}
                        disabled={!searchTerm.trim()}
                        className={`text-gray-500 ${searchTerm.trim() ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                      </button>
                    )}
                  </div>
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="h-[calc(100vh-140px)] overflow-y-auto bg-transparent p-4 pointer-events-auto"
              onClick={(e) => {
                // Закрываем только если клик был по самому контейнеру, а не по его содержимому
                if (e.target === e.currentTarget) {
                  handleClose();
                }
              }}
            >
              <div className="max-w-4xl mx-auto">
                {hasResults ? (
                  <div className="space-y-8">
                    {searchResults.products.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-4">{t('search.productsSection', 'Products')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                          {searchResults.products.map((product, index) => {
                            const productName = product.translations?.find(t => t.language === language)?.name ||
                                               product.translations?.[0]?.name ||
                                               t('search.unnamedProduct', 'Unnamed Product');
                            const productDescription = product.translations?.find(t => t.language === language)?.description ||
                                                     product.translations?.[0]?.description || '';
                            
                            const mainImage = product.media?.find(m => m.isMainImage) || product.media?.[0];
                            
                            return (
                              <div
                                key={product.id}
                                onClick={() => handleProductClick(product.slug)}
                                className={`relative rounded-2xl p-6 cursor-pointer transition-colors duration-300 overflow-hidden flex-row aspect-[16/9] min-h-[200px]`}
                                style={{
                                  backgroundImage: mainImage ? `url(${mainImage.url})` : undefined,
                                  backgroundSize: 'cover',
                                  backgroundPosition: 'center',
                                  backgroundRepeat: 'no-repeat',
                                  backgroundColor: mainImage ? 'transparent' : '#1e293b'
                                }}
                              >
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-800/100 via-slate-800/40 to-transparent rounded-2xl z-5" />
                                
                                <div className="absolute inset-0 flex flex-col justify-end p-4 z-10">
                                  <div className="flex flex-row justify-between items-end w-full">
                                    {/* Left side: Name and quantity */}
                                    <div className="flex flex-col">
                                      <h3 className="text-white text-sm font-normal leading-tight drop-shadow-lg">
                                        {productName}
                                      </h3>
                                      <span className="text-slate-200 text-xs font-normal leading-tight drop-shadow">
                                        {product.variants?.length || 0} {language === 'en' ? 'variants' : 'вариантов'}
                                      </span>
                                    </div>

                                    {/* Right side: Price */}
                                    <div className="text-white text-base font-normal text-right drop-shadow-lg">
                                      {language === 'ru' ? 'от ' : 'from '}{formatPrice(product.variants?.[0]?.priceRub || product.variants?.[0]?.priceUsd, language === 'ru' ? 'RUB' : 'USD', language)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {searchResults.games.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-4">{t('search.gamesSection', 'Games')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {searchResults.games.map((game, index) => (
                            <div
                              key={game.id}
                              onClick={() => handleGameClick(game.slug)}
                              className="relative rounded-xl cursor-pointer transition-all duration-300 overflow-hidden aspect-[3/4] group"
                              style={{
                                backgroundColor: game.image ? 'transparent' : '#1e293b',
                                backgroundImage: !game.image ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' : undefined
                              }}
                            >
                              {game.image ? (
                                <div className="absolute inset-0">
                                  <img
                                    src={getMediaUrl(game.image)}
                                    alt={game.name || t('search.unnamedGame', 'Unnamed Game')}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900" />
                              )}
                              
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent rounded-xl z-10" />
                               
                              <div className="absolute inset-0 flex flex-col justify-end p-4 z-20">
                                <div className="flex flex-col h-full justify-end">
                                  
                                  <div className="flex justify-between items-end mt-auto">
                                    {/* Left side: Name and quantity */}
                                    <div className="flex flex-col">
                                      <h3 className="text-white text-sm font-normal leading-tight drop-shadow-lg">
                                        {game.name || t('search.unnamedGame', 'Unnamed Game')}
                                      </h3>
                                      <span className="text-slate-200 text-xs font-normal leading-tight drop-shadow">
                                        {game.productCount || 0} {language === 'en' ? 'products' : 'товаров'}
                                      </span>
                                    </div>
                                    
                                    {/* Right side: Price */}
                                    <div className="text-white text-base font-normal text-right drop-shadow-lg">
                                      {(game.minPriceUsd || game.minPriceRub) ? (
                                        language === 'ru' ? (
                                          `от ${formatPrice(game.minPriceRub || game.minPriceUsd, 'RUB', language)}`
                                        ) : (
                                          `from ${formatPrice(game.minPriceUsd || game.minPriceRub, 'USD', language)}`
                                        )
                                      ) : (
                                        language === 'en' ? 'No products' : 'Нет товаров'
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="text-gray-400/80 mb-6 text-center">
                      {isLoading ? (
                        // Минималистичный белый лоудер (без центрального кружка)
                        <div className="flex flex-col items-center">
                          <div className="relative">
                            {/* Только вращающееся кольцо */}
                            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          </div>
                        </div>
                      ) : searchTerm ? (
                        // Пустой контейнер при отсутствии результатов поиска
                        <></>
                      ) : (
                        <div className="text-center">
                          <div>
                            <svg className="w-24 h-24 mx-auto text-gray-600/50 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                            </svg>
                          </div>
                          <p className="text-xl text-white/90 mb-2">
                            {t('search.startSearching', 'Start searching for products and games')}
                          </p>
                          <p className="text-gray-400/70">
                            {t('search.typeToSearch', 'Type in the search box above to find products and games')}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default SearchModal;