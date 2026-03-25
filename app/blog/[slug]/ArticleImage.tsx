'use client';

import React from 'react';

interface ArticleImageProps {
  initialSrc: string;
  alt: string;
  title: string;
}

export function ArticleImage({ initialSrc, alt, title }: ArticleImageProps) {
  return (
    <img 
      src={initialSrc} 
      alt={alt}
      style={{ width: '100%', height: 'auto', display: 'block' }}
      onError={(e) => { 
        const target = e.target as HTMLImageElement;
        // Fallback to simpler generated image if primary fails
        if (!target.src.includes('fallback=true')) {
          target.src = `https://gen.pollinations.ai/image/${encodeURIComponent(title)}?width=1200&height=630&nologo=true&seed=42&fallback=true&model=flux&key=pk_31oNBvU9JLA1ApNX`;
        }
      }}
    />
  );
}
