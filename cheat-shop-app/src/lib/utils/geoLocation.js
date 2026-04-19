/**
 * Утилиты для определения локализации по IP адресу
 */

// Список стран, где основной язык русский
const RUSSIAN_SPEAKING_COUNTRIES = [
  'RU', // Россия
  'BY', // Беларусь
  'KZ', // Казахстан
  'KG', // Киргизия
  'TJ', // Таджикистан
  'UZ', // Узбекистан
  'AM', // Армения
  'AZ', // Азербайджан
  'GE', // Грузия
  'MD', // Молдова
  'UA', // Украина
];

/**
 * Определяет локаль по IP адресу
 * @param {string} ip - IP адрес пользователя
 * @returns {Promise<string>} - Код локали ('ru' или 'en')
 */
export async function getLocaleByIP(ip) {
  // Если IP локальный или не определен, возвращаем русский по умолчанию
  if (!ip || ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    console.log('[GEO] Local IP detected, defaulting to Russian locale');
    return 'ru';
  }

  try {
    console.log('[GEO] Determining locale for IP:', ip);
    
    // Используем бесплатный сервис ip-api.com для определения страны
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode`, {
      timeout: 5000, // 5 секунд таймаут
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('[GEO] IP geolocation result:', data);

    if (data.status === 'success' && data.countryCode) {
      const countryCode = data.countryCode.toUpperCase();
      const locale = RUSSIAN_SPEAKING_COUNTRIES.includes(countryCode) ? 'ru' : 'en';
      
      console.log('[GEO] Detected country:', data.country, 'Code:', countryCode, 'Locale:', locale);
      return locale;
    } else {
      console.log('[GEO] Failed to determine country, defaulting to Russian');
      return 'ru';
    }
  } catch (error) {
    console.error('[GEO] Error determining locale by IP:', error);
    // В случае ошибки возвращаем русский по умолчанию
    return 'ru';
  }
}

/**
 * Получает IP адрес из запроса
 * @param {Request} request - Next.js request объект
 * @returns {string} - IP адрес пользователя
 */
export function getClientIP(request) {
  // Проверяем различные заголовки для получения реального IP
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip'); // Cloudflare
  
  if (forwarded) {
    // x-forwarded-for может содержать несколько IP, берем первый
    const ip = forwarded.split(',')[0].trim();
    console.log('[GEO] IP from x-forwarded-for:', ip);
    return ip;
  }
  
  if (realIP) {
    console.log('[GEO] IP from x-real-ip:', realIP);
    return realIP;
  }
  
  if (cfConnectingIP) {
    console.log('[GEO] IP from cf-connecting-ip:', cfConnectingIP);
    return cfConnectingIP;
  }
  
  // Fallback на connection remote address (может не работать в production)
  const remoteAddress = request.ip || request.connection?.remoteAddress;
  console.log('[GEO] IP from remote address:', remoteAddress);
  
  return remoteAddress || '127.0.0.1';
}

/**
 * Определяет локаль из куки или по IP
 * @param {Request} request - Next.js request объект
 * @returns {Promise<string>} - Код локали ('ru' или 'en')
 */
export async function determineLocale(request) {
  // Сначала проверяем куки
  const cookieLocale = request.cookies.get('locale')?.value;
  
  if (cookieLocale && ['ru', 'en'].includes(cookieLocale)) {
    console.log('[GEO] Using locale from cookie:', cookieLocale);
    return cookieLocale;
  }
  
  // Если в куки нет локали, определяем по IP
  const clientIP = getClientIP(request);
  const detectedLocale = await getLocaleByIP(clientIP);
  
  console.log('[GEO] Detected locale by IP:', detectedLocale);
  return detectedLocale;
}