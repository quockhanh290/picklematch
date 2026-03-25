import type { ReactNode } from 'react'
import { Text, TouchableOpacity, View } from 'react-native'

import { badgeToneClasses, type BadgeTone } from '@/lib/designSystem'

type Props = {
  label: string
  icon?: ReactNode
  tone?: BadgeTone
  active?: boolean
  onPress?: () => void
  className?: string
  labelClassName?: string
  activeClassName?: string
  inactiveClassName?: string
  iconClassName?: string
}

export function AppChip({
  label,
  icon,
  tone = 'neutral',
  active = false,
  onPress,
  className = '',
  labelClassName = '',
  activeClassName,
  inactiveClassName,
  iconClassName = '',
}: Props) {
  const palette = badgeToneClasses[tone]
  const activeClasses = active ? activeClassName ?? 'bg-emerald-600' : inactiveClassName ?? palette.wrap
  const textClasses = active ? 'text-white' : palette.text
  const Wrapper = onPress ? TouchableOpacity : TouchableOpacity

  return (
    <Wrapper
      activeOpacity={0.88}
      onPress={onPress}
      disabled={!onPress}
      className={`rounded-full px-4 py-2.5 ${activeClasses} ${className}`}
    >
      <View className="flex-row items-center">
        {icon ? <View className={`mr-1.5 ${iconClassName}`}>{icon}</View> : null}
        <Text className={`text-sm font-semibold ${textClasses} ${labelClassName}`}>{label}</Text>
      </View>
    </Wrapper>
  )
}
