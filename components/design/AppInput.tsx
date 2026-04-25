import { Text, TextInput, type TextInputProps, View } from 'react-native'
import { AppFontSet } from '@/constants/typography'
import { useAppTheme } from '@/lib/theme-context'

type Props = TextInputProps & {
  label?: string
  hint?: string
}

export function AppInput({ label, hint, ...props }: Props) {
  const theme = useAppTheme()
  return (
    <View>
      {label ? <Text className="mb-2 text-sm font-bold" style={{ color: theme.text, fontFamily: AppFontSet.title }}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={theme.textSoft}
        className="h-14 rounded-2xl border px-4 text-[15px]"
        style={{ color: theme.text, borderColor: theme.border, backgroundColor: theme.surface, fontFamily: AppFontSet.body }}
        {...props}
      />
      {hint ? <Text className="mt-2 text-xs leading-5" style={{ color: theme.textMuted, fontFamily: AppFontSet.body }}>{hint}</Text> : null}
    </View>
  )
}

