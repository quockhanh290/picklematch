import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native'

import { AppFontSet } from '@/constants/typography'

import { useAppTheme } from '@/lib/theme-context'

import { RADIUS, BORDER, SHADOW, SPACING, BUTTON } from '@/constants/screenLayout'
type Props = {
  label: string
  onPress: () => void
  loading?: boolean
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  fullWidth?: boolean
}

export function AppButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  fullWidth = true,
}: Props) {
  const theme = useAppTheme()
  const isPrimary = variant === 'primary'
  const isSecondary = variant === 'secondary'
  const isDanger = variant === 'danger'

  const baseStyle = (isPrimary || isDanger)
    ? BUTTON.primary
    : isSecondary
      ? BUTTON.secondary
      : { borderRadius: RADIUS.full, paddingVertical: 13, paddingHorizontal: SPACING.xl }

  const buttonStyle = {
    ...baseStyle,
    backgroundColor: isPrimary ? theme.primary : isDanger ? theme.danger : isSecondary ? theme.surface : 'transparent',
    borderColor: isDanger ? theme.danger : theme.primary,
  }

  const textStyle = (isPrimary || isDanger)
    ? { color: theme.primaryContrast }
    : isSecondary
      ? { color: theme.primaryStrong }
      : { color: theme.textMuted }

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
          <ActivityIndicator color={isPrimary ? theme.primaryContrast : theme.primaryStrong} />
          <Text style={{ ...textStyle, fontFamily: 'BarlowCondensed-Bold', fontSize: 16, textTransform: 'uppercase' }}>
            Đang xử lý...
          </Text>
        </View>
      ) : (
        <Text style={{ ...textStyle, fontFamily: 'BarlowCondensed-Bold', fontSize: 16, textTransform: 'uppercase' }}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  )
}

