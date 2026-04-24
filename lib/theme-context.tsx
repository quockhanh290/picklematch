import { createContext, useContext, type PropsWithChildren } from 'react';

import { AppThemes, defaultAppTheme, type AppTheme, type AppThemeId } from '@/constants/theme';

const ThemeContext = createContext<AppTheme>(defaultAppTheme);

export function AppThemeProvider({
  children,
  value,
  themeId,
}: PropsWithChildren<{ value?: AppTheme; themeId?: AppThemeId }>) {
  const resolvedTheme = value ?? (themeId ? AppThemes[themeId] : defaultAppTheme)
  return <ThemeContext.Provider value={resolvedTheme}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  return useContext(ThemeContext);
}
