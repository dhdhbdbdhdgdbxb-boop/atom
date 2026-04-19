'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import Header from '@/components/Header';
import { useLanguage } from '@/i18n/LanguageContext';

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { language } = useLanguage();
  const orderId = searchParams.get('orderId');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const lang = mounted ? language : 'en';

  return (
    <div className="max-w-lg mx-auto text-center px-4">
      <div className="bg-white/5 rounded-2xl p-8 backdrop-blur-lg border border-white/10">
        <div className="w-20 h-20 bg-cyan-400/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Check className="w-10 h-10 text-cyan-400" />
        </div>

        <h2 className="text-2xl font-bold text-white mb-4">
          {language === 'ru' ? 'Оплата прошла успешно!' : 'Payment Successful!'}
        </h2>

        <p className="text-gray-300 mb-6">
          {language === 'ru'
            ? 'Ваш заказ обрабатывается. Ключи будут отправлены на вашу почту.'
            : 'Your order is being processed. Keys will be sent to your email.'}
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
          <button
            onClick={() => router.push('/profile')}
            className="flex-1 px-6 py-3 bg-cyan-400 text-[#171717] rounded-lg font-semibold hover:bg-cyan-300 transition-colors cursor-pointer"
          >
            {language === 'ru' ? 'Мой профиль' : 'My Profile'}
          </button>
          <button
            onClick={() => router.push('/catalog')}
            className="flex-1 px-6 py-3 border border-cyan-400 text-cyan-400 rounded-lg font-semibold hover:bg-cyan-400/10 transition-colors cursor-pointer"
          >
            {language === 'ru' ? 'В каталог' : 'Catalog'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <>
      <Header />
      <div
        className="fixed inset-0 bg-cover bg-top bg-no-repeat pointer-events-none z-0"
        style={{ backgroundImage: 'url(/images/backgrounds/grid.png)' }}
      />
      <div className="min-h-screen pt-20 relative z-10 flex items-center justify-center">
        <Suspense fallback={<div className="text-white">Loading...</div>}>
          <SuccessContent />
        </Suspense>
      </div>
    </>
  );
}
