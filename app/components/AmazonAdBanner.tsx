"use client";

import styles from './AdStyles.module.css';
import Image from 'next/image';

export default function AmazonAdBanner() {
  const productLink = "https://amzn.to/4t3Kx2M";
  const productName = "TP-Link 300MBPS TL-WA850RE Wi-Fi Range Extender - White";
  const productImage = "/ads/tplink_extender_ad.png";

  return (
    <div className={styles.adWrapper}>
      <span className={styles.adLabel}>Partner Offer</span>
      
      <a 
        href={productLink} 
        target="_blank" 
        rel="noopener noreferrer" 
        className={styles.productCard}
      >
        <div className={styles.imageContainer}>
          <Image 
            src={productImage} 
            alt={productName} 
            width={140} 
            height={140} 
            className={styles.productImage}
          />
        </div>
        
        <div className={styles.productInfo}>
          <h3 className={styles.productTitle}>{productName}</h3>
          
          <div className={styles.amazonButton}>
            <svg className={styles.amazonIcon} viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.93 17.13c-2.68 2.02-7.11 3.07-9.58 3.07-3.71 0-5.42-2.1-5.42-4.4 0-3.03 2.13-4.41 4.73-4.41 1.26 0 2.4.2 3.32.49V10.4c0-2.1-.52-3.3-2.48-3.3-1.54 0-3.04.66-3.74 1.1l-.9-1.38c1.13-.86 3.14-1.63 5.36-1.63 3.65 0 5.41 2.1 5.41 5.37v5.72c0 1.17.44 1.76.92 2.1l-.62 1.35c-.7-.5-1-.95-1-2.6zM9 13.51c-.81-.22-1.74-.35-2.43-.35-1.47 0-2.48.51-2.48 2.05 0 1.25.75 1.95 2.1 1.95 1.34 0 2.5-.78 2.82-1.55v-2.1zm14.12 6.55c-3.15 2.1-7.16 3.07-10.4 3.07-4.63 0-8.8-1.5-11.83-3.8l.94-1.22c2.68 1.94 6.4 3.3 10.51 3.3 3.1 0 6.64-.81 9.4-2.45l1.38 1.1zm-.65-2.07l-1.92-1.12c-.22-.13-.37-.03-.23.23l.97 1.83c.12.23.36.17.5.03l.68-.96c.14-.14.22-.1.01.07l-.01-.08z"/>
            </svg>
            View on Amazon
          </div>
        </div>
      </a>
    </div>
  );
}
