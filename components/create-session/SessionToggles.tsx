import React from 'react'
import { Switch, Text, View } from 'react-native'
import { PROFILE_THEME_COLORS } from '@/constants/profileTheme'
import { SCREEN_FONTS } from '@/constants/typography'
import { RADIUS, SPACING, BORDER } from '@/constants/screenLayout'

interface SessionTogglesProps {
  isRanked: boolean
  setIsRanked: (value: boolean) => void
  canToggleRanked: boolean
  rankedHelperText: string | null
  requireApproval: boolean
  setRequireApproval: (value: boolean) => void
}

export function SessionToggles({
  isRanked,
  setIsRanked,
  canToggleRanked,
  rankedHelperText,
  requireApproval,
  setRequireApproval,
}: SessionTogglesProps) {
  return (
    <View style={{ borderRadius: RADIUS.xl, borderWidth: BORDER.base, borderColor: PROFILE_THEME_COLORS.outlineVariant, backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow, padding: SPACING.lg, marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={{ fontFamily: SCREEN_FONTS.headline, fontSize: 16, color: PROFILE_THEME_COLORS.primary }}>{'Tính điểm xếp hạng'}</Text>
          <Text style={{ fontFamily: SCREEN_FONTS.body, fontSize: 12, color: PROFILE_THEME_COLORS.onSecondaryContainer, marginTop: 2 }}>{'Kết quả sẽ ảnh hưởng đến ELO của bạn'}</Text>
        </View>
        <Switch
          value={isRanked}
          onValueChange={setIsRanked}
          disabled={!canToggleRanked}
          trackColor={{ false: PROFILE_THEME_COLORS.surfaceDim, true: PROFILE_THEME_COLORS.surfaceTint }}
          thumbColor={PROFILE_THEME_COLORS.surfaceContainerLowest}
        />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={{ fontFamily: SCREEN_FONTS.headline, fontSize: 16, color: PROFILE_THEME_COLORS.primary }}>{'Yêu cầu phê duyệt'}</Text>
          <Text style={{ fontFamily: SCREEN_FONTS.body, fontSize: 12, color: PROFILE_THEME_COLORS.onSecondaryContainer, marginTop: 2 }}>{'Chủ sân cần duyệt người tham gia'}</Text>
        </View>
        <Switch
          value={requireApproval}
          onValueChange={setRequireApproval}
          trackColor={{ false: PROFILE_THEME_COLORS.surfaceDim, true: PROFILE_THEME_COLORS.surfaceTint }}
          thumbColor={PROFILE_THEME_COLORS.surfaceContainerLowest}
        />
      </View>

      {!canToggleRanked && rankedHelperText ? (
        <Text style={{ marginTop: 10, fontFamily: SCREEN_FONTS.body, fontSize: 12, color: PROFILE_THEME_COLORS.onPrimaryFixedVariant }}>{rankedHelperText}</Text>
      ) : null}
    </View>
  )
}
