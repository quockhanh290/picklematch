import { AppButton, AppInput, SectionCard } from '@/components/design'
import { supabase } from '@/lib/supabase'
import { router } from 'expo-router'
import { useState } from 'react'
import { Alert, View } from 'react-native'

export default function DevLoginSection({
  nextRouteForPlayer,
}: {
  nextRouteForPlayer: (player: any) => string
}) {
  const [devEmail, setDevEmail] = useState('')
  const [devPassword, setDevPassword] = useState('')
  const [devLoading, setDevLoading] = useState(false)

  async function devSignIn() {
    if (!devEmail || !devPassword) return

    setDevLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: devEmail,
      password: devPassword,
    })
    setDevLoading(false)

    if (error) {
      Alert.alert('Lỗi đăng nhập dev', error.message)
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user?.id) {
      Alert.alert('Lỗi', 'Không lấy được thông tin tài khoản sau khi đăng nhập dev.')
      return
    }

    const { data: player } = await supabase.from('players').select('*').eq('id', user.id).single()
    router.replace(nextRouteForPlayer(player) as any)
  }

  return (
    <SectionCard
      title="Chỉ dành cho phát triển"
      subtitle="Đăng nhập nhanh bằng email và mật khẩu trong môi trường phát triển."
      className="mb-4"
    >
      <View className="gap-4">
        <AppInput
          label="Email"
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
          value={devEmail}
          onChangeText={setDevEmail}
        />
        <AppInput
          label="Mật khẩu"
          placeholder="Mật khẩu"
          secureTextEntry
          value={devPassword}
          onChangeText={setDevPassword}
        />
        <AppButton
          label="Đăng nhập nhanh"
          onPress={devSignIn}
          loading={devLoading}
          variant="secondary"
        />
      </View>
    </SectionCard>
  )
}
