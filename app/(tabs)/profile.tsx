import { getSkillLevelFromPlayer } from '@/lib/skillAssessment'
import { supabase } from '@/lib/supabase'
import { router, useFocusEffect } from 'expo-router'
import { useCallback, useState } from 'react'
import {
  ActivityIndicator, Alert, ScrollView,
  StyleSheet, Text, TouchableOpacity, View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

type Player = {
  id: string
  name: string
  phone: string
  city: string
  skill_label: string
  elo: number
  current_elo?: number | null
  self_assessed_level?: string | null
  is_provisional?: boolean | null
  placement_matches_played?: number | null
  sessions_joined: number
  no_show_count: number
  created_at: string
}

type SessionHistory = {
  id: string
  status: string
  is_host: boolean
  slot: {
    start_time: string
    end_time: string
    court: { name: string; city: string }
  }
}

export default function ProfileScreen() {
  const [checking, setChecking] = useState(true)
  const [loggedIn, setLoggedIn] = useState(false)
  const [player, setPlayer]     = useState<Player | null>(null)
  const [history, setHistory]   = useState<SessionHistory[]>([])
  const [loading, setLoading]   = useState(false)

  const fetchPlayer = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('players').select('*').eq('id', userId).single()
    if (data) setPlayer(data)
  }, [])

  const fetchHistory = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('session_players')
      .select(`
        status,
        session:session_id (
          id, status, host_id,
          slot:slot_id (
            start_time, end_time,
            court:court_id ( name, city )
          )
        )
      `)
      .eq('player_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (data) {
      setHistory(data.map((d: any) => ({
        id: d.session.id,
        status: d.session.status,
        is_host: d.session.host_id === userId,
        slot: d.session.slot,
      })))
    }
  }, [])

  const init = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoggedIn(false)
      setChecking(false)
      return
    }
    setLoggedIn(true)
    setLoading(true)
    await Promise.all([fetchPlayer(user.id), fetchHistory(user.id)])
    setLoading(false)
    setChecking(false)
  }, [fetchHistory, fetchPlayer])

  useFocusEffect(
    useCallback(() => {
      init()
    }, [init])
  )

  async function logout() {
    Alert.alert('Đăng xuất?', 'Bạn chắc muốn đăng xuất không?', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Đăng xuất', style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut()
          setLoggedIn(false)
          setPlayer(null)
          setHistory([])
          router.replace('/(tabs)')
        }
      }
    ])
  }

  function formatTime(start: string) {
    const s = new Date(start)
    const weekday = ['CN','T2','T3','T4','T5','T6','T7'][s.getDay()]
    const day = `${s.getDate().toString().padStart(2,'0')}/${(s.getMonth()+1).toString().padStart(2,'0')}`
    const hh = s.getHours().toString().padStart(2,'0')
    const mm = s.getMinutes().toString().padStart(2,'0')
    return `${weekday} ${day} · ${hh}:${mm}`
  }

  function reliabilityScore() {
    if (!player || !player.sessions_joined) return null
    return Math.round(((player.sessions_joined - player.no_show_count) / player.sessions_joined) * 100)
  }

  function reliabilityColor(score: number | null) {
    if (score === null) return '#9ca3af'
    if (score >= 90) return '#16a34a'
    if (score >= 70) return '#d97706'
    return '#dc2626'
  }

  function sessionStatusConfig(status: string) {
    switch (status) {
      case 'open':      return { bg: '#f0fdf4', text: '#16a34a', label: '🟢 Đang mở' }
      case 'cancelled': return { bg: '#fef2f2', text: '#dc2626', label: '❌ Đã huỷ'  }
      default:          return { bg: '#f3f4f6', text: '#888',    label: '✅ Kết thúc' }
    }
  }

  if (checking) return (
    <SafeAreaView style={styles.center} edges={['top']}>
      <ActivityIndicator size="large" color="#16a34a" />
    </SafeAreaView>
  )

  if (!loggedIn) return (
    <SafeAreaView style={styles.center} edges={['top']}>
      <Text style={styles.guestEmoji}>🏓</Text>
      <Text style={styles.guestTitle}>Đăng nhập để xem hồ sơ</Text>
      <Text style={styles.guestSubtitle}>
        Quản lý thông tin cá nhân{'\n'}và lịch sử kèo của bạn
      </Text>
      <TouchableOpacity style={styles.loginBtn} onPress={() => router.push('/login' as any)}>
        <Text style={styles.loginBtnText}>Đăng nhập</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/(tabs)')}>
        <Text style={styles.backBtnText}>← Về trang chủ</Text>
      </TouchableOpacity>
    </SafeAreaView>
  )

  if (loading) return (
    <SafeAreaView style={styles.center} edges={['top']}>
      <ActivityIndicator size="large" color="#16a34a" />
    </SafeAreaView>
  )

  if (!player) return (
    <SafeAreaView style={styles.center} edges={['top']}>
      <Text style={{ color: '#888' }}>Không tìm thấy hồ sơ 😕</Text>
    </SafeAreaView>
  )

  const skill = getSkillLevelFromPlayer(player)
  const reliability = reliabilityScore()
  const rColor      = reliabilityColor(reliability)
  const hostedCount = history.filter(h => h.is_host).length
  const placementPlayed = player.placement_matches_played ?? 0
  const placementLeft = Math.max(0, 5 - placementPlayed)

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
    <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>

      {__DEV__ && (
        <TouchableOpacity
          onPress={() => supabase.auth.signOut()}
          style={{ position: 'absolute', top: 50, right: 16, zIndex: 999 }}
        >
          <Text style={{ color: 'red', fontSize: 12 }}>DEV: Logout</Text>
        </TouchableOpacity>
      )}

      {/* Avatar + tên */}
      <View style={styles.heroSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{player.name?.[0]?.toUpperCase() ?? '?'}</Text>
        </View>
        <Text style={styles.name}>{player.name}</Text>
        <Text style={styles.city}>📍 {player.city}</Text>

        {/* ── MỚI: Nút edit ── */}
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => router.push('/edit-profile' as any)}
        >
          <Text style={styles.editBtnText}>✏️ Chỉnh sửa hồ sơ</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{player.elo}</Text>
          <Text style={styles.statLabel}>ELO</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{history.length}</Text>
          <Text style={styles.statLabel}>Đã chơi</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{hostedCount}</Text>
          <Text style={styles.statLabel}>Đã host</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: rColor }]}>
            {reliability === null ? 'Mới' : `${reliability}%`}
          </Text>
          <Text style={styles.statLabel}>Tin cậy</Text>
        </View>
      </View>

      {/* Trình độ */}
      <View style={styles.skillBanner}>
        <Text style={styles.skillBannerText}>{skill?.title ?? 'Chiến thần cọ xát'}</Text>
        <Text style={styles.skillBannerSub}>
          Elo {player.current_elo ?? player.elo} · {skill?.subtitle ?? 'Lower Intermediate'}
        </Text>
      </View>

      {player.is_provisional && (
        <View style={styles.provisionalCard}>
          <Text style={styles.provisionalEyebrow}>Placement Mode</Text>
          <Text style={styles.provisionalTitle}>Tài khoản của bạn đang ở giai đoạn provisional</Text>
          <Text style={styles.provisionalText}>
            Đã chơi {placementPlayed}/5 trận placement. Còn {placementLeft} trận để hệ thống ổn định Elo tốt hơn.
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.min(100, (placementPlayed / 5) * 100)}%` }]} />
          </View>
        </View>
      )}

      {/* Thông tin */}
      <Text style={styles.sectionTitle}>Thông tin</Text>
      <View style={styles.infoBox}>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Số điện thoại</Text>
          <Text style={styles.infoValue}>{player.phone}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Thành phố</Text>
          <Text style={styles.infoValue}>{player.city}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>No-show</Text>
          <Text style={[styles.infoValue, player.no_show_count > 0 && { color: '#dc2626' }]}>
            {player.no_show_count > 0 ? `${player.no_show_count} lần ⚠️` : '0 lần ✅'}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Tham gia từ</Text>
          <Text style={styles.infoValue}>
            {new Date(player.created_at).toLocaleDateString('vi-VN')}
          </Text>
        </View>
      </View>

      {/* Lịch sử kèo */}
      <Text style={styles.sectionTitle}>Lịch sử kèo</Text>
      {history.length === 0 ? (
        <View style={styles.emptyHistory}>
          <Text style={styles.emptyText}>Chưa tham gia kèo nào 🏓</Text>
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
                <View style={styles.historyCardHeader}>
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

      {/* Đăng xuất */}
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </TouchableOpacity>

    </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  center: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: '#fff', padding: 32,
  },

  // Guest
  guestEmoji: { fontSize: 56, marginBottom: 16 },
  guestTitle: { fontSize: 22, fontWeight: '700', color: '#111', marginBottom: 8, textAlign: 'center' },
  guestSubtitle: { fontSize: 14, color: '#888', marginBottom: 32, textAlign: 'center', lineHeight: 22 },
  loginBtn: {
    backgroundColor: '#16a34a', borderRadius: 14,
    paddingHorizontal: 48, paddingVertical: 14, marginBottom: 16,
  },
  loginBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  backBtn: { marginTop: 4 },
  backBtnText: { fontSize: 14, color: '#888' },

  // Hero
  heroSection: { alignItems: 'center', paddingHorizontal: 20, marginBottom: 24 },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#f0fdf4', justifyContent: 'center',
    alignItems: 'center', marginBottom: 12,
  },
  avatarText: { fontSize: 32, fontWeight: '700', color: '#16a34a' },
  name: { fontSize: 24, fontWeight: '700', color: '#111', marginBottom: 4 },
  city: { fontSize: 14, color: '#888', marginBottom: 12 },

  // ── MỚI ──
  editBtn: {
    borderWidth: 1.5, borderColor: '#16a34a',
    borderRadius: 20, paddingHorizontal: 20, paddingVertical: 6,
  },
  editBtnText: { fontSize: 13, color: '#16a34a', fontWeight: '600' },

  // Stats
  statsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 20, marginBottom: 16 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 14,
    padding: 12, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.04,
    shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  statValue: { fontSize: 15, fontWeight: '700', color: '#111', marginBottom: 4 },
  statLabel: { fontSize: 10, color: '#888' },

  // Skill banner
  skillBanner: {
    backgroundColor: '#f0fdf4', borderRadius: 14, marginHorizontal: 20,
    padding: 14, alignItems: 'center', marginBottom: 24,
  },
  skillBannerText: { fontSize: 18, fontWeight: '700', color: '#16a34a', marginBottom: 2 },
  skillBannerSub: { fontSize: 13, color: '#555' },
  provisionalCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    backgroundColor: '#fffbeb',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  provisionalEyebrow: {
    alignSelf: 'flex-start',
    backgroundColor: '#fef3c7',
    color: '#92400e',
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    marginBottom: 10,
  },
  provisionalTitle: { fontSize: 15, fontWeight: '700', color: '#78350f', marginBottom: 6 },
  provisionalText: { fontSize: 13, color: '#92400e', lineHeight: 19, marginBottom: 12 },
  progressTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: '#fde68a',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: '#d97706',
  },

  sectionTitle: {
    fontSize: 16, fontWeight: '700', color: '#111',
    paddingHorizontal: 20, marginBottom: 12,
  },

  // Info
  infoBox: {
    backgroundColor: '#fff', borderRadius: 16,
    marginHorizontal: 20, marginBottom: 28, paddingHorizontal: 16,
    shadowColor: '#000', shadowOpacity: 0.04,
    shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 14,
  },
  infoLabel: { fontSize: 14, color: '#888' },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#111' },
  divider: { height: 1, backgroundColor: '#f0f0f0' },

  // History
  emptyHistory: {
    alignItems: 'center', paddingVertical: 32,
    marginHorizontal: 20, backgroundColor: '#fff',
    borderRadius: 16, marginBottom: 24,
  },
  emptyText: { fontSize: 14, color: '#aaa' },
  historyCard: {
    backgroundColor: '#fff', borderRadius: 14,
    marginHorizontal: 20, marginBottom: 10,
    padding: 14, flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.04,
    shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  historyCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  historyCourtName: { fontSize: 14, fontWeight: '600', color: '#111' },
  historyTime: { fontSize: 13, color: '#888', marginBottom: 2 },
  historyCity: { fontSize: 12, color: '#aaa' },
  hostChip: {
    backgroundColor: '#f0fdf4', borderRadius: 20,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  hostChipText: { fontSize: 11, color: '#16a34a', fontWeight: '600' },
  statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5, marginLeft: 8 },
  statusText: { fontSize: 12, fontWeight: '600' },

  // Logout
  logoutBtn: {
    marginHorizontal: 20, marginTop: 12,
    borderWidth: 1.5, borderColor: '#fca5a5',
    borderRadius: 14, height: 52,
    alignItems: 'center', justifyContent: 'center',
  },
  logoutText: { fontSize: 15, fontWeight: '600', color: '#dc2626' },
})
