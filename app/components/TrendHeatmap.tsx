"use client";
import React, { useState, useEffect } from 'react';
import { Map, Flame, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Trend {
  keyword: string;
  growth: string;
  type: string;
  top: string;
  left: string;
}

export function TrendHeatmap() {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [loading, setLoading] = useState(true);
  const [hovered, setHovered] = useState<number | null>(null);

  useEffect(() => {
    async function getTrends() {
      try {
        const res = await fetch('/api/trends');
        const data = await res.json();
        if (data.success) {
          setTrends(data.trends);
        }
      } catch (err) {
        console.error("Heatmap fetch failed:", err);
      } finally {
        setLoading(false);
      }
    }
    getTrends();
  }, []);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: '300px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Map size={20} color="var(--accent-3)" />
          <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Global Pulse Heatmap</h3>
        </div>
        {!loading && (
          <div style={{ fontSize: '0.75rem', color: 'var(--accent-3)', opacity: 0.8, display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ width: 6, height: 6, background: 'var(--accent-3)', borderRadius: '50%', boxShadow: '0 0 8px var(--accent-3)' }} />
            LIVE
          </div>
        )}
      </div>
      
      <div style={{ 
        flex: 1, 
        position: 'relative', 
        background: 'rgba(255,255,255,0.02)', 
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: 'inset 0 0 40px rgba(0,0,0,0.5)'
      }}>
        {/* Stylized Map Grid */}
        <div style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '16px',
          overflow: 'hidden',
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '30px 30px',
          opacity: 0.2
        }} />

        {loading ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="pulse-loader" />
          </div>
        ) : (
          <AnimatePresence>
            {trends.map((trend, i) => (
              <div 
                key={i}
                style={{
                  position: 'absolute',
                  top: trend.top,
                  left: trend.left,
                  transform: 'translate(-50%, -50%)',
                  zIndex: hovered === i ? 10 : 2
                }}
              >
                <motion.div
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  whileHover={{ scale: 1.2 }}
                  style={{
                    width: 30,
                    height: 30,
                    background: 'radial-gradient(circle, var(--accent-3) 0%, transparent 80%)',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 0 20px var(--accent-3)`
                  }}
                >
                  <Flame size={14} color="#fff" style={{ opacity: 0.9 }} />
                </motion.div>

                {/* Info Label */}
                {(hovered === i || i < 3) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      position: 'absolute',
                      bottom: '40px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'rgba(0,0,0,0.85)',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid var(--accent-3)',
                      backdropFilter: 'blur(8px)',
                      whiteSpace: 'nowrap',
                      pointerEvents: 'none',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                    }}
                  >
                    <div style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#fff' }}>{trend.keyword}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--accent-3)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <TrendingUp size={10} />
                      {trend.growth}
                    </div>
                  </motion.div>
                )}
              </div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
