import { KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, View } from 'react-native'
import { AlertCircle, Clock3, Send, Users } from 'lucide-react-native'

import { AppButton } from '@/components/design'
import { PROFILE_THEME_COLORS } from '@/components/profile/profileTheme'
import type { MatchStatus } from '@/lib/matchmaking'

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
        style={{ flex: 1, backgroundColor: 'rgba(10, 20, 30, 0.45)' }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <View style={{ flex: 1, justifyContent: 'flex-end', paddingHorizontal: 16, paddingBottom: 20 }}>
          <View
            style={{
              maxHeight: '90%',
              borderRadius: 32,
              borderWidth: 1,
              borderColor: PROFILE_THEME_COLORS.outlineVariant,
              backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest,
              paddingHorizontal: 20,
              paddingTop: 18,
              paddingBottom: 16,
              shadowColor: '#0f172a',
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
                      fontFamily: 'PlusJakartaSans-ExtraBold',
                      letterSpacing: 1.8,
                      textTransform: 'uppercase',
                      color: PROFILE_THEME_COLORS.outline,
                    }}
                  >
                    {eyebrow}
                  </Text>
                  <Text
                    style={{
                      marginTop: 6,
                      fontSize: 30,
                      lineHeight: 36,
                      letterSpacing: 0.4,
                      color: PROFILE_THEME_COLORS.primary,
                      fontFamily: 'PlusJakartaSans-ExtraBold',
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
                    borderRadius: 999,
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
                  fontFamily: 'PlusJakartaSans-Regular',
                }}
              >
                {description}
              </Text>

              {isLowerSkill ? (
                <View
                  style={{
                    marginTop: 14,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: '#f3b37a',
                    backgroundColor: '#fff7ed',
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <AlertCircle size={15} color="#c2410c" />
                    <Text
                      style={{
                        marginLeft: 7,
                        fontSize: 12,
                        fontFamily: 'PlusJakartaSans-ExtraBold',
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                        color: '#9a3412',
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
                      color: '#9a3412',
                      fontFamily: 'PlusJakartaSans-Regular',
                    }}
                  >
                    Trình độ hiện tại của bạn đang thấp hơn mặt bằng kèo này. Nếu được chủ kèo chấp nhận, Elo có thể biến động mạnh hơn sau trận.
                  </Text>
                </View>
              ) : null}

              <View style={{ marginTop: 18 }}>
                <Text
                  style={{
                    fontSize: 10,
                    fontFamily: 'PlusJakartaSans-ExtraBold',
                    textTransform: 'uppercase',
                    letterSpacing: 1.8,
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
                    fontFamily: 'PlusJakartaSans-Regular',
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
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: PROFILE_THEME_COLORS.outlineVariant,
                    backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow,
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    color: PROFILE_THEME_COLORS.onSurface,
                    fontSize: 14,
                    lineHeight: 22,
                    fontFamily: 'PlusJakartaSans-Regular',
                  }}
                />
              </View>

              <View
                style={{
                  marginTop: 14,
                  borderRadius: 20,
                  backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow,
                  borderWidth: 1,
                  borderColor: PROFILE_THEME_COLORS.outlineVariant,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Clock3 size={15} color={PROFILE_THEME_COLORS.primary} strokeWidth={2.4} />
                  <Text
                    style={{
                      marginLeft: 7,
                      fontSize: 11,
                      fontFamily: 'PlusJakartaSans-ExtraBold',
                      textTransform: 'uppercase',
                      letterSpacing: 1.3,
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
                    fontFamily: 'PlusJakartaSans-Regular',
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
