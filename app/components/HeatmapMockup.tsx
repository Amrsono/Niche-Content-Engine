"use client";
import React from 'react';
import { Map, Flame } from 'lucide-react';
import { motion } from 'framer-motion';

export function HeatmapMockup() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: '300px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <Map size={20} color="var(--accent-3)" />
        <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Global Trend Heatmap</h3>
      </div>
      
      <div style={{ 
        flex: 1, 
        position: 'relative', 
        background: 'rgba(255,255,255,0.02)', 
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.05)'
      }}>
        {/* Mock Map Background Grid */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 50%, rgba(255,0,85,0.1) 0%, transparent 60%)',
          display: 'grid',
          gridTemplateColumns: 'repeat(12, 1fr)',
          gridTemplateRows: 'repeat(8, 1fr)',
          opacity: 0.3
        }}>
          {Array.from({ length: 96 }).map((_, i) => (
            <div key={i} style={{ border: '1px solid rgba(255,255,255,0.1)' }} />
          ))}
        </div>

        {/* Mock Hotspots */}
        {[
          { top: '30%', left: '25%', size: 40, delay: 0 },
          { top: '45%', left: '60%', size: 60, delay: 0.5 },
          { top: '70%', left: '80%', size: 30, delay: 1 },
          { top: '20%', left: '75%', size: 50, delay: 0.2 },
        ].map((spot, i) => (
          <motion.div
            key={i}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 3, repeat: Infinity, delay: spot.delay }}
            style={{
              position: 'absolute',
              top: spot.top,
              left: spot.left,
              width: spot.size,
              height: spot.size,
              background: 'radial-gradient(circle, var(--accent-3) 0%, transparent 70%)',
              borderRadius: '50%',
              transform: 'translate(-50%, -50%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: `0 0 ${spot.size}px var(--accent-3)`
            }}
          >
            <Flame size={spot.size / 3} color="#fff" style={{ opacity: 0.8 }} />
          </motion.div>
        ))}
      </div>
    </div>
  );
}
