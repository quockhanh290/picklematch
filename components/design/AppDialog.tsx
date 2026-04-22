import { Modal, Pressable, Text, View } from 'react-native'

import { AppButton } from '@/components/design/AppButton'
import { PROFILE_THEME_COLORS } from '@/components/profile/profileTheme'

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
  if (!config) return null

  const actions = config.actions.slice(0, 3)

  const handleActionPress = async (action: AppDialogAction) => {
    onClose()
    await action.onPress?.()
  }

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(10, 20, 30, 0.45)', justifyContent: 'center', paddingHorizontal: 20 }}>
        <Pressable style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} onPress={onClose} />

        <View
          style={{
            borderRadius: 28,
            borderWidth: 1,
            borderColor: PROFILE_THEME_COLORS.outlineVariant,
            backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest,
            paddingHorizontal: 18,
            paddingTop: 16,
            paddingBottom: 14,
            shadowColor: '#0f172a',
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
              color: PROFILE_THEME_COLORS.primary,
              fontFamily: 'PlusJakartaSans-ExtraBold',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            {config.title}
          </Text>

          <View style={{ marginTop: 12, height: 1, backgroundColor: PROFILE_THEME_COLORS.outlineVariant }} />

          <Text
            style={{
              marginTop: 12,
              fontSize: 14,
              lineHeight: 22,
              color: PROFILE_THEME_COLORS.onSurfaceVariant,
              fontFamily: 'PlusJakartaSans-Regular',
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
                          backgroundColor: '#e11d48',
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 16,
                            fontFamily: 'PlusJakartaSans-Bold',
                            color: '#ffffff',
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
