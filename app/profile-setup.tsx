import { AppButton, AppInput, ScreenHeader, SectionCard } from '@/components/design'
import { PROFILE_THEME_COLORS } from '@/components/profile/profileTheme'
import { getEloBandByLegacySkillLabel } from '@/lib/eloSystem'
import { supabase } from '@/lib/supabase'
import { router } from 'expo-router'
import { useState } from 'react'
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function ProfileSetup() {
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [loading, setLoading] = useState(false)
  const defaultBand = getEloBandByLegacySkillLabel('beginner')

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
      skill_label: defaultBand.legacySkillLabel,
      skill_tier: defaultBand.tier,
      elo: defaultBand.seedElo,
      current_elo: defaultBand.seedElo,
    })

    setLoading(false)

    if (error) {
      Alert.alert('Lỗi', error.message)
      return
    }

    router.replace('/onboarding')
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: PROFILE_THEME_COLORS.background }} edges={['top']}>
      <ScrollView stickyHeaderIndices={[0]} contentContainerStyle={{ paddingBottom: 40 }}>
        <ScreenHeader
          eyebrow="Bắt đầu"
          title="Tạo hồ sơ của bạn"
          subtitle="Điền vài thông tin cơ bản trước, rồi app sẽ gợi ý mức khởi điểm phù hợp cho bạn ở bước tiếp theo."
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
            <Text className="text-sm leading-6" style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant }}>
              Sau bước này, bạn sẽ trả lời vài câu hỏi ngắn về thói quen chơi. Hệ thống sẽ tự đề xuất mức khởi điểm và đánh dấu tài khoản provisional để tiếp tục hiệu chỉnh sau vài trận đầu.
            </Text>
          </SectionCard>

          <AppButton label="Tiếp tục" onPress={saveProfile} loading={loading} />

          <TouchableOpacity activeOpacity={0.88} className="mt-4 items-center" onPress={() => router.back()}>
            <Text className="text-sm font-semibold" style={{ color: PROFILE_THEME_COLORS.primary }}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
