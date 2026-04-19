import { redirect } from 'next/navigation';

export default function RussianProfilePage() {
  // Перенаправляем на существующую страницу профиля с параметром языка
  redirect('/profile?lang=ru');
}