import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isUserAdmin } from "@/lib/env";
import { FloatingNav } from "./components/FloatingNav";
import { BentoBox } from "./components/BentoBox";
import { PulseTerminal } from "./components/PulseTerminal";
import { EarningsAnalytics } from "./components/EarningsAnalytics";
import { TrendHeatmap } from "./components/TrendHeatmap";
import styles from "./page.module.css";

export default async function Home() {
  const user = await currentUser();
  const userEmail = user?.primaryEmailAddress?.emailAddress;
  
  const isAdmin = isUserAdmin(userEmail);

  if (!isAdmin) {
    redirect("/blog");
  }

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
          <TrendHeatmap />
        </BentoBox>

        <BentoBox delay={0.3} className={styles.terminal}>
          <PulseTerminal />
        </BentoBox>
      </div>
    </main>
  );
}
