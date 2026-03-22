"use client";

import styles from './AdStyles.module.css';

export default function AmazonAdBanner() {
  return (
    <div className={styles.adWrapper}>
      <span className={styles.adLabel}>Partner Offer</span>
      
      {/* 
        USER INSTRUCTION: 
        Replace the placeholder below with your actual Amazon Associates Native Shopping Ad script.
        Keep it inside this wrapper so it stays beautifully styled!
      */}
      
      <div style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', fontSize: '0.9rem' }}>
        [ Amazon Affiliate Native Shopping Ad Slot ]<br/>
        <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Paste your script here</span>
      </div>
    </div>
  );
}
