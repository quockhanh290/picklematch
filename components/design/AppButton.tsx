import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native'

import { useAppTheme } from '@/lib/theme-context'

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

  const buttonStyle = isPrimary
    ? {
        backgroundColor: theme.primary,
        borderColor: theme.primary,
        borderRadius: theme.radiusMd,
      }
    : isSecondary
      ? {
          backgroundColor: theme.surface,
          borderColor: theme.primary,
          borderWidth: 1,
          borderRadius: theme.radiusMd,
        }
      : {
          backgroundColor: 'transparent',
          borderRadius: theme.radiusMd,
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
      className={`${fullWidth ? 'w-full' : ''} h-14 items-center justify-center px-5 ${disabled || loading ? 'opacity-70' : ''}`}
      style={buttonStyle}
    >
      {loading ? (
        <View className="flex-row items-center gap-3">
          <ActivityIndicator color={isPrimary ? theme.primaryContrast : theme.primaryStrong} />
          <Text className="text-base font-extrabold" style={textStyle}>
            Đang xử lý...
          </Text>
        </View>
      ) : (
        <Text className="text-base font-extrabold" style={textStyle}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  )
}
