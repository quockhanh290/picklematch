import { AppButton, ScreenHeader } from '@/components/design'
import { MatchSessionCard } from '@/components/home/MatchSessionCard'
import { PROFILE_THEME_COLORS } from '@/components/profile/profileTheme'
import { type MatchSession, getStatusLabel } from '@/lib/homeFeed'
import type { NearByCourt } from '@/lib/useNearbyCourts'
import { CalendarDays, CircleDollarSign, Gauge, Info, ShieldCheck, ShieldX, Timer, Users } from 'lucide-react-native'
import { ScrollView, Text, View } from 'react-native'

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
  onBack: () => void
  onCreate: () => void
  submitting?: boolean
  submitLabel?: string
}

const WEEKDAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

function formatDate(date: Date) {
  return `${WEEKDAY_LABELS[date.getDay()]}, ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
}

function formatHeroTimeLabel(date: Date, start: Date, end: Date) {
  const pad = (value: number) => value.toString().padStart(2, '0')
  const dateLabel = `${WEEKDAY_LABELS[date.getDay()]}, ${pad(date.getDate())}/${pad(date.getMonth() + 1)}`
  const startClock = `${pad(start.getHours())}:${pad(start.getMinutes())}`
  const endClock = `${pad(end.getHours())}:${pad(end.getMinutes())}`
  return `${dateLabel} \u2022 ${startClock} - ${endClock}`
}

function formatPrice(pricePerPerson: number) {
  if (pricePerPerson <= 0) return '\u004d\u0069\u1ec5\u006e\u0020\u0070\u0068\u00ed'
  return `${Math.round(pricePerPerson / 1000)}K`
}

function toLevelId(level: number): MatchSession['levelId'] {
  const clamped = Math.max(1, Math.min(5, level))
  return `level_${clamped}` as MatchSession['levelId']
}

function getMatchTypeLabel(maxPlayers: number) {
  if (maxPlayers <= 2) return '\u0110\u00e1\u006e\u0068\u0020\u0111\u01a1\u006e'
  return '\u0110\u00e1\u006e\u0068\u0020\u0111\u00f4\u0069'
}

function DetailRow({
  icon: Icon,
  label,
  value,
  valueColor,
}: {
  icon: typeof Info
  label: string
  value: string
  valueColor?: string
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, paddingHorizontal: 14 }}>
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: 999,
          backgroundColor: PROFILE_THEME_COLORS.secondaryContainer,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={14} color={PROFILE_THEME_COLORS.surfaceTint} strokeWidth={2.6} />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: 'PlusJakartaSans-ExtraBold',
            fontSize: 10,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            color: PROFILE_THEME_COLORS.outline,
          }}
        >
          {label}
        </Text>
        <Text
          style={{
            marginTop: 2,
            fontFamily: 'PlusJakartaSans-SemiBold',
            fontSize: 13,
            color: valueColor ?? PROFILE_THEME_COLORS.onSurface,
          }}
        >
          {value}
        </Text>
      </View>
    </View>
  )
}

function RowDivider() {
  return (
    <View style={{ paddingHorizontal: 14 }}>
      <View style={{ height: 1, backgroundColor: PROFILE_THEME_COLORS.outlineVariant }} />
    </View>
  )
}

function SectionTitle({ text }: { text: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 999,
          backgroundColor: PROFILE_THEME_COLORS.primaryContainer,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Info size={12} color={PROFILE_THEME_COLORS.primary} strokeWidth={2.5} />
      </View>
      <Text
        style={{
          fontFamily: 'PlusJakartaSans-ExtraBold',
          fontSize: 12,
          letterSpacing: 1.5,
          textTransform: 'uppercase',
          color: PROFILE_THEME_COLORS.outline,
        }}
      >
        {text}
      </Text>
    </View>
  )
}

export function CreateSessionStep3({
  selectedCourt, selectedDate, startTime, endTime,
  maxPlayers, minSkill, maxSkill, bookingStatus, deadlineMinutes,
  requireApproval, pricePerPerson, onBack, onCreate, submitting = false, submitLabel = '\u0054\u1ea1\u006f\u0020\u006b\u00e8\u006f',
}: Props) {
  const minSkillOption = getCreateSessionSkillOption(minSkill)
  const maxSkillOption = getCreateSessionSkillOption(maxSkill)
  const previewMatch: MatchSession = {
    id: 'preview-upcoming-match',
    title: '\u0058\u0065\u006d\u0020\u0074\u0072\u01b0\u1edb\u0063',
    bookingId: 'PREVIEW',
    courtName: selectedCourt.name,
    address: selectedCourt.city ? `${selectedCourt.address}, ${selectedCourt.city}` : selectedCourt.address,
    matchScore: 90,
    skillLabel: maxSkillOption.label,
    timeLabel: formatHeroTimeLabel(selectedDate, startTime, endTime),
    priceLabel: formatPrice(pricePerPerson),
    openSlotsLabel: `${Math.max(maxPlayers - 1, 0)} \u0063\u0068\u1ed7\u0020\u0074\u0072\u1ed1\u006e\u0067`,
    statusLabel: getStatusLabel(bookingStatus, 'open'),
    isRanked: true,
    activePlayers: 1,
    maxPlayers,
    levelId: toLevelId(maxSkill),
    host: {
      name: '\u0042\u1ea1\u006e',
      initials: 'B',
      rating: 5,
      vibe: '\u0048\u006f\u0073\u0074\u0020\u0111\u0061\u006e\u0067\u0020\u0074\u1ea1\u006f\u0020\u006b\u00e8\u006f\u0020\u006d\u1edb\u0069',
    },
    players: [
      {
        id: 'preview-host',
        name: '\u0042\u1ea1\u006e',
        initials: 'B',
        badge: 'trusted',
      },
    ],
    urgent: false,
    joined: true,
  }

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 28 }}
        style={{ flex: 1 }}
      >
        <ScreenHeader
          variant="brand"
          title="KINETIC"
          onBackPress={onBack}
          style={{ marginHorizontal: -20, marginTop: -12 }}
          rightSlot={<View style={{ width: 32, height: 32 }} />}
        />

        <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 2, paddingTop: 14, paddingBottom: 14 }}>
          <Text style={{ fontFamily: 'PlusJakartaSans-ExtraBoldItalic', fontSize: 56, color: '#00654E', lineHeight: 56, marginTop: 2 }}>03</Text>
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={{ fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 48, color: '#024838', lineHeight: 48 }}>
              {'\u0058\u00e1\u0063\u0020\u006e\u0068\u1ead\u006e'}
            </Text>
            <Text style={{ fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 48, color: '#024838', lineHeight: 48 }}>
              {'\u0054\u1ea1\u006f\u0020\u006b\u00e8\u006f'}
            </Text>
            <View style={{ marginTop: 10, width: 84, height: 4, borderRadius: 999, backgroundColor: '#A5E9D4' }} />
          </View>
        </View>

        <Text style={{ fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1.8, color: PROFILE_THEME_COLORS.outline, marginBottom: 10, marginLeft: 4 }}>
          {'\u0058\u0065\u006d\u0020\u0074\u0072\u01b0\u1edb\u0063'}
        </Text>

        <View pointerEvents="none">
          <MatchSessionCard item={previewMatch} variant="standard" actionLabel={'\u0056\u00e0\u006f\u0020\u006b\u00e8\u006f'} />
        </View>

        <View style={{
          marginTop: 14,
          borderRadius: 22,
          borderWidth: 1,
          borderColor: PROFILE_THEME_COLORS.outlineVariant,
          backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest,
          padding: 12,
        }}>
          <SectionTitle text={'\u0054\u0068\u00f4\u006e\u0067\u0020\u0074\u0069\u006e\u0020\u0063\u0068\u0069\u0020\u0074\u0069\u1ebf\u0074'} />
          <DetailRow
            icon={Users}
            label={'\u004c\u006f\u1ea1\u0069\u0020\u006b\u00e8\u006f'}
            value={getMatchTypeLabel(maxPlayers)}
          />
          <RowDivider />
          <DetailRow
            icon={CircleDollarSign}
            label={'\u0043\u0068\u0069\u0020\u0070\u0068\u00ed\u0020\u002f\u0020\u006e\u0067\u01b0\u1edd\u0069'}
            value={formatPrice(pricePerPerson)}
          />
          <RowDivider />
          <DetailRow icon={Gauge} label={'\u0054\u0072\u00ec\u006e\u0068\u0020\u0074\u1ed1\u0069\u0020\u0074\u0068\u0069\u1ec3\u0075'} value={minSkillOption.label} />
          <RowDivider />
          <DetailRow icon={Gauge} label={'\u0054\u0072\u00ec\u006e\u0068\u0020\u0074\u1ed1\u0069\u0020\u0111\u0061'} value={maxSkillOption.label} />
          <RowDivider />
          <DetailRow
            icon={requireApproval ? ShieldX : ShieldCheck}
            label={'\u0054\u1ef1\u0020\u0064\u0075\u0079\u1ec7\u0074'}
            value={requireApproval ? '\u0054\u1eaf\u0074' : '\u0042\u1ead\u0074'}
          />
          <RowDivider />
          <DetailRow
            icon={Timer}
            label={'\u0048\u1ea1\u006e\u0020\u0063\u0068\u1ed1\u0074'}
            value={deadlineMinutes < 60
              ? `${deadlineMinutes} \u0070\u0068\u00fa\u0074\u0020\u0074\u0072\u01b0\u1edb\u0063\u0020\u0067\u0069\u1edd\u0020\u0062\u1ea5\u0074\u0020\u0111\u1ea7\u0075`
              : `${deadlineMinutes / 60} \u0067\u0069\u1edd\u0020\u0074\u0072\u01b0\u1edb\u0063\u0020\u0067\u0069\u1edd\u0020\u0062\u1ea5\u0074\u0020\u0111\u1ea7\u0075`}
            valueColor={PROFILE_THEME_COLORS.surfaceTint}
          />
          <RowDivider />
          <DetailRow icon={CalendarDays} label={'\u004e\u0067\u00e0\u0079\u0020\u0063\u0068\u01a1\u0069'} value={formatDate(selectedDate)} />
        </View>

        <View style={{
          flexDirection: 'row', alignItems: 'flex-start', gap: 10,
          marginTop: 14, borderRadius: 16, borderWidth: 1,
          borderColor: PROFILE_THEME_COLORS.outlineVariant,
          backgroundColor: PROFILE_THEME_COLORS.secondaryContainer,
          padding: 14,
        }}>
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 999,
              backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Info size={15} color={PROFILE_THEME_COLORS.surfaceTint} strokeWidth={2.5} />
          </View>
          <Text style={{ flex: 1, fontFamily: 'PlusJakartaSans-Regular', fontSize: 13, lineHeight: 20, color: PROFILE_THEME_COLORS.surfaceTint }}>
            {'\u004b\u0069\u1ec3\u006d\u0020\u0074\u0072\u0061\u0020\u006c\u1ea1\u0069\u0020\u0074\u0072\u00ec\u006e\u0068\u0020\u0111\u1ed9\u002c\u0020\u0063\u0068\u0069\u0020\u0070\u0068\u00ed\u0020\u0076\u00e0\u0020\u0074\u0072\u1ea1\u006e\u0067\u0020\u0074\u0068\u00e1\u0069\u0020\u0062\u006f\u006f\u006b\u0069\u006e\u0067\u0020\u0111\u1ec3\u0020\u0062\u00e0\u0069\u0020\u0111\u0103\u006e\u0067\u0020\u0072\u0061\u0020\u0066\u0065\u0065\u0064\u0020\u0111\u00fa\u006e\u0067\u0020\u006e\u0067\u0061\u0079\u0020\u0074\u1eeb\u0020\u006c\u1ea7\u006e\u0020\u0111\u1ea7\u0075\u002e'}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16, marginBottom: 8 }}>
          <View style={{ flex: 1 }}>
            <AppButton
              label={'\u0051\u0075\u0061\u0079\u0020\u006c\u1ea1\u0069'}
              onPress={onBack}
              variant="secondary"
              disabled={submitting}
            />
          </View>
          <View style={{ flex: 1 }}>
            <AppButton
              label={submitLabel}
              onPress={onCreate}
              variant="primary"
              loading={submitting}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  )
}
