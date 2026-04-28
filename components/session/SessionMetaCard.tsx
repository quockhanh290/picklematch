import { PROFILE_THEME_COLORS } from '@/components/profile/profileTheme'
import { SCREEN_FONTS } from '@/constants/screenFonts'
import { getSkillLevelUi } from '@/lib/skillLevelUi'
import { LinearGradient } from 'expo-linear-gradient'
import { CreditCard, MapPin, MessageSquareText } from 'lucide-react-native'
import { Text, View } from 'react-native'
import { RADIUS, SPACING, SHADOW, BORDER } from '@/constants/screenLayout'

type Props = {
  skillLevelId: string
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
  maxPlayers,
}: Props) {
  const levelUi = getSkillLevelUi(skillLevelId as any)
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
  const bookingStatusLabel = isClosedRecruitment
    ? '\u0110\u00e3\u0020\u006e\u0067\u01b0\u006e\u0067\u0020\u006e\u0068\u1ead\u006e\u0020\u006e\u0067\u01b0\u1eddi'
    : isConfirmed
      ? '\u0110\u00e3\u0020\u0111\u1eb7\u0074\u0020\u0073\u00e2\u006e'
      : '\u0043\u0068\u01b0\u0061\u0020\u0111\u1eb7\u0074\u0020\u0073\u00e2\u006e'

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
            backgroundColor: '#1D9E75',
            paddingHorizontal: 16,
            paddingVertical: SPACING.xs,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 6 }}>
            <View style={{ width: 5, height: 5, borderRadius: RADIUS.full, backgroundColor: '#FFFFFF' }} />
            <Text
              style={{
                color: '#FFFFFF',
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
              color: 'rgba(255,255,255,0.8)',
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
              color: '#1A2E2A',
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
            <MapPin size={13} color="#7A8884" strokeWidth={2.5} />
            <Text numberOfLines={1} ellipsizeMode="tail" style={{ color: '#7A8884', fontFamily: SCREEN_FONTS.body, fontSize: 13, lineHeight: 18, flexShrink: 1 }}>
              {compactAddress}
            </Text>
          </View>
        </View>
      </View>

      <View style={{ backgroundColor: '#F5F1E8', paddingTop: 14, paddingHorizontal: 16, paddingBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <View>
            <Text style={{ color: '#7A8884', fontFamily: SCREEN_FONTS.label, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>
              {'THỜI GIAN'}
            </Text>
            <Text
              style={{
                color: '#1A2E2A',
                fontFamily: SCREEN_FONTS.headline,
                fontSize: 33,
                lineHeight: 33,
                letterSpacing: 0,
              }}
            >
              {clockPart || timeLabel}
            </Text>
            <Text style={{ color: '#7A8884', fontFamily: SCREEN_FONTS.body, fontSize: 13, marginTop: 4 }}>
              {datePart}
            </Text>
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: '#7A8884', fontFamily: SCREEN_FONTS.label, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>
              {'CHI PHÍ'}
            </Text>
            <Text style={{ color: '#1A2E2A', fontFamily: SCREEN_FONTS.headline, fontSize: 28, lineHeight: 28 }}>
              {priceLabel}
            </Text>
            <Text style={{ color: '#7A8884', fontFamily: SCREEN_FONTS.body, fontSize: 11, marginTop: 2 }}>
              {priceLabel === 'Miễn phí' ? '' : '/người'}
            </Text>
          </View>
        </View>

        <View style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.06)', marginVertical: 8 }} />

        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ backgroundColor: '#FFFFFF', borderRadius: 4, paddingHorizontal: 9, paddingVertical: 4, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)' }}>
              <Text style={{ color: '#2C2C2A', fontFamily: SCREEN_FONTS.label, fontSize: 12 }}>
                {sessionSkillLabel}
              </Text>
            </View>
            <View style={{ marginLeft: 12, flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ width: 6, height: 6, borderRadius: RADIUS.full, backgroundColor: isConfirmed ? '#0F6E56' : '#D19900' }} />
              <Text style={{ marginLeft: 6, color: isConfirmed ? '#0F6E56' : '#7A6400', fontFamily: SCREEN_FONTS.label, fontSize: 12 }}>
                {bookingStatusLabel}
              </Text>
            </View>
          </View>

          {hostNote && hostNote.trim().length > 0 && (
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <MessageSquareText size={14} color="#1A2E2A" strokeWidth={2.5} style={{ marginTop: 2 }} />
              <View style={{ marginLeft: 8, flex: 1 }}>
                <Text style={{ color: '#7A8884', fontFamily: SCREEN_FONTS.label, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  {'LỜI NHẮN'}
                </Text>
                <Text style={{ color: '#1A2E2A', fontFamily: SCREEN_FONTS.body, fontSize: 13, marginTop: 2 }}>
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

