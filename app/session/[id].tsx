import { router, useLocalSearchParams } from 'expo-router'
import * as Linking from 'expo-linking'
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  CreditCard,
  MapPin,
  Repeat2,
  Shield,
  Share2,
  Trophy,
} from 'lucide-react-native'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { JoinRequestModal } from '@/components/session/JoinRequestModal'
import { SmartJoinButton } from '@/components/session/SmartJoinButton'
import { getEloBandByLegacySkillLabel, getEloBandForElo, getEloBandForSessionRange, getShortLabelForLevelId } from '@/lib/eloSystem'
import { getMatchStatus, type MatchStatus } from '@/lib/matchmaking'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/useAuth'

type SessionPlayer = {
  player_id: string
  team_no?: 1 | 2 | null
  player: {
    name: string
    elo?: number | null
    current_elo?: number | null
    self_assessed_level?: string | null
    skill_label?: string | null
    reliability_score?: number | null
    sessions_joined?: number | null
    no_show_count?: number | null
  } | null
}

type SessionDetailRecord = {
  id: string
  max_players: number
  elo_min: number
  elo_max: number
  status: string
  require_approval: boolean
  court_booking_status: 'confirmed' | 'unconfirmed'
  booking_reference?: string | null
  booking_name?: string | null
  booking_phone?: string | null
  booking_notes?: string | null
  host: {
    id: string
    name: string
    auto_accept?: boolean | null
    elo?: number | null
    current_elo?: number | null
    self_assessed_level?: string | null
    skill_label?: string | null
    reliability_score?: number | null
    sessions_joined?: number | null
    no_show_count?: number | null
  }
  slot: {
    id?: string
    start_time: string
    end_time: string
    price: number
    court: {
      id?: string
      name: string
      address: string
      city: string
    }
  }
  session_players: SessionPlayer[]
}

type ArrangementPlayer = {
  id: string
  name: string
  elo: number
  team: 1 | 2
  reliability: number | null
  skillTag: string
}

type RequestStatus = 'none' | 'pending' | 'accepted' | 'rejected'

type ViewerPlayer = {
  id: string
  elo?: number | null
  current_elo?: number | null
}

function safeNumber(value?: number | null) {
  return Math.round(value ?? 0)
}

function getComparableElo(player?: {
  elo?: number | null
  current_elo?: number | null
} | null) {
  return safeNumber(player?.current_elo ?? player?.elo ?? 0)
}

