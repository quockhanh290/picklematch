import { Text, View } from 'react-native'

import { badgeToneClasses, type BadgeTone } from '@/lib/designSystem'

type Props = {
  label: string
  tone?: BadgeTone
}

export function StatusBadge({ label, tone = 'neutral' }: Props) {
  const palette = badgeToneClasses[tone]

  return (
    <View className={`rounded-full px-3 py-1.5 ${palette.wrap}`}>
      <Text className={`text-xs font-bold ${palette.text}`}>{label}</Text>
    </View>
  )
}
