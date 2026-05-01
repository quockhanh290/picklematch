import { Home, MapPin, Zap, Star } from 'lucide-react-native'
import { ImageBackground, Pressable, Text, View } from 'react-native'

import { PROFILE_THEME_COLORS } from '@/constants/profileTheme'
import { RADIUS, SHADOW, SPACING, BORDER } from '@/constants/screenLayout'
import { SCREEN_FONTS } from '@/constants/typography'
import type { FamiliarCourt } from '@/lib/homeFeed'

const iconStroke = 2.7
export const COURT_CARD_HEIGHT = 256

function withAlpha(hex: string, alpha: number) {
  const clean = hex.replace('#', '')
  const normalized = clean.length === 3 ? clean.split('').map((char) => char + char).join('') : clean
  const n = Number.parseInt(normalized, 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

export function FamiliarCourtCard({ item, onPress }: { item: FamiliarCourt; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="overflow-hidden active:scale-[0.99]"
      style={{ height: COURT_CARD_HEIGHT, borderRadius: RADIUS.lg, ...SHADOW.sm }}
    >
      <ImageBackground
        source={{ uri: item.image }}
        imageStyle={{ borderRadius: RADIUS.lg }}
        className="h-full w-full"
      >
        <View className="flex-1 justify-between bg-black/15" style={{ padding: SPACING.xl, borderRadius: RADIUS.lg }}>
          <View className="flex-row items-start justify-between">
            <View
              className="flex-row items-center"
              style={{
                borderRadius: RADIUS.full,
                borderWidth: BORDER.base,
                paddingHorizontal: SPACING.md,
                paddingVertical: SPACING.sm - 2, // 8px
                borderColor: withAlpha(PROFILE_THEME_COLORS.onPrimary, 0.32),
                backgroundColor: withAlpha(PROFILE_THEME_COLORS.onPrimary, 0.16),
              }}
            >
              <Home size={14} color={PROFILE_THEME_COLORS.onPrimary} strokeWidth={iconStroke} />
              <Text
                className="ml-2 text-xs uppercase tracking-[2.2px]"
                style={{ color: PROFILE_THEME_COLORS.onPrimary, fontFamily: SCREEN_FONTS.cta }}
              >
                Sân quen
              </Text>
            </View>

            <View
              className="flex-row items-center"
              style={{
                borderRadius: RADIUS.full,
                borderWidth: BORDER.base,
                paddingHorizontal: SPACING.md,
                paddingVertical: SPACING.sm - 2, // 8px
                borderColor: PROFILE_THEME_COLORS.primaryFixed,
                backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest,
              }}
            >
              <Zap size={14} color={PROFILE_THEME_COLORS.primary} strokeWidth={iconStroke} />
              <Text
                className="ml-2 text-xs"
                style={{ color: PROFILE_THEME_COLORS.primary, fontFamily: SCREEN_FONTS.headline }}
              >
                {item.openMatches} kèo đang mở
              </Text>
            </View>
          </View>

          <View
            style={{
              borderRadius: RADIUS.lg,
              borderWidth: BORDER.base,
              padding: SPACING.md,
              borderColor: withAlpha(PROFILE_THEME_COLORS.onPrimary, 0.7),
              backgroundColor: withAlpha(PROFILE_THEME_COLORS.onPrimary, 0.9),
              ...SHADOW.lg,
            }}
          >
            <View className="flex-row items-center justify-between">
              <Text
                className="flex-1 text-[22px]"
                numberOfLines={1}
                style={{ color: PROFILE_THEME_COLORS.onSurface, fontFamily: SCREEN_FONTS.headline, lineHeight: 30 }}
              >
                {item.name}
              </Text>
              {item.rating != null && (
                <View className="ml-2 flex-row items-center">
                  <Star size={14} color="#F59E0B" fill="#F59E0B" />
                  <Text
                    className="ml-1 text-sm font-bold"
                    style={{ color: PROFILE_THEME_COLORS.onSurface, fontFamily: SCREEN_FONTS.headline }}
                  >
                    {item.rating.toFixed(1)}
                  </Text>
                </View>
              )}
            </View>

            <View className="mt-2 flex-row items-center">
              <MapPin size={14} color={PROFILE_THEME_COLORS.onSurfaceVariant} strokeWidth={iconStroke} />
              <Text
                className="ml-2 flex-1 text-sm"
                numberOfLines={1}
                style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: SCREEN_FONTS.label }}
              >
                {item.area}
              </Text>
            </View>
            <Text
              className="mt-3 text-sm"
              style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: SCREEN_FONTS.body, lineHeight: 22 }}
            >
              {item.note}
            </Text>
          </View>
        </View>
      </ImageBackground>
    </Pressable>
  )
}

