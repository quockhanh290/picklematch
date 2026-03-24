import { Text, View } from 'react-native'

type Props = {
  icon: string
  title: string
  description?: string
}

export function EmptyState({ icon, title, description }: Props) {
  return (
    <View className="mt-16 items-center px-8">
      <Text className="mb-3 text-5xl">{icon}</Text>
      <Text className="mb-1 text-center text-base font-semibold text-slate-900">{title}</Text>
      {description ? <Text className="text-center text-sm leading-6 text-slate-500">{description}</Text> : null}
    </View>
  )
}
