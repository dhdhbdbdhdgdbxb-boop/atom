import { redirect } from 'next/navigation';

export default function EnglishProfilePage() {
  // Перенаправляем на существующую страницу профиля с параметром языка
  redirect('/profile?lang=en');
}