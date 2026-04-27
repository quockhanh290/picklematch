import { ChevronRight, Users } from 'lucide-react-native'
import { Image, Pressable, Text, View } from 'react-native'

import { PROFILE_THEME_COLORS } from '@/components/profile/profileTheme'

type Props = {
  count: number
  avatars: string[]
  onPress: () => void
}

function isImageSource(value: string) {
  return /^(https?:\/\/|file:|data:image\/|content:|asset:|\/)/i.test(value)
}

function getFallbackInitials(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function withAlpha(hex: string, alpha: number) {
  const clean = hex.replace('#', '')
  const normalized = clean.length === 3 ? clean.split('').map((char) => char + char).join('') : clean
  const n = Number.parseInt(normalized, 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

export function PendingRequestsWidget({ count, avatars, onPress }: Props) {
  const visibleAvatars = avatars.slice(0, 3)
  const remainingCount = Math.max(count - visibleAvatars.length, 0)
  const insightLabel = count > 0 ? 'Độ khớp trình độ > 85%' : 'Chưa có yêu cầu mới cần xử lý'

  return (
    <Pressable
      onPress={onPress}
      className="mt-6 overflow-hidden rounded-[32px] p-5 active:scale-[0.98]"
      style={{
        backgroundColor: PROFILE_THEME_COLORS.primaryContainer,
        shadowColor: PROFILE_THEME_COLORS.onBackground,
        shadowOpacity: 0.08,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
        elevation: 7,
      }}
    >
      <View
        className="absolute -right-8 -top-10 h-32 w-32 rounded-full"
        style={{ backgroundColor: withAlpha(PROFILE_THEME_COLORS.onPrimary, 0.1) }}
      />

      <View className="flex-row items-center justify-between gap-4">
        <View className="min-w-0 flex-1">
          <View
            className="self-start rounded-lg border px-2 py-1"
            style={{
              borderColor: withAlpha(PROFILE_THEME_COLORS.onPrimary, 0.2),
              backgroundColor: withAlpha(PROFILE_THEME_COLORS.onPrimary, 0.2),
            }}
          >
            <View className="flex-row items-center">
              <Users size={12} color={withAlpha(PROFILE_THEME_COLORS.onPrimary, 0.8)} />
              <Text className="ml-1.5 text-[10px] font-black uppercase" style={{ color: withAlpha(PROFILE_THEME_COLORS.onPrimary, 0.8) }}>
                YÊU CẦU MỚI
              </Text>
            </View>
          </View>

          <Text className="mt-3 text-[19px] font-black" style={{ color: PROFILE_THEME_COLORS.onPrimary }}>
            {count} người đang chờ duyệt
          </Text>
          <Text className="mt-1 text-[12px] font-medium" style={{ color: PROFILE_THEME_COLORS.secondaryContainer }}>
            {insightLabel}
          </Text>
        </View>

        <View className="flex-row items-center">
          <View className="mr-3 flex-row-reverse">
            {visibleAvatars.map((avatar, index) => (
              <View
                key={`${avatar}-${index}`}
                className={`h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 ${index > 0 ? '-mr-3' : ''}`}
                style={{
                  borderColor: PROFILE_THEME_COLORS.primaryContainer,
                  backgroundColor: withAlpha(PROFILE_THEME_COLORS.onPrimary, 0.9),
                }}
              >
                {isImageSource(avatar) ? (
                  <Image source={{ uri: avatar }} className="h-full w-full" resizeMode="cover" />
                ) : (
                  <Text className="text-[12px] font-black" style={{ color: PROFILE_THEME_COLORS.primaryContainer }}>
                    {getFallbackInitials(avatar)}
                  </Text>
                )}
              </View>
            ))}

            {remainingCount > 0 ? (
              <View
                className="-mr-3 h-10 w-10 items-center justify-center rounded-full border-2"
                style={{ borderColor: PROFILE_THEME_COLORS.primaryContainer, backgroundColor: PROFILE_THEME_COLORS.primary }}
              >
                <Text className="text-[11px] font-black" style={{ color: PROFILE_THEME_COLORS.onPrimary }}>
                  +{remainingCount}
                </Text>
              </View>
            ) : null}
          </View>

          <View
            className="h-10 w-10 items-center justify-center rounded-full border"
            style={{
              borderColor: withAlpha(PROFILE_THEME_COLORS.onPrimary, 0.2),
              backgroundColor: withAlpha(PROFILE_THEME_COLORS.onPrimary, 0.1),
            }}
          >
            <ChevronRight size={18} color={PROFILE_THEME_COLORS.onPrimary} />
          </View>
        </View>
      </View>
    </Pressable>
  )
}
