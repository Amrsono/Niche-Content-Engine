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
  Loader2,
  Share2,
  Cpu,
  RefreshCw
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

  // --- Gemini API Key State ---
  const [geminiKeyInput, setGeminiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [geminiConfigured, setGeminiConfigured] = useState(false);
  const [maskedGeminiKey, setMaskedGeminiKey] = useState('');
  const [isSavingGemini, setIsSavingGemini] = useState(false);
  const [isTestingGemini, setIsTestingGemini] = useState(false);
  const [geminiStatus, setGeminiStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // --- Social Settings State (Facebook & Instagram) ---
  const [fbTokenInput, setFbTokenInput] = useState('');
  const [showFbToken, setShowFbToken] = useState(false);
  const [fbPageIdInput, setFbPageIdInput] = useState('');
  const [igAccountIdInput, setIgAccountIdInput] = useState('');
  const [fbConfigured, setFbConfigured] = useState(false);
  const [maskedFbToken, setMaskedFbToken] = useState('');
  const [isSavingSocial, setIsSavingSocial] = useState(false);
  const [isTestingSocial, setIsTestingSocial] = useState(false);
  const [socialStatus, setSocialStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // --- Ollama Settings State ---
  const [ollamaEnabled, setOllamaEnabled] = useState(true);
  const [ollamaBaseUrl, setOllamaBaseUrl] = useState('http://localhost:11434');
  const [ollamaModel, setOllamaModel] = useState('llama3.2:latest');
  const [ollamaAvailable, setOllamaAvailable] = useState(false);
  const [ollamaModelsList, setOllamaModelsList] = useState<string[]>([]);
  const [isSavingOllama, setIsSavingOllama] = useState(false);
  const [isTestingOllama, setIsTestingOllama] = useState(false);
  const [ollamaStatus, setOllamaStatus] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (isLoaded && !isAdmin) {
      router.push("/blog");
    }
  }, [isLoaded, isAdmin, router]);

  // Load configs on mount
  useEffect(() => {
    if (isAdmin) {
      // 1. Fetch Gemini Settings
      fetch('/api/settings/gemini')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setGeminiConfigured(data.configured);
            setMaskedGeminiKey(data.maskedKey || '');
          }
        })
        .catch(() => {});

      // 2. Fetch Social Settings
      fetch('/api/settings/social')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setFbConfigured(data.facebookConfigured);
            setMaskedFbToken(data.maskedFacebookToken || '');
            if (data.facebookPageId) setFbPageIdInput(data.facebookPageId);
            if (data.instagramAccountId) setIgAccountIdInput(data.instagramAccountId);
          }
        })
        .catch(() => {});

      // 3. Fetch Ollama Settings
      fetch('/api/settings/ollama')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setOllamaAvailable(data.isAvailable);
            setOllamaEnabled(data.enabled);
            if (data.baseUrl) setOllamaBaseUrl(data.baseUrl);
            if (data.activeModel) setOllamaModel(data.activeModel);
            if (data.models && data.models.length > 0) setOllamaModelsList(data.models);
          }
        })
        .catch(() => {});
    }
  }, [isAdmin]);

  // --- Handlers: Gemini ---
  const handleSaveGeminiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!geminiKeyInput.trim()) {
      setGeminiStatus({ type: 'error', text: 'Please enter a valid Gemini API key.' });
      return;
    }
    setIsSavingGemini(true);
    setGeminiStatus(null);
    try {
      const res = await fetch('/api/settings/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: geminiKeyInput.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setGeminiConfigured(data.configured);
        setMaskedGeminiKey(data.maskedKey || '');
        setGeminiKeyInput('');
        setGeminiStatus({ type: 'success', text: 'Gemini API key saved successfully!' });
      } else {
        setGeminiStatus({ type: 'error', text: data.error || 'Failed to save key.' });
      }
    } catch {
      setGeminiStatus({ type: 'error', text: 'Network error occurred while saving.' });
    } finally {
      setIsSavingGemini(false);
    }
  };

  const handleTestGeminiKey = async () => {
    setIsTestingGemini(true);
    setGeminiStatus(null);
    try {
      const res = await fetch('/api/settings/gemini/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: geminiKeyInput.trim() || undefined }),
      });
      const data = await res.json();
      if (data.success) {
        setGeminiStatus({ type: 'success', text: data.message || 'Connected to Gemini successfully!' });
      } else {
        setGeminiStatus({ type: 'error', text: data.error || 'Failed connection test.' });
      }
    } catch {
      setGeminiStatus({ type: 'error', text: 'Error occurred during test.' });
    } finally {
      setIsTestingGemini(false);
    }
  };

  // --- Handlers: Social (Facebook & Instagram) ---
  const handleSaveSocial = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSocial(true);
    setSocialStatus(null);
    try {
      const res = await fetch('/api/settings/social', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facebookToken: fbTokenInput.trim() || undefined,
          facebookPageId: fbPageIdInput.trim() || undefined,
          instagramAccountId: igAccountIdInput.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFbConfigured(data.facebookConfigured);
        if (data.maskedFacebookToken) setMaskedFbToken(data.maskedFacebookToken);
        setFbTokenInput('');
        setSocialStatus({ type: 'success', text: 'Facebook & Instagram credentials saved!' });
      } else {
        setSocialStatus({ type: 'error', text: data.error || 'Failed to save credentials.' });
      }
    } catch {
      setSocialStatus({ type: 'error', text: 'Network error while saving social settings.' });
    } finally {
      setIsSavingSocial(false);
    }
  };

  const handleTestSocial = async () => {
    setIsTestingSocial(true);
    setSocialStatus(null);
    try {
      const res = await fetch('/api/settings/social/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facebookToken: fbTokenInput.trim() || undefined,
          facebookPageId: fbPageIdInput.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSocialStatus({ type: 'success', text: data.message });
      } else {
        setSocialStatus({ type: 'error', text: data.error || 'Social connection test failed.' });
      }
    } catch {
      setSocialStatus({ type: 'error', text: 'Error connecting to Facebook API.' });
    } finally {
      setIsTestingSocial(false);
    }
  };

  // --- Handlers: Ollama ---
  const handleSaveOllama = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingOllama(true);
    setOllamaStatus(null);
    try {
      const res = await fetch('/api/settings/ollama', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: ollamaEnabled,
          baseUrl: ollamaBaseUrl.trim(),
          model: ollamaModel.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setOllamaStatus({ type: 'success', text: 'Ollama settings saved successfully!' });
      } else {
        setOllamaStatus({ type: 'error', text: data.error || 'Failed to save Ollama settings.' });
      }
    } catch {
      setOllamaStatus({ type: 'error', text: 'Network error while saving Ollama settings.' });
    } finally {
      setIsSavingOllama(false);
    }
  };

  const handleTestOllama = async () => {
    setIsTestingOllama(true);
    setOllamaStatus(null);
    try {
      const res = await fetch('/api/settings/ollama/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: ollamaModel.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setOllamaStatus({ type: 'success', text: data.message });
        setOllamaAvailable(true);
      } else {
        setOllamaStatus({ type: 'error', text: data.error || 'Ollama test failed.' });
      }
    } catch {
      setOllamaStatus({ type: 'error', text: 'Could not connect to Ollama test endpoint.' });
    } finally {
      setIsTestingOllama(false);
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
          <p>Personalize your NicheEngine engine, social channels, and AI providers.</p>
        </motion.div>

        {/* ============================================================ */}
        {/* Local Ollama AI Card */}
        {/* ============================================================ */}
        {isAdmin && (
          <motion.section
            className={styles.section}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className={styles.sectionTitle}>Local Ollama AI (Zero Cost Generation)</h2>
            <p className={styles.sectionSubtitle}>
              Run unlimited article generation on your local machine using Ollama with zero API fees.
            </p>

            <div className={styles.adminCard}>
              <div className={styles.adminCardHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Cpu size={20} color="var(--accent-1)" />
                  <span style={{ fontWeight: 600 }}>Local Ollama Engine</span>
                </div>
                <span className={`${styles.keyStatus} ${ollamaAvailable ? styles.statusActive : styles.statusInactive}`}>
                  {ollamaAvailable ? (
                    <>
                      <CheckCircle2 size={14} /> Service Online
                    </>
                  ) : (
                    <>
                      <AlertCircle size={14} /> Offline / Not Detected
                    </>
                  )}
                </span>
              </div>

              <form onSubmit={handleSaveOllama} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <label className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={ollamaEnabled}
                    onChange={(e) => setOllamaEnabled(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: 'var(--accent-1)', cursor: 'pointer' }}
                  />
                  <span>Enable Local Ollama (Primary priority before cloud fallback)</span>
                </label>

                <div className={styles.grid2Col}>
                  <div className={styles.inputWrapper}>
                    <label className={styles.inputLabel} htmlFor="ollama-model-input">
                      Select Model
                    </label>
                    {ollamaModelsList.length > 0 ? (
                      <select
                        id="ollama-model-input"
                        className={styles.selectField}
                        value={ollamaModel}
                        onChange={(e) => setOllamaModel(e.target.value)}
                      >
                        {ollamaModelsList.map((m) => (
                          <option key={m} value={m} style={{ background: '#0f172a' }}>
                            {m}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id="ollama-model-input"
                        type="text"
                        className={styles.inputField}
                        placeholder="llama3.2:latest"
                        value={ollamaModel}
                        onChange={(e) => setOllamaModel(e.target.value)}
                      />
                    )}
                  </div>

                  <div className={styles.inputWrapper}>
                    <label className={styles.inputLabel} htmlFor="ollama-url-input">
                      Ollama Endpoint URL
                    </label>
                    <input
                      id="ollama-url-input"
                      type="text"
                      className={styles.inputField}
                      placeholder="http://localhost:11434"
                      value={ollamaBaseUrl}
                      onChange={(e) => setOllamaBaseUrl(e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.buttonGroup}>
                  <button
                    type="submit"
                    className={styles.saveBtn}
                    disabled={isSavingOllama || isTestingOllama}
                  >
                    {isSavingOllama ? <Loader2 size={16} className={styles.spinner} /> : <Save size={16} />}
                    {isSavingOllama ? 'Saving...' : 'Save Ollama Settings'}
                  </button>

                  <button
                    type="button"
                    className={styles.testBtn}
                    onClick={handleTestOllama}
                    disabled={isSavingOllama || isTestingOllama}
                  >
                    {isTestingOllama ? <Loader2 size={16} className={styles.spinner} /> : <Zap size={16} color="var(--accent-1)" />}
                    {isTestingOllama ? 'Testing Model...' : 'Test Ollama Prompt'}
                  </button>
                </div>
              </form>

              {ollamaStatus && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={ollamaStatus.type === 'success' ? styles.statusAlertSuccess : styles.statusAlertError}
                >
                  {ollamaStatus.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                  <span>{ollamaStatus.text}</span>
                </motion.div>
              )}
            </div>
          </motion.section>
        )}

        {/* ============================================================ */}
        {/* Facebook & Instagram Social Integration Card */}
        {/* ============================================================ */}
        {isAdmin && (
          <motion.section
            className={styles.section}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
          >
            <h2 className={styles.sectionTitle}>Facebook & Instagram Integration</h2>
            <p className={styles.sectionSubtitle}>
              Update your Page Access Token anytime it expires to automate social sharing and drive bot & reader traffic.
            </p>

            <div className={styles.adminCard}>
              <div className={styles.adminCardHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Share2 size={20} color="var(--accent-1)" />
                  <span style={{ fontWeight: 600 }}>Meta Social API Credentials</span>
                </div>
                <span className={`${styles.keyStatus} ${fbConfigured ? styles.statusActive : styles.statusInactive}`}>
                  {fbConfigured ? (
                    <>
                      <CheckCircle2 size={14} /> Ready to Post
                    </>
                  ) : (
                    <>
                      <AlertCircle size={14} /> Missing Credentials
                    </>
                  )}
                </span>
              </div>

              {fbConfigured && maskedFbToken && (
                <div>
                  <span style={{ fontSize: '0.85rem', opacity: 0.6, marginRight: '8px' }}>Active Access Token:</span>
                  <span className={styles.maskedKeyText}>{maskedFbToken}</span>
                </div>
              )}

              <form onSubmit={handleSaveSocial} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className={styles.inputWrapper}>
                  <label className={styles.inputLabel} htmlFor="fb-token-input">
                    {fbConfigured ? 'Update Facebook Page Access Token' : 'Enter Facebook Page Access Token'}
                  </label>
                  <div className={styles.inputGroup}>
                    <input
                      id="fb-token-input"
                      type={showFbToken ? 'text' : 'password'}
                      className={styles.inputField}
                      placeholder="EAA..."
                      value={fbTokenInput}
                      onChange={(e) => setFbTokenInput(e.target.value)}
                      disabled={isSavingSocial || isTestingSocial}
                    />
                    <button
                      type="button"
                      className={styles.toggleBtn}
                      onClick={() => setShowFbToken(!showFbToken)}
                      title={showFbToken ? 'Hide token' : 'Show token'}
                    >
                      {showFbToken ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className={styles.grid2Col}>
                  <div className={styles.inputWrapper}>
                    <label className={styles.inputLabel} htmlFor="fb-pageid-input">
                      Facebook Page ID
                    </label>
                    <input
                      id="fb-pageid-input"
                      type="text"
                      className={styles.inputField}
                      placeholder="e.g. 61578555009232"
                      value={fbPageIdInput}
                      onChange={(e) => setFbPageIdInput(e.target.value)}
                    />
                  </div>

                  <div className={styles.inputWrapper}>
                    <label className={styles.inputLabel} htmlFor="ig-account-input">
                      Instagram Business Account ID (Optional)
                    </label>
                    <input
                      id="ig-account-input"
                      type="text"
                      className={styles.inputField}
                      placeholder="e.g. 178414..."
                      value={igAccountIdInput}
                      onChange={(e) => setIgAccountIdInput(e.target.value)}
                    />
                  </div>
                </div>

                <div className={styles.buttonGroup}>
                  <button
                    type="submit"
                    className={styles.saveBtn}
                    disabled={isSavingSocial || isTestingSocial}
                  >
                    {isSavingSocial ? <Loader2 size={16} className={styles.spinner} /> : <Save size={16} />}
                    {isSavingSocial ? 'Saving...' : 'Save Credentials'}
                  </button>

                  <button
                    type="button"
                    className={styles.testBtn}
                    onClick={handleTestSocial}
                    disabled={isSavingSocial || isTestingSocial}
                  >
                    {isTestingSocial ? <Loader2 size={16} className={styles.spinner} /> : <Zap size={16} color="var(--accent-1)" />}
                    {isTestingSocial ? 'Testing...' : 'Verify Token & Page'}
                  </button>
                </div>
              </form>

              {socialStatus && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={socialStatus.type === 'success' ? styles.statusAlertSuccess : styles.statusAlertError}
                >
                  {socialStatus.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                  <span>{socialStatus.text}</span>
                </motion.div>
              )}
            </div>
          </motion.section>
        )}

        {/* ============================================================ */}
        {/* Gemini API Key Admin Section */}
        {/* ============================================================ */}
        {isAdmin && (
          <motion.section
            className={styles.section}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <h2 className={styles.sectionTitle}>Gemini Cloud AI Fallback</h2>
            <p className={styles.sectionSubtitle}>Manage your Google Gemini API Key for fallback content generation.</p>
            
            <div className={styles.adminCard}>
              <div className={styles.adminCardHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Key size={20} color="var(--accent-1)" />
                  <span style={{ fontWeight: 600 }}>Gemini API Key</span>
                </div>
                <span className={`${styles.keyStatus} ${geminiConfigured ? styles.statusActive : styles.statusInactive}`}>
                  {geminiConfigured ? (
                    <>
                      <CheckCircle2 size={14} /> Configured
                    </>
                  ) : (
                    <>
                      <AlertCircle size={14} /> Not Set
                    </>
                  )}
                </span>
              </div>

              {geminiConfigured && maskedGeminiKey && (
                <div>
                  <span style={{ fontSize: '0.85rem', opacity: 0.6, marginRight: '8px' }}>Active Key:</span>
                  <span className={styles.maskedKeyText}>{maskedGeminiKey}</span>
                </div>
              )}

              <form onSubmit={handleSaveGeminiKey} className={styles.inputWrapper}>
                <label className={styles.inputLabel} htmlFor="gemini-key-input">
                  {geminiConfigured ? 'Update Gemini API Key' : 'Enter Gemini API Key'}
                </label>
                <div className={styles.inputGroup}>
                  <input
                    id="gemini-key-input"
                    type={showKey ? 'text' : 'password'}
                    className={styles.inputField}
                    placeholder="AIzaSy..."
                    value={geminiKeyInput}
                    onChange={(e) => setGeminiKeyInput(e.target.value)}
                    disabled={isSavingGemini || isTestingGemini}
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
                    disabled={isSavingGemini || isTestingGemini || !geminiKeyInput.trim()}
                  >
                    {isSavingGemini ? <Loader2 size={16} className={styles.spinner} /> : <Save size={16} />}
                    {isSavingGemini ? 'Saving...' : 'Save Key'}
                  </button>

                  <button
                    type="button"
                    className={styles.testBtn}
                    onClick={handleTestGeminiKey}
                    disabled={isSavingGemini || isTestingGemini || (!geminiKeyInput.trim() && !geminiConfigured)}
                  >
                    {isTestingGemini ? <Loader2 size={16} className={styles.spinner} /> : <Zap size={16} color="var(--accent-1)" />}
                    {isTestingGemini ? 'Testing Connection...' : 'Test Connection'}
                  </button>
                </div>
              </form>

              {geminiStatus && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={geminiStatus.type === 'success' ? styles.statusAlertSuccess : styles.statusAlertError}
                >
                  {geminiStatus.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                  <span>{geminiStatus.text}</span>
                </motion.div>
              )}
            </div>
          </motion.section>
        )}

        {/* ============================================================ */}
        {/* Color Theme Section */}
        {/* ============================================================ */}
        <motion.section
          className={styles.section}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
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
