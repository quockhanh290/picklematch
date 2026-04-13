import { CheckCircle2, Clock3, CreditCard, MapPin, Trophy } from 'lucide-react-native'
import { Text, View } from 'react-native'

type Props = {
  sessionSkillLabel: string
  courtBookingStatus: 'confirmed' | 'unconfirmed'
  courtName: string
  courtAddress: string
  courtCity: string
  timeLabel: string
  priceLabel: string
}

export function SessionMetaCard({
  sessionSkillLabel,
  courtBookingStatus,
  courtName,
  courtAddress,
  courtCity,
  timeLabel,
  priceLabel,
}: Props) {
  return (
    <View className="mt-4 rounded-[32px] border border-slate-200 bg-white px-5 pb-5 pt-4 shadow-sm">
      <View className="flex-row flex-wrap items-center gap-2">
        <View className="flex-row items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-2">
          <Trophy size={14} color="#b45309" strokeWidth={2.5} />
          <Text className="ml-2 text-[11px] font-black uppercase tracking-[0.9px] text-amber-700">{sessionSkillLabel}</Text>
        </View>

        <View
          className={`flex-row items-center rounded-full border px-3 py-2 ${
            courtBookingStatus === 'confirmed' ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'
          }`}
        >
          <CheckCircle2
            size={14}
            color={courtBookingStatus === 'confirmed' ? '#059669' : '#b45309'}
            strokeWidth={2.5}
          />
          <Text
            className={`ml-2 text-[11px] font-black uppercase tracking-[0.9px] ${
              courtBookingStatus === 'confirmed' ? 'text-emerald-700' : 'text-amber-700'
            }`}
          >
            {courtBookingStatus === 'confirmed' ? 'Sân đã chốt' : 'Sân chờ xác nhận'}
          </Text>
        </View>
      </View>

      <Text className="mt-5 text-[28px] font-black leading-9 text-slate-950">{courtName}</Text>
      <View className="mt-3 flex-row items-start gap-2">
        <MapPin size={16} color="#64748b" strokeWidth={2.5} />
        <Text className="flex-1 text-[14px] leading-6 text-slate-500">
          {courtAddress} • {courtCity}
        </Text>
      </View>

      <View className="mt-5 rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
        <View className="flex-row items-center">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
            <Clock3 size={18} color="#4f46e5" strokeWidth={2.5} />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Thời gian</Text>
            <Text className="mt-1 text-[14px] font-bold leading-5 text-slate-900">{timeLabel}</Text>
          </View>
        </View>

        <View className="my-4 h-px bg-slate-100" />

        <View className="flex-row items-center">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-orange-100">
            <CreditCard size={18} color="#ea580c" strokeWidth={2.5} />
          </View>
          <View className="ml-3 flex-1">
            <Text className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Chi phí</Text>
            <Text className="mt-1 text-[14px] font-bold text-slate-900">{priceLabel}</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
