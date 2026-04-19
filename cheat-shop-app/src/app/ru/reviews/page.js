import ReviewsPageClient from '../../(pages)/reviews/ReviewsPageClient';

export async function generateMetadata() {
  return {
    title: 'Отзывы - AtomCheats',
    description: 'Отзывы наших клиентов о продуктах и сервисе',
    keywords: 'отзывы, рейтинги, оценки, AtomCheats',
    openGraph: {
      title: 'Отзывы - AtomCheats',
      description: 'Отзывы наших клиентов о продуктах и сервисе',
      locale: 'ru_RU',
    }
  };
}

export default function RussianReviewsPage() {
  return <ReviewsPageClient />;
}
