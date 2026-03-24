"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'dark' | 'light' | 'colorful';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem('niche-engine-theme') as Theme;
    if (savedTheme) {
      setThemeState(savedTheme);
      document.body.setAttribute('data-theme', savedTheme);
      document.documentElement.style.colorScheme = savedTheme === 'dark' ? 'dark' : 'light';
    } else {
      document.body.setAttribute('data-theme', 'dark');
      document.documentElement.style.colorScheme = 'dark';
    }
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('niche-engine-theme', newTheme);
    document.body.setAttribute('data-theme', newTheme);
    document.documentElement.style.colorScheme = newTheme === 'dark' ? 'dark' : 'light';
  };

  // To prevent hydration mismatch, we strictly render the provider
  // The layout will flash white/dark momentarily if not using a head script, 
  // but this ensures full React consistency.
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
    // Safe fallback during SSR/static generation
    return { theme: 'dark' as Theme, setTheme: (_: Theme) => {} };
  }
  return context;
}
