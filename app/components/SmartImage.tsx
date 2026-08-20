'use client';

import React, { useState, useEffect } from 'react';

interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  initialSrc: string;
}

export default function SmartImage({ initialSrc, alt, className, style, ...props }: SmartImageProps) {
  const [loadedDirectSrc, setLoadedDirectSrc] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let realUrl: string | null = null;

    try {
      const urlObj = new URL(initialSrc, window.location.origin);
      if (urlObj.pathname === '/api/image-proxy' || urlObj.pathname.includes('image-proxy')) {
        const extracted = urlObj.searchParams.get('url');
        if (extracted) {
          realUrl = extracted;
        }
      }
    } catch {
      // Direct URL or parse failure
    }

    if (realUrl) {
      const img = new Image();
      img.onload = () => {
        if (mounted) {
          setLoadedDirectSrc(realUrl);
        }
      };
      img.src = realUrl;
    }

    return () => {
      mounted = false;
    };
  }, [initialSrc]);

  const displaySrc = loadedDirectSrc || initialSrc;

  return (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img 
      src={displaySrc} 
      alt={alt || "Article Image"} 
      className={className}
      style={{ ...style, transition: 'opacity 0.5s ease-in-out' }}
      {...props}
    />
  );
}
