import { Text, TouchableOpacity } from 'react-native'

import { badgeToneClasses, type BadgeTone } from '@/lib/designSystem'

type Props = {
  label: string
  tone?: BadgeTone
  active?: boolean
  onPress?: () => void
}

export function AppChip({ label, tone = 'neutral', active = false, onPress }: Props) {
  const palette = badgeToneClasses[tone]
  const activeClasses = active ? 'bg-emerald-600' : palette.wrap
  const textClasses = active ? 'text-white' : palette.text
  const Wrapper = onPress ? TouchableOpacity : TouchableOpacity

  return (
    <Wrapper
      activeOpacity={0.88}
      onPress={onPress}
      disabled={!onPress}
      className={`rounded-full px-4 py-2.5 ${activeClasses}`}
    >
      <Text className={`text-sm font-semibold ${textClasses}`}>{label}</Text>
    </Wrapper>
  )
}
