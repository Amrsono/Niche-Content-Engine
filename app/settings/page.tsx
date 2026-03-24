"use client";
export const dynamic = 'force-dynamic';

import React from 'react';
import { FloatingNav } from '../components/FloatingNav';
import { useTheme, Theme } from '../components/ThemeProvider';
import styles from './settings.module.css';
import { motion } from 'framer-motion';
import { CheckCircle2, Moon, Sun, Sparkles } from 'lucide-react';
import { useUser } from '@clerk/nextjs';

const THEMES: { id: Theme; label: string; description: string; icon: React.ReactNode; preview: { bg: string; card: string; accent: string; text: string } }[] = [
  {
    id: 'dark',
    label: 'Deep Space',
    description: 'Dark, minimal, cinematic. The default immersive experience.',
    icon: <Moon size={22} />,
    preview: {
      bg: 'linear-gradient(135deg, #030508, #0d1117)',
      card: 'rgba(20, 25, 35, 0.8)',
      accent: '#00f0ff',
      text: '#f4f7fa',
    },
  },
  {
    id: 'light',
    label: 'Cloud',
    description: 'Clean, airy, with soft floating edges. Perfect for daytime reading.',
    icon: <Sun size={22} />,
    preview: {
      bg: 'linear-gradient(135deg, #f8fafc, #e0e7ff)',
      card: 'rgba(255, 255, 255, 0.9)',
      accent: '#3b82f6',
      text: '#0f172a',
    },
  },
  {
    id: 'colorful',
    label: 'Aurora',
    description: 'Vibrant, energetic gradients. A pop of color and personality.',
    icon: <Sparkles size={22} />,
    preview: {
      bg: 'linear-gradient(135deg, #eef2ff, #fdf4ff)',
      card: 'rgba(255, 255, 255, 0.65)',
      accent: '#d946ef',
      text: '#1e1b4b',
    },
  },
];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { isSignedIn, isLoaded } = useUser();

  if (isLoaded && !isSignedIn) {
    return (
      <main className={styles.main}>
        <FloatingNav />
        <div className={styles.unauthorized}>
          <h2>Access Restricted</h2>
          <p>Please sign in to access Settings.</p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.main}>
      <FloatingNav />
      <div className={styles.container}>
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1>Settings</h1>
          <p>Personalize your NicheEngine experience.</p>
        </motion.div>

        <motion.section
          className={styles.section}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <h2 className={styles.sectionTitle}>Color Theme</h2>
          <p className={styles.sectionSubtitle}>Choose a visual style for the entire application.</p>
          <div className={styles.themeGrid}>
            {THEMES.map(({ id, label, description, icon, preview }) => {
              const isActive = theme === id;
              return (
                <motion.button
                  key={id}
                  className={`${styles.themeCard} ${isActive ? styles.activeCard : ''}`}
                  onClick={() => setTheme(id)}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  {/* Theme Preview */}
                  <div className={styles.preview} style={{ background: preview.bg }}>
                    <div className={styles.previewCard} style={{ background: preview.card, borderColor: `${preview.accent}55` }}>
                      <div className={styles.previewBar} style={{ background: preview.accent }} />
                      <div className={styles.previewLine} style={{ background: preview.text, opacity: 0.5 }} />
                      <div className={styles.previewLine} style={{ background: preview.text, opacity: 0.3, width: '60%' }} />
                    </div>
                  </div>

                  {/* Theme Info */}
                  <div className={styles.themeInfo}>
                    <div className={styles.themeIcon} style={{ color: preview.accent }}>
                      {icon}
                    </div>
                    <div className={styles.themeMeta}>
                      <span className={styles.themeName}>{label}</span>
                      <span className={styles.themeDesc}>{description}</span>
                    </div>
                    {isActive && (
                      <div className={styles.activeCheck}>
                        <CheckCircle2 size={18} color={preview.accent} />
                      </div>
                    )}
                  </div>

                  {isActive && (
                    <div className={styles.activeBorder} style={{ background: `linear-gradient(135deg, ${preview.accent}, transparent)` }} />
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.section>
      </div>
    </main>
  );
}
