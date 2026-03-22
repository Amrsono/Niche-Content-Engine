"use client";

import { useEffect } from "react";
import styles from "./AdStyles.module.css";

export default function AdSenseInArticle() {
  useEffect(() => {
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (e) {}
  }, []);

  return (
    <div className={`${styles.adWrapper} ${styles.adWrapperInArticle}`}>
      <span className={styles.adLabel}>Advertisement</span>
      <ins
        className="adsbygoogle"
        style={{ display: "block", textAlign: "center", width: "100%" }}
        data-ad-layout="in-article"
        data-ad-format="fluid"
        data-ad-client="ca-pub-7376665839682546"
        data-ad-slot="2155118212"
      />
    </div>
  );
}
