import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { AlertCircle, Clock3, Send, Users } from 'lucide-react-native'

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

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        className="flex-1 bg-black/45"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <View className="flex-1 items-center justify-end px-4 pb-6">
          <View className="max-h-[88%] w-full rounded-[28px] border border-gray-100 bg-white p-5 shadow-lg">
            <ScrollView
              bounces={false}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 4 }}
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-3">
                  <Text className="text-[11px] font-extrabold uppercase tracking-[1.2px] text-gray-400">
                    {isWaitlist ? 'Dự bị' : 'Yêu cầu tham gia'}
                  </Text>
                  <Text className="mt-2 text-2xl font-black text-slate-950">
                    {isWaitlist ? 'Đăng ký dự bị' : 'Xin vào kèo'}
                  </Text>
                </View>
                <View className={`rounded-full px-3 py-2 ${isWaitlist ? 'bg-sky-50' : isLowerSkill ? 'bg-orange-50' : 'bg-emerald-50'}`}>
                  {isWaitlist ? <Users size={15} color="#0369a1" /> : isLowerSkill ? <AlertCircle size={15} color="#c2410c" /> : <Send size={15} color="#047857" />}
                </View>
              </View>

              <Text className="mt-3 text-sm leading-6 text-slate-600">
                {isWaitlist
                  ? 'Kèo đang đủ người. Bạn có thể để lại lời nhắn để chủ kèo gọi bạn vào nếu có người rời kèo.'
                  : 'Giới thiệu ngắn để chủ kèo hiểu thêm về bạn trước khi quyết định nhé.'}
              </Text>

              {isLowerSkill ? (
                <View className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3">
                  <View className="flex-row items-center">
                    <AlertCircle size={15} color="#c2410c" />
                    <Text className="ml-2 text-sm font-bold text-orange-800">Cảnh báo biến động Elo</Text>
                  </View>
                  <Text className="mt-2 text-xs leading-5 text-orange-700">
                    Trình độ hiện tại của bạn đang thấp hơn mặt bằng kèo này. Nếu được chủ kèo chấp nhận, Elo có thể biến động mạnh hơn sau trận.
                  </Text>
                </View>
              ) : null}

              <View className="mt-5">
                <Text className="text-sm font-bold text-slate-900">Lời nhắn giới thiệu</Text>
                <Text className="mt-1 text-sm leading-6 text-slate-500">
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
                  placeholderTextColor="#94a3b8"
                  className="mt-3 min-h-[120px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-900"
                  textAlignVertical="top"
                />
              </View>

              <View className="mt-5 rounded-2xl bg-slate-50 px-4 py-3">
                <View className="flex-row items-center">
                  <Clock3 size={15} color="#475569" />
                  <Text className="ml-2 text-[11px] font-extrabold uppercase tracking-[1px] text-slate-500">Riêng tư</Text>
                </View>
                <Text className="mt-2 text-sm leading-6 text-slate-600">
                  Chủ kèo chỉ thấy lời nhắn này khi xem yêu cầu. Bạn có thể chỉnh lại ở lần gửi sau nếu trạng thái thay đổi.
                </Text>
              </View>

              <View className="mt-5 flex-row gap-3">
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={onClose}
                  className="flex-1 items-center justify-center rounded-2xl border border-slate-200 bg-white py-4"
                >
                  <Text className="text-sm font-bold text-slate-700">Đóng</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={onSubmit}
                  disabled={loading}
                  className={`flex-1 items-center justify-center rounded-2xl py-4 ${
                    isWaitlist ? 'bg-sky-600' : isLowerSkill ? 'bg-orange-500' : 'bg-emerald-600'
                  } ${loading ? 'opacity-70' : ''}`}
                >
                  {loading ? (
                    <View className="flex-row items-center gap-3">
                      <ActivityIndicator color="#fff" />
                      <Text className="text-sm font-bold text-white">Đang gửi...</Text>
                    </View>
                  ) : (
                    <Text className="text-sm font-bold text-white">
                      {isWaitlist ? 'Gửi đăng ký dự bị' : 'Gửi yêu cầu'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}
