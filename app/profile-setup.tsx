import { supabase } from '@/lib/supabase'
import { router } from 'expo-router'
import { useState } from 'react'
import {
  Alert, ScrollView,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View
} from 'react-native'

const SKILL_LEVELS = [
  { label: '🌱 Mới bắt đầu', value: 'beginner', elo: 800 },
  { label: '🏃 Cơ bản', value: 'basic', elo: 900 },
  { label: '⚡ Trung bình', value: 'intermediate', elo: 1000 },
  { label: '🔥 Khá', value: 'advanced', elo: 1150 },
  { label: '🏆 Giỏi', value: 'expert', elo: 1300 },
]

export default function ProfileSetup() {
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [skill, setSkill] = useState('')
  const [loading, setLoading] = useState(false)

  async function saveProfile() {
    if (!name || !city || !skill) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền đầy đủ')
      return
    }
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const selectedSkill = SKILL_LEVELS.find(s => s.value === skill)

    console.log('=== PROFILE SETUP ===')
    console.log('user id:', user?.id)
    console.log('user phone:', user?.phone)
    console.log('user email:', user?.email)

    const { data, error } = await supabase.from('players').upsert({
      id: user?.id,
      phone: user?.phone || null,
      name,
      city,
      skill_label: skill,
      elo: selectedSkill?.elo || 1000,
    }).select()
    console.log('insert data:', JSON.stringify(data))
    console.log('insert error:', JSON.stringify(error))

    setLoading(false)
    if (error) {
      Alert.alert('Lỗi', error.message)
    } else {
      router.replace('/(tabs)' as any)
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Tạo hồ sơ của bạn 👤</Text>
      <Text style={styles.subtitle}>Để mình ghép kèo phù hợp cho bạn</Text>

      <Text style={styles.label}>Tên / Nickname</Text>
      <TextInput
        style={styles.input}
        placeholder="Ví dụ: Minh Pickle"
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Bạn ở thành phố nào?</Text>
      <TextInput
        style={styles.input}
        placeholder="TP. Hồ Chí Minh"
        value={city}
        onChangeText={setCity}
      />

      <Text style={styles.label}>Trình độ của bạn?</Text>
      <View style={styles.skillGrid}>
        {SKILL_LEVELS.map((s) => (
          <TouchableOpacity
            key={s.value}
            style={[styles.skillBtn, skill === s.value && styles.skillBtnActive]}
            onPress={() => setSkill(s.value)}
          >
            <Text style={[styles.skillText, skill === s.value && styles.skillTextActive]}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={saveProfile}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Đang lưu...' : 'Bắt đầu tìm kèo 🏓'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#fff',
    padding: 32,
    paddingTop: 80,
  },
  title: { fontSize: 28, fontWeight: '700', color: '#111', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#666', marginBottom: 40 },
  label: {
    fontSize: 14, fontWeight: '600',
    color: '#333', marginBottom: 8, marginTop: 16,
  },
  input: {
    borderWidth: 1.5, borderColor: '#ddd',
    borderRadius: 12, paddingHorizontal: 16,
    height: 52, fontSize: 16, color: '#333',
  },
  skillGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4,
  },
  skillBtn: {
    borderWidth: 1.5, borderColor: '#ddd',
    borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10,
  },
  skillBtnActive: { borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
  skillText: { fontSize: 14, color: '#555' },
  skillTextActive: { color: '#16a34a', fontWeight: '600' },
  button: {
    backgroundColor: '#16a34a', borderRadius: 12,
    height: 52, alignItems: 'center',
    justifyContent: 'center', marginTop: 40,
  },
  buttonDisabled: { backgroundColor: '#86efac' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
