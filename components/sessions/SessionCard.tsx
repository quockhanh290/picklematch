import { colors } from '@/constants/colors'
import { PROFILE_THEME_COLORS } from '@/components/profile/profileTheme'
import { SCREEN_FONTS } from '@/constants/screenFonts'
import { typography } from '@/constants/typography'
import {
  formatDistance,
  formatRelativeDate,
  formatTimeRange,
  formatVND,
  getAvatarColor,
  getCourtNameSize,
} from '@/utils/formatters'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { RADIUS, SPACING } from '@/constants/screenLayout'

interface SessionCardProps {
  session: {
    id: string
    courtName: string
    courtAddress: string
    distanceKm?: number
    courtBookingConfirmed: boolean
    startTime: Date
    endTime: Date
    level: string
    levelDescription?: string
    levelMatchesUser: boolean
    host: {
      id: string
      name: string
      initial: string
    }
    enrolledCount: number
    capacity: number
    pricePerPerson: number
    status: 'open' | 'starting_soon' | 'full' | 'past'
  }
  onPress: () => void
  onJoinPress: () => void
}

type ChipVariant = 'urgent' | 'warn' | 'neutral'

const CARD_HEIGHT = 271

// Decorative avatar tones — intentionally static palette, not theme-sensitive
const AVATAR_PALETTE = [
  { bg: '#E1F5EE', text: '#0F6E56' },
  { bg: '#FAECE7', text: '#993C1D' },
  { bg: '#FAEEDA', text: '#854F0B' },
  { bg: '#EAF2FF', text: '#2256A7' },
]

type ChipState = {
  variant: ChipVariant
  label: string
}

function getStatusChip(status: SessionCardProps['session']['status'], enrolledCount: number, capacity: number): ChipState | null {
  if (status === 'starting_soon') {
    return { variant: 'warn', label: 'Sắp bắt đầu' }
  }

  if (status === 'full') {
    return { variant: 'neutral', label: 'Đã đầy' }
  }

  if (status === 'past') {
    return { variant: 'neutral', label: 'Đã kết thúc' }
  }

  const remaining = capacity - enrolledCount
  if (remaining > 0) {
    return { variant: 'urgent', label: `Còn ${remaining} chỗ` }
  }

  return null
}

function Chip({ variant, label }: { variant: ChipVariant; label: string }) {
  const chipStyle =
    variant === 'urgent'
      ? { backgroundColor: colors.accentLight, textColor: colors.accentDark }
      : variant === 'warn'
        ? { backgroundColor: colors.warningLight, textColor: colors.warningDark }
        : { backgroundColor: colors.surfaceAlt, textColor: colors.textSecondary }

  return (
    <View style={[styles.statusChip, { backgroundColor: chipStyle.backgroundColor }]}>
      <Text numberOfLines={1} style={[typography.labelSm, { color: chipStyle.textColor }]}>
        {label}
      </Text>
    </View>
  )
}

function getDayBadgeBackground(startTime: Date) {
  const todayLabel = formatRelativeDate(new Date())
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowLabel = formatRelativeDate(tomorrow)
  const dateLabel = formatRelativeDate(startTime)

  if (dateLabel === todayLabel) return colors.primary
  if (dateLabel === tomorrowLabel) return colors.textSecondary
  return colors.textMuted
}

