"use client";
export const dynamic = 'force-dynamic';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FloatingNav } from '../components/FloatingNav';
import { useTheme, Theme } from '../components/ThemeProvider';
import styles from './settings.module.css';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  Moon, 
  Sun, 
  Sparkles, 
  Key, 
  Eye, 
  EyeOff, 
  Save, 
  Zap, 
  AlertCircle, 
  Loader2 
} from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { isUserAdmin } from '@/lib/env';

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
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

  const userEmail = user?.primaryEmailAddress?.emailAddress;
  const isAdmin = Boolean(isSignedIn && isUserAdmin(userEmail));

  // Gemini API Key State
  const [geminiKeyInput, setGeminiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [maskedKey, setMaskedKey] = useState('');
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isLoaded && !isAdmin) {
      router.push("/blog");
    }
  }, [isLoaded, isAdmin, router]);

  useEffect(() => {
    if (isAdmin) {
      fetch('/api/settings/gemini')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setConfigured(data.configured);
            setMaskedKey(data.maskedKey || '');
          }
        })
        .catch(() => {
          // Ignore error on fetch
        })
        .finally(() => {
          setIsLoadingConfig(false);
        });
    }
  }, [isAdmin]);

  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!geminiKeyInput.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid Gemini API key.' });
      return;
    }

    setIsSaving(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/settings/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: geminiKeyInput.trim() }),
      });
      const data = await res.json();

      if (data.success) {
        setConfigured(data.configured);
        setMaskedKey(data.maskedKey || '');
        setGeminiKeyInput('');
        setStatusMessage({ type: 'success', text: 'Gemini API key saved successfully!' });
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed to save Gemini API key.' });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'An unexpected network error occurred while saving.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestKey = async () => {
    setIsTesting(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/settings/gemini/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: geminiKeyInput.trim() || undefined }),
      });
      const data = await res.json();

      if (data.success) {
        setStatusMessage({ type: 'success', text: data.message || 'Connected to Gemini API successfully!' });
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Failed connection test.' });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'An unexpected error occurred during API test.' });
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoaded && !isAdmin) {
    return null;
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

        {/* Gemini API Key Admin Section */}
        {isAdmin && (
          <motion.section
            className={styles.section}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className={styles.sectionTitle}>Gemini AI Configuration</h2>
            <p className={styles.sectionSubtitle}>Manage and verify your Google Gemini API Key for content generation.</p>
            
            <div className={styles.adminCard}>
              <div className={styles.adminCardHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Key size={20} color="var(--accent-1)" />
                  <span style={{ fontWeight: 600 }}>Gemini API Key</span>
                </div>
                {!isLoadingConfig && (
                  <span className={`${styles.keyStatus} ${configured ? styles.statusActive : styles.statusInactive}`}>
                    {configured ? (
                      <>
                        <CheckCircle2 size={14} /> Configured
                      </>
                    ) : (
                      <>
                        <AlertCircle size={14} /> Not Set
                      </>
                    )}
                  </span>
                )}
              </div>

              {configured && maskedKey && (
                <div>
                  <span style={{ fontSize: '0.85rem', opacity: 0.6, marginRight: '8px' }}>Active Key:</span>
                  <span className={styles.maskedKeyText}>{maskedKey}</span>
                </div>
              )}

              <form onSubmit={handleSaveKey} className={styles.inputWrapper}>
                <label className={styles.inputLabel} htmlFor="gemini-key-input">
                  {configured ? 'Update Gemini API Key' : 'Enter Gemini API Key'}
                </label>
                <div className={styles.inputGroup}>
                  <input
                    id="gemini-key-input"
                    type={showKey ? 'text' : 'password'}
                    className={styles.inputField}
                    placeholder="AIzaSy..."
                    value={geminiKeyInput}
                    onChange={(e) => setGeminiKeyInput(e.target.value)}
                    disabled={isSaving || isTesting}
                  />
                  <button
                    type="button"
                    className={styles.toggleBtn}
                    onClick={() => setShowKey(!showKey)}
                    title={showKey ? 'Hide key' : 'Show key'}
                  >
                    {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <div className={styles.buttonGroup} style={{ marginTop: '12px' }}>
                  <button
                    type="submit"
                    className={styles.saveBtn}
                    disabled={isSaving || isTesting || !geminiKeyInput.trim()}
                  >
                    {isSaving ? <Loader2 size={16} className={styles.spinner} /> : <Save size={16} />}
                    {isSaving ? 'Saving...' : 'Save Key'}
                  </button>

                  <button
                    type="button"
                    className={styles.testBtn}
                    onClick={handleTestKey}
                    disabled={isSaving || isTesting || (!geminiKeyInput.trim() && !configured)}
                  >
                    {isTesting ? <Loader2 size={16} className={styles.spinner} /> : <Zap size={16} color="var(--accent-1)" />}
                    {isTesting ? 'Testing Connection...' : 'Test Connection'}
                  </button>
                </div>
              </form>

              {statusMessage && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={statusMessage.type === 'success' ? styles.statusAlertSuccess : styles.statusAlertError}
                >
                  {statusMessage.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                  <span>{statusMessage.text}</span>
                </motion.div>
              )}
            </div>
          </motion.section>
        )}

        {/* Color Theme Section */}
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
