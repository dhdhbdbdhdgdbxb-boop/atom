import { redirect } from 'next/navigation';

export default async function RussianOrderPage({ searchParams }) {
  // Получаем orderId из параметров запроса (в Next.js 15 searchParams асинхронный)
  const resolvedParams = await searchParams;
  const orderId = resolvedParams?.orderId;
  
  // Перенаправляем на существующую страницу заказа с параметром языка
  if (orderId) {
    redirect(`/order?orderId=${orderId}&lang=ru`);
  } else {
    redirect('/order?lang=ru');
  }
}
