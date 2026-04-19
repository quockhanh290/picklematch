import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import { AlertCircle, Clock3, Send, UserPlus, Users } from 'lucide-react-native'

import { PROFILE_THEME_COLORS } from '@/components/profile/profileTheme'
import type { MatchStatus } from '@/lib/matchmaking'

type Props = {
  matchStatus: MatchStatus
  requestStatus: 'none' | 'pending' | 'accepted' | 'rejected'
  hostResponseTemplate?: string | null
  loading?: boolean
  onPress: () => void
}

export function SmartJoinButton({
  matchStatus,
  requestStatus,
  hostResponseTemplate,
  loading,
  onPress,
}: Props) {
  if (requestStatus === 'pending') {
    return (
      <View
        style={{
          borderRadius: 24,
          backgroundColor: PROFILE_THEME_COLORS.primaryFixed,
          paddingHorizontal: 20,
          paddingVertical: 16,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Clock3 size={16} color={PROFILE_THEME_COLORS.onPrimaryFixedVariant} />
          <Text
            style={{
              marginLeft: 8,
              fontSize: 14,
              fontFamily: 'PlusJakartaSans-SemiBold',
              color: PROFILE_THEME_COLORS.onPrimaryFixedVariant,
            }}
          >
            Đang chờ host phản hồi
          </Text>
        </View>
        <Text
          style={{
            marginTop: 8,
            fontSize: 14,
            fontFamily: 'PlusJakartaSans-Regular',
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
              borderRadius: 16,
              backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest,
              paddingHorizontal: 16,
              paddingVertical: 12,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontFamily: 'PlusJakartaSans-ExtraBold',
                textTransform: 'uppercase',
                letterSpacing: 1,
                color: PROFILE_THEME_COLORS.onPrimaryFixedVariant,
              }}
            >
              Tin nhắn gần nhất
            </Text>
            <Text
              style={{
                marginTop: 8,
                fontSize: 14,
                fontFamily: 'PlusJakartaSans-Regular',
                lineHeight: 22,
                color: PROFILE_THEME_COLORS.onPrimaryFixedVariant,
              }}
            >
              {hostResponseTemplate}
            </Text>
          </View>
        ) : null}
      </View>
    )
  }

  if (requestStatus === 'rejected') {
    return (
      <View
        style={{
          borderRadius: 24,
          backgroundColor: PROFILE_THEME_COLORS.errorContainer,
          paddingHorizontal: 20,
          paddingVertical: 16,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <AlertCircle size={16} color={PROFILE_THEME_COLORS.error} />
          <Text
            style={{
              marginLeft: 8,
              fontSize: 14,
              fontFamily: 'PlusJakartaSans-SemiBold',
              color: PROFILE_THEME_COLORS.error,
            }}
          >
            Yêu cầu trước đó đã bị từ chối
          </Text>
        </View>
        {hostResponseTemplate ? (
          <View
            style={{
              marginTop: 12,
              borderRadius: 16,
              backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest,
              paddingHorizontal: 16,
              paddingVertical: 12,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontFamily: 'PlusJakartaSans-ExtraBold',
                textTransform: 'uppercase',
                letterSpacing: 1,
                color: PROFILE_THEME_COLORS.error,
              }}
            >
              Phản hồi từ host
            </Text>
            <Text
              style={{
                marginTop: 8,
                fontSize: 14,
                fontFamily: 'PlusJakartaSans-Regular',
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

  const palette =
    matchStatus === 'MATCHED'
      ? {
          bg: PROFILE_THEME_COLORS.primary,
          textColor: PROFILE_THEME_COLORS.onPrimary,
          label: 'Tham gia ngay',
          Icon: UserPlus,
        }
      : matchStatus === 'LOWER_SKILL'
        ? {
            bg: PROFILE_THEME_COLORS.secondaryContainer,
            textColor: PROFILE_THEME_COLORS.onSecondaryContainer,
            label: 'Xin vào kèo',
            Icon: Send,
          }
        : {
            bg: PROFILE_THEME_COLORS.surfaceContainerHighest,
            textColor: PROFILE_THEME_COLORS.primary,
            label: 'Đăng ký dự bị',
            Icon: Users,
          }

  const ActionIcon = palette.Icon

  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => ({
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 16,
        backgroundColor: palette.bg,
        opacity: loading ? 0.7 : pressed ? 0.88 : 1,
      })}
    >
      {loading ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <ActivityIndicator color={palette.textColor} />
          <Text
            style={{
              fontSize: 16,
              fontFamily: 'PlusJakartaSans-ExtraBold',
              color: palette.textColor,
            }}
          >
            Đang xử lý...
          </Text>
        </View>
      ) : (
        <>
          <ActionIcon size={18} color={palette.textColor} />
          <Text
            style={{
              marginLeft: 8,
              fontSize: 16,
              fontFamily: 'PlusJakartaSans-ExtraBold',
              color: palette.textColor,
            }}
          >
            {palette.label}
          </Text>
        </>
      )}
    </Pressable>
  )
}
