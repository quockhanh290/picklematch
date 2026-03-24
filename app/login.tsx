import { supabase } from '@/lib/supabase'
import { router } from 'expo-router'
import { useState } from 'react'
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

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

    const { data: player, error: playerErr } = await supabase
      .from('players')
      .select('*')
      .eq('id', user?.id)
      .single()

    console.log('=== LOAD PROFILE (DEV) ===')
    console.log('looking for player id:', user?.id)
    console.log('profile data:', JSON.stringify(player))
    console.log('profile error:', JSON.stringify(playerErr))

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
    Alert.alert('Đã gửi!', 'Kiểm tra tin nhắn SMS của bạn')
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

    const { data: player, error: playerErr } = await supabase
      .from('players')
      .select('*')
      .eq('id', user?.id)
      .single()

    console.log('=== LOAD PROFILE (OTP) ===')
    console.log('looking for player id:', user?.id)
    console.log('profile data:', JSON.stringify(player))
    console.log('profile error:', JSON.stringify(playerErr))

    router.replace(nextRouteForPlayer(player) as any)
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.logo}>🏓 PickleMatch</Text>
        <Text style={styles.subtitle}>Tìm kèo pickleball dễ dàng</Text>

        {step === 'phone' ? (
          <>
            <Text style={styles.label}>Số điện thoại</Text>
            <View style={styles.phoneRow}>
              <Text style={styles.prefix}>+84</Text>
              <TextInput
                style={styles.input}
                placeholder="909 123 456"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
                maxLength={10}
              />
            </View>
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={sendOTP}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Đang gửi...' : 'Nhận mã OTP'}
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.label}>Nhập mã OTP từ SMS</Text>
            <TextInput
              style={styles.inputOtp}
              placeholder="• • • • • •"
              keyboardType="number-pad"
              value={otp}
              onChangeText={setOtp}
              maxLength={6}
              textAlign="center"
            />
            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={verifyOTP}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Đang xác nhận...' : 'Xác nhận'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStep('phone')}>
              <Text style={styles.back}>← Đổi số điện thoại</Text>
            </TouchableOpacity>
          </>
        )}

        {__DEV__ && (
          <View style={styles.devBox}>
            <Text style={styles.devLabel}>🛠 Đăng nhập dev only</Text>
            <TextInput
              style={styles.devInput}
              placeholder="Email"
              placeholderTextColor="#aaa"
              autoCapitalize="none"
              keyboardType="email-address"
              value={devEmail}
              onChangeText={setDevEmail}
            />
            <TextInput
              style={styles.devInput}
              placeholder="Password"
              placeholderTextColor="#aaa"
              secureTextEntry
              value={devPassword}
              onChangeText={setDevPassword}
            />
            <TouchableOpacity
              style={[styles.devBtn, devLoading && styles.buttonDisabled]}
              onPress={devSignIn}
              disabled={devLoading}
            >
              <Text style={styles.devBtnText}>
                {devLoading ? 'Đang đăng nhập...' : 'Đăng nhập (dev)'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logo: { fontSize: 48, marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 48 },
  label: {
    alignSelf: 'flex-start',
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    width: '100%',
    marginBottom: 16,
    height: 52,
  },
  prefix: { fontSize: 16, color: '#333', marginRight: 8 },
  input: { flex: 1, fontSize: 16, color: '#333' },
  inputOtp: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 22,
    letterSpacing: 8,
    color: '#111',
    marginBottom: 16,
  },
  button: {
    width: '100%',
    backgroundColor: '#16a34a',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  back: { color: '#16a34a', fontWeight: '600', marginTop: 6 },
  devBox: {
    width: '100%',
    marginTop: 32,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    backgroundColor: '#f9fafb',
  },
  devLabel: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 12 },
  devInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 46,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  devBtn: {
    backgroundColor: '#111827',
    borderRadius: 10,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  devBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
})
