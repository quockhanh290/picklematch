import { Pressable, Text, View } from 'react-native'
import { SCREEN_FONTS } from '@/constants/typography'
import { AlertCircle, Clock3 } from 'lucide-react-native'

import { AppButton } from '@/components/design/AppButton'
import { PROFILE_THEME_COLORS } from '@/constants/profileTheme'
import type { MatchStatus } from '@/lib/matchmaking'
import { RADIUS, SPACING } from '@/constants/screenLayout'

type Props = {
  matchStatus: MatchStatus
  requestStatus: 'none' | 'pending' | 'accepted' | 'rejected'
  hostRequiresApproval?: boolean
  hostResponseTemplate?: string | null
  onCancel?: () => void
  loading?: boolean
  onPress: () => void
}

export function SmartJoinButton({
  matchStatus,
  requestStatus,
  hostRequiresApproval,
  hostResponseTemplate,
  onCancel,
  loading,
  onPress,
}: Props) {
  if (requestStatus === 'pending') {
    return (
      <View style={{ gap: 12 }}>
        <View
          style={{
            borderRadius: RADIUS.xl,
            backgroundColor: PROFILE_THEME_COLORS.primaryFixed,
            paddingHorizontal: SPACING.xl,
            paddingVertical: 16,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Clock3 size={16} color={PROFILE_THEME_COLORS.onPrimaryFixedVariant} />
            <Text
              style={{
                marginLeft: 8,
                fontSize: 14,
                fontFamily: SCREEN_FONTS.headline,
                color: PROFILE_THEME_COLORS.onPrimaryFixedVariant,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              Đang chờ host phản hồi
            </Text>
          </View>
          <Text
            style={{
              marginTop: 8,
              fontSize: 14,
              fontFamily: SCREEN_FONTS.body,
              lineHeight: 22,
              color: PROFILE_THEME_COLORS.onPrimaryFixedVariant,
            }}
          >
            Yêu cầu tham gia của bạn đã được gửi. Host sẽ xem và phản hồi sớm.
          </Text>
          {hostResponseTemplate ? (
            <View
              style={{
                marginTop: 12,
                borderRadius: RADIUS.lg,
                backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest,
                paddingHorizontal: 16,
                paddingVertical: 12,
              }}
            >
              <Text
                style={{
                  fontSize: 10,
                  fontFamily: SCREEN_FONTS.headline,
                  textTransform: 'uppercase',
                  letterSpacing: 1.5,
                  color: PROFILE_THEME_COLORS.onPrimaryFixedVariant,
                }}
              >
                Tin nhắn gần nhất
              </Text>
              <Text
                style={{
                  marginTop: 8,
                  fontSize: 14,
                  fontFamily: SCREEN_FONTS.body,
                  lineHeight: 22,
                  color: PROFILE_THEME_COLORS.onPrimaryFixedVariant,
                }}
              >
                {hostResponseTemplate}
              </Text>
            </View>
          ) : null}
        </View>

        <AppButton 
          label="Hủy yêu cầu tham gia" 
          onPress={onCancel || (() => {})} 
          variant="danger"
          loading={loading}
        />
      </View>
    )
  }

  if (requestStatus === 'rejected') {
    return (
      <View
        style={{
          borderRadius: RADIUS.xl,
          backgroundColor: PROFILE_THEME_COLORS.errorContainer,
          paddingHorizontal: SPACING.xl,
          paddingVertical: 16,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <AlertCircle size={16} color={PROFILE_THEME_COLORS.error} />
          <Text
            style={{
              marginLeft: 8,
              fontSize: 14,
              fontFamily: SCREEN_FONTS.headline,
              color: PROFILE_THEME_COLORS.error,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            Yêu cầu trước đó đã bị từ chối
          </Text>
        </View>
        {hostResponseTemplate ? (
          <View
            style={{
              marginTop: 12,
              borderRadius: RADIUS.lg,
              backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest,
              paddingHorizontal: 16,
              paddingVertical: 12,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontFamily: SCREEN_FONTS.headline,
                textTransform: 'uppercase',
                letterSpacing: 1.5,
                color: PROFILE_THEME_COLORS.error,
              }}
            >
              Phản hồi từ host
            </Text>
            <Text
              style={{
                marginTop: 8,
                fontSize: 14,
                fontFamily: SCREEN_FONTS.body,
                lineHeight: 22,
                color: PROFILE_THEME_COLORS.error,
              }}
            >
              {hostResponseTemplate}
            </Text>
          </View>
        ) : null}
      </View>
    )
  }

  const isDirectJoin = matchStatus === 'MATCHED' && !hostRequiresApproval

  const palette = isDirectJoin
    ? {
        variant: 'primary' as const,
        label: 'Tham gia ngay',
      }
    : matchStatus === 'WAITLIST'
      ? {
          variant: 'secondary' as const,
          label: 'Đăng ký dự bị',
        }
      : {
          variant: 'primary' as const,
          label: 'Xin vào kèo',
        }

  return <AppButton label={palette.label} onPress={onPress} loading={loading} variant={palette.variant} />
}

