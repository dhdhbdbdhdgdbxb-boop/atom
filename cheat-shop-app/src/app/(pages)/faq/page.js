import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export default async function FAQPage() {
  // Определяем язык из заголовков или используем английский по умолчанию
  const headersList = await headers();
  const acceptLanguage = headersList.get('accept-language') || '';
  const isRussian = acceptLanguage.toLowerCase().includes('ru');
  
  // Перенаправляем на соответствующую языковую версию
  redirect(isRussian ? '/ru/faq' : '/en/faq');
}
