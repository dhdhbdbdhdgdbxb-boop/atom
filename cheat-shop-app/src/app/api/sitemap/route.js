import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://localhost:3000';
  
  // Основные страницы сайта
  const staticPages = [
    { path: '', priority: '1.0' },
    { path: '/catalog', priority: '0.9' },
    { path: '/auth', priority: '0.6' },
    { path: '/profile', priority: '0.5' },
    { path: '/faq', priority: '0.7' },
    { path: '/news', priority: '0.6' },
    { path: '/deposit', priority: '0.6' },
    { path: '/tos', priority: '0.4' }
  ];

  // Получаем все активные продукты для sitemap
  let products = [];
  try {
    products = await prisma.product.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true }
    });
  } catch (error) {
    console.error('Error fetching products for sitemap:', error);
  }

  const currentDate = new Date().toISOString();

  // Генерируем sitemap XML
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
  ${staticPages.map(({ path, priority }) => `
  <!-- Английская версия (основная) -->
  <url>
    <loc>${baseUrl}${path}</loc>
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}${path}" />
    <xhtml:link rel="alternate" hreflang="ru" href="${baseUrl}/ru${path}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}${path}" />
    <lastmod>${currentDate}</lastmod>
    <changefreq>${path === '' ? 'daily' : 'weekly'}</changefreq>
    <priority>${priority}</priority>
  </url>
  <!-- Русская версия -->
  <url>
    <loc>${baseUrl}/ru${path}</loc>
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}${path}" />
    <xhtml:link rel="alternate" hreflang="ru" href="${baseUrl}/ru${path}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}${path}" />
    <lastmod>${currentDate}</lastmod>
    <changefreq>${path === '' ? 'daily' : 'weekly'}</changefreq>
    <priority>${parseFloat(priority) - 0.1}</priority>
  </url>
  <!-- Английская версия /en (для совместимости) -->
  <url>
    <loc>${baseUrl}/en${path}</loc>
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}${path}" />
    <xhtml:link rel="alternate" hreflang="ru" href="${baseUrl}/ru${path}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}${path}" />
    <lastmod>${currentDate}</lastmod>
    <changefreq>${path === '' ? 'daily' : 'weekly'}</changefreq>
    <priority>${parseFloat(priority) - 0.2}</priority>
  </url>`).join('')}
  
  ${products.map(product => `
  <!-- Страницы продуктов - Английская версия (основная) -->
  <url>
    <loc>${baseUrl}/product/${product.slug}</loc>
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/product/${product.slug}" />
    <xhtml:link rel="alternate" hreflang="ru" href="${baseUrl}/ru/product/${product.slug}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}/product/${product.slug}" />
    <lastmod>${product.updatedAt ? new Date(product.updatedAt).toISOString() : currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <!-- Страницы продуктов - Русская версия -->
  <url>
    <loc>${baseUrl}/ru/product/${product.slug}</loc>
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/product/${product.slug}" />
    <xhtml:link rel="alternate" hreflang="ru" href="${baseUrl}/ru/product/${product.slug}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}/product/${product.slug}" />
    <lastmod>${product.updatedAt ? new Date(product.updatedAt).toISOString() : currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <!-- Страницы продуктов - Английская версия /en (для совместимости) -->
  <url>
    <loc>${baseUrl}/en/product/${product.slug}</loc>
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}/product/${product.slug}" />
    <xhtml:link rel="alternate" hreflang="ru" href="${baseUrl}/ru/product/${product.slug}" />
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}/product/${product.slug}" />
    <lastmod>${product.updatedAt ? new Date(product.updatedAt).toISOString() : currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`).join('')}
</urlset>`;

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}