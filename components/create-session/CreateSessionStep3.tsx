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
  if (pricePerPerson <= 0) return '\u004d\u0069\u1ec5\u006e\u0020\u0070\u0068\u00ed'
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
        <Text className="mb-2 ml-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
          {'\u0042\u1ea3\u006e\u0020\u0078\u0065\u006d\u0020\u0074\u0072\u01b0\u1edb\u0063\u0020\u0028\u0050\u0072\u0065\u0076\u0069\u0065\u0077\u0029'}
        </Text>

        <FeedMatchCard
          containerClassName="mb-0"
          courtName={selectedCourt.name}
          address={selectedCourt.city ? `${selectedCourt.address} \u00b7 ${selectedCourt.city}` : selectedCourt.address}
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
          matchTypeLabel={'\u0110\u00e1\u006e\u0068\u0020\u0111\u00f4\u0069'}
          hostName={'\u0042\u1ea1\u006e'}
          priceLabel={formatPrice(pricePerPerson)}
          availabilityLabel={`1/${maxPlayers}`}
          onPress={() => {}}
          disabled
        />

        <View className="mt-1 overflow-hidden rounded-[16px] border border-slate-200 bg-white">
          <View className="flex-row items-center justify-between border-b border-slate-100 p-3.5">
            <Text className="text-[13px] font-medium text-slate-500">Max Skill</Text>
            <View className="flex-row items-center gap-1.5">
              <SkillIcon size={14} color={skill.iconColor} />
              <Text className={`text-[13px] font-bold ${skill.textClassName}`}>{skill.label}</Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between border-b border-slate-100 p-3.5">
            <Text className="text-[13px] font-medium text-slate-500">Auto-approve</Text>
            <Text className="text-[13px] font-bold text-slate-900">{requireApproval ? '\u0054\u1eaft' : '\u0042\u1ead\u0074'}</Text>
          </View>

          <View className="flex-row items-center justify-between p-3.5">
            <Text className="text-[13px] font-medium text-slate-500">Deadline</Text>
            <Text className="text-[13px] font-bold text-rose-600">{`${deadlineHours} \u0067\u0069\u1edd`}</Text>
          </View>
        </View>

        <View className="mt-5 flex-row items-start gap-3 rounded-[16px] border border-indigo-100 bg-indigo-50 p-4">
          <ShieldCheck size={20} color="#6366f1" />
          <Text className="flex-1 text-[13px] font-medium leading-relaxed text-indigo-800">
            {'\u004b\u0069\u1ec3\u006d\u0020\u0074\u0072\u0061\u0020\u006c\u1ea1\u0069\u0020\u0074\u0072\u00ec\u006e\u0068\u0020\u0111\u1ed9\u002c\u0020\u0063\u0068\u0069\u0020\u0070\u0068\u00ed\u0020\u0076\u00e0\u0020\u0074\u0072\u1ea1\u006e\u0067\u0020\u0074\u0068\u00e1\u0069\u0020\u0062\u006f\u006f\u006b\u0069\u006e\u0067\u0020\u0111\u1ec3\u0020\u0062\u00e0\u0069\u0020\u0111\u0103\u006e\u0067\u0020\u0072\u0061\u0020\u0066\u0065\u0065\u0064\u0020\u0111\u00fa\u006e\u0067\u0020\u006e\u0067\u0061\u0079\u0020\u0074\u1eeb\u0020\u006c\u1ea7\u006e\u0020\u0111\u1ea7\u0075\u002e'}
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
            {submitting ? '\u0110\u0061\u006e\u0067\u0020\u0074\u1ea1\u006f\u0020\u006b\u00e8\u006f\u002e\u002e\u002e' : '\u0054\u1ea1\u006f\u0020\u006b\u00e8\u006f'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
