"use client";

import React from 'react';
import { motion } from 'framer-motion';

interface BentoBoxProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}

export function BentoBox({ children, className = '', delay = 0 }: BentoBoxProps) {
  return (
    <motion.div 
      className={`glass-panel glow-border ${className}`}
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 30,
        delay: delay
      }}
      whileHover={{ y: -5 }}
      style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}
    >
      {children}
    </motion.div>
  );
}
