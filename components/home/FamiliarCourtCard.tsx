import { Home, MapPin, Zap } from 'lucide-react-native'
import { ImageBackground, Pressable, Text, View } from 'react-native'

import { PROFILE_THEME_COLORS } from '@/components/profile/profileTheme'
import type { FamiliarCourt } from '@/lib/homeFeed'

const iconStroke = 2.7
export const COURT_CARD_HEIGHT = 256

export function FamiliarCourtCard({ item, onPress }: { item: FamiliarCourt; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="h-64 overflow-hidden rounded-[32px] active:scale-[0.99]"
      style={{ height: COURT_CARD_HEIGHT }}
    >
      <ImageBackground
        source={{ uri: item.image }}
        imageStyle={{ borderRadius: 32 }}
        className="h-full w-full"
      >
        <View className="flex-1 justify-between bg-black/15 p-5">
        <View className="flex-row items-start justify-between">
          <View className="rounded-full border px-4 py-2" style={{ borderColor: 'rgba(255,255,255,0.32)', backgroundColor: 'rgba(255,255,255,0.16)' }}>
            <View className="flex-row items-center">
              <Home size={14} color={PROFILE_THEME_COLORS.onPrimary} strokeWidth={iconStroke} />
              <Text
                className="ml-2 text-xs uppercase tracking-[2.2px]"
                style={{ color: PROFILE_THEME_COLORS.onPrimary, fontFamily: 'PlusJakartaSans-Bold' }}
              >
                Sân quen
              </Text>
            </View>
          </View>

          <View className="rounded-full border px-4 py-2" style={{ borderColor: PROFILE_THEME_COLORS.primaryFixed, backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest }}>
            <View className="flex-row items-center">
              <Zap size={14} color={PROFILE_THEME_COLORS.primary} strokeWidth={iconStroke} />
              <Text
                className="ml-2 text-xs"
                style={{ color: PROFILE_THEME_COLORS.primary, fontFamily: 'PlusJakartaSans-ExtraBold' }}
              >
                {item.openMatches} kèo đang mở
              </Text>
            </View>
          </View>
        </View>

        <View
          className="rounded-[24px] border p-4"
          style={{
            borderColor: 'rgba(255,255,255,0.7)',
            backgroundColor: 'rgba(255,255,255,0.9)',
            shadowColor: PROFILE_THEME_COLORS.onBackground,
            shadowOpacity: 0.12,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 10 },
          }}
        >
          <Text
            className="text-[22px]"
            style={{ color: PROFILE_THEME_COLORS.onSurface, fontFamily: 'PlusJakartaSans-ExtraBold', lineHeight: 30 }}
          >
            {item.name}
          </Text>
          <View className="mt-2 flex-row items-center">
            <MapPin size={14} color={PROFILE_THEME_COLORS.onSurfaceVariant} strokeWidth={iconStroke} />
            <Text
              className="ml-2 text-sm"
              style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: 'PlusJakartaSans-SemiBold' }}
            >
              {item.area}
            </Text>
          </View>
          <Text
            className="mt-3 text-sm"
            style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: 'PlusJakartaSans-Regular', lineHeight: 22 }}
          >
            {item.note}
          </Text>
        </View>
        </View>
      </ImageBackground>
    </Pressable>
  )
}


