import { Text, TextInput, type TextInputProps, View } from 'react-native'

type Props = TextInputProps & {
  label?: string
  hint?: string
}

export function AppInput({ label, hint, ...props }: Props) {
  return (
    <View>
      {label ? <Text className="mb-2 text-sm font-bold text-slate-900">{label}</Text> : null}
      <TextInput
        placeholderTextColor="#94a3b8"
        className="h-14 rounded-2xl border border-slate-200 bg-white px-4 text-[15px] text-slate-900"
        {...props}
      />
      {hint ? <Text className="mt-2 text-xs leading-5 text-slate-500">{hint}</Text> : null}
    </View>
  )
}
