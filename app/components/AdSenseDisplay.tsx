"use client";

import { useEffect } from "react";
import styles from "./AdStyles.module.css";

interface AdSenseDisplayProps {
  style?: React.CSSProperties;
}

export default function AdSenseDisplay({ style }: AdSenseDisplayProps) {
  useEffect(() => {
    try {
      const win = window as unknown as { adsbygoogle?: unknown[] };
      win.adsbygoogle = win.adsbygoogle || [];
      win.adsbygoogle.push({});
    } catch {
      // Ignored for ad blockers
    }
  }, []);

  return (
    <div className={styles.adWrapper} style={style}>
      <span className={styles.adLabel}>Advertisement</span>
      <ins
        className="adsbygoogle"
        style={{ display: "block", width: "100%" }}
        data-ad-client="ca-pub-7376665839682546"
        data-ad-slot="2236544112"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
