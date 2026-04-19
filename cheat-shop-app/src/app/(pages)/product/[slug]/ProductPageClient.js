'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '../../../../i18n/LanguageContext';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import Header from '../../../../components/Header';
import Footer from '../../../../components/Footer';
import ProductMediaSlider from '@/components/ProductMediaSlider';
import Breadcrumbs from '@/components/Breadcrumbs';
import BreadcrumbsStructuredData from '@/components/BreadcrumbsStructuredData';
import { findVariant } from '../../../../lib/utils/variantUtils';
import { useNotification } from '../../../../components/NotificationComponent';

export default function ProductPageClient({ slug }) {
  const { language: lang, t } = useLanguage();
  const router = useRouter();
  const { addNotification } = useNotification();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState('global');
  const [selectedVersion, setSelectedVersion] = useState('full');
  const [selectedDays, setSelectedDays] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  useEffect(() => {
    console.log('ProductPageClient useEffect triggered');
    console.log('Slug value:', slug);
    console.log('Slug type:', typeof slug);
    console.log('Slug is empty?', !slug);
    
    if (!slug || slug === '') {
      console.error('No slug provided to ProductPageClient');
      setLoading(false);
      setProduct(null);
      return;
    }

    const fetchProduct = async () => {
      try {
        console.log('Fetching product with slug:', slug);
        const response = await fetch(`/api/products/by-slug?slug=${encodeURIComponent(slug)}`);
        const data = await response.json();
        
        console.log('Product API response:', data);
        
        if (data.success && data.product) {
          console.log('Product found:', data.product.name);
          setProduct(data.product);
        } else {
          console.log('Product not found, error:', data.error);
          setError(data.error || t('product.notFound'));
          setProduct(null);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        setError(t('product.errorLoading'));
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [slug, t]);

  // Инициализируем состояния на основе доступных вариантов
  useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
      const uniqueRegions = getUniqueRegions();
      const uniqueTypes = getUniqueTypes();
      const uniqueDays = getUniqueDays();

      if (uniqueRegions.length > 0 && !uniqueRegions.includes(selectedRegion)) {
        setSelectedRegion(uniqueRegions[0]);
      }

      if (uniqueTypes.length > 0 && !uniqueTypes.includes(selectedVersion)) {
        const defaultType = uniqueTypes.length === 1 ? uniqueTypes[0] : 'full';
        setSelectedVersion(defaultType);
      }

      if (uniqueDays.length > 0 && !uniqueDays.includes(selectedDays)) {
        setSelectedDays(uniqueDays[0]);
      }
    }
  }, [product, selectedRegion, selectedVersion, selectedDays]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'undetected':
        return 'text-green-400';
      case 'detected':
        return 'text-red-400';
      case 'useAtOwnRisk':
        return 'text-yellow-400';
      case 'onUpdate':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusText = (status) => t(`product.statusValues.${status}`);

  const getBreadcrumbs = () => {
    // Базовый путь - всегда начинается с каталога
    const breadcrumbs = [
      { name: t('catalog.catalog'), path: `/${lang}/catalog`, active: false }
    ];

    // Если есть игра, добавляем её
    if (product?.game) {
      const gameSlug = product.game.slug;
      breadcrumbs.push({
        name: product.game.name,
        path: `/${lang}/catalog?game=${gameSlug}`,
        active: false
      });

      // Если есть категория, добавляем её
      if (product.category) {
        const catSlug = product.category.slug;
        // Получаем название категории с учетом языка
        const categoryName = product.category.translations?.find(t => t.language === lang)?.name 
          || product.category.translations?.[0]?.name 
          || product.category.name;

        breadcrumbs.push({
          name: categoryName,
          path: `/${lang}/catalog?game=${gameSlug}&category=${catSlug}`,
          active: false
        });
      }
    }

    // Добавляем текущий продукт
    const productName = product?.translations?.find(t => t.language === lang)?.name 
      || product?.translations?.[0]?.name 
      || product?.name 
      || t('product.product');

    breadcrumbs.push({
      name: productName,
      active: true
    });

    return breadcrumbs;
  };

  const getUniqueRegions = () => {
    const regions = product?.variants?.map(v => v.region) || [];
    return [...new Set(regions)];
  };

  const getUniqueTypes = () => {
    const types = product?.variants?.map(v => v.type) || [];
    return [...new Set(types)];
  };

  const getUniqueDays = () => {
    const days = product?.variants?.map(v => v.days) || [];
    return [...new Set(days)].sort((a, b) => a - b);
  };

  const shouldShowVersionSelector = () => {
    const uniqueTypes = getUniqueTypes();
    return uniqueTypes.includes('full') && uniqueTypes.includes('lite');
  };

  const getVariantLabel = (variant) => {
    if (!variant) return '';
    return lang === 'ru' ? variant.daysLabelRu : variant.daysLabelEn;
  };

  const getVariantPrices = () => {
    if (!product?.variants || product.variants.length === 0) {
      return {};
    }

    const variant = findVariant(product.variants, {
      type: selectedVersion,
      region: selectedRegion,
      days: selectedDays
    });

    if (variant) {
      return {
        [selectedDays]: lang === 'ru' ? variant.priceRub : variant.priceUsd
      };
    }

    const prices = {};
    const uniqueDays = getUniqueDays();
    
    uniqueDays.forEach(days => {
      const variantForDays = findVariant(product.variants, {
        type: selectedVersion,
        region: selectedRegion,
        days: days
      });
      
      if (variantForDays) {
        prices[days] = lang === 'ru' ? variantForDays.priceRub : variantForDays.priceUsd;
      }
    });

    return prices;
  };

  const prices = product ? getVariantPrices() : {};

    const handleNextClick = async () => {
    if (!agreedToTerms || !product) return;

    setIsCreatingOrder(true);

    try {
      const variant = product.variants.find(v =>
        v.region === selectedRegion &&
        v.type === selectedVersion &&
        v.days === selectedDays
      );

      if (!variant) {
        addNotification(
          t('product.errors.variantNotFound'),
          'error',
          5000
        );
        setIsCreatingOrder(false);
        return;
      }

      const price = lang === 'ru' ? variant.priceRub : variant.priceUsd;
      const currency = lang === 'ru' ? 'RUB' : 'USD';

      // Получаем email пользователя если он авторизован
      let userEmail = '';
      let userId = null;
      try {
        const userResponse = await fetch('/api/users/profile');
        const userData = await userResponse.json();
        if (userData.success && userData.user) {
          userEmail = userData.user.email || '';
          userId = userData.user.id;
        }
      } catch (error) {
        console.log('User not authenticated');
      }

      // Если пользователь не авторизован, используем временный email
      if (!userEmail) {
        userEmail = `guest_${Date.now()}@temp.atomcheats.com`;
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
          variantId: variant.id,
          email: userEmail,
          userId: userId,
          referralCode: '',
          paymentMethod: 'sbp',
          currency: currency.toLowerCase(),
          quantity: 1,
          language: lang
        })
      });

      const result = await response.json();

      if (result.success) {
        addNotification(
          t('product.errors.orderCreatedSuccess'),
          'success'
        );
        router.push(`/${lang}/order?orderId=${result.order.id}`);
      } else {
        // Показываем уведомление об ошибке
        let errorMessage = result.error;
        if (result.error === 'No available keys') {
          errorMessage = t('product.errors.noKeys');
        }
        
        addNotification(errorMessage, 'error', 6000);
      }
    } catch (error) {
      // Показываем уведомление об ошибке
      addNotification(
        t('product.errors.orderCreationFailed'),
        'error',
        6000
      );
    } finally {
      setIsCreatingOrder(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div
          className="fixed inset-0 bg-cover bg-top bg-no-repeat pointer-events-none z-0"
          style={{ backgroundImage: 'url(/images/backgrounds/grid.png)' }}
        />
        <div className="min-h-screen pt-20 relative z-10 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <div
          className="fixed inset-0 bg-cover bg-top bg-no-repeat pointer-events-none z-0"
          style={{ backgroundImage: 'url(/images/backgrounds/grid.png)' }}
        />
        <div className="min-h-screen pt-20 relative z-10 flex items-center justify-center">
          <div className="text-center">
            <div className="text-white text-xl mb-4">{error}</div>
            <button
              onClick={() => router.push('/catalog')}
              className="px-6 py-2 bg-white text-[#171717] rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              {t('product.backToCatalog')}
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Header />
        <div
          className="fixed inset-0 bg-cover bg-top bg-no-repeat pointer-events-none z-0"
          style={{ backgroundImage: 'url(/images/backgrounds/grid.png)' }}
        />
        <div className="min-h-screen pt-20 relative z-10 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <h1 className="text-2xl font-bold text-white mb-4">Товар не найден</h1>
            <p className="text-slate-400 mb-6">
              Запрашиваемый товар не существует или был удален.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => router.push('/catalog')}
                className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Перейти в каталог
              </button>
              <button
                onClick={() => router.back()}
                className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Назад
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const features = product.features || [];
  const allMedia = product.media?.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)) || [];
  const breadcrumbs = getBreadcrumbs();
  const additionalFeatures = [];

  return (
    <>
      <BreadcrumbsStructuredData items={breadcrumbs} />
      <Header />
      
      <div
        className="absolute top-0 left-0 w-full h-full bg-cover bg-top bg-no-repeat pointer-events-none z-0"
        style={{ backgroundImage: 'url(/images/backgrounds/grid.png)' }}
      />
      
      <div className="min-h-screen pt-20 relative z-10">
        <div className="relative">
          <div className="w-full px-4 sm:px-8 lg:px-48 py-8">
            <Breadcrumbs items={breadcrumbs} />
          </div>
        </div>

        <section className="py-8">
          <div className="w-full px-4 sm:px-8 lg:px-48">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
              <div className="xl:col-span-7">
                {allMedia.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 relative"
                  >
                    <ProductMediaSlider media={allMedia} />
                  </motion.div>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-white/5 rounded-xl p-3 md:p-4 backdrop-blur-lg"
                >
                  <div className="flex space-x-2 mb-6 border-b border-white/10 pb-2 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
                    <button
                      onClick={() => setActiveTab('description')}
                      className={`px-3 py-2 rounded-lg font-medium transition-all duration-200 cursor-pointer whitespace-nowrap ${
                        activeTab === 'description'
                          ? 'bg-cyan-400 text-[#171717]'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {t('product.description')}
                    </button>
                    <button
                      onClick={() => setActiveTab('features')}
                      className={`px-3 py-2 rounded-lg font-medium transition-all duration-200 cursor-pointer whitespace-nowrap ${
                        activeTab === 'features'
                          ? 'bg-cyan-400 text-[#171717]'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {t('product.features')}
                    </button>
                    <button
                      onClick={() => setActiveTab('requirements')}
                      className={`px-3 py-2 rounded-lg font-medium transition-all duration-200 cursor-pointer whitespace-nowrap ${
                        activeTab === 'requirements'
                          ? 'bg-cyan-400 text-[#171717]'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      {t('product.systemRequirements')}
                    </button>
                  </div>

                  <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800 md:max-h-[calc(100vh-400px)]">
                    {activeTab === 'description' && (
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-4">{t('product.productDescription')}</h3>
                          {product.translations?.find(t => t.language === lang)?.description || product.translations?.[0]?.description ? (
                            <div className="text-gray-300 leading-relaxed space-y-4">
                              {product.translations.find(t => t.language === lang)?.description || product.translations[0].description}
                            </div>
                          ) : (
                            <p className="text-gray-500 italic">Описание отсутствует</p>
                          )}
                        </div>
                  
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-400 mb-2">{t('product.status')}:</h4>
                            <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(product.status)} border border-current`}>
                              {getStatusText(product.status)}
                            </span>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-400 mb-2">{t('product.category')}:</h4>
                            <span className="text-gray-300">{product.category?.name || t('product.notSpecified')}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'features' && (
                      <div className="space-y-6">
                        {features.length > 0 && (
                          <div className="space-y-3">
                            <h3 className="text-lg font-semibold text-white mb-3">{t('product.mainFeatures')}</h3>
                            {features.filter(f => !f.parentId && (f.language === lang || !f.language)).map((feature, index) => (
                              <div key={index} className="space-y-2">
                                <div className="flex items-start space-x-3 p-3 bg-white/5 rounded-lg">
                                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                                  <span className="text-gray-300 font-medium">{feature.title}</span>
                                </div>
                                {features.filter(f => f.parentId === feature.id && (f.language === lang || !f.language)).map((subFeature, subIndex) => (
                                  <div key={subIndex} className="flex items-start space-x-3 p-3 bg-white/5 rounded-lg ml-6">
                                    <div className="w-2 h-2 bg-cyan-400 rounded-full flex-shrink-0 mt-2" />
                                    <span className="text-gray-300 text-sm">{subFeature.title}</span>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>
                        )}

                        {additionalFeatures.length > 0 && additionalFeatures.map((section, sectionIndex) => (
                          <div key={sectionIndex} className="space-y-3">
                            <h3 className="text-lg font-semibold text-white mb-3">{section.title}</h3>
                            <div className="space-y-2">
                              {section.items.map((item, itemIndex) => (
                                <div key={itemIndex} className="flex items-start space-x-3 p-3 bg-white/5 rounded-lg">
                                  <div className="w-1 h-1 bg-white/20 rounded-full flex-shrink-0 mt-2" />
                                  <span className="text-gray-300">{item}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeTab === 'requirements' && (
                      <div className="space-y-6 md:space-y-4">
                        {product.systemRequirementItems && product.systemRequirementItems.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {product.systemRequirementItems
                              .filter(item => item.language === lang)
                              .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
                              .map((item, index) => (
                                <div key={index} className="p-4">
                                  <div className="flex items-start space-x-3">
                                    {item.icon && (
                                      <div className="flex-shrink-0">
                                        <img
                                          src={`/images/product/icons/${item.icon}.svg`}
                                          alt={item.title}
                                          className="h-8 w-8 brightness-0 invert"
                                          onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = `/images/product/icons/1.svg`;
                                          }}
                                        />
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-white font-medium text-sm mb-1 truncate">{item.title}</h4>
                                      {item.description && (
                                        <p className="text-gray-300 text-xs leading-relaxed">{item.description}</p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                          </div>
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-gray-400">{t('product.noSystemRequirements')}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>

              <div className="xl:col-span-5">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white/5 rounded-xl p-6 backdrop-blur-lg"
                >
                  <h2 className="text-xl font-bold text-white mb-6">{t('product.orderForm')}</h2>

                  <div className="mb-6">
                    <label className="text-sm font-medium text-gray-300 mb-3 block">{t('product.region')}</label>
                    <div className="flex bg-white/10 rounded-lg p-1">
                      {getUniqueRegions().map(region => (
                        <button
                          key={region}
                          onClick={() => setSelectedRegion(region)}
                          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer ${
                            selectedRegion === region
                              ? 'bg-cyan-400 text-[#171717]'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          {region === 'global' ? 'Global' : region === 'cis' ? 'CIS' : region}
                        </button>
                      ))}
                    </div>
                  </div>

                  {shouldShowVersionSelector() && (
                    <div className="mb-6">
                      <label className="text-sm font-medium text-gray-300 mb-3 block">{t('product.version')}</label>
                      <div className="flex bg-white/10 rounded-lg p-1">
                        {getUniqueTypes().map(type => (
                          <button
                            key={type}
                            onClick={() => setSelectedVersion(type)}
                            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all duration-200 cursor-pointer ${
                              selectedVersion === type
                                ? 'bg-cyan-400 text-[#171717]'
                                : 'text-gray-400 hover:text-white'
                            }`}
                          >
                            {type === 'full' ? 'Full' : type === 'lite' ? 'Lite' : type}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mb-6">
                    <label className="text-sm font-medium text-gray-300 mb-3 block">{t('product.daysCount')}</label>
                    <div className="space-y-2">
                      {getUniqueDays().map((days) => {
                        const price = prices[days];
                        const variant = product.variants.find(v => v.days === days && v.region === selectedRegion && v.type === selectedVersion);
                        const displayName = getVariantLabel(variant);
                        return (
                          <button
                            key={days}
                            onClick={() => setSelectedDays(days)}
                            className={`w-full flex justify-between items-center p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                              selectedDays === days
                                ? 'border-cyan-400 bg-cyan-400/10'
                                : 'border-white/10 hover:border-cyan-400/50'
                            }`}
                          >
                            <span className="text-white font-medium">{displayName || `${days} ${days === 1 ? t('product.day') : days >= 2 && days <= 4 ? t('product.days2-4') : t('product.days5+')}`}</span>
                            <span className="text-cyan-400 font-bold">{price ? (lang === 'ru' ? `${price} ₽` : `$${price}`) : t('product.noPrice')}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="flex items-center space-x-3 cursor-pointer group">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={agreedToTerms}
                          onChange={(e) => setAgreedToTerms(e.target.checked)}
                          className="sr-only"
                        />
                        <div className={`w-5 h-5 border-2 rounded transition-all duration-200 flex items-center justify-center cursor-pointer ${
                          agreedToTerms
                            ? 'bg-cyan-400 border-cyan-400'
                            : 'bg-white/10 border-white/20 group-hover:border-cyan-400'
                        }`}>
                          {agreedToTerms && (
                            <Check className="w-3 h-3 text-[#171717]" />
                          )}
                        </div>
                      </div>
                      <span className="text-sm text-gray-300 group-hover:text-white transition-colors cursor-pointer">
                        {lang === 'ru' ? 'Я согласен с' : 'I agree to the'} {' '}
                        <a
                          href="/tos"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
                        >
                          {lang === 'ru' ? 'условиями пользовательского соглашения' : 'terms of service'}
                        </a>
                      </span>
                    </label>
                  </div>

                  <button
                    disabled={!agreedToTerms || isCreatingOrder}
                    onClick={handleNextClick}
                    className={`w-full py-4 rounded-2xl font-semibold transition-all duration-300 ${
                      agreedToTerms && !isCreatingOrder
                        ? 'bg-cyan-400 text-[#171717] hover:bg-cyan-300 cursor-pointer'
                        : 'bg-white/10 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {isCreatingOrder ? t('product.creating') : t('product.next')}
                  </button>

                  <div className="mt-4 text-xs text-gray-400 text-center">
                    {t('product.afterPayment')}
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
}
