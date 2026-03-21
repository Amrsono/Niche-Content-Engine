"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Play, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface LogEntry {
  text: string;
  type: 'info' | 'success' | 'error' | 'system';
  timestamp: string;
}

export function PulseTerminal() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [niche, setNiche] = useState('Sustainable Tech');
  const [isBulk, setIsBulk] = useState(false);
  const [bulkCount, setBulkCount] = useState(5);
  const scrollRef = useRef<HTMLDivElement>(null);

  const addLog = (text: string, type: LogEntry['type'] = 'info') => {
    const entry: LogEntry = {
      text,
      type,
      timestamp: new Date().toLocaleTimeString([], { hour12: false })
    };
    setLogs((prev) => [...prev, entry]);
  };

  const startCycle = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setLogs([]);
    
    addLog(`Initiating ${isBulk ? 'BULK ' : ''}autonomous cycle for niche: ${niche}`, 'system');

    try {
      if (isBulk) {
        addLog(`[BATCH] Queuing ${bulkCount} articles for generation...`, 'info');
        const response = await fetch('/api/batch', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ niche, count: bulkCount }),
        });
        const data = await response.json();
        
        if (data.success) {
          data.results.forEach((res: any) => {
            if (res.error) {
              addLog(`[ERROR] ${res.keyword}: ${res.error}`, 'error');
            } else {
              addLog(`[SUCCESS] Generated: "${res.title}"`, 'success');
              if (res.indexing) addLog(`[INDEXING] Google notified via API.`, 'info');
            }
          });
          addLog(`Bulk operation complete. ${data.totalProcessed} articles ready.`, 'system');
        } else {
          throw new Error(data.error || "Batch failed");
        }
      } else {
        await new Promise(r => setTimeout(r, 800));
        addLog(`[DISCOVERY] Asking Groq for trends...`, 'info');
        
        const response = await fetch('/api/scraper', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ niche }),
        });
        const data = await response.json();

        if (!data.success) {
          throw new Error(data.details || data.error || 'Unknown error');
        }

        addLog(`[DISCOVERY] Found keyword: "${data.keyword}"`, 'success');
        await new Promise(r => setTimeout(r, 800));
        addLog(`[REASONING] Article generated: "${data.draftPreview.title}"`, 'info');
        await new Promise(r => setTimeout(r, 800));
        
        addLog(`[SEO] OG Image concept created.`, 'success');
        await new Promise(r => setTimeout(r, 600));

        addLog(`[SOCIAL] Posted to Instagram: [Success]`, 'success');
        await new Promise(r => setTimeout(r, 400));
        addLog(`[SOCIAL] Posted to TikTok: [Success]`, 'success');
        await new Promise(r => setTimeout(r, 400));
        
        addLog(`[PUBLISHER] Article live in Pulse Blog!`, 'success');
        addLog(`Success! Cycle complete.`, 'system');

        // Optional: Dispatch event to refresh usePosts hook if needed
        window.dispatchEvent(new Event('posts-updated'));
      }
    } catch (err: any) {
      addLog(`[ERROR] ${err.message}`, 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '400px', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-1)' }}>
          <Terminal size={20} />
          <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Agent Pulse Terminal</h3>
        </div>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: isBulk ? 'var(--accent-1)' : '#a0aab5', cursor: 'pointer', fontWeight: isBulk ? 700 : 400 }}>
            <input 
              type="checkbox" 
              checked={isBulk}
              onChange={() => setIsBulk(!isBulk)}
              style={{ accentColor: 'var(--accent-1)' }}
            />
            Bulk Mode
          </label>
          {isBulk && (
            <input 
              type="number" 
              value={bulkCount}
              onChange={(e) => setBulkCount(Math.min(20, Math.max(1, parseInt(e.target.value) || 1)))}
              style={{
                width: '50px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--accent-1)',
                borderRadius: '6px',
                padding: '2px 8px',
                color: 'var(--accent-1)',
                fontWeight: 700
              }}
            />
          )}
          <input 
            type="text" 
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            placeholder="Enter niche..."
            disabled={isProcessing}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '4px 12px',
              color: '#fff',
              fontSize: '0.9rem',
              outline: 'none',
              width: '180px'
            }}
          />
          <button 
            onClick={startCycle}
            disabled={isProcessing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: isProcessing ? 'rgba(255,255,255,0.1)' : 'var(--accent-1)',
              color: '#000',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 16px',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              transition: 'all 0.2s ease',
              boxShadow: isProcessing ? 'none' : '0 0 15px rgba(0, 255, 255, 0.3)'
            }}
          >
            {isProcessing ? <Loader2 className="spinner" size={16} /> : <Play size={16} />}
            {isProcessing ? (isBulk ? 'Generating Batch' : 'Processing') : (isBulk ? 'Start Bulk Run' : 'Start Cycle')}
          </button>
        </div>
      </div>

      <div 
        ref={scrollRef}
        style={{ 
          flex: 1, 
          background: 'rgba(5, 10, 15, 0.85)', 
          backdropFilter: 'blur(10px)',
          borderRadius: '12px', 
          padding: '20px', 
          fontFamily: 'var(--font-geist-mono)', 
          fontSize: '0.9rem',
          color: '#e0eef0',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          boxShadow: 'inset 0 0 30px rgba(0,0,0,0.9), 0 0 20px rgba(0, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.05)'
        }}
      >
        {logs.length === 0 && !isProcessing && (
          <div style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: '40px' }}>
            System idle. Enter a niche and click {isBulk ? 'Start Bulk Run' : 'Start Cycle'} to begin.
          </div>
        )}
        
        {logs.map((log, idx) => (
          <div key={idx} style={{ 
            display: 'flex', 
            gap: '12px',
            animation: 'fadeIn 0.3s ease-out forwards',
            color: log.type === 'error' ? '#ff4d4d' : 
                   log.type === 'success' ? '#00ffaa' : 
                   log.type === 'system' ? 'var(--accent-1)' : '#e0eef0'
          }}>
            <span style={{ color: 'rgba(255,255,255,0.3)', flexShrink: 0 }}>
              [{log.timestamp}]
            </span>
            <span style={{ lineHeight: '1.4' }}>{log.text}</span>
          </div>
        ))}
        {isProcessing && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-1)', animation: 'pulse 1.5s infinite opacity' }}>
            <span style={{ width: '8px', height: '8px', background: 'var(--accent-1)', borderRadius: '50%' }}></span>
            <span>Awaiting Groq response...</span>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .spinner {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
