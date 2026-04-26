import { router } from 'expo-router'
import { Image, Pressable, Text, View } from 'react-native'

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

  return (
    <View className="flex-row items-start justify-between" style={{ paddingHorizontal: 16, paddingTop: 4 }}>
      <View className="min-w-0 flex-1 pr-4">
        <Text
          className="mb-[3px] text-[11px]"
          style={{ color: '#7A8884', fontFamily: 'PlusJakartaSans-SemiBold', lineHeight: 15 }}
        >
          {getGreetingLabel()}
        </Text>

        <Text
          className="text-[32px] uppercase"
          numberOfLines={1}
          ellipsizeMode="tail"
          style={{ color: '#1A2E2A', fontFamily: 'BarlowCondensed-Bold', lineHeight: 34, letterSpacing: 0 }}
        >
          {displayName.toUpperCase()}
        </Text>

        <Text
          className="mt-1 text-[12px]"
          numberOfLines={1}
          ellipsizeMode="tail"
          style={{ color: '#7A8884', fontFamily: 'PlusJakartaSans-Regular', lineHeight: 17 }}
        >
          {statusPrompt}
        </Text>
      </View>

      <Pressable
        onPress={() => router.push('/(tabs)/profile' as never)}
        className="h-[42px] w-[42px] items-center justify-center overflow-hidden rounded-full border-2"
        style={{ backgroundColor: '#E1F5EE', borderColor: '#C5DDD3' }}
      >
        {profilePhotoUrl ? (
          <Image source={{ uri: profilePhotoUrl }} className="h-full w-full" resizeMode="cover" />
        ) : (
          <Text style={{ color: '#0F6E56', fontFamily: 'BarlowCondensed-Bold', fontSize: 18, lineHeight: 22 }}>
            {initial}
          </Text>
        )}
      </Pressable>
    </View>
  )
}
