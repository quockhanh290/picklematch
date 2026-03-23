import { supabase } from '@/lib/supabase'
import { router } from 'expo-router'
import { useState } from 'react'
import {
  Alert, KeyboardAvoidingView, Platform,
  ScrollView, StyleSheet,
  Text, TextInput, TouchableOpacity,
  View
} from 'react-native'

export default function LoginScreen() {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [loading, setLoading] = useState(false)

  // ── Dev-only email/password login ────────────────────────────────────────────
  const [devEmail, setDevEmail]       = useState('')
  const [devPassword, setDevPassword] = useState('')
  const [devLoading, setDevLoading]   = useState(false)

  async function devSignIn() {
    if (!devEmail || !devPassword) return
    setDevLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email: devEmail, password: devPassword })
    setDevLoading(false)
    if (error) { Alert.alert('Dev login lỗi', error.message); return }
    const { data: { user } } = await supabase.auth.getUser()
    console.log('=== LOAD PROFILE (DEV) ===')
    console.log('looking for player id:', user?.id)
    const { data: player, error: playerErr } = await supabase.from('players').select('*').eq('id', user?.id).single()
    console.log('profile data:', JSON.stringify(player))
    console.log('profile error:', JSON.stringify(playerErr))
    router.replace(player ? '/(tabs)' : '/profile-setup')
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
    } else {
      setStep('otp')
      Alert.alert('Đã gửi!', 'Kiểm tra tin nhắn SMS của bạn')
    }
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
      type: 'sms'
    })
    setLoading(false)
    if (error) {
      Alert.alert('Lỗi', 'Mã OTP không đúng, thử lại nhé')
    } else {
  // Check xem đã có profile chưa
  const { data: { user } } = await supabase.auth.getUser()
  console.log('=== LOAD PROFILE (OTP) ===')
  console.log('looking for player id:', user?.id)
  const { data: player, error: playerErr } = await supabase
    .from('players')
    .select('*')
    .eq('id', user?.id)
    .single()
  console.log('profile data:', JSON.stringify(player))
  console.log('profile error:', JSON.stringify(playerErr))

  if (player) {
    router.replace('/(tabs)') // Đã có profile → vào app
  } else {
    router.replace('/profile-setup') // Chưa có → setup
  }
}
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

        {/* ── Dev-only login — not shown in production ── */}
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
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 12,
    width: '100%',
    height: 64,
    fontSize: 28,
    letterSpacing: 12,
    marginBottom: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    width: '100%',
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  buttonDisabled: { backgroundColor: '#86efac' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  back: { color: '#16a34a', fontSize: 14, marginTop: 8 },

  // Dev-only styles
  devBox:     { width: '100%', marginTop: 40, padding: 16, backgroundColor: '#fef9c3', borderRadius: 12, borderWidth: 1, borderColor: '#fde68a' },
  devLabel:   { fontSize: 13, fontWeight: '700', color: '#92400e', marginBottom: 12 },
  devInput:   { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d97706', borderRadius: 8, paddingHorizontal: 12, height: 44, fontSize: 14, color: '#111', marginBottom: 8 },
  devBtn:     { backgroundColor: '#d97706', borderRadius: 8, height: 44, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  devBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
})
