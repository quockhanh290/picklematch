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
  // Hero card (dark green background) tokens
  heroGradientStart: string
  heroBodyMuted: string
  heroLiveDot: string
  heroCountdownText: string
  heroChipBg: string
  heroPillBg: string
  heroFooterOverlay: string
  heroAvatarBorder: string
  heroSlotBg: string
  heroSlotText: string
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
  primaryContainer: '#04342C',
  onError: '#ffffff',
  primaryFixed: '#b0f0d6',
  onPrimaryFixed: '#002117',
  tertiaryFixedDim: '#7ad7c6',
  background: '#FFFBF5',
  primaryFixedDim: '#95d3ba',
  onBackground: '#1A2E2A',
  surfaceVariant: '#e1e3e0',
  surfaceContainer: '#eceeeb',
  onErrorContainer: '#93000a',
  inverseSurface: '#2e312f',
  surfaceDim: '#d8dbd7',
  surface: '#FFFFFF',
  onTertiaryContainer: '#65c2b1',
  onPrimary: '#ffffff',
  outline: '#7A8884',
  onTertiaryFixed: '#00201b',
  inversePrimary: '#95d3ba',
  tertiaryContainer: '#004e44',
  onPrimaryFixedVariant: '#0b513d',
  onTertiary: '#ffffff',
  error: '#ba1a1a',
  tertiaryFixed: '#96f3e1',
  surfaceTint: '#0F6E56',
  primary: '#0F6E56',
  onSecondary: '#ffffff',
  secondaryContainer: '#E1F5EE',
  onSurfaceVariant: '#7A8884',
  onPrimaryContainer: '#80bea6',
  outlineVariant: '#E5E3DC',
  onSurface: '#1A2E2A',
  secondaryFixedDim: '#b3ccc0',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerHighest: '#e1e3e0',
  onSecondaryContainer: '#50685d',
  errorContainer: '#ffdad6',
  onTertiaryFixedVariant: '#005046',
  // Hero card (dark green background) tokens
  heroGradientStart: '#083D2B',
  heroBodyMuted: '#A8D9C8',
  heroLiveDot: '#5DCAA5',
  heroCountdownText: '#FFD580',
  heroChipBg: 'rgba(255,255,255,0.15)',
  heroPillBg: 'rgba(0,0,0,0.2)',
  heroFooterOverlay: 'rgba(0,0,0,0.22)',
  heroAvatarBorder: 'rgba(255,255,255,0.3)',
  heroSlotBg: 'rgba(255,255,255,0.12)',
  heroSlotText: 'rgba(255,255,255,0.4)',
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
  // Rescue / urgent fill card tokens
  rescueAccent: string
  rescueBorder: string
}

const FOREST_DEFAULT_SEMANTIC: ProfileThemeSemantic = {
  successBg: '#dcfce7',
  successText: '#0F6E56',
  warningBg: '#FAEEDA',
  warningText: '#854F0B',
  warningStrong: '#EF9F27',
  infoBg: '#e2e8f0',
  infoText: '#475569',
  infoIcon: '#64748b',
  dangerBg: '#FAECE7',
  dangerText: '#be123c',
  dangerStrong: '#e11d48',
  dangerBorderSoft: '#fda4af',
  dangerBorder: '#f3b3b3',
  dangerDeep: '#7a1f1f',
  overlay: 'rgba(10, 20, 30, 0.45)',
  // Rescue / urgent fill card tokens
  rescueAccent: '#D85A30',
  rescueBorder: '#F5D5CB',
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
