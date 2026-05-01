import React from 'react'
import { Text, TouchableOpacity, View } from 'react-native'
import { MapPin } from 'lucide-react-native'
import { PROFILE_THEME_COLORS } from '@/constants/profileTheme'
import { SCREEN_FONTS } from '@/constants/typography'
import { RADIUS, BORDER, SHADOW } from '@/constants/screenLayout'
import type { NearByCourt } from '@/lib/useNearbyCourts'

interface SelectedCourtCardProps {
  selectedCourt: NearByCourt
  isCourtScheduleLocked: boolean
  showCourtPicker: boolean
  setIsChoosingCourt: (val: boolean) => void
  onChangeCourt: () => void
}

function formatDistance(distance?: number) {
  if (distance == null) return null
  return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`
}

function formatCourtPricePerHour(price: number | null) {
  if (price == null) return null
  if (price >= 1000) return `${Math.round(price / 1000)}K/giờ`
  return `${price.toLocaleString('vi-VN')} VNĐ/giờ`
}

export function SelectedCourtCard({
  selectedCourt,
  isCourtScheduleLocked,
  showCourtPicker,
  setIsChoosingCourt,
  onChangeCourt,
}: SelectedCourtCardProps) {
  const selectedCourtAddress = `${selectedCourt.address}${selectedCourt.city ? ` · ${selectedCourt.city}` : ''}`
  const selectedCourtOpen = !!selectedCourt.hasSlots
  const selectedCourtPriceLabel = formatCourtPricePerHour(selectedCourt.price_per_hour)

  return (
    <View style={{
      borderRadius: RADIUS.lg,
      overflow: 'hidden',
      backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest,
      borderWidth: BORDER.base,
      borderColor: PROFILE_THEME_COLORS.outlineVariant,
      ...SHADOW.sm,
    }}>
      <View style={{
        backgroundColor: PROFILE_THEME_COLORS.primary,
        paddingHorizontal: 16,
        paddingVertical: 6,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 6 }}>
          <View style={{ width: 5, height: 5, borderRadius: RADIUS.full, backgroundColor: PROFILE_THEME_COLORS.onPrimary }} />
          <Text style={{ color: PROFILE_THEME_COLORS.onPrimary, fontFamily: SCREEN_FONTS.cta, fontSize: 13, letterSpacing: 0.5 }}>
            {'SÂN ĐÃ CHỌN'}
          </Text>
        </View>

        {!isCourtScheduleLocked && (
          <TouchableOpacity
            onPress={() => {
              if (showCourtPicker) {
                setIsChoosingCourt(false)
                return
              }
              onChangeCourt()
              setIsChoosingCourt(true)
            }}
          >
            <Text style={{ color: PROFILE_THEME_COLORS.onPrimary, fontFamily: SCREEN_FONTS.headline, fontSize: 13, textTransform: 'uppercase' }}>
              {showCourtPicker ? 'Đóng' : 'Đổi sân'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={{ padding: 16 }}>
        <Text
          numberOfLines={2}
          style={{
            color: PROFILE_THEME_COLORS.onSurface,
            fontFamily: SCREEN_FONTS.headline,
            fontSize: 31,
            lineHeight: 36,
            letterSpacing: 0,
            marginBottom: 4,
            textTransform: 'uppercase',
          }}
        >
          {selectedCourt.name}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 6, marginBottom: 12 }}>
          <MapPin size={13} color={PROFILE_THEME_COLORS.onSurfaceVariant} strokeWidth={2.5} />
          <Text numberOfLines={1} style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: SCREEN_FONTS.body, fontSize: 13, lineHeight: 18, flexShrink: 1 }}>
            {selectedCourtAddress}
          </Text>
        </View>
      </View>

      <View style={{ backgroundColor: PROFILE_THEME_COLORS.surfaceAlt, padding: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <View>
            <Text style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: SCREEN_FONTS.label, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>
              {'CHI PHÍ'}
            </Text>
            <Text style={{ color: PROFILE_THEME_COLORS.onSurface, fontFamily: SCREEN_FONTS.headline, fontSize: 24, lineHeight: 24 }}>
              {selectedCourtPriceLabel ?? '—'}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 6, height: 6, borderRadius: RADIUS.full, backgroundColor: selectedCourtOpen ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.error }} />
            <Text style={{
              marginLeft: 6,
              color: selectedCourtOpen ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.error,
              fontFamily: SCREEN_FONTS.cta,
              fontSize: 10,
              textTransform: 'uppercase',
              letterSpacing: 0.5
            }}>
              {selectedCourtOpen ? 'Đang mở' : 'Tạm đóng'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  )
}
