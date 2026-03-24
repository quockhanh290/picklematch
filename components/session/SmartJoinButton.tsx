import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native'
import { AlertCircle, Clock3, Send, UserPlus, Users } from 'lucide-react-native'

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
      <View className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 px-5 py-4">
        <View className="flex-row items-center">
          <Clock3 size={16} color="#b45309" />
          <Text className="ml-2 text-sm font-bold text-amber-800">Đang chờ host phản hồi</Text>
        </View>
        <Text className="mt-2 text-sm leading-6 text-amber-700">
          Yêu cầu tham gia của bạn đã được gửi. Host sẽ xem và phản hồi sớm.
        </Text>
        {hostResponseTemplate ? (
          <View className="mt-3 rounded-2xl bg-white/70 px-4 py-3">
            <Text className="text-[11px] font-extrabold uppercase tracking-[1px] text-amber-700">Tin nhắn gần nhất</Text>
            <Text className="mt-2 text-sm leading-6 text-amber-800">{hostResponseTemplate}</Text>
          </View>
        ) : null}
      </View>
    )
  }

  if (requestStatus === 'rejected') {
    return (
      <View className="mt-8 rounded-3xl border border-rose-200 bg-rose-50 px-5 py-4">
        <View className="flex-row items-center">
          <AlertCircle size={16} color="#be123c" />
          <Text className="ml-2 text-sm font-bold text-rose-700">Yêu cầu trước đó đã bị từ chối</Text>
        </View>
        {hostResponseTemplate ? (
          <View className="mt-3 rounded-2xl bg-white/80 px-4 py-3">
            <Text className="text-[11px] font-extrabold uppercase tracking-[1px] text-rose-600">Phản hồi từ host</Text>
            <Text className="mt-2 text-sm leading-6 text-rose-700">{hostResponseTemplate}</Text>
          </View>
        ) : null}
      </View>
    )
  }

  const palette =
    matchStatus === 'MATCHED'
      ? {
          bg: 'bg-emerald-600',
          label: 'Tham gia ngay',
          Icon: UserPlus,
        }
      : matchStatus === 'LOWER_SKILL'
        ? {
            bg: 'bg-orange-500',
            label: 'Xin vào kèo',
            Icon: Send,
          }
        : {
            bg: 'bg-sky-600',
            label: 'Đăng ký dự bị',
            Icon: Users,
          }

  const ActionIcon = palette.Icon

  return (
    <TouchableOpacity
      activeOpacity={0.94}
      onPress={onPress}
      disabled={loading}
      className={`mt-8 h-14 flex-row items-center justify-center rounded-2xl ${palette.bg} ${
        loading ? 'opacity-70' : ''
      }`}
    >
      {loading ? (
        <View className="flex-row items-center gap-3">
          <ActivityIndicator color="#fff" />
          <Text className="text-base font-extrabold text-white">Đang xử lý...</Text>
        </View>
      ) : (
        <>
          <ActionIcon size={18} color="#fff" />
          <Text className="ml-2 text-base font-extrabold text-white">{palette.label}</Text>
        </>
      )}
    </TouchableOpacity>
  )
}
