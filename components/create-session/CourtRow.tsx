import React from 'react'
import { Pressable, Text, View, TouchableOpacity } from 'react-native'
import { MapPin, Info, Star } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import { PROFILE_THEME_COLORS } from '@/constants/profileTheme'
import { SCREEN_FONTS } from '@/constants/typography'
import { RADIUS, SPACING, BORDER } from '@/constants/screenLayout'
import type { NearByCourt } from '@/lib/useNearbyCourts'
import { isCurrentlyOpen } from '@/lib/utils/court'

interface CourtRowProps {
  court: NearByCourt
  onPress: (court: NearByCourt) => void
}

function formatDistance(distance?: number) {
  if (distance == null) return null
  return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`
}

export function CourtRow({ court, onPress }: CourtRowProps) {
  const router = useRouter()
  const distanceLabel = formatDistance(court.distance)
  const isBusinessOpen = isCurrentlyOpen(court.hours_open, court.hours_close)
  const hasSlots = !!court.hasSlots

  return (
    <View style={{ position: 'relative' }}>
      <Pressable
        onPress={() => onPress(court)}
        style={({ pressed }) => ({
          borderRadius: RADIUS.lg,
          borderWidth: BORDER.base,
          borderColor: PROFILE_THEME_COLORS.outlineVariant,
          backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest,
          padding: SPACING.md,
          opacity: pressed ? 0.88 : 1,
        })}
      >
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingRight: 40 }}>
          <View style={{ width: 44, height: 44, borderRadius: RADIUS.md, backgroundColor: PROFILE_THEME_COLORS.secondaryContainer, alignItems: 'center', justifyContent: 'center' }}>
            <MapPin size={18} color={PROFILE_THEME_COLORS.surfaceTint} />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
              <Text style={{ flex: 1, fontFamily: SCREEN_FONTS.headline, fontSize: 16, color: PROFILE_THEME_COLORS.onSurface }} numberOfLines={1}>
                {court.name}
              </Text>
              {distanceLabel ? (
                <Text style={{ fontFamily: SCREEN_FONTS.label, fontSize: 11, color: PROFILE_THEME_COLORS.outline }}>{distanceLabel}</Text>
              ) : null}
            </View>
            <Text style={{ fontFamily: SCREEN_FONTS.body, fontSize: 12, lineHeight: 18, color: PROFILE_THEME_COLORS.onSurfaceVariant, marginTop: 3 }} numberOfLines={2}>
              {court.address}{court.city ? ` · ${court.city}` : ''}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
              {/* Rating */}
              {court.rating != null && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                  <Star size={10} color="#FBC02D" fill="#FBC02D" />
                  <Text style={{ fontFamily: SCREEN_FONTS.headline, fontSize: 11, color: PROFILE_THEME_COLORS.onSurface }}>
                    {court.rating.toFixed(1)}
                  </Text>
                  <Text style={{ fontFamily: SCREEN_FONTS.body, fontSize: 11, color: PROFILE_THEME_COLORS.outline }}>
                    ({court.rating_count ?? 0})
                  </Text>
                </View>
              )}

              <View style={{ width: 1, height: 10, backgroundColor: PROFILE_THEME_COLORS.outlineVariant }} />

              <View style={{
                borderRadius: RADIUS.full,
                borderWidth: BORDER.base,
                borderColor: isBusinessOpen ? PROFILE_THEME_COLORS.outlineVariant : PROFILE_THEME_COLORS.error,
                backgroundColor: isBusinessOpen ? PROFILE_THEME_COLORS.secondaryContainer : PROFILE_THEME_COLORS.errorContainer,
                paddingHorizontal: SPACING.sm,
                paddingVertical: 4,
              }}>
                <Text style={{ fontFamily: SCREEN_FONTS.headline, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8, color: isBusinessOpen ? PROFILE_THEME_COLORS.surfaceTint : PROFILE_THEME_COLORS.error }}>
                  {isBusinessOpen ? 'Đang mở' : 'Đã đóng'}
                </Text>
              </View>


            </View>
          </View>
        </View>
      </Pressable>

      <TouchableOpacity
        onPress={() => router.push(`/court/${court.id}`)}
        style={{
          position: 'absolute',
          right: 4,
          top: '50%',
          marginTop: -20,
          width: 40,
          height: 40,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Info size={20} color={PROFILE_THEME_COLORS.primary} strokeWidth={2.5} />
      </TouchableOpacity>
    </View>
  )
}

