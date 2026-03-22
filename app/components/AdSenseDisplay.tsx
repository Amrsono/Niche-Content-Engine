"use client";

import { useEffect } from "react";

interface AdSenseDisplayProps {
  style?: React.CSSProperties;
}

export default function AdSenseDisplay({ style }: AdSenseDisplayProps) {
  useEffect(() => {
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (e) {
      // Silently fail in dev or if AdSense not loaded
    }
  }, []);

  return (
    <div style={{ margin: "2rem auto", maxWidth: "100%", ...style }}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-7376665839682546"
        data-ad-slot="2236544112"
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
