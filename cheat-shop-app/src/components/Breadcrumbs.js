'use client';

import { ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Breadcrumbs({ items, baseUrl = 'https://atomcheats.com' }) {
  const router = useRouter();

  if (!items || items.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" itemScope itemType="https://schema.org/BreadcrumbList">
      <div className="flex items-center gap-2 flex-wrap">
        {items.map((item, index) => (
          <div 
            key={index} 
            className="flex items-center gap-2"
            itemProp="itemListElement" 
            itemScope 
            itemType="https://schema.org/ListItem"
          >
            {index > 0 && (
              <ChevronRight className="w-4 h-4 text-slate-400" aria-hidden="true" />
            )}
            {item.active ? (
              <span 
                className="text-cyan-400 font-medium text-sm"
                itemProp="name"
                aria-current="page"
              >
                {item.name}
              </span>
            ) : (
              <>
                <button
                  onClick={() => router.push(item.path)}
                  className="text-slate-400 hover:text-cyan-300 transition-colors text-sm font-medium cursor-pointer"
                  itemProp="item"
                >
                  <span itemProp="name">{item.name}</span>
                </button>
                <meta itemProp="position" content={String(index + 1)} />
              </>
            )}
            {item.active && <meta itemProp="position" content={String(index + 1)} />}
          </div>
        ))}
      </div>
    </nav>
  );
}
