import FAQPageClient from '../../(pages)/faq/FAQPageClient';

export async function generateMetadata() {
  return {
    title: 'FAQ & Помощь - AtomCheats',
    description: 'Найдите ответы на часто задаваемые вопросы о наших продуктах и услугах. Инструкции по установке, поддержка и необходимое ПО.',
    keywords: 'FAQ, помощь, поддержка, инструкции, AtomCheats',
    openGraph: {
      title: 'FAQ & Помощь - AtomCheats',
      description: 'Найдите ответы на часто задаваемые вопросы о наших продуктах и услугах',
      locale: 'ru_RU',
    }
  };
}

export default function RussianFaqPage() {
  return <FAQPageClient lang="ru" />;
}