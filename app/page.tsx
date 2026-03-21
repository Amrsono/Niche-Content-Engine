import { FloatingNav } from "./components/FloatingNav";
import { BentoBox } from "./components/BentoBox";
import { PulseTerminal } from "./components/PulseTerminal";
import { EarningsAnalytics } from "./components/EarningsAnalytics";
import { HeatmapMockup } from "./components/HeatmapMockup";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <FloatingNav />
      
      <div className={styles.header}>
        <h1 className={styles.title}>System Pulse</h1>
        <p className={styles.subtitle}>Monitor your autonomous agents and earnings in real-time.</p>
      </div>

      <div className={styles.grid}>
        <BentoBox delay={0.1} className={styles.analytics}>
          <EarningsAnalytics />
        </BentoBox>

        <BentoBox delay={0.2} className={styles.heatmap}>
          <HeatmapMockup />
        </BentoBox>

        <BentoBox delay={0.3} className={styles.terminal}>
          <PulseTerminal />
        </BentoBox>
      </div>
    </main>
  );
}
