import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native'

import { AppFontSet } from '@/constants/typography'

import { useAppTheme } from '@/lib/theme-context'

import { RADIUS, BORDER, SHADOW, SPACING, BUTTON } from '@/constants/screenLayout'
type Props = {
  label: string
  onPress: () => void
  loading?: boolean
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'ghost'
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

  const baseStyle = isPrimary
    ? BUTTON.primary
    : isSecondary
      ? BUTTON.secondary
      : { borderRadius: RADIUS.full, paddingVertical: 13, paddingHorizontal: SPACING.xl }

  const buttonStyle = {
    ...baseStyle,
    backgroundColor: isPrimary ? theme.primary : isSecondary ? theme.surface : 'transparent',
    borderColor: theme.primary,
  }

  const textStyle = isPrimary
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
          <Text className="text-base font-extrabold" style={{ ...textStyle, fontFamily: AppFontSet.cta }}>
            Đang xử lý...
          </Text>
        </View>
      ) : (
        <Text className="text-base font-extrabold" style={{ ...textStyle, fontFamily: AppFontSet.cta }}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  )
}

