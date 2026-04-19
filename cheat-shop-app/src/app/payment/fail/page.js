'use client';

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { X } from 'lucide-react';
import Header from '@/components/Header';
import { useLanguage } from '@/i18n/LanguageContext';

function FailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { language } = useLanguage();
  const orderId = searchParams.get('orderId');

  return (
    <div className="max-w-lg mx-auto text-center px-4">
      <div className="bg-white/5 rounded-2xl p-8 backdrop-blur-lg border border-white/10">
        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <X className="w-10 h-10 text-red-400" />
        </div>

        <h2 className="text-2xl font-bold text-white mb-4">
          {language === 'ru' ? 'Оплата не прошла' : 'Payment Failed'}
        </h2>

        <p className="text-gray-300 mb-6">
          {language === 'ru'
            ? 'Что-то пошло не так. Попробуйте ещё раз или выберите другой способ оплаты.'
            : 'Something went wrong. Please try again or choose a different payment method.'}
        </p>

        {orderId && (
          <div className="bg-white/5 rounded-lg p-4 mb-6 text-left">
            <div className="text-sm text-gray-400 mb-1">
              {language === 'ru' ? 'Номер заказа' : 'Order ID'}
            </div>
            <div className="text-white font-mono text-sm break-all">#{orderId}</div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {orderId && (
            <button
              onClick={() => router.push(`/order?orderId=${orderId}`)}
              className="flex-1 px-6 py-3 bg-cyan-400 text-[#171717] rounded-lg font-semibold hover:bg-cyan-300 transition-colors cursor-pointer"
            >
              {language === 'ru' ? 'Попробовать снова' : 'Try Again'}
            </button>
          )}
          <button
            onClick={() => router.push('/catalog')}
            className="flex-1 px-6 py-3 border border-white/20 text-white rounded-lg font-semibold hover:bg-white/5 transition-colors cursor-pointer"
          >
            {language === 'ru' ? 'В каталог' : 'Catalog'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <>
      <Header />
      <div
        className="fixed inset-0 bg-cover bg-top bg-no-repeat pointer-events-none z-0"
        style={{ backgroundImage: 'url(/images/backgrounds/grid.png)' }}
      />
      <div className="min-h-screen pt-20 relative z-10 flex items-center justify-center">
        <Suspense fallback={<div className="text-white">Loading...</div>}>
          <FailContent />
        </Suspense>
      </div>
    </>
  );
}
