import { supabase } from '@/lib/supabase'
import { router } from 'expo-router'
import { PROFILE_THEME_COLORS } from '@/components/profile/profileTheme'
import { Code2, LockKeyhole, Mail } from 'lucide-react-native'
import { useState } from 'react'
import { Alert, Pressable, Text, TextInput, View } from 'react-native'
import { SCREEN_FONTS } from '@/constants/screenFonts'
import { SPACING, RADIUS } from '@/constants/screenLayout'

const DEV = {
  emerald: PROFILE_THEME_COLORS.surfaceTint,
  emeraldDark: PROFILE_THEME_COLORS.primaryContainer,
  ink: PROFILE_THEME_COLORS.onSurface,
  skySoft: PROFILE_THEME_COLORS.secondaryContainer,
  panel: PROFILE_THEME_COLORS.surfaceContainer,
  textMuted: PROFILE_THEME_COLORS.onSurfaceVariant,
  white: PROFILE_THEME_COLORS.onPrimary,
} as const

export default function DevLoginSection({
  nextRouteForPlayer,
}: {
  nextRouteForPlayer: (player: any) => string
}) {
  const [devEmail, setDevEmail] = useState('')
  const [devPassword, setDevPassword] = useState('')
  const [devLoading, setDevLoading] = useState(false)

  async function devSignIn() {
    if (!devEmail || !devPassword) {
      Alert.alert('Lỗi đăng nhập dev', 'Nhập email và mật khẩu để tiếp tục.')
      return
    }

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
    <View
      style={{
        borderRadius: RADIUS.hero,
        backgroundColor: DEV.panel,
        padding: SPACING.lg,
      }}
    >
      <View className="mb-4 flex-row items-start">
        <View
          className="mr-3 h-12 w-12 items-center justify-center rounded-full"
          style={{ backgroundColor: PROFILE_THEME_COLORS.secondaryFixed }}
        >
          <Code2 size={20} color={DEV.emeraldDark} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: DEV.ink, fontSize: 16, fontFamily: SCREEN_FONTS.cta }}>Chỉ dành cho phát triển</Text>
          <Text
            style={{
              marginTop: 4,
              color: DEV.textMuted,
              fontSize: 13,
              lineHeight: 21,
              fontFamily: SCREEN_FONTS.body,
            }}
          >
            Đăng nhập nhanh bằng email và mật khẩu để kiểm tra luồng nội bộ trong môi trường development.
          </Text>
        </View>
      </View>

      <View className="gap-4">
        <View>
          <Text
            style={{
              marginBottom: 10,
              color: DEV.textMuted,
              fontSize: 12,
              letterSpacing: 0.8,
              fontFamily: SCREEN_FONTS.cta,
            }}
          >
            EMAIL DEV
          </Text>
          <View
            className="flex-row items-center rounded-[24px] px-4"
            style={{
              height: 56,
              backgroundColor: DEV.skySoft,
            }}
          >
            <View
              className="mr-3 h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: 'rgba(255,255,255,0.4)' }}
            >
              <Mail size={18} color={DEV.emeraldDark} />
            </View>
            <TextInput
              value={devEmail}
              onChangeText={setDevEmail}
              placeholder="Nhập email dev"
              placeholderTextColor={PROFILE_THEME_COLORS.outline}
              autoCapitalize="none"
              keyboardType="email-address"
              style={{
                flex: 1,
                color: DEV.ink,
                fontSize: 15,
                fontFamily: SCREEN_FONTS.body,
              }}
            />
          </View>
        </View>

        <View>
          <Text
            style={{
              marginBottom: 10,
              color: DEV.textMuted,
              fontSize: 12,
              letterSpacing: 0.8,
              fontFamily: SCREEN_FONTS.cta,
            }}
          >
            MẬT KHẨU DEV
          </Text>
          <View
            className="flex-row items-center rounded-[24px] px-4"
            style={{
              height: 56,
              backgroundColor: DEV.skySoft,
            }}
          >
            <View
              className="mr-3 h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: 'rgba(255,255,255,0.4)' }}
            >
              <LockKeyhole size={18} color={DEV.emeraldDark} />
            </View>
            <TextInput
              value={devPassword}
              onChangeText={setDevPassword}
              placeholder="Nhập mật khẩu dev"
              placeholderTextColor={PROFILE_THEME_COLORS.outline}
              secureTextEntry
              style={{
                flex: 1,
                color: DEV.ink,
                fontSize: 15,
                fontFamily: SCREEN_FONTS.body,
              }}
            />
          </View>
        </View>

        <Pressable
          onPress={devSignIn}
          disabled={devLoading}
          style={{
            marginTop: 6,
            height: 56,
            borderRadius: RADIUS.hero,
            backgroundColor: DEV.emerald,
            alignItems: 'center',
            justifyContent: 'center',
            opacity: devLoading ? 0.72 : 1,
            shadowColor: PROFILE_THEME_COLORS.surfaceTint,
            shadowOpacity: 0.22,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 8 },
            elevation: 5,
          }}
        >
          <Text style={{ color: DEV.white, fontSize: 15, fontFamily: SCREEN_FONTS.cta }}>
            {devLoading ? 'Đang đăng nhập...' : 'Đăng nhập nhanh'}
          </Text>
        </Pressable>
      </View>
    </View>
  )
}



