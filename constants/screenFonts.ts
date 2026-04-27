/**
 * Shared screen font tokens — single source of truth for all session-related screens.
 * All font names map to fonts loaded in app/_layout.tsx via expo-google-fonts.
 *
 * Usage:
 *   import { SCREEN_FONTS } from '@/constants/screenFonts'
 *   fontFamily: SCREEN_FONTS.headline
 */
export const SCREEN_FONTS = {
  /** BarlowCondensed 700 — court names, time ranges, section headers, price */
  headline: 'BarlowCondensed-Bold',
  /** BarlowCondensed 700 Italic — step titles, hero display numbers */
  headlineItalic: 'BarlowCondensed-BoldItalic',
  /** BarlowCondensed 900 — player count selectors, heavy accent numerals */
  headlineBlack: 'BarlowCondensed-Black',
  /** PlusJakartaSans 400 — addresses, descriptions, secondary body copy */
  body: 'PlusJakartaSans-Regular',
  /** PlusJakartaSans 500 — medium emphasis body */
  medium: 'PlusJakartaSans-Medium',
  /** PlusJakartaSans 600 — host name, booking status, chips, metadata */
  label: 'PlusJakartaSans-SemiBold',
  /** PlusJakartaSans 700 — buttons, day badge, action labels */
  cta: 'PlusJakartaSans-Bold',
  /** PlusJakartaSans 800 — hero court names, player names, section dividers */
  bold: 'PlusJakartaSans-ExtraBold',
  /** PlusJakartaSans 800 Italic — time range hero display in detail cards */
  boldItalic: 'PlusJakartaSans-ExtraBoldItalic',
} as const

export type ScreenFontKey = keyof typeof SCREEN_FONTS
