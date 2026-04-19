'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CreditCard, AlertCircle, Loader2, ChevronRight, Check, Shield, X, DollarSign } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useNotification } from '@/components/NotificationComponent';
import { useLanguage } from '@/i18n/LanguageContext';


export default function DepositPage() {
  const router = useRouter();
  const { addNotification } = useNotification();
  const { t, language: lang, loading: langLoading } = useLanguage();
  const [activeStep, setActiveStep] = useState('deposit');
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [userId, setUserId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Функция для получения локализованного контента
  const getLocalizedContent = useCallback(() => {
    return {
      title: t('deposit.title', 'Balance Top-up'),
      amountLabel: t('deposit.amountLabel', 'Top-up Amount'),
      methodLabel: t('deposit.methodLabel', 'Payment Method'),
      terms: t('deposit.terms', 'I agree to the terms'),
      payButton: t('deposit.payButton', 'Pay'),
      securityInfo: t('deposit.securityInfo', 'Secure payment'),
      processing: t('deposit.processing', 'Processing...'),
      
      // Success step
      successTitle: t('deposit.success.title', 'Balance topped up successfully!'),
      successMessage: t('deposit.success.message', 'Your balance has been credited with'),
      successNewDeposit: t('deposit.success.newDeposit', 'Top-up again'),
      successToCatalog: t('deposit.success.toCatalog', 'To catalog'),
      
      // Payment methods
      debugUsd: t('deposit.debugUsd', 'DEBUG USD'),
      debugRub: t('deposit.debugRub', 'DEBUG RUB'),
      cryptoUsd: t('deposit.cryptoUsd', 'CryptoCloud (USD)'),
      
      // Errors
      paymentError: t('deposit.errors.paymentFailed', 'Failed to update balance'),
      paymentSuccess: t('deposit.success.message', 'Your balance has been credited with'),
      
      // Common
      back: t('common.back', 'Back')
    };
  }, [t]);

  // Получаем данные пользователя при загрузке страницы
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userResponse = await fetch('/api/users/profile');
        const userData = await userResponse.json();
        
        if (userData.success && userData.user) {
          setUserId(userData.user.id);
        }
      } catch (userError) {
        console.log('User not authenticated');
      }
    };

    fetchUserData();
  }, []);

  // Используем useMemo для мемоизации массива методов оплаты с локализацией
  const PAYMENT_METHODS = useMemo(() => {
    // Все методы оплаты отключены, кроме баланса (но баланс недоступен на странице пополнения)
    return [
      { 
        id: 'debug_usd', 
        name: t('deposit.debugUsd', 'DEBUG USD'),
        nameKey: 'deposit.debugUsd',
        descriptionKey: 'deposit.debugUsdDesc',
        currency: 'USD', 
        minAmount: 1, 
        maxAmount: 1000,
        icon: '/images/payment-icons/cards.svg',
        enabled: false // ОТКЛЮЧЕН
      },
      { 
        id: 'debug_rub', 
        name: t('deposit.debugRub', 'DEBUG RUB'),
        nameKey: 'deposit.debugRub', 
        descriptionKey: 'deposit.debugRubDesc',
        currency: 'RUB', 
        minAmount: 50, 
        maxAmount: 50000,
        icon: '/images/payment-icons/ru_cards.svg',
        enabled: false // ОТКЛЮЧЕН
      },
      { 
        id: 'crypto_usd', 
        name: t('deposit.cryptoUsd', 'CryptoCloud (USD)'),
        nameKey: 'deposit.cryptoUsd',
        descriptionKey: 'deposit.cryptoUsdDesc',
        currency: 'USD', 
        minAmount: 5, 
        maxAmount: 5000,
        icon: '/images/payment-icons/crypto.svg',
        enabled: true // ВКЛЮЧЕН
      }
    ];
  }, [t]);

  // Инициализируем выбранный метод при первом рендере
  useEffect(() => {
    if (!selectedMethod && PAYMENT_METHODS.length > 0) {
      // Устанавливаем первый метод по умолчанию (все отключены)
      setSelectedMethod(PAYMENT_METHODS[0]);
    }
  }, [PAYMENT_METHODS, selectedMethod, lang]);

  // VALIDATION FUNCTION
  const validateAmount = useCallback((amount, method) => {
    if (!amount) return { isValid: false, error: t('deposit.validation.required', 'Enter amount') };

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) return { isValid: false, error: t('deposit.validation.invalidNumber', 'Enter valid number') };
    if (numericAmount <= 0) return { isValid: false, error: t('deposit.validation.positive', 'Amount must be greater than 0') };

    const decimalPart = amount.split('.')[1];
    if (decimalPart && decimalPart.length > 2)
      return { isValid: false, error: t('deposit.validation.decimalPlaces', 'No more than 2 decimal places') };

    if (numericAmount < method.minAmount)
      return {
        isValid: false,
        error: t('deposit.validation.minAmount', 'Minimum amount: {{amount}} {{currency}}', { amount: method.minAmount, currency: method.currency })
      };

    if (numericAmount > method.maxAmount)
      return {
        isValid: false,
        error: t('deposit.validation.maxAmount', 'Maximum amount: {{amount}} {{currency}}', { amount: method.maxAmount, currency: method.currency })
      };

    return { isValid: true, error: '' };
  }, [t]);

  // Функция для форматирования цены
  function formatPrice(price, currency) {
    const formattedPrice = parseFloat(price).toFixed(2);
    return currency === 'RUB' ? `${formattedPrice}₽` : `$${formattedPrice}`;
  }

  // PAYMENT HANDLER
  const handlePayment = async () => {
    // Проверяем, что метод оплаты включен
    if (!selectedMethod.enabled) {
      addNotification(t('deposit.paymentMethodDisabled', 'This payment method is currently disabled'), 'error');
      return;
    }

    // Валидация суммы
    const validation = validateAmount(amount, selectedMethod);
    if (!validation.isValid) {
      setValidationError(validation.error);
      return;
    }

    setIsSubmitting(true);
    setLoading(true);

    try {
      // Для CryptoCloud используем отдельный API endpoint
      if (selectedMethod.id === 'crypto_usd') {
        const userResponse = await fetch('/api/users/profile');
        const userData = await userResponse.json();
        
        if (!userData.success || !userData.user) {
          addNotification(t('deposit.errors.notAuthenticated', 'Please log in to continue'), 'error');
          setLoading(false);
          setIsSubmitting(false);
          return;
        }

        const response = await fetch('/api/payments/cryptocloud', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: parseFloat(amount),
            currency: selectedMethod.currency,
            email: userData.user.email,
            description: `Balance deposit: ${amount} ${selectedMethod.currency}`,
            type: 'deposit'
          })
        });
        
        const data = await response.json();
        
        if (data.success) {
          // Перенаправляем на страницу оплаты CryptoCloud
          window.location.href = data.paymentUrl;
          return;
        } else {
          addNotification(data.error || t('deposit.errors.paymentFailed', 'Failed to create payment'), 'error');
        }
      } else {
        // Для других методов (отключены)
        addNotification(t('deposit.paymentMethodsDisabled', 'This payment method is currently disabled'), 'error');
      }
    } catch (error) {
      console.error('Payment error:', error);
      addNotification(t('deposit.errors.paymentFailed', 'Failed to process payment'), 'error');
    } finally {
      setLoading(false);
      setIsSubmitting(false);
    }
  };

  if (langLoading) {
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

  const currentContent = getLocalizedContent();

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
              <span className="text-sm font-medium">{t('common.back', 'Back')}</span>
            </button>
            
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-400" />
              <span className="text-green-300 text-sm">
                {t('deposit.securityInfo', 'Secure payment')}
              </span>
            </div>
          </div>

          {activeStep === 'deposit' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              {/* Левая колонка - Форма */}
              <div className="space-y-6">
                {/* Сумма пополнения */}
                <div className="bg-white/5 rounded-xl p-6 backdrop-blur-lg">
                  <div className="flex items-center gap-3 mb-4">
                    <DollarSign className="w-5 h-5 text-cyan-400" />
                    <h2 className="text-lg font-semibold text-white">
                      {t('deposit.amountLabel', 'Top-up Amount')}
                    </h2>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        {t('deposit.amountLabel', 'Top-up Amount')} ({selectedMethod?.currency === 'USD' ? '$' : '₽'})
                      </label>
                      <input
                        type="text"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder={`0.00 ${selectedMethod?.currency === 'USD' ? '$' : '₽'}`}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 transition-colors"
                        required
                      />
                      <AnimatePresence>
                        {validationError && (
                          <motion.div
                            className="text-red-400 text-sm mt-2 flex items-center gap-2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                          >
                            <AlertCircle className="w-4 h-4" />
                            <span>{validationError}</span>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <p className="text-sm text-gray-400">
                      * {t('deposit.amountDescription', 'Enter the amount you want to add to your balance')}
                    </p>
                  </div>
                </div>

                {/* Согласие с условиями */}
                <div className="bg-white/5 rounded-xl p-6 backdrop-blur-lg">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="agreeToTerms"
                      checked={agreeToTerms}
                      onChange={(e) => setAgreeToTerms(e.target.checked)}
                      className="w-4 h-4 text-cyan-400 bg-white/10 border-white/20 rounded focus:ring-cyan-400 focus:ring-2"
                    />
                    <label htmlFor="agreeToTerms" className="text-sm text-gray-300 cursor-pointer">
                      {t('deposit.terms', 'I agree to the terms and conditions')}
                    </label>
                  </div>
                </div>
              </div>

              {/* Правая колонка - Краткое описание */}
              <div className="space-y-6">
                <div className="bg-white/5 rounded-xl p-6 backdrop-blur-lg">
                  <h2 className="text-lg font-semibold text-white mb-6">
                    {t('deposit.depositSummary', 'Deposit Summary')}
                  </h2>

                  <div className="space-y-6">
                    {/* Способ оплаты */}
                    <div className="pb-6 border-b border-white/10">
                      <label className="block text-sm font-medium text-gray-300 mb-3">
                        {t('deposit.methodLabel', 'Payment Method')}
                      </label>
                      <button
                        onClick={() => setShowPaymentModal(true)}
                        className="w-full flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 hover:border-cyan-400/50 transition-all duration-200 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                            <img
                              src={selectedMethod?.icon}
                              alt={selectedMethod?.name}
                              className="w-6 h-6 object-contain"
                            />
                          </div>
                          <div className="text-left">
                            <div className="text-white font-medium">
                              {selectedMethod?.nameKey ? t(selectedMethod.nameKey) : selectedMethod?.name || ''}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              {selectedMethod?.descriptionKey ? t(selectedMethod.descriptionKey) : ''}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </button>
                      
                      {/* Предупреждение о недоступных методах оплаты */}
                      <div className="mt-4 p-4 bg-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        <div>
                          <div className="font-medium">{t('deposit.allMethodsDisabled', 'All payment methods are currently disabled')}</div>
                          <div className="text-xs mt-1">{t('deposit.useBalanceForPurchases', 'Please use your account balance for purchases')}</div>
                        </div>
                      </div>
                    </div>

                    {/* Итоговая сумма */}
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">{t('deposit.amount', 'Amount')}</span>
                        <span className="text-white">
                          {amount ? formatPrice(amount, selectedMethod?.currency) : formatPrice(0, selectedMethod?.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">{t('deposit.paymentFee', 'Payment Fee')}</span>
                        <span className="text-white">
                          {formatPrice(0, selectedMethod?.currency)}
                        </span>
                      </div>
                      <div className="flex justify-between pt-3 border-t border-white/10">
                        <span className="text-lg font-semibold text-white">{t('deposit.total', 'Total')}</span>
                        <span className="text-xl font-bold text-cyan-400">
                          {amount ? formatPrice(amount, selectedMethod?.currency) : formatPrice(0, selectedMethod?.currency)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Кнопка пополнения */}
                  <button
                    onClick={handlePayment}
                    disabled={true} // Всегда отключена
                    className="w-full mt-8 py-4 rounded-xl font-semibold transition-all duration-300 bg-gray-600 text-gray-400 cursor-not-allowed"
                  >
                    {t('deposit.paymentMethodsDisabled', 'Payment methods disabled')}
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
                  {t('deposit.success.title', 'Balance topped up successfully!')}
                </h2>
                
                <p className="text-gray-300 mb-8">
                  {t('deposit.success.messageFull', 'Your balance has been credited with {{amount}} {{currency}}', {
                    amount: amount,
                    currency: selectedMethod?.currency || 'USD'
                  })}
                </p>

                <div className="space-y-4">
                  <div className="bg-white/5 rounded-lg p-4 text-left">
                    <div className="text-sm text-gray-400 mb-1">
                      {t('deposit.depositAmount', 'Deposit Amount')}
                    </div>
                    <div className="text-white font-mono">
                      {formatPrice(amount, selectedMethod?.currency)}
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4 text-left">
                    <div className="text-sm text-gray-400 mb-1">
                      {t('deposit.paymentMethod', 'Payment Method')}
                    </div>
                    <div className="text-white">
                      {selectedMethod?.nameKey ? t(selectedMethod.nameKey) : selectedMethod?.name || ''}
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => {
                      setActiveStep('deposit');
                      setAmount('');
                      setAgreeToTerms(false);
                    }}
                    className="flex-1 px-6 py-3 border border-cyan-400 text-cyan-400 rounded-lg font-semibold hover:bg-cyan-400/10 transition-colors cursor-pointer"
                  >
                    {t('deposit.success.newDeposit', 'Top-up again')}
                  </button>
                  <button
                    onClick={() => router.push('/catalog')}
                    className="flex-1 px-6 py-3 bg-cyan-400 text-[#171717] rounded-lg font-semibold hover:bg-cyan-300 transition-colors cursor-pointer"
                  >
                    {t('deposit.success.toCatalog', 'To catalog')}
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
                      {t('deposit.selectPaymentMethod', 'Select Payment Method')}
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
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {PAYMENT_METHODS.map((method) => (
                    <button
                      key={method.id}
                      onClick={() => {
                        addNotification(t('deposit.paymentMethodsDisabled', 'All payment methods are currently disabled'), 'error');
                      }}
                      disabled={true}
                      className="w-full flex items-center justify-between p-4 rounded-xl border border-red-500/30 bg-red-500/10 cursor-not-allowed opacity-60"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                          <img
                            src={method.icon}
                            alt={method.name}
                            className="w-6 h-6 object-contain filter grayscale opacity-50"
                          />
                        </div>
                        <div className="text-left">
                          <div className="font-medium text-sm text-red-400">
                            {method.nameKey ? t(method.nameKey) : method.name || ''}
                            <span className="ml-2 text-xs">({t('deposit.disabled', 'Disabled')})</span>
                          </div>
                          <div className="text-xs mt-1 text-red-400/70">
                            {t('deposit.paymentMethodDisabled', 'This payment method is currently disabled')}
                          </div>
                        </div>
                      </div>
                      <X className="w-5 h-5 text-red-400" />
                    </button>
                  ))}
                </div>

                {/* Selected Method Info */}
                {selectedMethod && (
                  <div className="mt-6 p-4 bg-white/5 rounded-xl">
                    <p className="text-sm text-gray-300">
                      {t('deposit.selectedPaymentMethod', 'Selected payment method')}:{' '}
                      <span className="text-white font-medium">
                        {selectedMethod?.nameKey ? t(selectedMethod.nameKey) : selectedMethod?.name || ''}
                      </span>
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {selectedMethod?.descriptionKey ? t(selectedMethod.descriptionKey) : ''}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Footer />
    </>
  );
}