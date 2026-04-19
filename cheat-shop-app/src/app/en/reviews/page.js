import ReviewsPageClient from '../../(pages)/reviews/ReviewsPageClient';

export async function generateMetadata() {
  return {
    title: 'Reviews - AtomCheats',
    description: 'Customer reviews about our products and service',
    keywords: 'reviews, ratings, feedback, AtomCheats',
    openGraph: {
      title: 'Reviews - AtomCheats',
      description: 'Customer reviews about our products and service',
      locale: 'en_US',
    }
  };
}

export default function EnglishReviewsPage() {
  return <ReviewsPageClient />;
}
