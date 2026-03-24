import { supabase } from '@/lib/supabase'
import { router } from 'expo-router'
import { useState } from 'react'
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function ProfileSetup() {
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [loading, setLoading] = useState(false)

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

    const { error } = await supabase
      .from('players')
      .upsert({
        id: user.id,
        phone: user.phone || null,
        name,
        city,
        skill_label: 'beginner',
        elo: 800,
      })

    setLoading(false)

    if (error) {
      Alert.alert('Lỗi', error.message)
      return
    }

    router.replace('/skill-assessment')
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.title}>Tạo hồ sơ của bạn</Text>
        <Text style={styles.subtitle}>
          Điền vài thông tin cơ bản trước, rồi mình sẽ giúp bạn xác nhận trình độ ở bước tiếp theo.
        </Text>
      </View>

      <Text style={styles.label}>Tên / Nickname</Text>
      <TextInput
        style={styles.input}
        placeholder="Ví dụ: Minh Pickle"
        placeholderTextColor="#9CA3AF"
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Bạn ở thành phố nào?</Text>
      <TextInput
        style={styles.input}
        placeholder="TP. Hồ Chí Minh"
        placeholderTextColor="#9CA3AF"
        value={city}
        onChangeText={setCity}
      />

      <View style={styles.note}>
        <Text style={styles.noteText}>
          Sau bước này, bạn sẽ chọn mức trình độ thực chiến để hệ thống gán Elo khởi điểm và đánh dấu tài khoản provisional.
        </Text>
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={saveProfile}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Đang lưu...' : 'Tiếp tục'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7FAF8',
  },
  container: {
    flexGrow: 1,
    backgroundColor: '#F7FAF8',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  hero: { marginBottom: 28 },
  title: { fontSize: 30, fontWeight: '800', color: '#111827', marginBottom: 8 },
  subtitle: { fontSize: 15, lineHeight: 22, color: '#4B5563' },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 54,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  note: {
    marginTop: 24,
    backgroundColor: '#ECFDF5',
    borderRadius: 14,
    padding: 14,
  },
  noteText: { fontSize: 13, lineHeight: 19, color: '#166534' },
  button: {
    backgroundColor: '#16A34A',
    borderRadius: 16,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  buttonDisabled: { backgroundColor: '#86EFAC' },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
})
