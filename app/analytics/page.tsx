"use client";
import React from 'react';
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
              <button className={styles.activeTab}>24h</button>
              <button>7d</button>
              <button>30d</button>
            </div>
          </div>
          <div className={styles.chartBody}>
            {/* Visual Chart Placeholder */}
            <div className={styles.barChart}>
              {[60, 45, 80, 55, 90, 70, 100, 85, 60, 40, 75, 95].map((h, i) => (
                <motion.div 
                  key={i}
                  className={styles.bar}
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ delay: 0.5 + i * 0.05, type: 'spring', stiffness: 100 }}
                />
              ))}
            </div>
          </div>
        </BentoBox>

        <BentoBox className={styles.nicheList} delay={0.5}>
          <h3>Target Niches</h3>
          <div className={styles.nicheTable}>
            {['Sustainable Tech', 'AI Tools', 'Pet Wellness', 'FinOps'].map((niche, i) => (
              <div key={i} className={styles.nicheRow}>
                <div className={styles.nicheInfo}>
                  <Globe size={16} color="var(--accent-1)" />
                  <span>{niche}</span>
                </div>
                <div className={styles.nicheStatus}>
                  <div className={styles.statusDot} />
                  Active
                </div>
              </div>
            ))}
          </div>
        </BentoBox>
      </div>
    </main>
  );
}
