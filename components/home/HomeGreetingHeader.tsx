import { router } from 'expo-router'
import { Hand, UserRound } from 'lucide-react-native'
import { Pressable, Text, View } from 'react-native'

import { PROFILE_THEME_COLORS } from '@/components/profile/profileTheme'

const iconStroke = 2.7

export function HomeGreetingHeader({
  name,
  statusPrompt,
}: {
  name: string
  statusPrompt: string
}) {
  return (
    <View className="flex-row items-start justify-between px-1 py-1">
      <View className="flex-1 pr-4">
        <View className="flex-row items-center">
          <Text className="text-[30px] leading-[36px]" style={{ color: PROFILE_THEME_COLORS.primary, fontFamily: 'PlusJakartaSans-ExtraBold' }}>
            Chào, {name}
          </Text>
          <View className="ml-2 rounded-full p-2" style={{ backgroundColor: PROFILE_THEME_COLORS.secondaryContainer }}>
            <Hand size={18} color={PROFILE_THEME_COLORS.primary} strokeWidth={iconStroke} />
          </View>
        </View>
        <Text className="mt-2 text-[15px]" style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: 'PlusJakartaSans-ExtraBoldItalic' }}>
          {statusPrompt}
        </Text>
      </View>

      <Pressable
        onPress={() => router.push('/(tabs)/profile' as never)}
        className="mt-1 h-16 w-16 items-center justify-center rounded-full p-1.5"
        style={{
          backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow,
        }}
      >
        <View
          className="flex-1 self-stretch items-center justify-center rounded-full"
          style={{ backgroundColor: PROFILE_THEME_COLORS.primaryContainer }}
        >
          <UserRound size={30} color={PROFILE_THEME_COLORS.onPrimaryContainer} strokeWidth={2.4} />
        </View>
      </Pressable>
    </View>
  )
}
