import { supabase } from '@/lib/supabase'
import { insertNotification } from '@/lib/notifications'
import * as Linking from 'expo-linking'
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'

type SessionRecord = {
  id: string
  elo_min: number
  elo_max: number
  max_players: number
  status: string
  require_approval: boolean
  host: { id: string; name: string }
  slot: {
    start_time: string
    end_time: string
    price: number
    court: { name: string; address: string; city: string }
  }
  session_players: { player_id: string; status: string; player: { name: string } }[]
}

type RequestStatus = 'none' | 'pending' | 'approved' | 'rejected'

export default function SessionDetail() {
  const { id, created } = useLocalSearchParams<{ id: string; created?: string }>()
  const [session, setSession] = useState<SessionRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [myId, setMyId] = useState<string | null>(null)
  const [requestStatus, setRequestStatus] = useState<RequestStatus>('none')
  const [alreadyRated, setAlreadyRated] = useState(false)
  const [pendingRequests, setPendingRequests] = useState<
    { id: string; player_id: string; player: { name: string; elo: number; sessions_joined: number; no_show_count: number } }[]
  >([])
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    init()
  }, [id])

  async function init() {
    const { data: { user } } = await supabase.auth.getUser()
    setMyId(user?.id ?? null)
    await fetchSession(user?.id ?? null)
  }

  async function fetchSession(userId?: string | null) {
    setLoading(true)
    const { data, error } = await supabase
      .from('sessions')
      .select(`
        id, elo_min, elo_max, max_players, status, require_approval,
        host:host_id ( id, name ),
        slot:slot_id (
          start_time, end_time, price,
          court:court_id ( name, address, city )
        ),
        session_players (
          player_id, status,
          player:player_id ( name )
        )
      `)
      .eq('id', id)
      .single()

    if (!error && data) {
      setSession(data as any)
      const uid = userId ?? myId
      if (uid) {
        const isEligibleForRating =
          data.status === 'done' &&
          (uid === (data.host as any)?.id || (data.session_players ?? []).some((p: any) => p.player_id === uid))

        const { data: reqData } = await supabase
          .from('session_requests')
          .select('status')
          .eq('session_id', data.id)
          .eq('player_id', uid)
          .maybeSingle()
        setRequestStatus((reqData?.status as RequestStatus) ?? 'none')

        if (isEligibleForRating) {
          const { data: ratingData } = await supabase
            .from('ratings')
            .select('id')
            .eq('session_id', data.id)
            .eq('rater_id', uid)
            .limit(1)

          setAlreadyRated((ratingData?.length ?? 0) > 0)
        } else {
          setAlreadyRated(false)
        }

        if (uid === (data.host as any)?.id) {
          await fetchPendingRequests(data.id)
        }
      } else {
        setAlreadyRated(false)
      }
    }

    setLoading(false)
  }

  async function fetchPendingRequests(sessionId: string) {
    const { data } = await supabase
      .from('session_requests')
      .select(`
        id, player_id,
        player:player_id ( name, elo, sessions_joined, no_show_count )
      `)
      .eq('session_id', sessionId)
      .eq('status', 'pending')

    setPendingRequests((data as any) ?? [])
  }

  async function joinSession() {
    if (!myId) {
      Alert.alert('Cần đăng nhập', 'Bạn cần đăng nhập để tham gia kèo này', [
        { text: 'Huỷ', style: 'cancel' },
        { text: 'Đăng nhập', onPress: () => router.push('/login') },
      ])
      return
    }

    if (!session) return

    // ELO gate
    setJoining(true)
    const { data: myPlayer } = await supabase
      .from('players')
      .select('elo')
      .eq('id', myId)
      .maybeSingle()

    if (myPlayer?.elo != null) {
      if (myPlayer.elo < session.elo_min || myPlayer.elo > session.elo_max) {
        setJoining(false)
        Alert.alert(
          'Không đủ trình độ',
          `Kèo này yêu cầu ELO ${session.elo_min}–${session.elo_max}.\nELO của bạn: ${myPlayer.elo}`,
        )
        return
      }
    }

    // If host requires approval, route through the request flow instead
    if (session.require_approval) {
      setJoining(false)
      await sendRequest()
      return
    }

    const { error } = await supabase.from('session_players').insert({
      session_id: session.id,
      player_id: myId,
      status: 'confirmed',
    })
    setJoining(false)

    if (error) {
      Alert.alert('Lỗi', error.message)
      return
    }

    Alert.alert('Tham gia thành công', 'Bạn đã vào kèo này rồi nhé.')
    await fetchSession(myId)
  }

  async function sendRequest() {
    if (!myId) {
      Alert.alert('Cần đăng nhập', 'Bạn cần đăng nhập để gửi yêu cầu', [
        { text: 'Huỷ', style: 'cancel' },
        { text: 'Đăng nhập', onPress: () => router.push('/login') },
      ])
      return
    }

    if (!session) return

    setRequesting(true)
    const { error } = await supabase.from('session_requests').insert({
      session_id: session.id,
      player_id: myId,
      status: 'pending',
    })
    setRequesting(false)

    if (error) {
      Alert.alert('Lỗi', error.message)
      return
    }

    setRequestStatus('pending')
    Alert.alert('Đã gửi yêu cầu', 'Chờ host duyệt nhé.')

    // Notify host
    const { data: myData } = await supabase
      .from('players')
      .select('name, elo')
      .eq('id', myId)
      .maybeSingle()
    if (myData) {
      const slotTime = new Date(session.slot.start_time)
        .toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      await insertNotification(
        session.host.id,
        'Có người muốn join kèo!',
        `${myData.name} (Elo ${myData.elo}) xin tham gia kèo lúc ${slotTime}`,
        'join_request',
        `/session/${session.id}`,
      )
    }
  }

  async function approveRequest(requestId: string, playerId: string) {
    if (!session) return

    const { error: reqErr } = await supabase
      .from('session_requests')
      .update({ status: 'approved' })
      .eq('id', requestId)
    if (reqErr) {
      console.warn('[approveRequest] update session_requests failed:', reqErr.message)
      Alert.alert('Lỗi', reqErr.message)
      return
    }

    const { error: playerErr } = await supabase.from('session_players').insert({
      session_id: session.id,
      player_id: playerId,
      status: 'confirmed',
    })
    if (playerErr) {
      console.warn('[approveRequest] insert session_players failed:', playerErr.message)
      Alert.alert('Lỗi', playerErr.message)
      return
    }

    // Optimistically remove from pending list immediately
    setPendingRequests((prev) => prev.filter((r) => r.id !== requestId))

    Alert.alert('Đã duyệt', 'Người chơi đã được thêm vào kèo.')

    console.log('[approveRequest] sending notification to player:', playerId)
    const slotTime = new Date(session.slot.start_time)
      .toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    await insertNotification(
      playerId,
      'Được duyệt!',
      `Bạn đã được chấp nhận vào kèo lúc ${slotTime}`,
      'join_approved',
      `/session/${session.id}`,
    )
    console.log('[approveRequest] notification sent')

    await fetchSession(myId)
  }

  async function rejectRequest(requestId: string, playerId: string) {
    if (!session) return

    const { error } = await supabase
      .from('session_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId)
    if (error) {
      console.warn('[rejectRequest] failed:', error.message)
      Alert.alert('Lỗi', error.message)
      return
    }

    // Optimistically remove from pending list immediately
    setPendingRequests((prev) => prev.filter((r) => r.id !== requestId))

    Alert.alert('Đã từ chối.')

    console.log('[rejectRequest] sending notification to player:', playerId)
    await insertNotification(
      playerId,
      'Chưa phù hợp',
      'Host đã từ chối yêu cầu tham gia',
      'join_rejected',
      `/session/${session.id}`,
    )
    console.log('[rejectRequest] notification sent')

    await fetchSession(myId)
  }

  async function leaveSession() {
    if (!myId || !session) return

    Alert.alert('Rời kèo?', 'Bạn chắc muốn rời kèo này không?', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Rời kèo',
        style: 'destructive',
        onPress: async () => {
          setLeaving(true)
          const { error } = await supabase
            .from('session_players')
            .delete()
            .eq('session_id', session.id)
            .eq('player_id', myId)

          if (error) {
            setLeaving(false)
            Alert.alert('Lỗi', error.message)
            return
          }

          setSession(prev =>
            prev
              ? {
                  ...prev,
                  session_players: prev.session_players.filter(p => p.player_id !== myId),
                }
              : null
          )

          await new Promise(resolve => setTimeout(resolve, 500))
          setLeaving(false)
          setRequestStatus('none')
          setRefreshKey(k => k + 1)
          await fetchSession(myId)
        },
      },
    ])
  }

  async function cancelSession() {
    if (!session) return

    const isFull = session.session_players.length >= session.max_players
    const alertTitle = isFull ? 'Kèo đã đủ người' : 'Huỷ kèo?'
    const alertMessage = isFull
      ? 'Kèo đã đủ người chơi, huỷ kèo này sẽ ảnh hưởng đến tỷ lệ huỷ kèo của bạn. Bạn có chắc không?'
      : 'Kèo sẽ bị huỷ và tất cả người chơi sẽ bị xoá. Không thể hoàn tác!'

    Alert.alert(alertTitle, alertMessage, [
      { text: 'Không', style: 'cancel' },
      {
        text: 'Huỷ kèo',
        style: 'destructive',
        onPress: async () => {
          setCancelling(true)

          await supabase.from('session_players').delete().eq('session_id', session.id)
          await supabase.from('session_requests').delete().eq('session_id', session.id)

          const { error } = await supabase
            .from('sessions')
            .update({
              status: 'cancelled',
              was_full_when_cancelled: isFull,
            })
            .eq('id', session.id)

          setCancelling(false)

          if (error) {
            Alert.alert('Lỗi', error.message)
            return
          }

          Alert.alert('Đã huỷ kèo', 'Kèo của bạn đã được huỷ.', [
            { text: 'OK', onPress: () => router.replace('/(tabs)' as any) },
          ])
        },
      },
    ])
  }

  function reliabilityScore(joined: number, noShow: number) {
    if (!joined) return null
    return Math.round(((joined - noShow) / joined) * 100)
  }

  function reliabilityColor(score: number | null) {
    if (score === null) return '#9ca3af'
    if (score >= 90) return '#16a34a'
    if (score >= 70) return '#d97706'
    return '#dc2626'
  }

  function formatTime(start: string, end: string) {
    const s = new Date(start)
    const e = new Date(end)
    const fmt = (d: Date) =>
      `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
    const weekday = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][s.getDay()]
    const day = `${s.getDate().toString().padStart(2, '0')}/${(s.getMonth() + 1).toString().padStart(2, '0')}`
    return `${weekday}, ${day} · ${fmt(s)} → ${fmt(e)}`
  }

  function skillLabel(eloMin: number, eloMax: number) {
    if (eloMax <= 850) return 'Mới bắt đầu'
    if (eloMax <= 950) return 'Cơ bản'
    if (eloMax <= 1100) return 'Trung bình'
    if (eloMax <= 1250) return 'Khá'
    return 'Giỏi'
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#16a34a" />
      </View>
    )
  }

  if (!session) {
    return (
      <View style={styles.center}>
        <Text style={{ color: '#888' }}>Không tìm thấy kèo này</Text>
      </View>
    )
  }

  const players = session.session_players ?? []
  const isHost = myId === (session.host as any)?.id
  const hasJoined = players.some(p => p.player_id === (myId ?? ''))
  const nonHostPlayers = players.filter(p => p.player_id !== (session.host as any)?.id)
  const isFull = players.length >= session.max_players
  const court = session.slot?.court
  const spotsLeft = session.max_players - players.length
  const isDone = session.status === 'done'
  const isCancelled = session.status === 'cancelled'
  const canRateSession = session.status === 'done' && (hasJoined || isHost)

  return (
    <ScrollView
      key={refreshKey}
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 48 }}
    >
      <View style={styles.topRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← Quay lại</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.shareBtn}
          onPress={() => {
            const url = Linking.createURL(`/session/${id}`)
            Share.share({ message: `Tham gia kèo pickleball này nhé! ${url}` })
          }}
        >
          <Text style={styles.shareBtnText}>Chia sẻ 🔗</Text>
        </TouchableOpacity>
      </View>

      {created === '1' && (
        <View style={styles.successBanner}>
          <Text style={styles.successBannerText}>🎉 Kèo đã được đăng! Chia sẻ link để mời người chơi.</Text>
        </View>
      )}

      <Text style={styles.courtName}>{court?.name}</Text>
      <Text style={styles.address}>📍 {court?.address} · {court?.city}</Text>

      {session.require_approval && (
        <View style={styles.approvalBadge}>
          <Text style={styles.approvalBadgeText}>🔐 Kèo duyệt tay</Text>
        </View>
      )}

      <View style={styles.infoRow}>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Thời gian</Text>
          <Text style={styles.infoValue}>{formatTime(session.slot.start_time, session.slot.end_time)}</Text>
        </View>
      </View>

      <View style={styles.infoRow}>
        <View style={[styles.infoCard, { flex: 1 }]}>
          <Text style={styles.infoLabel}>Trình độ</Text>
          <Text style={styles.infoValue}>{skillLabel(session.elo_min, session.elo_max)}</Text>
        </View>
        <View style={[styles.infoCard, { flex: 1 }]}>
          <Text style={styles.infoLabel}>Giá</Text>
          <Text style={styles.infoValue}>💰 {session.slot.price.toLocaleString('vi-VN')}đ</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>
        Người chơi · {players.length}/{session.max_players}
        {session.status === 'open' && spotsLeft > 0 && <Text style={styles.spotsLeft}> · Còn {spotsLeft} chỗ</Text>}
      </Text>

      <TouchableOpacity
        style={styles.playerRow}
        onPress={() =>
          router.push({ pathname: '/player/[id]' as any, params: { id: (session.host as any)?.id } })
        }
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(session.host as any)?.name?.[0]?.toUpperCase() ?? '?'}</Text>
        </View>
        <Text style={styles.playerName}>{(session.host as any)?.name}</Text>
        <View style={styles.hostBadge}>
          <Text style={styles.hostBadgeText}>Host</Text>
        </View>
      </TouchableOpacity>

      {nonHostPlayers.map(p => (
        <TouchableOpacity
          key={p.player_id}
          style={styles.playerRow}
          onPress={() => router.push({ pathname: '/player/[id]' as any, params: { id: p.player_id } })}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(p.player as any)?.name?.[0]?.toUpperCase() ?? '?'}</Text>
          </View>
          <Text style={styles.playerName}>{(p.player as any)?.name ?? '—'}</Text>
        </TouchableOpacity>
      ))}

      {session.status === 'open' && Array.from({ length: Math.max(0, spotsLeft) }).map((_, i) => (
        <View key={i} style={[styles.playerRow, { opacity: 0.35 }]}>
          <View style={[styles.avatar, { backgroundColor: '#f0f0f0' }]}>
            <Text style={styles.avatarText}>?</Text>
          </View>
          <Text style={[styles.playerName, { color: '#bbb' }]}>Chờ người chơi...</Text>
        </View>
      ))}

      {isHost && pendingRequests.length > 0 && (
        <>
          <Text style={[styles.sectionTitle, { marginTop: 32 }]}>
            Yêu cầu tham gia · {pendingRequests.length}
          </Text>
          {pendingRequests.map(req => {
            const p = req.player as any
            const reliability = reliabilityScore(p.sessions_joined ?? 0, p.no_show_count ?? 0)
            const rColor = reliabilityColor(reliability)

            return (
              <View key={req.id} style={styles.requestCard}>
                <TouchableOpacity
                  style={styles.requestLeft}
                  onPress={() => router.push({ pathname: '/player/[id]' as any, params: { id: req.player_id } })}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{p.name?.[0]?.toUpperCase() ?? '?'}</Text>
                  </View>
                  <View>
                    <Text style={styles.requestName}>{p.name}</Text>
                    <Text style={styles.requestMeta}>
                      ELO {p.elo ?? '—'} ·{' '}
                      <Text style={{ color: rColor, fontWeight: '600' }}>
                        {reliability === null ? 'Mới' : `${reliability}% tin cậy`}
                      </Text>
                      {(p.no_show_count ?? 0) > 0 && (
                        <Text style={{ color: '#dc2626' }}> · {p.no_show_count} no-show</Text>
                      )}
                    </Text>
                  </View>
                </TouchableOpacity>
                <View style={styles.requestActions}>
                  <TouchableOpacity style={styles.approveBtn} onPress={() => approveRequest(req.id, req.player_id)}>
                    <Text style={styles.approveBtnText}>✓</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.rejectBtn} onPress={() => rejectRequest(req.id, req.player_id)}>
                    <Text style={styles.rejectBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )
          })}
        </>
      )}

      {canRateSession && alreadyRated ? (
        <View style={styles.doneStateBtn}>
          <Text style={styles.doneStateText}>Bạn đã đánh giá kèo này</Text>
        </View>
      ) : canRateSession ? (
        <TouchableOpacity
          style={styles.rateBtn}
          onPress={() =>
            router.push({
              pathname: '/rate-session/[id]' as any,
              params: { id: session.id },
            })
          }
        >
          <Text style={styles.rateBtnText}>⭐ Đánh giá kèo này</Text>
        </TouchableOpacity>
      ) : isDone ? (
        <View style={styles.fullBtn}>
          <Text style={styles.fullBtnText}>Kèo đã kết thúc</Text>
        </View>
      ) : isCancelled ? (
        <View style={styles.fullBtn}>
          <Text style={styles.fullBtnText}>Kèo đã bị huỷ</Text>
        </View>
      ) : (
        <>
          {!isHost && (
            hasJoined ? (
              <TouchableOpacity style={styles.leaveBtn} onPress={leaveSession} disabled={leaving}>
                <Text style={styles.leaveBtnText}>{leaving ? 'Đang rời...' : 'Rời kèo'}</Text>
              </TouchableOpacity>
            ) : isFull ? (
              <View style={styles.fullBtn}>
                <Text style={styles.fullBtnText}>Kèo đã đầy</Text>
              </View>
            ) : session.require_approval ? (
              requestStatus === 'pending' ? (
                <View style={styles.pendingBtn}>
                  <Text style={styles.pendingBtnText}>Đang chờ host duyệt...</Text>
                </View>
              ) : requestStatus === 'rejected' ? (
                <View style={styles.fullBtn}>
                  <Text style={styles.fullBtnText}>Yêu cầu đã bị từ chối</Text>
                </View>
              ) : (
                <TouchableOpacity style={styles.joinBtn} onPress={sendRequest} disabled={requesting}>
                  <Text style={styles.joinBtnText}>{requesting ? 'Đang gửi...' : 'Gửi yêu cầu tham gia'}</Text>
                </TouchableOpacity>
              )
            ) : (
              <TouchableOpacity style={styles.joinBtn} onPress={joinSession} disabled={joining}>
                <Text style={styles.joinBtnText}>{joining ? 'Đang tham gia...' : 'Tham gia kèo'}</Text>
              </TouchableOpacity>
            )
          )}

          {isHost && (
            <>
              {pendingRequests.length === 0 && (
                <View style={styles.hostNote}>
                  <Text style={styles.hostNoteText}>Bạn là host của kèo này</Text>
                </View>
              )}
              <TouchableOpacity
                style={[styles.cancelBtn, cancelling && styles.cancelBtnDisabled]}
                onPress={cancelSession}
                disabled={cancelling}
              >
                <Text style={styles.cancelBtnText}>
                  {cancelling ? 'Đang huỷ...' : 'Huỷ kèo'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingTop: 60, paddingHorizontal: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backBtn: { },
  backText: { fontSize: 14, color: '#16a34a', fontWeight: '600' },
  courtName: { fontSize: 24, fontWeight: '700', color: '#111', marginBottom: 6 },
  address: { fontSize: 14, color: '#666', marginBottom: 12 },
  approvalBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#fefce8',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 16,
  },
  approvalBadgeText: { fontSize: 13, color: '#92400e', fontWeight: '600' },
  infoRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  infoCard: { backgroundColor: '#f9fafb', borderRadius: 14, padding: 14, flex: 1 },
  infoLabel: { fontSize: 12, color: '#888', marginBottom: 4 },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#111' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginTop: 24, marginBottom: 16 },
  spotsLeft: { color: '#16a34a', fontWeight: '600' },
  playerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#16a34a' },
  playerName: { fontSize: 15, color: '#333', flex: 1 },
  hostBadge: { backgroundColor: '#f0fdf4', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  hostBadgeText: { fontSize: 12, color: '#16a34a', fontWeight: '600' },
  requestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  requestLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  requestName: { fontSize: 15, fontWeight: '600', color: '#111', marginBottom: 2 },
  requestMeta: { fontSize: 13, color: '#888' },
  requestActions: { flexDirection: 'row', gap: 8 },
  approveBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0fdf4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  approveBtnText: { fontSize: 16, color: '#16a34a', fontWeight: '700' },
  rejectBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rejectBtnText: { fontSize: 16, color: '#dc2626', fontWeight: '700' },
  joinBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  joinBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  leaveBtn: {
    borderWidth: 1.5,
    borderColor: '#dc2626',
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  leaveBtnText: { color: '#dc2626', fontSize: 16, fontWeight: '600' },
  rateBtn: {
    backgroundColor: '#fefce8',
    borderWidth: 1.5,
    borderColor: '#fbbf24',
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  rateBtnText: { color: '#92400e', fontSize: 16, fontWeight: '700' },
  doneStateBtn: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#86efac',
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  doneStateText: { color: '#166534', fontSize: 16, fontWeight: '700' },
  fullBtn: {
    backgroundColor: '#f3f4f6',
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  fullBtnText: { color: '#888', fontSize: 16, fontWeight: '600' },
  pendingBtn: {
    backgroundColor: '#fefce8',
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  pendingBtnText: { color: '#92400e', fontSize: 15, fontWeight: '600' },
  hostNote: {
    backgroundColor: '#f0fdf4',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  hostNoteText: { color: '#16a34a', fontSize: 14, fontWeight: '600' },
  cancelBtn: {
    borderWidth: 1.5,
    borderColor: '#dc2626',
    borderRadius: 14,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  cancelBtnDisabled: { borderColor: '#fca5a5', opacity: 0.6 },
  cancelBtnText: { color: '#dc2626', fontSize: 16, fontWeight: '600' },

  topRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  shareBtn:      { borderWidth: 1.5, borderColor: '#16a34a', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  shareBtnText:  { fontSize: 13, color: '#16a34a', fontWeight: '600' },
  successBanner: { backgroundColor: '#f0fdf4', borderRadius: 12, padding: 14, marginBottom: 16 },
  successBannerText: { fontSize: 13, color: '#166534', fontWeight: '600', textAlign: 'center' },
})
