import { router } from 'expo-router'
import { Hand, UserRound } from 'lucide-react-native'
import { Pressable, Text, View } from 'react-native'

import { getShadowStyle } from '@/lib/designSystem'
import { useAppTheme } from '@/lib/theme-context'

const iconStroke = 2.7

export function HomeGreetingHeader({
  name,
  statusPrompt,
}: {
  name: string
  statusPrompt: string
}) {
  const theme = useAppTheme()

  return (
    <View
      className="flex-row items-start justify-between rounded-[32px] px-5 py-5"
      style={{
        backgroundColor: theme.surface,
        borderWidth: 1,
        borderColor: theme.border,
        ...getShadowStyle(theme),
      }}
    >
      <View className="flex-1 pr-4">
        <Text className="text-[11px] font-bold uppercase tracking-[2.8px]" style={{ color: theme.textSoft }}>
          Command Center
        </Text>
        <View className="mt-2 flex-row items-center">
          <Text className="text-[28px] font-black leading-[34px]" style={{ color: theme.text }}>
            {name}
          </Text>
          <View className="ml-2 rounded-full p-2" style={{ backgroundColor: theme.warningSoft }}>
            <Hand size={18} color={theme.warning} strokeWidth={iconStroke} />
          </View>
        </View>
        <Text className="mt-2 text-[15px] font-semibold" style={{ color: theme.textMuted }}>
          {statusPrompt}
        </Text>
      </View>

      <Pressable
        onPress={() => router.push('/(tabs)/profile' as never)}
        className="h-20 w-20 items-center justify-center rounded-[26px]"
        style={{
          borderWidth: 1,
          borderColor: theme.border,
          backgroundColor: theme.surfaceAlt,
          ...getShadowStyle(theme),
        }}
      >
        <View
          className="h-[68px] w-[68px] items-center justify-center rounded-[22px]"
          style={{ backgroundColor: theme.primarySoft }}
        >
          <UserRound size={30} color={theme.primary} strokeWidth={2.4} />
        </View>
      </Pressable>
    </View>
  )
}
