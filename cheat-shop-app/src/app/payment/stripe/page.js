'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import Header from '@/components/Header';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

function CheckoutForm({ orderId }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsLoading(true);
    setErrorMessage('');

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment/success?orderId=${orderId}`
      }
    });

    if (error) {
      setErrorMessage(error.message || 'Payment failed');
      setIsLoading(false);
    }
    // При успехе Stripe сам редиректит на return_url
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement options={{ layout: 'tabs' }} />
      {errorMessage && (
        <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
          {errorMessage}
        </div>
      )}
      <button
        type="submit"
        disabled={!stripe || isLoading}
        className="w-full py-4 bg-cyan-400 text-[#171717] rounded-xl font-semibold hover:bg-cyan-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
}

function StripeCheckoutContent() {
  const searchParams = useSearchParams();
  const clientSecret = searchParams.get('clientSecret');
  const orderId = searchParams.get('orderId');
  const router = useRouter();

  if (!clientSecret || !orderId) {
    return (
      <div className="text-center text-white">
        <p>Invalid payment session.</p>
        <button onClick={() => router.push('/catalog')} className="mt-4 px-6 py-2 bg-cyan-400 text-black rounded-lg">
          Back to catalog
        </button>
      </div>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'night',
      variables: {
        colorPrimary: '#22d3ee',
        colorBackground: '#1c2539',
        colorText: '#ffffff',
        borderRadius: '12px'
      }
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white/5 rounded-2xl border border-white/10 p-8 backdrop-blur-lg">
        <h2 className="text-xl font-semibold text-white mb-6">Complete Payment</h2>
        <Elements stripe={stripePromise} options={options}>
          <CheckoutForm orderId={orderId} />
        </Elements>
      </div>
    </div>
  );
}

export default function StripeCheckoutPage() {
  return (
    <>
      <Header />
      <div
        className="fixed inset-0 bg-cover bg-top bg-no-repeat pointer-events-none z-0"
        style={{ backgroundImage: 'url(/images/backgrounds/grid.png)' }}
      />
      <div className="min-h-screen pt-20 relative z-10 flex items-center justify-center px-4">
        <Suspense fallback={<div className="text-white">Loading...</div>}>
          <StripeCheckoutContent />
        </Suspense>
      </div>
    </>
  );
}
