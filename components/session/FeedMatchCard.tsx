import { Text, TouchableOpacity, View } from 'react-native'

type Props = {
  courtName: string
  address: string
  timeLabel: string
  dateLabel?: string
  bookingStatus: 'confirmed' | 'unconfirmed'
  skillLabel: string
  matchTypeLabel: string
  hostName: string
  isProvisional?: boolean
  priceLabel: string
  availabilityLabel: string
  onPress: () => void
}

export function FeedMatchCard({
  courtName,
  address,
  timeLabel,
  dateLabel,
  bookingStatus,
  skillLabel,
  matchTypeLabel,
  hostName,
  isProvisional,
  priceLabel,
  availabilityLabel,
  onPress,
}: Props) {
  const isConfirmed = bookingStatus === 'confirmed'
  const isCompetitive = matchTypeLabel.includes('Tính điểm')
  const avatarLetter = (hostName || '?').slice(0, 1).toUpperCase()
  const isFull = availabilityLabel.includes('Đầy') || availabilityLabel.includes('đủ người')

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      className={`mx-5 mb-4 rounded-[28px] border border-gray-100 bg-white p-4 ${
        isConfirmed ? 'opacity-100 shadow-sm' : 'opacity-80'
      }`}
      onPress={onPress}
    >
      <View className="flex-row items-start justify-between">
        <Text className="mr-3 flex-1 text-lg font-bold text-black" numberOfLines={1}>
          {courtName}
        </Text>

        <View className={`rounded-full px-3 py-1.5 ${isConfirmed ? 'bg-green-100' : 'bg-amber-100'}`}>
          <Text className={`text-xs font-bold ${isConfirmed ? 'text-green-700' : 'text-amber-700'}`}>
            {isConfirmed ? '✅ Sân đã chốt' : '⏳ Chờ xác nhận sân'}
          </Text>
        </View>
      </View>

      <View className="mt-3">
        <Text className="text-sm text-gray-500" numberOfLines={1}>
          📍 {address}
        </Text>
        <Text className="mt-1 text-sm text-gray-500">
          🕒 {timeLabel}
          {dateLabel ? ` • ${dateLabel}` : ''}
        </Text>
      </View>

      <View className="mt-3 flex-row items-center justify-between">
        <Text className="mr-3 flex-1 text-sm font-medium text-gray-700">🏆 {skillLabel}</Text>

        <View className={`rounded-full px-3 py-1.5 ${isCompetitive ? 'bg-orange-100' : 'bg-sky-100'}`}>
          <Text className={`text-xs font-bold ${isCompetitive ? 'text-orange-700' : 'text-sky-700'}`}>
            {matchTypeLabel}
          </Text>
        </View>
      </View>

      <View className="my-3 border-t border-gray-100" />

      <View className="flex-row items-center justify-between">
        <View className="flex-1 flex-row items-center">
          <View className="h-6 w-6 items-center justify-center rounded-full bg-gray-900">
            <Text className="text-[10px] font-bold text-white">{avatarLetter}</Text>
          </View>

          <View className="ml-2 flex-row items-center">
            <Text className="text-xs text-gray-500">bởi </Text>
            <Text className="text-xs font-semibold text-gray-800">{hostName || 'Ẩn danh'}</Text>
            {isProvisional ? <Text className="ml-1 text-xs">🛡️</Text> : null}
          </View>
        </View>

        <Text className="mx-3 text-sm font-semibold text-gray-900">💰 {priceLabel}</Text>

        <View className={`rounded-full px-3 py-1.5 ${isFull ? 'bg-rose-50' : 'bg-green-50'}`}>
          <Text className={`text-xs font-bold ${isFull ? 'text-rose-700' : 'text-green-700'}`}>{availabilityLabel}</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}
