"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'dark' | 'light' | 'colorful';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  const saved = localStorage.getItem('niche-engine-theme') as Theme | null;
  return saved || 'dark';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setMounted(true);
      document.body.setAttribute('data-theme', theme);
      document.documentElement.style.colorScheme = theme === 'dark' ? 'dark' : 'light';
    });
    return () => cancelAnimationFrame(frame);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('niche-engine-theme', newTheme);
    document.body.setAttribute('data-theme', newTheme);
    document.documentElement.style.colorScheme = newTheme === 'dark' ? 'dark' : 'light';
  };

  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    return { theme: 'dark' as Theme, setTheme: () => {} };
  }
  return context;
}
