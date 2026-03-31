'use client';

import React from 'react';
import SmartImage from '../../components/SmartImage';

interface ArticleImageProps {
  initialSrc: string;
  alt: string;
  title: string;
}

export function ArticleImage({ initialSrc, alt, title }: ArticleImageProps) {
  return (
    <SmartImage 
      initialSrc={initialSrc} 
      alt={alt}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      onError={(e) => { 
        const target = e.target as HTMLImageElement;
        // Fallback to simpler generated image if primary fails
        if (!target.src.includes('fallback=true')) {
          const fallbackBase = `https://image.pollinations.ai/prompt/${encodeURIComponent(title)}?width=1200&height=630&nologo=true&seed=42&fallback=true&model=flux`;
          target.src = `/api/image-proxy?url=${encodeURIComponent(fallbackBase)}`;
        }
      }}
    />
  );
}
