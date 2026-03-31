'use client';

import React, { useState, useEffect } from 'react';

interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  initialSrc: string;
}

export default function SmartImage({ initialSrc, alt, className, style, ...props }: SmartImageProps) {
  const [currentSrc, setCurrentSrc] = useState<string>(initialSrc);

  useEffect(() => {
    let mounted = true;

    // We start with the proxy URL (initialSrc) to get a fast < 2.5s SVG placeholder for the UI.
    // In the background, if this is a proxy URL, we will directly ask the client's browser to connect
    // to the real Pollinations endpoint. This completely bypasses backend timeout issues!
    let realUrl: string | null = null;
    try {
      const urlObj = new URL(initialSrc, window.location.origin);
      if (urlObj.pathname === '/api/image-proxy' || urlObj.pathname.includes('image-proxy')) {
        const extracted = urlObj.searchParams.get('url');
        if (extracted) {
           realUrl = extracted;
        }
      }
    } catch (e) {
      console.error('[SmartImage] URL parse error:', e);
    }

    if (realUrl) {
      // Create a background image loader
      const img = new Image();
      // When the full heavy AI generation image is completely generated and downloaded:
      img.onload = () => {
        if (mounted) {
          // Swap the beautiful proxy SVG for the real image!
          setCurrentSrc(realUrl!);
        }
      };
      img.onerror = () => {
        console.warn('[SmartImage] Failed to load the direct image, keeping placeholder.');
      };
      
      // Fire the background network request
      img.src = realUrl;
    } else {
       setCurrentSrc(initialSrc);
    }

    return () => {
      mounted = false;
    };
  }, [initialSrc]);

  return (
    <img 
      src={currentSrc} 
      alt={alt || "Article Image"} 
      className={className}
      style={{ ...style, transition: 'opacity 0.5s ease-in-out' }}
      {...props}
    />
  );
}
