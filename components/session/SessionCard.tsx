import { colors } from '@/constants/colors'
import { typography } from '@/constants/typography'
import { Pressable, Text, View } from 'react-native'
import { PROFILE_THEME_COLORS } from '@/components/profile/profileTheme'
import { SCREEN_FONTS } from '@/constants/screenFonts'
import { RADIUS, SPACING, BORDER } from '@/constants/screenLayout'

type SessionCardProps = {
  session: {
    id: string
    courtName: string
    district: string
    distanceKm?: number
    startTime: Date
    endTime: Date
    courtBookingStatus: 'booked' | 'pending'
    skillLevel: number
    pricePerPlayer: number
    currentPlayers: number
    maxPlayers: number
    host: {
      id: string
      name: string
      initial: string
    }
  }
  onPress: () => void
  onJoinPress: () => void
}

type ChipVariant = 'urgent' | 'info' | 'warn'

const CARD_HEIGHT = 316
const VI_WEEKDAYS = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']

const AVATAR_PALETTE = [
  { bg: '#E1F5EE', text: '#0F6E56' },
  { bg: '#FAECE7', text: '#993C1D' },
  { bg: '#FAEEDA', text: '#854F0B' },
  { bg: '#EAF2FF', text: '#2256A7' },
]

function hashCode(input: string) {
  let h = 0
  for (let i = 0; i < input.length; i += 1) {
    h = (h << 5) - h + input.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

function getAvatarTone(hostId: string) {
  return AVATAR_PALETTE[hashCode(hostId) % AVATAR_PALETTE.length]
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function getDateLabel(date: Date) {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)

  if (isSameDay(now, date)) return 'Hôm nay'
  if (isSameDay(tomorrow, date)) return 'Ngày mai'

  const weekday = VI_WEEKDAYS[date.getDay()]
  const dd = String(date.getDate()).padStart(2, '0')
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  return `${weekday}, ${dd}/${mm}`
}

function formatTime(date: Date) {
  const hh = String(date.getHours()).padStart(2, '0')
  const mm = String(date.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

function formatPriceVndCompact(value: number) {
  return `${Math.round(value / 1000)}K`
}

function getCourtNameType(name: string) {
  if (name.length <= 18) return typography.displayLg
  if (name.length <= 28) return typography.displayMd
  return typography.displaySm
}

function getPrimaryChip(session: SessionCardProps['session']) {
  const now = new Date().getTime()
  const start = session.startTime.getTime()
  const minutesToStart = Math.floor((start - now) / 60000)
  const remaining = session.maxPlayers - session.currentPlayers

  if (minutesToStart >= 0 && minutesToStart <= 60) {
    return { variant: 'warn' as const, label: 'Sắp bắt đầu' }
  }
  if (session.currentPlayers >= session.maxPlayers) {
    return null
  }
  if (remaining === 1) {
    return { variant: 'urgent' as const, label: 'Còn 1 chỗ' }
  }
  if (remaining === 2) {
    return { variant: 'urgent' as const, label: 'Còn 2 chỗ' }
  }
  if (session.courtBookingStatus === 'booked') {
    return { variant: 'info' as const, label: 'Đã đặt sân' }
  }
  return null
}

function Chip({ variant, label }: { variant: ChipVariant; label: string }) {
  const styleByVariant =
    variant === 'urgent'
      ? { backgroundColor: colors.accentCoralBg, color: colors.accentCoralText }
      : variant === 'warn'
        ? { backgroundColor: colors.statusWarnBg, color: colors.statusWarnText }
        : { backgroundColor: colors.brandPrimaryBg, color: colors.brandPrimaryText }

  return (
    <View
      style={{
        backgroundColor: styleByVariant.backgroundColor,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 3,
        borderRadius: RADIUS.full,
      }}
    >
      <Text numberOfLines={1} style={{ ...typography.labelSm, color: styleByVariant.color }}>
        {label}
      </Text>
    </View>
  )
}

export function SessionCard({ session, onPress, onJoinPress }: SessionCardProps) {
  const chip = getPrimaryChip(session)
  const isFull = session.currentPlayers >= session.maxPlayers
  const courtNameStyle = getCourtNameType(session.courtName.toUpperCase())
  const avatarTone = getAvatarTone(session.host.id)
  const distanceLabel =
    typeof session.distanceKm === 'number' && Number.isFinite(session.distanceKm) ? ` · ${session.distanceKm.toFixed(1)}km` : ''
  const bookingLabel = session.courtBookingStatus === 'booked' ? 'Đã đặt sân' : 'Chờ đặt sân'

  return (
    <Pressable
      onPress={onPress}
      style={{
        height: CARD_HEIGHT,
        marginBottom: 14,
        backgroundColor: colors.bgCard,
        borderColor: colors.borderSubtle,
        borderWidth: BORDER.base,
        borderRadius: RADIUS.md,
        overflow: 'hidden',
      }}
    >
      <View style={{ padding: 16, minHeight: 172 }}>
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={{
            ...courtNameStyle,
            color: colors.textPrimary,
            textTransform: 'uppercase',
            marginBottom: 6,
          }}
        >
          {session.courtName}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <Text style={{ ...typography.bodyMd, color: colors.textSecondary, flexShrink: 1 }} numberOfLines={1}>
            {session.district}
            {distanceLabel}
          </Text>
          {chip ? <Chip variant={chip.variant} label={chip.label} /> : <View />}
        </View>

        <View
          style={{
            backgroundColor: colors.bgTimeBlock,
            borderRadius: RADIUS.sm,
            padding: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            marginBottom: 14,
          }}
        >
          <View>
            <Text style={{ ...typography.bodyXs, color: colors.textSecondary }}>{getDateLabel(session.startTime)}</Text>
            <Text style={{ ...typography.displayMd, color: colors.textPrimary }}>
              {formatTime(session.startTime)}–{formatTime(session.endTime)}
            </Text>
          </View>

          <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <View style={{ width: 6, height: 6, borderRadius: RADIUS.full, backgroundColor: colors.liveGreen }} />
            <Text style={{ ...typography.bodySm, color: session.courtBookingStatus === 'booked' ? colors.brandPrimary : colors.statusWarnText }}>
              {bookingLabel}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Text style={{ ...typography.bodyMd, color: colors.textSecondary }}>Trình độ</Text>
          <View
            style={{
              backgroundColor: colors.brandPrimaryBg,
              paddingHorizontal: 12,
              paddingVertical: 3,
              borderRadius: RADIUS.xs,
            }}
          >
            <Text style={{ ...typography.labelMd, color: colors.brandPrimary }}>Level {session.skillLevel.toFixed(1)}</Text>
          </View>
          <Text style={{ ...typography.bodySm, color: colors.textSecondary, marginLeft: 'auto' }}>khớp với bạn</Text>
        </View>
      </View>

      <View
        style={{
          borderTopColor: colors.borderSubtle,
          borderTopWidth: 0.5,
          paddingVertical: 12,
          paddingHorizontal: SPACING.lg,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, paddingRight: 8 }}>
          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: RADIUS.full,
              backgroundColor: avatarTone.bg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontFamily: SCREEN_FONTS.headline, fontSize: 18, color: avatarTone.text }}>{session.host.initial}</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={{ ...typography.labelMd, color: colors.textPrimary }}>
              {session.host.name}
            </Text>
            <Text style={{ ...typography.bodyXs, color: colors.textSecondary }}>
              Chủ kèo · {session.currentPlayers}/{session.maxPlayers} đã vào
            </Text>
          </View>
        </View>

        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{ ...typography.displayLg, color: colors.textPrimary, lineHeight: 26 }}>
            {formatPriceVndCompact(session.pricePerPlayer)}
          </Text>
          <Text style={{ ...typography.bodyXs, color: colors.textSecondary, marginTop: 2 }}>/người</Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: SPACING.md, paddingTop: 10, paddingBottom: 14 }}>
        <Pressable
          onPress={(event) => {
            event.stopPropagation()
            if (!isFull) onJoinPress()
          }}
          disabled={isFull}
          style={({ pressed }) => ({
            backgroundColor: isFull ? colors.statusWarnBg : colors.accentCoral,
            borderWidth: isFull ? 1 : 0,
            borderColor: colors.borderSubtle,
            borderRadius: RADIUS.sm,
            paddingVertical: 13,
            alignItems: 'center',
            opacity: pressed ? 0.85 : 1,
            shadowColor: isFull ? 'transparent' : colors.accentCoralDark,
            shadowOpacity: isFull ? 0 : 0.16,
            shadowRadius: isFull ? 0 : 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: isFull ? 0 : 2,
          })}
        >
          <Text style={{ ...typography.cta, color: isFull ? colors.statusWarnText : PROFILE_THEME_COLORS.onPrimary }}>{isFull ? 'Đã đủ chỗ' : 'Vào kèo'}</Text>
        </Pressable>
      </View>
    </Pressable>
  )
}

export default SessionCard
