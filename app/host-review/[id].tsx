import { ScreenHeader } from '@/components/design'
import { PROFILE_THEME_COLORS } from '@/components/profile/profileTheme'
import { insertNotification } from '@/lib/notifications'
import { calculateReliabilityScore } from '@/lib/profileData'
import {
    getShortSkillLabel,
    getSkillLevelFromEloRange,
} from '@/lib/skillAssessment'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/useAuth'
import { router, useLocalSearchParams } from 'expo-router'
import {
    AlertTriangle,
    CircleX,
    LoaderCircle,
    PencilLine,
    ShieldCheck,
    UserCheck,
    UserX,
} from 'lucide-react-native'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    Text,
    View,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

const ICON_STROKE = 2.5
const QUICK_REPLY_TEMPLATES = [
  'Trình hơi lệch, bạn chắc chứ?',
  'Đợi mình gom đủ người rồi báo nhé.',
  'Mình ưu tiên team cân hơn một chút.',
]

type SessionOverview = {
  id: string
  host: {
    id: string
    name: string
  }
  max_players: number
  elo_min: number
  elo_max: number
  require_approval: boolean
  status: string
  session_players: { player_id: string }[]
  slot: {
    start_time: string
    end_time: string
    price: number
    court: {
      name: string
      address: string
      city: string
    }
  }
}

type ApplicantRecord = {
  id: string
  player_id: string
  status: 'pending' | 'accepted' | 'rejected'
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
    reliability_score?: number | null
  }
}

