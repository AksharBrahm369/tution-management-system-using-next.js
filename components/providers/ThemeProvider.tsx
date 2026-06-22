'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useSyncExternalStore } from 'react';

type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

interface CustomThemeProviderProps {
  children: ReactNode;
  attribute?: 'class';
  defaultTheme?: Theme;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
}

const THEME_STORAGE_KEY = 'tuitionpro-theme';
const THEME_CHANGE_EVENT = 'tuitionpro-theme-change';

const globalForTheme = globalThis as unknown as {
  ThemeContext: any;
};

const ThemeContext =
  globalForTheme.ThemeContext ??
  (globalForTheme.ThemeContext = createContext<ThemeContextValue | null>(null));

function getStoredTheme(defaultTheme: Theme): Theme {
  if (typeof window === 'undefined') return defaultTheme;
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  return stored === 'dark' || stored === 'light' || stored === 'system' ? stored : defaultTheme;
}

function getSystemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function resolveTheme(theme: Theme, enableSystem: boolean): ResolvedTheme {
  return theme === 'system' && enableSystem ? getSystemTheme() : theme === 'dark' ? 'dark' : 'light';
}

function subscribeToThemeChanges(onStoreChange: () => void) {
  if (typeof window === 'undefined') return () => {};

  const media = window.matchMedia('(prefers-color-scheme: dark)');
  window.addEventListener('storage', onStoreChange);
  window.addEventListener(THEME_CHANGE_EVENT, onStoreChange);
  media.addEventListener('change', onStoreChange);

  return () => {
    window.removeEventListener('storage', onStoreChange);
    window.removeEventListener(THEME_CHANGE_EVENT, onStoreChange);
    media.removeEventListener('change', onStoreChange);
  };
}

export function ThemeProvider({
  children,
  defaultTheme = 'light',
  enableSystem = false,
}: CustomThemeProviderProps) {
  const theme = useSyncExternalStore(
    subscribeToThemeChanges,
    () => getStoredTheme(defaultTheme),
    () => defaultTheme
  );
  const resolvedTheme = resolveTheme(theme, enableSystem);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
  }, [resolvedTheme]);

  const setTheme = useCallback((nextTheme: Theme) => {
    window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
  }, []);

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }
  return value;
}
