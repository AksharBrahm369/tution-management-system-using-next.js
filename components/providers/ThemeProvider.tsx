'use client';

import { ThemeProvider as NextThemesProvider, type ThemeProviderProps } from 'next-themes';
import { ReactNode, Suspense } from 'react';

interface CustomThemeProviderProps extends Omit<ThemeProviderProps, 'children'> {
  children: ReactNode;
}

function ThemeProviderInner({ children, ...props }: CustomThemeProviderProps) {
  return (
    <NextThemesProvider {...props}>
      {children}
    </NextThemesProvider>
  );
}

export function ThemeProvider({ children, ...props }: CustomThemeProviderProps) {
  return (
    <Suspense fallback={<>{children}</>}>
      <ThemeProviderInner {...props}>
        {children}
      </ThemeProviderInner>
    </Suspense>
  );
}
