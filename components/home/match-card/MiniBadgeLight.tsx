import React from 'react'
import { Text, View } from 'react-native'
import { LucideIcon } from 'lucide-react-native'
import { PROFILE_THEME_COLORS, PROFILE_THEME_SEMANTIC } from '@/constants/profileTheme'
import { SCREEN_FONTS } from '@/constants/typography'
import { BORDER } from '@/constants/screenLayout'

export function MiniBadgeLight({
  icon: Icon,
  label,
  tone = 'neutral',
  size = 'md',
}: {
  icon: LucideIcon
  label: string
  tone?: 'neutral' | 'success' | 'urgent'
  size?: 'md' | 'lg'
}) {
  const isLarge = size === 'lg'
  const palette =
    tone === 'success'
      ? { bg: PROFILE_THEME_SEMANTIC.successBg, border: PROFILE_THEME_COLORS.primaryFixedDim, text: PROFILE_THEME_SEMANTIC.successText, icon: PROFILE_THEME_SEMANTIC.successText }
      : tone === 'urgent'
        ? { bg: PROFILE_THEME_SEMANTIC.warningBg, border: PROFILE_THEME_COLORS.secondaryFixedDim, text: PROFILE_THEME_SEMANTIC.warningText, icon: PROFILE_THEME_SEMANTIC.warningText }
        : {
            bg: PROFILE_THEME_COLORS.surfaceContainerLow,
            border: PROFILE_THEME_COLORS.outlineVariant,
            text: PROFILE_THEME_COLORS.onSurfaceVariant,
            icon: PROFILE_THEME_COLORS.onSurfaceVariant,
          }

  return (
    <View
      className={`flex-row items-center rounded-full ${isLarge ? 'px-3.5 py-2' : 'px-3 py-1.5'}`}
      style={{ backgroundColor: palette.bg, borderWidth: BORDER.base, borderColor: palette.border }}
    >
      <Icon size={isLarge ? 15 : 14} color={palette.icon} strokeWidth={2.5} />
      <Text
        className="ml-1.5"
        style={{
          color: palette.text,
          fontFamily: SCREEN_FONTS.label,
          fontSize: 12,
          lineHeight: 18,
        }}
      >
        {label}
      </Text>
    </View>
  )
}
