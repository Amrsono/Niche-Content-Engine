"use client";
import React from 'react';
import { DollarSign, TrendingUp, ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';

export function EarningsAnalytics() {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '300px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--foreground)' }}>Earnings Analytics</h3>
        <TrendingUp size={20} color="var(--accent-1)" />
      </div>

      <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
        <motion.div 
          whileHover={{ scale: 1.05 }}
          style={{ flex: 1, background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '16px', borderTop: '2px solid var(--accent-1)', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a0aab5', marginBottom: '8px', fontSize: '0.9rem' }}>
            <DollarSign size={16} color="var(--accent-1)" /> AdSense
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>$142.50</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--accent-1)' }}>+12.4% today</div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.05 }}
          style={{ flex: 1, background: 'rgba(255,255,255,0.03)', borderRadius: '16px', padding: '16px', borderTop: '2px solid var(--accent-3)', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#a0aab5', marginBottom: '8px', fontSize: '0.9rem' }}>
            <ShoppingCart size={16} color="var(--accent-3)" /> Affiliates
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800 }}>$89.00</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--accent-3)' }}>14 clicks</div>
        </motion.div>
      </div>

      <div style={{ marginTop: '24px', flex: 1, background: 'rgba(0,0,0,0.4)', borderRadius: '12px', display: 'flex', alignItems: 'flex-end', padding: '16px', gap: '8px' }}>
        {/* Mock bar chart */}
        {[30, 50, 45, 80, 60, 100, 85].map((h, i) => (
          <motion.div 
            key={i}
            initial={{ height: 0 }}
            animate={{ height: `${h}%` }}
            transition={{ type: "spring", stiffness: 100, delay: i * 0.1 }}
            style={{ 
              flex: 1, 
              background: `linear-gradient(180deg, var(--accent-1) 0%, rgba(0,240,255,0.2) 100%)`, 
              borderRadius: '6px 6px 0 0',
              opacity: i === 6 ? 1 : 0.6
            }}
          />
        ))}
      </div>
    </div>
  );
}
