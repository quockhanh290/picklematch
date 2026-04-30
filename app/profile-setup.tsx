import { AppButton, AppDialog, type AppDialogConfig, AppInput, SecondaryNavbar, SectionCard } from '@/components/design'
import { PROFILE_THEME_COLORS } from '@/components/profile/profileTheme'
import { getEloBandByLegacySkillLabel } from '@/lib/eloSystem'
import { SCREEN_FONTS } from '@/constants/typography'
import { supabase } from '@/lib/supabase'
import { router } from 'expo-router'
import { useState } from 'react'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function ProfileSetup() {
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [loading, setLoading] = useState(false)
  const [dialogConfig, setDialogConfig] = useState<AppDialogConfig | null>(null)
  const defaultBand = getEloBandByLegacySkillLabel('beginner')

  async function saveProfile() {
    if (!name || !city) {
      setDialogConfig({
        title: 'Thiếu thông tin',
        message: 'Vui lòng điền tên và thành phố của bạn.',
        actions: [{ label: 'Đã hiểu' }],
      })
      return
    }

    setLoading(true)

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      setLoading(false)
      setDialogConfig({
        title: 'Lỗi',
        message: userError?.message ?? 'Không tìm thấy tài khoản hiện tại.',
        actions: [{ label: 'Đã hiểu' }],
      })
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
      setDialogConfig({
        title: 'Lỗi',
        message: error.message,
        actions: [{ label: 'Đã hiểu' }],
      })
      return
    }

    router.replace('/onboarding')
  }

  return (
    <View className="flex-1" style={{ backgroundColor: PROFILE_THEME_COLORS.background }}>
      <SecondaryNavbar title="HOÀN THIỆN HỒ SƠ" onBackPress={() => router.back()} />
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>

        <View className="px-5 py-6">
          <Text className="text-[11px] uppercase tracking-[2px] mb-2" style={{ color: PROFILE_THEME_COLORS.primary, fontFamily: SCREEN_FONTS.cta }}>Bắt đầu</Text>
          <Text className="text-3xl mb-3" style={{ color: PROFILE_THEME_COLORS.onSurface, fontFamily: SCREEN_FONTS.headline }}>Tạo hồ sơ của bạn</Text>
          <Text className="text-sm leading-6" style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: SCREEN_FONTS.body }}>
            Điền vài thông tin cơ bản trước, rồi app sẽ gợi ý mức khởi điểm phù hợp cho bạn ở bước tiếp theo.
          </Text>
        </View>

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
      <AppDialog
        visible={Boolean(dialogConfig)}
        config={dialogConfig}
        onClose={() => setDialogConfig(null)}
      />
    </View>
  )
}
