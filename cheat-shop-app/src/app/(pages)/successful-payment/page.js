'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Check, ArrowRight } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLanguage } from '@/i18n/LanguageContext';

function SuccessfulPaymentContent() {
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
            {/* Success Icon */}
            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-green-400" />
            </div>
            
            {/* Title */}
            <h1 className="text-3xl font-bold text-white text-center mb-4">
              {t('order.paymentSuccessful')}!
            </h1>
            
            {/* Description */}
            <p className="text-gray-300 text-center mb-8">
              {t('order.paymentSuccessDescription')}
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

                {orderDetails.email && (
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">
                      {t('order.email')}
                    </div>
                    <div className="text-white">
                      {orderDetails.email}
                    </div>
                  </div>
                )}

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

            {/* Info Message */}
            <div className="bg-cyan-400/10 border border-cyan-400/20 rounded-lg p-4 mb-8">
              <p className="text-cyan-400 text-sm text-center">
                {t('order.checkEmailForDetails')}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => router.push('/profile')}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-cyan-400 text-[#171717] rounded-lg font-semibold hover:bg-cyan-300 transition-colors cursor-pointer"
              >
                {t('order.goToProfile')}
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => router.push('/catalog')}
                className="flex-1 px-6 py-3 border border-cyan-400 text-cyan-400 rounded-lg font-semibold hover:bg-cyan-400/10 transition-colors cursor-pointer"
              >
                {t('common.backToCatalog')}
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      <Footer />
    </>
  );
}

export default function SuccessfulPaymentPage() {
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
      <SuccessfulPaymentContent />
    </Suspense>
  );
}
