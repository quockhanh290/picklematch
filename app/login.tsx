import { AppDialog, type AppDialogConfig } from '@/components/design'
import { supabase } from '@/lib/supabase'
import { router } from 'expo-router'
import { ShieldCheck, Smartphone, CheckCircle2 } from 'lucide-react-native'
import DevLoginSection from '@/components/auth/DevLoginSection'
import { PROFILE_THEME_COLORS } from '@/constants/profileTheme'
import { StatusBar } from 'expo-status-bar'
import { useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SCREEN_FONTS } from '@/constants/typography'
import { RADIUS, SPACING, BORDER, SHADOW } from '@/constants/screenLayout'
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

function OTPDots({ value }: { value: string }) {
  return (
    <View className="flex-row justify-between">
      {Array.from({ length: 6 }).map((_, index) => {
        const digit = value[index]
        const active = !!digit

        return (
          <View
            key={index}
            style={{
              height: 56,
              width: 50,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: RADIUS.lg,
              backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow,
              borderWidth: BORDER.base,
              borderColor: active ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.outlineVariant,
            }}
          >
            <Text
              style={{
                color: PROFILE_THEME_COLORS.onSurface,
                fontSize: 22,
                fontFamily: SCREEN_FONTS.headline,
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
  const [dialogConfig, setDialogConfig] = useState<AppDialogConfig | null>(null)

  function nextRouteForPlayer(player: { onboarding_completed?: boolean; self_assessed_level?: any } | null) {
    if (!player) return '/profile-setup'
    if (!player.onboarding_completed || !player.self_assessed_level) return '/onboarding'
    return '/(tabs)'
  }

  async function sendOTP() {
    if (!phone || phone.replace(/\D/g, '').length < 9) {
      setDialogConfig({
        title: 'Lỗi',
        message: 'Vui lòng nhập số điện thoại hợp lệ',
        actions: [{ label: 'Đã hiểu' }],
      })
      return
    }

    setLoading(true)
    const formattedPhone = '+84' + phone.replace(/\D/g, '').replace(/^0/, '')
    const { error } = await supabase.auth.signInWithOtp({ phone: formattedPhone })
    setLoading(false)

    if (error) {
      setDialogConfig({
        title: 'Lỗi',
        message: error.message,
        actions: [{ label: 'Đã hiểu' }],
      })
      return
    }

    setStep('otp')
  }

  async function verifyOTP() {
    if (!otp || otp.length < 6) {
      setDialogConfig({
        title: 'Lỗi',
        message: 'Nhập đủ 6 số OTP từ SMS',
        actions: [{ label: 'Đã hiểu' }],
      })
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
      setDialogConfig({
        title: 'Lỗi',
        message: 'Mã OTP không đúng, vui lòng thử lại',
        actions: [{ label: 'Đã hiểu' }],
      })
      return
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user?.id) {
      setDialogConfig({
        title: 'Lỗi',
        message: 'Không lấy được thông tin tài khoản sau khi xác thực OTP.',
        actions: [{ label: 'Đã hiểu' }],
      })
      return
    }

    const { data: player } = await supabase.from('players').select('*').eq('id', user.id).single()
    router.replace(nextRouteForPlayer(player) as any)
  }

  const sanitizedPhone = phone.replace(/\D/g, '')
  const formattedPhonePreview = sanitizedPhone ? `+84 ${sanitizedPhone.replace(/^0/, '')}` : '+84'
  const primaryAction = step === 'phone' ? sendOTP : verifyOTP
  
  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: PROFILE_THEME_COLORS.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" translucent backgroundColor="transparent" />
      <ScrollView
        bounces={false}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Editorial Hero Section */}
        <View style={{ 
          backgroundColor: '#0F6E56', 
          paddingTop: insets.top + 40,
          paddingBottom: 90,
          paddingHorizontal: 24,
          borderBottomLeftRadius: 48,
          borderBottomRightRadius: 48,
        }}>
          <View style={{ marginBottom: 24 }}>
            <View style={{ width: 48, height: 6, backgroundColor: 'white', borderRadius: RADIUS.full, marginBottom: 20, opacity: 0.8 }} />
            <Text style={{ 
              fontFamily: SCREEN_FONTS.headlineItalic, 
              fontSize: 48, 
              color: 'white', 
              lineHeight: 52,
              letterSpacing: -2 
            }}>
              PICKLEMATCH
            </Text>
            <Text style={{ 
              fontFamily: SCREEN_FONTS.headlineItalic, 
              fontSize: 32, 
              color: 'white', 
              lineHeight: 34,
              letterSpacing: -1,
              marginTop: -2,
              opacity: 0.9
            }}>
              VIETNAM
            </Text>
          </View>
          
          <View style={{ 
            backgroundColor: 'rgba(255,255,255,0.12)', 
            paddingHorizontal: 12, 
            paddingVertical: 6, 
            borderRadius: RADIUS.sm,
            alignSelf: 'flex-start',
            marginBottom: 16
          }}>
            <Text style={{ 
              color: 'white', 
              fontFamily: SCREEN_FONTS.cta, 
              fontSize: 10, 
              letterSpacing: 1,
              textTransform: 'uppercase'
            }}>
              The Next Gen Pickleball Hub
            </Text>
          </View>

          <Text style={{ 
            color: 'rgba(255,255,255,0.85)', 
            fontFamily: SCREEN_FONTS.body, 
            fontSize: 15, 
            lineHeight: 22,
            maxWidth: 300
          }}>
            Kiến tạo cộng đồng, nâng tầm đam mê và tìm kiếm những trận đấu bùng nổ ngay hôm nay.
          </Text>
        </View>

        <View style={{ paddingHorizontal: 24, marginTop: -40 }}>
          <View
            style={{
              borderRadius: RADIUS.xl,
              backgroundColor: 'white',
              padding: 24,
              borderWidth: BORDER.base,
              borderColor: PROFILE_THEME_COLORS.outlineVariant,
              ...SHADOW.md,
            }}
          >
            <View style={{ marginBottom: 24 }}>
              <Text style={{ 
                color: PROFILE_THEME_COLORS.onSurface, 
                fontSize: 24, 
                fontFamily: SCREEN_FONTS.headline,
                textTransform: 'uppercase'
              }}>
                {step === 'phone' ? 'Đăng nhập' : 'Xác thực OTP'}
              </Text>
              <Text style={{ 
                marginTop: 4, 
                color: PROFILE_THEME_COLORS.onSurfaceVariant, 
                fontSize: 14, 
                fontFamily: SCREEN_FONTS.body 
              }}>
                {step === 'phone' 
                  ? 'Sử dụng số điện thoại để tiếp tục' 
                  : `Mã đã gửi tới ${formattedPhonePreview}`}
              </Text>
            </View>

            {step === 'phone' ? (
              <View>
                <View style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  backgroundColor: PROFILE_THEME_COLORS.surfaceAlt,
                  borderRadius: RADIUS.lg,
                  borderWidth: BORDER.base,
                  borderColor: PROFILE_THEME_COLORS.outlineVariant,
                  height: 64,
                  paddingHorizontal: 16,
                }}>
                  <Smartphone size={20} color={PROFILE_THEME_COLORS.primary} />
                  <Text style={{ 
                    marginLeft: 12,
                    marginRight: 12,
                    fontSize: 16, 
                    fontFamily: SCREEN_FONTS.headline,
                    color: PROFILE_THEME_COLORS.onSurface
                  }}>+84</Text>
                  <View style={{ width: 1, height: 24, backgroundColor: PROFILE_THEME_COLORS.outlineVariant }} />
                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="Nhập số điện thoại"
                    placeholderTextColor={PROFILE_THEME_COLORS.outline}
                    keyboardType="phone-pad"
                    maxLength={10}
                    style={{
                      flex: 1,
                      marginLeft: 12,
                      color: PROFILE_THEME_COLORS.onSurface,
                      fontSize: 16,
                      fontFamily: SCREEN_FONTS.body,
                    }}
                  />
                </View>
                
                <Text style={{ 
                  marginTop: 12, 
                  color: PROFILE_THEME_COLORS.onSurfaceVariant, 
                  fontSize: 12, 
                  fontFamily: SCREEN_FONTS.body,
                  lineHeight: 18
                }}>
                  Chúng tôi sẽ gửi một mã xác thực 6 số qua SMS để bảo mật tài khoản của bạn.
                </Text>
              </View>
            ) : (
              <View>
                <OTPDots value={otp} />
                <TextInput
                  value={otp}
                  onChangeText={(value) => setOtp(value.replace(/\D/g, '').slice(0, 6))}
                  autoFocus
                  keyboardType="number-pad"
                  maxLength={6}
                  style={{ height: 1, opacity: 0 }}
                />
                
                <Pressable 
                  onPress={sendOTP} 
                  disabled={loading}
                  style={{ marginTop: 20, alignSelf: 'center' }}
                >
                  <Text style={{ 
                    color: PROFILE_THEME_COLORS.primary, 
                    fontFamily: SCREEN_FONTS.headline,
                    fontSize: 14,
                    textDecorationLine: 'underline'
                  }}>
                    Gửi lại mã xác thực
                  </Text>
                </Pressable>
              </View>
            )}

            <TouchableOpacity
              onPress={primaryAction}
              disabled={loading}
              style={{
                marginTop: 32,
                height: 56,
                borderRadius: RADIUS.full,
                backgroundColor: PROFILE_THEME_COLORS.primary,
                alignItems: 'center',
                justifyContent: 'center',
                opacity: loading ? 0.7 : 1,
              }}
            >
              <Text style={{ 
                color: 'white', 
                fontSize: 16, 
                fontFamily: SCREEN_FONTS.cta,
                textTransform: 'uppercase',
                letterSpacing: 1
              }}>
                {loading ? 'Đang xử lý...' : step === 'phone' ? 'Tiếp tục →' : 'Xác nhận'}
              </Text>
            </TouchableOpacity>

            {step === 'otp' && (
              <Pressable 
                onPress={() => setStep('phone')}
                style={{ marginTop: 16, alignSelf: 'center' }}
              >
                <Text style={{ 
                  color: PROFILE_THEME_COLORS.onSurfaceVariant, 
                  fontFamily: SCREEN_FONTS.label,
                  fontSize: 13
                }}>
                  Đổi số điện thoại
                </Text>
              </Pressable>
            )}
          </View>

          {/* Trust Banner */}
          <View style={{ 
            marginTop: 24, 
            flexDirection: 'row', 
            backgroundColor: '#E1F5EE',
            borderRadius: RADIUS.lg,
            padding: 16,
            gap: 12
          }}>
            <ShieldCheck size={20} color="#0F6E56" />
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#0F6E56', fontFamily: SCREEN_FONTS.headline, fontSize: 12, textTransform: 'uppercase' }}>
                Bảo mật tuyệt đối
              </Text>
              <Text style={{ color: '#0F6E56', fontFamily: SCREEN_FONTS.body, fontSize: 12, lineHeight: 18, marginTop: 2, opacity: 0.8 }}>
                Thông tin của bạn được mã hóa và bảo mật theo tiêu chuẩn cao nhất.
              </Text>
            </View>
          </View>

          <View style={{ marginTop: 40, alignItems: 'center', paddingBottom: 40 }}>
            <Text style={{ 
              color: PROFILE_THEME_COLORS.onSurfaceVariant, 
              fontFamily: SCREEN_FONTS.body,
              fontSize: 14 
            }}>
              Chưa có tài khoản?{' '}
              <Text style={{ color: PROFILE_THEME_COLORS.primary, fontFamily: SCREEN_FONTS.headline }}>Tham gia ngay</Text>
            </Text>
            
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 24, opacity: 0.5 }}>
              <Text style={{ color: PROFILE_THEME_COLORS.outline, fontSize: 10, fontFamily: SCREEN_FONTS.label }}>ĐIỀU KHOẢN</Text>
              <Text style={{ color: PROFILE_THEME_COLORS.outline, fontSize: 10, fontFamily: SCREEN_FONTS.label }}>•</Text>
              <Text style={{ color: PROFILE_THEME_COLORS.outline, fontSize: 10, fontFamily: SCREEN_FONTS.label }}>CHÍNH SÁCH</Text>
              <Text style={{ color: PROFILE_THEME_COLORS.outline, fontSize: 10, fontFamily: SCREEN_FONTS.label }}>•</Text>
              <Text style={{ color: PROFILE_THEME_COLORS.outline, fontSize: 10, fontFamily: SCREEN_FONTS.label }}>TRỢ GIÚP</Text>
            </View>
          </View>

          {__DEV__ ? (
            <View style={{ marginBottom: 40 }}>
              <DevLoginSection
                nextRouteForPlayer={nextRouteForPlayer}
                presentDialog={(payload) => setDialogConfig(payload)}
              />
            </View>
          ) : null}
        </View>
      </ScrollView>
      
      <AppDialog
        visible={Boolean(dialogConfig)}
        config={dialogConfig}
        onClose={() => setDialogConfig(null)}
      />
    </KeyboardAvoidingView>
  )
}


