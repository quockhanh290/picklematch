import type { ReactNode } from 'react'
import { Text, View } from 'react-native'

type Props = {
  title?: string
  subtitle?: string
  rightSlot?: ReactNode
  children: ReactNode
  className?: string
}

export function SectionCard({ title, subtitle, rightSlot, children, className = '' }: Props) {
  return (
    <View className={`rounded-[28px] bg-white p-4 shadow-sm ${className}`}>
      {title || subtitle || rightSlot ? (
        <View className="mb-4 flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            {title ? <Text className="text-lg font-extrabold text-slate-900">{title}</Text> : null}
            {subtitle ? <Text className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</Text> : null}
          </View>
          {rightSlot}
        </View>
      ) : null}
      {children}
    </View>
  )
}
