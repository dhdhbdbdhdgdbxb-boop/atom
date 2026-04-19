import { redirect } from 'next/navigation';

export default function EnglishDepositPage() {
  // Перенаправляем на существующую страницу пополнения с параметром языка
  redirect('/deposit?lang=en');
}