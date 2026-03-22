import { supabase } from '@/lib/supabase'
import { router, useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import {
    ActivityIndicator,
    FlatList,
    RefreshControl,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native'

type MySession = {
  id: string
  status: string
  role: 'host' | 'player'
  start_time: string
  court_name: string
  court_city: string
  player_count: number
  max_players: number
}

export default function MySessions() {
  const [sessions, setSessions] = useState<MySession[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [myId, setMyId] = useState<string | null>(null)

  useFocusEffect(
    useCallback(() => {
      init()
    }, [])
  )

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setMyId(null)
      setSessions([])
      setLoading(false)
      return
    }
    setMyId(user.id)
    await fetchMySessions(user.id)
  }

  async function fetchMySessions(userId: string) {
    setLoading(true)

    // 1. Kèo host
    const { data: hostSessions } = await supabase
      .from('sessions')
      .select(`
        id,
        status,
        max_players,
        slot:slot_id (
          start_time,
          court:court_id ( name, city )
        ),
        session_players ( player_id )
      `)
      .eq('host_id', userId)
      .order('created_at', { ascending: false })

    const hostList: MySession[] = (hostSessions ?? []).map((s: any) => ({
      id: s.id,
      status: s.status,
      role: 'host',
      start_time: s.slot?.start_time,
      court_name: s.slot?.court?.name ?? '',
      court_city: s.slot?.court?.city ?? '',
      player_count: (s.session_players ?? []).length,
      max_players: s.max_players,
    }))

    // 2. Kèo tham gia (session_players)
    const { data: playerSessions } = await supabase
      .from('session_players')
      .select(`
        session:sessions (
          id,
          status,
          max_players,
          slot:slot_id (
            start_time,
            court:court_id ( name, city )
          ),
          session_players ( player_id )
        )
      `)
      .eq('player_id', userId)
      .order('created_at', { ascending: false })

    const joinedList: MySession[] = (playerSessions ?? []).map((row: any) => {
      const s = row.session
      if (!s) return null
      return {
        id: s.id,
        status: s.status,
        role: 'player' as const,
        start_time: s.slot?.start_time,
        court_name: s.slot?.court?.name ?? '',
        court_city: s.slot?.court?.city ?? '',
        player_count: (s.session_players ?? []).length,
        max_players: s.max_players,
      }
    }).filter(Boolean) as MySession[]

    // Gộp & sort theo thời gian gần nhất
    const all = [...hostList, ...joinedList].sort((a, b) =>
      new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
    )

    setSessions(all)
    setLoading(false)
  }

  async function onRefresh() {
    if (!myId) return
    setRefreshing(true)
    await fetchMySessions(myId)
    setRefreshing(false)
  }

  function formatTime(start: string) {
    const s = new Date(start)
    const weekday = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][s.getDay()]
    const day = s.getDate().toString().padStart(2, '0')
    const month = (s.getMonth() + 1).toString().padStart(2, '0')
    const hh = s.getHours().toString().padStart(2, '0')
    const mm = s.getMinutes().toString().padStart(2, '0')
    return `${weekday} ${day}/${month} · ${hh}:${mm}`
  }

  const renderSession = ({ item }: { item: MySession }) => {
    const isOpen = item.status === 'open'
    const isDone = item.status === 'done'
    const isCancelled = item.status === 'cancelled'

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push({ pathname: '/session/[id]' as any, params: { id: item.id } })}
        activeOpacity={0.9}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.courtName} numberOfLines={1}>{item.court_name || 'Kèo Pickleball'}</Text>
          <View style={[
            styles.statusBadge,
            isOpen && styles.statusOpen,
            isDone && styles.statusDone,
            isCancelled && styles.statusCancelled,
          ]}>
            <Text style={[
              styles.statusText,
              isOpen && styles.statusTextOpen,
              isDone && styles.statusTextDone,
              isCancelled && styles.statusTextCancelled,
            ]}>
              {isOpen && 'Đang mở'}
              {isDone && 'Đã xong'}
              {isCancelled && 'Đã huỷ'}
            </Text>
          </View>
        </View>
        <Text style={styles.time}>{formatTime(item.start_time)} · {item.court_city}</Text>
        <View style={styles.footer}>
          <Text style={styles.role}>{item.role === 'host' ? '👑 Host' : '👤 Tham gia'}</Text>
          <Text style={styles.count}>{item.player_count}/{item.max_players} người</Text>
        </View>
      </TouchableOpacity>
    )
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Kèo của tôi ({sessions.length})</Text>

      {sessions.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🏓</Text>
          <Text style={styles.emptyTitle}>Chưa có kèo nào</Text>
          <Text style={styles.emptyText}>Tạo kèo đầu tiên hoặc tham gia kèo bạn bè!</Text>
          <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/create-session' as any)}>
            <Text style={styles.createBtnText}>Tạo kèo mới</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={sessions}
          renderItem={renderSession}
          keyExtractor={item => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16a34a" />
          }
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    paddingTop: 60,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  createBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 14,
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  createBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
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
  statusOpen: { backgroundColor: '#f0fdf4' },
  statusDone: { backgroundColor: '#eff6ff' },
  statusCancelled: { backgroundColor: '#fef2f2' },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextOpen: { color: '#16a34a' },
  statusTextDone: { color: '#2563eb' },
  statusTextCancelled: { color: '#dc2626' },
  time: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  role: {
    fontSize: 13,
    color: '#16a34a',
    fontWeight: '600',
  },
  count: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
})
