import { PROFILE_THEME_COLORS } from '@/components/profile/profileTheme'
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Info } from 'lucide-react-native'

import { FeedMatchCard } from '@/components/session/FeedMatchCard'
import type { NearByCourt } from '@/lib/useNearbyCourts'

import { getCreateSessionSkillOption } from './skillLevelOptions'

type Props = {
  selectedCourt: NearByCourt
  selectedDate: Date
  startTime: Date
  endTime: Date
  maxPlayers: number
  minSkill: number
  maxSkill: number
  bookingStatus: 'confirmed' | 'unconfirmed'
  deadlineMinutes: number
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

function SummaryRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13, paddingHorizontal: 16 }}>
      <Text style={{ fontFamily: 'PlusJakartaSans-Regular', fontSize: 13, color: PROFILE_THEME_COLORS.onSurfaceVariant }}>
        {label}
      </Text>
      <Text style={{ fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 13, color: valueColor ?? PROFILE_THEME_COLORS.onSurface }}>
        {value}
      </Text>
    </View>
  )
}

export function CreateSessionStep3({
  selectedCourt, selectedDate, startTime, endTime,
  maxPlayers, minSkill, maxSkill, bookingStatus, deadlineMinutes,
  requireApproval, pricePerPerson, onCreate, submitting = false,
}: Props) {
  const minSkillOption = getCreateSessionSkillOption(minSkill)
  const skill = getCreateSessionSkillOption(maxSkill)
  const skillTagClassName = skill.activeClassName.split(' ').find(t => t.startsWith('bg-')) ?? 'bg-slate-100'
  const skillBorderClassName = skill.activeClassName.split(' ').find(t => t.startsWith('border-')) ?? 'border-slate-300'

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        style={{ flex: 1 }}
      >
        <Text style={{ fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.8, color: PROFILE_THEME_COLORS.outline, marginBottom: 10, marginLeft: 4 }}>
          Xem trước
        </Text>

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

        {/* Summary */}
        <View style={{
          marginTop: 12, borderRadius: 20, borderWidth: 1,
          borderColor: PROFILE_THEME_COLORS.outlineVariant,
          backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest,
          overflow: 'hidden',
        }}>
          <SummaryRow label="Trình tối thiểu" value={minSkillOption.label} />
          <View style={{ height: 1, backgroundColor: PROFILE_THEME_COLORS.outlineVariant }} />
          <SummaryRow label="Trình tối đa" value={skill.label} />
          <View style={{ height: 1, backgroundColor: PROFILE_THEME_COLORS.outlineVariant }} />
          <SummaryRow label="Tự duyệt" value={requireApproval ? 'Tắt' : 'Bật'} />
          <View style={{ height: 1, backgroundColor: PROFILE_THEME_COLORS.outlineVariant }} />
          <SummaryRow
            label="Hạn chốt"
            value={deadlineMinutes < 60 ? `${deadlineMinutes} phút trước giờ bắt đầu` : `${deadlineMinutes / 60} giờ trước giờ bắt đầu`}
            valueColor={PROFILE_THEME_COLORS.surfaceTint}
          />
        </View>

        {/* Info banner */}
        <View style={{
          flexDirection: 'row', alignItems: 'flex-start', gap: 12,
          marginTop: 16, borderRadius: 20, borderWidth: 1,
          borderColor: PROFILE_THEME_COLORS.outlineVariant,
          backgroundColor: PROFILE_THEME_COLORS.secondaryContainer,
          padding: 16,
        }}>
          <Info size={18} color={PROFILE_THEME_COLORS.surfaceTint} />
          <Text style={{ flex: 1, fontFamily: 'PlusJakartaSans-Regular', fontSize: 13, lineHeight: 20, color: PROFILE_THEME_COLORS.surfaceTint }}>
            Kiểm tra lại trình độ, chi phí và trạng thái booking để bài đăng ra feed đúng ngay từ lần đầu.
          </Text>
        </View>
      </ScrollView>

      <SafeAreaView
        edges={['bottom']}
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          borderTopWidth: 1, borderTopColor: PROFILE_THEME_COLORS.outlineVariant,
          backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest,
          paddingHorizontal: 20, paddingTop: 14, paddingBottom: 12,
        }}
      >
        <Pressable
          onPress={onCreate}
          disabled={submitting}
          style={({ pressed }) => ({
            height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
            borderRadius: 14, backgroundColor: PROFILE_THEME_COLORS.primary,
            opacity: submitting ? 0.7 : pressed ? 0.88 : 1,
          })}
        >
          {submitting ? <ActivityIndicator size="small" color={PROFILE_THEME_COLORS.onPrimary} /> : null}
          <Text style={{ fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 16, color: PROFILE_THEME_COLORS.onPrimary }}>
            {submitting ? 'Đang tạo kèo...' : 'Tạo kèo'}
          </Text>
        </Pressable>
      </SafeAreaView>
    </View>
  )
}
