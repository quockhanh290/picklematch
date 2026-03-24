import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native'

import type { MatchStatus } from '@/lib/matchmaking'

type Props = {
  matchStatus: MatchStatus
  requestStatus: 'none' | 'pending' | 'accepted' | 'rejected'
  hostResponseTemplate?: string | null
  loading?: boolean
  onPress: () => void
}

export function SmartJoinButton({
  matchStatus,
  requestStatus,
  hostResponseTemplate,
  loading,
  onPress,
}: Props) {
  if (requestStatus === 'pending') {
    return (
      <View className="mt-8 rounded-2xl bg-amber-50 px-4 py-4">
        <Text className="text-center text-sm font-semibold text-amber-800">Đang chờ host phản hồi yêu cầu của bạn</Text>
        {hostResponseTemplate ? (
          <Text className="mt-2 text-center text-xs leading-5 text-amber-700">
            Phản hồi gần nhất từ host: {hostResponseTemplate}
          </Text>
        ) : null}
      </View>
    )
  }

  if (requestStatus === 'rejected') {
    return (
      <View className="mt-8 rounded-2xl bg-rose-50 px-4 py-4">
        <Text className="text-center text-sm font-semibold text-rose-700">Yêu cầu trước đó đã bị từ chối</Text>
        {hostResponseTemplate ? (
          <Text className="mt-2 text-center text-xs leading-5 text-rose-600">
            Lời nhắn từ host: {hostResponseTemplate}
          </Text>
        ) : null}
      </View>
    )
  }

  const palette =
    matchStatus === 'MATCHED'
      ? { bg: 'bg-emerald-600', text: 'text-white', label: 'Tham gia ngay' }
      : matchStatus === 'LOWER_SKILL'
        ? { bg: 'bg-orange-500', text: 'text-white', label: 'Xin vào kèo' }
        : { bg: 'bg-sky-600', text: 'text-white', label: 'Đăng ký dự bị' }

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={onPress}
      disabled={loading}
      className={`mt-8 h-14 items-center justify-center rounded-2xl ${palette.bg} ${loading ? 'opacity-70' : ''}`}
    >
      {loading ? (
        <View className="flex-row items-center gap-3">
          <ActivityIndicator color="#fff" />
          <Text className="text-base font-extrabold text-white">Đang xử lý...</Text>
        </View>
      ) : (
        <Text className={`text-base font-extrabold ${palette.text}`}>{palette.label}</Text>
      )}
    </TouchableOpacity>
  )
}
