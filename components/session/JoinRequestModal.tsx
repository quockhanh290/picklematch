import { KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, View } from 'react-native'
import { SCREEN_FONTS } from '@/constants/typography'
import { AlertCircle, Clock3, Send, Users } from 'lucide-react-native'

import { AppButton } from '@/components/design/AppButton'
import { PROFILE_THEME_COLORS, PROFILE_THEME_SEMANTIC } from '@/constants/profileTheme'
import type { MatchStatus } from '@/lib/matchmaking'
import { useAppTheme } from '@/lib/theme-context'
import { RADIUS, SPACING, BORDER } from '@/constants/screenLayout'

type Props = {
  visible: boolean
  mode: MatchStatus
  introNote: string
  setIntroNote: (value: string) => void
  loading?: boolean
  onClose: () => void
  onSubmit: () => void
}

function withAlpha(hex: string, alpha: number) {
  const clean = hex.replace('#', '')
  const normalized = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean
  const n = Number.parseInt(normalized, 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

export function JoinRequestModal({
  visible,
  mode,
  introNote,
  setIntroNote,
  loading,
  onClose,
  onSubmit,
}: Props) {
  const theme = useAppTheme()
  const isLowerSkill = mode === 'LOWER_SKILL'
  const isWaitlist = mode === 'WAITLIST'

  const title = isWaitlist ? 'Đăng ký dự bị' : 'Xin vào kèo'
  const eyebrow = isWaitlist ? 'Dự bị' : 'Yêu cầu tham gia'
  const description = isWaitlist
    ? 'Kèo đang đủ người. Bạn có thể để lại lời nhắn để chủ kèo gọi bạn vào nếu có người rời kèo.'
    : 'Giới thiệu ngắn để chủ kèo hiểu thêm về bạn trước khi quyết định nhé.'
  const submitLabel = isWaitlist ? 'Gửi đăng ký dự bị' : 'Gửi yêu cầu'

  const HeaderIcon = isWaitlist ? Users : isLowerSkill ? AlertCircle : Send

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: theme.overlay }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end', paddingHorizontal: 16, paddingBottom: 20 }}>
          <View
            style={{
              maxHeight: '90%',
              borderRadius: RADIUS.hero,
              borderWidth: BORDER.base,
              borderColor: PROFILE_THEME_COLORS.outlineVariant,
              backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest,
              paddingHorizontal: SPACING.xl,
              paddingTop: 18,
              paddingBottom: 16,
              shadowColor: PROFILE_THEME_COLORS.onBackground,
              shadowOpacity: 0.08,
              shadowRadius: 18,
              shadowOffset: { width: 0, height: 8 },
              elevation: 4,
            }}
          >
            <ScrollView
              bounces={false}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 4 }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 10,
                      fontFamily: SCREEN_FONTS.headline,
                      letterSpacing: 1.5,
                      textTransform: 'uppercase',
                      color: PROFILE_THEME_COLORS.outline,
                    }}
                  >
                    {eyebrow}
                  </Text>
                  <Text
                    style={{
                      marginTop: 4,
                      fontSize: 28,
                      lineHeight: 32,
                      color: PROFILE_THEME_COLORS.primary,
                      fontFamily: SCREEN_FONTS.headline,
                      textTransform: 'uppercase',
                    }}
                  >
                    {title}
                  </Text>
                </View>

                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: RADIUS.full,
                    backgroundColor: withAlpha(PROFILE_THEME_COLORS.primary, 0.12),
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <HeaderIcon size={18} color={PROFILE_THEME_COLORS.primary} strokeWidth={2.5} />
                </View>
              </View>

              <View style={{ marginTop: 14, height: 1, backgroundColor: PROFILE_THEME_COLORS.outlineVariant }} />

              <Text
                style={{
                  marginTop: 14,
                  fontSize: 14,
                  lineHeight: 22,
                  color: PROFILE_THEME_COLORS.onSurfaceVariant,
                  fontFamily: SCREEN_FONTS.body,
                }}
              >
                {description}
              </Text>

              {isLowerSkill ? (
                <View
                  style={{
                    marginTop: 14,
                    borderRadius: RADIUS.lg,
                    borderWidth: BORDER.base,
                    borderColor: PROFILE_THEME_COLORS.secondaryFixedDim,
                    backgroundColor: PROFILE_THEME_SEMANTIC.warningBg,
                    paddingHorizontal: SPACING.md,
                    paddingVertical: 12,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <AlertCircle size={15} color={PROFILE_THEME_SEMANTIC.warningStrong} />
                    <Text
                      style={{
                        marginLeft: 7,
                        fontSize: 13,
                        fontFamily: SCREEN_FONTS.headline,
                        textTransform: 'uppercase',
                        color: PROFILE_THEME_COLORS.onPrimaryFixedVariant,
                      }}
                    >
                      Cảnh báo biến động Elo
                    </Text>
                  </View>
                  <Text
                    style={{
                      marginTop: 8,
                      fontSize: 13,
                      lineHeight: 20,
                      color: PROFILE_THEME_COLORS.onPrimaryFixedVariant,
                      fontFamily: SCREEN_FONTS.body,
                    }}
                  >
                    Trình độ hiện tại của bạn đang thấp hơn mặt bằng kèo này. Nếu được chủ kèo chấp nhận, Elo có thể biến động mạnh hơn sau trận.
                  </Text>
                </View>
              ) : null}

              <View style={{ marginTop: 18 }}>
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: SCREEN_FONTS.headline,
                    textTransform: 'uppercase',
                    letterSpacing: 1.2,
                    color: PROFILE_THEME_COLORS.outline,
                  }}
                >
                  Lời nhắn giới thiệu
                </Text>
                <Text
                  style={{
                    marginTop: 6,
                    fontSize: 13,
                    lineHeight: 20,
                    color: PROFILE_THEME_COLORS.onSurfaceVariant,
                    fontFamily: SCREEN_FONTS.body,
                  }}
                >
                  Bạn có thể giới thiệu ngắn về lối chơi, thái độ trên sân, hoặc thời gian có mặt.
                </Text>

                <TextInput
                  multiline
                  value={introNote}
                  onChangeText={setIntroNote}
                  placeholder={
                    isWaitlist
                      ? 'Ví dụ: Nếu có slot trống bạn báo mình nhé.'
                      : 'Ví dụ: Mình đánh đều, giữ bóng tốt và rất đúng giờ.'
                  }
                  placeholderTextColor={withAlpha(PROFILE_THEME_COLORS.onSurfaceVariant, 0.6)}
                  textAlignVertical="top"
                  style={{
                    marginTop: 10,
                    minHeight: 128,
                    borderRadius: RADIUS.lg,
                    borderWidth: BORDER.base,
                    borderColor: PROFILE_THEME_COLORS.outlineVariant,
                    backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow,
                    paddingHorizontal: SPACING.md,
                    paddingVertical: 12,
                    color: PROFILE_THEME_COLORS.onSurface,
                    fontSize: 14,
                    lineHeight: 22,
                    fontFamily: SCREEN_FONTS.body,
                  }}
                />
              </View>

              <View
                style={{
                  marginTop: 14,
                  borderRadius: RADIUS.lg,
                  backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow,
                  borderWidth: BORDER.base,
                  borderColor: PROFILE_THEME_COLORS.outlineVariant,
                  paddingHorizontal: SPACING.md,
                  paddingVertical: 12,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Clock3 size={15} color={PROFILE_THEME_COLORS.primary} strokeWidth={2.4} />
                  <Text
                    style={{
                      marginLeft: 7,
                      fontSize: 12,
                      fontFamily: SCREEN_FONTS.headline,
                      textTransform: 'uppercase',
                      letterSpacing: 1.1,
                      color: PROFILE_THEME_COLORS.primary,
                    }}
                  >
                    Riêng tư
                  </Text>
                </View>
                <Text
                  style={{
                    marginTop: 7,
                    fontSize: 13,
                    lineHeight: 20,
                    color: PROFILE_THEME_COLORS.onSurfaceVariant,
                    fontFamily: SCREEN_FONTS.body,
                  }}
                >
                  Chủ kèo chỉ thấy lời nhắn này khi xem yêu cầu. Bạn có thể chỉnh lại ở lần gửi sau nếu trạng thái thay đổi.
                </Text>
              </View>

              <View style={{ marginTop: 16, flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <AppButton label="Quay lại" onPress={onClose} variant="secondary" />
                </View>
                <View style={{ flex: 1 }}>
                  <AppButton label={submitLabel} onPress={onSubmit} loading={loading} variant="primary" />
                </View>
              </View>

            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

