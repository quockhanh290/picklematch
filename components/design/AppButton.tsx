import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native'

import { PROFILE_THEME_COLORS } from '@/constants/profileTheme'
import { AppFontSet } from '@/constants/typography'

import { useAppTheme } from '@/lib/theme-context'

import { RADIUS, SPACING, BUTTON } from '@/constants/screenLayout'

type Props = {
  label: string
  onPress: () => void
  loading?: boolean
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  fullWidth?: boolean
  textColor?: string
}

export function AppButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  fullWidth = true,
  textColor,
}: Props) {
  const theme = useAppTheme()
  const isPrimary = variant === 'primary'
  const isSecondary = variant === 'secondary'
  const isDanger = variant === 'danger'

  const baseStyle = (isPrimary || isDanger)
    ? BUTTON.primary
    : isSecondary
      ? BUTTON.secondary
      : { borderRadius: RADIUS.md, paddingVertical: 13, paddingHorizontal: SPACING.xl }

  const buttonStyle = {
    ...baseStyle,
    backgroundColor: isPrimary ? PROFILE_THEME_COLORS.primary : isDanger ? PROFILE_THEME_COLORS.error : 'transparent',
    borderColor: isDanger ? PROFILE_THEME_COLORS.error : PROFILE_THEME_COLORS.primary,
  }

  const defaultTextColor = isPrimary
    ? PROFILE_THEME_COLORS.onPrimary
    : isDanger
      ? PROFILE_THEME_COLORS.onError
      : isSecondary
        ? PROFILE_THEME_COLORS.primary
        : theme.textMuted

  const resolvedTextColor = textColor ?? defaultTextColor

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={onPress}
      disabled={disabled || loading}
      className={`${fullWidth ? 'w-full' : ''} flex-row items-center justify-center ${disabled || loading ? 'opacity-70' : ''}`}
      style={buttonStyle}
    >
      {loading ? (
        <View className="flex-row items-center gap-3">
          <ActivityIndicator color={resolvedTextColor} />
          <Text style={{ color: resolvedTextColor, fontFamily: AppFontSet.cta, fontSize: 16, textTransform: 'uppercase' }}>
            Đang xử lý...
          </Text>
        </View>
      ) : (
        <Text style={{ color: resolvedTextColor, fontFamily: AppFontSet.cta, fontSize: 16, textTransform: 'uppercase' }}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  )
}
