import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native'

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
  const isPrimary = variant === 'primary'
  const isSecondary = variant === 'secondary'
  const classes = isPrimary
    ? 'bg-emerald-600'
    : isSecondary
      ? 'border border-emerald-500 bg-white'
      : 'bg-transparent'
  const textClasses = isPrimary ? 'text-white' : isSecondary ? 'text-emerald-700' : 'text-slate-700'

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={onPress}
      disabled={disabled || loading}
      className={`${fullWidth ? 'w-full' : ''} h-14 items-center justify-center rounded-2xl px-5 ${classes} ${
        disabled || loading ? 'opacity-70' : ''
      }`}
    >
      {loading ? (
        <View className="flex-row items-center gap-3">
          <ActivityIndicator color={isPrimary ? '#fff' : '#047857'} />
          <Text className={`text-base font-extrabold ${textClasses}`}>Đang xử lý...</Text>
        </View>
      ) : (
        <Text className={`text-base font-extrabold ${textClasses}`}>{label}</Text>
      )}
    </TouchableOpacity>
  )
}
