import DateTimePicker, { DateTimePickerAndroid, type DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { HostRequestReview } from '@/components/session/HostRequestReview'
import { JoinRequestModal } from '@/components/session/JoinRequestModal'
import { SmartJoinButton } from '@/components/session/SmartJoinButton'
import { getMatchStatus } from '@/lib/matchmaking'
import { formatEstimatedCostPerPerson } from '@/lib/sessionPricing'
import {
  getSkillLevelFromElo,
  getSkillLevelFromEloRange,
  getSkillLevelFromPlayer,
  getShortSkillLabel,
  getSkillScoreFromEloRange,
  getSkillScoreFromPlayer,
  SKILL_ASSESSMENT_LEVELS,
} from '@/lib/skillAssessment'
import { getSkillLevelUi, getSkillTargetElo } from '@/lib/skillLevelUi'
import { supabase } from '@/lib/supabase'
import { insertNotification } from '@/lib/notifications'
import * as Linking from 'expo-linking'
import { router, useLocalSearchParams } from 'expo-router'
import { Activity, ArrowLeft, BadgeCheck, ChevronDown, ChevronUp, CircleDollarSign, Clock3, Flame, MapPin, Share2, Shield, ShieldAlert, Target, UserStar } from 'lucide-react-native'
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

type SessionRecord = {
  id: string
  elo_min: number
  elo_max: number
  max_players: number
  status: string
  results_status?: 'not_submitted' | 'pending_confirmation' | 'disputed' | 'finalized' | 'void'
  results_submitted_at?: string | null
  results_confirmation_deadline?: string | null
  auto_closed_at?: string | null
  auto_closed_reason?: string | null
  require_approval: boolean
  fill_deadline?: string | null
  court_booking_status: 'confirmed' | 'unconfirmed'
  booking_reference: string | null
  booking_name: string | null
  booking_phone: string | null
  booking_notes: string | null
  booking_confirmed_at: string | null
  host: {
    id: string
    name: string
    auto_accept?: boolean
    is_provisional?: boolean
    placement_matches_played?: number
    win_streak?: number | null
    reliability_score?: number | null
    sessions_joined?: number | null
    no_show_count?: number | null
    elo?: number | null
    current_elo?: number | null
    self_assessed_level?: string | null
    skill_label?: string | null
  }
  slot: {
    id?: string
    start_time: string
    end_time: string
    price: number
    court: { name: string; address: string; city: string; booking_url?: string | null; google_maps_url?: string | null }
  }
  session_players: {
    player_id: string
    status: string
    match_result?: 'pending' | 'win' | 'loss' | 'draw'
    proposed_result?: 'pending' | 'win' | 'loss' | 'draw'
    host_unprofessional_reported_at?: string | null
    host_unprofessional_report_note?: string | null
    result_confirmation_status?: 'not_submitted' | 'awaiting_player' | 'confirmed' | 'disputed'
    result_dispute_note?: string | null
    player: {
      name: string
      is_provisional?: boolean | null
      win_streak?: number | null
      reliability_score?: number | null
      sessions_joined?: number | null
      no_show_count?: number | null
      elo?: number | null
      current_elo?: number | null
      self_assessed_level?: string | null
      skill_label?: string | null
    }
  }[]
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

type JoinRequestRow = {
  id: string
  player_id: string
  status: RequestStatus
  intro_note?: string | null
  host_response_template?: string | null
  player:
    | {
        name?: string | null
        elo?: number | null
        current_elo?: number | null
        self_assessed_level?: string | null
        skill_label?: string | null
        sessions_joined?: number | null
        no_show_count?: number | null
      }
    | {
        name?: string | null
        elo?: number | null
        current_elo?: number | null
        self_assessed_level?: string | null
        skill_label?: string | null
        sessions_joined?: number | null
        no_show_count?: number | null
      }[]
    | null
}
type MyPlayerRecord = {
  id: string
  name: string
  elo: number
  current_elo?: number | null
  self_assessed_level?: string | null
  skill_label?: string | null
}

function normalizeSessionRecord(raw: any): SessionRecord {
  return {
    ...raw,
    results_status: raw?.results_status ?? 'not_submitted',
    results_submitted_at: raw?.results_submitted_at ?? null,
    results_confirmation_deadline: raw?.results_confirmation_deadline ?? null,
    auto_closed_at: raw?.auto_closed_at ?? null,
    auto_closed_reason: raw?.auto_closed_reason ?? null,
      session_players: ((raw?.session_players ?? []) as any[]).map((player) => ({
        ...player,
        match_result: player?.match_result ?? 'pending',
        proposed_result: player?.proposed_result ?? player?.match_result ?? 'pending',
        host_unprofessional_reported_at: player?.host_unprofessional_reported_at ?? null,
        host_unprofessional_report_note: player?.host_unprofessional_report_note ?? null,
        result_confirmation_status: player?.result_confirmation_status ?? 'not_submitted',
        result_dispute_note: player?.result_dispute_note ?? null,
      })),
  } as SessionRecord
}

export default function SessionDetail() {
  const { id, created } = useLocalSearchParams<{ id: string; created?: string }>()
  const insets = useSafeAreaInsets()
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
  const [editSessionDate, setEditSessionDate] = useState('')
  const [editMaxPlayers, setEditMaxPlayers] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [editEloMin, setEditEloMin] = useState<number>(800)
  const [editEloMax, setEditEloMax] = useState<number>(1500)
  const [editRequireApproval, setEditRequireApproval] = useState(false)
  const [showEditDatePicker, setShowEditDatePicker] = useState(false)
  const [showEditStartPicker, setShowEditStartPicker] = useState(false)
  const [showEditEndPicker, setShowEditEndPicker] = useState(false)
  const [savingResults, setSavingResults] = useState(false)
  const [matchResults, setMatchResults] = useState<Record<string, 'pending' | 'win' | 'loss' | 'draw'>>({})
  const [respondingToResult, setRespondingToResult] = useState(false)
  const [disputeNote, setDisputeNote] = useState('')
  const [reportingHostIssue, setReportingHostIssue] = useState(false)
  const [hostIssueNote, setHostIssueNote] = useState('')
  const [pendingRequests, setPendingRequests] = useState<JoinRequestRecord[]>([])
  const [joinModalVisible, setJoinModalVisible] = useState(false)
  const [introNote, setIntroNote] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [showBookingDetails, setShowBookingDetails] = useState(false)

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
    await supabase.rpc('process_pending_session_completions', { p_session_id: id })
    await supabase.rpc('process_overdue_session_closures', { p_session_id: id })

    const fullSelect = `
        id, elo_min, elo_max, max_players, status, results_status, results_submitted_at, results_confirmation_deadline, auto_closed_at, auto_closed_reason, require_approval, fill_deadline,
        court_booking_status, booking_reference, booking_name, booking_phone, booking_notes, booking_confirmed_at,
        host:host_id ( id, name, auto_accept, is_provisional, placement_matches_played, win_streak, reliability_score, sessions_joined, no_show_count, elo, current_elo, self_assessed_level, skill_label ),
        slot:slot_id (
          id, start_time, end_time, price,
          court:court_id ( name, address, city, booking_url, google_maps_url )
          ),
          session_players (
            player_id, status, match_result, proposed_result, host_unprofessional_reported_at, host_unprofessional_report_note, result_confirmation_status, result_dispute_note,
            player:player_id ( name, is_provisional, win_streak, reliability_score, sessions_joined, no_show_count, elo, current_elo, self_assessed_level, skill_label )
          )
        `

    const legacySelect = `
        id, elo_min, elo_max, max_players, status, require_approval, fill_deadline,
        court_booking_status, booking_reference, booking_name, booking_phone, booking_notes, booking_confirmed_at,
        host:host_id ( id, name, auto_accept, is_provisional, placement_matches_played, elo, current_elo, self_assessed_level, skill_label ),
        slot:slot_id (
          id, start_time, end_time, price,
          court:court_id ( name, address, city, booking_url, google_maps_url )
        ),
        session_players (
          player_id, status, match_result,
          player:player_id ( name, elo, current_elo, self_assessed_level, skill_label )
        )
      `

    let { data, error }: { data: any; error: any } = await supabase
      .from('sessions')
      .select(fullSelect)
      .eq('id', id)
      .single()

    if (error) {
      const legacyResponse = await supabase
        .from('sessions')
        .select(legacySelect)
        .eq('id', id)
        .single()

      data = legacyResponse.data
      error = legacyResponse.error
    }

    if (!error && data) {
      const normalized = normalizeSessionRecord(data)
      setSession(normalized)
      setBookingReference(normalized.booking_reference ?? '')
      setBookingName(normalized.booking_name ?? '')
      setBookingPhone(normalized.booking_phone ?? '')
      setBookingNotes(normalized.booking_notes ?? '')
      setEditStartTime(formatClockInput(normalized.slot?.start_time))
      setEditEndTime(formatClockInput(normalized.slot?.end_time))
      setEditSessionDate(formatDateInput(normalized.slot?.start_time))
      setEditMaxPlayers(String(normalized.max_players ?? ''))
      setEditPrice(String(normalized.slot?.price ?? ''))
      setEditEloMin(Number(normalized.elo_min ?? 800))
      setEditEloMax(Number(normalized.elo_max ?? 1500))
      setEditRequireApproval(Boolean(normalized.require_approval))
      setMatchResults(
        Object.fromEntries(
          (normalized.session_players ?? []).map((player) => [
            player.player_id,
            (player.proposed_result ?? player.match_result ?? 'pending') as 'pending' | 'win' | 'loss' | 'draw',
          ]),
        ),
      )
      const uid = userId ?? myId
      if (uid) {
        const isEligibleForRating =
          normalized.status === 'done' &&
          (uid === normalized.host.id || (normalized.session_players ?? []).some((p) => p.player_id === uid))

        const { data: reqData } = await supabase
          .from('join_requests')
          .select('status, host_response_template, intro_note')
          .eq('match_id', normalized.id)
          .eq('player_id', uid)
          .maybeSingle()
        setRequestStatus((reqData?.status as RequestStatus) ?? 'none')
        setMyHostTemplate(reqData?.host_response_template ?? null)
        setIntroNote(reqData?.intro_note ?? '')

        if (isEligibleForRating) {
          const { data: ratingData } = await supabase
            .from('ratings')
            .select('id')
            .eq('session_id', normalized.id)
            .eq('rater_id', uid)
            .limit(1)

          setAlreadyRated((ratingData?.length ?? 0) > 0)
        } else {
          setAlreadyRated(false)
        }

        if (uid === normalized.host.id) {
          await fetchPendingRequests(normalized.id)
        }
      } else {
        setAlreadyRated(false)
        setRequestStatus('none')
        setMyHostTemplate(null)
      }

      if (
        normalized.results_status === 'pending_confirmation' &&
        normalized.results_confirmation_deadline &&
        new Date(normalized.results_confirmation_deadline).getTime() <= Date.now()
      ) {
        const { error: finalizeError } = await supabase.rpc('finalize_session_results', { p_session_id: normalized.id })

        if (!finalizeError) {
          await fetchSession(uid)
          return
        }
      }
    }

    if (error) {
      console.warn('[SessionDetail] fetchSession failed:', error.message)
      setSession(null)
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

    const normalizedRequests: JoinRequestRecord[] = ((data as JoinRequestRow[] | null) ?? []).map((item) => {
      const player = Array.isArray(item.player) ? item.player[0] : item.player

      return {
        id: item.id,
        player_id: item.player_id,
        status: item.status,
        intro_note: item.intro_note ?? null,
        host_response_template: item.host_response_template ?? null,
        player: {
          name: player?.name ?? 'Người chơi',
          elo: player?.elo ?? null,
          current_elo: player?.current_elo ?? null,
          self_assessed_level: player?.self_assessed_level ?? null,
          skill_label: player?.skill_label ?? null,
          sessions_joined: player?.sessions_joined ?? null,
          no_show_count: player?.no_show_count ?? null,
        },
      }
    })

    setPendingRequests(normalizedRequests)
  }

  function formatClockInput(dateStr?: string | null) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const hh = date.getHours().toString().padStart(2, '0')
    const mm = date.getMinutes().toString().padStart(2, '0')
    return `${hh}:${mm}`
  }

  function formatDateInput(dateStr?: string | null) {
    if (!dateStr) return ''
    const date = new Date(dateStr)
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }

  function formatDateLabel(dateKey?: string | null) {
    if (!dateKey) return 'Chọn ngày'
    const date = new Date(`${dateKey}T00:00:00`)
    return date.toLocaleDateString('vi-VN')
  }

  function applyClockToDate(dateStr: string, timeValue: string) {
    const [hours, minutes] = timeValue.split(':').map((value) => parseInt(value, 10))
    const date = new Date(dateStr)
    date.setHours(hours || 0, minutes || 0, 0, 0)
    return date
  }

  function buildDateWithClock(dateKey: string, timeValue: string) {
    const [year, month, day] = dateKey.split('-').map((value) => parseInt(value, 10))
    const [hours, minutes] = timeValue.split(':').map((value) => parseInt(value, 10))
    const date = new Date()
    date.setFullYear(year, (month || 1) - 1, day || 1)
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
        label: 'Sân đã chốt',
      }
    }

    return {
      bg: '#fffbeb',
      text: '#92400e',
      label: 'Sân chưa xác nhận',
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
    const payload: Pick<
      SessionRecord,
      'court_booking_status' | 'booking_reference' | 'booking_name' | 'booking_phone' | 'booking_notes' | 'booking_confirmed_at'
    > = {
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

    if (!editSessionDate) {
      Alert.alert('Thiếu ngày chơi', 'Vui lòng chọn ngày cho kèo.')
      return
    }

    if (!isValidClockValue(editStartTime) || !isValidClockValue(editEndTime)) {
      Alert.alert('Giờ không hợp lệ', 'Vui lòng nhập giờ theo định dạng HH:MM.')
      return
    }

    const nextMaxPlayers = parseInt(editMaxPlayers, 10)
    const nextPrice = parseInt(editPrice.replace(/\D/g, ''), 10)
    const nextEloMin = Number(editEloMin)
    const nextEloMax = Number(editEloMax)

    if (!nextMaxPlayers || nextMaxPlayers < session.session_players.length) {
      Alert.alert('Số người không hợp lệ', 'Max players không được nhỏ hơn số người đang có trong kèo.')
      return
    }

    if (nextEloMin > nextEloMax) {
      Alert.alert('Trình độ không hợp lệ', 'Trình độ tối thiểu không thể cao hơn trình độ tối đa.')
      return
    }

    const nextStart =
      session.court_booking_status === 'confirmed'
        ? new Date(session.slot.start_time)
        : buildDateWithClock(editSessionDate, editStartTime)
    const nextEnd =
      session.court_booking_status === 'confirmed'
        ? new Date(session.slot.end_time)
        : buildDateWithClock(editSessionDate, editEndTime)

    if (nextEnd <= nextStart) {
      Alert.alert('Giờ kết thúc không hợp lệ', 'Giờ kết thúc phải sau giờ bắt đầu.')
      return
    }

    const changedFields: string[] = []

    if (editStartTime !== formatClockInput(session.slot.start_time) || editEndTime !== formatClockInput(session.slot.end_time)) {
      changedFields.push(`giờ chơi ${editStartTime} → ${editEndTime}`)
    }
    if (session.court_booking_status !== 'confirmed' && editSessionDate !== formatDateInput(session.slot.start_time)) {
      changedFields.push(`ngày chơi ${formatDateLabel(formatDateInput(session.slot.start_time))} → ${formatDateLabel(editSessionDate)}`)
    }
    if (nextMaxPlayers !== session.max_players) {
      changedFields.push(`số chỗ ${session.max_players} → ${nextMaxPlayers}`)
    }
    if (nextPrice !== session.slot.price) {
      changedFields.push(`gi? ${(session.slot.price ?? 0).toLocaleString('vi-VN')}? ? ${nextPrice.toLocaleString('vi-VN')}?`)
    }
    if (nextEloMin !== session.elo_min || nextEloMax !== session.elo_max) {
      changedFields.push(`trình độ ${skillLabel(session.elo_min, session.elo_max)} → ${skillLabel(nextEloMin, nextEloMax)}`)
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
        elo_min: nextEloMin,
        elo_max: nextEloMax,
        require_approval: editRequireApproval,
        start_time: nextStart.toISOString(),
        end_time: nextEnd.toISOString(),
        total_cost: nextPrice,
        cost_per_player: nextMaxPlayers > 0 ? Math.ceil(nextPrice / nextMaxPlayers) : null,
      })
      .eq('id', session.id)
      .select('id, max_players, require_approval, elo_min, elo_max, court_booking_status')

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
            elo_min: nextEloMin,
            elo_max: nextEloMax,
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
    setEditSessionDate(formatDateInput(nextStart.toISOString()))
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

  function handleEditDateChange(event: DateTimePickerEvent, selectedDate?: Date) {
    setShowEditDatePicker(false)
    if (event.type !== 'set' || !selectedDate) return
    setEditSessionDate(formatDateInput(selectedDate.toISOString()))
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

  function openEditDatePicker() {
    if (!session) return

    const value = editSessionDate ? new Date(`${editSessionDate}T00:00:00`) : new Date(session.slot.start_time)

    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value,
        mode: 'date',
        onChange: handleEditDateChange,
      })
      return
    }

    setShowEditDatePicker(true)
  }

  function updateMatchResult(playerId: string, result: 'pending' | 'win' | 'loss' | 'draw') {
    setMatchResults((prev) => ({
      ...prev,
      [playerId]: result,
    }))
  }

  async function saveMatchResults() {
    if (!session || !isHost) return

    const payload = session.session_players.map((player) => ({
      player_id: player.player_id,
      result: matchResults[player.player_id] ?? player.proposed_result ?? player.match_result ?? 'pending',
    }))

    setSavingResults(true)

    const { error } = await supabase.rpc('submit_session_results', {
      p_session_id: session.id,
      p_results: payload,
    })

    if (error) {
      setSavingResults(false)
      Alert.alert('Lỗi', error.message)
      return
    }

    const playerIdsToNotify = session.session_players
      .filter((player) => player.player_id !== session.host.id)
      .map((player) => player.player_id)

    await Promise.all(
      playerIdsToNotify.map((playerId) =>
        insertNotification(
          playerId,
          'Host ?? g?i k?t qu? tr?n',
          'H?y x?c nh?n ho?c b?o sai k?t qu? trong chi ti?t k?o. K?t qu? s? t? ch?t sau 24h n?u kh?ng ai ph?n ??i.',
          'session_results_submitted',
          `/session/${session.id}`,
        ),
      ),
    )

      setSession((prev) =>
        prev
          ? {
              ...prev,
              status: 'done',
              results_status: 'pending_confirmation',
              results_submitted_at: new Date().toISOString(),
              results_confirmation_deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            session_players: prev.session_players.map((player) => ({
              ...player,
              proposed_result: matchResults[player.player_id] ?? player.proposed_result ?? player.match_result ?? 'pending',
              result_confirmation_status: player.player_id === session.host.id ? 'confirmed' : 'awaiting_player',
              result_dispute_note: null,
            })),
          }
        : prev,
    )

    setSavingResults(false)
    Alert.alert('Đã gửi kết quả', 'Người chơi sẽ cần xác nhận kết quả. Achievement chỉ được tính sau khi đủ xác nhận hoặc hết thời hạn 24h mà không có tranh chấp.')
  }

  async function respondToSessionResult(response: 'confirmed' | 'disputed') {
    if (!session || !myId || isHost) return

    setRespondingToResult(true)

    const { data, error } = await supabase.rpc('respond_to_session_result', {
      p_session_id: session.id,
      p_response: response,
      p_note: response === 'disputed' ? disputeNote : null,
    })

    setRespondingToResult(false)

    if (error) {
      Alert.alert('Lỗi', error.message)
      return
    }

    if (response === 'disputed') {
      await insertNotification(
        session.host.id,
        'Có tranh chấp kết quả trận',
        `${myPlayer?.name ?? 'Một người chơi'} đã báo sai kết quả và yêu cầu host kiểm tra lại.`,
        'session_results_disputed',
        `/session/${session.id}`,
      )
    }

    if (data === 'finalized') {
      Alert.alert('Kết quả đã chốt', 'Kết quả trận đã đủ điều kiện xác nhận và được chốt chính thức.')
    } else if (response === 'confirmed') {
      Alert.alert('Đã xác nhận', 'Hệ thống đã ghi nhận xác nhận của bạn. Chờ các người chơi còn lại hoặc hết thời hạn 24h.')
    } else {
      Alert.alert('Đã báo sai kết quả', 'Host đã được thông báo để kiểm tra lại.')
    }

    setDisputeNote('')
    await fetchSession(myId)
  }

  async function reportHostUnprofessional() {
    if (!session || !myId || isHost) return

    setReportingHostIssue(true)
    const { data, error } = await supabase.rpc('report_host_unprofessional', {
      p_session_id: session.id,
      p_note: hostIssueNote.trim() || null,
    })

    setReportingHostIssue(false)

    if (!error) {
      if (data === 'already_reported') {
        Alert.alert('Đã báo trước đó', 'Bạn đã gửi báo cáo về host của kèo này rồi.')
      } else {
        Alert.alert('Đã gửi báo cáo', 'Hệ thống đã ghi nhận việc host không xác nhận kết quả đúng hạn.')
      }

      await fetchSession(myId)
      return
    }

    if (error) {
      Alert.alert('Lỗi', error.message)
      return
    }

    if (data === 'already_reported') {
      Alert.alert('Đã vô hiệu kèo', 'Đa số người chơi đã báo trận đấu không diễn ra. Kèo này đã bị vô hiệu.')
    } else if (data === 'member_finalized') {
      Alert.alert('Đã chốt bằng đồng thuận', 'Người chơi đã đủ đồng thuận để đóng kèo và mở bước hậu trận.')
    } else {
      Alert.alert('Đã gửi báo cáo', 'Báo cáo kết quả của bạn đã được ghi nhận.')
    }

    await fetchSession(myId)
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

  function playerSkillMeta(player?: {
    self_assessed_level?: string | null
    skill_label?: string | null
    current_elo?: number | null
    elo?: number | null
  } | null) {
    const level = getSkillLevelFromPlayer(player) ?? getSkillLevelFromElo(player?.current_elo ?? player?.elo)
    if (!level) return null

    return {
      level,
      ui: getSkillLevelUi(level.id),
    }
  }

  function getSkillTone(levelId?: string | null) {
    const skillUi = getSkillLevelUi(levelId as any)
    return {
      bg: skillUi.tagClassName,
      text: skillUi.textClassName,
      border: skillUi.borderClassName,
      icon: skillUi.iconColor,
    }
  }

  function getReliabilityScore(player?: {
    reliability_score?: number | null
    sessions_joined?: number | null
    no_show_count?: number | null
  } | null) {
    if (player?.reliability_score != null) return Math.round(player.reliability_score)
    const joined = player?.sessions_joined ?? 0
    if (!joined) return null
    const noShow = player?.no_show_count ?? 0
    return Math.max(0, Math.min(100, Math.round(((joined - noShow) / joined) * 100)))
  }

  function getReliabilityColor(score: number | null) {
    if (score == null) return '#94a3b8'
    if (score >= 90) return '#16a34a'
    if (score >= 70) return '#ca8a04'
    return '#dc2626'
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
  const isPendingCompletion = session.status === 'pending_completion'
  const isCancelled = session.status === 'cancelled'
  const wasAutoClosed = Boolean(session.auto_closed_at)
  const canRateSession = session.status === 'done' && (hasJoined || isHost)
  const myResultRow = players.find((p) => p.player_id === (myId ?? '')) ?? null
  const canReportHostIssue =
    !isHost &&
    hasJoined &&
    (isPendingCompletion || wasAutoClosed) &&
    !myResultRow?.host_unprofessional_reported_at
  const bookingCfg = bookingStatusConfig(session.court_booking_status)
  const matchTargetScore = getSkillScoreFromEloRange(session.elo_min, session.elo_max)
  const mySkillScore = getSkillScoreFromPlayer(myPlayer)
  const smartJoinStatus = mySkillScore == null
    ? 'MATCHED'
    : getMatchStatus(mySkillScore, matchTargetScore, players.length, session.max_players)
  const matchTargetElo = getSkillTargetElo(session.elo_min, session.elo_max)
  const sessionSkill = getSkillLevelFromEloRange(session.elo_min, session.elo_max)
  const sessionSkillUi = getSkillLevelUi(sessionSkill.id)
  const sessionShortSkill = getShortSkillLabel(sessionSkill)
  const hostSkill = playerSkillMeta(session.host)
  const hostSkillTone = getSkillTone(hostSkill?.level.id)
  const hostReliability = getReliabilityScore(session.host)
  const hostReliabilityColor = getReliabilityColor(hostReliability)
  const hostWinStreak = session.host.win_streak ?? 0
  const hostRequiresApproval = session.require_approval || !session.host.auto_accept
  const showStickyFooter = !isDone && !isPendingCompletion && !isCancelled && (isHost || hasJoined)

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
      contentContainerStyle={{ paddingBottom: showStickyFooter ? 112 + insets.bottom : 48 }}
    >
      <View style={styles.topRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <View style={styles.topActionInline}>
            <ArrowLeft size={16} color="#059669" />
            <Text style={styles.backText}>Quay lại</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.shareBtn}
          onPress={() => {
            const url = Linking.createURL(`/session/${id}`)
            Share.share({ message: `Tham gia kèo pickleball này nhé! ${url}` })
          }}
        >
          <View style={styles.topActionInline}>
            <Share2 size={15} color="#047857" />
            <Text style={styles.shareBtnText}>Chia sẻ</Text>
          </View>
        </TouchableOpacity>
      </View>

      {created === '1' && (
        <View style={styles.successBanner}>
          <Text style={styles.successBannerText}>Kèo đã được đăng. Chia sẻ link để mời người chơi.</Text>
        </View>
      )}
      <View className="rounded-[28px] border border-slate-200 bg-white p-5">
        <View className="flex-row flex-wrap items-center gap-2">
          <View className={`flex-row items-center rounded-full border px-3 py-2 ${sessionSkillUi.tagClassName} ${sessionSkillUi.borderClassName}`}>
            <sessionSkillUi.icon size={14} color={sessionSkillUi.iconColor} />
            <Text className={`ml-2 text-[11px] font-bold uppercase tracking-[0.8px] ${sessionSkillUi.textClassName}`}>{sessionShortSkill}</Text>
          </View>
          <View className="flex-row items-center rounded-full border border-slate-200 bg-slate-100 px-3 py-2">
            <Target size={12} color="#64748b" />
            <Text className="ml-1.5 text-[11px] font-bold uppercase tracking-[0.8px] text-slate-500">{`${matchTargetElo} ELO`}</Text>
          </View>
          <View className="flex-row items-center rounded-full border border-slate-200 bg-slate-100 px-3 py-2">
            <Activity size={12} color="#64748b" />
            <Text className="ml-1.5 text-[11px] font-bold uppercase tracking-[0.8px] text-slate-500">{`${sessionSkillUi.duprValue} DUPR`}</Text>
          </View>
        </View>
        <Text className="mt-7 text-[10px] font-extrabold uppercase tracking-[0.28em] text-slate-400">Session Detail</Text>
        <View className="mt-3">
          <View className="flex-1">
            <Text className="text-[24px] font-black leading-8 text-slate-900">{court?.name}</Text>
            <View className="mt-2 flex-row items-center">
              <MapPin size={15} color="#6b7280" />
              <Text className="ml-2 flex-1 text-[13px] font-medium leading-5 text-slate-500">
                {court?.address} · {court?.city}
              </Text>
            </View>
          </View>
        </View>

        <View
          className="mt-3 self-start rounded-full border px-3 py-2"
          style={{ backgroundColor: bookingCfg.bg, borderColor: bookingCfg.text }}
        >
          <View className="flex-row items-center gap-1.5">
            {session.court_booking_status === 'confirmed' ? (
              <BadgeCheck size={14} color={bookingCfg.text} />
            ) : (
              <ShieldAlert size={14} color={bookingCfg.text} />
            )}
            <Text className="text-[11px] font-bold uppercase tracking-[0.8px]" style={{ color: bookingCfg.text }}>
              {bookingCfg.label}
            </Text>
          </View>
        </View>

        <View className="mt-5 rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
          <View className="flex-row items-center">
            <View className="h-11 w-11 items-center justify-center rounded-full bg-indigo-100">
              <Clock3 size={18} color="#4f46e5" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Thời gian</Text>
              <Text className="mt-1 text-[13px] font-bold text-slate-700">
                {formatTime(session.slot.start_time, session.slot.end_time)}
              </Text>
            </View>
          </View>

          <View className="my-4 h-px bg-slate-200" />

          <View className="flex-row items-center">
            <View className="h-11 w-11 items-center justify-center rounded-full bg-amber-100">
              <CircleDollarSign size={18} color="#ea580c" />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Chi phí (dự kiến)</Text>
              <Text className="mt-1 text-[13px] font-bold text-slate-700">{formatEstimatedCostPerPerson(session.slot.price, session.max_players)}</Text>
            </View>
          </View>

          {session.require_approval && (
            <View className="flex-row items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-2">
              <ShieldAlert size={14} color="#b45309" />
              <Text className="ml-2 text-[12px] font-extrabold text-amber-700">Kèo duyệt tay</Text>
            </View>
          )}
        </View>

        {(session.booking_reference || session.booking_name || session.booking_phone || session.booking_notes) && (
          <View
            className="mt-4 rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-3"
          >
            <TouchableOpacity
              className="flex-row items-center justify-between"
              onPress={() => setShowBookingDetails((prev) => !prev)}
              activeOpacity={0.85}
            >
              <View className="flex-row items-center">
                <BadgeCheck size={16} color="#64748b" />
                <Text className="ml-2 text-[12px] font-extrabold text-slate-700">Thông tin booking</Text>
              </View>

              {showBookingDetails ? (
                <ChevronUp size={16} color="#64748b" />
              ) : (
                <ChevronDown size={16} color="#64748b" />
              )}
            </TouchableOpacity>

            {showBookingDetails ? (
              <View className="mt-3 gap-1.5">
                {session.booking_reference ? (
                  <Text className="text-[12px] font-medium text-slate-600">Mã booking: {session.booking_reference}</Text>
                ) : null}
                {session.booking_name ? (
                  <Text className="text-[12px] font-medium text-slate-600">Người đặt: {session.booking_name}</Text>
                ) : null}
                {session.booking_phone ? (
                  <Text className="text-[12px] font-medium text-slate-600">Số điện thoại: {session.booking_phone}</Text>
                ) : null}
                {session.booking_notes ? (
                  <Text className="text-[12px] font-medium text-slate-600">Ghi chú: {session.booking_notes}</Text>
                ) : null}
              </View>
            ) : null}
          </View>
        )}
      </View>

      <View className="mt-6 flex-row items-center justify-between">
        <Text className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-slate-500">
          Người chơi · {players.length}/{session.max_players}
        </Text>
        {session.status === 'open' && spotsLeft > 0 ? (
          <Text className="text-[12px] font-bold text-emerald-600">Còn {spotsLeft} chỗ</Text>
        ) : null}
        {session.status === 'open' && spotsLeft <= 0 ? (
          <Text className="text-[12px] font-bold text-rose-600">Đã đủ người</Text>
        ) : null}
      </View>

      <View className="mt-3 rounded-[24px] border border-slate-200 bg-white p-3">
        <TouchableOpacity
          className={`flex-row items-center rounded-[20px] border bg-slate-50 px-3 py-3 ${hostSkillTone.border}`}
          onPress={() =>
            router.push({ pathname: '/player/[id]' as any, params: { id: (session.host as any)?.id } })
          }
        >
          <View style={styles.avatar} className="bg-slate-900">
            <Text className="text-[16px] font-bold text-white">
              {(session.host as any)?.name?.[0]?.toUpperCase() ?? '?'}
            </Text>
            {hostSkill ? (
              <View
                className="absolute -bottom-1 -right-1 h-5 w-5 items-center justify-center rounded-full bg-slate-100"
                style={{ borderWidth: 3, borderColor: '#f8fafc' }}
              >
                <hostSkill.ui.icon size={10} color="#475569" />
              </View>
            ) : null}
          </View>
          <View className="ml-3 flex-1">
            <View className="flex-row flex-wrap items-center gap-2">
              <Text className="text-[14px] font-black text-slate-900">{(session.host as any)?.name}</Text>
              <UserStar size={12} color="#64748b" />
              {hostWinStreak >= 3 ? (
                <View className="flex-row items-center rounded-full bg-orange-500 px-2 py-1">
                  <Flame size={12} color="#ffffff" />
                  <Text className="ml-1 text-[11px] font-extrabold text-white">{hostWinStreak}</Text>
                </View>
              ) : null}
            </View>

            {hostReliability != null ? (
              <View className="mt-1 flex-row flex-wrap items-center gap-2">
                <View className="flex-row items-center rounded-full bg-slate-100 px-2 py-1">
                  <Shield size={12} color={hostReliabilityColor} />
                  <Text className="ml-1 text-[11px] font-bold text-slate-600">{`${hostReliability}% uy tín`}</Text>
                </View>
              </View>
            ) : null}
          </View>
          {hostSkill ? (
            <View className="items-end gap-1">
              <View className={`flex-row items-center rounded-full border px-3 py-2 ${getSkillTone(hostSkill.level.id).bg} ${getSkillTone(hostSkill.level.id).border}`}>
                <hostSkill.ui.icon size={12} color={getSkillTone(hostSkill.level.id).icon} />
                <Text className={`ml-1.5 text-[11px] font-extrabold ${getSkillTone(hostSkill.level.id).text}`}>
                  {getShortSkillLabel(hostSkill.level)}
                </Text>
              </View>
            </View>
          ) : null}
        </TouchableOpacity>

        {nonHostPlayers.map((p) => {
          const skill = playerSkillMeta(p.player)
          const reliability = getReliabilityScore(p.player)
          const reliabilityColor = getReliabilityColor(reliability)
          const streak = p.player?.win_streak ?? 0
          const skillTone = getSkillTone(skill?.level.id)

          return (
            <TouchableOpacity
              key={p.player_id}
              className="mt-2 flex-row items-center rounded-[20px] border border-slate-100 bg-white px-3 py-3"
              onPress={() => router.push({ pathname: '/player/[id]' as any, params: { id: p.player_id } })}
            >
              <View style={styles.avatar} className="border border-slate-200 bg-slate-50">
                <Text className="text-[16px] font-bold text-slate-700">
                  {(p.player as any)?.name?.[0]?.toUpperCase() ?? '?'}
                </Text>
                {skill ? (
                  <View
                    className="absolute -bottom-1 -right-1 h-5 w-5 items-center justify-center rounded-full bg-slate-100"
                    style={{ borderWidth: 3, borderColor: '#ffffff' }}
                  >
                    <skill.ui.icon size={10} color="#475569" />
                  </View>
                ) : null}
              </View>
              <View className="ml-3 flex-1">
                <View className="flex-row flex-wrap items-center gap-2">
                  <Text className="text-[14px] font-black text-slate-900">{(p.player as any)?.name ?? '?'}</Text>
                  {streak >= 3 ? (
                    <View className="flex-row items-center rounded-full bg-orange-500 px-2 py-1">
                      <Flame size={12} color="#ffffff" />
                      <Text className="ml-1 text-[11px] font-extrabold text-white">{streak}</Text>
                    </View>
                  ) : null}
                </View>

                {reliability != null ? (
                  <View className="mt-1 flex-row flex-wrap items-center gap-2">
                    <View className="flex-row items-center rounded-full bg-slate-100 px-2 py-1">
                      <Shield size={12} color={reliabilityColor} />
                      <Text className="ml-1 text-[11px] font-bold text-slate-600">{`${reliability}% uy tín`}</Text>
                    </View>
                  </View>
                ) : null}
              </View>

              {skill ? (
                <View className="items-end gap-1">
                  <View className={`flex-row items-center rounded-full border px-3 py-2 ${skillTone.bg} ${skillTone.border}`}>
                    <skill.ui.icon size={12} color={skillTone.icon} />
                    <Text className={`ml-1.5 text-[11px] font-extrabold ${skillTone.text}`}>
                      {getShortSkillLabel(skill.level)}
                    </Text>
                  </View>
                </View>
              ) : null}
            </TouchableOpacity>
          )
        })}

        {session.status === 'open' && Array.from({ length: Math.max(0, spotsLeft) }).map((_, i) => (
          <View key={i} className="mt-2 flex-row items-center rounded-[20px] border border-dashed border-slate-200 bg-slate-50 px-3 py-3">
            <View
              style={[
                styles.avatar,
                { backgroundColor: '#e2e8f0', borderColor: '#94a3b8', borderWidth: 1.5 },
              ]}
            >
              <Text className="text-[16px] font-bold text-slate-600">?</Text>
            </View>
            <Text className="ml-3 text-[13px] font-bold text-slate-400">Chờ người chơi...</Text>
          </View>
        ))}
      </View>

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

      {!isHost && isDone && myResultRow && session.results_status && session.results_status !== 'not_submitted' ? (
        <View style={styles.hostActionsCard}>
          <View style={styles.hostActionsHeader}>
            <View style={styles.hostActionsCopy}>
              <Text style={styles.hostActionsTitle}>Xác nhận kết quả trận</Text>
              <Text style={styles.hostActionsSub}>
                Host đã gửi kết quả cho kèo này. Bạn hãy xác nhận hoặc báo sai để tránh tính Elo và achievement sai.
              </Text>
            </View>
          </View>

          <View style={styles.resultCard}>
            <Text style={styles.editFieldLabel}>Kết quả host gửi cho bạn</Text>
            <Text style={styles.resultValueText}>
              {(() => {
                const value = myResultRow.proposed_result ?? myResultRow.match_result ?? 'pending'
                if (value === 'win') return 'Thắng'
                if (value === 'loss') return 'Thua'
                if (value === 'draw') return 'Hoà'
                return 'Chưa chốt'
              })()}
            </Text>
            <Text style={styles.resultStatusText}>
              {session.results_status === 'finalized'
                ? 'Kết quả đã được chốt chính thức.'
                : myResultRow.result_confirmation_status === 'confirmed'
                  ? 'Bạn đã xác nhận kết quả này.'
                  : myResultRow.result_confirmation_status === 'disputed'
                    ? 'Bạn đã báo sai kết quả. Chờ host cập nhật lại.'
                    : `Kết quả sẽ tự chốt sau 24h nếu không ai phản đối. Hạn chót: ${session.results_confirmation_deadline ? new Date(session.results_confirmation_deadline).toLocaleString('vi-VN') : '24h'}`}
            </Text>
          </View>

          {session.results_status !== 'finalized' && myResultRow.result_confirmation_status !== 'confirmed' ? (
            <>
              <TextInput
                style={[styles.bookingInput, styles.bookingNotesInput]}
                placeholder="Nếu báo sai, hãy ghi ngắn lý do để host kiểm tra lại"
                placeholderTextColor="#aaa"
                multiline
                value={disputeNote}
                onChangeText={setDisputeNote}
              />

              <View style={styles.editRow}>
                <TouchableOpacity
                  style={[styles.bookingConfirmBtn, { flex: 1 }, respondingToResult && styles.bookingConfirmBtnDisabled]}
                  onPress={() => respondToSessionResult('confirmed')}
                  disabled={respondingToResult}
                >
                  <Text style={styles.bookingConfirmBtnText}>
                    {respondingToResult ? 'Đang gửi...' : 'Xác nhận'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.cancelBtn, { flex: 1, marginTop: 0 }, respondingToResult && styles.cancelBtnDisabled]}
                  onPress={() => respondToSessionResult('disputed')}
                  disabled={respondingToResult}
                >
                  <Text style={styles.cancelBtnText}>Báo sai kết quả</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : null}
        </View>
      ) : null}

      {canReportHostIssue ? (
        <View style={styles.hostActionsCard}>
          <View style={styles.hostActionsHeader}>
            <View style={styles.hostActionsCopy}>
              <Text style={styles.hostActionsTitle}>Báo host không chuyên nghiệp</Text>
              <Text style={styles.hostActionsSub}>
                Host vẫn chưa xác nhận kết quả đúng hạn. Bạn có thể gửi một báo cáo để hệ thống ghi nhận.
              </Text>
            </View>
          </View>

          <TextInput
            style={[styles.bookingInput, styles.bookingNotesInput]}
            placeholder="Ghi chú thêm nếu cần, ví dụ host không chốt kèo đúng hạn"
            placeholderTextColor="#aaa"
            multiline
            value={hostIssueNote}
            onChangeText={setHostIssueNote}
          />

          <TouchableOpacity
            style={[styles.bookingConfirmBtn, reportingHostIssue && styles.bookingConfirmBtnDisabled]}
            onPress={reportHostUnprofessional}
            disabled={reportingHostIssue}
          >
            <Text style={styles.bookingConfirmBtnText}>
              {reportingHostIssue ? 'Đang gửi...' : 'Báo host không chuyên nghiệp'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.resultStatusText}>
            Nếu host vẫn không hoàn thành, hệ thống sẽ tự động đóng kèo với kết quả hòa để tránh treo session.
          </Text>
        </View>
      ) : null}


      {isHost && (isDone || isPendingCompletion) ? (
        <View style={styles.hostActionsCard}>
          <View style={styles.hostActionsHeader}>
            <View style={styles.hostActionsCopy}>
              <Text style={styles.hostActionsTitle}>Kết quả trận</Text>
              <Text style={styles.hostActionsSub}>
                Chọn kết quả cho từng người rồi gửi sang bước xác nhận. Achievement chỉ được tính sau khi người chơi xác nhận hoặc hết 24h mà không ai tranh chấp.
              </Text>
            </View>
          </View>

          {players.map((player) => {
            const currentResult = matchResults[player.player_id] ?? player.proposed_result ?? player.match_result ?? 'pending'
            const playerName =
              player.player_id === session.host.id ? session.host.name : (player.player as any)?.name ?? 'Người chơi'

            return (
              <View key={`result-${player.player_id}`} style={styles.resultCard}>
                <Text style={styles.resultPlayerName}>{playerName}</Text>
                <Text style={styles.resultStatusText}>
                  {player.result_confirmation_status === 'confirmed'
                    ? 'Đã xác nhận'
                    : player.result_confirmation_status === 'disputed'
                      ? `Đang tranh chấp${player.result_dispute_note ? ` · ${player.result_dispute_note}` : ''}`
                      : player.player_id === session.host.id
                        ? 'Host'
                        : 'Chờ người chơi xác nhận'}
                </Text>
                <View style={styles.optionPillRow}>
                  {[
                    { value: 'win', label: 'Thắng' },
                    { value: 'loss', label: 'Thua' },
                    { value: 'draw', label: 'Hoà' },
                    { value: 'pending', label: 'Chưa chốt' },
                  ].map((option) => (
                    <TouchableOpacity
                      key={`${player.player_id}-${option.value}`}
                      style={[styles.optionPill, currentResult === option.value && styles.optionPillActive]}
                      onPress={() => updateMatchResult(player.player_id, option.value as 'pending' | 'win' | 'loss' | 'draw')}
                    >
                      <Text style={[styles.optionPillText, currentResult === option.value && styles.optionPillTextActive]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )
          })}

          <TouchableOpacity
            style={[styles.bookingConfirmBtn, savingResults && styles.bookingConfirmBtnDisabled]}
            onPress={saveMatchResults}
            disabled={savingResults}
          >
            <Text style={styles.bookingConfirmBtnText}>
              {savingResults ? 'Đang gửi kết quả...' : session.results_status === 'disputed' ? 'Gửi lại kết quả đã sửa' : 'Gửi kết quả để xác nhận'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

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
      ) : isPendingCompletion ? (
        <View style={styles.pendingBtn}>
          <Text style={styles.pendingBtnText}>Kèo đang chờ host xác nhận kết quả</Text>
        </View>
      ) : isCancelled ? (
        <View style={styles.fullBtn}>
          <Text style={styles.fullBtnText}>Kèo đã bị huỷ</Text>
        </View>
      ) : (
        <>
          {!isHost && (
            hasJoined ? (
              null
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
              {isEditingSession ? (
                <View style={styles.hostActionsCard}>
                  <View style={styles.hostActionsHeader}>
                    <View style={styles.hostActionsCopy}>
                      <Text style={styles.hostActionsTitle}>Chỉnh sửa kèo</Text>
                      <Text style={styles.hostActionsSub}>
                        Khi lưu thay đổi, người đã join kèo sẽ nhận được notification cập nhật.
                      </Text>
                    </View>
                  </View>

                  <View style={styles.editSessionForm}>
                    {session.court_booking_status !== 'confirmed' ? (
                      <>
                        <View style={styles.editField}>
                          <Text style={styles.editFieldLabel}>Ngày chơi</Text>
                          <TouchableOpacity style={styles.timePickerBtn} onPress={openEditDatePicker}>
                            <Text style={styles.timePickerText}>{formatDateLabel(editSessionDate)}</Text>
                          </TouchableOpacity>
                        </View>

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
                      </>
                    ) : (
                      <View style={styles.lockedFieldCard}>
                        <Text style={styles.lockedFieldTitle}>Kèo đã chốt sân</Text>
                        <Text style={styles.lockedFieldText}>
                          Ngày chơi và khung giờ đã được khóa để tránh lệch với booking sân đã xác nhận.
                        </Text>
                      </View>
                    )}

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

                    <View style={styles.editField}>
                      <Text style={styles.editFieldLabel}>Trình độ tối thiểu</Text>
                      <View style={styles.optionPillRow}>
                        {SKILL_ASSESSMENT_LEVELS.map((level) => (
                          <TouchableOpacity
                            key={`min-${level.id}`}
                            style={[styles.optionPill, editEloMin === level.starting_elo && styles.optionPillActive]}
                            onPress={() => setEditEloMin(level.starting_elo)}
                          >
                            <Text style={[styles.optionPillText, editEloMin === level.starting_elo && styles.optionPillTextActive]}>
                              {level.title}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    <View style={styles.editField}>
                      <Text style={styles.editFieldLabel}>Trình độ tối đa</Text>
                      <View style={styles.optionPillRow}>
                        {SKILL_ASSESSMENT_LEVELS.map((level) => (
                          <TouchableOpacity
                            key={`max-${level.id}`}
                            style={[styles.optionPill, editEloMax === level.starting_elo && styles.optionPillActive]}
                            onPress={() => setEditEloMax(level.starting_elo)}
                          >
                            <Text style={[styles.optionPillText, editEloMax === level.starting_elo && styles.optionPillTextActive]}>
                              {level.title}
                            </Text>
                          </TouchableOpacity>
                        ))}
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
                </View>
              ) : null}

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
      {showEditDatePicker && session ? (
        <DateTimePicker
          value={editSessionDate ? new Date(`${editSessionDate}T00:00:00`) : new Date(session.slot.start_time)}
          mode="date"
          display="spinner"
          themeVariant="light"
          onChange={handleEditDateChange}
        />
      ) : null}
    </ScrollView>
    {showStickyFooter ? (
      <View
        className="flex-row gap-3 border-t border-slate-200 bg-white/95 p-4"
        style={{ marginHorizontal: -20, paddingHorizontal: 20, paddingBottom: Math.max(insets.bottom, 16) }}
      >
        {isHost ? (
          <>
            <TouchableOpacity
              className="h-12 flex-1 items-center justify-center rounded-[14px] border border-rose-100 bg-rose-50"
              onPress={cancelSession}
              disabled={cancelling}
              activeOpacity={0.9}
            >
              <Text className="text-[14px] font-bold text-rose-600">
                {cancelling ? 'Đang huỷ...' : 'Huỷ kèo'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="h-12 flex-[1.5] items-center justify-center rounded-[14px] bg-emerald-600"
              onPress={() => setIsEditingSession((prev) => !prev)}
              activeOpacity={0.9}
            >
              <Text className="text-[14px] font-bold text-white">
                {isEditingSession ? 'Đóng chỉnh sửa' : 'Chỉnh sửa kèo'}
              </Text>
            </TouchableOpacity>
          </>
        ) : hasJoined ? (
          <TouchableOpacity
            className="h-12 flex-1 items-center justify-center rounded-[14px] border border-rose-100 bg-rose-50"
            onPress={leaveSession}
            disabled={leaving}
            activeOpacity={0.9}
          >
            <Text className="text-[14px] font-bold text-rose-600">
              {leaving ? 'Đang rời...' : 'Rời kèo'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    ) : null}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f4', paddingHorizontal: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f4' },
  heroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 20,
    marginBottom: 18,
    shadowColor: '#0f172a',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#64748b',
    marginBottom: 8,
  },
  heroBadgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  heroMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  backBtn: { },
  backText: { fontSize: 14, color: '#16a34a', fontWeight: '600' },
  courtTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 },
  courtName: { fontSize: 24, fontWeight: '900', color: '#020617', flex: 1 },
  address: { fontSize: 14, color: '#64748b', lineHeight: 20, flex: 1 },
  topActionInline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  approvalBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#fefce8',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  approvalBadgeText: { fontSize: 13, color: '#92400e', fontWeight: '600' },
  bookingBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  bookingBadgeText: { fontSize: 13, fontWeight: '700' },
  bookingInfoCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  bookingInfoTitle: { fontSize: 15, fontWeight: '800', color: '#0f172a', marginBottom: 8 },
  bookingInfoText: { fontSize: 13, color: '#475569', lineHeight: 20, marginBottom: 4 },
  sessionInfoBlock: { backgroundColor: '#f8fafc', borderRadius: 20, padding: 14, gap: 10, borderWidth: 1, borderColor: '#e2e8f0' },
  sessionInfoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  sessionInfoText: { flex: 1, fontSize: 13, fontWeight: '700', color: '#0f172a', lineHeight: 18 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, marginBottom: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  spotsLeft: { color: '#16a34a', fontWeight: '700', fontSize: 13 },
  spotsFull: { color: '#dc2626', fontWeight: '800', fontSize: 13 },
  playersCard: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  playerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, backgroundColor: '#f8fafc', borderRadius: 18, padding: 12 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#047857' },
  playerCopy: { flex: 1, marginRight: 12 },
  playerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  playerName: { fontSize: 15, color: '#0f172a', flexShrink: 1, fontWeight: '700' },
  hostIconBadge: { width: 24, height: 24, borderRadius: 999, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center' },
  provisionalIconBadge: { backgroundColor: '#fffbeb', width: 24, height: 24, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  playerSkillChip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, maxWidth: '44%' },
  playerSkillChipText: { flexShrink: 1, fontSize: 11, fontWeight: '800', color: '#334155' },
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
  resultCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 18,
    padding: 14,
    gap: 10,
  },
  resultPlayerName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  resultValueText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  resultStatusText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#64748b',
  },
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
    borderRadius: 18,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    backgroundColor: '#fff',
  },
  leaveBtnText: { color: '#dc2626', fontSize: 16, fontWeight: '600' },
  rateBtn: {
    backgroundColor: '#fefce8',
    borderWidth: 1.5,
    borderColor: '#fbbf24',
    borderRadius: 18,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  rateBtnText: { color: '#92400e', fontSize: 16, fontWeight: '700' },
  doneStateBtn: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1.5,
    borderColor: '#86efac',
    borderRadius: 18,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
  },
  doneStateText: { color: '#166534', fontSize: 16, fontWeight: '700' },
  fullBtn: {
    backgroundColor: '#f3f4f6',
    borderRadius: 18,
    height: 56,
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
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 18,
    marginTop: 24,
    gap: 14,
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
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
    backgroundColor: '#ecfdf5',
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
  optionPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionPill: {
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  optionPillActive: {
    borderColor: '#16a34a',
    backgroundColor: '#f0fdf4',
  },
  optionPillText: {
    fontSize: 13,
    color: '#4b5563',
    fontWeight: '600',
  },
  optionPillTextActive: {
    color: '#166534',
  },
  lockedFieldCard: {
    borderWidth: 1,
    borderColor: '#fde68a',
    backgroundColor: '#fffbeb',
    borderRadius: 18,
    padding: 14,
  },
  lockedFieldTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 6,
  },
  lockedFieldText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#a16207',
  },
  editFieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 6,
  },
  timePickerBtn: {
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 52,
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
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 18,
    marginTop: 24,
    gap: 10,
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  bookingEditorText: { fontSize: 13, color: '#6b7280', lineHeight: 18 },
  bookingOpenBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 16,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingOpenBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  bookingInput: {
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 52,
    fontSize: 14,
    color: '#111',
    backgroundColor: '#fff',
  },
  bookingNotesInput: { height: 90, paddingTop: 14, textAlignVertical: 'top' },
  bookingConfirmBtn: {
    backgroundColor: '#111827',
    borderRadius: 16,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingConfirmBtnDisabled: { opacity: 0.65 },
  bookingConfirmBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  hostNote: {
    backgroundColor: '#ecfdf5',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  hostNoteText: { color: '#16a34a', fontSize: 14, fontWeight: '600' },
  cancelBtn: {
    borderWidth: 1.5,
    borderColor: '#dc2626',
    borderRadius: 18,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    backgroundColor: '#fff',
  },
  cancelBtnDisabled: { borderColor: '#fca5a5', opacity: 0.6 },
  cancelBtnText: { color: '#dc2626', fontSize: 16, fontWeight: '600' },

  topRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, marginTop: 4 },
  shareBtn:      { borderWidth: 1.5, borderColor: '#16a34a', borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, backgroundColor: '#ecfdf5' },
  shareBtnText:  { fontSize: 13, color: '#047857', fontWeight: '700' },
  successBanner: { backgroundColor: '#dcfce7', borderRadius: 20, padding: 14, marginBottom: 16 },
  successBannerText: { fontSize: 13, color: '#166534', fontWeight: '700', textAlign: 'center', lineHeight: 18 },
})
