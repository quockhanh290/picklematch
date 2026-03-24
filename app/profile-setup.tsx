import { AppButton, AppInput, ScreenHeader, SectionCard } from '@/components/design'
import { supabase } from '@/lib/supabase'
import { router } from 'expo-router'
import { useState } from 'react'
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function ProfileSetup() {
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [loading, setLoading] = useState(false)

  async function saveProfile() {
    if (!name || !city) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền tên và thành phố của bạn.')
      return
    }

    setLoading(true)

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setLoading(false)
      Alert.alert('Lỗi', userError?.message ?? 'Không tìm thấy tài khoản hiện tại.')
      return
    }

    const { error } = await supabase.from('players').upsert({
      id: user.id,
      phone: user.phone || null,
      name,
      city,
      skill_label: 'beginner',
      elo: 800,
    })

    setLoading(false)

    if (error) {
      Alert.alert('Lỗi', error.message)
      return
    }

    router.replace('/skill-assessment')
  }

  return (
    <SafeAreaView className="flex-1 bg-stone-100" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <ScreenHeader
          eyebrow="Bắt đầu"
          title="Tạo hồ sơ của bạn"
          subtitle="Điền vài thông tin cơ bản trước, rồi mình sẽ giúp bạn xác nhận trình độ ở bước tiếp theo."
        />

        <View className="px-5">
          <SectionCard title="Thông tin cơ bản" subtitle="Thông tin này sẽ được dùng để hiển thị hồ sơ và gợi ý kèo phù hợp." className="mb-4">
            <View className="gap-4">
              <AppInput
                label="Tên / Nickname"
                placeholder="Ví dụ: Minh Pickle"
                value={name}
                onChangeText={setName}
              />
              <AppInput
                label="Bạn ở thành phố nào?"
                placeholder="TP. Hồ Chí Minh"
                value={city}
                onChangeText={setCity}
              />
            </View>
          </SectionCard>

          <SectionCard title="Bước tiếp theo" className="mb-6">
            <Text className="text-sm leading-6 text-slate-500">
              Sau bước này, bạn sẽ chọn mức trình độ thực chiến để hệ thống gán Elo khởi điểm và đánh dấu tài khoản provisional.
            </Text>
          </SectionCard>

          <AppButton label="Tiếp tục" onPress={saveProfile} loading={loading} />

          <TouchableOpacity activeOpacity={0.88} className="mt-4 items-center" onPress={() => router.back()}>
            <Text className="text-sm font-semibold text-emerald-700">Quay lại</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
