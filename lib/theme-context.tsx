import { createContext, useContext, type PropsWithChildren } from 'react';

import { defaultAppTheme, type AppTheme } from '@/constants/theme';

const ThemeContext = createContext<AppTheme>(defaultAppTheme);

export function AppThemeProvider({ children, value = defaultAppTheme }: PropsWithChildren<{ value?: AppTheme }>) {
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme() {
  return useContext(ThemeContext);
}
