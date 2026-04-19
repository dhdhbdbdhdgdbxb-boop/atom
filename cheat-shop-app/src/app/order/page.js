'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, Mail, Gift, ChevronRight, CreditCard, X } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import paymentMethods from '@/config/paymentMethods';
import { useNotification } from '@/components/NotificationComponent';
import { getMediaUrl } from '@/lib/utils/imageUtils';

function OrderContent() {
  const { language: lang, t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const { addNotification } = useNotification();
  
  const [activeStep, setActiveStep] = useState('payment');
  const [paymentMethod, setPaymentMethod] = useState(() => {
    // Устанавливаем метод по умолчанию в зависимости от языка
    return lang === 'en' ? 'foreignCards' : 'sbp';
  });
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showInstructionModal, setShowInstructionModal] = useState(false);
  const [selectedInstructionMethod, setSelectedInstructionMethod] = useState(null);
  const [email, setEmail] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0); // Процент скидки от купона
  const [couponValid, setCouponValid] = useState(null); // Статус валидации купона
  const [quantity, setQuantity] = useState(1);
  const [order, setOrder] = useState(null);
  const [product, setProduct] = useState(null);
  const [variant, setVariant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currencyChoice, setCurrencyChoice] = useState('usd'); // по умолчанию USD
  const [userId, setUserId] = useState(null); // ID пользователя для оплаты с баланса
  const [isSubmitting, setIsSubmitting] = useState(false); // Флаг для предотвращения двойного нажатия
  const [feeCalculation, setFeeCalculation] = useState(null); // Расчёт комиссии
  const [cryptoPaymentUrl, setCryptoPaymentUrl] = useState(null); // URL платёжной страницы CryptoCloud
  const couponTimerRef = useRef(null); // Ref для хранения таймера купона
  
  // Получаем данные заказа и пользователя при загрузке страницы
  useEffect(() => {
    const fetchData = async () => {
      if (!orderId) {
        console.log('No orderId provided');
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching order with ID:', orderId);
        // Получаем данные заказа
        const orderResponse = await fetch(`/api/orders/${orderId}`);
        const orderData = await orderResponse.json();

        console.log('Order response:', orderData);

        if (orderData.success) {
          setOrder(orderData.order);
          
          // Получаем данные продукта
          const productResponse = await fetch(`/api/products/${orderData.order.productId}`);
          const productData = await productResponse.json();

          if (productData.success) {
            setProduct(productData.product);
            
            // Находим выбранный вариант
            const foundVariant = productData.product.variants.find(
              v => v.id === orderData.order.variantId
            );
            setVariant(foundVariant);
          }
        } else {
          console.error('Order not found:', orderData.error);
        }

        // Получаем данные пользователя, если он авторизован
        try {
          const userResponse = await fetch('/api/users/profile');
          const userData = await userResponse.json();
          
          if (userData.success && userData.user) {
            setUserId(userData.user.id);
            setEmail(userData.user.email || email);
          }
        } catch (userError) {
          console.log('User not authenticated');
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [orderId]);

  // Опрос статуса заказа каждые 3 секунды
  useEffect(() => {
    if (!orderId || !order || order.status === 'completed') {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const orderResponse = await fetch(`/api/orders/${orderId}`);
        const orderData = await orderResponse.json();

        if (orderData.success && orderData.order.status === 'completed') {
          setOrder(orderData.order);
          setActiveStep('success');
          addNotification(t('order.paymentSuccess'), 'success');
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Error polling order status:', error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [orderId, order, t, addNotification]);

  // Обновляем метод оплаты по умолчанию когда загружается информация о пользователе
  useEffect(() => {
    const sortedMethods = getSortedPaymentMethods();
    if (sortedMethods.length > 0 && !sortedMethods.find(m => m.id === paymentMethod)) {
      setPaymentMethod(sortedMethods[0].id);
    }
  }, [userId, lang]);
  
  // Загружаем расчёт комиссии при изменении метода оплаты, количества или купона
  useEffect(() => {
    if (!product || !variant) return;

    const fetchFeeCalculation = async () => {
      try {
        const params = new URLSearchParams({
          productId: product.id.toString(),
          variantId: variant.id.toString(),
          quantity: quantity.toString()
        });
        if (couponValid && couponCode) {
          params.append('couponCode', couponCode);
        }
        const response = await fetch(`/api/calculate-price?${params}`);
        const data = await response.json();
        if (data.success && data.calculations[paymentMethod]) {
          setFeeCalculation(data.calculations[paymentMethod]);
        } else {
          setFeeCalculation(null);
        }
      } catch (error) {
        console.error('Error fetching fee calculation:', error);
        setFeeCalculation(null);
      }
    };

    fetchFeeCalculation();
  }, [product, variant, paymentMethod, quantity, couponValid, couponCode]);

  // Очистка таймеров при размонтировании
  useEffect(() => {
    return () => {
      // Очищаем таймер купона
      if (couponTimerRef.current) {
        clearTimeout(couponTimerRef.current);
      }
    };
  }, []);
  
  // Если загружаем данные
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
      </>
    );
  }

  // Если нет данных о заказе
  if (!order || !product || !variant) {
    return (
      <>
        <Header />
        <div
          className="fixed inset-0 bg-cover bg-top bg-no-repeat pointer-events-none z-0"
          style={{ backgroundImage: 'url(/images/backgrounds/grid.png)' }}
        />
        <div className="min-h-screen pt-20 relative z-10 flex items-center justify-center">
          <div className="text-center">
            <div className="text-white text-xl mb-4">{t('order.orderNotFound')}</div>
            <button
              onClick={() => router.push('/catalog')}
              className="px-6 py-2 bg-white text-[#171717] rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              {t('common.backToCatalog')}
            </button>
          </div>
        </div>
      </>
    );
  }

  // Проверяем доступ к заказу
  // Если заказ привязан к пользователю и текущий пользователь не является владельцем, запрещаем доступ
  if (order.userId && userId && order.userId !== userId) {
    return (
      <>
        <Header />
        <div
          className="fixed inset-0 bg-cover bg-top bg-no-repeat pointer-events-none z-0"
          style={{ backgroundImage: 'url(/images/backgrounds/grid.png)' }}
        />
        <div className="min-h-screen pt-20 relative z-10 flex items-center justify-center">
          <div className="text-center">
            <div className="text-white text-xl mb-4">{t('order.accessDenied')}</div>
            <button
              onClick={() => router.push('/catalog')}
              className="px-6 py-2 bg-white text-[#171717] rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
            >
              {t('common.backToCatalog')}
            </button>
          </div>
        </div>
      </>
    );
  }

  // Если заказ уже завершен, отображаем сообщение об успешной оплате
  if (order.status === 'completed') {
    return (
      <>
        <Header />
        <div
          className="fixed inset-0 bg-cover bg-top bg-no-repeat pointer-events-none z-0"
          style={{ backgroundImage: 'url(/images/backgrounds/grid.png)' }}
        />
        <div className="min-h-screen pt-20 relative z-10 flex items-center justify-center">
          <div className="max-w-lg mx-auto text-center">
            <div className="bg-white/5 rounded-2xl p-8 backdrop-blur-lg">
              <div className="w-20 h-20 bg-cyan-400/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check className="w-10 h-10 text-cyan-400" />
              </div>
              
              <h2 className="text-2xl font-bold text-white mb-4">
                {t('order.paymentSuccessful')}!
              </h2>
              
              <p className="text-gray-300 mb-8">
                {t('order.paymentSuccessDescription')}
              </p>

              <div className="space-y-4">
                <div className="bg-white/5 rounded-lg p-4 text-left">
                  <div className="text-sm text-gray-400 mb-1">
                    {t('order.orderNumber')}
                  </div>
                  <div className="text-white font-mono">
                    #{order.id}
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4 text-left">
                  <div className="text-sm text-gray-400 mb-1">
                    {t('order.email')}
                  </div>
                  <div className="text-white">
                    {email}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => router.push('/profile')}
                  className="flex-1 px-6 py-3 bg-cyan-400 text-[#171717] rounded-lg font-semibold hover:bg-cyan-300 transition-colors cursor-pointer"
                >
                  {t('order.goToProfile')}
                </button>
                <button
                  onClick={() => router.push(`/product/${product.slug}`)}
                  className="flex-1 px-6 py-3 border border-cyan-400 text-cyan-400 rounded-lg font-semibold hover:bg-cyan-400/10 transition-colors cursor-pointer"
                >
                  {t('order.backToProduct')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Определяем валюту для отображения
  const getDisplayCurrency = () => {
    // Для российских методов оплаты всегда рубли
    const russianMethods = ['sbp', 'russianCards', 'antilopay', 'pally'];
    if (russianMethods.includes(paymentMethod)) {
      return 'rub';
    }
    // Для баланса RUB - рубли
    if (paymentMethod === 'balanceRub') {
      return 'rub';
    }
    // Для баланса USD - доллары
    if (paymentMethod === 'balanceUsd') {
      return 'usd';
    }
    // Для старого метода баланса - в зависимости от языка
    if (paymentMethod === 'balance') {
      return lang === 'ru' ? 'rub' : 'usd';
    }
    // Для остальных методов - доллары
    return 'usd';
  };

  // Определяем валюту для оплаты с баланса
  const getPaymentCurrency = () => {
    // Для оплаты с баланса RUB используем рубли
    if (paymentMethod === 'balanceRub') {
      return 'rub';
    }
    // Для оплаты с баланса USD используем доллары
    if (paymentMethod === 'balanceUsd') {
      return 'usd';
    }
    // Для старого метода баланса используем валюту в зависимости от языка
    if (paymentMethod === 'balance') {
      return lang === 'ru' ? 'rub' : 'usd';
    }
    // Для других методов используем валюту отображения
    return getDisplayCurrency();
  };

  const displayCurrency = getDisplayCurrency();
  const paymentCurrency = getPaymentCurrency();

  // Форматируем данные для отображения
  const displayProduct = {
    name: product.translations?.find(t => t.language === lang)?.name || product.name || 'Product',
    image: product.media?.find(m => m.type === 'image')?.url || '/images/products/example.png',
    variant: getVariantLabel(variant),
    price: displayCurrency === 'rub' ? parseFloat(variant?.priceRub || order.totalAmount) : parseFloat(variant?.priceUsd || order.totalAmount),
    currency: displayCurrency === 'rub' ? 'RUB' : 'USD'
  };

  // Вспомогательная функция для получения метки варианта
  function getVariantLabel(variant) {
    if (!variant) return '';
    return lang === 'ru' ? variant.daysLabelRu : variant.daysLabelEn;
  }

  // Функция для форматирования цены
  function formatPrice(price, currency) {
    const formattedPrice = parseFloat(price).toFixed(2);
    return currency === 'rub' ? `${formattedPrice}₽` : `$${formattedPrice}`;
  }

  // Функция для сортировки платёжных систем в зависимости от языка
  function getSortedPaymentMethods() {
    let methods = Object.values(paymentMethods);
    
    // Исключаем отключённые методы
    methods = methods.filter(method => !method.disabled);

    // Исключаем методы оплаты с баланса, если пользователь не авторизован
    if (!userId) {
      methods = methods.filter(method => 
        method.id !== 'balance' && 
        method.id !== 'balanceRub' && 
        method.id !== 'balanceUsd'
      );
    }
    
    if (lang === 'en') {
      // Для английского языка: баланс USD, stripe, pally, крипто, остальные
      return methods.sort((a, b) => {
        const priority = {
          'balanceUsd': 1,
          'balanceRub': 2,
          'balance': 3,
          'stripe': 4,
          'pally': 5,
          'cryptocloud': 6,
          'paypal': 7,
          'paypalff': 8,
          'crypto': 9,
          'paysafecard': 10,
          'rewarble': 11,
          'sbp': 12,
          'russianCards': 13,
          'antilopay': 14,
          'foreignCards': 15
        };
        return (priority[a.id] || 99) - (priority[b.id] || 99);
      });
    } else {
      // Для русского языка: баланс RUB, antilopay, pally, крипто, stripe
      return methods.sort((a, b) => {
        const priority = {
          'balanceRub': 1,
          'balanceUsd': 2,
          'balance': 3,
          'antilopay': 4,
          'pally': 5,
          'cryptocloud': 6,
          'stripe': 7,
          'paypal': 8,
          'paypalff': 9,
          'crypto': 10,
          'paysafecard': 11,
          'rewarble': 12,
          'sbp': 13,
          'russianCards': 14,
          'foreignCards': 15
        };
        return (priority[a.id] || 99) - (priority[b.id] || 99);
      });
    }
  }

  const sortedPaymentMethods = getSortedPaymentMethods();

  // Функция для обработки изменения кода купона с debounce
  const handleCouponCodeChange = (e) => {
    const newCouponCode = e.target.value;
    setCouponCode(newCouponCode);
    
    // Сбрасываем статус купона, если код пустой
    if (!newCouponCode.trim()) {
      setCouponDiscount(0);
      setCouponValid(null);
      // Очищаем таймер
      if (couponTimerRef.current) {
        clearTimeout(couponTimerRef.current);
        couponTimerRef.current = null;
      }
      return;
    }
    
    // Очищаем предыдущий таймер
    if (couponTimerRef.current) {
      clearTimeout(couponTimerRef.current);
    }
    
    // Устанавливаем новый таймер для автоматической проверки через 1 секунду
    couponTimerRef.current = setTimeout(() => {
      validateCoupon(newCouponCode);
    }, 1000);
  };
  
  // Функция для проверки купона
  const validateCoupon = async (code) => {
    if (!code.trim()) {
      return;
    }

    try {
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code,
          productId: product.id
        })
      });
      const data = await response.json();

      if (data.valid) {
        setCouponDiscount(data.coupon.discount);
        setCouponValid(true);
        addNotification(t('order.couponApplied', { discount: data.coupon.discount }), 'success');
      } else {
        setCouponDiscount(0);
        setCouponValid(false);
        addNotification(data.error || t('order.couponInvalid'), 'error');
      }
    } catch (error) {
      console.error('Error validating coupon:', error);
      setCouponDiscount(0);
      setCouponValid(false);
      addNotification(t('order.couponError'), 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Предотвращаем двойное нажатие
    if (isSubmitting) {
      return;
    }
    
    // Предотвращаем оплату для методов PAYSAFECARD, REWARBLE, PAYPAL и PAYPAL F&F
    if (isPaymentDisabled) {
      addNotification(t('order.paymentNotAvailable'), 'error');
      return;
    }

    // Проверяем email
    if (!email || !email.trim()) {
      addNotification(lang === 'ru' ? 'Введите email для получения товара' : 'Please enter your email', 'error');
      setIsSubmitting(false);
      return;
    }
    
    // Проверяем, что заказ еще не оплачен
    if (order && order.status === 'completed') {
      addNotification(t('order.alreadyPaid'), 'info');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Для CryptoCloud используем отдельный API endpoint
      if (paymentMethod === 'cryptocloud') {
        // Используем существующий orderId или создаем новый заказ
        let finalOrderId = orderId;
        
        // Если заказа нет или он уже оплачен, создаем новый
        if (!orderId || (order && order.status === 'completed')) {
          const orderResponse = await fetch('/api/orders', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              productId: product.id,
              variantId: variant.id,
              email,
              referralCode,
              paymentMethod: 'cryptocloud',
              userId: userId || null,
              currency: paymentCurrency,
              quantity: quantity,
              orderId: null,
              language: lang,
              couponCode: couponValid ? couponCode : null
            })
          });
          
          const orderData = await orderResponse.json();
          
          if (!orderData.success) {
            addNotification(orderData.error || t('order.orderError'), 'error');
            setIsSubmitting(false);
            return;
          }
          
          finalOrderId = orderData.order.id;
          setOrder(orderData.order);
        }
        
        // Создаем платеж в CryptoCloud
        const response = await fetch('/api/payments/cryptocloud', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: total,
            currency: paymentCurrency.toUpperCase(),
            orderId: finalOrderId,
            email: email,
            description: `Order ${finalOrderId}: ${displayProduct.name}`,
            type: 'order'
          })
        });
        
        const data = await response.json();
        
        if (data.success) {
          // Открываем страницу оплаты CryptoCloud в новом окне
          setCryptoPaymentUrl(data.paymentUrl);
          window.open(data.paymentUrl, '_blank', 'noopener,noreferrer');
          setActiveStep('waiting');
          setIsSubmitting(false);
          return;
        } else {
          addNotification(data.error || t('order.orderError'), 'error');
          setIsSubmitting(false);
          return;
        }
      }

      // Antilopay — создаём заказ, затем редиректим на платёжную страницу
      if (paymentMethod === 'antilopay') {
        const orderResponse = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: product.id,
            variantId: variant.id,
            email,
            referralCode,
            paymentMethod: 'antilopay',
            userId: null,
            currency: 'rub',
            quantity,
            orderId: null,
            language: lang,
            couponCode: couponValid ? couponCode : null
          })
        });
        const orderData = await orderResponse.json();
        if (!orderData.success) {
          addNotification(orderData.error || t('order.orderError'), 'error');
          setIsSubmitting(false);
          return;
        }
        const finalOrderId = orderData.order.id;
        setOrder(orderData.order);

        const payResponse = await fetch('/api/payments/antilopay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: finalOrderId,
            amount: total,
            productName: displayProduct.name,
            email,
            successUrl: `${window.location.origin}/payment/success?orderId=${finalOrderId}`,
            failUrl: `${window.location.origin}/payment/fail?orderId=${finalOrderId}`
          })
        });
        const payData = await payResponse.json();
        if (payData.success) {
          window.location.href = payData.paymentUrl;
        } else {
          addNotification(payData.error || t('order.orderError'), 'error');
          setIsSubmitting(false);
        }
        return;
      }

      // Stripe — создаём заказ, затем редиректим на Stripe Checkout
      if (paymentMethod === 'stripe') {
        const orderResponse = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: product.id,
            variantId: variant.id,
            email,
            referralCode,
            paymentMethod: 'stripe',
            userId: null,
            currency: 'usd',
            quantity,
            orderId: null,
            language: lang,
            couponCode: couponValid ? couponCode : null
          })
        });
        const orderData = await orderResponse.json();
        if (!orderData.success) {
          addNotification(orderData.error || t('order.orderError'), 'error');
          setIsSubmitting(false);
          return;
        }
        const finalOrderId = orderData.order.id;
        setOrder(orderData.order);

        const payResponse = await fetch('/api/payments/stripe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: finalOrderId,
            amountUsd: parseFloat(variant?.priceUsd || order?.totalUsd || 0) * quantity,
            productName: displayProduct.name,
            email
          })
        });
        const payData = await payResponse.json();
        if (payData.success) {
          // Редиректим на страницу оплаты Stripe
          router.push(`/payment/stripe?clientSecret=${payData.clientSecret}&orderId=${finalOrderId}`);
        } else {
          addNotification(payData.error || t('order.orderError'), 'error');
          setIsSubmitting(false);
        }
        return;
      }

      // Pally — создаём заказ, затем редиректим на Pally
      if (paymentMethod === 'pally') {
        const orderResponse = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: product.id,
            variantId: variant.id,
            email,
            referralCode,
            paymentMethod: 'pally',
            userId: null,
            currency: 'rub',
            quantity,
            orderId: null,
            language: lang,
            couponCode: couponValid ? couponCode : null
          })
        });
        const orderData = await orderResponse.json();
        if (!orderData.success) {
          addNotification(orderData.error || t('order.orderError'), 'error');
          setIsSubmitting(false);
          return;
        }
        const finalOrderId = orderData.order.id;
        setOrder(orderData.order);

        const payResponse = await fetch('/api/payments/pally', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: finalOrderId,
            amount: total,
            currency: 'RUB',
            productName: displayProduct.name,
            email
          })
        });
        const payData = await payResponse.json();
        if (payData.success) {
          window.location.href = payData.paymentUrl;
        } else {
          addNotification(payData.error || t('order.orderError'), 'error');
          setIsSubmitting(false);
        }
        return;
      }

      // Для остальных методов оплаты используем стандартный API
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: product.id,
          variantId: variant.id,
          email,
          referralCode,
          paymentMethod,
          userId: (paymentMethod === 'balance' || paymentMethod === 'balanceRub' || paymentMethod === 'balanceUsd') ? userId : null,
          currency: paymentCurrency,
          quantity: quantity,
          orderId: (paymentMethod === 'balance' || paymentMethod === 'balanceRub' || paymentMethod === 'balanceUsd') ? orderId : null,
          language: lang,
          couponCode: couponValid ? couponCode : null
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setOrder(data.order);
        setActiveStep('success');
        addNotification(t('order.paymentSuccess'), 'success');
      } else {
        if (data.error === 'Insufficient balance') {
          addNotification(t('order.insufficientBalance'), 'error');
        } else {
          addNotification(data.error || t('order.orderError'), 'error');
        }
      }
    } catch (error) {
      console.error('Error creating order:', error);
      addNotification(t('order.orderError'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const subtotal = displayProduct.price * quantity;
  const feeData = feeCalculation ? (displayCurrency === 'rub' ? feeCalculation.rub : feeCalculation.usd) : null;
  const paymentFee = feeData ? feeData.totalFee : 0;
  const discountAmount = couponValid ? (subtotal * couponDiscount) / 100 : 0;
  const total = subtotal + paymentFee - discountAmount;

  const selectedPaymentMethod = paymentMethods[paymentMethod];
  
  // Проверяем, является ли выбранный метод оплаты тем, для которого требуется ручная оплата
  const isPaymentDisabled = paymentMethod === 'paysafecard' || paymentMethod === 'rewarble' || paymentMethod === 'paypal' || paymentMethod === 'paypalff';

  return (
    <>
      <Header />
      
      <div
        className="absolute top-0 left-0 w-full h-full bg-cover bg-top bg-no-repeat pointer-events-none z-0"
        style={{ backgroundImage: 'url(/images/backgrounds/grid.png)' }}
      />
      
      <div className="min-h-screen pt-20 relative z-10">
        <div className="w-full px-4 sm:px-8 lg:px-24 py-8 max-w-6xl mx-auto">
          {/* Навигация */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm font-medium">{t('common.back')}</span>
            </button>
            {/* ID заказа с возможностью копирования */}
            {order && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">{order.id}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(order.id);
                    addNotification(t('order.orderIdCopied'), 'success');
                  }}
                  className="text-gray-400 hover:text-cyan-300 transition-colors cursor-pointer"
                  title={t('order.copyOrderId')}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                </button>
              </div>
            )}
          </div>

          {activeStep === 'payment' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              {/* Левая колонка - Форма */}
              <div className="space-y-6">
                {/* Email */}
                <div className="bg-white/5 rounded-xl p-6 backdrop-blur-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <Mail className="w-5 h-5 text-cyan-400" />
                    <h2 className="text-lg font-semibold text-white">
                      {t('order.deliveryByEmail')}
                    </h2>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {t('order.email')}
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t('order.enterYourEmail')}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 transition-colors"
                        required
                      />
                    </div>
                    <p className="text-sm text-gray-400">
                      * {t('order.emailDescription')}
                    </p>
                  </div>
                </div>

                {/* Код купона */}
                <div className="bg-white/5 rounded-xl p-6 backdrop-blur-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <Gift className="w-5 h-5 text-cyan-400" />
                    <h2 className="text-lg font-semibold text-white">
                      {t('order.couponCode')}
                    </h2>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {t('order.couponCode')}
                      </label>
                      <input
                        type="text"
                        value={couponCode}
                        onChange={handleCouponCodeChange}
                        placeholder={t('order.enterCouponCode')}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 transition-colors"
                      />
                    </div>
                    {couponValid === true && (
                      <div className="mt-4 p-3 bg-green-500/20 rounded-lg text-green-400 text-sm">
                        {t('order.couponApplied', { discount: couponDiscount })}
                      </div>
                    )}
                    {couponValid === false && (
                      <div className="mt-4 p-3 bg-red-500/20 rounded-lg text-red-400 text-sm">
                        {t('order.couponInvalid')}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Правая колонка - Краткое описание */}
              <div className="space-y-6">
                <div className="bg-white/5 rounded-xl p-6 backdrop-blur-lg">
                  <h2 className="text-lg font-semibold text-white mb-6">
                    {t('order.orderSummary')}
                  </h2>

                  <div className="space-y-6">
                    {/* Товар */}
                    <div className="flex items-start gap-4 pb-6 border-b border-white/10">
                      <div className="w-16 h-16 rounded-lg bg-white/10 overflow-hidden flex-shrink-0">
                        <img
                          src={getMediaUrl(displayProduct.image)}
                          alt={displayProduct.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium truncate">
                          {displayProduct.name}
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">
                          {displayProduct.variant}
                        </p>
                        <p className="text-cyan-400 font-bold mt-2">
                          {formatPrice(displayProduct.price, displayCurrency)}
                        </p>
                      </div>
                    </div>

                    {/* Количество */}
                    <div className="pb-6 border-b border-white/10">
                      <label className="block text-sm font-medium text-gray-300 mb-3">
                        {t('order.quantity')}:
                      </label>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-lg text-white hover:bg-white/20 transition-colors cursor-pointer"
                        >
                          -
                        </button>
                        <span className="text-white font-medium min-w-8 text-center">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQuantity(quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center bg-white/10 rounded-lg text-white hover:bg-white/20 transition-colors cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Способ оплаты */}
                    <div className="pb-6 border-b border-white/10">
                      <label className="block text-sm font-medium text-gray-300 mb-3">
                        {t('order.paymentMethod')}
                      </label>
                      <button
                        onClick={() => setShowPaymentModal(true)}
                        className="w-full flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 hover:border-cyan-400/50 transition-all duration-200 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                            <img
                              src={selectedPaymentMethod?.icon}
                              alt={selectedPaymentMethod?.name}
                              className="w-6 h-6 object-contain"
                            />
                          </div>
                          <div className="text-left">
                            <div className="text-white font-medium">
                              {t(selectedPaymentMethod?.nameKey)}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {t(selectedPaymentMethod?.descriptionKey)}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </button>
                      
                    </div>

                    {/* Итоговая сумма */}
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">{t('order.subtotal')}</span>
                        <span className="text-white">
                          {formatPrice(subtotal, displayCurrency)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">{t('order.paymentMethodFee')}</span>
                        <span className="text-white">
                          {formatPrice(paymentFee, displayCurrency)}
                        </span>
                      </div>
                      {couponValid && (
                        <div className="flex justify-between">
                          <span className="text-green-400">{t('order.discount')}</span>
                          <span className="text-green-400">
                            -{formatPrice(discountAmount, displayCurrency)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between pt-3 border-t border-white/10">
                        <span className="text-lg font-semibold text-white">{t('order.total')}</span>
                        <span className="text-xl font-bold text-cyan-400">
                          {formatPrice(total, displayCurrency)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Кнопка оплаты */}
                  <button
                    onClick={isPaymentDisabled ? () => {
                      setSelectedInstructionMethod(selectedPaymentMethod);
                      setShowInstructionModal(true);
                    } : handleSubmit}
                    disabled={isSubmitting}
                    className={`w-full mt-8 py-4 rounded-xl font-semibold transition-all duration-300 ${
                      isSubmitting
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : isPaymentDisabled
                        ? 'bg-orange-500 text-white hover:bg-orange-600 cursor-pointer'
                        : 'bg-cyan-400 text-[#171717] hover:bg-cyan-300 cursor-pointer'
                    }`}
                  >
                    {isSubmitting 
                      ? t('order.processing') 
                      : isPaymentDisabled 
                      ? t('order.viewInstructions')
                      : `${t('order.payNow')} ${formatPrice(total, displayCurrency)}`
                    }
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeStep === 'waiting' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-lg mx-auto text-center"
            >
              <div className="bg-white/5 rounded-2xl p-8 backdrop-blur-lg">
                {/* Анимация ожидания */}
                <div className="w-20 h-20 mx-auto mb-6 relative flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full border-4 border-cyan-400/20"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-t-cyan-400 animate-spin"></div>
                  <svg className="w-8 h-8 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>

                <h2 className="text-2xl font-bold text-white mb-3">
                  {t('order.waitingForPayment')}
                </h2>
                <p className="text-gray-400 mb-2 text-sm">
                  {t('order.waitingForPaymentDescription')}
                </p>
                <p className="text-cyan-400 text-xs mb-8 animate-pulse">
                  {t('order.checkingPayment')}
                </p>

                {/* Инфо о заказе */}
                <div className="bg-white/5 rounded-xl p-4 mb-6 text-left space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">{t('order.orderNumber')}</span>
                    <span className="text-white font-mono">#{order?.id}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">{t('order.total')}</span>
                    <span className="text-cyan-400 font-bold">{formatPrice(total, displayCurrency)}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => window.open(cryptoPaymentUrl, '_blank', 'noopener,noreferrer')}
                    className="w-full py-3 bg-cyan-400 text-[#171717] rounded-xl font-semibold hover:bg-cyan-300 transition-colors cursor-pointer"
                  >
                    {t('order.openPaymentWindow')}
                  </button>
                  <button
                    onClick={() => setActiveStep('payment')}
                    className="w-full py-3 border border-white/20 text-gray-400 rounded-xl font-semibold hover:border-white/40 hover:text-white transition-colors cursor-pointer"
                  >
                    {t('order.cancelPayment')}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeStep === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-lg mx-auto text-center"
            >
              <div className="bg-white/5 rounded-2xl p-8 backdrop-blur-lg">
                <div className="w-20 h-20 bg-cyan-400/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="w-10 h-10 text-cyan-400" />
                </div>
                
                <h2 className="text-2xl font-bold text-white mb-4">
                  {t('order.paymentSuccessful')}!
                </h2>
                
                <p className="text-gray-300 mb-8">
                  {t('order.paymentSuccessDescription')}
                </p>

                <div className="space-y-4">
                  <div className="bg-white/5 rounded-lg p-4 text-left">
                    <div className="text-sm text-gray-400 mb-1">
                      {t('order.orderNumber')}
                    </div>
                    <div className="text-white font-mono">
                      #{order.id}
                    </div>
                  </div>
 
                  <div className="bg-white/5 rounded-lg p-4 text-left">
                    <div className="text-sm text-gray-400 mb-1">
                      {t('order.email')}
                    </div>
                    <div className="text-white">
                      {email}
                    </div>
                  </div>
                </div>
 
                <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => router.push('/profile')}
                    className="px-6 py-3 border border-cyan-400 text-cyan-400 rounded-lg font-semibold hover:bg-cyan-400/10 transition-colors cursor-pointer"
                  >
                    {t('order.goToProfile')}
                  </button>
                  <button
                    onClick={() => router.push(`/product/${product.slug}`)}
                    className="px-6 py-3 border border-cyan-400 text-cyan-400 rounded-lg font-semibold hover:bg-cyan-400/10 transition-colors cursor-pointer"
                  >
                    {t('order.backToProduct')}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Модальное окно выбора способа оплаты */}
      <AnimatePresence>
        {showPaymentModal && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPaymentModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50"
            >
              <div className="bg-[#1a1a1a] rounded-2xl border border-white/10 p-6 mx-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-white" />
                    <h3 className="text-lg font-semibold text-white">
                      {t('order.selectPaymentMethod')}
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowPaymentModal(false)}
                    className="text-white/50 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Payment Methods */}
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent scrollbar-thumb-rounded-full scrollbar-track-rounded-full hover:scrollbar-thumb-white/30">
                  {sortedPaymentMethods.map((method) => {
                    const isInstructionOnly = method.id === 'paysafecard' || method.id === 'paypalff';
                    
                    return (
                      <button
                        key={method.id}
                        onClick={() => {
                          if (isInstructionOnly) {
                            setSelectedInstructionMethod(method);
                            setShowInstructionModal(true);
                          } else {
                            setPaymentMethod(method.id);
                            setShowPaymentModal(false);
                            
                            // Показываем модальное окно с инструкцией для REWARBLE и PAYPAL
                            if (method.id === 'rewarble' || method.id === 'paypal') {
                              setSelectedInstructionMethod(method);
                              setShowInstructionModal(true);
                            }
                          }
                        }}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                          paymentMethod === method.id
                            ? 'border-white/20 bg-white/5'
                            : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                        }`}
                      >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          paymentMethod === method.id
                            ? 'bg-white/20'  // Белый фон для активного
                            : 'bg-white/5'
                        }`}>
                          <img
                            src={method.icon}
                            alt={method.name}
                            className={`w-6 h-6 object-contain ${
                              paymentMethod === method.id ? 'filter brightness-100' : ''
                            }`}
                          />
                        </div>
                        <div className="text-left">
                          <div className={`font-medium text-sm ${
                            paymentMethod === method.id ? 'text-white' : 'text-white'
                          }`}>
                            {t(method.nameKey)}
                          </div>
                          <div className={`text-xs mt-1 ${
                            paymentMethod === method.id ? 'text-white/80' : 'text-gray-400'
                          }`}>
                            {t(method.descriptionKey)}
                          </div>
                        </div>
                      </div>
                      {paymentMethod === method.id && (
                        <Check className="w-5 h-5 text-white" />  // Белая галочка
                      )}
                    </button>
                  );
                  })}
                </div>

                {/* Selected Method Info */}
                {selectedPaymentMethod && (
                  <div className="mt-6 p-4 bg-white/5 rounded-xl">
                    <p className="text-sm text-gray-300">
                      {t('order.selectedPaymentMethod')}:{' '}
                      <span className="text-white font-medium">  {/* Белый текст */}
                        {t(selectedPaymentMethod.nameKey)}
                      </span>
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {t(selectedPaymentMethod.descriptionKey)}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Модальное окно с инструкцией по оплате */}
      <AnimatePresence>
        {showInstructionModal && selectedInstructionMethod && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInstructionModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50"
            >
              <div className="bg-[#1a1a1a] rounded-2xl border border-white/10 p-6 mx-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-white" />
                    <h3 className="text-lg font-semibold text-white">
                      {t('order.paymentInstructions')}
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowInstructionModal(false)}
                    className="text-white/50 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Instruction Content */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl">
                    <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                      <img
                        src={selectedInstructionMethod.icon}
                        alt={selectedInstructionMethod.name}
                        className="w-6 h-6 object-contain"
                      />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-white">
                        {t(selectedInstructionMethod.nameKey)}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {t(selectedInstructionMethod.descriptionKey)}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-white/5 rounded-xl">
                    <h4 className="text-white font-medium mb-3">
                      {t('order.contactSupportTitle')}
                    </h4>
                    <p className="text-sm text-gray-300 mb-4">
                      {t('order.contactSupportDescription', {
                        method: t(selectedInstructionMethod.nameKey)
                      })}
                    </p>
                    
                    {/* Discord и Telegram кнопки */}
                    <div className="space-y-3">
                      <a
                        href="https://discord.gg/atomcheats"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-[#5865F2] rounded-lg hover:bg-[#4752C4] transition-colors cursor-pointer"
                      >
                        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                        </svg>
                        <div className="text-left">
                          <div className="text-white font-medium text-sm">Discord</div>
                          <div className="text-white/70 text-xs">{t('order.contactViaDiscord')}</div>
                        </div>
                      </a>
                      
                      <a
                        href="https://t.me/atomcheats_support"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 bg-[#0088cc] rounded-lg hover:bg-[#006ba6] transition-colors cursor-pointer"
                      >
                        <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12a12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472c-.18 1.898-.962 6.502-1.36 8.627c-.168.9-.499 1.201-.82 1.23c-.696.065-1.225-.46-1.9-.902c-1.056-.693-1.653-1.124-2.678-1.8c-1.185-.78-.417-1.21.258-1.91c.177-.184 3.247-2.977 3.307-3.23c.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345c-.48.33-.913.49-1.302.48c-.428-.008-1.252-.241-1.865-.44c-.752-.245-1.349-.374-1.297-.789c.027-.216.325-.437.893-.663c3.498-1.524 5.83-2.529 6.998-3.014c3.332-1.386 4.025-1.627 4.476-1.635z"/>
                        </svg>
                        <div className="text-left">
                          <div className="text-white font-medium text-sm">Telegram</div>
                          <div className="text-white/70 text-xs">{t('order.contactViaTelegram')}</div>
                        </div>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Footer />
    </>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <OrderContent />
    </Suspense>
  );
}