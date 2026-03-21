import { FloatingNav } from "../components/FloatingNav";
import styles from "../page.module.css";
import localStyles from "./AboutContact.module.css";
import Link from "next/link";

export default function AboutPage() {
  return (
    <main className={styles.main}>
      <FloatingNav />
      
      <div className={styles.header}>
        <h1 className={styles.title}>About Us</h1>
        <p className={styles.subtitle}>The vision behind the System Pulse.</p>
      </div>

      <div className={localStyles.container}>
        <div className={`glass-panel glow-border ${localStyles.content}`}>
          <h2>The Niche Content Engine</h2>
          <p>
            The Niche Content Engine is a hyper-modern, autonomous platform designed for the 2026 digital landscape. 
            It leverages a decentralized swarm of AI agents—including Discovery, Reasoning, and SEO Auto-Optimizers—to 
            build and manage high-performance niche blogs with zero manual overhead.
          </p>
          <p>
            From identifying viral trends to publishing fully optimized, affiliate-ready content, 
            the engine handles the entire lifecycle of a digital asset. Our mission is to bridge the gap 
            between raw data and high-value digital content, ensuring every post is both engaging for human 
            readers and perfectly tuned for search engines.
          </p>
          <p>
            Powered by advanced large language models and real-time data scraping, the System Pulse 
            represents the next evolution in content strategy—fully autonomous, data-driven, and 
            built to scale.
          </p>
          
          <Link href="/" className={localStyles.backLink}>
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
