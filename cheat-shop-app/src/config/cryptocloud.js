// CryptoCloud configuration
export const CRYPTOCLOUD_CONFIG = {
  apiUrl: 'https://api.cryptocloud.plus/v2',
  webhookUrl: process.env.NEXT_PUBLIC_BASE_URL + '/api/payments/cryptocloud/webhook',
  currencies: ['USD', 'EUR', 'RUB'],
  supportedCoins: [
    'BTC', 'ETH', 'USDT', 'USDC', 'LTC', 'BCH', 'XRP', 'ADA', 'DOT', 'LINK',
    'BNB', 'SOL', 'MATIC', 'AVAX', 'ATOM', 'XLM', 'TRX', 'DOGE', 'SHIB'
  ]
};

export const CRYPTOCLOUD_ERRORS = {
  INVALID_CREDENTIALS: 'Invalid API credentials',
  INSUFFICIENT_AMOUNT: 'Amount is too small',
  CURRENCY_NOT_SUPPORTED: 'Currency not supported',
  NETWORK_ERROR: 'Network error occurred',
  INVALID_RESPONSE: 'Invalid response from CryptoCloud'
};