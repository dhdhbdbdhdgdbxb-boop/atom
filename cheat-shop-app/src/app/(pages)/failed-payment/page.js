'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { X, ArrowLeft, RefreshCw } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLanguage } from '@/i18n/LanguageContext';

function FailedPaymentContent() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const orderId = searchParams.get('orderId');
    const invoiceId = searchParams.get('invoice_id');

    if (orderId) {
      // Получаем детали заказа
      fetch(`/api/orders/${orderId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setOrderDetails(data.order);
          }
        })
        .catch(error => {
          console.error('Error fetching order:', error);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  const handleRetry = () => {
    if (orderDetails) {
      router.push(`/order?orderId=${orderDetails.id}`);
    } else {
      router.push('/catalog');
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
      </>
    );
  }

  return (
    <>
      <Header />
      
      <div
        className="fixed inset-0 bg-cover bg-top bg-no-repeat pointer-events-none z-0"
        style={{ backgroundImage: 'url(/images/backgrounds/grid.png)' }}
      />
      
      <div className="min-h-screen pt-20 relative z-10 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full"
        >
          <div className="bg-white/5 rounded-2xl p-8 backdrop-blur-lg border border-white/10">
            {/* Error Icon */}
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <X className="w-10 h-10 text-red-400" />
            </div>
            
            {/* Title */}
            <h1 className="text-3xl font-bold text-white text-center mb-4">
              {t('order.paymentFailed')}
            </h1>
            
            {/* Description */}
            <p className="text-gray-300 text-center mb-8">
              {t('order.paymentFailedDescription')}
            </p>

            {/* Order Details */}
            {orderDetails && (
              <div className="space-y-4 mb-8">
                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">
                    {t('order.orderNumber')}
                  </div>
                  <div className="text-white font-mono text-lg">
                    #{orderDetails.id}
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-4">
                  <div className="text-sm text-gray-400 mb-1">
                    {t('order.amount')}
                  </div>
                  <div className="text-white text-lg font-semibold">
                    {orderDetails.totalAmount} {orderDetails.currency?.toUpperCase()}
                  </div>
                </div>
              </div>
            )}

            {/* Error Reasons */}
            <div className="bg-red-400/10 border border-red-400/20 rounded-lg p-4 mb-8">
              <h3 className="text-red-400 font-semibold mb-2">
                {t('order.possibleReasons')}:
              </h3>
              <ul className="text-sm text-gray-300 space-y-1 list-disc list-inside">
                <li>{t('order.insufficientFunds')}</li>
                <li>{t('order.paymentCancelled')}</li>
                <li>{t('order.technicalError')}</li>
                <li>{t('order.timeoutExpired')}</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleRetry}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-cyan-400 text-[#171717] rounded-lg font-semibold hover:bg-cyan-300 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                {t('order.tryAgain')}
              </button>
              <button
                onClick={() => router.push('/catalog')}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border border-cyan-400 text-cyan-400 rounded-lg font-semibold hover:bg-cyan-400/10 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                {t('common.backToCatalog')}
              </button>
            </div>

            {/* Support Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-400">
                {t('order.needHelp')}{' '}
                <a
                  href="/faq"
                  className="text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  {t('order.contactSupport')}
                </a>
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <Footer />
    </>
  );
}

export default function FailedPaymentPage() {
  return (
    <Suspense fallback={
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
    }>
      <FailedPaymentContent />
    </Suspense>
  );
}
