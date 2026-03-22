"use client";
import React, { useState } from 'react';
import { FloatingNav } from '../components/FloatingNav';
import { BentoBox } from '../components/BentoBox';
import { AlertCircle, CheckCircle2, Play, Activity } from 'lucide-react';
import styles from './diagnostic.module.css';

const MODELS_TO_TEST = [
  "gemini-2.5-flash",     // ✅ Active fallback
  "gemini-flash-latest",  // Maps to gemini-3-flash (20 req/day limit)
  "gemini-pro-latest",    // Maps to gemini-3.1-pro (limit: 0)
  "gemini-2.5-pro",       // Limit: 0
  "gemini-2.0-flash"      // Limit: 0
];

export default function DiagnosticPage() {
  const [results, setResults] = useState<Record<string, { status: 'loading' | 'success' | 'error', message?: string }>>({});
  const [isTesting, setIsTesting] = useState(false);

  const runDiagnostics = async () => {
    setIsTesting(true);
    const newResults: typeof results = {};
    for (const model of MODELS_TO_TEST) {
      newResults[model] = { status: 'loading' };
    }
    setResults({ ...newResults });

    for (const model of MODELS_TO_TEST) {
      try {
        const res = await fetch('/api/diagnostic', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model }),
        });
        const data = await res.json();
        
        if (data.success) {
          setResults(prev => ({ ...prev, [model]: { status: 'success', message: 'Model is active and responding.' } }));
        } else {
          setResults(prev => ({ ...prev, [model]: { status: 'error', message: data.error } }));
        }
      } catch (err: any) {
        setResults(prev => ({ ...prev, [model]: { status: 'error', message: err.message } }));
      }
    }
    setIsTesting(false);
  };

  return (
    <main className={styles.main}>
      <FloatingNav />
      
      <div className={styles.header}>
        <h1 className={styles.title}>AI Diagnostic Console</h1>
        <p className={styles.subtitle}>Test your Gemini API key against available models to identify quota or permission issues.</p>
      </div>

      <div className={styles.container}>
        <BentoBox className={styles.controlBox}>
          <div className={styles.controlHeader}>
            <Activity color="var(--accent-1)" size={24} />
            <h3>System Connectivity</h3>
            <button 
              onClick={runDiagnostics} 
              disabled={isTesting}
              className={styles.testBtn}
            >
              {isTesting ? 'Testing...' : 'Run Diagnostics'}
              {!isTesting && <Play size={16} />}
            </button>
          </div>

          <div className={styles.modelList}>
            {MODELS_TO_TEST.map(model => (
              <div key={model} className={styles.modelRow}>
                <div className={styles.modelName}>{model}</div>
                <div className={styles.modelStatus}>
                  {results[model]?.status === 'loading' && <div className={styles.spinner} />}
                  {results[model]?.status === 'success' && <CheckCircle2 color="#00ffaa" size={20} />}
                  {results[model]?.status === 'error' && <AlertCircle color="#ff4d4d" size={20} />}
                </div>
                {results[model]?.message && (
                  <div className={`${styles.message} ${results[model]?.status === 'error' ? styles.errorMsg : styles.successMsg}`}>
                    {results[model]?.message}
                  </div>
                )}
              </div>
            ))}
          </div>
        </BentoBox>
      </div>
    </main>
  );
}
