import { generateCatalogMetadata } from './metadata';
import CatalogSlugPage from './page';

// Генерация метаданных для SEO (английская версия)
export async function generateMetadata({ params }) {
  const resolvedParams = await params;
  return await generateCatalogMetadata({ params: resolvedParams, language: 'en' });
}

export default function CatalogSlugServerPage({ params }) {
  return <CatalogSlugPage />;
}