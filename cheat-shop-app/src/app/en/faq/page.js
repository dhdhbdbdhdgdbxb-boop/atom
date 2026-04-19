import FAQPageClient from '../../(pages)/faq/FAQPageClient';

export async function generateMetadata() {
  return {
    title: 'FAQ & Help - AtomCheats',
    description: 'Find answers to common questions about our products and services. Installation guides, support, and required software.',
    keywords: 'FAQ, help, support, instructions, AtomCheats',
    openGraph: {
      title: 'FAQ & Help - AtomCheats',
      description: 'Find answers to common questions about our products and services',
      locale: 'en_US',
    }
  };
}

export default function EnglishFaqPage() {
  return <FAQPageClient lang="en" />;
}