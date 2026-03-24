import DateTimePicker, { DateTimePickerAndroid, type DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { HostRequestReview } from '@/components/session/HostRequestReview'
import { JoinRequestModal } from '@/components/session/JoinRequestModal'
import { SmartJoinButton } from '@/components/session/SmartJoinButton'
import { getMatchStatus } from '@/lib/matchmaking'
import { getSkillLevelFromEloRange, getSkillScoreFromEloRange, getSkillScoreFromPlayer } from '@/lib/skillAssessment'
import { supabase } from '@/lib/supabase'
import { insertNotification } from '@/lib/notifications'
import * as Linking from 'expo-linking'
import { router, useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

type SessionRecord = {
  id: string
  elo_min: number
  elo_max: number
  max_players: number
  status: string
  require_approval: boolean
  court_booking_status: 'confirmed' | 'unconfirmed'
  booking_reference: string | null
  booking_name: string | null
  booking_phone: string | null
  booking_notes: string | null
  booking_confirmed_at: string | null
  host: { id: string; name: string; auto_accept?: boolean; is_provisional?: boolean; placement_matches_played?: number }
  slot: {
    id?: string
    start_time: string
    end_time: string
    price: number
    court: { name: string; address: string; city: string; booking_url?: string | null; google_maps_url?: string | null }
  }
  session_players: { player_id: string; status: string; player: { name: string } }[]
}

type RequestStatus = 'none' | 'pending' | 'accepted' | 'rejected'
type JoinRequestRecord = {
  id: string
  player_id: string
  status: RequestStatus
  intro_note?: string | null
  host_response_template?: string | null
  player: {
    name: string
    elo?: number | null
    current_elo?: number | null
    self_assessed_level?: string | null
    skill_label?: string | null
    sessions_joined?: number | null
    no_show_count?: number | null
  }
}
type MyPlayerRecord = {
  id: string
  name: string
  elo: number
  current_elo?: number | null
  self_assessed_level?: string | null
  skill_label?: string | null
}

export default function SessionDetail() {
  const { id, created } = useLocalSearchParams<{ id: string; created?: string }>()
  const [session, setSession] = useState<SessionRecord | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [myId, setMyId] = useState<string | null>(null)
  const [myPlayer, setMyPlayer] = useState<MyPlayerRecord | null>(null)
  const [requestStatus, setRequestStatus] = useState<RequestStatus>('none')
  const [myHostTemplate, setMyHostTemplate] = useState<string | null>(null)
  const [alreadyRated, setAlreadyRated] = useState(false)
  const [bookingReference, setBookingReference] = useState('')
  const [bookingName, setBookingName] = useState('')
  const [bookingPhone, setBookingPhone] = useState('')
  const [bookingNotes, setBookingNotes] = useState('')
  const [savingBooking, setSavingBooking] = useState(false)
  const [isEditingSession, setIsEditingSession] = useState(false)
  const [savingSessionEdit, setSavingSessionEdit] = useState(false)
  const [editStartTime, setEditStartTime] = useState('')
  const [editEndTime, setEditEndTime] = useState('')
  const [editMaxPlayers, setEditMaxPlayers] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [editRequireApproval, setEditRequireApproval] = useState(false)
  const [showEditStartPicker, setShowEditStartPicker] = useState(false)
  const [showEditEndPicker, setShowEditEndPicker] = useState(false)
  const [pendingRequests, setPendingRequests] = useState<JoinRequestRecord[]>([])
  const [joinModalVisible, setJoinModalVisible] = useState(false)
  const [introNote, setIntroNote] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  const fetchMyPlayer = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('players')
      .select('id, name, elo, current_elo, self_assessed_level, skill_label')
      .eq('id', userId)
      .maybeSingle()

    setMyPlayer((data as MyPlayerRecord | null) ?? null)
  }, [])

  const fetchSession = useCallback(async (userId?: string | null) => {
    setLoading(true)
    const { data, error } = await supabase
      .from('sessions')
      .select(`
        id, elo_min, elo_max, max_players, status, require_approval,
        court_booking_status, booking_reference, booking_name, booking_phone, booking_notes, booking_confirmed_at,
        host:host_id ( id, name, auto_accept, is_provisional, placement_matches_played ),
        slot:slot_id (
          id, start_time, end_time, price,
          court:court_id ( name, address, city, booking_url, google_maps_url )
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
      setBookingReference((data as any).booking_reference ?? '')
      setBookingName((data as any).booking_name ?? '')
      setBookingPhone((data as any).booking_phone ?? '')
      setBookingNotes((data as any).booking_notes ?? '')
      setEditStartTime(formatClockInput((data as any).slot?.start_time))
      setEditEndTime(formatClockInput((data as any).slot?.end_time))
      setEditMaxPlayers(String((data as any).max_players ?? ''))
      setEditPrice(String((data as any).slot?.price ?? ''))
      setEditRequireApproval(Boolean((data as any).require_approval))
      const uid = userId ?? myId
      if (uid) {
        const isEligibleForRating =
          data.status === 'done' &&
          (uid === (data.host as any)?.id || (data.session_players ?? []).some((p: any) => p.player_id === uid))

        const { data: reqData } = await supabase
          .from('join_requests')
          .select('status, host_response_template, intro_note')
          .eq('match_id', data.id)
          .eq('player_id', uid)
          .maybeSingle()
        setRequestStatus((reqData?.status as RequestStatus) ?? 'none')
        setMyHostTemplate(reqData?.host_response_template ?? null)
        setIntroNote(reqData?.intro_note ?? '')

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
        setRequestStatus('none')
        setMyHostTemplate(null)
      }
    }

    setLoading(false)
  }, [id, myId])

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      setMyId(user?.id ?? null)
      if (user?.id) {
        await fetchMyPlayer(user.id)
      } else {
        setMyPlayer(null)
      }
      await fetchSession(user?.id ?? null)
    }

    init()
  }, [fetchMyPlayer, fetchSession])

  async function fetchPendingRequests(sessionId: string) {
    const { data } = await supabase
      .from('join_requests')
      .select(`
        id, player_id, status, intro_note, host_response_template,
        player:player_id ( name, elo, current_elo, self_assessed_level, skill_label, sessions_joined, no_show_count )
      `)
      .eq('match_id', sessionId)
      .eq('status', 'pending')

    setPendingRequests((data as JoinRequestRecord[]) ?? [])
  }

  function formatClockInput(dateStr?: string | null) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const hh = date.getHours().toString().padStart(2, '0')
    const mm = date.getMinutes().toString().padStart(2, '0')
    return `${hh}:${mm}`
  }

  function applyClockToDate(dateStr: string, timeValue: string) {
    const [hours, minutes] = timeValue.split(':').map((value) => parseInt(value, 10))
    const date = new Date(dateStr)
    date.setHours(hours || 0, minutes || 0, 0, 0)
    return date
  }

  function pickerTimeValue(baseDate: string, timeValue: string) {
    if (!timeValue || !isValidClockValue(timeValue)) return new Date(baseDate)
    return applyClockToDate(baseDate, timeValue)
  }

  function isValidClockValue(value: string) {
    return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value)
  }

  function buildSessionUpdateSummary(changes: string[]) {
    if (changes.length === 0) return 'Host vừa cập nhật một số thông tin của kèo.'
    return `Host vừa cập nhật kèo: ${changes.join(', ')}. Vui lòng kiểm tra lại chi tiết kèo nhé.`
  }

  function hasBookingInfo() {
    return [bookingReference, bookingName, bookingPhone, bookingNotes].some((value) => value.trim().length > 0)
  }

  function bookingStatusConfig(status: 'confirmed' | 'unconfirmed') {
    if (status === 'confirmed') {
      return {
        bg: '#f0fdf4',
        text: '#166534',
        label: 'San da xac nhan',
      }
    }

    return {
      bg: '#fffbeb',
      text: '#92400e',
      label: 'San chua xac nhan',
    }
  }

  async function openCourtBookingLink() {
    const url = session?.slot?.court?.booking_url ?? session?.slot?.court?.google_maps_url
    if (!url) {
      Alert.alert('Chưa có link đặt sân', 'Sân này chưa có link booking. Bạn vẫn có thể tự đặt rồi nhập thông tin booking bên dưới.')
      return
    }

    try {
      await Linking.openURL(url)
    } catch {
      Alert.alert('Không mở được link', 'Vui lòng thử lại hoặc mở link booking của sân theo cách khác.')
    }
  }

  async function confirmCourtBooking() {
    if (!session || !myId || myId !== session.host.id) return
    if (!hasBookingInfo()) {
      Alert.alert('Thiếu thông tin booking', 'Hãy nhập ít nhất một thông tin booking để xác nhận sân.')
      return
    }

    setSavingBooking(true)
    const confirmedAt = new Date().toISOString()
    const payload = {
      court_booking_status: 'confirmed',
      booking_reference: bookingReference.trim() || null,
      booking_name: bookingName.trim() || null,
      booking_phone: bookingPhone.trim() || null,
      booking_notes: bookingNotes.trim() || null,
      booking_confirmed_at: confirmedAt,
    }

    const { error } = await supabase
      .from('sessions')
      .update(payload)
      .eq('id', session.id)

    setSavingBooking(false)

    if (error) {
      Alert.alert('Lỗi', error.message)
      return
    }

    setSession((prev) => (prev ? { ...prev, ...payload } : prev))
    Alert.alert('Đã xác nhận sân', 'Thông tin booking đã được lưu cho kèo này.')
  }

  async function saveSessionEdits() {
    if (!session || !isHost) return

    if (!isValidClockValue(editStartTime) || !isValidClockValue(editEndTime)) {
      Alert.alert('Giờ không hợp lệ', 'Vui lòng nhập giờ theo định dạng HH:MM.')
      return
    }

    const nextMaxPlayers = parseInt(editMaxPlayers, 10)
    const nextPrice = parseInt(editPrice.replace(/\D/g, ''), 10)

    if (!nextMaxPlayers || nextMaxPlayers < session.session_players.length) {
      Alert.alert('Số người không hợp lệ', 'Max players không được nhỏ hơn số người đang có trong kèo.')
      return
    }

    const nextStart = applyClockToDate(session.slot.start_time, editStartTime)
    const nextEnd = applyClockToDate(session.slot.end_time, editEndTime)

    if (nextEnd <= nextStart) {
      Alert.alert('Giờ kết thúc không hợp lệ', 'Giờ kết thúc phải sau giờ bắt đầu.')
      return
    }

    const changedFields: string[] = []

    if (editStartTime !== formatClockInput(session.slot.start_time) || editEndTime !== formatClockInput(session.slot.end_time)) {
      changedFields.push(`giờ chơi ${editStartTime} → ${editEndTime}`)
    }
    if (nextMaxPlayers !== session.max_players) {
      changedFields.push(`số chỗ ${session.max_players} → ${nextMaxPlayers}`)
    }
    if (nextPrice !== session.slot.price) {
      changedFields.push(`giá ${(session.slot.price ?? 0).toLocaleString('vi-VN')}đ → ${nextPrice.toLocaleString('vi-VN')}đ`)
    }
    if (editRequireApproval !== session.require_approval) {
      changedFields.push(editRequireApproval ? 'bật duyệt tay' : 'tắt duyệt tay')
    }

    if (changedFields.length === 0) {
      setIsEditingSession(false)
      Alert.alert('Không có thay đổi', 'Bạn chưa chỉnh sửa thông tin nào của kèo.')
      return
    }

    setSavingSessionEdit(true)

    const { data: updatedSlots, error: slotError } = await supabase
      .from('court_slots')
      .update({
        start_time: nextStart.toISOString(),
        end_time: nextEnd.toISOString(),
        price: nextPrice,
      })
      .eq('id', (session as any).slot_id ?? (session as any).slot?.id)
      .select('id, start_time, end_time, price')

    if (slotError) {
      setSavingSessionEdit(false)
      Alert.alert('Lỗi', slotError.message)
      return
    }

    if (!updatedSlots || updatedSlots.length === 0) {
      setSavingSessionEdit(false)
      Alert.alert('Không lưu được thay đổi', 'Host chưa có quyền cập nhật khung giờ của kèo này. Hãy chạy migration policy mới trong Supabase.')
      return
    }

    const { data: updatedSessions, error: sessionError } = await supabase
      .from('sessions')
      .update({
        max_players: nextMaxPlayers,
        require_approval: editRequireApproval,
        start_time: nextStart.toISOString(),
        end_time: nextEnd.toISOString(),
        total_cost: nextPrice,
        cost_per_player: nextMaxPlayers > 0 ? Math.ceil(nextPrice / nextMaxPlayers) : null,
      })
      .eq('id', session.id)
      .select('id, max_players, require_approval')

    setSavingSessionEdit(false)

    if (sessionError) {
      Alert.alert('Lỗi', sessionError.message)
      return
    }

    if (!updatedSessions || updatedSessions.length === 0) {
      Alert.alert('Không lưu được thay đổi', 'Host chưa có quyền cập nhật thông tin kèo này. Hãy chạy migration policy mới trong Supabase.')
      return
    }

    const playerIdsToNotify = session.session_players
      .filter((player) => player.player_id !== session.host.id)
      .map((player) => player.player_id)

    await Promise.all(
      playerIdsToNotify.map((playerId) =>
        insertNotification(
          playerId,
          'Kèo vừa được cập nhật',
          buildSessionUpdateSummary(changedFields),
          'session_updated',
          `/session/${session.id}`,
        )
      )
    )

    setSession((prev) =>
      prev
        ? {
            ...prev,
            max_players: nextMaxPlayers,
            require_approval: editRequireApproval,
            slot: {
              ...prev.slot,
              start_time: nextStart.toISOString(),
              end_time: nextEnd.toISOString(),
              price: nextPrice,
            },
          }
        : prev
    )
    setEditStartTime(formatClockInput(nextStart.toISOString()))
    setEditEndTime(formatClockInput(nextEnd.toISOString()))
    setEditMaxPlayers(String(nextMaxPlayers))
    setEditPrice(String(nextPrice))
    setIsEditingSession(false)
    Alert.alert('Đã cập nhật kèo', 'Những người đã join kèo đã được thông báo về thay đổi mới.')
  }

  function handleEditTimeChange(field: 'start' | 'end') {
    return (event: DateTimePickerEvent, selectedDate?: Date) => {
      if (field === 'start') {
        setShowEditStartPicker(false)
      } else {
        setShowEditEndPicker(false)
      }

      if (event.type !== 'set' || !selectedDate) return

      const nextValue = formatClockInput(selectedDate.toISOString())
      if (field === 'start') {
        setEditStartTime(nextValue)
      } else {
        setEditEndTime(nextValue)
      }
    }
  }

  function openEditTimePicker(field: 'start' | 'end') {
    if (!session) return

    const value =
      field === 'start'
        ? pickerTimeValue(session.slot.start_time, editStartTime)
        : pickerTimeValue(session.slot.end_time, editEndTime)

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value,
        mode: 'time',
        is24Hour: true,
        onChange: handleEditTimeChange(field),
      })
      return
    }

    if (field === 'start') {
      setShowEditStartPicker(true)
    } else {
      setShowEditEndPicker(true)
    }
  }

  async function directJoinSession() {
    if (!myId) {
      Alert.alert('Cần đăng nhập', 'Bạn cần đăng nhập để tham gia kèo này', [
        { text: 'Huỷ', style: 'cancel' },
        { text: 'Đăng nhập', onPress: () => router.push('/login') },
      ])
      return
    }

    if (!session) return

    setJoining(true)
    const { error } = await supabase.from('session_players').insert({
      session_id: session.id,
      player_id: myId,
      status: 'confirmed',
    })

    if (!error) {
      await supabase
        .from('join_requests')
        .update({ status: 'accepted' })
        .eq('match_id', session.id)
        .eq('player_id', myId)
    }

    setJoining(false)

    if (error) {
      Alert.alert('Lỗi', error.message)
      return
    }

    Alert.alert('Tham gia thành công', 'Bạn đã vào kèo này rồi nhé.')
    setRequestStatus('accepted')
    await fetchSession(myId)
  }

  async function sendJoinRequest(mode: RequestStatus | 'waitlist', noteOverride?: string) {
    if (!myId) {
      Alert.alert('Cần đăng nhập', 'Bạn cần đăng nhập để gửi yêu cầu', [
        { text: 'Huỷ', style: 'cancel' },
        { text: 'Đăng nhập', onPress: () => router.push('/login') },
      ])
      return
    }

    if (!session) return

    setRequesting(true)
    const { error } = await supabase.from('join_requests').upsert(
      {
        match_id: session.id,
        player_id: myId,
        status: 'pending',
        intro_note: noteOverride?.trim() || introNote.trim() || null,
      },
      {
        onConflict: 'match_id,player_id',
      }
    )
    setRequesting(false)

    if (error) {
      Alert.alert('Lỗi', error.message)
      return
    }

    setRequestStatus('pending')
    setJoinModalVisible(false)
    setMyHostTemplate(null)
    Alert.alert(
      mode === 'waitlist' ? 'Đã đăng ký dự bị' : 'Đã gửi yêu cầu',
      mode === 'waitlist' ? 'Host sẽ thấy bạn trong danh sách dự bị nếu có slot trống.' : 'Chờ host duyệt nhé.'
    )

    // Notify host
    if (myPlayer) {
      const slotTime = new Date(session.slot.start_time)
        .toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      await insertNotification(
        session.host.id,
        mode === 'waitlist' ? 'Có người đăng ký dự bị' : 'Có người muốn join kèo!',
        `${myPlayer.name} (Elo ${myPlayer.current_elo ?? myPlayer.elo}) gửi yêu cầu vào kèo lúc ${slotTime}`,
        'join_request',
        `/session/${session.id}`,
      )
    }
  }

  async function approveRequest(requestId: string, playerId: string) {
    if (!session) return

    const { error: reqErr } = await supabase
      .from('join_requests')
      .update({ status: 'accepted' })
      .eq('id', requestId)
    if (reqErr) {
      console.warn('[approveRequest] update join_requests failed:', reqErr.message)
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
      .from('join_requests')
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

  async function replyWithTemplate(requestId: string, playerId: string, template: string) {
    if (!session) return

    const { error } = await supabase
      .from('join_requests')
      .update({ host_response_template: template })
      .eq('id', requestId)

    if (error) {
      Alert.alert('Lỗi', error.message)
      return
    }

    setPendingRequests((prev) =>
      prev.map((request) =>
        request.id === requestId ? { ...request, host_response_template: template } : request
      )
    )

    await insertNotification(
      playerId,
      'Host đã phản hồi yêu cầu',
      template,
      'join_request_reply',
      `/session/${session.id}`,
    )

    Alert.alert('Đã gửi phản hồi', 'Template đã được lưu và gửi cho người chơi.')
  }

  async function leaveSession() {
    if (!myId || !session) return

    Alert.alert('Rời kèo?', 'Bạn chắc muốn rời kèo này không?', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Rời kèo',
        style: 'destructive',
        onPress: async () => {
          const leavingPlayer = session.session_players.find((p) => p.player_id === myId)
          const slotTime = new Date(session.slot.start_time)
            .toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })

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

          await supabase
            .from('join_requests')
            .delete()
            .eq('match_id', session.id)
            .eq('player_id', myId)

          if (session.host.id !== myId) {
            await insertNotification(
              session.host.id,
              'Người chơi đã rời kèo',
              `${leavingPlayer?.player?.name ?? 'Một người chơi'} đã rời kèo lúc ${slotTime}.`,
              'player_left',
              `/session/${session.id}`,
            )
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
    const playerIdsToNotify = session.session_players
      .filter((p) => p.player_id !== session.host.id)
      .map((p) => p.player_id)
    const slotTime = new Date(session.slot.start_time)
      .toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
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
          await supabase.from('join_requests').delete().eq('match_id', session.id)

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

          await Promise.all(
            playerIdsToNotify.map((playerId) =>
              insertNotification(
                playerId,
                'Host đã huỷ kèo',
                `Kèo lúc ${slotTime} đã bị host huỷ.`,
                'session_cancelled',
                `/session/${session.id}`,
              )
            )
          )

          Alert.alert('Đã huỷ kèo', 'Kèo của bạn đã được huỷ.', [
            { text: 'OK', onPress: () => router.replace('/(tabs)' as any) },
          ])
        },
      },
    ])
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
    return getSkillLevelFromEloRange(eloMin, eloMax).title
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <ActivityIndicator size="large" color="#16a34a" />
      </SafeAreaView>
    )
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <Text style={{ color: '#888' }}>Không tìm thấy kèo này</Text>
      </SafeAreaView>
    )
  }

  const players = session.session_players ?? []
  const isHost = myId === (session.host as any)?.id
  const hasJoined = players.some(p => p.player_id === (myId ?? ''))
  const nonHostPlayers = players.filter(p => p.player_id !== (session.host as any)?.id)
  const court = session.slot?.court
  const spotsLeft = session.max_players - players.length
  const isDone = session.status === 'done'
  const isCancelled = session.status === 'cancelled'
  const canRateSession = session.status === 'done' && (hasJoined || isHost)
  const bookingCfg = bookingStatusConfig(session.court_booking_status)
  const matchTargetScore = getSkillScoreFromEloRange(session.elo_min, session.elo_max)
  const mySkillScore = getSkillScoreFromPlayer(myPlayer)
  const smartJoinStatus = mySkillScore == null
    ? 'MATCHED'
    : getMatchStatus(mySkillScore, matchTargetScore, players.length, session.max_players)
  const matchTargetElo = Math.round((session.elo_min + session.elo_max) / 2)
  const hostRequiresApproval = session.require_approval || !session.host.auto_accept

  function handleSmartJoinPress() {
    if (smartJoinStatus === 'MATCHED' && !hostRequiresApproval) {
      void directJoinSession()
      return
    }
    setJoinModalVisible(true)
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
    <ScrollView
      key={refreshKey}
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

      <View style={[styles.bookingBadge, { backgroundColor: bookingCfg.bg }]}>
        <Text style={[styles.bookingBadgeText, { color: bookingCfg.text }]}>
          {bookingCfg.label}
        </Text>
      </View>

      {(session.booking_reference || session.booking_name || session.booking_phone || session.booking_notes) && (
        <View style={styles.bookingInfoCard}>
          <Text style={styles.bookingInfoTitle}>Thông tin booking</Text>
          {session.booking_reference && <Text style={styles.bookingInfoText}>Mã booking: {session.booking_reference}</Text>}
          {session.booking_name && <Text style={styles.bookingInfoText}>Người đặt: {session.booking_name}</Text>}
          {session.booking_phone && <Text style={styles.bookingInfoText}>Số điện thoại: {session.booking_phone}</Text>}
          {session.booking_notes && <Text style={styles.bookingInfoText}>Ghi chú: {session.booking_notes}</Text>}
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
        {session.status === 'open' && spotsLeft <= 0 && <Text style={styles.spotsFull}> · Đã đủ người</Text>}
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
        {(session.host as any)?.is_provisional && (
          <View style={styles.provisionalHostBadge}>
            <Text style={styles.provisionalHostBadgeText}>
              Placement {(session.host as any)?.placement_matches_played ?? 0}/5
            </Text>
          </View>
        )}
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

      {isHost && (
        <HostRequestReview
          requests={pendingRequests}
          matchTargetElo={matchTargetElo}
          onOpenPlayer={(playerId) => router.push({ pathname: '/player/[id]' as any, params: { id: playerId } })}
          onAccept={approveRequest}
          onReject={rejectRequest}
          onReplyTemplate={replyWithTemplate}
        />
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
            ) : (
              <SmartJoinButton
                matchStatus={smartJoinStatus}
                requestStatus={requestStatus}
                hostResponseTemplate={myHostTemplate}
                loading={joining || requesting}
                onPress={handleSmartJoinPress}
              />
            )
          )}

          {isHost && (
            <>
              <View style={styles.hostActionsCard}>
                <View style={styles.hostActionsHeader}>
                  <View style={styles.hostActionsCopy}>
                    <Text style={styles.hostActionsTitle}>Chỉnh sửa kèo</Text>
                    <Text style={styles.hostActionsSub}>
                      Khi lưu thay đổi, người đã join kèo sẽ nhận được notification cập nhật.
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.editToggleBtn}
                    onPress={() => setIsEditingSession((prev) => !prev)}
                  >
                    <Text style={styles.editToggleBtnText}>{isEditingSession ? 'Đóng' : 'Sửa kèo'}</Text>
                  </TouchableOpacity>
                </View>

                {isEditingSession && (
                  <View style={styles.editSessionForm}>
                    <View style={styles.editRow}>
                      <View style={styles.editField}>
                        <Text style={styles.editFieldLabel}>Giờ bắt đầu</Text>
                        <TouchableOpacity style={styles.timePickerBtn} onPress={() => openEditTimePicker('start')}>
                          <Text style={styles.timePickerText}>{editStartTime || '11:00'}</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={styles.editField}>
                        <Text style={styles.editFieldLabel}>Giờ kết thúc</Text>
                        <TouchableOpacity style={styles.timePickerBtn} onPress={() => openEditTimePicker('end')}>
                          <Text style={styles.timePickerText}>{editEndTime || '13:30'}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.editRow}>
                      <View style={styles.editField}>
                        <Text style={styles.editFieldLabel}>Số chỗ tối đa</Text>
                        <TextInput
                          style={styles.bookingInput}
                          placeholder="4"
                          placeholderTextColor="#aaa"
                          keyboardType="number-pad"
                          value={editMaxPlayers}
                          onChangeText={setEditMaxPlayers}
                        />
                      </View>
                      <View style={styles.editField}>
                        <Text style={styles.editFieldLabel}>Giá / người</Text>
                        <TextInput
                          style={styles.bookingInput}
                          placeholder="120000"
                          placeholderTextColor="#aaa"
                          keyboardType="number-pad"
                          value={editPrice}
                          onChangeText={setEditPrice}
                        />
                      </View>
                    </View>

                    <View style={styles.editSwitchRow}>
                      <View style={styles.editSwitchCopy}>
                        <Text style={styles.editFieldLabel}>Duyệt tay</Text>
                        <Text style={styles.editSwitchSub}>
                          Nếu bật, mọi yêu cầu mới sẽ cần host xét duyệt thay vì vào thẳng.
                        </Text>
                      </View>
                      <Switch
                        value={editRequireApproval}
                        onValueChange={setEditRequireApproval}
                        trackColor={{ false: '#d1d5db', true: '#86efac' }}
                        thumbColor={editRequireApproval ? '#16a34a' : '#f8fafc'}
                      />
                    </View>

                    <TouchableOpacity
                      style={[styles.bookingConfirmBtn, savingSessionEdit && styles.bookingConfirmBtnDisabled]}
                      onPress={saveSessionEdits}
                      disabled={savingSessionEdit}
                    >
                      <Text style={styles.bookingConfirmBtnText}>
                        {savingSessionEdit ? 'Đang lưu thay đổi...' : 'Lưu thay đổi kèo'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {session.court_booking_status !== 'confirmed' && (
                <View style={styles.bookingEditorCard}>
                  <Text style={styles.sectionTitle}>Xác nhận đặt sân</Text>
                  <Text style={styles.bookingEditorText}>
                    Cập nhật trạng thái sân thành đã xác nhận sau khi bạn có thông tin booking.
                  </Text>
                  <TouchableOpacity style={styles.bookingOpenBtn} onPress={openCourtBookingLink}>
                    <Text style={styles.bookingOpenBtnText}>Mở link booking của sân</Text>
                  </TouchableOpacity>
                  <TextInput
                    style={styles.bookingInput}
                    placeholder="Mã booking / mã đặt sân"
                    placeholderTextColor="#aaa"
                    value={bookingReference}
                    onChangeText={setBookingReference}
                  />
                  <TextInput
                    style={styles.bookingInput}
                    placeholder="Tên người đặt"
                    placeholderTextColor="#aaa"
                    value={bookingName}
                    onChangeText={setBookingName}
                  />
                  <TextInput
                    style={styles.bookingInput}
                    placeholder="Số điện thoại booking"
                    placeholderTextColor="#aaa"
                    keyboardType="phone-pad"
                    value={bookingPhone}
                    onChangeText={setBookingPhone}
                  />
                  <TextInput
                    style={[styles.bookingInput, styles.bookingNotesInput]}
                    placeholder="Ghi chú booking"
                    placeholderTextColor="#aaa"
                    multiline
                    value={bookingNotes}
                    onChangeText={setBookingNotes}
                  />
                  <TouchableOpacity
                    style={[styles.bookingConfirmBtn, savingBooking && styles.bookingConfirmBtnDisabled]}
                    onPress={confirmCourtBooking}
                    disabled={savingBooking}
                  >
                    <Text style={styles.bookingConfirmBtnText}>
                      {savingBooking ? 'Đang lưu...' : 'Xác nhận đã đặt sân'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

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

      <JoinRequestModal
        visible={joinModalVisible}
        mode={smartJoinStatus}
        introNote={introNote}
        setIntroNote={setIntroNote}
        loading={requesting}
        onClose={() => setJoinModalVisible(false)}
        onSubmit={() => void sendJoinRequest(smartJoinStatus === 'WAITLIST' ? 'waitlist' : 'pending')}
      />
      {showEditStartPicker && session ? (
        <DateTimePicker
          value={pickerTimeValue(session.slot.start_time, editStartTime)}
          mode="time"
          is24Hour
          display="spinner"
          themeVariant="light"
          onChange={handleEditTimeChange('start')}
        />
      ) : null}
      {showEditEndPicker && session ? (
        <DateTimePicker
          value={pickerTimeValue(session.slot.end_time, editEndTime)}
          mode="time"
          is24Hour
          display="spinner"
          themeVariant="light"
          onChange={handleEditTimeChange('end')}
        />
      ) : null}
    </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 20 },
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
  bookingBadge: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginBottom: 16,
  },
  bookingBadgeText: { fontSize: 13, fontWeight: '700' },
  bookingInfoCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
  },
  bookingInfoTitle: { fontSize: 14, fontWeight: '700', color: '#111', marginBottom: 8 },
  bookingInfoText: { fontSize: 13, color: '#4b5563', lineHeight: 19, marginBottom: 4 },
  infoRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  infoCard: { backgroundColor: '#f9fafb', borderRadius: 14, padding: 14, flex: 1 },
  infoLabel: { fontSize: 12, color: '#888', marginBottom: 4 },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#111' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111', marginTop: 24, marginBottom: 16 },
  spotsLeft: { color: '#16a34a', fontWeight: '600' },
  spotsFull: { color: '#dc2626', fontWeight: '700' },
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
  provisionalHostBadge: {
    backgroundColor: '#fffbeb',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
    marginLeft: 8,
  },
  provisionalHostBadgeText: { fontSize: 12, color: '#92400e', fontWeight: '700' },
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
  hostActionsCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    padding: 16,
    marginTop: 24,
    gap: 14,
  },
  hostActionsHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  hostActionsCopy: {
    flex: 1,
  },
  hostActionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  hostActionsSub: {
    fontSize: 13,
    lineHeight: 18,
    color: '#6b7280',
  },
  editToggleBtn: {
    borderWidth: 1.5,
    borderColor: '#16a34a',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  editToggleBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16a34a',
  },
  editSessionForm: {
    gap: 12,
  },
  editRow: {
    flexDirection: 'row',
    gap: 12,
  },
  editField: {
    flex: 1,
  },
  editFieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  timePickerBtn: {
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  timePickerText: {
    fontSize: 14,
    color: '#111',
    fontWeight: '600',
  },
  editSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  editSwitchCopy: {
    flex: 1,
  },
  editSwitchSub: {
    fontSize: 12,
    lineHeight: 18,
    color: '#6b7280',
  },
  bookingEditorCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 14,
    padding: 16,
    marginTop: 24,
    gap: 10,
  },
  bookingEditorText: { fontSize: 13, color: '#6b7280', lineHeight: 18 },
  bookingOpenBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingOpenBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  bookingInput: {
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    fontSize: 14,
    color: '#111',
    backgroundColor: '#fff',
  },
  bookingNotesInput: { height: 90, paddingTop: 14, textAlignVertical: 'top' },
  bookingConfirmBtn: {
    backgroundColor: '#111827',
    borderRadius: 12,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingConfirmBtnDisabled: { opacity: 0.65 },
  bookingConfirmBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
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
