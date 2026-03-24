import { AppButton, AppInput, ScreenHeader, SectionCard } from '@/components/design'
import { supabase } from '@/lib/supabase'
import { router } from 'expo-router'
import { useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native'

export default function LoginScreen() {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [loading, setLoading] = useState(false)

  const [devEmail, setDevEmail] = useState('')
  const [devPassword, setDevPassword] = useState('')
  const [devLoading, setDevLoading] = useState(false)

  function nextRouteForPlayer(player: any) {
    if (!player) return '/profile-setup'
    if (!player.self_assessed_level) return '/skill-assessment'
    return '/(tabs)'
  }

  async function devSignIn() {
    if (!devEmail || !devPassword) return

    setDevLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email: devEmail,
      password: devPassword,
    })
    setDevLoading(false)

    if (error) {
      Alert.alert('Dev login lỗi', error.message)
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data: player } = await supabase.from('players').select('*').eq('id', user?.id).single()
    router.replace(nextRouteForPlayer(player) as any)
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

    const { data: player } = await supabase.from('players').select('*').eq('id', user?.id).single()
    router.replace(nextRouteForPlayer(player) as any)
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#f5f5f4' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <ScreenHeader
          eyebrow="Chào mừng"
          title="PickleMatch"
          subtitle="Đăng nhập bằng số điện thoại để vào sân nhanh hơn, nhận OTP và tiếp tục tạo hồ sơ."
        />

        <View className="px-5">
          <SectionCard title={step === 'phone' ? 'Nhập số điện thoại' : 'Xác nhận OTP'} className="mb-4">
            {step === 'phone' ? (
              <View className="gap-4">
                <View>
                  <Text className="mb-2 text-sm font-bold text-slate-900">Số điện thoại</Text>
                  <View className="h-14 flex-row items-center rounded-2xl border border-slate-200 bg-white px-4">
                    <Text className="mr-3 text-[15px] font-semibold text-slate-700">+84</Text>
                    <View className="h-6 w-px bg-slate-200" />
                    <View className="ml-3 flex-1">
                      <AppInput
                        value={phone}
                        onChangeText={setPhone}
                        placeholder="909 123 456"
                        keyboardType="phone-pad"
                        maxLength={10}
                        style={{ height: 24, paddingVertical: 0 }}
                      />
                    </View>
                  </View>
                </View>
                <AppButton label="Nhận mã OTP" onPress={sendOTP} loading={loading} />
              </View>
            ) : (
              <View className="gap-4">
                <AppInput
                  label="Nhập mã OTP từ SMS"
                  value={otp}
                  onChangeText={setOtp}
                  placeholder="• • • • • •"
                  keyboardType="number-pad"
                  maxLength={6}
                  textAlign="center"
                />
                <AppButton label="Xác nhận" onPress={verifyOTP} loading={loading} />
                <AppButton label="Đổi số điện thoại" onPress={() => setStep('phone')} variant="ghost" />
              </View>
            )}
          </SectionCard>

          {__DEV__ ? (
            <SectionCard title="Dev only" subtitle="Đăng nhập nhanh bằng tài khoản email/password dành cho môi trường phát triển." className="mb-4">
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
                  label="Password"
                  placeholder="Password"
                  secureTextEntry
                  value={devPassword}
                  onChangeText={setDevPassword}
                />
                <AppButton label="Đăng nhập (dev)" onPress={devSignIn} loading={devLoading} variant="secondary" />
              </View>
            </SectionCard>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
