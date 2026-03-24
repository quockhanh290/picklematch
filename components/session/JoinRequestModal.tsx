import { ActivityIndicator, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native'

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
      <View className="flex-1 items-center justify-end bg-black/45 px-4 pb-6">
        <View className="w-full rounded-[28px] bg-white p-5">
          <Text className="text-xl font-black text-slate-900">
            {isWaitlist ? 'Đăng ký dự bị' : 'Xin vào kèo'}
          </Text>
          <Text className="mt-2 text-sm leading-6 text-slate-600">
            {isWaitlist
              ? 'Kèo đang đầy. Bạn có thể để lại lời nhắn để host gọi bạn vào nếu có người rời kèo.'
              : 'Giới thiệu ngắn để host hiểu thêm về bạn trước khi quyết định nhé.'}
          </Text>

          {isLowerSkill ? (
            <View className="mt-4 rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3">
              <Text className="text-sm font-bold text-orange-800">Cảnh báo Elo Loss</Text>
              <Text className="mt-1 text-xs leading-5 text-orange-700">
                Mức trình của bạn đang thấp hơn mặt bằng kèo này. Nếu được host đồng ý, Elo của bạn có thể biến động mạnh hơn sau trận.
              </Text>
            </View>
          ) : null}

          <Text className="mt-5 text-sm font-semibold text-slate-800">Lời nhắn giới thiệu</Text>
          <TextInput
            multiline
            value={introNote}
            onChangeText={setIntroNote}
            placeholder={isWaitlist ? 'Ví dụ: Nếu có slot trống bạn báo mình nhé.' : 'Ví dụ: Mình đánh đều, giữ bóng tốt và rất đúng giờ.'}
            placeholderTextColor="#94a3b8"
            className="mt-2 min-h-[110px] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-900"
            textAlignVertical="top"
          />

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
                <Text className="text-sm font-bold text-white">{isWaitlist ? 'Gửi đăng ký dự bị' : 'Gửi yêu cầu'}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  )
}
