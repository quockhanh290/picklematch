import { colors } from '@/constants/colors'
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

const CARD_HEIGHT = 344

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

export default function SessionCard({ session, onPress, onJoinPress }: SessionCardProps) {
  const disabled = session.status === 'full' || session.status === 'past'
  const chip = getStatusChip(session.status, session.enrolledCount, session.capacity)
  const avatar = getAvatarColor(session.host.id)
  const distance = formatDistance(session.distanceKm)
  const addressLine = distance ? `${session.courtAddress} · ${distance}` : session.courtAddress

  const courtNameSize = getCourtNameSize(session.courtName)
  const courtNameLineHeight = courtNameSize === 26 ? 28 : courtNameSize === 22 ? 24 : 20

  const ctaLabel = session.status === 'past' ? 'Đã kết thúc' : session.status === 'full' ? 'Đã đầy' : 'Vào kèo'
  const levelChipLabel = session.levelDescription?.trim() || `Level ${session.level}`

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
                fontSize: courtNameSize,
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
          <View>
            <Text style={[typography.bodyXs, { color: colors.textSecondary }]}>{formatRelativeDate(session.startTime)}</Text>
            <Text style={[typography.displayMd, { color: disabled ? colors.textMuted : colors.text }]}>
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
          <Text style={[typography.bodyMd, { color: colors.textSecondary }]}>Trình độ</Text>
          <View style={styles.levelChip}>
            <Text style={[typography.labelMd, { color: colors.primary }]}>{levelChipLabel}</Text>
          </View>
          <Text style={[typography.bodySm, styles.levelMatchHint, { color: colors.textSecondary }]}>
            {session.levelMatchesUser ? 'khớp với bạn' : 'chưa khớp'}
          </Text>
        </View>
      </View>

      <View style={styles.footerSection}>
        <View style={styles.hostRow}>
          <View style={[styles.avatar, { backgroundColor: avatar.bg }]}>
            <Text style={[styles.avatarInitial, { color: avatar.fg }]}>{session.host.initial}</Text>
          </View>
          <View style={styles.hostMeta}>
            <Text numberOfLines={1} style={[typography.labelMd, { color: disabled ? colors.textMuted : colors.text }]}>
              {session.host.name}
            </Text>
            <Text style={[typography.bodyXs, { color: disabled ? colors.textMuted : colors.textSecondary }]}>{`Chủ kèo · ${session.enrolledCount}/${session.capacity} đã vào`}</Text>
          </View>
        </View>

        <View style={styles.priceWrap}>
          <Text style={[styles.priceValue, { color: disabled ? colors.textMuted : colors.text }]}>{formatVND(session.pricePerPerson)}</Text>
          <Text style={[typography.bodyXs, { color: disabled ? colors.textMuted : colors.textSecondary }]}>/người</Text>
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
          <Text style={[typography.cta, { color: '#FFFFFF' }]}>{ctaLabel}</Text>
        </Pressable>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
    height: CARD_HEIGHT,
    marginBottom: 12,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  topSection: {
    height: 196,
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  courtNameWrap: {
    height: 28,
    marginBottom: 6,
    justifyContent: 'center',
  },
  courtName: {
    fontFamily: 'BarlowCondensed-Bold',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  subHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
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
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 10,
    flexShrink: 0,
  },
  timeBlock: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
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
    marginBottom: 12,
    columnGap: 10,
  },
  levelChip: {
    backgroundColor: colors.primaryLight,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 3,
  },
  levelMatchHint: {
    marginLeft: 'auto',
  },
  footerSection: {
    height: 62,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 18,
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
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: 'BarlowCondensed-Bold',
    fontSize: 18,
    lineHeight: 18,
  },
  hostMeta: {
    marginLeft: 10,
    flex: 1,
  },
  priceWrap: {
    alignItems: 'flex-end',
  },
  priceValue: {
    fontFamily: 'BarlowCondensed-Bold',
    fontSize: 26,
    lineHeight: 26,
    letterSpacing: 0.3,
  },
  ctaSection: {
    height: 86,
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 14,
    justifyContent: 'center',
  },
  ctaButton: {
    width: '100%',
    height: 48,
    borderWidth: 1,
    borderColor: colors.primaryDark,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primaryDark,
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  ctaButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  ctaButtonDisabled: {
    backgroundColor: '#6B7280',
    borderColor: '#6B7280',
  },
})
