"use client";

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { UserButton, SignInButton, useUser } from '@clerk/nextjs';
import styles from './FloatingNav.module.css';

export function FloatingNav() {
  const { isSignedIn, isLoaded } = useUser();

  return (
    <motion.nav 
      className={styles.navContainer}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 20 }}
    >
      <div className={styles.logo}>
        <span className={styles.pulseDot} />
        NicheEngine
      </div>
      
      <div className={styles.links}>
        {isSignedIn && <Link href="/" className={styles.link}>Dashboard</Link>}
        <Link href="/blog" className={styles.link}>Pulse Blog</Link>
        <Link href="/about" className={styles.link}>About</Link>
        <Link href="/contact" className={styles.link}>Contact</Link>
        {isSignedIn && (
          <>
            <Link href="/analytics" className={styles.link}>Analytics</Link>
            <Link href="/history" className={styles.link} style={{ color: '#a78bfa' }}>History</Link>
            <Link href="/diagnostic" className={styles.link} style={{ color: 'var(--accent-1)' }}>Diagnostic</Link>
            <Link href="/settings" className={styles.link} style={{ color: 'var(--accent-3)' }}>Settings</Link>
          </>
        )}
      </div>

      <div className={styles.auth}>
        {isLoaded && isSignedIn && (
          <UserButton appearance={{ elements: { userButtonAvatarBox: styles.avatar } }}/>
        )}
        {isLoaded && !isSignedIn && (
          <SignInButton mode="modal">
            <button className={styles.signInBtn}>Login</button>
          </SignInButton>
        )}
      </div>
    </motion.nav>
  );
}
