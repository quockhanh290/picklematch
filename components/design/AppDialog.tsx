import { SCREEN_FONTS } from '@/constants/screenFonts'
import { Modal, Pressable, Text, View } from 'react-native'

import { AppButton } from '@/components/design/AppButton'
import { useAppTheme } from '@/lib/theme-context'

export type AppDialogAction = {
  label: string
  onPress?: () => void | Promise<void>
  tone?: 'primary' | 'secondary' | 'danger'
}

export type AppDialogConfig = {
  title: string
  message: string
  actions: AppDialogAction[]
}

type Props = {
  visible: boolean
  config: AppDialogConfig | null
  onClose: () => void
}

export function AppDialog({ visible, config, onClose }: Props) {
  const theme = useAppTheme()
  if (!config) return null

  const actions = config.actions.slice(0, 3)

  const handleActionPress = async (action: AppDialogAction) => {
    onClose()
    await action.onPress?.()
  }

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: theme.overlay, justifyContent: 'center', paddingHorizontal: 20 }}>
        <Pressable style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} onPress={onClose} />

        <View
          style={{
            borderRadius: 28,
            borderWidth: 1,
            borderColor: theme.border,
            backgroundColor: theme.surface,
            paddingHorizontal: 18,
            paddingTop: 16,
            paddingBottom: 14,
            shadowColor: theme.shadow,
            shadowOpacity: 0.08,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 8 },
            elevation: 4,
          }}
        >
          <Text
            style={{
              fontSize: 21,
              lineHeight: 27,
              color: theme.primary,
              fontFamily: SCREEN_FONTS.bold,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            {config.title}
          </Text>

          <View style={{ marginTop: 12, height: 1, backgroundColor: theme.border }} />

          <Text
            style={{
              marginTop: 12,
              fontSize: 14,
              lineHeight: 22,
              color: theme.textMuted,
              fontFamily: SCREEN_FONTS.body,
            }}
          >
            {config.message}
          </Text>

          <View style={{ marginTop: 16, gap: 10 }}>
            {actions.map((action) => {
              if (action.tone === 'danger') {
                return (
                  <View key={action.label}>
                    <Pressable
                      onPress={() => void handleActionPress(action)}
                      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
                    >
                      <View
                        style={{
                          height: 56,
                          borderRadius: 14,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: theme.danger,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 16,
                            fontFamily: SCREEN_FONTS.cta,
                            color: theme.primaryContrast,
                          }}
                        >
                          {action.label}
                        </Text>
                      </View>
                    </Pressable>
                  </View>
                )
              }

              return (
                <View key={action.label}>
                  <AppButton
                    label={action.label}
                    onPress={() => void handleActionPress(action)}
                    variant={action.tone === 'secondary' ? 'secondary' : 'primary'}
                  />
                </View>
              )
            })}
          </View>
        </View>
      </View>
    </Modal>
  )
}
