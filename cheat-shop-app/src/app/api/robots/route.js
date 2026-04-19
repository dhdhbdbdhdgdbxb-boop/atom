import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://localhost:3000';
  
  const robots = `User-agent: *
Allow: /
Allow: /en/
Allow: /ru/
Allow: /product/
Allow: /en/product/
Allow: /ru/product/
Allow: /catalog/
Allow: /en/catalog/
Allow: /ru/catalog/

# Disallow admin and API routes
Disallow: /admin/
Disallow: /api/
Disallow: /_next/
Disallow: /order/
Disallow: /*.json$

# Allow specific bots
User-agent: Googlebot
Allow: /
Allow: /product/
Allow: /catalog/

User-agent: Bingbot
Allow: /
Allow: /product/
Allow: /catalog/

User-agent: Yandex
Allow: /
Allow: /product/
Allow: /catalog/

# Sitemap location
Sitemap: ${baseUrl}/sitemap.xml

# Crawl-delay for general bots
Crawl-delay: 1

# Host directive
Host: ${baseUrl.replace('https://', '').replace('http://', '')}`;

  return new NextResponse(robots, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}