import { NextResponse } from 'next/server';

// Список стран, для которых русский язык является первым
const RUSSIAN_SPEAKING_COUNTRIES = [
  'RU', // Россия
  'UA', // Украина
  'KZ', // Казахстан
  'BY', // Беларусь
  'KG', // Кыргызстан
  'AZ', // Азербайджан
  'UZ', // Узбекистан
  'MD', // Молдова
  'TJ', // Таджикистан
  'AM', // Армения
];

export async function GET(request) {
  try {
    // Получаем IP адрес пользователя
    const forwarded = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip = forwarded?.split(',')[0] || realIp || request.ip || '127.0.0.1';
    
    // Для локальной разработки возвращаем русский язык
    if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
      return NextResponse.json({
        success: true,
        ip: ip,
        country: 'RU',
        language: 'ru',
        isLocal: true
      });
    }

    // Используем бесплатный сервис для определения страны по IP
    const geoResponse = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode`, {
      headers: {
        'User-Agent': 'AtomCheats/1.0'
      }
    });

    if (!geoResponse.ok) {
      throw new Error('Geo service unavailable');
    }

    const geoData = await geoResponse.json();
    
    if (geoData.status !== 'success') {
      throw new Error('Failed to detect country');
    }

    const countryCode = geoData.countryCode;
    const isRussianSpeaking = RUSSIAN_SPEAKING_COUNTRIES.includes(countryCode);
    const language = isRussianSpeaking ? 'ru' : 'en';

    return NextResponse.json({
      success: true,
      ip: ip,
      country: countryCode,
      countryName: geoData.country,
      language: language,
      isRussianSpeaking: isRussianSpeaking,
      isLocal: false
    });

  } catch (error) {
    console.error('Country detection error:', error);
    
    // В случае ошибки возвращаем русский язык по умолчанию
    return NextResponse.json({
      success: false,
      error: error.message,
      language: 'ru', // По умолчанию русский
      fallback: true
    });
  }
}