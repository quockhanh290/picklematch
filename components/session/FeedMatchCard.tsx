import { AlertCircle, Clock3, MapPin, ShieldCheck, Swords, Users } from 'lucide-react-native'
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

function extractCounts(label: string) {
  const match = label.match(/(\d+)\s*\/\s*(\d+)/)
  if (!match) return null
  return {
    first: Number(match[1]),
    second: Number(match[2]),
  }
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
  const avatarLetter = (hostName || '?').slice(0, 1).toUpperCase()
  const isCompetitive = matchTypeLabel.toLowerCase().includes('tính điểm')
  const counts = extractCounts(availabilityLabel)
  const isFull =
    availabilityLabel.toLowerCase().includes('đầy') ||
    availabilityLabel.toLowerCase().includes('đủ người') ||
    (counts ? counts.first >= counts.second : false)

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      className="mx-5 mb-4 rounded-3xl border border-gray-100 bg-white px-4 py-4 shadow-sm"
      onPress={onPress}
    >
      <View className="flex-row items-center justify-between">
        <View
          className={`flex-row items-center rounded-full px-3 py-2 ${
            isConfirmed ? 'bg-emerald-50' : 'bg-orange-50'
          }`}
        >
          {isConfirmed ? <ShieldCheck size={14} color="#047857" /> : <AlertCircle size={14} color="#c2410c" />}
          <Text className={`ml-2 text-xs font-bold ${isConfirmed ? 'text-emerald-700' : 'text-orange-700'}`}>
            {isConfirmed ? 'Sân đã chốt' : 'Chờ xác nhận'}
          </Text>
        </View>

        <View className="flex-row items-center rounded-full bg-indigo-50 px-3 py-2">
          <Clock3 size={14} color="#4338ca" />
          <Text className="ml-2 text-xs font-bold text-indigo-700">
            {timeLabel}
            {dateLabel ? ` • ${dateLabel}` : ''}
          </Text>
        </View>
      </View>

      <View className="mt-4">
        <Text className="text-xl font-black text-gray-900" numberOfLines={1}>
          {courtName}
        </Text>
        <View className="mt-2 flex-row items-center">
          <MapPin size={15} color="#6b7280" />
          <Text className="ml-2 flex-1 text-sm text-gray-500" numberOfLines={1}>
            {address}
          </Text>
        </View>
      </View>

      <View className="mt-4 flex-row flex-wrap gap-2">
        <View className="rounded-full border border-gray-100 bg-gray-50 px-3 py-2">
          <Text className="text-xs font-semibold uppercase tracking-[0.8px] text-gray-600">{skillLabel}</Text>
        </View>

        <View className="flex-row items-center rounded-full border border-gray-100 bg-gray-50 px-3 py-2">
          <Swords size={13} color="#4b5563" />
          <Text className="ml-2 text-xs font-semibold uppercase tracking-[0.8px] text-gray-600">
            {isCompetitive ? 'Tính điểm' : matchTypeLabel}
          </Text>
        </View>
      </View>

      <View className="my-4 h-px bg-gray-100" />

      <View className="flex-row items-center justify-between">
        <View className="flex-1 flex-row items-center">
          <View className="h-11 w-11 items-center justify-center rounded-full bg-gray-900">
            <Text className="text-sm font-black text-white">{avatarLetter}</Text>
          </View>

          <View className="ml-3 flex-1">
            <Text className="text-[10px] font-extrabold uppercase tracking-[1.4px] text-gray-400">Host</Text>
            <View className="mt-1 flex-row items-center">
              <Text className="text-sm font-bold text-gray-900" numberOfLines={1}>
                {hostName || 'Ẩn danh'}
              </Text>
              {isProvisional ? (
                <View className="ml-2 rounded-full bg-emerald-50 px-2 py-1">
                  <Text className="text-[10px] font-bold uppercase tracking-[1px] text-emerald-700">Provisional</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <View className="ml-3 items-end">
          <Text className="text-[10px] font-extrabold uppercase tracking-[1.4px] text-gray-400">Chi phí</Text>
          <Text className="mt-1 text-lg font-black text-gray-900">{priceLabel}</Text>
          <View
            className={`mt-2 flex-row items-center rounded-full px-3 py-2 ${
              isFull ? 'bg-gray-100' : 'bg-emerald-50'
            }`}
          >
            <Users size={13} color={isFull ? '#4b5563' : '#047857'} />
            <Text className={`ml-2 text-xs font-bold ${isFull ? 'text-gray-600' : 'text-emerald-700'}`}>
              {counts ? `${counts.first}/${counts.second}` : availabilityLabel}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
}
