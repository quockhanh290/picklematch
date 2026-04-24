export type ProfileThemeColors = {
  surfaceContainerHigh: string
  surfaceContainerLow: string
  inverseOnSurface: string
  secondaryFixed: string
  onSecondaryFixedVariant: string
  surfaceBright: string
  tertiary: string
  secondary: string
  onSecondaryFixed: string
  primaryContainer: string
  onError: string
  primaryFixed: string
  onPrimaryFixed: string
  tertiaryFixedDim: string
  background: string
  primaryFixedDim: string
  onBackground: string
  surfaceVariant: string
  surfaceContainer: string
  onErrorContainer: string
  inverseSurface: string
  surfaceDim: string
  surface: string
  onTertiaryContainer: string
  onPrimary: string
  outline: string
  onTertiaryFixed: string
  inversePrimary: string
  tertiaryContainer: string
  onPrimaryFixedVariant: string
  onTertiary: string
  error: string
  tertiaryFixed: string
  surfaceTint: string
  primary: string
  onSecondary: string
  secondaryContainer: string
  onSurfaceVariant: string
  onPrimaryContainer: string
  outlineVariant: string
  onSurface: string
  secondaryFixedDim: string
  surfaceContainerLowest: string
  surfaceContainerHighest: string
  onSecondaryContainer: string
  errorContainer: string
  onTertiaryFixedVariant: string
}

const FOREST_DEFAULT: ProfileThemeColors = {
  surfaceContainerHigh: '#e7e9e5',
  surfaceContainerLow: '#f2f4f1',
  inverseOnSurface: '#eff1ee',
  secondaryFixed: '#cfe8dc',
  onSecondaryFixedVariant: '#354b42',
  surfaceBright: '#f8faf6',
  tertiary: '#00352e',
  secondary: '#4c6359',
  onSecondaryFixed: '#091f18',
  primaryContainer: '#064e3b',
  onError: '#ffffff',
  primaryFixed: '#b0f0d6',
  onPrimaryFixed: '#002117',
  tertiaryFixedDim: '#7ad7c6',
  background: '#f8faf6',
  primaryFixedDim: '#95d3ba',
  onBackground: '#191c1b',
  surfaceVariant: '#e1e3e0',
  surfaceContainer: '#eceeeb',
  onErrorContainer: '#93000a',
  inverseSurface: '#2e312f',
  surfaceDim: '#d8dbd7',
  surface: '#f8faf6',
  onTertiaryContainer: '#65c2b1',
  onPrimary: '#ffffff',
  outline: '#707974',
  onTertiaryFixed: '#00201b',
  inversePrimary: '#95d3ba',
  tertiaryContainer: '#004e44',
  onPrimaryFixedVariant: '#0b513d',
  onTertiary: '#ffffff',
  error: '#ba1a1a',
  tertiaryFixed: '#96f3e1',
  surfaceTint: '#2b6954',
  primary: '#003527',
  onSecondary: '#ffffff',
  secondaryContainer: '#cce6d9',
  onSurfaceVariant: '#404944',
  onPrimaryContainer: '#80bea6',
  outlineVariant: '#bfc9c3',
  onSurface: '#191c1b',
  secondaryFixedDim: '#b3ccc0',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerHighest: '#e1e3e0',
  onSecondaryContainer: '#50685d',
  errorContainer: '#ffdad6',
  onTertiaryFixedVariant: '#005046',
}

export type ProfileThemeId = 'forest-default'

export const PROFILE_THEMES: Record<ProfileThemeId, ProfileThemeColors> = {
  'forest-default': FOREST_DEFAULT,
}

export const DEFAULT_PROFILE_THEME_ID: ProfileThemeId = 'forest-default'

export function getProfileThemeColors(themeId: ProfileThemeId = DEFAULT_PROFILE_THEME_ID): ProfileThemeColors {
  return PROFILE_THEMES[themeId]
}

// Backward-compatible export. Existing code can keep importing this constant.
export const PROFILE_THEME_COLORS = getProfileThemeColors()

export type ProfileThemeSemantic = {
  successBg: string
  successText: string
  warningBg: string
  warningText: string
  warningStrong: string
  infoBg: string
  infoText: string
  infoIcon: string
  dangerBg: string
  dangerText: string
  dangerStrong: string
  dangerBorderSoft: string
  dangerBorder: string
  dangerDeep: string
  overlay: string
}

const FOREST_DEFAULT_SEMANTIC: ProfileThemeSemantic = {
  successBg: '#dcfce7',
  successText: '#047857',
  warningBg: '#fef3c7',
  warningText: '#b45309',
  warningStrong: '#d97706',
  infoBg: '#e2e8f0',
  infoText: '#475569',
  infoIcon: '#64748b',
  dangerBg: '#ffe4e6',
  dangerText: '#be123c',
  dangerStrong: '#e11d48',
  dangerBorderSoft: '#fda4af',
  dangerBorder: '#f3b3b3',
  dangerDeep: '#7a1f1f',
  overlay: 'rgba(10, 20, 30, 0.45)',
}

