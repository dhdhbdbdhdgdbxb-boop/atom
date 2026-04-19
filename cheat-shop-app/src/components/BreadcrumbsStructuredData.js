'use client';

export default function BreadcrumbsStructuredData({ items, baseUrl = 'https://atomcheats.com' }) {
  if (!items || items.length === 0) {
    return null;
  }

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': items
      .filter(item => item.path) // Только элементы с путями
      .map((item, index) => ({
        '@type': 'ListItem',
        'position': index + 1,
        'name': item.name,
        'item': `${baseUrl}${item.path}`
      }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
