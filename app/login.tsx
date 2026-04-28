import { supabase } from '@/lib/supabase'
import { router } from 'expo-router'
import { ShieldCheck, Smartphone } from 'lucide-react-native'
import DevLoginSection from '@/components/auth/DevLoginSection'
import { PROFILE_THEME_COLORS } from '@/components/profile/profileTheme'
import { StatusBar } from 'expo-status-bar'
import { useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SCREEN_FONTS } from '@/constants/screenFonts'
import { RADIUS, SPACING, BORDER } from '@/constants/screenLayout'
import {
  Alert,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'

const HERO_IMAGE = require('../assets/images/login-electric-court-hero.png')

const ELECTRIC = {
  emerald: PROFILE_THEME_COLORS.surfaceTint,
  emeraldDark: PROFILE_THEME_COLORS.primaryContainer,
  lime: PROFILE_THEME_COLORS.tertiaryFixed,
  sky: PROFILE_THEME_COLORS.surfaceContainerHigh,
  skySoft: PROFILE_THEME_COLORS.surfaceContainer,
  ink: PROFILE_THEME_COLORS.onSurface,
  smoke: PROFILE_THEME_COLORS.background,
  white: PROFILE_THEME_COLORS.onPrimary,
}

function OTPDots({ value }: { value: string }) {
  return (
    <View className="flex-row justify-between">
      {Array.from({ length: 6 }).map((_, index) => {
        const digit = value[index]

        return (
          <View
            key={index}
            className="h-14 w-14 items-center justify-center rounded-full"
            style={{
              backgroundColor: ELECTRIC.skySoft,
              borderWidth: digit ? 1.5 : 0,
              borderColor: digit ? ELECTRIC.emerald : 'transparent',
            }}
          >
            <Text
              style={{
                color: ELECTRIC.ink,
                fontSize: 22,
                fontWeight: '900',
              }}
            >
              {digit ?? ''}
            </Text>
          </View>
        )
      })}
    </View>
  )
}

export default function LoginScreen() {
  const insets = useSafeAreaInsets()
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
    if (!phone || phone.replace(/\D/g, '').length < 9) {
      Alert.alert('Lỗi', 'Vui lòng nhập số điện thoại hợp lệ')
      return
    }

    setLoading(true)
    const formattedPhone = '+84' + phone.replace(/\D/g, '').replace(/^0/, '')
    const { error } = await supabase.auth.signInWithOtp({ phone: formattedPhone })
    setLoading(false)

    if (error) {
      Alert.alert('Lỗi', error.message)
      return
    }

    setStep('otp')
    Alert.alert('Đã gửi mã', 'Kiểm tra SMS để nhập mã xác thực của bạn')
  }

  async function verifyOTP() {
    if (!otp || otp.length < 6) {
      Alert.alert('Lỗi', 'Nhập đủ 6 số OTP từ SMS')
      return
    }

    setLoading(true)
    const formattedPhone = '+84' + phone.replace(/\D/g, '').replace(/^0/, '')
    const { error } = await supabase.auth.verifyOtp({
      phone: formattedPhone,
      token: otp,
      type: 'sms',
    })
    setLoading(false)

    if (error) {
      Alert.alert('Lỗi', 'Mã OTP không đúng, vui lòng thử lại')
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user?.id) {
      Alert.alert('Lỗi', 'Không lấy được thông tin tài khoản sau khi xác thực OTP.')
      return
    }

    const { data: player } = await supabase.from('players').select('*').eq('id', user.id).single()
    router.replace(nextRouteForPlayer(player) as any)
  }

  const sanitizedPhone = phone.replace(/\D/g, '')
  const formattedPhonePreview = sanitizedPhone ? `+84 ${sanitizedPhone.replace(/^0/, '')}` : '+84'
  const primaryAction = step === 'phone' ? sendOTP : verifyOTP
  const heroTopPadding = Math.max(insets.top, Platform.OS === 'ios' ? 18 : 14) + 8
  const heroMinHeight = 458 + Math.min(insets.top, 28)
  const cardOverlap = 62 + Math.min(insets.top, 10)

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: ELECTRIC.smoke }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <ScrollView
        bounces={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: Math.max(insets.bottom, 16) }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ minHeight: heroMinHeight, backgroundColor: ELECTRIC.ink }}>
          <ImageBackground
            source={HERO_IMAGE}
            resizeMode="cover"
            style={StyleSheet.absoluteFillObject}
            imageStyle={{ opacity: 0.62 }}
          />
          <View
            style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: PROFILE_THEME_COLORS.onBackground,
            }}
          />
          <View
            style={{
              ...StyleSheet.absoluteFillObject,
              backgroundColor: 'rgba(3,8,23,0.55)',
            }}
          />
          <View
            style={{
              position: 'absolute',
              top: heroTopPadding + 4,
              left: 26,
              width: 74,
              height: 74,
              borderRadius: RADIUS.full,
              backgroundColor: 'rgba(255,255,255,0.08)',
              shadowColor: PROFILE_THEME_COLORS.onPrimary,
              shadowOpacity: 0.35,
              shadowRadius: 36,
              shadowOffset: { width: 0, height: 0 },
            }}
          />
          <View
            style={{
              position: 'absolute',
              top: heroTopPadding + 4,
              right: 26,
              width: 74,
              height: 74,
              borderRadius: RADIUS.full,
              backgroundColor: 'rgba(255,255,255,0.08)',
              shadowColor: PROFILE_THEME_COLORS.onPrimary,
              shadowOpacity: 0.35,
              shadowRadius: 36,
              shadowOffset: { width: 0, height: 0 },
            }}
          />
          {[
            { top: heroTopPadding + 20, left: 34 },
            { top: heroTopPadding + 20, left: 50 },
            { top: heroTopPadding + 20, left: 66 },
            { top: heroTopPadding + 36, left: 26 },
            { top: heroTopPadding + 36, left: 42 },
            { top: heroTopPadding + 36, left: 58 },
            { top: heroTopPadding + 36, left: 74 },
            { top: heroTopPadding + 52, left: 34 },
            { top: heroTopPadding + 52, left: 50 },
            { top: heroTopPadding + 52, left: 66 },
            { top: heroTopPadding + 20, right: 34 },
            { top: heroTopPadding + 20, right: 50 },
            { top: heroTopPadding + 20, right: 66 },
            { top: heroTopPadding + 36, right: 26 },
            { top: heroTopPadding + 36, right: 42 },
            { top: heroTopPadding + 36, right: 58 },
            { top: heroTopPadding + 36, right: 74 },
            { top: heroTopPadding + 52, right: 34 },
            { top: heroTopPadding + 52, right: 50 },
            { top: heroTopPadding + 52, right: 66 },
          ].map((dot, index) => (
            <View
              key={index}
              style={{
                position: 'absolute',
                width: 9,
                height: 9,
                borderRadius: RADIUS.full,
                backgroundColor: 'rgba(255,255,255,0.38)',
                ...dot,
              }}
            />
          ))}
          <View
            style={{
              position: 'absolute',
              top: 54,
              alignSelf: 'center',
              width: 392,
              height: 392,
              borderRadius: RADIUS.full,
              borderWidth: BORDER.base,
              borderColor: 'rgba(173,255,47,0.36)',
            }}
          />
          <View
            style={{
              position: 'absolute',
              top: 96,
              alignSelf: 'center',
              width: 286,
              height: 286,
              borderRadius: RADIUS.full,
              borderWidth: BORDER.base,
              borderColor: 'rgba(6,182,212,0.32)',
            }}
          />
          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 46,
              height: 2,
              backgroundColor: 'rgba(255,255,255,0.12)',
            }}
          />
          <View
            style={{
              position: 'absolute',
              left: 112,
              right: 112,
              bottom: 38,
              height: 3,
              backgroundColor: 'rgba(255,255,255,0.14)',
            }}
          />
          <View
            style={{
              position: 'absolute',
              alignSelf: 'center',
              bottom: 46,
              width: 82,
              height: 180,
              borderRadius: 40,
              backgroundColor: 'rgba(255,255,255,0.06)',
            }}
          />
          <View
            style={{
              position: 'absolute',
              alignSelf: 'center',
              bottom: 140,
              width: 92,
              height: 92,
              borderRadius: RADIUS.full,
              backgroundColor: 'rgba(255,255,255,0.08)',
            }}
          />

          <View className="px-5 pb-24" style={{ paddingTop: heroTopPadding }}>
            <View className="flex-row justify-end">
              <View
                className="rounded-full px-4 py-2"
                style={{ backgroundColor: 'rgba(173,255,47,0.12)', borderWidth: BORDER.base, borderColor: 'rgba(173,255,47,0.28)' }}
              >
                <Text
                  style={{
                    color: ELECTRIC.lime,
                    fontSize: 11,
                    fontWeight: '800',
                    letterSpacing: 1.6,
                  }}
                >
                  ELECTRIC COURT
                </Text>
              </View>
            </View>

            <View style={{ marginTop: 64, maxWidth: 300 }}>
              <Text
                style={{
                  color: ELECTRIC.lime,
                  fontSize: 32,
                  lineHeight: 34,
                  fontFamily: SCREEN_FONTS.boldItalic,
                  letterSpacing: -0.8,
                }}
              >
                PICKLEMATCH VN
              </Text>
              <Text
                style={{
                  marginTop: 14,
                  color: PROFILE_THEME_COLORS.onPrimary,
                  fontSize: 10,
                  fontFamily: SCREEN_FONTS.cta,
                  letterSpacing: 0.4,
                }}
              >
                KINETIC ENERGY • VIETNAM TECH
              </Text>
              <Text
                style={{
                  marginTop: 18,
                  color: 'rgba(255,255,255,0.74)',
                  fontSize: 14,
                  lineHeight: 22,
                  fontFamily: SCREEN_FONTS.body,
                }}
              >
                Đăng nhập để vào sân nhanh hơn, nhận mã OTP và tiếp tục hành trình pickleball của bạn.
              </Text>
            </View>
          </View>
        </View>

        <View style={{ paddingHorizontal: 24, marginTop: -cardOverlap }}>
          <View
            style={{
              borderRadius: RADIUS.hero,
              backgroundColor: ELECTRIC.white,
              paddingHorizontal: SPACING.xl,
              paddingTop: 34,
              paddingBottom: 32,
              shadowColor: PROFILE_THEME_COLORS.onBackground,
              shadowOpacity: 0.08,
              shadowRadius: 28,
              shadowOffset: { width: 0, height: 16 },
              elevation: 8,
            }}
          >
            <View className="mb-6">
              <Text style={{ color: ELECTRIC.ink, fontSize: 28, fontFamily: SCREEN_FONTS.cta }}>Chào mừng trở lại</Text>
              <Text style={{ marginTop: 6, color: PROFILE_THEME_COLORS.onSurfaceVariant, fontSize: 14, lineHeight: 22, fontFamily: SCREEN_FONTS.body }}>
                Đăng nhập để bắt đầu trận đấu của bạn
              </Text>
            </View>

            <View
              style={{
                borderRadius: RADIUS.hero,
                backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow,
                padding: 16,
                borderWidth: BORDER.base,
                borderColor: PROFILE_THEME_COLORS.outlineVariant,
              }}
            >
              <Text style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontSize: 12, fontFamily: SCREEN_FONTS.cta, letterSpacing: 0.8, marginBottom: 10 }}>
                SỐ ĐIỆN THOẠI
              </Text>
              <View
                className="flex-row items-center rounded-[24px] px-4"
                style={{
                  height: 60,
                  backgroundColor: ELECTRIC.skySoft,
                }}
              >
                <View
                  className="mr-3 h-10 w-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: 'rgba(255,255,255,0.4)' }}
                >
                  <Smartphone size={18} color={ELECTRIC.emeraldDark} />
                </View>
                <Text style={{ color: ELECTRIC.ink, fontSize: 16, fontFamily: SCREEN_FONTS.cta }}>+84</Text>
                <View style={{ width: 1, height: 24, backgroundColor: PROFILE_THEME_COLORS.outline, marginHorizontal: 12 }} />
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Nhập số điện thoại"
                  placeholderTextColor={PROFILE_THEME_COLORS.outline}
                  keyboardType="phone-pad"
                  maxLength={10}
                  style={{
                    flex: 1,
                    color: ELECTRIC.ink,
                    fontSize: 16,
                    fontFamily: SCREEN_FONTS.body,
                    paddingVertical: 0,
                  }}
                />
              </View>
            </View>

            <View className="mt-7">
              <View className="mb-3 flex-row items-center justify-between">
                <Text style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontSize: 12, fontFamily: SCREEN_FONTS.cta, letterSpacing: 0.8 }}>Mã OTP (6 CHỮ SỐ)</Text>
                {step === 'otp' ? (
                  <Pressable onPress={sendOTP} disabled={loading}>
                    <Text style={{ color: ELECTRIC.emerald, fontSize: 13, fontFamily: SCREEN_FONTS.cta }}>Gửi lại mã</Text>
                  </Pressable>
                ) : (
                  <Text style={{ color: PROFILE_THEME_COLORS.outline, fontSize: 13, fontFamily: SCREEN_FONTS.cta }}>6 số xác thực</Text>
                )}
              </View>

              <OTPDots value={otp} />

              <TextInput
                value={otp}
                onChangeText={(value) => setOtp(value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Nhập mã OTP"
                placeholderTextColor={PROFILE_THEME_COLORS.outline}
                keyboardType="number-pad"
                maxLength={6}
                style={{
                  marginTop: 14,
                  height: 1,
                  opacity: 0.02,
                }}
              />

              <Text style={{ marginTop: 12, color: PROFILE_THEME_COLORS.onSurfaceVariant, fontSize: 13, lineHeight: 20 }}>
                {step === 'phone'
                  ? 'Nhấn gửi mã OTP để nhận tin nhắn xác thực qua SMS.'
                  : `Mã xác thực đã được gửi tới ${formattedPhonePreview}.`}
              </Text>
            </View>

            <View
              className="mt-6 flex-row rounded-[24px] px-4 py-4"
              style={{
                backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow,
              }}
            >
              <View
                className="mr-3 h-12 w-12 items-center justify-center rounded-full"
                style={{ backgroundColor: PROFILE_THEME_COLORS.surfaceContainer }}
              >
                <ShieldCheck size={19} color={ELECTRIC.emeraldDark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: PROFILE_THEME_COLORS.onSurface, fontSize: 12, fontFamily: SCREEN_FONTS.cta, letterSpacing: 0.6 }}>
                  BẢO MẬT TUYỆT ĐỐI
                </Text>
                <Text style={{ marginTop: 4, color: PROFILE_THEME_COLORS.onSurfaceVariant, fontSize: 13, lineHeight: 22, fontFamily: SCREEN_FONTS.body }}>
                  Thông tin cá nhân và số điện thoại của bạn được mã hóa theo tiêu chuẩn quốc tế.
                </Text>
              </View>
            </View>

            <Pressable
              onPress={primaryAction}
              disabled={loading}
              style={{
                marginTop: 28,
                height: 58,
                borderRadius: RADIUS.hero,
                backgroundColor: PROFILE_THEME_COLORS.surfaceTint,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: loading ? 0.72 : 1,
                shadowColor: PROFILE_THEME_COLORS.surfaceTint,
                shadowOpacity: 0.24,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 10 },
                elevation: 7,
              }}
            >
              <Text style={{ color: ELECTRIC.white, fontSize: 16, fontFamily: SCREEN_FONTS.cta }}>
                {loading ? 'Đang xử lý...' : 'Xác nhận'}
              </Text>
            </Pressable>

            <Pressable
              onPress={step === 'phone' ? sendOTP : () => setStep('phone')}
              disabled={loading}
              style={{
                marginTop: 20,
                height: 58,
                borderRadius: RADIUS.hero,
                backgroundColor: ELECTRIC.skySoft,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: loading ? 0.72 : 1,
              }}
            >
              <Text style={{ color: ELECTRIC.emeraldDark, fontSize: 15, fontFamily: SCREEN_FONTS.cta }}>
                {step === 'phone' ? 'Gửi mã OTP' : 'Đổi số điện thoại'}
              </Text>
            </Pressable>
          </View>

          <View className="mt-8 items-center">
            <Text style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontSize: 14, fontFamily: SCREEN_FONTS.body }}>
              Chưa có tài khoản?{' '}
              <Text style={{ color: ELECTRIC.emerald, fontFamily: SCREEN_FONTS.cta }}>Đăng ký ngay</Text>
            </Text>

            <Text
              style={{
                marginTop: 16,
                color: PROFILE_THEME_COLORS.outline,
                fontSize: 11,
                fontFamily: SCREEN_FONTS.cta,
                letterSpacing: 1.2,
              }}
            >
              ĐIỀU KHOẢN • CHÍNH SÁCH • TRỢ GIÚP
            </Text>
          </View>

          {__DEV__ ? (
            <View style={{ marginTop: 24, paddingHorizontal: 8 }}>
              <DevLoginSection nextRouteForPlayer={nextRouteForPlayer} />
            </View>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
