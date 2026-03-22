import { supabase } from '@/lib/supabase'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator, FlatList, RefreshControl,
  ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native'

const CITIES = ['Tất cả', 'Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng']

const SKILL_LEVELS = [
  { label: 'Tất cả',         value: 'all' },
  { label: '🌱 Mới bắt đầu', value: 'beginner',    eloMax: 850  },
  { label: '🏃 Cơ bản',      value: 'basic',        eloMax: 950  },
  { label: '⚡ Trung bình',  value: 'intermediate', eloMax: 1100 },
  { label: '🔥 Khá',         value: 'advanced',     eloMax: 1250 },
  { label: '🏆 Giỏi',        value: 'expert',       eloMax: 1400 },
]

const DATE_OPTIONS = [
  { label: 'Tất cả',    value: 'all' },
  { label: 'Hôm nay',   value: 'today' },
  { label: 'Ngày mai',  value: 'tomorrow' },
  { label: '7 ngày tới', value: 'week' },
]

type Session = {
  id: string
  elo_min: number
  elo_max: number
  max_players: number
  status: string
  host: { name: string }
  slot: {
    start_time: string
    end_time: string
    price: number
    court: { name: string; address: string; city: string }
  }
  player_count: number
}

export default function FindSession() {
  const [sessions, setSessions]     = useState<Session[]>([])
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [city, setCity]       = useState('Tất cả')
  const [skill, setSkill]     = useState('all')
  const [date, setDate]       = useState('all')
  const [spotsOnly, setSpotsOnly] = useState(false)

  useEffect(() => { fetchSessions() }, [city, skill, date, spotsOnly])

  async function fetchSessions() {
    setLoading(true)

    let query = supabase
      .from('sessions')
      .select(`
        id, elo_min, elo_max, max_players, status,
        host:host_id ( name ),
        slot:slot_id (
          start_time, end_time, price,
          court:court_id ( name, address, city )
        ),
        session_players ( player_id )
      `)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(50)

    const { data, error } = await query

    if (!error && data) {
      let filtered = data.map((s: any) => ({
        ...s,
        player_count: (s.session_players ?? []).length,
      })) as Session[]

      // Filter city
      if (city !== 'Tất cả') {
        filtered = filtered.filter(s => s.slot?.court?.city === city)
      }

      // Filter skill
      if (skill !== 'all') {
        const skillInfo = SKILL_LEVELS.find(s => s.value === skill)
        if (skillInfo?.eloMax) {
          filtered = filtered.filter(s =>
            s.elo_min <= skillInfo.eloMax! && s.elo_max >= (skillInfo.eloMax! - 200)
          )
        }
      }

      // Filter date
      if (date !== 'all') {
        const now   = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        filtered = filtered.filter(s => {
          const slotDate = new Date(s.slot?.start_time)
          if (date === 'today') {
            return slotDate >= today && slotDate < new Date(today.getTime() + 86400000)
          }
          if (date === 'tomorrow') {
            const tomorrow = new Date(today.getTime() + 86400000)
            return slotDate >= tomorrow && slotDate < new Date(tomorrow.getTime() + 86400000)
          }
          if (date === 'week') {
            return slotDate >= today && slotDate < new Date(today.getTime() + 7 * 86400000)
          }
          return true
        })
      }

      // Filter còn chỗ
      if (spotsOnly) {
        filtered = filtered.filter(s => s.player_count < s.max_players)
      }

      setSessions(filtered)
    }

    setLoading(false)
  }

  async function onRefresh() {
    setRefreshing(true)
    await fetchSessions()
    setRefreshing(false)
  }

  function formatTime(start: string, end: string) {
    const s = new Date(start)
    const e = new Date(end)
    const fmt = (d: Date) =>
      `${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`
    const weekday = ['CN','T2','T3','T4','T5','T6','T7'][s.getDay()]
    const day = `${s.getDate().toString().padStart(2,'0')}/${(s.getMonth()+1).toString().padStart(2,'0')}`
    return `${weekday} ${day} · ${fmt(s)} → ${fmt(e)}`
  }

  function skillLabel(eloMin: number, eloMax: number) {
    if (eloMax <= 850)  return '🌱 Mới bắt đầu'
    if (eloMax <= 950)  return '🏃 Cơ bản'
    if (eloMax <= 1100) return '⚡ Trung bình'
    if (eloMax <= 1250) return '🔥 Khá'
    return '🏆 Giỏi'
  }

  function renderSession({ item }: { item: Session }) {
    const court  = item.slot?.court
    const isFull = item.player_count >= item.max_players

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => router.push({ pathname: '/session/[id]', params: { id: item.id } })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.courtName} numberOfLines={1}>{court?.name ?? '—'}</Text>
          <Text style={styles.cityBadge}>{court?.city ?? ''}</Text>
        </View>
        <Text style={styles.address} numberOfLines={1}>📍 {court?.address ?? '—'}</Text>
        <Text style={styles.time}>🕐 {formatTime(item.slot?.start_time, item.slot?.end_time)}</Text>
        <View style={styles.cardFooter}>
          <Text style={styles.skill}>{skillLabel(item.elo_min, item.elo_max)}</Text>
          <View style={[styles.slotBadge, isFull && styles.slotFull]}>
            <Text style={[styles.slotText, isFull && styles.slotTextFull]}>
              👥 {item.player_count}/{item.max_players} {isFull ? '· Đầy' : '· Còn chỗ'}
            </Text>
          </View>
        </View>
        <View style={styles.cardBottom}>
          <Text style={styles.price}>💰 {item.slot?.price?.toLocaleString('vi-VN')}đ/người</Text>
          <Text style={styles.host}>bởi {item.host?.name ?? '—'}</Text>
        </View>
      </TouchableOpacity>
    )
  }

  const activeFilters = [
    city !== 'Tất cả',
    skill !== 'all',
    date !== 'all',
    spotsOnly,
  ].filter(Boolean).length

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Tìm kèo 🔍</Text>
        {activeFilters > 0 && (
          <TouchableOpacity onPress={() => { setCity('Tất cả'); setSkill('all'); setDate('all'); setSpotsOnly(false) }}>
            <Text style={styles.clearFilter}>Xoá filter ({activeFilters})</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {/* Còn chỗ toggle */}
        <TouchableOpacity
          style={[styles.filterChip, spotsOnly && styles.filterChipActive]}
          onPress={() => setSpotsOnly(!spotsOnly)}
        >
          <Text style={[styles.filterChipText, spotsOnly && styles.filterChipTextActive]}>
            Còn chỗ
          </Text>
        </TouchableOpacity>

        {/* City */}
        {CITIES.map(c => (
          <TouchableOpacity
            key={c}
            style={[styles.filterChip, city === c && styles.filterChipActive]}
            onPress={() => setCity(c)}
          >
            <Text style={[styles.filterChipText, city === c && styles.filterChipTextActive]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Date filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {DATE_OPTIONS.map(d => (
          <TouchableOpacity
            key={d.value}
            style={[styles.filterChip, date === d.value && styles.filterChipActive]}
            onPress={() => setDate(d.value)}
          >
            <Text style={[styles.filterChipText, date === d.value && styles.filterChipTextActive]}>
              {d.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Skill filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={[styles.filterContent, { marginBottom: 8 }]}
      >
        {SKILL_LEVELS.map(s => (
          <TouchableOpacity
            key={s.value}
            style={[styles.filterChip, skill === s.value && styles.filterChipActive]}
            onPress={() => setSkill(s.value)}
          >
            <Text style={[styles.filterChipText, skill === s.value && styles.filterChipTextActive]}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Result count */}
      {!loading && (
        <Text style={styles.resultCount}>
          {sessions.length} kèo {activeFilters > 0 ? 'phù hợp' : 'đang mở'}
        </Text>
      )}

      {/* List */}
      {loading ? (
        <ActivityIndicator color="#16a34a" style={{ marginTop: 40 }} />
      ) : sessions.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>😴</Text>
          <Text style={styles.emptyText}>Không có kèo nào phù hợp</Text>
          <Text style={styles.emptyHint}>Thử đổi filter hoặc tạo kèo mới!</Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={item => item.id}
          renderItem={renderSession}
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16a34a" />
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', paddingTop: 60 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingHorizontal: 20, marginBottom: 16,
  },
  title: { fontSize: 24, fontWeight: '700', color: '#111' },
  clearFilter: { fontSize: 13, color: '#16a34a', fontWeight: '600' },

  filterScroll: { maxHeight: 44 },
  filterContent: { paddingHorizontal: 20, gap: 8, alignItems: 'center' },
  filterChip: {
    borderWidth: 1.5, borderColor: '#ddd', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 6, backgroundColor: '#fff',
  },
  filterChipActive: { borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
  filterChipText: { fontSize: 13, color: '#555', fontWeight: '500' },
  filterChipTextActive: { color: '#16a34a', fontWeight: '700' },

  resultCount: {
    fontSize: 13, color: '#888',
    paddingHorizontal: 20, marginTop: 8, marginBottom: 8,
  },

  card: {
    backgroundColor: '#fff', borderRadius: 16,
    marginHorizontal: 20, marginBottom: 14, padding: 16,
    shadowColor: '#000', shadowOpacity: 0.05,
    shadowRadius: 8, shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 4,
  },
  courtName: { fontSize: 16, fontWeight: '700', color: '#111', flex: 1, marginRight: 8 },
  cityBadge: {
    fontSize: 12, color: '#16a34a', fontWeight: '600',
    backgroundColor: '#f0fdf4', paddingHorizontal: 10,
    paddingVertical: 3, borderRadius: 20,
  },
  address: { fontSize: 13, color: '#666', marginBottom: 6 },
  time: { fontSize: 14, color: '#444', marginBottom: 10 },
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: 10,
  },
  skill: { fontSize: 13, color: '#555' },
  slotBadge: {
    backgroundColor: '#f0fdf4', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  slotFull: { backgroundColor: '#fef2f2' },
  slotText: { fontSize: 13, color: '#16a34a', fontWeight: '600' },
  slotTextFull: { color: '#dc2626' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  price: { fontSize: 13, color: '#888' },
  host: { fontSize: 12, color: '#aaa' },

  empty: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 },
  emptyHint: { fontSize: 14, color: '#888' },
})
