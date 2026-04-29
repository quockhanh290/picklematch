import { PROFILE_THEME_COLORS } from '@/components/profile/profileTheme'
import { SCREEN_FONTS } from '@/constants/typography'
import { router } from 'expo-router'
import { Image, Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SPACING } from '@/constants/screenLayout'

function getGreetingLabel() {
  const hour = new Date().getHours()

  if (hour >= 5 && hour <= 11) return 'Chào buổi sáng ☀️'
  if (hour >= 12 && hour <= 17) return 'Chào buổi chiều 🌤️'
  if (hour >= 18 && hour <= 21) return 'Chào buổi tối 🌙'
  return 'Xin chào 👋'
}

export function HomeGreetingHeader({
  name,
  statusPrompt,
  profilePhotoUrl,
}: {
  name: string
  statusPrompt: string
  profilePhotoUrl?: string | null
}) {
  const displayName = name.trim() || 'Bạn'
  const initial = displayName.charAt(0).toUpperCase()
  const insets = useSafeAreaInsets()

  return (
    <View
      style={{
        paddingTop: insets.top + 20,
        paddingHorizontal: SPACING.xl,
        paddingBottom: 16,
        backgroundColor: PROFILE_THEME_COLORS.background,
      }}
    >
      <View className="flex-row items-center justify-between">
      <View className="min-w-0 flex-1 pr-4">
        <Text
          className="mb-[3px] text-[11px]"
          style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: SCREEN_FONTS.label, lineHeight: 15 }}
        >
          {getGreetingLabel()}
        </Text>

        <Text
          className="text-[40px] uppercase"
          numberOfLines={1}
          ellipsizeMode="tail"
          style={{ 
            color: PROFILE_THEME_COLORS.onBackground, 
            fontFamily: SCREEN_FONTS.headlineBlack, 
            lineHeight: 48, 
            letterSpacing: -1 
          }}
        >
          {displayName.toUpperCase()}
        </Text>

        <Text
          className="mt-1 text-[12px]"
          numberOfLines={1}
          ellipsizeMode="tail"
          style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: SCREEN_FONTS.body, lineHeight: 17 }}
        >
          {statusPrompt}
        </Text>
      </View>

      <Pressable
        onPress={() => router.push('/(tabs)/profile' as never)}
        className="h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2"
        style={{ 
          backgroundColor: PROFILE_THEME_COLORS.secondaryContainer, 
          borderColor: PROFILE_THEME_COLORS.outlineVariant
        }}
      >
        {profilePhotoUrl ? (
          <Image source={{ uri: profilePhotoUrl }} className="h-full w-full" resizeMode="cover" />
        ) : (
          <Text style={{ color: PROFILE_THEME_COLORS.primary, fontFamily: SCREEN_FONTS.headline, fontSize: 24, lineHeight: 28 }}>
            {initial}
          </Text>
        )}
      </Pressable>
      </View>
    </View>
  )
}
