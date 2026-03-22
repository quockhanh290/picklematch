import { supabase } from '@/lib/supabase'
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import {
    ActivityIndicator, Alert, ScrollView,
    StyleSheet, Text, TouchableOpacity, View,
} from 'react-native'

const PLAYER_TAGS = [
  { value: 'fair_play', label: '🏅 Chơi đẹp' },
  { value: 'on_time',   label: '⚡ Đúng giờ' },
  { value: 'friendly',  label: '🤝 Thân thiện' },
  { value: 'skilled',   label: '🎯 Kỹ thuật tốt' },
]

const HOST_TAGS = [
  { value: 'good_description', label: '📋 Đúng mô tả kèo' },
  { value: 'well_organized',   label: '🗂 Tổ chức tốt' },
]

type PlayerInSession = {
  player_id: string
  name: string
  is_host: boolean
}

type RatingEntry = {
  tags: string[]
  no_show: boolean
}

export default function RateSession() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [myId, setMyId]         = useState<string | null>(null)
  const [isHost, setIsHost]     = useState(false)
  const [players, setPlayers]   = useState<PlayerInSession[]>([])
  const [sessionName, setSessionName] = useState('')
  const [ratings, setRatings]   = useState<Record<string, RatingEntry>>({})
  const [alreadyRated, setAlreadyRated] = useState(false)

  useEffect(() => { init() }, [id])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/login' as any); return }
    setMyId(user.id)

    // Fetch session info
    const { data: session } = await supabase
      .from('sessions')
      .select(`
        id, status, host_id,
        slot:slot_id (
          court:court_id ( name )
        ),
        session_players (
          player_id,
          player:player_id ( name )
        )
      `)
      .eq('id', id)
      .single()

    if (!session) { setLoading(false); return }

    // Chỉ cho rate kèo done
    if (session.status !== 'done') {
      Alert.alert('Kèo chưa kết thúc', 'Chỉ có thể đánh giá sau khi kèo đã kết thúc.')
      router.back()
      return
    }

    // Check đã rate chưa
    const { data: existing } = await supabase
      .from('ratings')
      .select('id')
      .eq('session_id', id)
      .eq('rater_id', user.id)
      .limit(1)

    if (existing && existing.length > 0) {
      setAlreadyRated(true)
      setLoading(false)
      return
    }

    const hostId = (session as any).host_id
    setIsHost(user.id === hostId)
    setSessionName((session as any).slot?.court?.name ?? 'Kèo')

    // Danh sách người cần rate (trừ mình)
    const others = (session as any).session_players
      .filter((p: any) => p.player_id !== user.id)
      .map((p: any) => ({
        player_id: p.player_id,
        name: (p.player as any)?.name ?? '—',
        is_host: p.player_id === hostId,
      }))

    setPlayers(others)

    // Init rating entries
    const init: Record<string, RatingEntry> = {}
    others.forEach((p: PlayerInSession) => {
      init[p.player_id] = { tags: [], no_show: false }
    })
    setRatings(init)
    setLoading(false)
  }

  function toggleTag(playerId: string, tag: string) {
    setRatings(prev => {
      const current = prev[playerId]?.tags ?? []
      const tags = current.includes(tag)
        ? current.filter(t => t !== tag)
        : [...current, tag]
      return { ...prev, [playerId]: { ...prev[playerId], tags } }
    })
  }

  function toggleNoShow(playerId: string) {
    setRatings(prev => ({
      ...prev,
      [playerId]: {
        tags: [],  // clear tags nếu báo no-show
        no_show: !prev[playerId]?.no_show,
      }
    }))
  }

  async function submit() {
    if (!myId) return
    setSaving(true)

    const inserts = Object.entries(ratings).map(([playerId, entry]) => ({
      session_id: id,
      rater_id:   myId,
      rated_id:   playerId,
      tags:       entry.no_show ? [] : entry.tags,
      no_show:    entry.no_show,
    }))

    // Insert ratings
    const { error: ratingError } = await supabase
      .from('ratings')
      .insert(inserts)

    if (ratingError) {
      setSaving(false)
      Alert.alert('Lỗi', ratingError.message)
      return
    }

    // Cập nhật no_show_count cho người bị báo
    const noShows = Object.entries(ratings)
      .filter(([, entry]) => entry.no_show)
      .map(([playerId]) => playerId)

    for (const playerId of noShows) {
      await supabase.rpc('increment_no_show', { player_id: playerId })
    }

    setSaving(false)
    Alert.alert('✅ Đã gửi đánh giá!', 'Cảm ơn bạn đã đánh giá.', [
      { text: 'OK', onPress: () => router.replace('/(tabs)' as any) }
    ])
  }

  if (loading) return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#16a34a" />
    </View>
  )

  if (alreadyRated) return (
    <View style={styles.center}>
      <Text style={styles.doneEmoji}>✅</Text>
      <Text style={styles.doneTitle}>Bạn đã đánh giá rồi!</Text>
      <Text style={styles.doneSub}>Cảm ơn bạn đã đóng góp cho cộng đồng.</Text>
      <TouchableOpacity style={styles.backHomeBtn} onPress={() => router.replace('/(tabs)' as any)}>
        <Text style={styles.backHomeBtnText}>Về trang chủ</Text>
      </TouchableOpacity>
    </View>
  )

  if (players.length === 0) return (
    <View style={styles.center}>
      <Text style={styles.doneEmoji}>🏓</Text>
      <Text style={styles.doneTitle}>Không có ai để đánh giá</Text>
      <TouchableOpacity style={styles.backHomeBtn} onPress={() => router.replace('/(tabs)' as any)}>
        <Text style={styles.backHomeBtnText}>Về trang chủ</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 48 }}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>← Quay lại</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Đánh giá kèo 🏓</Text>
      <Text style={styles.subtitle}>{sessionName}</Text>

      {players.map(player => {
        const entry    = ratings[player.player_id] ?? { tags: [], no_show: false }
        const availableTags = [
          ...PLAYER_TAGS,
          ...(player.is_host ? HOST_TAGS : []),
        ]

        return (
          <View key={player.player_id} style={styles.playerCard}>
            {/* Player header */}
            <View style={styles.playerHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{player.name?.[0]?.toUpperCase() ?? '?'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.playerName}>{player.name}</Text>
                {player.is_host && (
                  <View style={styles.hostChip}>
                    <Text style={styles.hostChipText}>Host</Text>
                  </View>
                )}
              </View>

              {/* No-show toggle */}
              <TouchableOpacity
                style={[styles.noShowBtn, entry.no_show && styles.noShowBtnActive]}
                onPress={() => toggleNoShow(player.player_id)}
              >
                <Text style={[styles.noShowText, entry.no_show && styles.noShowTextActive]}>
                  {entry.no_show ? '⚠️ No-show' : 'Báo no-show'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Tags */}
            {!entry.no_show && (
              <>
                <Text style={styles.tagHint}>Chọn tags phù hợp (có thể bỏ qua)</Text>
                <View style={styles.tagRow}>
                  {availableTags.map(tag => {
                    const active = entry.tags.includes(tag.value)
                    return (
                      <TouchableOpacity
                        key={tag.value}
                        style={[styles.tag, active && styles.tagActive]}
                        onPress={() => toggleTag(player.player_id, tag.value)}
                      >
                        <Text style={[styles.tagText, active && styles.tagTextActive]}>
                          {tag.label}
                        </Text>
                      </TouchableOpacity>
                    )
                  })}
                </View>
              </>
            )}
          </View>
        )
      })}

      <TouchableOpacity
        style={[styles.submitBtn, saving && styles.submitBtnDisabled]}
        onPress={submit}
        disabled={saving}
      >
        <Text style={styles.submitBtnText}>
          {saving ? 'Đang gửi...' : 'Gửi đánh giá ✅'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb', paddingTop: 60, paddingHorizontal: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },

  backBtn: { marginBottom: 8 },
  backText: { fontSize: 14, color: '#16a34a', fontWeight: '600' },
  title: { fontSize: 26, fontWeight: '700', color: '#111', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 28 },

  playerCard: {
    backgroundColor: '#fff', borderRadius: 16,
    padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.04,
    shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  playerHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#f0fdf4', justifyContent: 'center',
    alignItems: 'center', marginRight: 12,
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#16a34a' },
  playerName: { fontSize: 16, fontWeight: '600', color: '#111', marginBottom: 4 },
  hostChip: {
    alignSelf: 'flex-start', backgroundColor: '#f0fdf4',
    borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2,
  },
  hostChipText: { fontSize: 11, color: '#16a34a', fontWeight: '600' },

  noShowBtn: {
    borderWidth: 1.5, borderColor: '#ddd', borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  noShowBtnActive: { borderColor: '#dc2626', backgroundColor: '#fef2f2' },
  noShowText: { fontSize: 12, color: '#888', fontWeight: '600' },
  noShowTextActive: { color: '#dc2626' },

  tagHint: { fontSize: 12, color: '#aaa', marginBottom: 10 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: {
    borderWidth: 1.5, borderColor: '#ddd', borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 7, backgroundColor: '#fff',
  },
  tagActive: { borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
  tagText: { fontSize: 13, color: '#555' },
  tagTextActive: { color: '#16a34a', fontWeight: '600' },

  submitBtn: {
    backgroundColor: '#16a34a', borderRadius: 14,
    height: 54, alignItems: 'center', justifyContent: 'center', marginTop: 12,
  },
  submitBtnDisabled: { backgroundColor: '#86efac' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  doneEmoji: { fontSize: 52, marginBottom: 16 },
  doneTitle: { fontSize: 20, fontWeight: '700', color: '#111', marginBottom: 8 },
  doneSub: { fontSize: 14, color: '#888', textAlign: 'center', marginBottom: 32 },
  backHomeBtn: {
    backgroundColor: '#16a34a', borderRadius: 14,
    paddingHorizontal: 40, paddingVertical: 14,
  },
  backHomeBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
})