export const PROFILE_THEME_SEMANTICS: Record<ProfileThemeId, ProfileThemeSemantic> = {
  'forest-default': FOREST_DEFAULT_SEMANTIC,
}

export function getProfileThemeSemantic(themeId: ProfileThemeId = DEFAULT_PROFILE_THEME_ID): ProfileThemeSemantic {
  return PROFILE_THEME_SEMANTICS[themeId]
}

export const PROFILE_THEME_SEMANTIC = getProfileThemeSemantic()

export type ProfileBadgeTone = 'emerald' | 'amber' | 'rose' | 'sky' | 'violet'

export function getCommunityFeedbackPalette(tone: 'positive' | 'negative', count: number) {
  const level = count >= 10 ? 'high' : count >= 6 ? 'medium' : 'low'

  if (tone === 'positive') {
    if (level === 'high') {
      return {
        backgroundColor: PROFILE_THEME_COLORS.primary,
        borderColor: PROFILE_THEME_COLORS.surfaceTint,
        textColor: PROFILE_THEME_COLORS.onPrimary,
        iconColor: PROFILE_THEME_COLORS.onPrimary,
      }
    }

    if (level === 'medium') {
      return {
        backgroundColor: PROFILE_THEME_COLORS.surfaceTint,
        borderColor: PROFILE_THEME_COLORS.primary,
        textColor: PROFILE_THEME_COLORS.onPrimary,
        iconColor: PROFILE_THEME_COLORS.onPrimary,
      }
    }

    return {
      backgroundColor: PROFILE_THEME_COLORS.primaryContainer,
      borderColor: PROFILE_THEME_COLORS.surfaceTint,
      textColor: PROFILE_THEME_COLORS.onPrimaryContainer,
      iconColor: PROFILE_THEME_COLORS.onPrimaryContainer,
    }
  }

  if (level === 'high') {
    return {
      backgroundColor: PROFILE_THEME_COLORS.onErrorContainer,
      borderColor: PROFILE_THEME_COLORS.error,
      textColor: PROFILE_THEME_COLORS.onError,
      iconColor: PROFILE_THEME_COLORS.onError,
    }
  }

  if (level === 'medium') {
    return {
      backgroundColor: PROFILE_THEME_COLORS.error,
      borderColor: PROFILE_THEME_COLORS.onErrorContainer,
      textColor: PROFILE_THEME_COLORS.onError,
      iconColor: PROFILE_THEME_COLORS.onError,
    }
  }

  return {
    backgroundColor: PROFILE_THEME_SEMANTIC.dangerDeep,
    borderColor: PROFILE_THEME_COLORS.error,
    textColor: PROFILE_THEME_COLORS.onError,
    iconColor: PROFILE_THEME_COLORS.onError,
  }
}

export function getTrophyBadgePalette(tone: ProfileBadgeTone) {
  switch (tone) {
    case 'emerald':
      return {
        card: PROFILE_THEME_COLORS.secondaryContainer,
        text: PROFILE_THEME_COLORS.surfaceTint,
        icon: PROFILE_THEME_COLORS.surfaceTint,
      }
    case 'amber':
      return {
        card: PROFILE_THEME_COLORS.primaryFixed,
        text: PROFILE_THEME_COLORS.onPrimaryFixedVariant,
        icon: PROFILE_THEME_COLORS.onPrimaryFixedVariant,
      }
    case 'rose':
      return {
        card: PROFILE_THEME_COLORS.errorContainer,
        text: PROFILE_THEME_COLORS.onErrorContainer,
        icon: PROFILE_THEME_COLORS.error,
      }
    case 'sky':
      return {
        card: PROFILE_THEME_COLORS.tertiaryFixed,
        text: PROFILE_THEME_COLORS.onTertiaryFixedVariant,
        icon: PROFILE_THEME_COLORS.onTertiaryFixedVariant,
      }
    case 'violet':
      return {
        card: PROFILE_THEME_COLORS.secondaryFixed,
        text: PROFILE_THEME_COLORS.onSecondaryFixedVariant,
        icon: PROFILE_THEME_COLORS.onSecondaryFixedVariant,
      }
  }
}

export function getHistoryResultPalette(state: 'win' | 'loss' | 'pending') {
  switch (state) {
    case 'win':
      return {
        badgeBackground: PROFILE_THEME_COLORS.primary,
        badgeText: PROFILE_THEME_COLORS.onPrimary,
        eloText: PROFILE_THEME_COLORS.primary,
      }
    case 'loss':
      return {
        badgeBackground: PROFILE_THEME_COLORS.errorContainer,
        badgeText: PROFILE_THEME_COLORS.error,
        eloText: PROFILE_THEME_COLORS.error,
      }
    case 'pending':
    default:
      return {
        badgeBackground: PROFILE_THEME_COLORS.surfaceVariant,
        badgeText: PROFILE_THEME_COLORS.onSurfaceVariant,
        eloText: PROFILE_THEME_COLORS.outline,
      }
  }
}
