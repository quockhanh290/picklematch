import { supabase } from '@/lib/supabase'
import { router } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator, Alert, FlatList, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native'

const SKILL_LEVELS = [
  { label: '🌱 Mới bắt đầu', value: 'beginner',    elo: 800  },
  { label: '🏃 Cơ bản',      value: 'basic',        elo: 900  },
  { label: '⚡ Trung bình',  value: 'intermediate', elo: 1000 },
  { label: '🔥 Khá',         value: 'advanced',     elo: 1150 },
  { label: '🏆 Giỏi',        value: 'expert',       elo: 1300 },
]

const PLAYER_OPTIONS = [2, 4, 6]

type Court = { id: string; name: string; address: string; city: string }
type Slot  = { id: string; start_time: string; end_time: string; price: number }

export default function CreateSession() {
  const [step, setStep] = useState<'court' | 'slot' | 'details'>('court')

  const [keyword, setKeyword]             = useState('')
  const [courts, setCourts]               = useState<Court[]>([])
  const [searching, setSearching]         = useState(false)
  const [selectedCourt, setSelectedCourt] = useState<Court | null>(null)

  const [slots, setSlots]               = useState<Slot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null)

  const [skillMin, setSkillMin]               = useState('beginner')
  const [skillMax, setSkillMax]               = useState('expert')
  const [maxPlayers, setMaxPlayers]           = useState(4)
  const [requireApproval, setRequireApproval] = useState(false)
  const [submitting, setSubmitting]           = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!keyword.trim()) { setCourts([]); return }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      const { data } = await supabase
        .from('courts')
        .select('id, name, address, city')
        .ilike('name', `%${keyword.trim()}%`)
        .limit(10)
      setCourts(data ?? [])
      setSearching(false)
    }, 400)
  }, [keyword])

  async function selectCourt(court: Court) {
    setSelectedCourt(court)
    setKeyword('')
    setCourts([])
    setStep('slot')
    setLoadingSlots(true)
    const { data } = await supabase
      .from('court_slots')
      .select('id, start_time, end_time, price')
      .eq('court_id', court.id)
      .eq('status', 'available')
      .gte('start_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(20)
    setSlots(data ?? [])
    setLoadingSlots(false)
  }

  function selectSlot(slot: Slot) {
    setSelectedSlot(slot)
    setStep('details')
  }

  async function submit() {
    if (!selectedCourt || !selectedSlot) return
    const minElo = SKILL_LEVELS.find(s => s.value === skillMin)?.elo ?? 800
    const maxElo = SKILL_LEVELS.find(s => s.value === skillMax)?.elo ?? 1300
    if (minElo > maxElo) {
      Alert.alert('Lỗi', 'Trình độ tối thiểu không thể cao hơn tối đa')
      return
    }
    setSubmitting(true)
    const { data: { user } } = await supabase.auth.getUser()

    // 1. Tạo session
    const { data: newSession, error } = await supabase
      .from('sessions')
      .insert({
        host_id: user?.id,
        slot_id: selectedSlot.id,
        elo_min: minElo,
        elo_max: maxElo,
        max_players: maxPlayers,
        status: 'open',
        require_approval: requireApproval,
      })
      .select()
      .single()

    if (error || !newSession) {
      setSubmitting(false)
      Alert.alert('Lỗi', error?.message ?? 'Không thể tạo kèo')
      return
    }

    // 2. Tự động thêm host vào session_players
    await supabase.from('session_players').insert({
      session_id: newSession.id,
      player_id: user?.id,
      status: 'confirmed',
    })

    setSubmitting(false)
    Alert.alert('🎉 Tạo kèo thành công!', 'Kèo của bạn đã được đăng.', [
      { text: 'OK', onPress: () => router.replace('/(tabs)') },
    ])
  }

  function formatSlotTime(start: string, end: string) {
    const s = new Date(start)
    const e = new Date(end)
    const fmt = (d: Date) =>
      `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
    const day = `${s.getDate().toString().padStart(2, '0')}/${(s.getMonth() + 1).toString().padStart(2, '0')}`
    const weekday = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][s.getDay()]
    return `${weekday} ${day} · ${fmt(s)} → ${fmt(e)}`
  }

  // ── STEP 1: Chọn sân ──
  if (step === 'court') return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>← Quay lại</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Tạo kèo mới 🏓</Text>
      <Text style={styles.stepLabel}>Bước 1/3 — Chọn sân</Text>
      <TextInput
        style={styles.searchInput}
        placeholder="🔍 Tìm tên sân..."
        value={keyword}
        onChangeText={setKeyword}
        autoFocus
      />
      {searching && <ActivityIndicator color="#16a34a" style={{ marginTop: 16 }} />}
      {!searching && keyword.length > 0 && courts.length === 0 && (
        <Text style={styles.noResult}>Không tìm thấy sân nào 😕</Text>
      )}
      <FlatList
        data={courts}
        keyExtractor={c => c.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.courtItem} onPress={() => selectCourt(item)}>
            <Text style={styles.courtItemName}>{item.name}</Text>
            <Text style={styles.courtItemAddress}>📍 {item.address} · {item.city}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  )

  // ── STEP 2: Chọn slot ──
  if (step === 'slot') return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => setStep('court')} style={styles.backBtn}>
        <Text style={styles.backText}>← Đổi sân</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Tạo kèo mới 🏓</Text>
      <Text style={styles.stepLabel}>Bước 2/3 — Chọn khung giờ</Text>
      <View style={styles.selectedCard}>
        <Text style={styles.selectedLabel}>Sân đã chọn</Text>
        <Text style={styles.selectedName}>{selectedCourt?.name}</Text>
        <Text style={styles.selectedSub}>📍 {selectedCourt?.address} · {selectedCourt?.city}</Text>
      </View>
      {loadingSlots
        ? <ActivityIndicator color="#16a34a" style={{ marginTop: 24 }} />
        : slots.length === 0
          ? <Text style={styles.noResult}>Không có slot trống cho sân này 😕</Text>
          : (
            <FlatList
              data={slots}
              keyExtractor={s => s.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.slotItem} onPress={() => selectSlot(item)}>
                  <Text style={styles.slotTime}>{formatSlotTime(item.start_time, item.end_time)}</Text>
                  <Text style={styles.slotPrice}>💰 {item.price.toLocaleString('vi-VN')}đ</Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={{ paddingBottom: 32 }}
            />
          )
      }
    </View>
  )

  // ── STEP 3: Chi tiết ──
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 48 }}>
      <TouchableOpacity onPress={() => setStep('slot')} style={styles.backBtn}>
        <Text style={styles.backText}>← Đổi giờ</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Tạo kèo mới 🏓</Text>
      <Text style={styles.stepLabel}>Bước 3/3 — Chi tiết kèo</Text>

      <View style={styles.selectedCard}>
        <Text style={styles.selectedName}>{selectedCourt?.name}</Text>
        <Text style={styles.selectedSub}>🕐 {formatSlotTime(selectedSlot!.start_time, selectedSlot!.end_time)}</Text>
        <Text style={styles.selectedSub}>💰 {selectedSlot?.price.toLocaleString('vi-VN')}đ/người</Text>
      </View>

      <Text style={styles.label}>Trình độ tối thiểu</Text>
      <View style={styles.optionRow}>
        {SKILL_LEVELS.map(s => (
          <TouchableOpacity
            key={s.value}
            style={[styles.optionBtn, skillMin === s.value && styles.optionBtnActive]}
            onPress={() => setSkillMin(s.value)}
          >
            <Text style={[styles.optionText, skillMin === s.value && styles.optionTextActive]}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Trình độ tối đa</Text>
      <View style={styles.optionRow}>
        {SKILL_LEVELS.map(s => (
          <TouchableOpacity
            key={s.value}
            style={[styles.optionBtn, skillMax === s.value && styles.optionBtnActive]}
            onPress={() => setSkillMax(s.value)}
          >
            <Text style={[styles.optionText, skillMax === s.value && styles.optionTextActive]}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Số người chơi</Text>
      <View style={styles.playerRow}>
        {PLAYER_OPTIONS.map(n => (
          <TouchableOpacity
            key={n}
            style={[styles.playerBtn, maxPlayers === n && styles.optionBtnActive]}
            onPress={() => setMaxPlayers(n)}
          >
            <Text style={[styles.playerText, maxPlayers === n && styles.optionTextActive]}>
              👥 {n} người
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Chế độ tham gia</Text>
      <View style={styles.approvalRow}>
        <TouchableOpacity
          style={[styles.approvalBtn, !requireApproval && styles.approvalBtnActive]}
          onPress={() => setRequireApproval(false)}
        >
          <Text style={styles.approvalIcon}>⚡</Text>
          <Text style={[styles.approvalTitle, !requireApproval && styles.approvalTextActive]}>
            Tự động
          </Text>
          <Text style={styles.approvalSub}>Join là vào ngay</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.approvalBtn, requireApproval && styles.approvalBtnActive]}
          onPress={() => setRequireApproval(true)}
        >
          <Text style={styles.approvalIcon}>🔐</Text>
          <Text style={[styles.approvalTitle, requireApproval && styles.approvalTextActive]}>
            Duyệt tay
          </Text>
          <Text style={styles.approvalSub}>Host xét duyệt</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
        onPress={submit}
        disabled={submitting}
      >
        <Text style={styles.submitText}>
          {submitting ? 'Đang tạo kèo...' : 'Tạo kèo 🏓'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 60, paddingHorizontal: 20 },
  backBtn: { marginBottom: 8 },
  backText: { fontSize: 14, color: '#16a34a', fontWeight: '600' },
  title: { fontSize: 26, fontWeight: '700', color: '#111', marginBottom: 4 },
  stepLabel: { fontSize: 13, color: '#888', marginBottom: 24 },
  searchInput: {
    borderWidth: 1.5, borderColor: '#ddd', borderRadius: 14,
    paddingHorizontal: 16, height: 52, fontSize: 16, color: '#333', marginBottom: 12,
  },
  noResult: { fontSize: 14, color: '#888', textAlign: 'center', marginTop: 32 },
  courtItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  courtItemName: { fontSize: 15, fontWeight: '600', color: '#111', marginBottom: 2 },
  courtItemAddress: { fontSize: 13, color: '#888' },
  selectedCard: { backgroundColor: '#f0fdf4', borderRadius: 14, padding: 16, marginBottom: 24 },
  selectedLabel: { fontSize: 12, color: '#16a34a', fontWeight: '600', marginBottom: 4 },
  selectedName: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 4 },
  selectedSub: { fontSize: 13, color: '#555', marginBottom: 2 },
  slotItem: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#f0f0f0',
  },
  slotTime: { fontSize: 15, fontWeight: '600', color: '#111' },
  slotPrice: { fontSize: 14, color: '#16a34a', fontWeight: '600' },
  label: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 10, marginTop: 20 },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionBtn: { borderWidth: 1.5, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  optionBtnActive: { borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
  optionText: { fontSize: 13, color: '#555' },
  optionTextActive: { color: '#16a34a', fontWeight: '600' },
  playerRow: { flexDirection: 'row', gap: 12 },
  playerBtn: { flex: 1, borderWidth: 1.5, borderColor: '#ddd', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  playerText: { fontSize: 14, fontWeight: '600', color: '#555' },
  approvalRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  approvalBtn: {
    flex: 1, borderWidth: 1.5, borderColor: '#e5e7eb',
    borderRadius: 14, padding: 16, alignItems: 'center', gap: 4,
  },
  approvalBtnActive: { borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
  approvalIcon: { fontSize: 24, marginBottom: 4 },
  approvalTitle: { fontSize: 14, fontWeight: '700', color: '#9ca3af' },
  approvalTextActive: { color: '#16a34a' },
  approvalSub: { fontSize: 12, color: '#aaa', textAlign: 'center' },
  submitBtn: {
    backgroundColor: '#16a34a', borderRadius: 14,
    height: 54, alignItems: 'center', justifyContent: 'center', marginTop: 36,
  },
  submitBtnDisabled: { backgroundColor: '#86efac' },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '700' },
})
