import { redirect } from 'next/navigation';

export default function RussianDepositPage() {
  // Перенаправляем на существующую страницу пополнения с параметром языка
  redirect('/deposit?lang=ru');
}