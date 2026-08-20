"use client";

import React, { useEffect } from 'react';
import styles from './AdStyles.module.css';

export type AdVariant = 'display' | 'in-article' | 'sidebar' | 'banner';

export interface BaseAdProps {
  variant?: AdVariant;
  label?: string;
  className?: string;
  style?: React.CSSProperties;
  children?: React.ReactNode;
  slotId?: string;
  layout?: string;
  format?: string;
}

export function BaseAd({
  variant = 'display',
  label = 'Advertisement',
  className = '',
  style,
  children,
  slotId,
  layout,
  format = 'auto',
}: BaseAdProps) {
  useEffect(() => {
    if (slotId) {
      try {
        const win = window as unknown as { adsbygoogle?: unknown[] };
        win.adsbygoogle = win.adsbygoogle || [];
        win.adsbygoogle.push({});
      } catch {
        // Silently handled for ad-blockers
      }
    }
  }, [slotId]);

  const getVariantClass = () => {
    switch (variant) {
      case 'in-article':
        return `${styles.adWrapper} ${styles.adWrapperInArticle}`;
      case 'sidebar':
        return styles.sidebarAd;
      case 'banner':
      case 'display':
      default:
        return styles.adWrapper;
    }
  };

  const wrapperClass = `${getVariantClass()} ${className}`.trim();

  return (
    <div className={variant === 'sidebar' ? styles.sidebarColumn : undefined}>
      <div className={wrapperClass} style={style}>
        <span className={variant === 'sidebar' ? styles.sidebarAdLabel : styles.adLabel}>
          {label}
        </span>
        {children ? (
          children
        ) : slotId ? (
          <ins
            className="adsbygoogle"
            style={{ display: 'block', width: '100%', textAlign: variant === 'in-article' ? 'center' : undefined }}
            data-ad-client="ca-pub-7376665839682546"
            data-ad-slot={slotId}
            data-ad-format={format}
            data-ad-layout={layout}
            data-full-width-responsive="true"
          />
        ) : null}
      </div>
    </div>
  );
}

export default BaseAd;
