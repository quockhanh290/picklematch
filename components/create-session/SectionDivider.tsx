import React from 'react'
import { Text, View } from 'react-native'
import { PROFILE_THEME_COLORS } from '@/constants/profileTheme'
import { SCREEN_FONTS } from '@/constants/typography'

interface SectionDividerProps {
  index: string
  title: string
}

export function SectionDivider({ index, title }: SectionDividerProps) {
  return (
    <View style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Text style={{ fontFamily: SCREEN_FONTS.headline, fontSize: 16, textTransform: 'uppercase', letterSpacing: 1.5, color: PROFILE_THEME_COLORS.outline }}>
        {index} / {title}
      </Text>
      <View style={{ height: 1, flex: 1, backgroundColor: PROFILE_THEME_COLORS.outlineVariant }} />
    </View>
  )
}
