import { supabase } from '@/lib/supabase'
import { router } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import {
    ActivityIndicator, Alert, FlatList, ScrollView,
    StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native'

const CITIES = ['Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Cần Thơ', 'Hải Phòng']

const SKILL_LEVELS = [
  { label: '🌱 Mới bắt đầu', value: 'beginner',    elo: 800  },
  { label: '🏃 Cơ bản',      value: 'basic',        elo: 900  },
  { label: '⚡ Trung bình',  value: 'intermediate', elo: 1000 },
  { label: '🔥 Khá',         value: 'advanced',     elo: 1150 },
  { label: '🏆 Giỏi',        value: 'expert',       elo: 1300 },
]

type Court = { id: string; name: string; address: string; city: string }

export default function EditProfile() {
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)
  const [myId, setMyId]             = useState<string | null>(null)

  // Form fields
  const [name, setName]             = useState('')
  const [city, setCity]             = useState('')
  const [skillLabel, setSkillLabel] = useState('intermediate')

  // Sân ưa thích
  const [keyword, setKeyword]             = useState('')
  const [courts, setCourts]               = useState<Court[]>([])
  const [searching, setSearching]         = useState(false)
  const [favCourts, setFavCourts]         = useState<Court[]>([])
  const [favCourtIds, setFavCourtIds]     = useState<string[]>([])

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { init() }, [])

  // Search sân debounce
  useEffect(() => {
    if (!keyword.trim()) { setCourts([]); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      const { data } = await supabase
        .from('courts')
        .select('id, name, address, city')
        .ilike('name', `%${keyword.trim()}%`)
        .limit(8)
      setCourts(data ?? [])
      setSearching(false)
    }, 400)
  }, [keyword])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/login' as any); return }
    setMyId(user.id)

    const { data } = await supabase
      .from('players')
      .select('name, city, skill_label, favorite_court_ids')
      .eq('id', user.id)
      .single()

    if (data) {
      setName(data.name ?? '')
      setCity(data.city ?? '')
      setSkillLabel(data.skill_label ?? 'intermediate')
      const ids: string[] = data.favorite_court_ids ?? []
      setFavCourtIds(ids)

      // Fetch tên sân ưa thích
      if (ids.length > 0) {
        const { data: courtData } = await supabase
          .from('courts')
          .select('id, name, address, city')
          .in('id', ids)
        setFavCourts(courtData ?? [])
      }
    }
    setLoading(false)
  }

  function addFavCourt(court: Court) {
    if (favCourtIds.includes(court.id)) return
    if (favCourtIds.length >= 5) {
      Alert.alert('Tối đa 5 sân', 'Xoá bớt sân để thêm sân mới.')
      return
    }
    setFavCourtIds(prev => [...prev, court.id])
    setFavCourts(prev => [...prev, court])
    setKeyword('')
    setCourts([])
  }

  function removeFavCourt(courtId: string) {
    setFavCourtIds(prev => prev.filter(id => id !== courtId))
    setFavCourts(prev => prev.filter(c => c.id !== courtId))
  }

  async function save() {
    if (!name.trim()) {
      Alert.alert('Lỗi', 'Tên không được để trống')
      return
    }
    if (!myId) return
    setSaving(true)
    const newElo = SKILL_LEVELS.find(s => s.value === skillLabel)?.elo ?? 1000
    const { error } = await supabase
      .from('players')
      .update({
        name: name.trim(),
        city,
        skill_label: skillLabel,
        elo: newElo,
        favorite_court_ids: favCourtIds,
      })
      .eq('id', myId)
    setSaving(false)
    if (error) {
      Alert.alert('Lỗi', error.message)
    } else {
      Alert.alert('✅ Đã lưu!', 'Hồ sơ của bạn đã được cập nhật.', [
        { text: 'OK', onPress: () => router.back() },
      ])
    }
  }

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#16a34a" />
    </View>
  )

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 48 }}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>← Quay lại</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Chỉnh sửa hồ sơ ✏️</Text>

      {/* Tên */}
      <Text style={styles.label}>Tên hiển thị</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="Nhập tên của bạn"
        maxLength={30}
      />

      {/* Thành phố */}
      <Text style={styles.label}>Thành phố</Text>
      <View style={styles.optionRow}>
        {CITIES.map(c => (
          <TouchableOpacity
            key={c}
            style={[styles.optionBtn, city === c && styles.optionBtnActive]}
            onPress={() => setCity(c)}
          >
            <Text style={[styles.optionText, city === c && styles.optionTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Trình độ */}
      <Text style={styles.label}>Trình độ</Text>
      <View style={styles.optionRow}>
        {SKILL_LEVELS.map(s => (
          <TouchableOpacity
            key={s.value}
            style={[styles.optionBtn, skillLabel === s.value && styles.optionBtnActive]}
            onPress={() => setSkillLabel(s.value)}
          >
            <Text style={[styles.optionText, skillLabel === s.value && styles.optionTextActive]}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Sân ưa thích */}
      <Text style={styles.label}>Sân ưa thích <Text style={styles.labelHint}>(tối đa 5)</Text></Text>

      {/* Sân đã chọn */}
      {favCourts.length > 0 && (
        <View style={styles.favList}>
          {favCourts.map(court => (
            <View key={court.id} style={styles.favItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.favName}>{court.name}</Text>
                <Text style={styles.favAddress}>📍 {court.address} · {court.city}</Text>
              </View>
              <TouchableOpacity onPress={() => removeFavCourt(court.id)} style={styles.removeBtn}>
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Search sân */}
      {favCourtIds.length < 5 && (
        <>
          <TextInput
            style={styles.searchInput}
            placeholder="🔍 Tìm sân để thêm..."
            value={keyword}
            onChangeText={setKeyword}
          />
          {searching && <ActivityIndicator color="#16a34a" style={{ marginTop: 8 }} />}
          {!searching && keyword.length > 0 && courts.length === 0 && (
            <Text style={styles.noResult}>Không tìm thấy sân nào 😕</Text>
          )}
          <FlatList
            data={courts}
            keyExtractor={c => c.id}
            scrollEnabled={false}
            renderItem={({ item }) => {
              const already = favCourtIds.includes(item.id)
              return (
                <TouchableOpacity
                  style={[styles.courtItem, already && styles.courtItemAdded]}
                  onPress={() => addFavCourt(item)}
                  disabled={already}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.courtItemName}>{item.name}</Text>
                    <Text style={styles.courtItemAddress}>📍 {item.address} · {item.city}</Text>
                  </View>
                  {already
                    ? <Text style={styles.addedText}>✓ Đã thêm</Text>
                    : <Text style={styles.addText}>+ Thêm</Text>
                  }
                </TouchableOpacity>
              )
            }}
          />
        </>
      )}

      {/* Lưu */}
      <TouchableOpacity
        style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
        onPress={save}
        disabled={saving}
      >
        <Text style={styles.saveBtnText}>
          {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 60, paddingHorizontal: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backBtn: { marginBottom: 8 },
  backText: { fontSize: 14, color: '#16a34a', fontWeight: '600' },
  title: { fontSize: 26, fontWeight: '700', color: '#111', marginBottom: 28 },

  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 10, marginTop: 20 },
  labelHint: { fontSize: 12, color: '#aaa', fontWeight: '400' },

  input: {
    borderWidth: 1.5, borderColor: '#ddd', borderRadius: 14,
    paddingHorizontal: 16, height: 52, fontSize: 16, color: '#333',
  },

  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionBtn: {
    borderWidth: 1.5, borderColor: '#ddd', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  optionBtnActive: { borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
  optionText: { fontSize: 13, color: '#555' },
  optionTextActive: { color: '#16a34a', fontWeight: '600' },

  // Sân ưa thích
  favList: {
    borderWidth: 1.5, borderColor: '#f0f0f0',
    borderRadius: 14, marginBottom: 12, overflow: 'hidden',
  },
  favItem: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  favName: { fontSize: 14, fontWeight: '600', color: '#111', marginBottom: 2 },
  favAddress: { fontSize: 12, color: '#888' },
  removeBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: '#fef2f2', justifyContent: 'center', alignItems: 'center',
  },
  removeBtnText: { fontSize: 13, color: '#dc2626', fontWeight: '700' },

  searchInput: {
    borderWidth: 1.5, borderColor: '#ddd', borderRadius: 14,
    paddingHorizontal: 16, height: 48, fontSize: 15, color: '#333',
  },
  noResult: { fontSize: 13, color: '#aaa', marginTop: 8 },
  courtItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f5',
  },
  courtItemAdded: { opacity: 0.5 },
  courtItemName: { fontSize: 14, fontWeight: '600', color: '#111', marginBottom: 2 },
  courtItemAddress: { fontSize: 12, color: '#888' },
  addText: { fontSize: 13, color: '#16a34a', fontWeight: '700' },
  addedText: { fontSize: 13, color: '#aaa', fontWeight: '600' },

  saveBtn: {
    backgroundColor: '#16a34a', borderRadius: 14,
    height: 54, alignItems: 'center', justifyContent: 'center', marginTop: 36,
  },
  saveBtnDisabled: { backgroundColor: '#86efac' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