export default function SessionCard({ session, onPress, onJoinPress }: SessionCardProps) {
  const disabled = session.status === 'full' || session.status === 'past'
  const isFull = session.status === 'full'
  const chip = getStatusChip(session.status, session.enrolledCount, session.capacity)
  const avatarTone = AVATAR_PALETTE[Math.abs(session.host.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % AVATAR_PALETTE.length]
  const distance = formatDistance(session.distanceKm)
  const addressLine = distance ? `${session.courtAddress} · ${distance}` : session.courtAddress

  const courtNameSize = getCourtNameSize(session.courtName)
  const compactCourtNameSize = courtNameSize === 26 ? 24 : courtNameSize
  const courtNameLineHeight = compactCourtNameSize === 24 ? 26 : compactCourtNameSize === 22 ? 24 : 20

  const ctaLabel = session.status === 'past' ? 'Đã kết thúc' : session.status === 'full' ? 'Đã đầy' : 'Vào kèo'
  const levelChipLabel = session.levelDescription?.trim() || `Level ${session.level}`
  const dateLabel = formatRelativeDate(session.startTime)
  const dayBadgeBackground = getDayBadgeBackground(session.startTime)

  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.topSection}>
        <View style={styles.courtNameWrap}>
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[
              styles.courtName,
              {
                fontSize: compactCourtNameSize,
                lineHeight: courtNameLineHeight,
                color: disabled ? colors.textMuted : colors.text,
              },
            ]}
          >
            {session.courtName.toUpperCase()}
          </Text>
        </View>

        <View style={styles.subHeaderRow}>
          <Text numberOfLines={1} style={[typography.bodyMd, styles.addressText, { color: disabled ? colors.textMuted : colors.textSecondary }]}>
            {addressLine}
          </Text>
          {chip ? <Chip variant={chip.variant} label={chip.label} /> : <View style={styles.statusChipPlaceholder} />}
        </View>

        <View style={styles.timeBlock}>
          <View style={styles.timeLabelRow}>
            <View style={[styles.dayBadge, { backgroundColor: dayBadgeBackground }]}>
              <Text style={styles.dayBadgeText}>{dateLabel.toLocaleUpperCase('vi-VN')}</Text>
            </View>
            <Text style={[styles.timeText, { color: disabled ? colors.textMuted : colors.text }]}>
              {formatTimeRange(session.startTime, session.endTime)}
            </Text>
          </View>

          <View style={styles.bookingWrap}>
            <View style={[styles.statusDot, { backgroundColor: session.courtBookingConfirmed ? colors.success : colors.warning }]} />
            <Text style={[typography.bodySm, { color: session.courtBookingConfirmed ? colors.successText : colors.warningDark }]}>
              {session.courtBookingConfirmed ? 'Đã đặt sân' : 'Chờ đặt sân'}
            </Text>
          </View>
        </View>

        <View style={styles.levelRow}>
          <Text style={[styles.levelLabel, { color: colors.textSecondary }]}>Trình độ</Text>
          <View style={styles.levelChip}>
            <Text style={[styles.levelChipText, { color: colors.primary }]}>{levelChipLabel}</Text>
          </View>
          <Text style={[styles.levelMatchHint, { color: colors.textSecondary }]}>
            {session.levelMatchesUser ? 'khớp với bạn' : 'chưa khớp'}
          </Text>
        </View>
      </View>

      <View style={styles.footerSection}>
        <View style={styles.hostRow}>
          <View style={[styles.avatar, { backgroundColor: avatarTone.bg }]}>
            <Text style={{ fontFamily: SCREEN_FONTS.headline, fontSize: 18, color: avatarTone.text }}>{session.host.initial}</Text>
          </View>
          <View style={styles.hostMeta}>
            <Text numberOfLines={1} style={[styles.hostName, { color: disabled ? colors.textMuted : colors.text }]}>
              {session.host.name}
            </Text>
            <Text style={[typography.bodyXs, { color: disabled ? colors.textMuted : colors.textSecondary }]}>{`Chủ kèo · ${session.enrolledCount}/${session.capacity} đã vào`}</Text>
          </View>
        </View>

        <View style={styles.priceWrap}>
          <Text style={[styles.priceValue, { color: disabled ? colors.textMuted : colors.text }]}>{formatVND(session.pricePerPerson)}</Text>
          <Text style={[typography.bodyXs, styles.priceUnit, { color: disabled ? colors.textMuted : colors.textSecondary }]}>/người</Text>
        </View>
      </View>

      <View style={styles.ctaSection}>
        <Pressable
          disabled={disabled}
          onPress={(event) => {
            event.stopPropagation()
            if (!disabled) {
              onJoinPress()
            }
          }}
          style={[styles.ctaButton, disabled ? styles.ctaButtonDisabled : styles.ctaButtonActive]}
        >
          <Text style={[styles.ctaText, { color: colors.surface }]}>{ctaLabel.toLocaleUpperCase('vi-VN')}</Text>
        </Pressable>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    height: CARD_HEIGHT,
    marginBottom: 12,
    borderRadius: RADIUS.md,
    borderWidth: 0.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  topSection: {
    height: 151,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  courtNameWrap: {
    height: 28,
    marginBottom: 3,
    justifyContent: 'center',
  },
  courtName: {
    fontFamily: SCREEN_FONTS.headline,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  subHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  addressText: {
    flex: 1,
    marginRight: 10,
  },
  statusChipPlaceholder: {
    width: 1,
    height: 1,
  },
  statusChip: {
    borderRadius: RADIUS.full,
    paddingVertical: 4,
    paddingHorizontal: SPACING.sm,
    flexShrink: 0,
  },
  timeBlock: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 8,
  },
  dayBadge: {
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  dayBadgeText: {
    fontFamily: SCREEN_FONTS.cta,
    fontSize: 10,
    lineHeight: 12,
    color: colors.surface,
  },
  timeText: {
    fontFamily: SCREEN_FONTS.headline,
    fontSize: 19,
    lineHeight: 22,
    letterSpacing: 0.3,
  },
  bookingWrap: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
    paddingBottom: 2,
    columnGap: 10,
  },
  levelLabel: {
    fontFamily: SCREEN_FONTS.body,
    fontSize: 12,
    lineHeight: 16,
  },
  levelChip: {
    backgroundColor: colors.primaryLight,
    borderRadius: RADIUS.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  levelChipText: {
    fontFamily: SCREEN_FONTS.label,
    fontSize: 12,
    lineHeight: 16,
  },
  levelMatchHint: {
    fontFamily: SCREEN_FONTS.body,
    fontSize: 11,
    lineHeight: 14,
    marginLeft: 'auto',
  },
  footerSection: {
    height: 52,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
    paddingVertical: SPACING.sm,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: SCREEN_FONTS.headline,
    fontSize: 16,
    lineHeight: 16,
  },
  hostName: {
    fontFamily: SCREEN_FONTS.label,
    fontSize: 13,
    lineHeight: 18,
  },
  hostMeta: {
    marginLeft: 8,
    flex: 1,
  },
  priceWrap: {
    alignItems: 'flex-end',
  },
  priceValue: {
    fontFamily: SCREEN_FONTS.headline,
    fontSize: 26,
    lineHeight: 26,
    letterSpacing: 0.3,
  },
  priceUnit: {
    marginTop: 0,
  },
  ctaSection: {
    height: 68,
    paddingHorizontal: SPACING.md,
    paddingTop: 8,
    paddingBottom: 12,
    justifyContent: 'center',
  },
  ctaButton: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: colors.primaryDark,
    borderRadius: RADIUS.sm,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  ctaButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  ctaButtonDisabled: {
    backgroundColor: PROFILE_THEME_COLORS.outline,
    borderColor: PROFILE_THEME_COLORS.outline,
  },
  ctaText: {
    fontFamily: SCREEN_FONTS.cta,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.2,
  },
})
