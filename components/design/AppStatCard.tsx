import { Text, View } from 'react-native'

type Props = {
  value: string | number
  label: string
  valueClassName?: string
}

export function AppStatCard({ value, label, valueClassName = 'text-slate-900' }: Props) {
  return (
    <View className="flex-1 rounded-3xl bg-white px-4 py-5 shadow-sm">
      <Text className={`text-2xl font-black ${valueClassName}`}>{value}</Text>
      <Text className="mt-1 text-xs font-semibold uppercase tracking-[1px] text-slate-400">{label}</Text>
    </View>
  )
}
