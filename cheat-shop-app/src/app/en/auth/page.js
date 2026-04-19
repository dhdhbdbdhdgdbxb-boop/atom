import { redirect } from 'next/navigation';

export default function EnglishAuthPage() {
  // Перенаправляем на существующую страницу авторизации с параметром языка
  redirect('/auth?lang=en');
}