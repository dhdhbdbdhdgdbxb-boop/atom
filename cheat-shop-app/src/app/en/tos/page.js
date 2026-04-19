import TOSPageClient from '../../(pages)/tos/TOSPageClient';

export async function generateMetadata() {
  return {
    title: 'Terms of Service - AtomCheats',
    description: 'Read our terms of service and user agreement',
    keywords: 'terms, service, agreement, AtomCheats',
    openGraph: {
      title: 'Terms of Service - AtomCheats',
      description: 'Read our terms of service and user agreement',
      locale: 'en_US',
    }
  };
}

export default function EnglishTosPage() {
  return <TOSPageClient />;
}