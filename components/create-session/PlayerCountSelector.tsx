import React from 'react'
import { Pressable, Text, View } from 'react-native'
import { UserRound, Users } from 'lucide-react-native'
import { PROFILE_THEME_COLORS } from '@/constants/profileTheme'
import { SCREEN_FONTS } from '@/constants/typography'
import { RADIUS, SPACING, BORDER } from '@/constants/screenLayout'

interface PlayerCountSelectorProps {
  maxPlayers: number
  setMaxPlayers: (n: number) => void
}

export function PlayerCountSelector({ maxPlayers, setMaxPlayers }: PlayerCountSelectorProps) {
  return (
    <View style={{ borderRadius: RADIUS.md, borderWidth: BORDER.hairline, borderColor: PROFILE_THEME_COLORS.outlineVariant, backgroundColor: PROFILE_THEME_COLORS.surface, padding: SPACING.md, marginBottom: 16 }}>
      <Text style={{ fontFamily: SCREEN_FONTS.headline, fontSize: 12, letterSpacing: 1.2, color: PROFILE_THEME_COLORS.primary, marginBottom: 10 }}>
        {'SỐ LƯỢNG NGƯỜI CHƠI'}
      </Text>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {[
          { value: 2, label: 'Đơn (2)' },
          { value: 4, label: 'Đôi (4)' },
        ].map(({ value, label }) => {
          const playerCount = value as 2 | 4
          const isSelected = maxPlayers === playerCount
          const Icon = playerCount === 2 ? UserRound : Users
          return (
            <View key={playerCount} style={{ flex: 1 }}>
              <Pressable
                onPress={() => setMaxPlayers(playerCount)}
                style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.85 : 1 })}
              >
                <View style={{
                  flex: 1, borderRadius: RADIUS.sm,
                  backgroundColor: isSelected ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.surface,
                  paddingVertical: 12, paddingHorizontal: 8,
                  alignItems: 'center', justifyContent: 'center', gap: 4,
                  borderWidth: BORDER.medium,
                  borderColor: isSelected ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.outlineVariant,
                }}>
                  <Icon size={20} color={isSelected ? PROFILE_THEME_COLORS.onPrimary : PROFILE_THEME_COLORS.onSurfaceVariant} />
                  <Text style={{ fontFamily: SCREEN_FONTS.headline, fontSize: 32, lineHeight: 36, color: isSelected ? PROFILE_THEME_COLORS.onPrimary : PROFILE_THEME_COLORS.onSurfaceVariant }}>
                    {playerCount}
                  </Text>
                  <Text style={{ fontFamily: SCREEN_FONTS.label, fontSize: 11, color: isSelected ? PROFILE_THEME_COLORS.onPrimary : PROFILE_THEME_COLORS.onSurfaceVariant }}>
                    {label}
                  </Text>
                </View>
              </Pressable>
            </View>
          )
        })}
      </View>
    </View>
  )
}
