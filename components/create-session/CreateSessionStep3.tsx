import { ShieldCheck } from 'lucide-react-native'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'

import { FeedMatchCard } from '@/components/session/FeedMatchCard'
import type { NearByCourt } from '@/lib/useNearbyCourts'

import { getCreateSessionSkillOption } from './skillLevelOptions'

type Props = {
  selectedCourt: NearByCourt
  selectedDate: Date
  startTime: Date
  endTime: Date
  maxPlayers: number
  maxSkill: number
  bookingStatus: 'confirmed' | 'unconfirmed'
  deadlineHours: number
  requireApproval: boolean
  pricePerPerson: number
  onCreate: () => void
  submitting?: boolean
}

const WEEKDAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

function formatTime(date: Date) {
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

function formatDate(date: Date) {
  return `${WEEKDAY_LABELS[date.getDay()]}, ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
}

function formatPrice(pricePerPerson: number) {
  if (pricePerPerson <= 0) return 'Miễn phí'
  return `${Math.round(pricePerPerson / 1000)}K`
}

export function CreateSessionStep3({
  selectedCourt,
  selectedDate,
  startTime,
  endTime,
  maxPlayers,
  maxSkill,
  bookingStatus,
  deadlineHours,
  requireApproval,
  pricePerPerson,
  onCreate,
  submitting = false,
}: Props) {
  const skill = getCreateSessionSkillOption(maxSkill)
  const SkillIcon = skill.icon
  const skillTagClassName = skill.activeClassName.split(' ').find(token => token.startsWith('bg-')) ?? 'bg-slate-100'
  const skillBorderClassName = skill.activeClassName.split(' ').find(token => token.startsWith('border-')) ?? 'border-slate-300'

  return (
    <View className="flex-1">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 132 }}
        className="flex-1"
      >
        <Text className="mb-2 ml-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">Xem trước</Text>

        <FeedMatchCard
          containerClassName="mb-0"
          courtName={selectedCourt.name}
          address={selectedCourt.city ? `${selectedCourt.address} · ${selectedCourt.city}` : selectedCourt.address}
          timeLabel={`${formatTime(startTime)} - ${formatTime(endTime)}`}
          dateLabel={formatDate(selectedDate)}
          bookingStatus={bookingStatus}
          skillLabel={skill.label}
          skillIcon={skill.icon}
          skillTagClassName={skillTagClassName}
          skillTextClassName={skill.textClassName}
          skillBorderClassName={skillBorderClassName}
          skillIconColor={skill.iconColor}
          eloValue={skill.elo}
          duprValue={skill.dupr}
          matchTypeLabel="Đánh đôi"
          hostName="Bạn"
          priceLabel={formatPrice(pricePerPerson)}
          availabilityLabel={`1/${maxPlayers}`}
          onPress={() => {}}
          disabled
        />

        <View className="mt-1 overflow-hidden rounded-[16px] border border-slate-200 bg-white">
          <View className="flex-row items-center justify-between border-b border-slate-100 p-3.5">
            <Text className="text-[13px] font-medium text-slate-500">Trình tối đa</Text>
            <View className="flex-row items-center gap-1.5">
              <SkillIcon size={14} color={skill.iconColor} />
              <Text className={`text-[13px] font-bold ${skill.textClassName}`}>{skill.label}</Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between border-b border-slate-100 p-3.5">
            <Text className="text-[13px] font-medium text-slate-500">Tự duyệt</Text>
            <Text className="text-[13px] font-bold text-slate-900">{requireApproval ? 'Tắt' : 'Bật'}</Text>
          </View>

          <View className="flex-row items-center justify-between p-3.5">
            <Text className="text-[13px] font-medium text-slate-500">Hạn chốt</Text>
            <Text className="text-[13px] font-bold text-rose-600">{`${deadlineHours} giờ`}</Text>
          </View>
        </View>

        <View className="mt-5 flex-row items-start gap-3 rounded-[16px] border border-indigo-100 bg-indigo-50 p-4">
          <ShieldCheck size={20} color="#6366f1" />
          <Text className="flex-1 text-[13px] font-medium leading-relaxed text-indigo-800">
            Kiểm tra lại trình độ, chi phí và trạng thái booking để bài đăng ra feed đúng ngay từ lần đầu.
          </Text>
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white/95 px-4 pb-8 pt-3 backdrop-blur-md">
        <TouchableOpacity
          activeOpacity={0.92}
          onPress={onCreate}
          disabled={submitting}
          className="h-14 w-full flex-row items-center justify-center rounded-[14px] bg-emerald-600 active:scale-95"
        >
          <Text className="text-[16px] font-bold tracking-wide text-white">
            {submitting ? 'Đang tạo kèo...' : 'Tạo kèo'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