type ApplicantRow = {
  id: string
  player_id: string
  status: 'pending' | 'accepted' | 'rejected'
  intro_note?: string | null
  host_response_template?: string | null
  player: {
    name?: string | null
    elo?: number | null
    current_elo?: number | null
    self_assessed_level?: string | null
    skill_label?: string | null
    sessions_joined?: number | null
    no_show_count?: number | null
    reliability_score?: number | null
  } | null
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function getReliabilityScore(player: ApplicantRecord['player']) {
  return calculateReliabilityScore(player.sessions_joined, player.no_show_count, player.reliability_score)
}

function getReliabilityTone(score: number | null) {
  if (score == null) {
    return {
      badgeBg: '#e2e8f0',
      badgeIcon: '#64748b',
      badgeText: '#475569',
    }
  }

  if (score >= 90) {
    return {
      badgeBg: '#dcfce7',
      badgeIcon: '#059669',
      badgeText: '#047857',
    }
  }

  if (score >= 70) {
    return {
      badgeBg: '#fef3c7',
      badgeIcon: '#d97706',
      badgeText: '#b45309',
    }
  }

  return {
    badgeBg: '#ffe4e6',
    badgeIcon: '#e11d48',
    badgeText: '#be123c',
  }
}

function getMatchScore(playerElo: number, eloMin: number, eloMax: number) {
  if (playerElo >= eloMin && playerElo <= eloMax) {
    const target = (eloMin + eloMax) / 2
    const diff = Math.abs(playerElo - target)
    return Math.max(86, Math.min(99, Math.round(99 - diff / 12)))
  }

  const nearestEdge = playerElo < eloMin ? eloMin : eloMax
  const diff = Math.abs(playerElo - nearestEdge)
  return Math.max(12, Math.min(84, Math.round(84 - diff / 8)))
}

function formatTimeLabel(start: string, end: string) {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const weekdayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
  const day = `${startDate.getDate().toString().padStart(2, '0')}/${(startDate.getMonth() + 1).toString().padStart(2, '0')}`
  const startClock = `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`
  const endClock = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`
  return `${weekdayLabels[startDate.getDay()]}, ${day} · ${startClock} - ${endClock}`
}

type RequestCardProps = {
  applicant: ApplicantRecord
  eloMin: number
  eloMax: number
  onOpenPlayer: (playerId: string) => void
  onAccept: (requestId: string, playerId: string) => void
  onReject: (requestId: string, playerId: string) => void
  onQuickReply: (requestId: string, playerId: string, template: string) => void
  busy?: boolean
}

function premiumShadow(elevation = 5) {
  return {
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation,
  } as const
}

function RequestCard({
  applicant,
  eloMin,
  eloMax,
  onOpenPlayer,
  onAccept,
  onReject,
  onQuickReply,
  busy = false,
}: RequestCardProps) {
  const playerElo = applicant.player.current_elo ?? applicant.player.elo ?? 0
  const reliability = getReliabilityScore(applicant.player)
  const reliabilityTone = getReliabilityTone(reliability)
  const matchScore = getMatchScore(playerElo, eloMin, eloMax)
  const lowMatch = matchScore < 50
  const diffFromTarget = playerElo - Math.round((eloMin + eloMax) / 2)
  const matchTone = lowMatch
    ? {
        badgeBg: 'bg-rose-50',
        badgeBorder: 'border-rose-200',
        badgeText: 'text-rose-700',
      }
    : {
        badgeBg: 'bg-emerald-50',
        badgeBorder: 'border-emerald-200',
        badgeText: 'text-emerald-700',
      }

  return (
    <View
      className="mb-4 overflow-hidden rounded-[28px] border border-slate-200 bg-white p-4"
      style={premiumShadow()}
    >
      {lowMatch ? <View className="absolute inset-x-0 top-0 h-1 bg-rose-500" /> : null}

      <Pressable onPress={() => onOpenPlayer(applicant.player_id)} className="active:scale-95">
        <View className="flex-row items-start">
          <View className="relative">
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-slate-900">
              <Text className="text-[18px] font-black text-white">{getInitials(applicant.player.name)}</Text>
            </View>
            <View
              className="absolute -bottom-1 -right-1 h-6 w-6 items-center justify-center rounded-full border-2 border-white"
              style={{ backgroundColor: reliabilityTone.badgeBg }}
            >
              <ShieldCheck size={12} color={reliabilityTone.badgeIcon} strokeWidth={ICON_STROKE} />
            </View>
          </View>

          <View className="ml-4 min-w-0 flex-1">
            <Text className="text-[17px] font-black text-slate-950">{applicant.player.name}</Text>
            <Text className="mt-1 text-[13px] font-bold text-slate-500">
              Elo {playerElo} · {applicant.player.sessions_joined ?? 0} kèo đã chơi
            </Text>
            <Text className="mt-1 text-[12px] font-bold" style={{ color: reliabilityTone.badgeText }}>
              {reliability != null ? `${reliability}% uy tín` : 'Chưa đủ dữ liệu uy tín'}
            </Text>
          </View>

          <View className={`rounded-2xl border px-3 py-1.5 ${matchTone.badgeBg} ${matchTone.badgeBorder}`}>
            <Text className={`text-[12px] font-black ${matchTone.badgeText}`}>{matchScore}% Match</Text>
          </View>
        </View>
      </Pressable>

      {lowMatch ? (
        <View className="mt-4 flex-row rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
          <View className="mt-0.5">
            <AlertTriangle size={16} color="#e11d48" strokeWidth={ICON_STROKE} />
          </View>
          <Text className="ml-3 flex-1 text-[13px] font-bold leading-5 text-rose-700">
            Trình độ hơi lệch ({diffFromTarget >= 0 ? '+' : ''}
            {diffFromTarget} Elo). Bạn chắc chứ?
          </Text>
        </View>
      ) : null}

      <View className="relative mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
        <View className="absolute left-3 top-0 -translate-y-1/2 rounded-full border border-slate-200 bg-white px-2 py-1">
          <Text className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Lời nhắn</Text>
        </View>
        <Text className="pt-2 text-[14px] italic leading-6 text-slate-600">
          {applicant.intro_note?.trim() ? applicant.intro_note : 'Người chơi chưa để lại lời nhắn nào.'}
        </Text>
      </View>

      <View className="mt-4 flex-row gap-3">
        <Pressable
          onPress={() => onReject(applicant.id, applicant.player_id)}
          disabled={busy}
          className="active:scale-95 flex-1 flex-row items-center justify-center rounded-2xl bg-slate-100 px-4 py-4"
        >
          <UserX size={18} color="#475569" strokeWidth={ICON_STROKE} />
          <Text className="ml-2 text-[14px] font-black text-slate-700">Từ chối</Text>
        </Pressable>

        <Pressable
          onPress={() => onAccept(applicant.id, applicant.player_id)}
          disabled={busy}
          className="active:scale-95 flex-[1.5] flex-row items-center justify-center rounded-2xl bg-[#059669] px-4 py-4 shadow-lg shadow-emerald-900/20"
        >
          <UserCheck size={18} color="#ffffff" strokeWidth={ICON_STROKE} />
          <Text className="ml-2 text-[14px] font-black text-white">Chấp nhận</Text>
        </Pressable>
      </View>

      <View className="mt-4 flex-row flex-wrap gap-2">
        {QUICK_REPLY_TEMPLATES.map((template) => (
          <Pressable
            key={template}
            onPress={() => onQuickReply(applicant.id, applicant.player_id, template)}
            disabled={busy}
            className="active:scale-95 rounded-full border border-slate-200 bg-white px-3 py-2"
          >
            <Text className="text-[12px] font-bold text-slate-600">{template}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  )
}

export default function HostReviewCenterScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { userId } = useAuth()
  const insets = useSafeAreaInsets()
  const [session, setSession] = useState<SessionOverview | null>(null)
  const [applicants, setApplicants] = useState<ApplicantRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [submittingId, setSubmittingId] = useState<string | null>(null)
  const [cancelling, setCancelling] = useState(false)

  const fetchData = useCallback(async () => {
    if (!id) {
      setLoading(false)
      return
    }

    setLoading(true)

    const [{ data: overview, error: sessionError }, { data: requestRows, error: requestError }] = await Promise.all([
      supabase.rpc('get_session_detail_overview', { p_session_id: id }),
      supabase
        .from('join_requests')
        .select(`
          id, player_id, status, intro_note, host_response_template,
          player:player_id (
            name, elo, current_elo, self_assessed_level, skill_label, sessions_joined, no_show_count, reliability_score
          )
        `)
        .eq('match_id', id)
        .eq('status', 'pending'),
    ])

    if (sessionError) {
      setLoading(false)
      Alert.alert('Lỗi', sessionError.message)
      return
    }

    if (requestError) {
      setLoading(false)
      Alert.alert('Lỗi', requestError.message)
      return
    }

    const nextSession = (overview?.session ?? null) as SessionOverview | null
    const nextApplicants: ApplicantRecord[] = ((requestRows as ApplicantRow[] | null) ?? []).map((item) => {
      return {
        id: item.id,
        player_id: item.player_id,
        status: item.status,
        intro_note: item.intro_note ?? null,
        host_response_template: item.host_response_template ?? null,
        player: {
          name: item.player?.name ?? 'Người chơi',
          elo: item.player?.elo ?? null,
          current_elo: item.player?.current_elo ?? null,
          self_assessed_level: item.player?.self_assessed_level ?? null,
          skill_label: item.player?.skill_label ?? null,
          sessions_joined: item.player?.sessions_joined ?? null,
          no_show_count: item.player?.no_show_count ?? null,
          reliability_score: item.player?.reliability_score ?? null,
        },
      }
    })

    setSession(nextSession)
    setApplicants(nextApplicants)
    setLoading(false)
  }, [id])

  useEffect(() => {
    void fetchData()
  }, [fetchData])

  const matchTargetElo = useMemo(() => {
    if (!session) return 0
    return Math.round((session.elo_min + session.elo_max) / 2)
  }, [session])

  async function approveRequest(requestId: string, playerId: string) {
    if (!session) return

    setSubmittingId(requestId)
    const { error } = await supabase.rpc('approve_join_request', { p_request_id: requestId })

    if (error) {
      setSubmittingId(null)
      Alert.alert('Lỗi', error.message)
      return
    }

    setApplicants((prev) => prev.filter((item) => item.id !== requestId))
    setSession((prev) =>
      prev
        ? {
            ...prev,
            session_players: [...prev.session_players, { player_id: playerId }],
          }
        : prev
    )

    const slotTime = new Date(session.slot.start_time).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    })

    await insertNotification(
      playerId,
      'Được duyệt!',
      `Bạn đã được chấp nhận vào kèo lúc ${slotTime}.`,
      'join_approved',
      `/session/${session.id}`,
    )

    setSubmittingId(null)
    // Điều hướng sang màn chi tiết kèo sau khi duyệt xong
    router.replace({ pathname: '/session/[id]', params: { id: session.id } })
  }

  async function rejectRequest(requestId: string, playerId: string) {
    if (!session) return

    setSubmittingId(requestId)
    const { error } = await supabase
      .from('join_requests')
      .update({ status: 'rejected' })
      .eq('id', requestId)

    if (error) {
      setSubmittingId(null)
      Alert.alert('Lỗi', error.message)
      return
    }

    setApplicants((prev) => prev.filter((item) => item.id !== requestId))

    await insertNotification(
      playerId,
      'Chưa phù hợp',
      'Host đã từ chối yêu cầu tham gia của bạn.',
      'join_rejected',
      `/session/${session.id}`,
    )

    setSubmittingId(null)
  }

  async function replyWithTemplate(requestId: string, playerId: string, template: string) {
    if (!session) return

    setSubmittingId(requestId)
    const { error } = await supabase
      .from('join_requests')
      .update({ host_response_template: template })
      .eq('id', requestId)

    if (error) {
      setSubmittingId(null)
      Alert.alert('Lỗi', error.message)
      return
    }

    setApplicants((prev) =>
      prev.map((item) => (item.id === requestId ? { ...item, host_response_template: template } : item))
    )

    await insertNotification(
      playerId,
      'Host đã phản hồi yêu cầu',
      template,
      'join_request_reply',
      `/session/${session.id}`,
    )

    Alert.alert('Đã gửi phản hồi', 'Phản hồi nhanh đã được lưu và gửi cho người chơi.')
    setSubmittingId(null)
  }

  function cancelSession() {
    if (!session) return

    const isFull = session.session_players.length >= session.max_players
    const playerIdsToNotify = session.session_players
      .filter((player) => player.player_id !== session.host.id)
      .map((player) => player.player_id)
    const slotTime = new Date(session.slot.start_time).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    })

    Alert.alert(
      isFull ? 'Kèo đã đủ người' : 'Hủy kèo?',
      isFull
        ? 'Kèo đã đủ người chơi, việc hủy kèo sẽ ảnh hưởng đến tỷ lệ uy tín của bạn. Bạn có chắc không?'
        : 'Kèo sẽ bị hủy và toàn bộ người chơi sẽ được thông báo. Không thể hoàn tác.',
      [
        { text: 'Không', style: 'cancel' },
        {
          text: 'Hủy kèo',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true)
            const { error } = await supabase.rpc('cancel_host_session', { p_session_id: session.id })

            if (error) {
              setCancelling(false)
              Alert.alert('Lỗi', error.message)
              return
            }

            await Promise.all(
              playerIdsToNotify.map((playerId) =>
                insertNotification(
                  playerId,
                  'Host đã hủy kèo',
                  `Kèo lúc ${slotTime} đã bị host hủy.`,
                  'session_cancelled',
                  `/session/${session.id}`,
                )
              )
            )

            setCancelling(false)
            Alert.alert('Đã hủy kèo', 'Kèo của bạn đã được hủy.', [
              { text: 'OK', onPress: () => router.replace('/(tabs)' as any) },
            ])
          },
        },
      ]
    )
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-stone-50" edges={['top']}>
        <ActivityIndicator size="large" color={PROFILE_THEME_COLORS.primary} />
      </SafeAreaView>
    )
  }

  if (!session) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-stone-50 px-6" edges={['top']}>
        <Text className="text-center text-[15px] font-bold text-slate-500">Không tìm thấy dữ liệu review cho kèo này.</Text>
      </SafeAreaView>
    )
  }

  if (!userId || userId !== session.host.id) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-stone-50 px-6" edges={['top']}>
        <CircleX size={28} color="#e11d48" strokeWidth={ICON_STROKE} />
        <Text className="mt-4 text-center text-[18px] font-black text-slate-950">Bạn không có quyền truy cập</Text>
        <Text className="mt-2 text-center text-[14px] leading-6 text-slate-500">
          Chỉ host của kèo mới có thể xem và xử lý trung tâm duyệt yêu cầu này.
        </Text>
        <Pressable onPress={() => router.back()} className="mt-6 active:scale-95 rounded-2xl bg-slate-900 px-5 py-3.5">
          <Text className="text-[14px] font-black text-white">Quay lại</Text>
        </Pressable>
      </SafeAreaView>
    )
  }

  const sessionSkill = getSkillLevelFromEloRange(session.elo_min, session.elo_max)

  return (
    <SafeAreaView className="flex-1 bg-stone-50" edges={['top']}>
      <View className="flex-1">
        <ScrollView
          className="flex-1"
          stickyHeaderIndices={[0]}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 140 + insets.bottom,
          }}
          showsVerticalScrollIndicator={false}
        >
          <ScreenHeader variant="brand" title="KINETIC" onBackPress={() => router.back()} style={{ marginHorizontal: -20 }} />

          <View
            className="mt-5 overflow-hidden rounded-[28px] border border-slate-200 bg-white p-5"
            style={premiumShadow()}
          >
            <View className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-indigo-100" />

            <Text className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Review Center</Text>
            <Text className="mt-3 text-[22px] font-black text-slate-950">{session.slot.court.name}</Text>
            <Text className="mt-1 text-[13px] font-bold leading-5 text-slate-500">
              {session.slot.court.address} · {session.slot.court.city}
            </Text>

            <View className="mt-4 flex-row flex-wrap gap-2">
              <View className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-2">
                <Text className="text-[11px] font-black uppercase tracking-[1px] text-indigo-700">
                  {formatTimeLabel(session.slot.start_time, session.slot.end_time)}
                </Text>
              </View>
              <View className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2">
                <Text className="text-[11px] font-black uppercase tracking-[1px] text-emerald-700">
                  {getShortSkillLabel(sessionSkill)}
                </Text>
              </View>
              <View className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
                <Text className="text-[11px] font-black uppercase tracking-[1px] text-slate-600">
                  Target {matchTargetElo} Elo
                </Text>
              </View>
            </View>

            <View className="mt-5 flex-row items-end justify-between">
              <View>
                <Text className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Đang chờ duyệt</Text>
                <Text className="mt-1 text-[34px] font-black leading-[36px] text-slate-950">{applicants.length}</Text>
              </View>

              <View className="items-end">
                <Text className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Yêu cầu duyệt tay</Text>
                <Text className="mt-1 text-[14px] font-black text-slate-700">
                  {session.require_approval ? 'Đang bật' : 'Đang tắt'}
                </Text>
              </View>
            </View>
          </View>

          <View className="mt-6">
            {applicants.length > 0 ? (
              applicants.map((applicant) => (
                <RequestCard
                  key={applicant.id}
                  applicant={applicant}
                  eloMin={session.elo_min}
                  eloMax={session.elo_max}
                  onOpenPlayer={(playerId) => router.push({ pathname: '/player/[id]' as any, params: { id: playerId } })}
                  onAccept={approveRequest}
                  onReject={rejectRequest}
                  onQuickReply={replyWithTemplate}
                  busy={submittingId === applicant.id}
                />
              ))
            ) : (
              <View
                className="items-center rounded-[28px] border border-slate-200 bg-white px-6 py-12"
                style={premiumShadow(4)}
              >
                <View className="h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
                  <ShieldCheck size={24} color="#059669" strokeWidth={ICON_STROKE} />
                </View>
                <Text className="mt-4 text-center text-[22px] font-black text-slate-950">Không còn yêu cầu chờ duyệt</Text>
                <Text className="mt-2 text-center text-[14px] leading-6 text-slate-500">
                  Review center đang trống. Khi có người muốn tham gia, hồ sơ của họ sẽ xuất hiện tại đây.
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        <View className="border-t border-slate-100 bg-white/95 px-5 pt-4" style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
          <View className="flex-row gap-3">
            <Pressable
              onPress={cancelSession}
              disabled={cancelling}
              className="active:scale-95 h-14 flex-1 flex-row items-center justify-center rounded-2xl border border-rose-100 bg-rose-50"
            >
              {cancelling ? (
                <LoaderCircle size={18} color="#e11d48" strokeWidth={ICON_STROKE} />
              ) : (
                <CircleX size={18} color="#e11d48" strokeWidth={ICON_STROKE} />
              )}
              <Text className="ml-2 text-[14px] font-black text-rose-600">
                {cancelling ? 'Đang hủy...' : 'Hủy kèo'}
              </Text>
            </Pressable>

            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/create-session' as any,
                  params: { editSessionId: session.id },
                })
              }
              className="active:scale-95 h-14 flex-[1.2] flex-row items-center justify-center rounded-2xl bg-slate-900"
            >
              <PencilLine size={18} color="#ffffff" strokeWidth={ICON_STROKE} />
              <Text className="ml-2 text-[14px] font-black text-white">Chỉnh sửa kèo</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  )
}
