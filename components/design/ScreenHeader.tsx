import type { ReactNode } from 'react'
import { Text, View } from 'react-native'

type Props = {
  eyebrow?: string
  title: string
  subtitle?: string
  rightSlot?: ReactNode
}

export function ScreenHeader({ eyebrow, title, subtitle, rightSlot }: Props) {
  return (
    <View className="bg-white/95 px-5 pb-4 pt-4" style={{ zIndex: 10 }}>
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          {eyebrow ? <Text className="text-sm font-medium text-slate-500">{eyebrow}</Text> : null}
          <Text className="mt-1 text-3xl font-black text-slate-950">{title}</Text>
          {subtitle ? <Text className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</Text> : null}
        </View>
        {rightSlot}
      </View>
    </View>
  )
}
