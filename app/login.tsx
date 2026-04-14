import { AppButton, AppInput, SectionCard } from '@/components/design'
import { supabase } from '@/lib/supabase'
import { useAppTheme } from '@/lib/theme-context'
import { router } from 'expo-router'
import { ArrowLeft, ShieldCheck } from 'lucide-react-native'
import { useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native'

const DevLoginSection =
  __DEV__ ? (require('../components/auth/DevLoginSection').default as typeof import('../components/auth/DevLoginSection').default) : null

export default function LoginScreen() {
  const theme = useAppTheme()
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [loading, setLoading] = useState(false)

  function nextRouteForPlayer(player: any) {
    if (!player) return '/profile-setup'
    if (!player.onboarding_completed || !player.self_assessed_level) return '/onboarding'
    return '/(tabs)'
  }

  async function sendOTP() {
    if (!phone || phone.length < 9) {
      Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại hợp lệ')
      return
    }

    setLoading(true)
    const formattedPhone = '+84' + phone.replace(/^0/, '')
    const { error } = await supabase.auth.signInWithOtp({ phone: formattedPhone })
    setLoading(false)

    if (error) {
      Alert.alert('Lỗi', error.message)
      return
    }

    setStep('otp')
    Alert.alert('Đã gửi', 'Kiểm tra tin nhắn SMS của bạn')
  }

  async function verifyOTP() {
    if (!otp || otp.length < 6) {
      Alert.alert('Lỗi', 'Nhập mã 6 số từ SMS')
      return
    }

    setLoading(true)
    const formattedPhone = '+84' + phone.replace(/^0/, '')
    const { error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token: otp,
      type: 'sms',
    })
    setLoading(false)

    if (error) {
      Alert.alert('Lỗi', 'Mã OTP không đúng, thử lại nhé')
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user?.id) {
      Alert.alert('Lỗi', 'Không lấy được thông tin tài khoản sau khi xác nhận OTP.')
      return
    }

    const { data: player } = await supabase.from('players').select('*').eq('id', user.id).single()
    router.replace(nextRouteForPlayer(player) as any)
  }

  const formattedPhonePreview = phone ? `+84 ${phone.replace(/\s+/g, '')}` : '+84'

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: theme.backgroundMuted }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <View className="px-5 pb-2 pt-4">
          <View className="flex-row items-center justify-between">
            <Pressable
              onPress={() => router.back()}
              className="h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white"
              style={{ opacity: 0.96 }}
            >
              <ArrowLeft size={20} color={theme.text} />
            </Pressable>
            <Text className="text-lg font-black text-slate-950">Đăng nhập</Text>
            <View className="h-12 w-12" />
          </View>
        </View>

        <View className="px-5 pt-3">
          <View
            className="overflow-hidden rounded-[32px] px-5 pb-5 pt-6"
            style={{
              backgroundColor: '#eefbf4',
              minHeight: 228,
            }}
          >
            <View
              style={{
                position: 'absolute',
                right: -48,
                top: -24,
                width: 220,
                height: 220,
                borderRadius: 999,
                backgroundColor: '#bbf7d0',
                opacity: 0.95,
              }}
            />
            <View
              style={{
                position: 'absolute',
                left: -24,
                bottom: -70,
                width: 180,
                height: 180,
                borderRadius: 999,
                backgroundColor: '#a7f3d0',
                opacity: 0.6,
              }}
            />
            <View
              style={{
                position: 'absolute',
                right: 30,
                bottom: 22,
                width: 132,
                height: 132,
                borderRadius: 999,
                borderWidth: 22,
                borderColor: 'rgba(5, 150, 105, 0.14)',
              }}
            />

            <View className="rounded-full self-start bg-white/80 px-4 py-2">
              <Text className="text-xs font-extrabold uppercase tracking-[1.4px] text-emerald-700">PickleMatch</Text>
            </View>

            <View className="mt-12 max-w-[72%]">
              <Text className="text-[32px] font-black leading-[38px]" style={{ color: theme.text }}>
                Chào mừng
              </Text>
              <Text className="mt-3 text-sm leading-6" style={{ color: theme.textMuted }}>
                Đăng nhập bằng số điện thoại để vào sân nhanh hơn, nhận OTP và tiếp tục hoàn thiện hồ sơ.
              </Text>
            </View>
          </View>
        </View>

        <View className="px-5 pt-7">
          <Text className="text-[22px] font-black text-slate-950">
            {step === 'phone' ? 'Nhập số điện thoại' : 'Xác nhận OTP'}
          </Text>
          <Text className="mt-2 text-sm leading-6 text-slate-500">
            {step === 'phone'
              ? 'Bắt đầu bằng số điện thoại của bạn để hệ thống gửi mã xác nhận qua SMS.'
              : `Mã OTP đã được gửi tới ${formattedPhonePreview}. Nhập 6 số để tiếp tục.`}
          </Text>
        </View>

        <View className="px-5 pt-5">
          <SectionCard className="mb-4">
            {step === 'phone' ? (
              <View className="gap-5">
                <View
                  className="rounded-[24px] border px-4 py-4"
                  style={{ backgroundColor: theme.surfaceMuted, borderColor: theme.border }}
                >
                  <Text className="mb-3 text-sm font-bold" style={{ color: theme.text }}>
                    Số điện thoại
                  </Text>
                  <View
                    className="h-14 flex-row items-center rounded-2xl bg-white px-4"
                    style={{ borderWidth: 1, borderColor: theme.border }}
                  >
                    <Text className="mr-3 text-lg font-black" style={{ color: theme.text }}>
                      +84
                    </Text>
                    <View className="h-6 w-px" style={{ backgroundColor: theme.borderStrong }} />
                    <View className="ml-3 flex-1">
                      <AppInput
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="909 123 456"
                        keyboardType="phone-pad"
                        maxLength={10}
                        style={{
                          height: 24,
                          paddingVertical: 0,
                          borderWidth: 0,
                          paddingHorizontal: 0,
                          backgroundColor: 'transparent',
                        }}
                      />
                    </View>
                  </View>
                </View>

                <AppButton label="Nhận mã OTP" onPress={sendOTP} loading={loading} />
              </View>
            ) : (
              <View className="gap-5">
                <View
                  className="items-center rounded-[24px] border px-5 py-6"
                  style={{ backgroundColor: theme.surfaceMuted, borderColor: theme.border }}
                >
                  <Text className="text-xs font-extrabold uppercase tracking-[1.4px]" style={{ color: theme.primaryStrong }}>
                    Mã đã gửi
                  </Text>
                  <Text className="mt-3 text-4xl font-black tracking-[8px]" style={{ color: theme.primary }}>
                    {otp ? otp.padEnd(6, '•') : '••••••'}
                  </Text>
                  <Text className="mt-3 text-center text-sm leading-6" style={{ color: theme.textMuted }}>
                    Nhập đúng 6 số từ SMS để mở tiếp bước vào app.
                  </Text>
                </View>

                <AppInput
                  label="Nhập mã OTP từ SMS"
                  value={otp}
                  onChangeText={setOtp}
                  placeholder="••••••"
                  keyboardType="number-pad"
                  maxLength={6}
                  textAlign="center"
                />

                <AppButton label="Xác nhận" onPress={verifyOTP} loading={loading} />
                <AppButton label="Đổi số điện thoại" onPress={() => setStep('phone')} variant="ghost" />
              </View>
            )}
          </SectionCard>

          <View
            className="mb-4 flex-row items-start rounded-[24px] border px-4 py-4"
            style={{ backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' }}
          >
            <View className="mt-0.5 h-10 w-10 items-center justify-center rounded-full bg-white">
              <ShieldCheck size={18} color={theme.primaryStrong} />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-sm font-extrabold text-emerald-800">Đăng nhập nhanh, ít bước</Text>
              <Text className="mt-1 text-sm leading-6 text-emerald-700">
                Màn này chỉ xử lý xác thực bằng số điện thoại. Hồ sơ và onboarding sẽ được giữ nguyên flow cũ.
              </Text>
            </View>
          </View>

          {DevLoginSection ? <DevLoginSection nextRouteForPlayer={nextRouteForPlayer} /> : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
