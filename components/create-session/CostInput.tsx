import React from 'react'
import { Text, TextInput, View } from 'react-native'
import { PROFILE_THEME_COLORS } from '@/constants/profileTheme'
import { SCREEN_FONTS } from '@/constants/typography'
import { RADIUS, SPACING, BORDER } from '@/constants/screenLayout'

interface CostInputProps {
  totalCostStr: string
  setTotalCostStr: (value: string) => void
  costPerPerson: number
}

function formatCurrencyInput(nextValue: string) {
  const digits = nextValue.replace(/\D/g, '')
  if (!digits) return ''
  return Number(digits).toLocaleString('vi-VN')
}

function formatCurrencyLabel(value: number) {
  return `${value.toLocaleString('vi-VN')} đ`
}

export function CostInput({ totalCostStr, setTotalCostStr, costPerPerson }: CostInputProps) {
  return (
    <View style={{ borderRadius: RADIUS.xl, borderWidth: BORDER.base, borderColor: PROFILE_THEME_COLORS.outlineVariant, backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow, padding: SPACING.lg, marginBottom: 16 }}>
      <Text style={{ fontFamily: SCREEN_FONTS.headline, fontSize: 12, letterSpacing: 1.2, color: PROFILE_THEME_COLORS.primary, marginBottom: 10 }}>
        CHI PHÍ TRẬN ĐẤU
      </Text>
      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: RADIUS.md, borderWidth: BORDER.base, borderColor: PROFILE_THEME_COLORS.outlineVariant, backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest, paddingHorizontal: 12, paddingVertical: 9 }}>
            <TextInput
              value={totalCostStr}
              onChangeText={(value) => setTotalCostStr(formatCurrencyInput(value))}
              placeholder="Tổng chi phí sân (vd: 240000)"
              placeholderTextColor={PROFILE_THEME_COLORS.outline}
              keyboardType="number-pad"
              style={{ flex: 1, fontFamily: SCREEN_FONTS.body, fontSize: 14, color: PROFILE_THEME_COLORS.primary, padding: 0 }}
            />
            <Text style={{ fontSize: 12, color: PROFILE_THEME_COLORS.outline, marginLeft: 8 }}>VNĐ</Text>
          </View>
        </View>
        <View style={{ backgroundColor: PROFILE_THEME_COLORS.primary, borderRadius: RADIUS.sm, padding: SPACING.sm }}>
          <Text style={{ fontSize: 13, color: PROFILE_THEME_COLORS.onPrimary, fontFamily: SCREEN_FONTS.label }}>
            {costPerPerson > 0
              ? `Chi phí / người: ${formatCurrencyLabel(costPerPerson)}`
              : 'Chi phí / người: Chưa có'}
          </Text>
        </View>
      </View>
    </View>
  )
}
