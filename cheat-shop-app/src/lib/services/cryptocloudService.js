import { CRYPTOCLOUD_CONFIG, CRYPTOCLOUD_ERRORS } from '@/config/cryptocloud';
import fs from 'fs';
import path from 'path';

// Путь к конфигурационному файлу
const CONFIG_PATH = path.join(process.cwd(), 'config', 'cryptocloud.json');

// Получение конфигурации CryptoCloud
export function getCryptocloudConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const configData = fs.readFileSync(CONFIG_PATH, 'utf8');
      return JSON.parse(configData);
    }
    return {
      enabled: false,
      shopId: '',
      apiKey: '',
      testMode: true
    };
  } catch (error) {
    console.error('Error reading CryptoCloud config:', error);
    return {
      enabled: false,
      shopId: '',
      apiKey: '',
      testMode: true
    };
  }
}

// Сохранение конфигурации CryptoCloud
export function saveCryptocloudConfig(config) {
  try {
    const configDir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving CryptoCloud config:', error);
    return false;
  }
}

// Создание платежа через CryptoCloud API
export async function createCryptocloudPayment({
  amount,
  currency = 'USD',
  orderId,
  email,
  description = 'Payment'
}) {
  const config = getCryptocloudConfig();
  
  if (!config.enabled) {
    throw new Error('CryptoCloud payment method is disabled');
  }

  if (!config.shopId || !config.apiKey) {
    throw new Error(CRYPTOCLOUD_ERRORS.INVALID_CREDENTIALS);
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://atomcheats.com';
    
    const payload = {
      shop_id: config.shopId,
      amount: parseFloat(amount).toFixed(2),
      currency: currency.toUpperCase(),
      order_id: orderId.toString(),
      email: email,
      add_fields: {
        email: email
      }
    };

    const response = await fetch(`${CRYPTOCLOUD_CONFIG.apiUrl}/invoice/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${config.apiKey}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('CryptoCloud API error:', errorData);
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    
    console.log('CryptoCloud response:', data);
    
    if (!data.status || data.status !== 'success') {
      throw new Error(data.message || CRYPTOCLOUD_ERRORS.INVALID_RESPONSE);
    }

    if (!data.result || !data.result.link) {
      throw new Error(CRYPTOCLOUD_ERRORS.INVALID_RESPONSE);
    }

    return {
      success: true,
      paymentUrl: data.result.link,
      invoiceId: data.result.uuid,
      amount: data.result.amount,
      currency: data.result.currency
    };

  } catch (error) {
    console.error('CryptoCloud payment creation error:', error);
    throw new Error(error.message || CRYPTOCLOUD_ERRORS.NETWORK_ERROR);
  }
}

// Проверка статуса платежа
export async function checkCryptocloudPaymentStatus(invoiceId) {
  const config = getCryptocloudConfig();
  
  if (!config.enabled || !config.shopId || !config.apiKey) {
    throw new Error(CRYPTOCLOUD_ERRORS.INVALID_CREDENTIALS);
  }

  try {
    const response = await fetch(`${CRYPTOCLOUD_CONFIG.apiUrl}/invoice/info`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        shop_id: config.shopId,
        invoice_id: invoiceId
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    
    return {
      success: true,
      status: data.result?.status || 'unknown',
      amount: data.result?.amount,
      currency: data.result?.currency,
      paidAmount: data.result?.paid_amount,
      orderId: data.result?.order_id
    };

  } catch (error) {
    console.error('CryptoCloud status check error:', error);
    throw new Error(error.message || CRYPTOCLOUD_ERRORS.NETWORK_ERROR);
  }
}

// Создание подписи для запроса
async function createSignature(payload, apiKey) {
  const crypto = require('crypto');
  
  // Сортируем параметры по ключу
  const sortedParams = Object.keys(payload)
    .sort()
    .reduce((result, key) => {
      result[key] = payload[key];
      return result;
    }, {});

  // Создаем строку для подписи
  const signString = Object.values(sortedParams).join('') + apiKey;
  
  // Создаем MD5 хеш
  return crypto.createHash('md5').update(signString).digest('hex');
}

// Проверка webhook подписи
export function verifyWebhookSignature(payload, signature, apiKey) {
  try {
    const crypto = require('crypto');
    
    // Создаем строку для проверки подписи
    const signString = Object.values(payload).sort().join('') + apiKey;
    const expectedSignature = crypto.createHash('md5').update(signString).digest('hex');
    
    return signature === expectedSignature;
  } catch (error) {
    console.error('Webhook signature verification error:', error);
    return false;
  }
}

// Получение списка доступных криптовалют
export async function getCryptocloudCurrencies() {
  const config = getCryptocloudConfig();
  
  if (!config.enabled || !config.apiKey) {
    return [];
  }

  try {
    const response = await fetch(`${CRYPTOCLOUD_CONFIG.apiUrl}/currencies`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.result || [];

  } catch (error) {
    console.error('Error fetching CryptoCloud currencies:', error);
    return CRYPTOCLOUD_CONFIG.supportedCoins;
  }
}