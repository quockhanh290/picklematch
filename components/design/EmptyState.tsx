import type { ReactNode } from 'react'
import { Text, View } from 'react-native'

type Props = {
  icon: ReactNode
  title: string
  description?: string
}

export function EmptyState({ icon, title, description }: Props) {
  return (
    <View className="mt-16 items-center px-8">
      <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-slate-100">{icon}</View>
      <Text className="mb-1 text-center text-base font-semibold text-slate-900">{title}</Text>
      {description ? <Text className="text-center text-sm leading-6 text-slate-500">{description}</Text> : null}
    </View>
  )
}
