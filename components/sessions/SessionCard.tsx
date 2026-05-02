import { PROFILE_THEME_COLORS, PROFILE_THEME_SEMANTIC } from '@/constants/profileTheme'
import { SCREEN_FONTS, typography } from '@/constants/typography'
import { STRINGS } from '@/constants/strings'
import {
  formatDistance,
  formatRelativeDate,
  formatTimeRange,
  formatVND,
  getCourtNameSize,
} from '@/utils/formatters'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { RADIUS, SPACING, BORDER } from '@/constants/screenLayout'

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

const AVATAR_PALETTE = [
  { bg: PROFILE_THEME_COLORS.secondaryContainer, text: PROFILE_THEME_COLORS.primary },
  { bg: PROFILE_THEME_SEMANTIC.dangerBg, text: PROFILE_THEME_SEMANTIC.dangerText },
  { bg: PROFILE_THEME_SEMANTIC.warningBg, text: PROFILE_THEME_SEMANTIC.warningText },
  { bg: PROFILE_THEME_COLORS.tertiaryFixed, text: PROFILE_THEME_COLORS.onTertiaryFixed },
]

type ChipState = {
  variant: ChipVariant
  label: string
}

function getStatusChip(status: SessionCardProps['session']['status'], enrolledCount: number, capacity: number): ChipState | null {
  if (status === 'starting_soon') {
    return { variant: 'warn', label: STRINGS.session.status.starting_soon }
  }

  if (status === 'full') {
    return { variant: 'neutral', label: STRINGS.session.status.full }
  }

  if (status === 'past') {
    return { variant: 'neutral', label: STRINGS.session.status.past }
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
      ? { backgroundColor: PROFILE_THEME_SEMANTIC.warningBg, textColor: PROFILE_THEME_SEMANTIC.warningText }
      : variant === 'warn'
        ? { backgroundColor: PROFILE_THEME_SEMANTIC.warningBg, textColor: PROFILE_THEME_SEMANTIC.warningText }
        : { backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow, textColor: PROFILE_THEME_COLORS.onSurfaceVariant }

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

  if (dateLabel === todayLabel) return PROFILE_THEME_COLORS.primary
  if (dateLabel === tomorrowLabel) return PROFILE_THEME_COLORS.onSurfaceVariant
  return PROFILE_THEME_COLORS.outline
}

export default function SessionCard({ session, onPress, onJoinPress }: SessionCardProps) {
  const disabled = session.status === 'full' || session.status === 'past'
  const chip = getStatusChip(session.status, session.enrolledCount, session.capacity)
  const avatarTone = AVATAR_PALETTE[Math.abs(session.host.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % AVATAR_PALETTE.length]
  const distance = formatDistance(session.distanceKm)
  const addressLine = distance ? `${session.courtAddress} · ${distance}` : session.courtAddress

  const courtNameSize = getCourtNameSize(session.courtName)
  const compactCourtNameSize = courtNameSize === 26 ? 24 : courtNameSize
  const courtNameLineHeight = compactCourtNameSize === 24 ? 26 : compactCourtNameSize === 22 ? 24 : 20

  const ctaLabel = session.status === 'past' ? STRINGS.session.status.past : session.status === 'full' ? STRINGS.session.status.full : STRINGS.session.actions.join
  const levelChipLabel = session.levelDescription?.trim() || `Level ${session.level}`
  const dateLabel = formatRelativeDate(session.startTime)
  const dayBadgeBackground = getDayBadgeBackground(session.startTime)

  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.topSection}>
        <View style={styles.courtNameWrap}>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
            style={[
              styles.courtName,
              {
                fontSize: compactCourtNameSize,
                lineHeight: courtNameLineHeight,
                color: disabled ? PROFILE_THEME_COLORS.outline : PROFILE_THEME_COLORS.onSurface,
              },
            ]}
          >
            {session.courtName.toUpperCase()}
          </Text>
        </View>

        <View style={styles.subHeaderRow}>
          <Text numberOfLines={1} style={[typography.bodyMd, styles.addressText, { color: disabled ? PROFILE_THEME_COLORS.outline : PROFILE_THEME_COLORS.onSurfaceVariant }]}>
            {addressLine}
          </Text>
          {chip ? <Chip variant={chip.variant} label={chip.label} /> : <View style={styles.statusChipPlaceholder} />}
        </View>

        <View style={styles.timeBlock}>
          <View style={styles.timeLabelRow}>
            <View style={[styles.dayBadge, { backgroundColor: dayBadgeBackground }]}>
              <Text style={styles.dayBadgeText}>{dateLabel.toLocaleUpperCase('vi-VN')}</Text>
            </View>
            <Text style={[styles.timeText, { color: disabled ? PROFILE_THEME_COLORS.outline : PROFILE_THEME_COLORS.onSurface }]}>
              {formatTimeRange(session.startTime, session.endTime)}
            </Text>
          </View>

          <View style={styles.bookingWrap}>
            <View style={[styles.statusDot, { backgroundColor: session.courtBookingConfirmed ? PROFILE_THEME_SEMANTIC.successText : PROFILE_THEME_SEMANTIC.warningText }]} />
            <Text style={{ fontFamily: SCREEN_FONTS.cta, fontSize: 10, color: session.courtBookingConfirmed ? PROFILE_THEME_SEMANTIC.successText : PROFILE_THEME_SEMANTIC.warningText, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {session.courtBookingConfirmed ? STRINGS.session.booking.confirmed : STRINGS.session.booking.waiting}
            </Text>
          </View>
        </View>

        <View style={styles.levelRow}>
          <Text style={[styles.levelLabel, { color: PROFILE_THEME_COLORS.onSurfaceVariant }]}>Trình độ</Text>
          <View style={styles.levelChip}>
            <Text style={[styles.levelChipText, { color: PROFILE_THEME_COLORS.primary }]}>{levelChipLabel}</Text>
          </View>
          <Text style={[styles.levelMatchHint, { color: PROFILE_THEME_COLORS.onSurfaceVariant }]}>
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
            <Text numberOfLines={1} style={[styles.hostName, { color: disabled ? PROFILE_THEME_COLORS.outline : PROFILE_THEME_COLORS.onSurface }]}>
              {session.host.name}
            </Text>
            <Text style={[typography.bodyXs, { color: disabled ? PROFILE_THEME_COLORS.outline : PROFILE_THEME_COLORS.onSurfaceVariant }]}>{`Chủ kèo · ${session.enrolledCount}/${session.capacity} đã vào`}</Text>
          </View>
        </View>

        <View style={styles.priceWrap}>
          <Text
            style={[
              styles.priceValue,
              {
                color: disabled 
                  ? PROFILE_THEME_COLORS.outline 
                  : (session.pricePerPerson <= 0 ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.onSurface),
                fontSize: 26,
                lineHeight: 30,
                includeFontPadding: false,
                textAlignVertical: 'center',
              },
            ]}
          >
            {formatVND(session.pricePerPerson)}
          </Text>
          {session.pricePerPerson > 0 && (
            <Text style={[typography.bodyXs, styles.priceUnit, { color: disabled ? PROFILE_THEME_COLORS.outline : PROFILE_THEME_COLORS.onSurfaceVariant }]}>
              /người
            </Text>
          )}
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
          <Text style={[styles.ctaText, { color: PROFILE_THEME_COLORS.onPrimary }]}>{ctaLabel.toLocaleUpperCase('vi-VN')}</Text>
        </Pressable>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    height: CARD_HEIGHT,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: BORDER.hairline,
    borderColor: PROFILE_THEME_COLORS.outlineVariant,
    backgroundColor: PROFILE_THEME_COLORS.surface,
    overflow: 'hidden',
  },
  topSection: {
    height: 151,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
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
    marginBottom: SPACING.sm,
  },
  addressText: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  statusChipPlaceholder: {
    width: 1,
    height: 1,
  },
  statusChip: {
    borderRadius: RADIUS.sm,
    paddingVertical: 4,
    paddingHorizontal: SPACING.sm,
    flexShrink: 0,
  },
  timeBlock: {
    backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow,
    borderRadius: RADIUS.sm,
    paddingVertical: SPACING.sm,
    paddingHorizontal: RADIUS.md,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    columnGap: SPACING.sm,
  },
  dayBadge: {
    borderRadius: RADIUS.xs,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  dayBadgeText: {
    fontFamily: SCREEN_FONTS.headline,
    fontSize: 12,
    lineHeight: 16,
    color: PROFILE_THEME_COLORS.onPrimary,
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
    columnGap: SPACING.sm,
  },
  levelLabel: {
    fontFamily: SCREEN_FONTS.body,
    fontSize: 12,
    lineHeight: 16,
  },
  levelChip: {
    backgroundColor: PROFILE_THEME_COLORS.secondaryContainer,
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
    borderTopColor: PROFILE_THEME_COLORS.outlineVariant,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: SPACING.sm,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: SCREEN_FONTS.headline,
    fontSize: 16,
    lineHeight: 16,
  },
  hostName: {
    fontFamily: SCREEN_FONTS.headline,
    fontSize: 15,
    lineHeight: 18,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  hostMeta: {
    marginLeft: SPACING.sm,
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
    paddingTop: SPACING.sm,
    paddingBottom: RADIUS.md,
    justifyContent: 'center',
  },
  ctaButton: {
    width: '100%',
    height: 48,
    borderRadius: RADIUS.md,
    paddingVertical: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PROFILE_THEME_COLORS.primary,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  ctaButtonActive: {
    backgroundColor: PROFILE_THEME_COLORS.primary,
  },
  ctaButtonDisabled: {
    backgroundColor: PROFILE_THEME_COLORS.outline,
  },
  ctaText: {
    fontFamily: SCREEN_FONTS.headline,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
})
