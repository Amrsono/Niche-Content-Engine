"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { FloatingNav } from '../../components/FloatingNav';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Globe,
  Clock,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Activity,
  ArrowLeft,
} from 'lucide-react';
import styles from './indexing.module.css';

interface IndexResult {
  url: string;
  success: boolean;
  notifyTime?: string;
  error?: string;
}

interface BatchResult {
  submitted: number;
  results: IndexResult[];
  quotaWarning?: string;
}

type Status = 'idle' | 'loading' | 'done' | 'error';

const DAILY_QUOTA = 200;

export default function IndexingPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

  const adminEmails =
    process.env.NEXT_PUBLIC_ADMIN_EMAILS?.split(',').map((e) => e.trim().toLowerCase()) || [];
  const userEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase();
  const isAdmin = isSignedIn && userEmail && adminEmails.includes(userEmail);

  useEffect(() => {
    if (isLoaded && !isAdmin) router.push('/blog');
  }, [isLoaded, isAdmin, router]);

  const [status, setStatus] = useState<Status>('idle');
  const [result, setResult] = useState<BatchResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [customUrls, setCustomUrls] = useState('');
  const [activeMode, setActiveMode] = useState<'all' | 'latest' | 'custom'>('latest');
  const [credentialStatus, setCredentialStatus] = useState<'unknown' | 'live' | 'mock'>('unknown');
  const [quotaUsed, setQuotaUsed] = useState(0);

  // Check credential status by running a dry-run on page load
  useEffect(() => {
    if (!isAdmin) return;
    async function checkCreds() {
      try {
        const res = await fetch('/api/indexing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'latest' }),
        });
        const data = await res.json();
        if (data.results) {
          const isMock = data.results.some((r: IndexResult) => r.error === 'mock_mode');
          setCredentialStatus(isMock ? 'mock' : 'live');
        }
      } catch {
        setCredentialStatus('unknown');
      }
    }
    checkCreds();
  }, [isAdmin]);

  const submit = useCallback(async (mode: 'all' | 'latest' | 'custom') => {
    setStatus('loading');
    setResult(null);
    setErrorMsg('');
    setExpandedRows(new Set());

    try {
      const body: any = { mode };
      if (mode === 'custom') {
        const urls = customUrls
          .split('\n')
          .map((u) => u.trim())
          .filter(Boolean);
        if (urls.length === 0) {
          setErrorMsg('Please enter at least one URL.');
          setStatus('error');
          return;
        }
        body.urls = urls;
      }

      const res = await fetch('/api/indexing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Unknown error from server.');
      }

      setResult(data);
      setQuotaUsed((prev) => prev + (data.submitted || 0));
      setStatus('done');
    } catch (err: any) {
      setErrorMsg(err.message);
      setStatus('error');
    }
  }, [customUrls]);

  const toggleRow = (i: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const copyUrl = (url: string) => navigator.clipboard.writeText(url);

  const successCount = result?.results.filter((r) => r.success && r.error !== 'mock_mode').length ?? 0;
  const mockCount = result?.results.filter((r) => r.error === 'mock_mode').length ?? 0;
  const failCount = result?.results.filter((r) => !r.success).length ?? 0;
  const quotaPct = Math.min((quotaUsed / DAILY_QUOTA) * 100, 100);

  if (!isLoaded || !isAdmin) return null;

  return (
    <main className={styles.main}>
      <FloatingNav />

      {/* Background glow orbs */}
      <div className={styles.orb1} />
      <div className={styles.orb2} />

      <div className={styles.container}>
        {/* Back link */}
        <motion.a
          href="/analytics"
          className={styles.backLink}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <ArrowLeft size={16} />
          Back to Analytics
        </motion.a>

        {/* Page Header */}
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className={styles.titleRow}>
            <div className={styles.iconHalo}>
              <Zap size={28} className={styles.zapIcon} />
            </div>
            <div>
              <h1 className={styles.title}>Fast-Track Indexing</h1>
              <p className={styles.subtitle}>
                Force Google to crawl your new URLs immediately — no waiting for Googlebot.
              </p>
            </div>
          </div>

          {/* Credential status pill */}
          <div className={styles.credBadge} data-status={credentialStatus}>
            <Activity size={13} />
            {credentialStatus === 'live' && 'Service Account Connected — Live Mode'}
            {credentialStatus === 'mock' && 'No Service Account — Running in Mock Mode'}
            {credentialStatus === 'unknown' && 'Checking credentials…'}
          </div>
        </motion.div>

        {/* Quota bar */}
        <motion.div
          className={`glass-panel ${styles.quotaCard}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className={styles.quotaHeader}>
            <span className={styles.quotaLabel}>
              <Clock size={14} /> Daily Quota Used
            </span>
            <span className={styles.quotaCount}>
              <strong>{quotaUsed}</strong>&nbsp;/ {DAILY_QUOTA} URLs
            </span>
          </div>
          <div className={styles.quotaTrack}>
            <motion.div
              className={styles.quotaFill}
              initial={{ width: 0 }}
              animate={{ width: `${quotaPct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{
                background: quotaPct > 80
                  ? 'linear-gradient(90deg, #ff4d4d, #ff0055)'
                  : 'linear-gradient(90deg, var(--accent-1), var(--accent-2))',
              }}
            />
          </div>
          {result?.quotaWarning && (
            <p className={styles.quotaWarning}>
              <AlertTriangle size={14} /> {result.quotaWarning}
            </p>
          )}
        </motion.div>

        {/* Mode selector + action cards */}
        <div className={styles.modeGrid}>
          {/* Latest post */}
          <motion.div
            className={`glass-panel glow-border ${styles.modeCard} ${activeMode === 'latest' ? styles.active : ''}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            onClick={() => setActiveMode('latest')}
          >
            <div className={styles.modeIcon} style={{ background: 'rgba(0,240,255,0.1)', color: 'var(--accent-1)' }}>
              <Zap size={20} />
            </div>
            <h3 className={styles.modeTitle}>Index Latest Post</h3>
            <p className={styles.modeDesc}>Submit the most recently published article for immediate crawling.</p>
            <span className={styles.modeTag}>1 URL</span>
          </motion.div>

          {/* All posts */}
          <motion.div
            className={`glass-panel glow-border ${styles.modeCard} ${activeMode === 'all' ? styles.active : ''}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => setActiveMode('all')}
          >
            <div className={styles.modeIcon} style={{ background: 'rgba(112,0,255,0.1)', color: 'var(--accent-2)' }}>
              <Globe size={20} />
            </div>
            <h3 className={styles.modeTitle}>Index All Posts</h3>
            <p className={styles.modeDesc}>Batch-submit every blog post URL. Capped at 200/day (Google quota).</p>
            <span className={styles.modeTag} style={{ color: 'var(--accent-2)', borderColor: 'rgba(112,0,255,0.3)' }}>
              All URLs
            </span>
          </motion.div>

          {/* Custom URLs */}
          <motion.div
            className={`glass-panel glow-border ${styles.modeCard} ${activeMode === 'custom' ? styles.active : ''}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            onClick={() => setActiveMode('custom')}
          >
            <div className={styles.modeIcon} style={{ background: 'rgba(255,0,85,0.1)', color: 'var(--accent-3)' }}>
              <RefreshCw size={20} />
            </div>
            <h3 className={styles.modeTitle}>Custom URLs</h3>
            <p className={styles.modeDesc}>Enter specific URLs manually — one per line.</p>
            <span className={styles.modeTag} style={{ color: 'var(--accent-3)', borderColor: 'rgba(255,0,85,0.3)' }}>
              Custom
            </span>
          </motion.div>
        </div>

        {/* Custom URL textarea */}
        <AnimatePresence>
          {activeMode === 'custom' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className={styles.customBox}
            >
              <textarea
                id="custom-urls-input"
                className={styles.urlTextarea}
                placeholder={`https://niche-content-engine.vercel.app/blog/your-post-slug\nhttps://niche-content-engine.vercel.app/blog/another-slug`}
                value={customUrls}
                onChange={(e) => setCustomUrls(e.target.value)}
                rows={5}
              />
              <p className={styles.textareaHint}>One URL per line. Max 200 per submission.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit CTA */}
        <motion.div
          className={styles.ctaRow}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <motion.button
            id="submit-indexing-btn"
            className={styles.submitBtn}
            onClick={() => submit(activeMode)}
            disabled={status === 'loading'}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            {status === 'loading' ? (
              <>
                <RefreshCw size={18} className={styles.spin} />
                Submitting to Google…
              </>
            ) : (
              <>
                <Zap size={18} />
                {activeMode === 'latest' && 'Index Latest Post Now'}
                {activeMode === 'all' && 'Index All Posts Now'}
                {activeMode === 'custom' && 'Submit Custom URLs'}
              </>
            )}
          </motion.button>

          {credentialStatus === 'mock' && (
            <p className={styles.mockNote}>
              <AlertTriangle size={13} />
              Mock mode — add <code>GOOGLE_SERVICE_ACCOUNT_JSON</code> to .env.local to enable real indexing.
            </p>
          )}
        </motion.div>

        {/* Error */}
        <AnimatePresence>
          {status === 'error' && (
            <motion.div
              className={styles.errorBanner}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <XCircle size={18} /> {errorMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence>
          {status === 'done' && result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={styles.resultsSection}
            >
              {/* Summary pills */}
              <div className={styles.summaryRow}>
                <div className={styles.summaryPill} data-variant="success">
                  <CheckCircle2 size={16} />
                  {successCount} Accepted
                </div>
                {mockCount > 0 && (
                  <div className={styles.summaryPill} data-variant="mock">
                    <AlertTriangle size={16} />
                    {mockCount} Mocked
                  </div>
                )}
                {failCount > 0 && (
                  <div className={styles.summaryPill} data-variant="fail">
                    <XCircle size={16} />
                    {failCount} Rejected
                  </div>
                )}
              </div>

              {/* Results table */}
              <div className={`glass-panel ${styles.resultsTable}`}>
                <div className={styles.tableHeader}>
                  <span>URL</span>
                  <span>Status</span>
                  <span>Notify Time</span>
                  <span></span>
                </div>

                {result.results.map((r, i) => {
                  const isMock = r.error === 'mock_mode';
                  const isExpanded = expandedRows.has(i);
                  return (
                    <motion.div
                      key={i}
                      className={styles.tableRow}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <div className={styles.rowMain}>
                        <div className={styles.rowUrl}>
                          <span className={styles.urlText}>{r.url}</span>
                          <button
                            className={styles.iconBtn}
                            onClick={() => copyUrl(r.url)}
                            title="Copy URL"
                          >
                            <Copy size={13} />
                          </button>
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.iconBtn}
                            title="Open URL"
                          >
                            <ExternalLink size={13} />
                          </a>
                        </div>

                        <div className={styles.rowStatus}>
                          {isMock ? (
                            <span className={styles.badge} data-variant="mock">
                              <AlertTriangle size={12} /> Mock
                            </span>
                          ) : r.success ? (
                            <span className={styles.badge} data-variant="success">
                              <CheckCircle2 size={12} /> Accepted
                            </span>
                          ) : (
                            <span className={styles.badge} data-variant="fail">
                              <XCircle size={12} /> Rejected
                            </span>
                          )}
                        </div>

                        <div className={styles.rowTime}>
                          {r.notifyTime
                            ? new Date(r.notifyTime).toLocaleTimeString()
                            : isMock
                            ? '—'
                            : '—'}
                        </div>

                        <button
                          className={styles.expandBtn}
                          onClick={() => toggleRow(i)}
                          title="Details"
                        >
                          {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </button>
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            className={styles.expandedDetail}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            <pre className={styles.detailJson}>
                              {JSON.stringify(r, null, 2)}
                            </pre>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Setup guide (shown only in mock mode) */}
        {credentialStatus === 'mock' && (
          <motion.div
            className={`glass-panel ${styles.setupGuide}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h2 className={styles.guideTitle}>
              <Zap size={20} /> How to Activate Live Indexing
            </h2>
            <ol className={styles.steps}>
              <li>
                <strong>Enable the Web Search Indexing API</strong> in your Google Cloud project{' '}
                <a
                  href="https://console.cloud.google.com/apis/library/indexing.googleapis.com?project=my-niche-engine-123"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.stepLink}
                >
                  Open API Library <ExternalLink size={12} />
                </a>
              </li>
              <li>
                <strong>Create a Service Account</strong> under IAM &amp; Admin → Service Accounts.{' '}
                <a
                  href="https://console.cloud.google.com/iam-admin/serviceaccounts?project=my-niche-engine-123"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.stepLink}
                >
                  Open Service Accounts <ExternalLink size={12} />
                </a>
              </li>
              <li>
                Download the <strong>JSON key</strong> from the service account's <em>Keys</em> tab.
              </li>
              <li>
                Add the service account email as an <strong>Owner</strong> in{' '}
                <a
                  href="https://search.google.com/search-console"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.stepLink}
                >
                  Google Search Console <ExternalLink size={12} />
                </a>
                {' '}→ Settings → Users and permissions.
              </li>
              <li>
                Base64-encode the JSON key and add it to <code>.env.local</code>:
                <pre className={styles.codeBlock}>
{`# PowerShell
[Convert]::ToBase64String(
  [IO.File]::ReadAllBytes("C:\\path\\to\\key.json")
) | clip

# Then add to .env.local:
GOOGLE_SERVICE_ACCOUNT_JSON=<paste here>`}
                </pre>
              </li>
              <li>Redeploy and return to this page — the badge will turn green.</li>
            </ol>
          </motion.div>
        )}
      </div>
    </main>
  );
}