function getInitials(name?: string | null) {
  return (name ?? '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function getReliability(player?: {
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

function getSkillTag(player?: {
  self_assessed_level?: string | null
  skill_label?: string | null
  current_elo?: number | null
  elo?: number | null
} | null) {
  const levelId = player?.self_assessed_level
  if (levelId) return getShortLabelForLevelId(levelId)

  const legacy = player?.skill_label
  if (legacy) return getEloBandByLegacySkillLabel(legacy).shortLabel

  const elo = getComparableElo(player)
  return getEloBandForElo(elo)?.shortLabel ?? 'Cọ xát'
}

function getSessionSkillLabel(eloMin: number, eloMax: number) {
  return getEloBandForSessionRange(eloMin, eloMax).shortLabel
}

function formatTimeRange(start: string, end: string) {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const weekdays = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
  const dateLabel = `${String(startDate.getDate()).padStart(2, '0')}/${String(startDate.getMonth() + 1).padStart(2, '0')}`
  const timeLabel = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')} ? ${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`
  return `${weekdays[startDate.getDay()]}, ${dateLabel} ? ${timeLabel}`
}

function formatPricePerPerson(totalPrice: number, maxPlayers: number) {
  if (!totalPrice || !maxPlayers) return 'Miễn phí'
  return `${Math.ceil(totalPrice / maxPlayers).toLocaleString('vi-VN')}đ/người`
}

function buildArrangementPlayers(session: SessionDetailRecord) {
  const playersById = new Map<string, ArrangementPlayer>()

  playersById.set(session.host.id, {
    id: session.host.id,
    name: session.host.name,
    elo: getComparableElo(session.host),
    reliability: getReliability(session.host),
    skillTag: getSkillTag(session.host),
    team: 1,
  })

  for (const entry of session.session_players ?? []) {
    playersById.set(entry.player_id, {
      id: entry.player_id,
      name: entry.player?.name ?? 'Người chơi',
      elo: getComparableElo(entry.player),
      reliability: getReliability(entry.player),
      skillTag: getSkillTag(entry.player),
      team: entry.team_no === 2 ? 2 : 1,
    })
  }

  const everyone = Array.from(playersById.values())
  const hasPersistedTeams = (session.session_players ?? []).some((entry) => entry.team_no === 1 || entry.team_no === 2)

  if (hasPersistedTeams) {
    return everyone
  }

  const sorted = [...everyone].sort((a, b) => b.elo - a.elo || a.name.localeCompare(b.name, 'vi'))
  const teamMap = new Map<string, 1 | 2>()

  sorted.forEach((player, index) => {
    teamMap.set(player.id, index % 2 === 0 ? 1 : 2)
  })

  return everyone.map((player) => ({
    ...player,
    team: teamMap.get(player.id) ?? 1,
  }))
}

function autoBalance(players: ArrangementPlayer[]) {
  const sorted = [...players].sort((a, b) => b.elo - a.elo || a.name.localeCompare(b.name, 'vi'))
  let totalA = 0
  let totalB = 0

  return sorted
    .map((player) => {
      const team: 1 | 2 = totalA <= totalB ? 1 : 2
      if (team === 1) totalA += player.elo
      else totalB += player.elo
      return { ...player, team }
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'vi'))
}

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { userId } = useAuth()
  const insets = useSafeAreaInsets()

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const [savingArrangement, setSavingArrangement] = useState(false)
  const [session, setSession] = useState<SessionDetailRecord | null>(null)
  const [isArranging, setIsArranging] = useState(false)
  const [arrangedPlayers, setArrangedPlayers] = useState<ArrangementPlayer[]>([])
  const [savedTeams, setSavedTeams] = useState<Record<string, 1 | 2>>({})
  const [viewerPlayer, setViewerPlayer] = useState<ViewerPlayer | null>(null)
  const [requestStatus, setRequestStatus] = useState<RequestStatus>('none')
  const [hostResponseTemplate, setHostResponseTemplate] = useState<string | null>(null)
  const [introNote, setIntroNote] = useState('')
  const [joinModalVisible, setJoinModalVisible] = useState(false)
  const [joining, setJoining] = useState(false)
  const [requesting, setRequesting] = useState(false)

  const isHost = userId != null && userId === session?.host.id
  const hasJoined = useMemo(
    () => (session ? session.session_players.some((item) => item.player_id === userId) : false),
    [session, userId],
  )

  const fetchSession = useCallback(async () => {
    if (!id) return

    const { data, error } = await supabase.rpc('get_session_detail_overview', { p_session_id: id })

    if (error) {
      Alert.alert('Không tải được kèo', error.message)
      setSession(null)
      return
    }

    const nextSession = (data?.session ?? null) as SessionDetailRecord | null
    setSession(nextSession)
    setRequestStatus((data?.viewer_request_status as RequestStatus | null) ?? 'none')
    setHostResponseTemplate((data?.viewer_host_response_template as string | null) ?? null)
    setIntroNote((data?.viewer_intro_note as string | null) ?? '')

    if (nextSession) {
      const nextArrangement = buildArrangementPlayers(nextSession)
      setArrangedPlayers(nextArrangement)
      setSavedTeams(Object.fromEntries(nextArrangement.map((player) => [player.id, player.team])) as Record<string, 1 | 2>)
    }

    if (userId) {
      const { data: viewerData } = await supabase.from('players').select('id, elo, current_elo').eq('id', userId).single()
      setViewerPlayer((viewerData as ViewerPlayer | null) ?? null)
    } else {
      setViewerPlayer(null)
    }
  }, [id, userId])

  useEffect(() => {
    let mounted = true

    async function run() {
      setLoading(true)
      await fetchSession()
      if (mounted) setLoading(false)
    }

    void run()

    return () => {
      mounted = false
    }
  }, [fetchSession])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchSession()
    setRefreshing(false)
  }, [fetchSession])

  const switchTeam = useCallback((playerId: string) => {
    setArrangedPlayers((current) =>
      current.map((player) =>
        player.id === playerId
          ? { ...player, team: player.team === 1 ? 2 : 1 }
          : player,
      ),
    )
  }, [])

  const onAutoBalance = useCallback(() => {
    setArrangedPlayers((current) => autoBalance(current))
  }, [])

  const onSaveArrangement = useCallback(async () => {
    if (!session || !isHost) return

    setSavingArrangement(true)

    const { error } = await supabase.rpc('save_session_teams', {
      p_session_id: session.id,
      p_assignments: arrangedPlayers.map((player) => ({
        player_id: player.id,
        team_no: player.team,
      })),
    })

    setSavingArrangement(false)

    if (error) {
      Alert.alert('Không lưu được đội', error.message)
      return
    }

    const nextSavedTeams = Object.fromEntries(arrangedPlayers.map((player) => [player.id, player.team])) as Record<string, 1 | 2>
    setSavedTeams(nextSavedTeams)
    setIsArranging(false)
    Alert.alert('Đã lưu thay đổi', 'Đội hình đã được cập nhật.')
    await fetchSession()
  }, [arrangedPlayers, fetchSession, isHost, session])

  const leaveSession = useCallback(async () => {
    if (!session || !userId) return

    Alert.alert('Rời kèo?', 'Bạn chắc chắn muốn rời kèo này?', [
      { text: 'Ở lại', style: 'cancel' },
      {
        text: 'Rời kèo',
        style: 'destructive',
        onPress: async () => {
          setLeaving(true)
          const { error } = await supabase
            .from('session_players')
            .delete()
            .eq('session_id', session.id)
            .eq('player_id', userId)

          setLeaving(false)

          if (error) {
            Alert.alert('Không thể rời kèo', error.message)
            return
          }

          await fetchSession()
        },
      },
    ])
  }, [fetchSession, session, userId])

  const teamA = arrangedPlayers.filter((player) => player.team === 1)
  const teamB = arrangedPlayers.filter((player) => player.team === 2)
  const averageTeamA = teamA.length ? Math.round(teamA.reduce((sum, player) => sum + player.elo, 0) / teamA.length) : 0
  const averageTeamB = teamB.length ? Math.round(teamB.reduce((sum, player) => sum + player.elo, 0) / teamB.length) : 0
  const arrangementDirty = arrangedPlayers.some((player) => savedTeams[player.id] !== player.team)

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#4f46e5" />
      </SafeAreaView>
    )
  }

  if (!session) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-slate-50 px-6">
        <Text className="text-center text-base font-semibold text-slate-500">Không tìm thấy kèo này.</Text>
      </SafeAreaView>
    )
  }

  const sessionSkillLabel = getSessionSkillLabel(session.elo_min, session.elo_max)
  const spotsLeft = Math.max(0, session.max_players - arrangedPlayers.length)
  const viewerElo = getComparableElo(viewerPlayer)
  const matchStatus: MatchStatus = getMatchStatus(viewerElo, session.elo_min, arrangedPlayers.length, session.max_players)
  const hostRequiresApproval = session.require_approval || Boolean(session.host.auto_accept === false)
  const canShowJoinActions = !isHost && !hasJoined && session.status === 'open'
  const hasBookingDetails = Boolean(
    session.booking_reference || session.booking_name || session.booking_phone || session.booking_notes,
  )

  const directJoinSession = useCallback(async () => {
    if (!userId) {
      Alert.alert('Cần đăng nhập', 'Bạn cần đăng nhập để tham gia kèo.', [
        { text: 'Để sau', style: 'cancel' },
        { text: 'Đăng nhập', onPress: () => router.push('/login') },
      ])
      return
    }

    if (!session) return

    setJoining(true)
    const { error } = await supabase.from('session_players').insert({
      session_id: session.id,
      player_id: userId,
      status: 'confirmed',
    })

    if (!error) {
      await supabase
        .from('join_requests')
        .update({ status: 'accepted' })
        .eq('match_id', session.id)
        .eq('player_id', userId)
    }

    setJoining(false)

    if (error) {
      Alert.alert('Không thể tham gia kèo', error.message)
      return
    }

    setRequestStatus('accepted')
    setJoinModalVisible(false)
    Alert.alert('Tham gia thành công', 'Bạn đã vào kèo này rồi nhé.')
    await fetchSession()
  }, [fetchSession, session, userId])

  const sendJoinRequest = useCallback(async () => {
    if (!userId) {
      Alert.alert('Cần đăng nhập', 'Bạn cần đăng nhập để gửi yêu cầu.', [
        { text: 'Để sau', style: 'cancel' },
        { text: 'Đăng nhập', onPress: () => router.push('/login') },
      ])
      return
    }

    if (!session) return

    setRequesting(true)
    const { error } = await supabase.from('join_requests').upsert(
      {
        match_id: session.id,
        player_id: userId,
        status: 'pending',
        intro_note: introNote.trim() || null,
      },
      { onConflict: 'match_id,player_id' }
    )
    setRequesting(false)

    if (error) {
      Alert.alert('Không thể gửi yêu cầu', error.message)
      return
    }

    setRequestStatus('pending')
    setHostResponseTemplate(null)
    setJoinModalVisible(false)
    Alert.alert(
      matchStatus === 'WAITLIST' ? 'Đã đăng ký dự bị' : 'Đã gửi yêu cầu',
      matchStatus === 'WAITLIST' ? 'Host sẽ thấy bạn trong danh sách dự bị nếu có chỗ trống.' : 'Chờ host duyệt nhé.'
    )
    await fetchSession()
  }, [fetchSession, introNote, matchStatus, session, userId])

  function handleSmartJoinPress() {
    if (matchStatus === 'MATCHED' && !hostRequiresApproval) {
      void directJoinSession()
      return
    }

    setJoinModalVisible(true)
  }

  function renderPlayerRow(player: ArrangementPlayer, mode: 'normal' | 'arranging') {
    return (
      <View
        key={`${mode}-${player.id}`}
        className="rounded-[32px] border border-slate-100 bg-white px-5 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]"
      >
        <View className="flex-row items-center gap-4">
          <View className="relative h-16 w-16 items-center justify-center rounded-full border border-slate-100 bg-slate-100">
            <Text className="text-[18px] font-black text-slate-800">{getInitials(player.name)}</Text>
            <View className="absolute -bottom-1 -right-1 h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-white shadow-sm">
              <Shield size={12} color="#10b981" strokeWidth={2.5} />
            </View>
          </View>

          <View className="flex-1">
            <Text className="text-[17px] font-black text-slate-950">{player.name}</Text>

            <View className="mt-2 flex-row flex-wrap items-center gap-x-3 gap-y-1">
              <Text className="text-[13px] font-bold text-slate-400">{`Elo ${player.elo}`}</Text>
              <Text className="text-[13px] font-black text-orange-500">{player.skillTag}</Text>

              {mode === 'normal' && player.reliability != null ? (
                <Text className="text-[12px] font-semibold text-emerald-600">{`${player.reliability}% uy tín`}</Text>
              ) : null}
            </View>
          </View>

          {mode === 'arranging' ? (
            <TouchableOpacity
              className="h-14 w-14 items-center justify-center rounded-[22px] border border-slate-100 bg-slate-50"
              onPress={() => switchTeam(player.id)}
              activeOpacity={0.9}
            >
              <Repeat2 size={21} color="#4f46e5" strokeWidth={2.5} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <ScrollView
        className="flex-1"
        stickyHeaderIndices={[0]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
        contentContainerStyle={{
          paddingBottom: (isHost || hasJoined || canShowJoinActions ? 112 : 48) + insets.bottom,
          paddingHorizontal: 20,
        }}
      >
        <View className="bg-white/85 pb-4 pt-2">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              className="h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white"
              onPress={() => router.back()}
              activeOpacity={0.9}
            >
              <ChevronLeft size={18} color="#0f172a" strokeWidth={2.5} />
            </TouchableOpacity>

            <Text className="text-[13px] font-black uppercase tracking-[0.28em] text-slate-900">Chi tiết kèo</Text>

            <TouchableOpacity
              className="h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white"
              onPress={() => {
                const url = Linking.createURL(`/session/${id}`)
                void Share.share({ message: `Tham gia kèo pickleball này nhé! ${url}` })
              }}
              activeOpacity={0.9}
            >
              <Share2 size={18} color="#0f172a" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>

        <View className="mt-4 rounded-[32px] border border-slate-200 bg-white px-5 pb-5 pt-4 shadow-sm">
          <View className="flex-row flex-wrap items-center gap-2">
            <View className="flex-row items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-2">
              <Trophy size={14} color="#b45309" strokeWidth={2.5} />
              <Text className="ml-2 text-[11px] font-black uppercase tracking-[0.9px] text-amber-700">{sessionSkillLabel}</Text>
            </View>

            <View className={`flex-row items-center rounded-full border px-3 py-2 ${session.court_booking_status === 'confirmed' ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
              <CheckCircle2 size={14} color={session.court_booking_status === 'confirmed' ? '#059669' : '#b45309'} strokeWidth={2.5} />
              <Text className={`ml-2 text-[11px] font-black uppercase tracking-[0.9px] ${session.court_booking_status === 'confirmed' ? 'text-emerald-700' : 'text-amber-700'}`}>
                {session.court_booking_status === 'confirmed' ? 'Sân đã chốt' : 'Sân chờ xác nhận'}
              </Text>
            </View>
          </View>

          <Text className="mt-5 text-[28px] font-black leading-9 text-slate-950">{session.slot.court.name}</Text>
          <View className="mt-3 flex-row items-start gap-2">
            <MapPin size={16} color="#64748b" strokeWidth={2.5} />
            <Text className="flex-1 text-[14px] leading-6 text-slate-500">
              {session.slot.court.address} ? {session.slot.court.city}
            </Text>
          </View>

          <View className="mt-5 rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
            <View className="flex-row items-center">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
                <Clock3 size={18} color="#4f46e5" strokeWidth={2.5} />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Thời gian</Text>
                <Text className="mt-1 text-[14px] font-bold leading-5 text-slate-900">
                  {formatTimeRange(session.slot.start_time, session.slot.end_time)}
                </Text>
              </View>
            </View>

            <View className="my-4 h-px bg-slate-100" />

            <View className="flex-row items-center">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                <CreditCard size={18} color="#ea580c" strokeWidth={2.5} />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Chi ph?</Text>
                <Text className="mt-1 text-[14px] font-bold text-slate-900">
                  {formatPricePerPerson(session.slot.price, session.max_players)}
                </Text>
              </View>
            </View>
          </View>

          {isHost && hasBookingDetails ? (
            <View className="mt-5 rounded-[32px] border border-slate-200 bg-slate-50 p-5">
              <View className="flex-row items-center justify-between gap-3">
                <View>
                  <Text className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
                    Thông tin đặt sân
                  </Text>
                  <Text className="mt-1 text-[15px] font-bold text-slate-900">
                    Chỉ host nhìn thấy phần này để tiện check sân.
                  </Text>
                </View>

                <View
                  className={`rounded-full px-3 py-2 ${
                    session.court_booking_status === 'confirmed' ? 'bg-emerald-100' : 'bg-amber-100'
                  }`}
                >
                  <Text
                    className={`text-[11px] font-black uppercase tracking-[0.08em] ${
                      session.court_booking_status === 'confirmed' ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    {session.court_booking_status === 'confirmed' ? 'Đã chốt sân' : 'Chờ xác nhận'}
                  </Text>
                </View>
              </View>

              <View className="mt-4 gap-3">
                {session.booking_reference ? (
                  <View className="rounded-[22px] bg-white px-4 py-3">
                    <Text className="text-[11px] font-black uppercase tracking-[0.08em] text-slate-400">Mã đặt sân</Text>
                    <Text className="mt-1 text-[14px] font-bold text-slate-900">{session.booking_reference}</Text>
                  </View>
                ) : null}

                {session.booking_name ? (
                  <View className="rounded-[22px] bg-white px-4 py-3">
                    <Text className="text-[11px] font-black uppercase tracking-[0.08em] text-slate-400">Tên đặt sân</Text>
                    <Text className="mt-1 text-[14px] font-bold text-slate-900">{session.booking_name}</Text>
                  </View>
                ) : null}

                {session.booking_phone ? (
                  <View className="rounded-[22px] bg-white px-4 py-3">
                    <Text className="text-[11px] font-black uppercase tracking-[0.08em] text-slate-400">Số điện thoại</Text>
                    <Text className="mt-1 text-[14px] font-bold text-slate-900">{session.booking_phone}</Text>
                  </View>
                ) : null}

                {session.booking_notes ? (
                  <View className="rounded-[22px] bg-white px-4 py-3">
                    <Text className="text-[11px] font-black uppercase tracking-[0.08em] text-slate-400">Ghi chú</Text>
                    <Text className="mt-1 text-[14px] leading-6 text-slate-700">{session.booking_notes}</Text>
                  </View>
                ) : null}
              </View>
            </View>
          ) : null}
        </View>

        <View className="mt-6 flex-row items-center justify-between gap-3">
          <View className="flex-1">
            <Text className="text-[22px] font-black text-slate-950">{`Người chơi • ${arrangedPlayers.length}/${session.max_players}`}</Text>
            {session.status === 'open' && spotsLeft > 0 ? (
              <Text className="mt-1 text-[13px] font-bold text-emerald-600">
                {spotsLeft === 1 ? 'Còn 1 chỗ cuối' : `Còn ${spotsLeft} chỗ trống`}
              </Text>
            ) : (
              <Text className="mt-1 text-[13px] font-medium text-slate-500">Danh sách hiện tại của kèo này.</Text>
            )}
          </View>

          {isHost ? (
            <TouchableOpacity
              className={`min-w-[140px] flex-row items-center justify-center rounded-[24px] px-5 py-4 shadow-sm ${
                isArranging ? 'bg-slate-900' : 'bg-slate-100'
              }`}
              onPress={() => setIsArranging((prev) => !prev)}
              activeOpacity={0.9}
            >
              {isArranging ? <Repeat2 size={16} color="#ffffff" strokeWidth={2.5} /> : null}
              <Text className={`text-[12px] font-black uppercase tracking-[0.08em] ${isArranging ? 'text-white' : 'text-slate-700'}`}>
                {isArranging ? ' XONG' : 'Sắp xếp đội'}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {isHost && isArranging ? (
          <View className="mt-4 gap-3">
            <View className="rounded-[28px] border border-dashed border-indigo-200 bg-indigo-50 px-5 py-5">
              <Text className="text-[13px] leading-7 text-indigo-600">
                Nhấn vào biểu tượng đổi đội để chuyển người chơi giữa Team A và Team B.
              </Text>
            </View>

            <TouchableOpacity
              className="self-start rounded-[20px] bg-indigo-600 px-5 py-3 shadow-sm"
              onPress={onAutoBalance}
              activeOpacity={0.9}
            >
              <Text className="text-[12px] font-black uppercase tracking-[0.08em] text-white">Chia đội tự động</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View className="mt-3">
          {isArranging ? (
            <>
              <View className="mt-6 gap-6">
                <View>
                  <View className="mb-4 flex-row items-center justify-between px-2">
                    <Text className="text-[18px] font-black uppercase tracking-[0.14em] text-slate-900">TEAM A</Text>
                    <View className="rounded-2xl border border-slate-200 bg-white px-4 py-2">
                      <Text className="text-[12px] font-black uppercase tracking-[0.04em] text-slate-400">{`AVG ELO: ${averageTeamA}`}</Text>
                    </View>
                  </View>
                  <View className="gap-3">
                    {teamA.length > 0 ? teamA.map((player) => renderPlayerRow(player, 'arranging')) : null}
                  </View>
                </View>

                <View>
                  <View className="mb-4 flex-row items-center justify-between px-2">
                    <Text className="text-[18px] font-black uppercase tracking-[0.14em] text-slate-900">TEAM B</Text>
                    <View className="rounded-2xl border border-slate-200 bg-white px-4 py-2">
                      <Text className="text-[12px] font-black uppercase tracking-[0.04em] text-slate-400">{`AVG ELO: ${averageTeamB}`}</Text>
                    </View>
                  </View>
                  <View className="gap-3">
                    {teamB.length > 0 ? teamB.map((player) => renderPlayerRow(player, 'arranging')) : null}
                  </View>
                </View>
              </View>
            </>
          ) : (
            <View className="gap-3">
              {arrangedPlayers.map((player) => renderPlayerRow(player, 'normal'))}

              {Array.from({ length: spotsLeft }).map((_, index) => (
                <View
                  key={`empty-slot-${index}`}
                  className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5"
                >
                  <View className="flex-row items-center gap-3">
                    <View className="h-14 w-14 items-center justify-center rounded-full border border-dashed border-slate-300 bg-white">
                      <Text className="text-[18px] font-black text-slate-400">?</Text>
                    </View>
                    <Text className="text-[14px] font-bold text-slate-400">Chờ người chơi...</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {(isHost || hasJoined || canShowJoinActions) ? (
        <View
          className="border-t border-slate-200 bg-white/95 px-5 pb-4 pt-4"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          {isHost ? (
            <TouchableOpacity
              className={`h-14 flex-row items-center justify-center gap-3 rounded-full px-6 ${
                arrangementDirty ? 'bg-[#059669]' : 'bg-emerald-500'
              }`}
              onPress={onSaveArrangement}
              disabled={savingArrangement}
              activeOpacity={0.9}
            >
              <Text className="text-[15px] font-black uppercase tracking-[0.08em] text-white">
                {savingArrangement ? 'ĐANG LƯU...' : 'LƯU THAY ĐỔI'}
              </Text>
              <ArrowRight size={20} color="#ffffff" strokeWidth={2.5} />
            </TouchableOpacity>
          ) : hasJoined ? (
            <TouchableOpacity
              className="h-14 items-center justify-center rounded-2xl border border-rose-100 bg-rose-50"
              onPress={() => void leaveSession()}
              disabled={leaving}
              activeOpacity={0.9}
            >
              <Text className="text-[15px] font-black uppercase tracking-[0.08em] text-rose-600">
                {leaving ? 'ĐANG RỜI...' : 'RỜI KÈO'}
              </Text>
            </TouchableOpacity>
          ) : (
            <SmartJoinButton
              matchStatus={matchStatus}
              requestStatus={requestStatus}
              hostResponseTemplate={hostResponseTemplate}
              loading={joining || requesting}
              onPress={handleSmartJoinPress}
            />
          )}
        </View>
      ) : null}

      <JoinRequestModal
        visible={joinModalVisible}
        mode={matchStatus}
        introNote={introNote}
        setIntroNote={setIntroNote}
        loading={requesting}
        onClose={() => setJoinModalVisible(false)}
        onSubmit={() => void sendJoinRequest()}
      />
    </SafeAreaView>
  )
}

