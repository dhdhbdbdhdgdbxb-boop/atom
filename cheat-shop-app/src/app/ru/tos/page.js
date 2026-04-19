import TOSPageClient from '../../(pages)/tos/TOSPageClient';

export async function generateMetadata() {
  return {
    title: 'Условия использования - AtomCheats',
    description: 'Ознакомьтесь с нашими условиями использования и пользовательским соглашением',
    keywords: 'условия, использование, соглашение, AtomCheats',
    openGraph: {
      title: 'Условия использования - AtomCheats',
      description: 'Ознакомьтесь с нашими условиями использования и пользовательским соглашением',
      locale: 'ru_RU',
    }
  };
}

export default function RussianTosPage() {
  return <TOSPageClient />;
}