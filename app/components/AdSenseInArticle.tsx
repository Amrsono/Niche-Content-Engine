"use client";

import { useEffect } from "react";

export default function AdSenseInArticle() {
  useEffect(() => {
    try {
      // Push a new ad unit render after mount
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (e) {
      // Silently fail in dev or if AdSense not loaded
    }
  }, []);

  return (
    <div style={{ margin: "2rem 0", textAlign: "center" }}>
      <ins
        className="adsbygoogle"
        style={{ display: "block", textAlign: "center" }}
        data-ad-layout="in-article"
        data-ad-format="fluid"
        data-ad-client="ca-pub-7376665839682546"
        data-ad-slot="2155118212"
      />
    </div>
  );
}
