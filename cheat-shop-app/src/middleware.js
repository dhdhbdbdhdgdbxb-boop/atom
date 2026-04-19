import { NextResponse } from 'next/server';
import { determineLocale } from '@/lib/utils/geoLocation';

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  
  // Разрешаем доступ к странице логина администратора без проверки
  if (pathname === '/admin') {
    return NextResponse.next();
  }
  
  // Проверяем admin маршруты (кроме самой страницы логина)
  if (pathname.startsWith('/admin/')) {
    // Создаем ответ с заголовками, запрещающими кэширование
    const response = NextResponse.next();
    
    // Добавляем заголовки для предотвращения кэширования
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Surrogate-Control', 'no-store');
    
    // Получаем токен из cookies
    const token = request.cookies.get('admin_token')?.value;
    
    if (!token) {
      // Если нет токена, перенаправляем на страницу логина
      return NextResponse.redirect(new URL('/admin', request.url));
    }

    // Упрощенная проверка в middleware (без JWT верификации)
    // Детальная проверка будет происходить на API роутах
    try {
      // Простая проверка формата JWT токена
      const jwtParts = token.split('.');
      if (jwtParts.length !== 3) {
        throw new Error('Invalid JWT format');
      }

      // Если токен имеет правильный формат JWT, возвращаем ответ с заголовками
      return response;
       
    } catch (error) {
      console.error('Admin middleware error:', error);
      // При ошибке формата токена перенаправляем на логин
      const errorResponse = NextResponse.redirect(new URL('/admin', request.url));
      errorResponse.cookies.delete('admin_token');
      return errorResponse;
    }
  }

  // Обработка мультиязычности
  const locales = ['ru', 'en'];
  const defaultLocale = 'en'; // / — английский по умолчанию
  
  // Проверяем, есть ли локаль в URL
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // Если это корневой путь без локали
  if (pathname === '/') {
    try {
      // Определяем локаль пользователя
      const userLocale = await determineLocale(request);
      
      // Если русский IP — редиректим на /ru
      if (userLocale === 'ru') {
        const response = NextResponse.redirect(new URL('/ru', request.url));
        
        if (!request.cookies.get('locale')?.value) {
          response.cookies.set('locale', 'ru', {
            maxAge: 365 * 24 * 60 * 60,
            httpOnly: false,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/'
          });
        }
        
        return response;
      }
      
      // Для английской локали остаёмся на /
      const response = NextResponse.next();
      
      if (!request.cookies.get('locale')?.value) {
        response.cookies.set('locale', 'en', {
          maxAge: 365 * 24 * 60 * 60,
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/'
        });
      }
      
      return response;
    } catch (error) {
      console.error('Locale determination error:', error);
      return NextResponse.next();
    }
  }

  // Если путь содержит локаль или это системные пути, пропускаем
  if (pathnameHasLocale || pathname.startsWith('/api') || pathname.startsWith('/_next') || pathname.includes('.')) {
    return NextResponse.next();
  }

  // Для всех остальных маршрутов пропускаем
  return NextResponse.next();
}

// Настраиваем middleware для всех маршрутов
export const config = {
  matcher: [
    '/admin/:path*',
    '/((?!_next/static|_next/image|favicon.ico|public|api/sitemap|api/robots|sitemap.xml|robots.txt).*)',
  ],
};