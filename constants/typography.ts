export const AppFontSet = {
  // Hero or branded moments
  display: 'BarlowCondensed-BoldItalic',
  // Primary headings and key numeric emphasis
  headline: 'BarlowCondensed-Bold',
  // Section headers and compact titles
  title: 'Inter-Bold',
  // Body copy
  body: 'Inter-Regular',
  // UI support text (chips, meta labels)
  label: 'Inter-SemiBold',
  // Primary action text
  cta: 'Inter-Bold',
} as const

export const typography = {
  // Display - large numbers, court names (short)
  displayLg: { fontFamily: 'BarlowCondensed-Bold', fontSize: 26, lineHeight: 28, letterSpacing: 0.3 },
  displayMd: { fontFamily: 'BarlowCondensed-Bold', fontSize: 22, lineHeight: 24, letterSpacing: 0.3 },
  displaySm: { fontFamily: 'BarlowCondensed-Bold', fontSize: 18, lineHeight: 20, letterSpacing: 0.3 },

  // Body
  bodyMd: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 13, lineHeight: 18 },
  bodySm: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 12, lineHeight: 16 },
  bodyXs: { fontFamily: 'PlusJakartaSans-Regular', fontSize: 11, lineHeight: 14 },

  // Label
  labelMd: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 13, lineHeight: 18 },
  labelSm: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 11, lineHeight: 14 },

  // CTA
  cta: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 15, lineHeight: 20, letterSpacing: 0.2 },
} as const
