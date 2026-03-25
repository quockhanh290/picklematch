import type { LucideIcon } from 'lucide-react-native'
import { Activity, AlertCircle, CircleDollarSign, Clock3, MapPin, ShieldCheck, Target, Users } from 'lucide-react-native'
import { Text, TouchableOpacity, View } from 'react-native'

type Props = {
  courtName: string
  address: string
  timeLabel: string
  dateLabel?: string
  bookingStatus: 'confirmed' | 'unconfirmed'
  skillLabel: string
  skillIcon: LucideIcon
  skillTagClassName: string
  skillTextClassName: string
  skillBorderClassName: string
  skillIconColor: string
  eloValue: number
  duprValue: string
  matchTypeLabel: string
  hostName: string
  hostSkillIcon?: LucideIcon
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

function compactPriceLabel(label: string) {
  const raw = Number(label.replace(/[^\d]/g, ''))
  if (!raw) return label
  return `${Math.round(raw / 1000)}K`
}

export function FeedMatchCard({
  courtName,
  address,
  timeLabel,
  dateLabel,
  bookingStatus,
  skillLabel,
  skillIcon: SkillIcon,
  skillTagClassName,
  skillTextClassName,
  skillBorderClassName,
  skillIconColor,
  eloValue,
  duprValue,
  hostName,
  hostSkillIcon: HostSkillIcon,
  priceLabel,
  availabilityLabel,
  onPress,
}: Props) {
  const isConfirmed = bookingStatus === 'confirmed'
  const avatarLetter = (hostName || '?').slice(0, 1).toUpperCase()
  const counts = extractCounts(availabilityLabel)
  const isFull =
    availabilityLabel.toLowerCase().includes('đầy') ||
    availabilityLabel.toLowerCase().includes('đủ người') ||
    (counts ? counts.first >= counts.second : false)

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      className="mx-5 mb-4 rounded-[28px] border border-slate-200 bg-white px-4 py-3.5"
      onPress={onPress}
    >
      <View className="flex-row items-center justify-between">
        <View className={`flex-row items-center rounded-full px-3 py-2 ${isConfirmed ? 'bg-emerald-50' : 'bg-orange-50'}`}>
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

      <View className="mt-3">
        <View className="flex-row items-center gap-2">
          <Text className="flex-1 text-xl font-black text-gray-900" numberOfLines={1}>
            {courtName}
          </Text>
          <View className={`flex-row items-center rounded-full border px-3 py-1.5 ${isFull ? 'border-rose-700/10 bg-rose-50' : 'border-emerald-700/10 bg-emerald-50'}`}>
            <Users size={12} color={isFull ? '#be123c' : '#047857'} />
            <Text className={`ml-1.5 text-[10px] font-bold uppercase tracking-[1px] ${isFull ? 'text-rose-700' : 'text-emerald-700'}`}>
              {counts ? `${counts.first}/${counts.second}` : availabilityLabel}
            </Text>
          </View>
        </View>

        <View className="mt-1.5 flex-row items-center">
          <MapPin size={15} color="#6b7280" />
          <Text className="ml-2 flex-1 text-sm text-gray-500" numberOfLines={1}>
            {address}
          </Text>
        </View>
      </View>

      <View className="mt-3 flex-row flex-wrap gap-2">
        <View className={`flex-row items-center rounded-full border px-3 py-2 ${skillTagClassName} ${skillBorderClassName}`}>
          <SkillIcon size={13} color={skillIconColor} />
          <Text className={`ml-2 text-xs font-semibold uppercase tracking-[0.8px] ${skillTextClassName}`}>{skillLabel}</Text>
        </View>

        <View className="flex-row items-center rounded-full border border-slate-200 bg-slate-100 px-3 py-2">
          <Target size={12} color="#64748b" />
          <Text className="ml-1.5 text-xs font-semibold uppercase tracking-[0.8px] text-slate-500">{eloValue} ELO</Text>
        </View>

        <View className="flex-row items-center rounded-full border border-slate-200 bg-slate-100 px-3 py-2">
          <Activity size={12} color="#64748b" />
          <Text className="ml-1.5 text-xs font-semibold uppercase tracking-[0.8px] text-slate-500">{duprValue} DUPR</Text>
        </View>
      </View>

      <View className="my-3 h-px bg-gray-100" />

      <View className="flex-row items-center justify-between">
        <View className="flex-1 flex-row items-center">
          <View className="relative h-10 w-10 items-center justify-center rounded-full bg-slate-900">
            <Text className="text-sm font-black text-white">{avatarLetter}</Text>
            <View
              className="absolute -bottom-1 -right-1 h-5 w-5 items-center justify-center rounded-full bg-slate-100"
              style={{ borderWidth: 3, borderColor: '#ffffff' }}
            >
              {HostSkillIcon ? <HostSkillIcon size={10} color="#475569" /> : <SkillIcon size={10} color="#475569" />}
            </View>
          </View>

          <View className="ml-3 flex-1">
            <View className="flex-row items-center">
              <Text className="text-sm font-bold text-gray-900" numberOfLines={1}>
                {hostName || 'Ẩn danh'}
              </Text>
            </View>
          </View>
        </View>

        <View className="ml-3 flex-row items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-2">
          <CircleDollarSign size={14} color="#b45309" />
          <Text className="ml-1.5 text-sm font-bold text-amber-700">{compactPriceLabel(priceLabel)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}
