import { redirect } from 'next/navigation';

export default function RussianNewsPage() {
  // Перенаправляем на существующую страницу новостей с параметром языка
  redirect('/news?lang=ru');
}