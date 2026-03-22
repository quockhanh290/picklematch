import { supabase } from '@/lib/supabase'
import { router, useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

type Session = {
  id: string
  elo_min: number
  elo_max: number
  max_players: number
  status: string
  host_id: string
  host: { name: string }
  slot: {
    start_time: string
    end_time: string
    price: number
    court: { name: string; address: string; city: string }
  }
  player_count: number
}

export default function HomeScreen() {
  const [playerName, setPlayerName] = useState('')
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [tabIndex, setTabIndex] = useState(0) // 0=open, 1=full, 2=done, 3=all

  useFocusEffect(
    useCallback(() => {
      fetchPlayer()
      fetchSessions()
    }, [tabIndex])
  )

  async function fetchPlayer() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('players')
      .select('name')
      .eq('id', user.id)
      .single()

    if (data) setPlayerName(data.name)
  }

  async function fetchSessions() {
    setLoading(true)

    const { data, error } = await supabase
      .from('sessions')
      .select(`
        id, elo_min, elo_max, max_players, status,
        host_id,
        host:host_id ( name ),
        slot:slot_id (
          start_time, end_time, price,
          court:court_id ( name, address, city )
        ),
        session_players ( player_id )
      `)
      .order('created_at', { ascending: false })
      .limit(50)

    if (!error && data) {
      const mapped = data.map((s: any) => ({
        ...s,
        player_count: (s.session_players ?? []).length,
      }))

      let filtered = mapped

      if (tabIndex === 0) {
        filtered = mapped.filter(s => s.status === 'open' && s.player_count < s.max_players)
      } else if (tabIndex === 1) {
        filtered = mapped.filter(s => s.status === 'open' && s.player_count >= s.max_players)
      } else if (tabIndex === 2) {
        filtered = mapped.filter(s => s.status === 'done')
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
      `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
    const day = `${s.getDate().toString().padStart(2, '0')}/${(s.getMonth() + 1).toString().padStart(2, '0')}`
    return `${fmt(s)} → ${fmt(e)} · ${day}`
  }

  function skillLabel(eloMin: number, eloMax: number) {
    if (eloMax <= 850) return '🌱 Mới bắt đầu'
    if (eloMax <= 950) return '🏃 Cơ bản'
    if (eloMax <= 1100) return '⚡ Trung bình'
    if (eloMax <= 1250) return '🔥 Khá'
    return '🏆 Giỏi'
  }

  function sessionStatusConfig(status: string, isFull: boolean) {
    if (status === 'done') {
      return { bg: '#fefce8', text: '#92400e', label: '✅ Đã kết thúc' }
    }

    if (status === 'cancelled') {
      return { bg: '#f3f4f6', text: '#6b7280', label: '❌ Đã huỷ' }
    }

    if (status === 'open' && isFull) {
      return { bg: '#eef2ff', text: '#4338ca', label: '👥 Đã đủ người' }
    }

    return { bg: '#f0fdf4', text: '#16a34a', label: '🟢 Đang mở' }
  }

  function participationConfig(status: string, playerCount: number, maxPlayers: number) {
    const isFull = playerCount >= maxPlayers

    if (status !== 'open') return null

    if (isFull) {
      return {
        bg: '#fef2f2',
        text: '#dc2626',
        label: `👥 ${playerCount}/${maxPlayers} · Đầy`,
      }
    }

    return {
      bg: '#f0fdf4',
      text: '#16a34a',
      label: `👥 ${playerCount}/${maxPlayers} · Còn chỗ`,
    }
  }

  function renderSession({ item }: { item: Session }) {
    const court = (item.slot as any)?.court
    const isFull = item.player_count >= item.max_players
    const statusCfg = sessionStatusConfig(item.status, isFull)
    const participationCfg = participationConfig(item.status, item.player_count, item.max_players)

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.85}
        onPress={() => router.push({ pathname: '/session/[id]', params: { id: item.id } })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.courtName} numberOfLines={1}>
            {court?.name ?? '—'}
          </Text>

          <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
            <Text style={[styles.statusText, { color: statusCfg.text }]}>
              {statusCfg.label}
            </Text>
          </View>
        </View>

        <Text style={styles.address} numberOfLines={1}>
          📍 {court?.address ?? '—'} · {court?.city}
        </Text>

        <Text style={styles.time}>
          🕐 {formatTime(item.slot?.start_time, item.slot?.end_time)}
        </Text>

        <View style={styles.cardFooter}>
          <Text style={styles.skill}>{skillLabel(item.elo_min, item.elo_max)}</Text>

          {participationCfg ? (
            <View style={[styles.slotBadge, { backgroundColor: participationCfg.bg }]}>
              <Text style={[styles.slotText, { color: participationCfg.text }]}>
                {participationCfg.label}
              </Text>
            </View>
          ) : (
            <View style={styles.endedBadge}>
              <Text style={styles.endedText}>
                {item.status === 'done' ? '✅ Đã kết thúc' : '❌ Đã huỷ'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.cardBottom}>
          <Text style={styles.price}>
            💰 {item.slot?.price?.toLocaleString('vi-VN')}đ/người
          </Text>
          <Text style={styles.host}>bởi {(item.host as any)?.name ?? '—'}</Text>
        </View>
      </TouchableOpacity>
    )
  }

  const tabLabels = ['Đang mở 🔥', 'Đầy 👥', 'Done ⭐', 'Tất cả 🏓']
  const tabShortLabels = ['Đang mở', 'Đầy', 'Done', 'Tất cả']

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Xin chào 👋</Text>
          <Text style={styles.name}>{playerName || 'Khách'}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => router.push('/(tabs)/find-session' as any)}
        >
          <Text style={styles.actionIcon}>🔍</Text>
          <Text style={styles.actionText}>Tìm kèo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnPrimary]}
          onPress={() => router.push('/create-session' as any)}
        >
          <Text style={styles.actionIcon}>➕</Text>
          <Text style={[styles.actionText, styles.actionTextPrimary]}>Tạo kèo</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.toggleRow}>
        <Text style={styles.sectionTitle}>{tabLabels[tabIndex]}</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabScroll}
          contentContainerStyle={styles.tabScrollContent}
        >
          {tabShortLabels.map((label, index) => (
            <TouchableOpacity
              key={label}
              style={[styles.tabBtn, tabIndex === index && styles.tabBtnActive]}
              onPress={() => setTabIndex(index)}
            >
              <Text style={[styles.tabText, tabIndex === index && styles.tabTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator color="#16a34a" style={{ marginTop: 40 }} />
      ) : sessions.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>😴</Text>
          <Text style={styles.emptyText}>
            {tabIndex === 0 && 'Chưa có kèo nào đang mở'}
            {tabIndex === 1 && 'Chưa có kèo nào đã đầy'}
            {tabIndex === 2 && 'Chưa có kèo nào đã kết thúc'}
            {tabIndex === 3 && 'Chưa có kèo nào'}
          </Text>
          <Text style={styles.emptyHint}>Thử tạo một kèo mới nhé.</Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={item => item.id}
          renderItem={renderSession}
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#16a34a"
            />
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', paddingTop: 60 },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  greeting: { fontSize: 14, color: '#888' },
  name: { fontSize: 22, fontWeight: '700', color: '#111' },

  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 14,
    paddingVertical: 14,
    backgroundColor: '#fff',
  },
  actionBtnPrimary: { backgroundColor: '#16a34a', borderColor: '#16a34a' },
  actionIcon: { fontSize: 18 },
  actionText: { fontSize: 15, fontWeight: '600', color: '#333' },
  actionTextPrimary: { color: '#fff' },

  toggleRow: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111',
    marginBottom: 10,
  },
  tabScroll: { maxHeight: 40 },
  tabScrollContent: { paddingRight: 20 },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: '#f0f0f0',
  },
  tabBtnActive: { backgroundColor: '#dcfce7' },
  tabText: { fontSize: 13, color: '#666', fontWeight: '600' },
  tabTextActive: { color: '#16a34a' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 20,
    marginBottom: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  courtName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },

  address: { fontSize: 13, color: '#666', marginBottom: 6 },
  time: { fontSize: 14, color: '#444', marginBottom: 10 },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  skill: { fontSize: 13, color: '#555' },

  slotBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  slotText: {
    fontSize: 13,
    fontWeight: '600',
  },

  endedBadge: {
    backgroundColor: '#f9fafb',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  endedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
  },

  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: { fontSize: 13, color: '#888' },
  host: { fontSize: 12, color: '#aaa' },

  empty: { alignItems: 'center', marginTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 4 },
  emptyHint: { fontSize: 14, color: '#888' },
})
