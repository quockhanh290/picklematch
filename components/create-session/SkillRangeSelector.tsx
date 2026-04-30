import React from 'react'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { PROFILE_THEME_COLORS } from '@/constants/profileTheme'
import { SCREEN_FONTS } from '@/constants/typography'
import { RADIUS, SPACING, BORDER } from '@/constants/screenLayout'
import { CREATE_SESSION_SKILL_OPTIONS } from './skillLevelOptions'

interface SkillRangeSelectorProps {
  minSkill: number
  maxSkill: number
  setMinSkill: (n: number) => void
  setMaxSkill: (n: number) => void
}

export function SkillRangeSelector({
  minSkill,
  maxSkill,
  setMinSkill,
  setMaxSkill,
}: SkillRangeSelectorProps) {
  function onSelectMin(level: number) {
    if (level > maxSkill) setMaxSkill(level)
    setMinSkill(level)
  }

  function onSelectMax(level: number) {
    if (level < minSkill) setMinSkill(level)
    setMaxSkill(level)
  }

  return (
    <View style={{ gap: 12 }}>
      <View>
        <Text style={{ fontSize: 11, color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: SCREEN_FONTS.body, marginBottom: 6 }}>Tối thiểu</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {CREATE_SESSION_SKILL_OPTIONS.map((option) => {
              const isSelected = option.id === minSkill
              return (
                <TouchableOpacity
                  key={`min-${option.id}`}
                  onPress={() => onSelectMin(option.id)}
                  style={{
                    paddingHorizontal: 12, paddingVertical: SPACING.xs,
                    borderRadius: RADIUS.full,
                    backgroundColor: isSelected ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.surface,
                    borderWidth: BORDER.base,
                    borderColor: isSelected ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.outlineVariant,
                  }}
                >
                  <Text style={{ fontSize: 12, fontFamily: SCREEN_FONTS.label, color: isSelected ? PROFILE_THEME_COLORS.onPrimary : PROFILE_THEME_COLORS.onSurface }}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </ScrollView>
      </View>

      <View>
        <Text style={{ fontSize: 11, color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: SCREEN_FONTS.body, marginBottom: 6 }}>Tối đa</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {CREATE_SESSION_SKILL_OPTIONS.map((option) => {
              const isSelected = option.id === maxSkill
              return (
                <TouchableOpacity
                  key={`max-${option.id}`}
                  onPress={() => onSelectMax(option.id)}
                  style={{
                    paddingHorizontal: 12, paddingVertical: SPACING.xs,
                    borderRadius: RADIUS.full,
                    backgroundColor: isSelected ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.surface,
                    borderWidth: BORDER.base,
                    borderColor: isSelected ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.outlineVariant,
                  }}
                >
                  <Text style={{ fontSize: 12, fontFamily: SCREEN_FONTS.label, color: isSelected ? PROFILE_THEME_COLORS.onPrimary : PROFILE_THEME_COLORS.onSurface }}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </ScrollView>
      </View>

      <Text style={{ fontFamily: SCREEN_FONTS.body, fontSize: 11, color: PROFILE_THEME_COLORS.onSecondaryContainer }}>
        Bạn có thể chọn cùng một mức ở cả hai dòng để chỉ nhận đúng một trình độ.
      </Text>
    </View>
  )
}
