import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { locale } = await request.json();
    const supported = ['ru', 'en'];

    if (!supported.includes(locale)) {
      return NextResponse.json({ error: 'Unsupported locale' }, { status: 400 });
    }

    const response = NextResponse.json({ success: true, locale });
    response.cookies.set('selectedLang', locale, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

export async function GET(request) {
  const cookie = request.cookies.get('selectedLang');
  return NextResponse.json({ locale: cookie?.value || 'ru' });
}
