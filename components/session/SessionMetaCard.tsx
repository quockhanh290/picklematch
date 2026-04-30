import { PROFILE_THEME_COLORS, PROFILE_THEME_SEMANTIC } from '@/constants/theme/profileTheme'
import { SCREEN_FONTS } from '@/constants/typography'
import { getSkillLevelUi } from '@/lib/skillLevelUi'
import { MapPin, MessageSquareText } from 'lucide-react-native'
import { Text, View } from 'react-native'
import { RADIUS, SPACING, SHADOW, BORDER } from '@/constants/screenLayout'
import type { EloLevelId } from '@/lib/eloSystem'

type Props = {
  skillLevelId: EloLevelId
  sessionSkillLabel: string
  courtBookingStatus: 'confirmed' | 'unconfirmed'
  courtName: string
  courtAddress: string
  courtCity: string
  timeLabel: string
  priceLabel: string
  isRanked?: boolean | null
  hostNote?: string | null
  sessionStatus?: string | null
  resultsStatus?: string | null
  userResult?: 'win' | 'loss' | 'draw' | null
  maxPlayers: number
}

function withAlpha(hex: string, alpha: number) {
  const clean = hex.replace('#', '')
  const n = Number.parseInt(clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean, 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

export function SessionMetaCard({
  skillLevelId,
  sessionSkillLabel,
  courtBookingStatus,
  courtName,
  courtAddress,
  courtCity,
  timeLabel,
  priceLabel,
  isRanked,
  hostNote,
  sessionStatus,
  resultsStatus,
  userResult,
  maxPlayers,
}: Props) {
  const levelUi = getSkillLevelUi(skillLevelId)
  const LevelIcon = levelUi.icon
  const [datePart, clockPart] = timeLabel.split('•').map((s) => s.trim())
  const timeRangeLabel = clockPart ?? timeLabel
  const compactAddress = [courtAddress, courtCity]
    .filter(Boolean)
    .join(', ')
    .split(',')
    .slice(0, 3)
    .join(',')
  const isConfirmed = courtBookingStatus === 'confirmed'
  const isClosedRecruitment = sessionStatus === 'closed_recruitment'
  const isRankedMatch = isRanked ?? true
  const onAccent = PROFILE_THEME_COLORS.onPrimary
  const isFinished = sessionStatus === 'done'
  const isPendingResult = sessionStatus === 'pending_completion'
  const isDuringMatch = sessionStatus === 'in_progress'
  const isFinalized = resultsStatus === 'finalized'

  let bookingStatusLabel = isConfirmed ? 'Đã đặt sân' : 'Chưa đặt sân'
  let statusColor = isConfirmed ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_SEMANTIC.warningStrong

  if (sessionStatus === 'cancelled') {
    bookingStatusLabel = 'Đã hủy'
    statusColor = PROFILE_THEME_COLORS.error
  } else if (isFinished || isPendingResult || isDuringMatch || isFinalized) {
    if ((isFinished || isPendingResult || isFinalized) && !isRankedMatch) {
      bookingStatusLabel = 'Đã kết thúc'
      statusColor = PROFILE_THEME_COLORS.onSurfaceVariant
    } else if (isFinalized) {
      if (userResult === 'win') {
        bookingStatusLabel = 'Thắng'
        statusColor = PROFILE_THEME_COLORS.primary
      } else if (userResult === 'loss') {
        bookingStatusLabel = 'Thua'
        statusColor = PROFILE_THEME_COLORS.error
      } else {
        bookingStatusLabel = 'Đã kết thúc'
        statusColor = PROFILE_THEME_COLORS.onSurfaceVariant
      }
    } else if (resultsStatus === 'not_submitted') {
      bookingStatusLabel = 'Chờ nhập kết quả'
      statusColor = PROFILE_THEME_SEMANTIC.warningStrong
    } else if (resultsStatus === 'pending_confirmation' || resultsStatus === 'disputed') {
      bookingStatusLabel = 'Đang xác nhận'
      statusColor = PROFILE_THEME_SEMANTIC.warningStrong
    } else if (isDuringMatch) {
      bookingStatusLabel = 'Đang diễn ra'
      statusColor = PROFILE_THEME_COLORS.primary
    } else if (isFinished || isPendingResult) {
      bookingStatusLabel = 'Đã kết thúc'
      statusColor = PROFILE_THEME_COLORS.onSurfaceVariant
    }
  } else if (isClosedRecruitment) {
    bookingStatusLabel = 'Đã ngừng nhận người'
    statusColor = PROFILE_THEME_COLORS.onSurfaceVariant
  }

  return (
    <View
      style={{
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
        backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest,
        borderWidth: BORDER.hairline,
        borderColor: PROFILE_THEME_COLORS.outlineVariant,
        ...SHADOW.sm,
      }}
    >
      <View style={{ position: 'relative' }}>
        <View
          style={{
            backgroundColor: PROFILE_THEME_COLORS.primary,
            paddingHorizontal: 16,
            paddingVertical: SPACING.xs,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 6 }}>
            <View style={{ width: 5, height: 5, borderRadius: RADIUS.full, backgroundColor: PROFILE_THEME_COLORS.onPrimary }} />
            <Text
              style={{
                color: PROFILE_THEME_COLORS.onPrimary,
                fontFamily: SCREEN_FONTS.cta,
                fontSize: 11,
                letterSpacing: 0.5,
              }}
            >
              {'THÔNG TIN KÈO'}
            </Text>
          </View>

          <Text
            style={{
              color: withAlpha(PROFILE_THEME_COLORS.onPrimary, 0.8),
              fontFamily: SCREEN_FONTS.label,
              fontSize: 11,
            }}
          >
            {maxPlayers === 2 ? 'Đánh đơn' : 'Đánh đôi'}
          </Text>
        </View>

        <View style={{ paddingTop: 12, paddingHorizontal: 16, paddingBottom: 12 }}>
          <Text
            numberOfLines={2}
            style={{
              color: PROFILE_THEME_COLORS.onSurface,
              fontFamily: SCREEN_FONTS.headline,
              fontSize: 31,
              lineHeight: 36,
              letterSpacing: 0,
              marginBottom: 4,
              textTransform: 'uppercase',
            }}
          >
            {courtName}
          </Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 6 }}>
            <MapPin size={13} color={PROFILE_THEME_COLORS.onSurfaceVariant} strokeWidth={2.5} />
            <Text numberOfLines={1} ellipsizeMode="tail" style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: SCREEN_FONTS.body, fontSize: 13, lineHeight: 18, flexShrink: 1 }}>
              {compactAddress}
            </Text>
          </View>
        </View>
      </View>

      <View style={{ backgroundColor: PROFILE_THEME_COLORS.surfaceAlt, paddingTop: 14, paddingHorizontal: 16, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <View>
            <Text style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: SCREEN_FONTS.label, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>
              {'THỜI GIAN'}
            </Text>
            <Text
              style={{
                color: PROFILE_THEME_COLORS.onSurface,
                fontFamily: SCREEN_FONTS.headline,
                fontSize: 33,
                lineHeight: 33,
                letterSpacing: 0,
              }}
            >
              {clockPart || timeLabel}
            </Text>
            <Text style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: SCREEN_FONTS.body, fontSize: 13, marginTop: 4 }}>
              {datePart}
            </Text>
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: SCREEN_FONTS.label, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>
              {'CHI PHÍ'}
            </Text>
            <Text style={{ color: PROFILE_THEME_COLORS.onSurface, fontFamily: SCREEN_FONTS.headline, fontSize: 28, lineHeight: 28 }}>
              {priceLabel}
            </Text>
            <Text style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: SCREEN_FONTS.body, fontSize: 11, marginTop: 2 }}>
              {priceLabel === 'Miễn phí' ? '' : '/người'}
            </Text>
          </View>
        </View>

        <View style={{ height: 1, backgroundColor: PROFILE_THEME_COLORS.outlineVariant, opacity: 0.5, marginVertical: 8 }} />

        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ backgroundColor: PROFILE_THEME_COLORS.surface, borderRadius: 4, paddingHorizontal: SPACING.md, paddingVertical: 4, borderWidth: 1, borderColor: PROFILE_THEME_COLORS.outlineVariant }}>
              <Text style={{ color: PROFILE_THEME_COLORS.onSurface, fontFamily: SCREEN_FONTS.label, fontSize: 12 }}>
                {sessionSkillLabel}
              </Text>
            </View>
            <View style={{ marginLeft: 12, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 6, height: 6, borderRadius: RADIUS.full, backgroundColor: statusColor }} />
              <Text style={{ 
                marginLeft: 6, 
                color: statusColor, 
                fontFamily: SCREEN_FONTS.cta, 
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: 0.5
              }}>
                {bookingStatusLabel}
              </Text>
            </View>
          </View>

          {hostNote && hostNote.trim().length > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <MessageSquareText size={14} color={PROFILE_THEME_COLORS.onSurface} strokeWidth={2.5} style={{ marginTop: 2 }} />
              <View style={{ marginLeft: 8, flex: 1 }}>
                <Text style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: SCREEN_FONTS.label, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  {'LỜI NHẮN'}
                </Text>
                <Text style={{ color: PROFILE_THEME_COLORS.onSurface, fontFamily: SCREEN_FONTS.body, fontSize: 13, marginTop: 2 }}>
                  {hostNote.trim()}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </View>
  )
}

