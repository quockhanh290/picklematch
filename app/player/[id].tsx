import { supabase } from '@/lib/supabase'
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native'

const BADGE_META: Record<string, { emoji: string; label: string }> = {
  fair_play: { emoji: '🏅', label: 'Chơi đẹp' },
  on_time:   { emoji: '⚡', label: 'Đúng giờ' },
  friendly:  { emoji: '🤝', label: 'Thân thiện' },
  skilled:   { emoji: '🎯', label: 'Kỹ thuật tốt' },
}

const SKILL_LEVELS = [
  { value: 'beginner',     label: '🌱 Mới bắt đầu' },
  { value: 'basic',        label: '🏃 Cơ bản' },
  { value: 'intermediate', label: '⚡ Trung bình' },
  { value: 'advanced',     label: '🔥 Khá' },
  { value: 'expert',       label: '🏆 Giỏi' },
]

type Player = {
  id: string
  name: string
  city: string
  skill_label: string
  elo: number
  sessions_joined: number
  no_show_count: number
  created_at: string
  favorite_court_ids: string[]
}

type SessionHistory = {
  id: string
  status: string
  is_host: boolean
  slot: {
    start_time: string
    court: { name: string; city: string }
  }
}

type Court = { id: string; name: string; city: string }

type HostStats = {
  total: number
  badCancels: number
}

