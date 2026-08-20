"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertTriangle, Activity, CheckCircle2, AlertCircle, XCircle } from 'lucide-react';
import styles from '../admin/indexing/indexing.module.css';

export interface IndexingStatusCardProps {
  quotaUsed: number;
  dailyQuota: number;
  credentialStatus: 'unknown' | 'live' | 'mock';
  quotaWarning?: string;
  successCount?: number;
  mockCount?: number;
  failCount?: number;
}

export function IndexingStatusCard({
  quotaUsed,
  dailyQuota = 200,
  credentialStatus,
  quotaWarning,
  successCount,
  mockCount,
  failCount,
}: IndexingStatusCardProps) {
  const quotaPct = Math.min((quotaUsed / dailyQuota) * 100, 100);

  return (
    <div className="space-y-4">
      {/* Credential status pill */}
      <div className={styles.credBadge} data-status={credentialStatus} data-testid="cred-badge">
        <Activity size={13} />
        {credentialStatus === 'live' && 'Service Account Connected — Live Mode'}
        {credentialStatus === 'mock' && 'No Service Account — Running in Mock Mode'}
        {credentialStatus === 'unknown' && 'Checking credentials…'}
      </div>

      {/* Quota bar */}
      <motion.div
        className={`glass-panel ${styles.quotaCard}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        data-testid="quota-card"
      >
        <div className={styles.quotaHeader}>
          <span className={styles.quotaLabel}>
            <Clock size={14} /> Daily Quota Used
          </span>
          <span className={styles.quotaCount}>
            <strong>{quotaUsed}</strong>&nbsp;/ {dailyQuota} URLs
          </span>
        </div>
        <div className={styles.quotaTrack}>
          <motion.div
            className={styles.quotaFill}
            initial={{ width: 0 }}
            animate={{ width: `${quotaPct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{
              background:
                quotaPct > 80
                  ? 'linear-gradient(90deg, #ff4d4d, #ff0055)'
                  : 'linear-gradient(90deg, var(--accent-1), var(--accent-2))',
            }}
            data-testid="quota-fill"
          />
        </div>
        {quotaWarning && (
          <p className={styles.quotaWarning} data-testid="quota-warning">
            <AlertTriangle size={14} /> {quotaWarning}
          </p>
        )}
      </motion.div>

      {/* Optional Result Counters */}
      {(successCount !== undefined || mockCount !== undefined || failCount !== undefined) && (
        <div className={styles.statsSummaryGrid} data-testid="stats-summary">
          <div className={styles.statPill} style={{ borderColor: 'rgba(0,255,136,0.3)' }}>
            <CheckCircle2 size={14} color="#00ff88" />
            <span>{successCount || 0} Indexed</span>
          </div>
          {Number(mockCount) > 0 && (
            <div className={styles.statPill} style={{ borderColor: 'rgba(255,184,0,0.3)' }}>
              <AlertCircle size={14} color="#ffb800" />
              <span>{mockCount} Mocked</span>
            </div>
          )}
          {Number(failCount) > 0 && (
            <div className={styles.statPill} style={{ borderColor: 'rgba(255,77,77,0.3)' }}>
              <XCircle size={14} color="#ff4d4d" />
              <span>{failCount} Failed</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
