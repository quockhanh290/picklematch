/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export type AppTheme = {
  id: string;
  name: string;
  background: string;
  backgroundMuted: string;
  surface: string;
  surfaceAlt: string;
  surfaceMuted: string;
  border: string;
  borderStrong: string;
  text: string;
  textMuted: string;
  textSoft: string;
  primary: string;
  primaryStrong: string;
  primarySoft: string;
  primaryContrast: string;
  accent: string;
  success: string;
  warning: string;
  warningSoft: string;
  danger: string;
  dangerSoft: string;
  info: string;
  infoSoft: string;
  shadow: string;
  radiusSm: number;
  radiusMd: number;
  radiusLg: number;
};

export const AppThemes: Record<'neutralGreen', AppTheme> = {
  neutralGreen: {
    id: 'neutralGreen',
    name: 'Editorial Neutral + Brand Green',
    background: '#f8fafc',
    backgroundMuted: '#f7f5ef',
    surface: '#ffffff',
    surfaceAlt: '#f1f5f9',
    surfaceMuted: '#f8fafc',
    border: '#e2e8f0',
    borderStrong: '#cbd5e1',
    text: '#0f172a',
    textMuted: '#64748b',
    textSoft: '#94a3b8',
    primary: '#059669',
    primaryStrong: '#047857',
    primarySoft: '#ecfdf5',
    primaryContrast: '#ffffff',
    accent: '#bef264',
    success: '#16a34a',
    warning: '#f59e0b',
    warningSoft: '#fffbeb',
    danger: '#e11d48',
    dangerSoft: '#fff1f2',
    info: '#4f46e5',
    infoSoft: '#eef2ff',
    shadow: '#0f172a',
    radiusSm: 18,
    radiusMd: 28,
    radiusLg: 32,
  },
};

export const defaultAppTheme = AppThemes.neutralGreen;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
