import { NextResponse } from 'next/server';
import { getClientIP, getLocaleByIP, determineLocale } from '@/lib/utils/geoLocation';

// GET /api/locale - Определить локаль пользователя
export async function GET(request) {
  try {
    console.log('[LOCALE API] Determining user locale...');
    
    const locale = await determineLocale(request);
    
    const response = NextResponse.json({
      success: true,
      locale: locale,
      source: request.cookies.get('locale')?.value ? 'cookie' : 'ip'
    });

    // Если локаль была определена по IP (нет в куки), устанавливаем куки
    if (!request.cookies.get('locale')?.value) {
      response.cookies.set('locale', locale, {
        maxAge: 365 * 24 * 60 * 60, // 1 год
        httpOnly: false, // Разрешаем доступ из JavaScript
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      });
      console.log('[LOCALE API] Set locale cookie:', locale);
    }

    return response;
  } catch (error) {
    console.error('[LOCALE API] Error determining locale:', error);
    
    // В случае ошибки возвращаем русский по умолчанию
    const response = NextResponse.json({
      success: true,
      locale: 'ru',
      source: 'default'
    });

    response.cookies.set('locale', 'ru', {
      maxAge: 365 * 24 * 60 * 60,
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    return response;
  }
}

// POST /api/locale - Установить локаль пользователя
export async function POST(request) {
  try {
    const { locale } = await request.json();
    
    console.log('[LOCALE API] Setting user locale:', locale);
    
    // Проверяем, что локаль поддерживается
    if (!locale || !['ru', 'en'].includes(locale)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid locale. Supported locales: ru, en'
      }, { status: 400 });
    }

    const response = NextResponse.json({
      success: true,
      locale: locale,
      message: 'Locale updated successfully'
    });

    // Устанавливаем куки с новой локалью
    response.cookies.set('locale', locale, {
      maxAge: 365 * 24 * 60 * 60, // 1 год
      httpOnly: false, // Разрешаем доступ из JavaScript
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    });

    console.log('[LOCALE API] Locale cookie updated:', locale);
    return response;
  } catch (error) {
    console.error('[LOCALE API] Error setting locale:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}