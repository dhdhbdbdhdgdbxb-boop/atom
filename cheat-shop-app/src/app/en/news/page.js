import { redirect } from 'next/navigation';

export default function EnglishNewsPage() {
  // Перенаправляем на существующую страницу новостей с параметром языка
  redirect('/news?lang=en');
}