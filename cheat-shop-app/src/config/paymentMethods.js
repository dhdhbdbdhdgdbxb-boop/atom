// Конфигурация способов оплаты
const paymentMethods = {
  balanceRub: {
    id: 'balanceRub',
    nameKey: 'paymentMethods.balanceRub.name',
    icon: '/images/logo.svg',
    descriptionKey: 'paymentMethods.balanceRub.description',
    currency: 'rub'
  },
  balanceUsd: {
    id: 'balanceUsd',
    nameKey: 'paymentMethods.balanceUsd.name',
    icon: '/images/logo.svg',
    descriptionKey: 'paymentMethods.balanceUsd.description',
    currency: 'usd'
  },
  antilopay: {
    id: 'antilopay',
    nameKey: 'paymentMethods.antilopay.name',
    icon: '/images/payment-icons/antilopay.svg',
    descriptionKey: 'paymentMethods.antilopay.description'
  },
  stripe: {
    id: 'stripe',
    nameKey: 'paymentMethods.stripe.name',
    icon: '/images/payment-icons/stripe.svg',
    descriptionKey: 'paymentMethods.stripe.description'
  },
  pally: {
    id: 'pally',
    nameKey: 'paymentMethods.pally.name',
    icon: '/images/payment-icons/pally.svg',
    descriptionKey: 'paymentMethods.pally.description'
  },
  cryptocloud: {
    id: 'cryptocloud',
    nameKey: 'paymentMethods.cryptocloud.name',
    icon: '/images/payment-icons/crypto.svg',
    descriptionKey: 'paymentMethods.cryptocloud.description'
  },
  paypalff: {
    id: 'paypalff',
    nameKey: 'paymentMethods.paypalff.name',
    icon: '/images/payment-icons/paypal.svg',
    descriptionKey: 'paymentMethods.paypalff.description',
    requiresManualPayment: true
  },
  paysafecard: {
    id: 'paysafecard',
    nameKey: 'paymentMethods.paysafecard.name',
    icon: '/images/payment-icons/PaySafeCard.png',
    descriptionKey: 'paymentMethods.paysafecard.description',
    requiresManualPayment: true
  }
};

export default paymentMethods;