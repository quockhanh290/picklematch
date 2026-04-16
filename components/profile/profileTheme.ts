export const PROFILE_THEME_COLORS = {
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
} as const

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
    backgroundColor: '#7a1f1f',
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
