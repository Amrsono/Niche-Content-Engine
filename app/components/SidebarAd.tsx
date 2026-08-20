"use client";

import React from 'react';
import Image from 'next/image';
import { BaseAd } from './BaseAd';
import styles from './AdStyles.module.css';

interface SidebarAdProps {
  link?: string;
  label?: string;
  image?: string;
}

export default function SidebarAd({ 
  link, 
  label = "Advertisement", 
  image
}: SidebarAdProps) {
  return (
    <BaseAd variant="sidebar" label={label}>
      {link ? (
        <a 
          href={link} 
          target="_blank" 
          rel="noopener noreferrer" 
          className={styles.sidebarAdLink}
        >
          {image ? (
            <div style={{ position: 'relative', width: '140px', height: '280px', marginBottom: '15px' }}>
              <Image 
                src={image} 
                alt={label} 
                fill 
                style={{ objectFit: 'contain' }}
              />
            </div>
          ) : (
            <div style={{ padding: '40px 0', color: '#3b82f6', opacity: 0.8 }}>
              <svg style={{ width: '64px', height: '64px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
              </svg>
            </div>
          )}
          <p style={{ margin: '0 0 10px 0', fontWeight: 600 }}>{label}</p>
          <div className={styles.amazonButton} style={{ padding: '8px 16px', fontSize: '0.8rem' }}>
            Shop Now
          </div>
        </a>
      ) : (
        <>
          <svg className={styles.placeholderIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
          </svg>
          <p style={{ margin: '0 0 10px 0', fontWeight: 600 }}>Skyscraper Ad</p>
          <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>
            Placeholder for<br/>Amazon Affiliate Link
          </span>
          <div style={{ marginTop: '20px', fontSize: '0.6rem', color: '#3b82f6', fontWeight: 700 }}>
            READY FOR CODE
          </div>
        </>
      )}
    </BaseAd>
  );
}
