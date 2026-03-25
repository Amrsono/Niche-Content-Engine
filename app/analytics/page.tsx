"use client";
import React, { useState, useEffect } from 'react';
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { FloatingNav } from '../components/FloatingNav';
import { BentoBox } from '../components/BentoBox';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Eye, 
  MousePointer2, 
  Globe,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import styles from './analytics.module.css';

const metrics = [
  { title: 'Total Revenue', value: '$2,840.50', change: '+14.2%', icon: TrendingUp, color: 'var(--accent-1)' },
  { title: 'Active Agents', value: '12', change: '+2', icon: Users, color: 'var(--accent-2)' },
  { title: 'Article Views', value: '45.2K', change: '+18.5%', icon: Eye, color: 'var(--accent-3)' },
  { title: 'CTR', value: '3.8%', change: '-0.4%', icon: MousePointer2, color: '#ffcc00' },
];

export default function AnalyticsPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

  const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || [];
  const userEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
  const isAdmin = isSignedIn && userEmail && adminEmails.includes(userEmail);

  useEffect(() => {
    if (isLoaded && !isAdmin) {
      router.push("/blog");
    }
  }, [isLoaded, isAdmin, router]);

  const [targetNiches, setTargetNiches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('24h');

  // Realistic mock data for different time ranges
  const chartDataSets: Record<string, number[]> = {
    '24h': [60, 45, 80, 55, 90, 70, 100, 85, 60, 40, 75, 95],
    '7d': [40, 70, 50, 85, 30, 95, 65, 80, 45, 70, 55, 90],
    '30d': [30, 55, 40, 60, 75, 50, 80, 70, 95, 85, 100, 90]
  };

  const currentData = chartDataSets[activeTab];

  useEffect(() => {
    async function fetchTrends() {
      try {
        const res = await fetch('/api/trends');
        const data = await res.json();
        if (data.success && data.trends) {
          // Take top 6 trending keywords
          setTargetNiches(data.trends.slice(0, 6));
        }
      } catch (err) {
        console.error("Failed to fetch trends", err);
      } finally {
        setLoading(false);
      }
    }
    
    // Fetch initially
    fetchTrends();
    
    // Refresh frequently (every 1 minute)
    const interval = setInterval(fetchTrends, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className={styles.main}>
      <FloatingNav />
      
      <div className={styles.header}>
        <div className={styles.titleWrapper}>
          <h1 className={styles.title}>Analytics Hub</h1>
          <span className={styles.liveBadge}>LIVE FEED</span>
        </div>
        <p className={styles.subtitle}>Performance analysis and conversion tracking across all niche engines.</p>
      </div>

      <div className={styles.metricGrid}>
        {metrics.map((m, i) => (
          <BentoBox key={i} delay={i * 0.1}>
            <div className={styles.metricHeader}>
              <div className={styles.iconBox} style={{ backgroundColor: `${m.color}15`, color: m.color }}>
                <m.icon size={20} />
              </div>
              <span className={m.change.startsWith('+') ? styles.positive : styles.negative}>
                {m.change.startsWith('+') ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {m.change}
              </span>
            </div>
            <div className={styles.metricContent}>
              <h4 className={styles.metricTitle}>{m.title}</h4>
              <div className={styles.metricValue}>{m.value}</div>
            </div>
          </BentoBox>
        ))}
      </div>

      <div className={styles.mainGrid}>
        <BentoBox className={styles.chartContainer} delay={0.4}>
          <div className={styles.chartHeader}>
            <h3>Traffic Distribution</h3>
            <div className={styles.chartTabs}>
              {['24h', '7d', '30d'].map((tab) => (
                <button 
                  key={tab}
                  className={activeTab === tab ? styles.activeTab : ''}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.chartBody}>
            {/* Visual Chart Placeholder */}
            <div className={styles.barChart}>
              {currentData.map((h, i) => (
                <motion.div 
                  key={`${activeTab}-${i}`}
                  className={styles.bar}
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ delay: i * 0.05, type: 'spring', stiffness: 100 }}
                />
              ))}
            </div>
          </div>
        </BentoBox>

        <BentoBox className={styles.nicheList} delay={0.5}>
          <h3>Live Trending Niches</h3>
          <div className={styles.nicheTable}>
            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>Refreshing Feed...</div>
            ) : targetNiches.length > 0 ? (
              targetNiches.map((niche, i) => (
                <div key={i} className={styles.nicheRow}>
                  <div className={styles.nicheInfo}>
                    <Globe size={16} color="var(--accent-1)" />
                    <span style={{ textTransform: 'capitalize' }}>{niche.keyword}</span>
                  </div>
                  <div className={styles.nicheStatus}>
                    <div className={styles.statusDot} style={{ backgroundColor: niche.type === 'TikTok' ? '#ff0050' : '#00ff00' }} />
                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{niche.type}</span>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>No trends available</div>
            )}
          </div>
        </BentoBox>
      </div>
    </main>
  );
}
