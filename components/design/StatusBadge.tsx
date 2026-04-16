import { Text, View } from 'react-native'

import { appRadii, getTonePalette, type BadgeTone } from '@/lib/designSystem'
import { useAppTheme } from '@/lib/theme-context'

type Props = {
  label: string
  tone?: BadgeTone
}

export function StatusBadge({ label, tone = 'neutral' }: Props) {
  const theme = useAppTheme()
  const palette = getTonePalette(theme, tone)

  return (
    <View
      className={`${appRadii.sm} border px-3 py-1.5`}
      style={{ backgroundColor: palette.backgroundColor, borderColor: palette.borderColor }}
    >
      <Text className="text-xs font-bold" style={{ color: palette.textColor, fontFamily: 'PlusJakartaSans-Bold' }}>
        {label}
      </Text>
    </View>
  )
}
