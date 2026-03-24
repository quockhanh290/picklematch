import DateTimePicker, { DateTimePickerAndroid, type DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { HostRequestReview } from '@/components/session/HostRequestReview'
import { JoinRequestModal } from '@/components/session/JoinRequestModal'
import { SmartJoinButton } from '@/components/session/SmartJoinButton'
import { getMatchStatus } from '@/lib/matchmaking'
import {
  getSkillLevelFromEloRange,
  getSkillScoreFromEloRange,
  getSkillScoreFromPlayer,
  SKILL_ASSESSMENT_LEVELS,
} from '@/lib/skillAssessment'
import { supabase } from '@/lib/supabase'
import { insertNotification } from '@/lib/notifications'
import * as Linking from 'expo-linking'
import { router, useLocalSearchParams } from 'expo-router'
import { ArrowLeft, CalendarDays, MapPin, Share2, ShieldAlert, ShieldCheck, Wallet } from 'lucide-react-native'
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
  host: { id: string; name: string; auto_accept?: boolean; is_provisional?: boolean; placement_matches_played?: number }
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
    player: { name: string }
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
        host:host_id ( id, name, auto_accept, is_provisional, placement_matches_played ),
        slot:slot_id (
          id, start_time, end_time, price,
          court:court_id ( name, address, city, booking_url, google_maps_url )
          ),
          session_players (
            player_id, status, match_result, proposed_result, host_unprofessional_reported_at, host_unprofessional_report_note, result_confirmation_status, result_dispute_note,
            player:player_id ( name )
          )
        `

    const legacySelect = `
        id, elo_min, elo_max, max_players, status, require_approval, fill_deadline,
        court_booking_status, booking_reference, booking_name, booking_phone, booking_notes, booking_confirmed_at,
        host:host_id ( id, name, auto_accept, is_provisional, placement_matches_played ),
        slot:slot_id (
          id, start_time, end_time, price,
          court:court_id ( name, address, city, booking_url, google_maps_url )
        ),
        session_players (
          player_id, status, match_result,
          player:player_id ( name )
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
          name: player?.name ?? 'NgÆ°á»i chÆ¡i',
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
    if (!dateKey) return 'Chá»n ngÃ y'
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
    if (changes.length === 0) return 'Host vá»«a cáº­p nháº­t má»™t sá»‘ thÃ´ng tin cá»§a kÃ¨o.'
    return `Host vá»«a cáº­p nháº­t kÃ¨o: ${changes.join(', ')}. Vui lÃ²ng kiá»ƒm tra láº¡i chi tiáº¿t kÃ¨o nhÃ©.`
  }

  function hasBookingInfo() {
    return [bookingReference, bookingName, bookingPhone, bookingNotes].some((value) => value.trim().length > 0)
  }

  function bookingStatusConfig(status: 'confirmed' | 'unconfirmed') {
    if (status === 'confirmed') {
      return {
        bg: '#f0fdf4',
        text: '#166534',
        label: 'SÃ¢n Ä‘Ã£ xÃ¡c nháº­n',
      }
    }

    return {
      bg: '#fffbeb',
      text: '#92400e',
      label: 'SÃ¢n chÆ°a xÃ¡c nháº­n',
    }
  }

  async function openCourtBookingLink() {
    const url = session?.slot?.court?.booking_url ?? session?.slot?.court?.google_maps_url
    if (!url) {
      Alert.alert('ChÆ°a cÃ³ link Ä‘áº·t sÃ¢n', 'SÃ¢n nÃ y chÆ°a cÃ³ link booking. Báº¡n váº«n cÃ³ thá»ƒ tá»± Ä‘áº·t rá»“i nháº­p thÃ´ng tin booking bÃªn dÆ°á»›i.')
      return
    }

    try {
      await Linking.openURL(url)
    } catch {
      Alert.alert('KhÃ´ng má»Ÿ Ä‘Æ°á»£c link', 'Vui lÃ²ng thá»­ láº¡i hoáº·c má»Ÿ link booking cá»§a sÃ¢n theo cÃ¡ch khÃ¡c.')
    }
  }

  async function confirmCourtBooking() {
    if (!session || !myId || myId !== session.host.id) return
    if (!hasBookingInfo()) {
      Alert.alert('Thiáº¿u thÃ´ng tin booking', 'HÃ£y nháº­p Ã­t nháº¥t má»™t thÃ´ng tin booking Ä‘á»ƒ xÃ¡c nháº­n sÃ¢n.')
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
      Alert.alert('Lá»—i', error.message)
      return
    }

    setSession((prev) => (prev ? { ...prev, ...payload } : prev))
    Alert.alert('ÄÃ£ xÃ¡c nháº­n sÃ¢n', 'ThÃ´ng tin booking Ä‘Ã£ Ä‘Æ°á»£c lÆ°u cho kÃ¨o nÃ y.')
  }

  async function saveSessionEdits() {
    if (!session || !isHost) return

    if (!editSessionDate) {
      Alert.alert('Thiáº¿u ngÃ y chÆ¡i', 'Vui lÃ²ng chá»n ngÃ y cho kÃ¨o.')
      return
    }

    if (!isValidClockValue(editStartTime) || !isValidClockValue(editEndTime)) {
      Alert.alert('Giá» khÃ´ng há»£p lá»‡', 'Vui lÃ²ng nháº­p giá» theo Ä‘á»‹nh dáº¡ng HH:MM.')
      return
    }

    const nextMaxPlayers = parseInt(editMaxPlayers, 10)
    const nextPrice = parseInt(editPrice.replace(/\D/g, ''), 10)
    const nextEloMin = Number(editEloMin)
    const nextEloMax = Number(editEloMax)

    if (!nextMaxPlayers || nextMaxPlayers < session.session_players.length) {
      Alert.alert('Sá»‘ ngÆ°á»i khÃ´ng há»£p lá»‡', 'Max players khÃ´ng Ä‘Æ°á»£c nhá» hÆ¡n sá»‘ ngÆ°á»i Ä‘ang cÃ³ trong kÃ¨o.')
      return
    }

    if (nextEloMin > nextEloMax) {
      Alert.alert('TrÃ¬nh Ä‘á»™ khÃ´ng há»£p lá»‡', 'TrÃ¬nh Ä‘á»™ tá»‘i thiá»ƒu khÃ´ng thá»ƒ cao hÆ¡n trÃ¬nh Ä‘á»™ tá»‘i Ä‘a.')
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
      Alert.alert('Giá» káº¿t thÃºc khÃ´ng há»£p lá»‡', 'Giá» káº¿t thÃºc pháº£i sau giá» báº¯t Ä‘áº§u.')
      return
    }

    const changedFields: string[] = []

    if (editStartTime !== formatClockInput(session.slot.start_time) || editEndTime !== formatClockInput(session.slot.end_time)) {
      changedFields.push(`giá» chÆ¡i ${editStartTime} â†’ ${editEndTime}`)
    }
    if (session.court_booking_status !== 'confirmed' && editSessionDate !== formatDateInput(session.slot.start_time)) {
      changedFields.push(`ngÃ y chÆ¡i ${formatDateLabel(formatDateInput(session.slot.start_time))} â†’ ${formatDateLabel(editSessionDate)}`)
    }
    if (nextMaxPlayers !== session.max_players) {
      changedFields.push(`sá»‘ chá»— ${session.max_players} â†’ ${nextMaxPlayers}`)
    }
    if (nextPrice !== session.slot.price) {
      changedFields.push(`giÃ¡ ${(session.slot.price ?? 0).toLocaleString('vi-VN')}Ä‘ â†’ ${nextPrice.toLocaleString('vi-VN')}Ä‘`)
    }
    if (nextEloMin !== session.elo_min || nextEloMax !== session.elo_max) {
      changedFields.push(`trÃ¬nh Ä‘á»™ ${skillLabel(session.elo_min, session.elo_max)} â†’ ${skillLabel(nextEloMin, nextEloMax)}`)
    }
    if (editRequireApproval !== session.require_approval) {
      changedFields.push(editRequireApproval ? 'báº­t duyá»‡t tay' : 'táº¯t duyá»‡t tay')
    }
    if (changedFields.length === 0) {
      setIsEditingSession(false)
      Alert.alert('KhÃ´ng cÃ³ thay Ä‘á»•i', 'Báº¡n chÆ°a chá»‰nh sá»­a thÃ´ng tin nÃ o cá»§a kÃ¨o.')
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
      Alert.alert('Lá»—i', slotError.message)
      return
    }

    if (!updatedSlots || updatedSlots.length === 0) {
      setSavingSessionEdit(false)
      Alert.alert('KhÃ´ng lÆ°u Ä‘Æ°á»£c thay Ä‘á»•i', 'Host chÆ°a cÃ³ quyá»n cáº­p nháº­t khung giá» cá»§a kÃ¨o nÃ y. HÃ£y cháº¡y migration policy má»›i trong Supabase.')
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
      Alert.alert('Lá»—i', sessionError.message)
      return
    }

    if (!updatedSessions || updatedSessions.length === 0) {
      Alert.alert('KhÃ´ng lÆ°u Ä‘Æ°á»£c thay Ä‘á»•i', 'Host chÆ°a cÃ³ quyá»n cáº­p nháº­t thÃ´ng tin kÃ¨o nÃ y. HÃ£y cháº¡y migration policy má»›i trong Supabase.')
      return
    }

    const playerIdsToNotify = session.session_players
      .filter((player) => player.player_id !== session.host.id)
      .map((player) => player.player_id)

    await Promise.all(
      playerIdsToNotify.map((playerId) =>
        insertNotification(
          playerId,
          'KÃ¨o vá»«a Ä‘Æ°á»£c cáº­p nháº­t',
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
    Alert.alert('ÄÃ£ cáº­p nháº­t kÃ¨o', 'Nhá»¯ng ngÆ°á»i Ä‘Ã£ join kÃ¨o Ä‘Ã£ Ä‘Æ°á»£c thÃ´ng bÃ¡o vá» thay Ä‘á»•i má»›i.')
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
      Alert.alert('Lá»—i', error.message)
      return
    }

    const playerIdsToNotify = session.session_players
      .filter((player) => player.player_id !== session.host.id)
      .map((player) => player.player_id)

    await Promise.all(
      playerIdsToNotify.map((playerId) =>
        insertNotification(
          playerId,
          'Host Ä‘Ã£ gá»­i káº¿t quáº£ tráº­n',
          'HÃ£y xÃ¡c nháº­n hoáº·c bÃ¡o sai káº¿t quáº£ trong chi tiáº¿t kÃ¨o. Káº¿t quáº£ sáº½ tá»± chá»‘t sau 24h náº¿u khÃ´ng ai pháº£n Ä‘á»‘i.',
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
    Alert.alert('ÄÃ£ gá»­i káº¿t quáº£', 'NgÆ°á»i chÆ¡i sáº½ cáº§n xÃ¡c nháº­n káº¿t quáº£. Achievement chá»‰ Ä‘Æ°á»£c tÃ­nh sau khi Ä‘á»§ xÃ¡c nháº­n hoáº·c háº¿t thá»i háº¡n 24h mÃ  khÃ´ng cÃ³ tranh cháº¥p.')
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
      Alert.alert('Lá»—i', error.message)
      return
    }

    if (response === 'disputed') {
      await insertNotification(
        session.host.id,
        'CÃ³ tranh cháº¥p káº¿t quáº£ tráº­n',
        `${myPlayer?.name ?? 'Má»™t ngÆ°á»i chÆ¡i'} Ä‘Ã£ bÃ¡o sai káº¿t quáº£ vÃ  yÃªu cáº§u host kiá»ƒm tra láº¡i.`,
        'session_results_disputed',
        `/session/${session.id}`,
      )
    }

    if (data === 'finalized') {
      Alert.alert('Káº¿t quáº£ Ä‘Ã£ chá»‘t', 'Káº¿t quáº£ tráº­n Ä‘Ã£ Ä‘á»§ Ä‘iá»u kiá»‡n xÃ¡c nháº­n vÃ  Ä‘Æ°á»£c chá»‘t chÃ­nh thá»©c.')
    } else if (response === 'confirmed') {
      Alert.alert('ÄÃ£ xÃ¡c nháº­n', 'Há»‡ thá»‘ng Ä‘Ã£ ghi nháº­n xÃ¡c nháº­n cá»§a báº¡n. Chá» cÃ¡c ngÆ°á»i chÆ¡i cÃ²n láº¡i hoáº·c háº¿t thá»i háº¡n 24h.')
    } else {
      Alert.alert('ÄÃ£ bÃ¡o sai káº¿t quáº£', 'Host Ä‘Ã£ Ä‘Æ°á»£c thÃ´ng bÃ¡o Ä‘á»ƒ kiá»ƒm tra láº¡i.')
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
        Alert.alert('Da bao truoc do', 'Ban da gui bao cao ve host cua keo nay roi.')
      } else {
        Alert.alert('Da gui bao cao', 'He thong da ghi nhan viec host khong xac nhan ket qua dung han.')
      }

      await fetchSession(myId)
      return
    }

    if (error) {
      Alert.alert('Lá»—i', error.message)
      return
    }

    if (data === 'already_reported') {
      Alert.alert('ÄÃ£ vÃ´ hiá»‡u kÃ¨o', 'Äa sá»‘ ngÆ°á»i chÆ¡i Ä‘Ã£ bÃ¡o tráº­n Ä‘áº¥u khÃ´ng diá»…n ra. KÃ¨o nÃ y Ä‘Ã£ bá»‹ vÃ´ hiá»‡u.')
    } else if (data === 'member_finalized') {
      Alert.alert('ÄÃ£ chá»‘t báº±ng Ä‘á»“ng thuáº­n', 'NgÆ°á»i chÆ¡i Ä‘Ã£ Ä‘á»§ Ä‘á»“ng thuáº­n Ä‘á»ƒ Ä‘Ã³ng kÃ¨o vÃ  má»Ÿ bÆ°á»›c háº­u tráº­n.')
    } else {
      Alert.alert('ÄÃ£ gá»­i bÃ¡o cÃ¡o', 'BÃ¡o cÃ¡o káº¿t quáº£ cá»§a báº¡n Ä‘Ã£ Ä‘Æ°á»£c ghi nháº­n.')
    }

    await fetchSession(myId)
  }

  async function directJoinSession() {
    if (!myId) {
      Alert.alert('Cáº§n Ä‘Äƒng nháº­p', 'Báº¡n cáº§n Ä‘Äƒng nháº­p Ä‘á»ƒ tham gia kÃ¨o nÃ y', [
        { text: 'Huá»·', style: 'cancel' },
        { text: 'ÄÄƒng nháº­p', onPress: () => router.push('/login') },
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
      Alert.alert('Lá»—i', error.message)
      return
    }

    Alert.alert('Tham gia thÃ nh cÃ´ng', 'Báº¡n Ä‘Ã£ vÃ o kÃ¨o nÃ y rá»“i nhÃ©.')
    setRequestStatus('accepted')
    await fetchSession(myId)
  }

  async function sendJoinRequest(mode: RequestStatus | 'waitlist', noteOverride?: string) {
    if (!myId) {
      Alert.alert('Cáº§n Ä‘Äƒng nháº­p', 'Báº¡n cáº§n Ä‘Äƒng nháº­p Ä‘á»ƒ gá»­i yÃªu cáº§u', [
        { text: 'Huá»·', style: 'cancel' },
        { text: 'ÄÄƒng nháº­p', onPress: () => router.push('/login') },
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
      Alert.alert('Lá»—i', error.message)
      return
    }

    setRequestStatus('pending')
    setJoinModalVisible(false)
    setMyHostTemplate(null)
    Alert.alert(
      mode === 'waitlist' ? 'ÄÃ£ Ä‘Äƒng kÃ½ dá»± bá»‹' : 'ÄÃ£ gá»­i yÃªu cáº§u',
      mode === 'waitlist' ? 'Host sáº½ tháº¥y báº¡n trong danh sÃ¡ch dá»± bá»‹ náº¿u cÃ³ slot trá»‘ng.' : 'Chá» host duyá»‡t nhÃ©.'
    )

    // Notify host
    if (myPlayer) {
      const slotTime = new Date(session.slot.start_time)
        .toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      await insertNotification(
        session.host.id,
        mode === 'waitlist' ? 'CÃ³ ngÆ°á»i Ä‘Äƒng kÃ½ dá»± bá»‹' : 'CÃ³ ngÆ°á»i muá»‘n join kÃ¨o!',
        `${myPlayer.name} (Elo ${myPlayer.current_elo ?? myPlayer.elo}) gá»­i yÃªu cáº§u vÃ o kÃ¨o lÃºc ${slotTime}`,
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
      Alert.alert('Lá»—i', reqErr.message)
      return
    }

    const { error: playerErr } = await supabase.from('session_players').insert({
      session_id: session.id,
      player_id: playerId,
      status: 'confirmed',
    })
    if (playerErr) {
      console.warn('[approveRequest] insert session_players failed:', playerErr.message)
      Alert.alert('Lá»—i', playerErr.message)
      return
    }

    // Optimistically remove from pending list immediately
    setPendingRequests((prev) => prev.filter((r) => r.id !== requestId))

    Alert.alert('ÄÃ£ duyá»‡t', 'NgÆ°á»i chÆ¡i Ä‘Ã£ Ä‘Æ°á»£c thÃªm vÃ o kÃ¨o.')

    console.log('[approveRequest] sending notification to player:', playerId)
    const slotTime = new Date(session.slot.start_time)
      .toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    await insertNotification(
      playerId,
      'ÄÆ°á»£c duyá»‡t!',
      `Báº¡n Ä‘Ã£ Ä‘Æ°á»£c cháº¥p nháº­n vÃ o kÃ¨o lÃºc ${slotTime}`,
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
      Alert.alert('Lá»—i', error.message)
      return
    }

    // Optimistically remove from pending list immediately
    setPendingRequests((prev) => prev.filter((r) => r.id !== requestId))

    Alert.alert('ÄÃ£ tá»« chá»‘i.')

    console.log('[rejectRequest] sending notification to player:', playerId)
    await insertNotification(
      playerId,
      'ChÆ°a phÃ¹ há»£p',
      'Host Ä‘Ã£ tá»« chá»‘i yÃªu cáº§u tham gia',
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
      Alert.alert('Lá»—i', error.message)
      return
    }

    setPendingRequests((prev) =>
      prev.map((request) =>
        request.id === requestId ? { ...request, host_response_template: template } : request
      )
    )

    await insertNotification(
      playerId,
      'Host Ä‘Ã£ pháº£n há»“i yÃªu cáº§u',
      template,
      'join_request_reply',
      `/session/${session.id}`,
    )

    Alert.alert('ÄÃ£ gá»­i pháº£n há»“i', 'Template Ä‘Ã£ Ä‘Æ°á»£c lÆ°u vÃ  gá»­i cho ngÆ°á»i chÆ¡i.')
  }

  async function leaveSession() {
    if (!myId || !session) return

    Alert.alert('Rá»i kÃ¨o?', 'Báº¡n cháº¯c muá»‘n rá»i kÃ¨o nÃ y khÃ´ng?', [
      { text: 'Huá»·', style: 'cancel' },
      {
        text: 'Rá»i kÃ¨o',
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
            Alert.alert('Lá»—i', error.message)
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
              'NgÆ°á»i chÆ¡i Ä‘Ã£ rá»i kÃ¨o',
              `${leavingPlayer?.player?.name ?? 'Má»™t ngÆ°á»i chÆ¡i'} Ä‘Ã£ rá»i kÃ¨o lÃºc ${slotTime}.`,
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
    const alertTitle = isFull ? 'KÃ¨o Ä‘Ã£ Ä‘á»§ ngÆ°á»i' : 'Huá»· kÃ¨o?'
    const alertMessage = isFull
      ? 'KÃ¨o Ä‘Ã£ Ä‘á»§ ngÆ°á»i chÆ¡i, huá»· kÃ¨o nÃ y sáº½ áº£nh hÆ°á»Ÿng Ä‘áº¿n tá»· lá»‡ huá»· kÃ¨o cá»§a báº¡n. Báº¡n cÃ³ cháº¯c khÃ´ng?'
      : 'KÃ¨o sáº½ bá»‹ huá»· vÃ  táº¥t cáº£ ngÆ°á»i chÆ¡i sáº½ bá»‹ xoÃ¡. KhÃ´ng thá»ƒ hoÃ n tÃ¡c!'

    Alert.alert(alertTitle, alertMessage, [
      { text: 'KhÃ´ng', style: 'cancel' },
      {
        text: 'Huá»· kÃ¨o',
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
            Alert.alert('Lá»—i', error.message)
            return
          }

          await Promise.all(
            playerIdsToNotify.map((playerId) =>
              insertNotification(
                playerId,
                'Host Ä‘Ã£ huá»· kÃ¨o',
                `KÃ¨o lÃºc ${slotTime} Ä‘Ã£ bá»‹ host huá»·.`,
                'session_cancelled',
                `/session/${session.id}`,
              )
            )
          )

          Alert.alert('ÄÃ£ huá»· kÃ¨o', 'KÃ¨o cá»§a báº¡n Ä‘Ã£ Ä‘Æ°á»£c huá»·.', [
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
    const weekday = ['Chá»§ nháº­t', 'Thá»© 2', 'Thá»© 3', 'Thá»© 4', 'Thá»© 5', 'Thá»© 6', 'Thá»© 7'][s.getDay()]
    const day = `${s.getDate().toString().padStart(2, '0')}/${(s.getMonth() + 1).toString().padStart(2, '0')}`
    return `${weekday}, ${day} Â· ${fmt(s)} â†’ ${fmt(e)}`
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
        <Text style={{ color: '#888' }}>KhÃ´ng tÃ¬m tháº¥y kÃ¨o nÃ y</Text>
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
          <View style={styles.topActionInline}>
            <ArrowLeft size={16} color="#059669" />
            <Text style={styles.backText}>Quay láº¡i</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.shareBtn}
          onPress={() => {
            const url = Linking.createURL(`/session/${id}`)
            Share.share({ message: `Tham gia kÃ¨o pickleball nÃ y nhÃ©! ${url}` })
          }}
        >
          <View style={styles.topActionInline}>
            <Share2 size={15} color="#047857" />
            <Text style={styles.shareBtnText}>Chia sáº»</Text>
          </View>
        </TouchableOpacity>
      </View>

      {created === '1' && (
        <View style={styles.successBanner}>
          <Text style={styles.successBannerText}>KÃ¨o Ä‘Ã£ Ä‘Æ°á»£c Ä‘Äƒng. Chia sáº» link Ä‘á»ƒ má»i ngÆ°á»i chÆ¡i.</Text>
        </View>
      )}

      <View style={styles.heroCard}>
        <Text style={styles.eyebrow}>Session Detail</Text>
        <Text style={styles.courtName}>{court?.name}</Text>
        <View style={styles.heroMetaRow}>
          <MapPin size={15} color="#6b7280" />
          <Text style={styles.address}>{court?.address} Â· {court?.city}</Text>
        </View>

        <View style={styles.heroBadgeRow}>
          {session.require_approval && (
            <View style={styles.approvalBadge}>
              <View style={styles.topActionInline}>
                <ShieldAlert size={14} color="#92400e" />
                <Text style={styles.approvalBadgeText}>KÃ¨o duyá»‡t tay</Text>
              </View>
            </View>
          )}

          <View style={[styles.bookingBadge, { backgroundColor: bookingCfg.bg }]}>
            <View style={styles.topActionInline}>
              {session.court_booking_status === 'confirmed' ? (
                <ShieldCheck size={14} color={bookingCfg.text} />
              ) : (
                <ShieldAlert size={14} color={bookingCfg.text} />
              )}
              <Text style={[styles.bookingBadgeText, { color: bookingCfg.text }]}>{bookingCfg.label}</Text>
            </View>
          </View>
        </View>

        {(session.booking_reference || session.booking_name || session.booking_phone || session.booking_notes) && (
          <View style={styles.bookingInfoCard}>
            <Text style={styles.bookingInfoTitle}>ThÃ´ng tin booking</Text>
            {session.booking_reference && <Text style={styles.bookingInfoText}>MÃ£ booking: {session.booking_reference}</Text>}
            {session.booking_name && <Text style={styles.bookingInfoText}>NgÆ°á»i Ä‘áº·t: {session.booking_name}</Text>}
            {session.booking_phone && <Text style={styles.bookingInfoText}>Sá»‘ Ä‘iá»‡n thoáº¡i: {session.booking_phone}</Text>}
            {session.booking_notes && <Text style={styles.bookingInfoText}>Ghi chÃº: {session.booking_notes}</Text>}
          </View>
        )}

        <View style={styles.infoRow}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Thá»i gian</Text>
            <View style={styles.infoInline}>
              <CalendarDays size={15} color="#4f46e5" />
              <Text style={styles.infoValue}>{formatTime(session.slot.start_time, session.slot.end_time)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={[styles.infoCard, { flex: 1 }]}>
            <Text style={styles.infoLabel}>TrÃ¬nh Ä‘á»™</Text>
            <Text style={styles.infoValue}>{skillLabel(session.elo_min, session.elo_max)}</Text>
          </View>
          <View style={[styles.infoCard, { flex: 1 }]}>
            <Text style={styles.infoLabel}>GiÃ¡</Text>
            <View style={styles.infoInline}>
              <Wallet size={15} color="#111827" />
              <Text style={styles.infoValue}>{session.slot.price.toLocaleString('vi-VN')}Ä‘</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionTitle}>NgÆ°á»i chÆ¡i Â· {players.length}/{session.max_players}</Text>
        {session.status === 'open' && spotsLeft > 0 ? <Text style={styles.spotsLeft}>CÃ²n {spotsLeft} chá»—</Text> : null}
        {session.status === 'open' && spotsLeft <= 0 ? <Text style={styles.spotsFull}>ÄÃ£ Ä‘á»§ ngÆ°á»i</Text> : null}
      </View>

      <View style={styles.playersCard}>
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
            <Text style={styles.playerName}>{(p.player as any)?.name ?? 'â€”'}</Text>
          </TouchableOpacity>
        ))}

        {session.status === 'open' && Array.from({ length: Math.max(0, spotsLeft) }).map((_, i) => (
          <View key={i} style={[styles.playerRow, { opacity: 0.35 }]}>
            <View style={[styles.avatar, { backgroundColor: '#f0f0f0' }]}>
              <Text style={styles.avatarText}>?</Text>
            </View>
            <Text style={[styles.playerName, { color: '#bbb' }]}>Chá» ngÆ°á»i chÆ¡i...</Text>
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
              <Text style={styles.hostActionsTitle}>XÃ¡c nháº­n káº¿t quáº£ tráº­n</Text>
              <Text style={styles.hostActionsSub}>
                Host Ä‘Ã£ gá»­i káº¿t quáº£ cho kÃ¨o nÃ y. Báº¡n hÃ£y xÃ¡c nháº­n hoáº·c bÃ¡o sai Ä‘á»ƒ trÃ¡nh tÃ­nh Elo vÃ  achievement sai.
              </Text>
            </View>
          </View>

          <View style={styles.resultCard}>
            <Text style={styles.editFieldLabel}>Káº¿t quáº£ host gá»­i cho báº¡n</Text>
            <Text style={styles.resultValueText}>
              {(() => {
                const value = myResultRow.proposed_result ?? myResultRow.match_result ?? 'pending'
                if (value === 'win') return 'Tháº¯ng'
                if (value === 'loss') return 'Thua'
                if (value === 'draw') return 'HoÃ '
                return 'ChÆ°a chá»‘t'
              })()}
            </Text>
            <Text style={styles.resultStatusText}>
              {session.results_status === 'finalized'
                ? 'Káº¿t quáº£ Ä‘Ã£ Ä‘Æ°á»£c chá»‘t chÃ­nh thá»©c.'
                : myResultRow.result_confirmation_status === 'confirmed'
                  ? 'Báº¡n Ä‘Ã£ xÃ¡c nháº­n káº¿t quáº£ nÃ y.'
                  : myResultRow.result_confirmation_status === 'disputed'
                    ? 'Báº¡n Ä‘Ã£ bÃ¡o sai káº¿t quáº£. Chá» host cáº­p nháº­t láº¡i.'
                    : `Káº¿t quáº£ sáº½ tá»± chá»‘t sau 24h náº¿u khÃ´ng ai pháº£n Ä‘á»‘i. Háº¡n chÃ³t: ${session.results_confirmation_deadline ? new Date(session.results_confirmation_deadline).toLocaleString('vi-VN') : '24h'}`}
            </Text>
          </View>

          {session.results_status !== 'finalized' && myResultRow.result_confirmation_status !== 'confirmed' ? (
            <>
              <TextInput
                style={[styles.bookingInput, styles.bookingNotesInput]}
                placeholder="Náº¿u bÃ¡o sai, hÃ£y ghi ngáº¯n lÃ½ do Ä‘á»ƒ host kiá»ƒm tra láº¡i"
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
                    {respondingToResult ? 'Äang gá»­i...' : 'XÃ¡c nháº­n'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.cancelBtn, { flex: 1, marginTop: 0 }, respondingToResult && styles.cancelBtnDisabled]}
                  onPress={() => respondToSessionResult('disputed')}
                  disabled={respondingToResult}
                >
                  <Text style={styles.cancelBtnText}>BÃ¡o sai káº¿t quáº£</Text>
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
              <Text style={styles.hostActionsTitle}>BÃ¡o host khÃ´ng chuyÃªn nghiá»‡p</Text>
              <Text style={styles.hostActionsSub}>
                Host váº«n chÆ°a xÃ¡c nháº­n káº¿t quáº£ Ä‘Ãºng háº¡n. Báº¡n cÃ³ thá»ƒ gá»­i má»™t bÃ¡o cÃ¡o Ä‘á»ƒ há»‡ thá»‘ng ghi nháº­n.
              </Text>
            </View>
          </View>

          <TextInput
            style={[styles.bookingInput, styles.bookingNotesInput]}
            placeholder="Ghi chÃº thÃªm náº¿u cáº§n, vÃ­ dá»¥ host khÃ´ng chá»‘t kÃ¨o Ä‘Ãºng háº¡n"
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
              {reportingHostIssue ? 'Äang gá»­i...' : 'BÃ¡o host khÃ´ng chuyÃªn nghiá»‡p'}
            </Text>
          </TouchableOpacity>

          <Text style={styles.resultStatusText}>
            Náº¿u host váº«n khÃ´ng hoÃ n thÃ nh, há»‡ thá»‘ng sáº½ tá»± Ä‘á»™ng Ä‘Ã³ng kÃ¨o vá»›i káº¿t quáº£ hÃ²a Ä‘á»ƒ trÃ¡nh treo session.
          </Text>
        </View>
      ) : null}


      {isHost && (isDone || isPendingCompletion) ? (
        <View style={styles.hostActionsCard}>
          <View style={styles.hostActionsHeader}>
            <View style={styles.hostActionsCopy}>
              <Text style={styles.hostActionsTitle}>Káº¿t quáº£ tráº­n</Text>
              <Text style={styles.hostActionsSub}>
                Chá»n káº¿t quáº£ cho tá»«ng ngÆ°á»i rá»“i gá»­i sang bÆ°á»›c xÃ¡c nháº­n. Achievement chá»‰ Ä‘Æ°á»£c tÃ­nh sau khi ngÆ°á»i chÆ¡i xÃ¡c nháº­n hoáº·c háº¿t 24h mÃ  khÃ´ng ai tranh cháº¥p.
              </Text>
            </View>
          </View>

          {players.map((player) => {
            const currentResult = matchResults[player.player_id] ?? player.proposed_result ?? player.match_result ?? 'pending'
            const playerName =
              player.player_id === session.host.id ? session.host.name : (player.player as any)?.name ?? 'NgÆ°á»i chÆ¡i'

            return (
              <View key={`result-${player.player_id}`} style={styles.resultCard}>
                <Text style={styles.resultPlayerName}>{playerName}</Text>
                <Text style={styles.resultStatusText}>
                  {player.result_confirmation_status === 'confirmed'
                    ? 'ÄÃ£ xÃ¡c nháº­n'
                    : player.result_confirmation_status === 'disputed'
                      ? `Äang tranh cháº¥p${player.result_dispute_note ? ` Â· ${player.result_dispute_note}` : ''}`
                      : player.player_id === session.host.id
                        ? 'Host'
                        : 'Chá» ngÆ°á»i chÆ¡i xÃ¡c nháº­n'}
                </Text>
                <View style={styles.optionPillRow}>
                  {[
                    { value: 'win', label: 'Tháº¯ng' },
                    { value: 'loss', label: 'Thua' },
                    { value: 'draw', label: 'HoÃ ' },
                    { value: 'pending', label: 'ChÆ°a chá»‘t' },
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
              {savingResults ? 'Äang gá»­i káº¿t quáº£...' : session.results_status === 'disputed' ? 'Gá»­i láº¡i káº¿t quáº£ Ä‘Ã£ sá»­a' : 'Gá»­i káº¿t quáº£ Ä‘á»ƒ xÃ¡c nháº­n'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {canRateSession && alreadyRated ? (
        <View style={styles.doneStateBtn}>
          <Text style={styles.doneStateText}>Báº¡n Ä‘Ã£ Ä‘Ã¡nh giÃ¡ kÃ¨o nÃ y</Text>
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
          <Text style={styles.rateBtnText}>â­ ÄÃ¡nh giÃ¡ kÃ¨o nÃ y</Text>
        </TouchableOpacity>
      ) : isDone ? (
        <View style={styles.fullBtn}>
          <Text style={styles.fullBtnText}>KÃ¨o Ä‘Ã£ káº¿t thÃºc</Text>
        </View>
      ) : isPendingCompletion ? (
        <View style={styles.pendingBtn}>
          <Text style={styles.pendingBtnText}>KÃ¨o Ä‘ang chá» host xÃ¡c nháº­n káº¿t quáº£</Text>
        </View>
      ) : isCancelled ? (
        <View style={styles.fullBtn}>
          <Text style={styles.fullBtnText}>KÃ¨o Ä‘Ã£ bá»‹ huá»·</Text>
        </View>
      ) : (
        <>
          {!isHost && (
            hasJoined ? (
              <TouchableOpacity style={styles.leaveBtn} onPress={leaveSession} disabled={leaving}>
                <Text style={styles.leaveBtnText}>{leaving ? 'Äang rá»i...' : 'Rá»i kÃ¨o'}</Text>
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
                    <Text style={styles.hostActionsTitle}>Chá»‰nh sá»­a kÃ¨o</Text>
                    <Text style={styles.hostActionsSub}>
                      Khi lÆ°u thay Ä‘á»•i, ngÆ°á»i Ä‘Ã£ join kÃ¨o sáº½ nháº­n Ä‘Æ°á»£c notification cáº­p nháº­t.
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.editToggleBtn}
                    onPress={() => setIsEditingSession((prev) => !prev)}
                  >
                    <Text style={styles.editToggleBtnText}>{isEditingSession ? 'ÄÃ³ng' : 'Sá»­a kÃ¨o'}</Text>
                  </TouchableOpacity>
                </View>

                {isEditingSession && (
                  <View style={styles.editSessionForm}>
                    {session.court_booking_status !== 'confirmed' ? (
                      <>
                        <View style={styles.editField}>
                          <Text style={styles.editFieldLabel}>NgÃ y chÆ¡i</Text>
                          <TouchableOpacity style={styles.timePickerBtn} onPress={openEditDatePicker}>
                            <Text style={styles.timePickerText}>{formatDateLabel(editSessionDate)}</Text>
                          </TouchableOpacity>
                        </View>

                        <View style={styles.editRow}>
                          <View style={styles.editField}>
                            <Text style={styles.editFieldLabel}>Giá» báº¯t Ä‘áº§u</Text>
                            <TouchableOpacity style={styles.timePickerBtn} onPress={() => openEditTimePicker('start')}>
                              <Text style={styles.timePickerText}>{editStartTime || '11:00'}</Text>
                            </TouchableOpacity>
                          </View>
                          <View style={styles.editField}>
                            <Text style={styles.editFieldLabel}>Giá» káº¿t thÃºc</Text>
                            <TouchableOpacity style={styles.timePickerBtn} onPress={() => openEditTimePicker('end')}>
                              <Text style={styles.timePickerText}>{editEndTime || '13:30'}</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      </>
                    ) : (
                      <View style={styles.lockedFieldCard}>
                        <Text style={styles.lockedFieldTitle}>KÃ¨o Ä‘Ã£ chá»‘t sÃ¢n</Text>
                        <Text style={styles.lockedFieldText}>
                          NgÃ y chÆ¡i vÃ  khung giá» Ä‘Ã£ Ä‘Æ°á»£c khÃ³a Ä‘á»ƒ trÃ¡nh lá»‡ch vá»›i booking sÃ¢n Ä‘Ã£ xÃ¡c nháº­n.
                        </Text>
                      </View>
                    )}

                    <View style={styles.editRow}>
                      <View style={styles.editField}>
                        <Text style={styles.editFieldLabel}>Sá»‘ chá»— tá»‘i Ä‘a</Text>
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
                        <Text style={styles.editFieldLabel}>GiÃ¡ / ngÆ°á»i</Text>
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
                      <Text style={styles.editFieldLabel}>TrÃ¬nh Ä‘á»™ tá»‘i thiá»ƒu</Text>
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
                      <Text style={styles.editFieldLabel}>TrÃ¬nh Ä‘á»™ tá»‘i Ä‘a</Text>
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
                        <Text style={styles.editFieldLabel}>Duyá»‡t tay</Text>
                        <Text style={styles.editSwitchSub}>
                          Náº¿u báº­t, má»i yÃªu cáº§u má»›i sáº½ cáº§n host xÃ©t duyá»‡t thay vÃ¬ vÃ o tháº³ng.
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
                        {savingSessionEdit ? 'Äang lÆ°u thay Ä‘á»•i...' : 'LÆ°u thay Ä‘á»•i kÃ¨o'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {session.court_booking_status !== 'confirmed' && (
                <View style={styles.bookingEditorCard}>
                  <Text style={styles.sectionTitle}>XÃ¡c nháº­n Ä‘áº·t sÃ¢n</Text>
                  <Text style={styles.bookingEditorText}>
                    Cáº­p nháº­t tráº¡ng thÃ¡i sÃ¢n thÃ nh Ä‘Ã£ xÃ¡c nháº­n sau khi báº¡n cÃ³ thÃ´ng tin booking.
                  </Text>
                  <TouchableOpacity style={styles.bookingOpenBtn} onPress={openCourtBookingLink}>
                    <Text style={styles.bookingOpenBtnText}>Má»Ÿ link booking cá»§a sÃ¢n</Text>
                  </TouchableOpacity>
                  <TextInput
                    style={styles.bookingInput}
                    placeholder="MÃ£ booking / mÃ£ Ä‘áº·t sÃ¢n"
                    placeholderTextColor="#aaa"
                    value={bookingReference}
                    onChangeText={setBookingReference}
                  />
                  <TextInput
                    style={styles.bookingInput}
                    placeholder="TÃªn ngÆ°á»i Ä‘áº·t"
                    placeholderTextColor="#aaa"
                    value={bookingName}
                    onChangeText={setBookingName}
                  />
                  <TextInput
                    style={styles.bookingInput}
                    placeholder="Sá»‘ Ä‘iá»‡n thoáº¡i booking"
                    placeholderTextColor="#aaa"
                    keyboardType="phone-pad"
                    value={bookingPhone}
                    onChangeText={setBookingPhone}
                  />
                  <TextInput
                    style={[styles.bookingInput, styles.bookingNotesInput]}
                    placeholder="Ghi chÃº booking"
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
                      {savingBooking ? 'Äang lÆ°u...' : 'XÃ¡c nháº­n Ä‘Ã£ Ä‘áº·t sÃ¢n'}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {pendingRequests.length === 0 && (
                <View style={styles.hostNote}>
                  <Text style={styles.hostNoteText}>Báº¡n lÃ  host cá»§a kÃ¨o nÃ y</Text>
                </View>
              )}
              <TouchableOpacity
                style={[styles.cancelBtn, cancelling && styles.cancelBtnDisabled]}
                onPress={cancelSession}
                disabled={cancelling}
              >
                <Text style={styles.cancelBtnText}>
                  {cancelling ? 'Äang huá»·...' : 'Huá»· kÃ¨o'}
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
  courtName: { fontSize: 28, fontWeight: '900', color: '#020617', marginBottom: 8 },
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
  infoRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  infoCard: { backgroundColor: '#f8fafc', borderRadius: 20, padding: 16, flex: 1, borderWidth: 1, borderColor: '#e2e8f0' },
  infoLabel: { fontSize: 12, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.8, fontWeight: '700' },
  infoValue: { fontSize: 15, fontWeight: '700', color: '#0f172a', lineHeight: 22 },
  infoInline: { flexDirection: 'row', alignItems: 'center', gap: 8 },
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
    backgroundColor: '#dcfce7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#16a34a' },
  playerName: { fontSize: 15, color: '#0f172a', flex: 1, fontWeight: '700' },
  hostBadge: { backgroundColor: '#dcfce7', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  hostBadgeText: { fontSize: 12, color: '#16a34a', fontWeight: '600' },
  provisionalHostBadge: {
    backgroundColor: '#fffbeb',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
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