export default function PlayerProfile() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [player, setPlayer]         = useState<Player | null>(null)
  const [loading, setLoading]       = useState(true)
  const [ratingTags, setRatingTags] = useState<Record<string, number>>({})
  const [history, setHistory]       = useState<SessionHistory[]>([])
  const [favCourts, setFavCourts]   = useState<Court[]>([])
  const [hostStats, setHostStats]   = useState<HostStats>({ total: 0, badCancels: 0 })
  const [isMe, setIsMe]             = useState(false)

  useEffect(() => { fetchAll() }, [id])

  async function fetchAll() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    setIsMe(user?.id === id)

    const { data } = await supabase
      .from('players')
      .select('id, name, city, skill_label, elo, sessions_joined, no_show_count, created_at, favorite_court_ids')
      .eq('id', id)
      .single()

    if (data) {
      setPlayer(data)
      await Promise.all([
        fetchRatingTags(data.id),
        fetchHistory(data.id),
        fetchFavCourts(data.favorite_court_ids ?? []),
        fetchHostStats(data.id),
      ])
    }
    setLoading(false)
  }

  async function fetchRatingTags(playerId: string) {
    const { data } = await supabase
      .from('ratings')
      .select('tags')
      .eq('rated_id', playerId)

    if (data) {
      const counts: Record<string, number> = {}
      data.forEach((r: any) => {
        r.tags?.forEach((tag: string) => {
          counts[tag] = (counts[tag] ?? 0) + 1
        })
      })
      setRatingTags(counts)
    }
  }

  async function fetchHistory(playerId: string) {
    const { data } = await supabase
      .from('session_players')
      .select(`
        session:session_id (
          id, status, host_id,
          slot:slot_id (
            start_time,
            court:court_id ( name, city )
          )
        )
      `)
      .eq('player_id', playerId)
      .order('created_at', { ascending: false })
      .limit(5)

    if (data) {
      setHistory(data.map((d: any) => ({
        id: d.session.id,
        status: d.session.status,
        is_host: d.session.host_id === playerId,
        slot: d.session.slot,
      })))
    }
  }

  async function fetchFavCourts(ids: string[]) {
    if (!ids.length) return
    const { data } = await supabase
      .from('courts')
      .select('id, name, city')
      .in('id', ids)
    setFavCourts(data ?? [])
  }

  async function fetchHostStats(playerId: string) {
    const { data } = await supabase
      .from('sessions')
      .select('status, was_full_when_cancelled')
      .eq('host_id', playerId)

    if (data) {
      const total      = data.length
      const badCancels = data.filter((s: any) =>
        s.status === 'cancelled' && s.was_full_when_cancelled
      ).length
      setHostStats({ total, badCancels })
    }
  }

  function reliabilityScore(joined: number, noShow: number) {
    if (!joined) return null
    return Math.round(((joined - noShow) / joined) * 100)
  }

  function reliabilityStyle(score: number | null) {
    if (score === null) return styles.reliabilityNeutral
    if (score >= 90) return styles.reliabilityHigh
    if (score >= 70) return styles.reliabilityMid
    return styles.reliabilityLow
  }

  function reliabilityColor(score: number | null) {
    if (score === null) return '#6b7280'
    if (score >= 90) return '#16a34a'
    if (score >= 70) return '#d97706'
    return '#dc2626'
  }

  function cancelRateColor(bad: number, total: number) {
    if (total === 0) return '#9ca3af'
    const rate = bad / total
    if (rate === 0) return '#16a34a'
    if (rate <= 0.2) return '#d97706'
    return '#dc2626'
  }

  function skillLabel(value: string) {
    return SKILL_LEVELS.find(s => s.value === value)?.label ?? '⚡ Trung bình'
  }

  function formatTime(start: string) {
    const s = new Date(start)
    const weekday = ['CN','T2','T3','T4','T5','T6','T7'][s.getDay()]
    const day = `${s.getDate().toString().padStart(2,'0')}/${(s.getMonth()+1).toString().padStart(2,'0')}`
    const hh = s.getHours().toString().padStart(2,'0')
    const mm = s.getMinutes().toString().padStart(2,'0')
    return `${weekday} ${day} · ${hh}:${mm}`
  }

  function sessionStatusConfig(status: string) {
    switch (status) {
      case 'open':      return { bg: '#f0fdf4', text: '#16a34a', label: '🟢 Đang mở' }
      case 'cancelled': return { bg: '#fef2f2', text: '#dc2626', label: '❌ Đã huỷ'  }
      default:          return { bg: '#f3f4f6', text: '#888',    label: '✅ Kết thúc' }
    }
  }

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#16a34a" />
    </View>
  )

  if (!player) return (
    <View style={styles.center}>
      <Text style={{ color: '#888' }}>Không tìm thấy người chơi 😕</Text>
    </View>
  )

  const reliability    = reliabilityScore(player.sessions_joined ?? 0, player.no_show_count ?? 0)
  const sortedTags     = Object.entries(ratingTags).sort((a, b) => b[1] - a[1])
  const hostedCount    = history.filter(h => h.is_host).length
  const cancelColor    = cancelRateColor(hostStats.badCancels, hostStats.total)

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 48 }}>

      {/* Back */}
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>← Quay lại</Text>
      </TouchableOpacity>

      {/* Avatar + tên */}
      <View style={styles.heroSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {player.name?.[0]?.toUpperCase() ?? '?'}
          </Text>
        </View>
        <Text style={styles.name}>{player.name}</Text>
        <Text style={styles.city}>📍 {player.city}</Text>
        {isMe && (
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => router.push('/edit-profile' as any)}
          >
            <Text style={styles.editBtnText}>✏️ Chỉnh sửa hồ sơ</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{player.elo ?? '—'}</Text>
          <Text style={styles.statLabel}>ELO</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{player.sessions_joined ?? 0}</Text>
          <Text style={styles.statLabel}>Đã chơi</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{hostedCount}</Text>
          <Text style={styles.statLabel}>Đã host</Text>
        </View>
      </View>

      {/* Trình độ */}
      <View style={styles.skillBanner}>
        <Text style={styles.skillBannerText}>{skillLabel(player.skill_label)}</Text>
        <Text style={styles.skillBannerSub}>ELO {player.elo}</Text>
      </View>

      {/* Reliability + Cancel rate */}
      <View style={styles.metricsRow}>
        {/* Độ tin cậy */}
        <View style={[styles.metricCard, { flex: 1 }]}>
          <Text style={styles.metricTitle}>Độ tin cậy</Text>
          <Text style={styles.metricSub}>
            {player.no_show_count ?? 0} no-show / {player.sessions_joined ?? 0} kèo
          </Text>
          <View style={[styles.metricBadge, reliabilityStyle(reliability)]}>
            <Text style={[styles.metricScore, { color: reliabilityColor(reliability) }]}>
              {reliability === null ? 'Mới' : `${reliability}%`}
            </Text>
          </View>
        </View>

        {/* Tỷ lệ huỷ kèo */}
        <View style={[styles.metricCard, { flex: 1 }]}>
          <Text style={styles.metricTitle}>Tỷ lệ huỷ kèo</Text>
          <Text style={styles.metricSub}>
            {hostStats.badCancels} huỷ xấu / {hostStats.total} kèo host
          </Text>
          <View style={[styles.metricBadge, {
            backgroundColor: hostStats.badCancels === 0 ? '#f0fdf4'
              : hostStats.badCancels / Math.max(hostStats.total, 1) <= 0.2 ? '#fefce8'
              : '#fef2f2'
          }]}>
            <Text style={[styles.metricScore, { color: cancelColor }]}>
              {hostStats.total === 0
                ? 'Chưa host'
                : hostStats.badCancels === 0
                  ? '✅ Tốt'
                  : `${hostStats.badCancels}/${hostStats.total}`
              }
            </Text>
          </View>
        </View>
      </View>

      {/* Sân ưa thích */}
      {favCourts.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Sân hay chơi 🏟</Text>
          <View style={styles.favCourtList}>
            {favCourts.map(court => (
              <View key={court.id} style={styles.favCourtItem}>
                <Text style={styles.favCourtName}>{court.name}</Text>
                <Text style={styles.favCourtCity}>📍 {court.city}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Lịch sử kèo */}
      <Text style={styles.sectionTitle}>Kèo gần đây 🏓</Text>
      {history.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Chưa tham gia kèo nào</Text>
        </View>
      ) : (
        history.map(item => {
          const cfg = sessionStatusConfig(item.status)
          return (
            <TouchableOpacity
              key={item.id}
              style={styles.historyCard}
              onPress={() => router.push({ pathname: '/session/[id]', params: { id: item.id } })}
            >
              <View style={{ flex: 1 }}>
                <View style={styles.historyHeader}>
                  <Text style={styles.historyCourtName}>{item.slot?.court?.name ?? '—'}</Text>
                  {item.is_host && (
                    <View style={styles.hostChip}>
                      <Text style={styles.hostChipText}>Host</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.historyTime}>{formatTime(item.slot?.start_time)}</Text>
                <Text style={styles.historyCity}>📍 {item.slot?.court?.city}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: cfg.bg }]}>
                <Text style={[styles.statusText, { color: cfg.text }]}>{cfg.label}</Text>
              </View>
            </TouchableOpacity>
          )
        })
      )}

      {/* Badges */}
      {sortedTags.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Đánh giá từ cộng đồng ⭐</Text>
          <View style={styles.badgeGrid}>
            {sortedTags.map(([tag, count]) => {
              const meta = BADGE_META[tag]
              if (!meta) return null
              return (
                <View key={tag} style={styles.badgeCard}>
                  <Text style={styles.badgeEmoji}>{meta.emoji}</Text>
                  <Text style={styles.badgeLabel}>{meta.label}</Text>
                  <Text style={styles.badgeCount}>{count} lượt</Text>
                </View>
              )
            })}
          </View>
        </>
      )}

      {sortedTags.length === 0 && (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Chưa có đánh giá nào 🏓</Text>
        </View>
      )}

      <Text style={styles.joinedAt}>
        Tham gia từ {new Date(player.created_at).toLocaleDateString('vi-VN')}
      </Text>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', paddingTop: 60, paddingHorizontal: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backBtn: { marginBottom: 20 },
  backText: { fontSize: 14, color: '#16a34a', fontWeight: '600' },

  heroSection: { alignItems: 'center', marginBottom: 24 },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: '#f0fdf4', justifyContent: 'center',
    alignItems: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 36, fontWeight: '700', color: '#16a34a' },
  name: { fontSize: 24, fontWeight: '700', color: '#111', marginBottom: 4 },
  city: { fontSize: 14, color: '#888', marginBottom: 12 },
  editBtn: {
    borderWidth: 1.5, borderColor: '#16a34a',
    borderRadius: 20, paddingHorizontal: 20, paddingVertical: 6,
  },
  editBtnText: { fontSize: 13, color: '#16a34a', fontWeight: '600' },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14,
    padding: 14, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.04,
    shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  statValue: { fontSize: 15, fontWeight: '700', color: '#111', marginBottom: 4 },
  statLabel: { fontSize: 11, color: '#888' },

  skillBanner: {
    backgroundColor: '#f0fdf4', borderRadius: 14,
    padding: 14, alignItems: 'center', marginBottom: 16,
  },
  skillBannerText: { fontSize: 18, fontWeight: '700', color: '#16a34a', marginBottom: 2 },
  skillBannerSub: { fontSize: 13, color: '#555' },

  // Metrics row
  metricsRow: { flexDirection: 'row', gap: 12, marginBottom: 28 },
  metricCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    shadowColor: '#000', shadowOpacity: 0.04,
    shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  metricTitle: { fontSize: 13, fontWeight: '700', color: '#111', marginBottom: 4 },
  metricSub: { fontSize: 11, color: '#888', marginBottom: 10 },
  metricBadge: { borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start' },
  metricScore: { fontSize: 15, fontWeight: '700' },
  reliabilityHigh:    { backgroundColor: '#f0fdf4' },
  reliabilityMid:     { backgroundColor: '#fefce8' },
  reliabilityLow:     { backgroundColor: '#fef2f2' },
  reliabilityNeutral: { backgroundColor: '#f3f4f6' },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 12 },

  favCourtList: {
    backgroundColor: '#fff', borderRadius: 14, marginBottom: 28, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.04,
    shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  favCourtItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  favCourtName: { fontSize: 14, fontWeight: '600', color: '#111', marginBottom: 2 },
  favCourtCity: { fontSize: 12, color: '#888' },

  historyCard: {
    backgroundColor: '#fff', borderRadius: 14, marginBottom: 10, padding: 14,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.04,
    shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  historyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  historyCourtName: { fontSize: 14, fontWeight: '600', color: '#111' },
  historyTime: { fontSize: 13, color: '#888', marginBottom: 2 },
  historyCity: { fontSize: 12, color: '#aaa' },
  hostChip: { backgroundColor: '#f0fdf4', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  hostChipText: { fontSize: 11, color: '#16a34a', fontWeight: '600' },
  statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, marginLeft: 8 },
  statusText: { fontSize: 12, fontWeight: '600' },

  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 28 },
  badgeCard: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    alignItems: 'center', width: '47%',
    shadowColor: '#000', shadowOpacity: 0.04,
    shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  badgeEmoji: { fontSize: 28, marginBottom: 6 },
  badgeLabel: { fontSize: 14, fontWeight: '600', color: '#111', marginBottom: 2 },
  badgeCount: { fontSize: 12, color: '#888' },

  emptyCard: {
    backgroundColor: '#fff', borderRadius: 14,
    padding: 24, alignItems: 'center', marginBottom: 24,
  },
  emptyText: { fontSize: 14, color: '#aaa' },
  joinedAt: { fontSize: 13, color: '#bbb', textAlign: 'center', marginTop: 8 },
})
