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

export function PendingRequestsWidget({ count, avatars, onPress }: Props) {
  const visibleAvatars = avatars.slice(0, 3)
  const remainingCount = Math.max(count - visibleAvatars.length, 0)
  const insightLabel = count > 0 ? 'Độ khớp trình độ > 85%' : 'Chưa có yêu cầu mới cần xử lý'

  return (
    <Pressable
      onPress={onPress}
      className="mt-6 overflow-hidden rounded-[32px] bg-indigo-600 p-5 shadow-xl shadow-indigo-900/30 active:scale-[0.98]"
    >
      <View className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/10" />

      <View className="flex-row items-center justify-between gap-4">
        <View className="min-w-0 flex-1">
          <View className="self-start rounded-lg border border-white/20 bg-white/20 px-2 py-1">
            <View className="flex-row items-center">
              <Users size={12} color="rgba(255,255,255,0.8)" />
              <Text className="ml-1.5 text-[10px] font-black uppercase text-white/80">YÊU CẦU MỚI</Text>
            </View>
          </View>

          <Text className="mt-3 text-[19px] font-black text-white">{count} người đang chờ duyệt</Text>
          <Text className="mt-1 text-[12px] font-medium text-indigo-200">{insightLabel}</Text>
        </View>

        <View className="flex-row items-center">
          <View className="mr-3 flex-row-reverse">
            {visibleAvatars.map((avatar, index) => (
              <View
                key={`${avatar}-${index}`}
                className={`h-10 w-10 items-center justify-center overflow-hidden rounded-full border-2 border-indigo-600 bg-white/90 ${index > 0 ? '-mr-3' : ''}`}
              >
                {isImageSource(avatar) ? (
                  <Image source={{ uri: avatar }} className="h-full w-full" resizeMode="cover" />
                ) : (
                  <Text className="text-[12px] font-black text-indigo-700">{getFallbackInitials(avatar)}</Text>
                )}
              </View>
            ))}

            {remainingCount > 0 ? (
              <View className="-mr-3 h-10 w-10 items-center justify-center rounded-full border-2 border-indigo-600 bg-indigo-500">
                <Text className="text-[11px] font-black text-white">+{remainingCount}</Text>
              </View>
            ) : null}
          </View>

          <View className="h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10">
            <ChevronRight size={18} color={PROFILE_THEME_COLORS.onPrimary} />
          </View>
        </View>
      </View>
    </Pressable>
  )
}



