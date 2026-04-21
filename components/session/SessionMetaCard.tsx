import { PROFILE_THEME_COLORS } from '@/components/profile/profileTheme'
import { getSkillLevelUi } from '@/lib/skillLevelUi'
import { LinearGradient } from 'expo-linear-gradient'
import { CreditCard, MapPin, MessageSquareText, ShieldAlert, ShieldCheck, Trophy } from 'lucide-react-native'
import { Text, View } from 'react-native'

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
        borderRadius: 34,
        overflow: 'hidden',
        backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest,
        shadowColor: '#0f172a',
        shadowOpacity: 0.08,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 8 },
        elevation: 4,
      }}
    >
      <View style={{ position: 'relative' }}>
        <LinearGradient
          colors={[PROFILE_THEME_COLORS.primary, PROFILE_THEME_COLORS.surfaceTint]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
        />

        <LevelIcon
          size={128}
          color="rgba(255,255,255,0.14)"
          style={{ position: 'absolute', right: -18, bottom: -18 }}
        />

        <View style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
            <Text
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.7}
              style={{
                flex: 1,
                color: onAccent,
                fontFamily: 'PlusJakartaSans-ExtraBold',
                fontSize: 40,
                lineHeight: 46,
                letterSpacing: 0.8,
                textTransform: 'uppercase',
              }}
            >
              {courtName}
            </Text>
          </View>

          <Text
            style={{
              color: withAlpha(onAccent, 0.62),
              fontFamily: 'PlusJakartaSans-ExtraBoldItalic',
              fontSize: 31,
              lineHeight: 39,
              marginTop: 2,
            }}
          >
            {timeRangeLabel}
          </Text>

          {datePart ? (
            <Text
              style={{
                color: withAlpha(onAccent, 0.62),
                fontFamily: 'PlusJakartaSans-ExtraBoldItalic',
                fontSize: 22,
                lineHeight: 29,
                marginTop: 2,
                textTransform: 'uppercase',
              }}
            >
              {datePart}
            </Text>
          ) : null}

          <View style={{ marginTop: 14, gap: 8 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderRadius: 999,
                paddingHorizontal: 12,
                paddingVertical: 7,
                backgroundColor: withAlpha(onAccent, 0.13),
                maxWidth: '100%',
                alignSelf: 'flex-start',
              }}
            >
              <MapPin size={12} color={withAlpha(onAccent, 0.8)} strokeWidth={2.5} />
              <Text
                numberOfLines={1}
                style={{
                  marginLeft: 6,
                  color: withAlpha(onAccent, 0.9),
                  fontFamily: 'PlusJakartaSans-SemiBold',
                  fontSize: 14,
                }}
              >
                {compactAddress}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderRadius: 999,
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  backgroundColor: withAlpha(onAccent, 0.13),
                  alignSelf: 'flex-start',
                }}
              >
                {isClosedRecruitment
                  ? <ShieldAlert size={12} color={withAlpha(onAccent, 0.8)} strokeWidth={2.5} />
                  : isConfirmed
                    ? <ShieldCheck size={12} color={withAlpha(onAccent, 0.8)} strokeWidth={2.5} />
                    : <ShieldAlert size={12} color={withAlpha(onAccent, 0.8)} strokeWidth={2.5} />}
                <Text
                  style={{
                    marginLeft: 6,
                    color: withAlpha(onAccent, 0.9),
                    fontFamily: 'PlusJakartaSans-SemiBold',
                    fontSize: 13,
                  }}
                >
                  {bookingStatusLabel}
                </Text>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  borderRadius: 999,
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  backgroundColor: withAlpha(onAccent, 0.13),
                  alignSelf: 'flex-start',
                }}
              >
                <LevelIcon size={12} color={withAlpha(onAccent, 0.8)} strokeWidth={2.5} />
                <Text
                  style={{
                    marginLeft: 6,
                    color: withAlpha(onAccent, 0.9),
                    fontFamily: 'PlusJakartaSans-SemiBold',
                    fontSize: 14,
                  }}
                >
                  {sessionSkillLabel}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <View style={{ paddingHorizontal: 20, paddingVertical: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 999,
              backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CreditCard size={18} color={PROFILE_THEME_COLORS.primary} strokeWidth={2.4} />
          </View>
          <View style={{ marginLeft: 14, flex: 1 }}>
            <Text
              style={{
                fontSize: 11,
                fontFamily: 'PlusJakartaSans-ExtraBold',
                textTransform: 'uppercase',
                letterSpacing: 1.8,
                color: PROFILE_THEME_COLORS.outline,
              }}
            >
              Chi phí
            </Text>
            <Text
              style={{
                marginTop: 3,
                fontSize: 15,
                fontFamily: 'PlusJakartaSans-SemiBold',
                color: PROFILE_THEME_COLORS.onSurface,
              }}
            >
              {priceLabel}
            </Text>
          </View>
        </View>

        <View style={{ height: 1, backgroundColor: PROFILE_THEME_COLORS.outlineVariant, marginVertical: 14 }} />

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 999,
              backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Trophy size={18} color={PROFILE_THEME_COLORS.primary} strokeWidth={2.4} />
          </View>
          <View style={{ marginLeft: 14, flex: 1 }}>
            <Text
              style={{
                fontSize: 11,
                fontFamily: 'PlusJakartaSans-ExtraBold',
                textTransform: 'uppercase',
                letterSpacing: 1.8,
                color: PROFILE_THEME_COLORS.outline,
              }}
            >
              Loại kèo
            </Text>
            <Text
              style={{
                marginTop: 3,
                fontSize: 15,
                fontFamily: 'PlusJakartaSans-SemiBold',
                color: PROFILE_THEME_COLORS.onSurface,
              }}
            >
              {isRankedMatch ? 'Kèo tính điểm' : 'Kèo casual'}
            </Text>
            <Text
              style={{
                marginTop: 2,
                fontSize: 12,
                fontFamily: 'PlusJakartaSans-Regular',
                color: PROFILE_THEME_COLORS.onSurfaceVariant,
              }}
            >
              {isRankedMatch
                ? 'Kết quả trận sẽ ảnh hưởng điểm ELO của người chơi.'
                : 'Trận giao lưu, kết quả không làm thay đổi điểm ELO.'}
            </Text>
          </View>
        </View>

        <View style={{ height: 1, backgroundColor: PROFILE_THEME_COLORS.outlineVariant, marginVertical: 14 }} />

        <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 999,
              backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MessageSquareText size={18} color={PROFILE_THEME_COLORS.primary} strokeWidth={2.4} />
          </View>
          <View style={{ marginLeft: 14, flex: 1 }}>
            <Text
              style={{
                fontSize: 11,
                fontFamily: 'PlusJakartaSans-ExtraBold',
                textTransform: 'uppercase',
                letterSpacing: 1.8,
                color: PROFILE_THEME_COLORS.outline,
              }}
            >
              Lời nhắn của host
            </Text>
            <Text
              style={{
                marginTop: 3,
                fontSize: 15,
                fontFamily: 'PlusJakartaSans-SemiBold',
                color: PROFILE_THEME_COLORS.onSurface,
              }}
            >
              {hostNote && hostNote.trim().length > 0 ? hostNote.trim() : 'Chưa có lời nhắn thêm'}
            </Text>
          </View>
        </View>
      </View>
    </View>
  )
}
