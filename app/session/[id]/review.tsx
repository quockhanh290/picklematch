import { ScreenHeader } from '@/components/design'
import { PROFILE_THEME_COLORS, PROFILE_THEME_SEMANTIC } from '@/components/profile/profileTheme'
import { SessionMetaCard } from '@/components/session/SessionMetaCard'
import { insertNotification } from '@/lib/notifications'
import { formatPricePerPerson } from '@/lib/sessionDetail'
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
import { useCallback, useEffect, useState } from 'react'
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
  '\u0054\u0072\u00EC\u006E\u0068\u0020\u0068\u01A1\u0069\u0020\u006C\u1EC7\u0063\u0068\u002C\u0020\u0062\u1EA1\u006E\u0020\u0063\u0068\u1EAF\u0063\u0020\u0063\u0068\u1EE9\u003F',
  '\u0110\u1EE3\u0069\u0020\u006D\u00EC\u006E\u0068\u0020\u0067\u006F\u006D\u0020\u0111\u1EE7\u0020\u006E\u0067\u01B0\u1EDD\u0069\u0020\u0072\u1ED3\u0069\u0020\u0062\u00E1\u006F\u0020\u006E\u0068\u00E9\u002E',
  '\u004D\u00EC\u006E\u0068\u0020\u01B0\u0075\u0020\u0074\u0069\u00EA\u006E\u0020\u0074\u0065\u0061\u006D\u0020\u0063\u00E2\u006E\u0020\u0068\u01A1\u006E\u0020\u006D\u1ED9\u0074\u0020\u0063\u0068\u00FA\u0074\u002E',
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
  is_ranked?: boolean | null
  court_booking_status?: 'confirmed' | 'unconfirmed' | null
  booking_notes?: string | null
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
  player:
    | {
        name?: string | null
        elo?: number | null
        current_elo?: number | null
        self_assessed_level?: string | null
        skill_label?: string | null
        sessions_joined?: number | null
        no_show_count?: number | null
        reliability_score?: number | null
      }
    | {
        name?: string | null
        elo?: number | null
        current_elo?: number | null
        self_assessed_level?: string | null
        skill_label?: string | null
        sessions_joined?: number | null
        no_show_count?: number | null
        reliability_score?: number | null
      }[]
    | null
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
  if (player.reliability_score != null) return Math.round(player.reliability_score)
  const joined = player.sessions_joined ?? 0
  if (!joined) return null
  const noShow = player.no_show_count ?? 0
  return Math.max(0, Math.min(100, Math.round(((joined - noShow) / joined) * 100)))
}

function getReliabilityTone(score: number | null) {
  if (score == null) {
    return {
      badgeBg: PROFILE_THEME_SEMANTIC.infoBg,
      badgeIcon: PROFILE_THEME_SEMANTIC.infoIcon,
      badgeText: PROFILE_THEME_SEMANTIC.infoText,
    }
  }

  if (score >= 90) {
    return {
      badgeBg: PROFILE_THEME_SEMANTIC.successBg,
      badgeIcon: PROFILE_THEME_COLORS.surfaceTint,
      badgeText: PROFILE_THEME_SEMANTIC.successText,
    }
  }

  if (score >= 70) {
    return {
      badgeBg: PROFILE_THEME_SEMANTIC.warningBg,
      badgeIcon: PROFILE_THEME_SEMANTIC.warningStrong,
      badgeText: PROFILE_THEME_SEMANTIC.warningText,
    }
  }

  return {
    badgeBg: PROFILE_THEME_SEMANTIC.dangerBg,
    badgeIcon: PROFILE_THEME_SEMANTIC.dangerStrong,
    badgeText: PROFILE_THEME_SEMANTIC.dangerText,
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
  return `${weekdayLabels[startDate.getDay()]}, ${day} • ${startClock} - ${endClock}`
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
    shadowColor: PROFILE_THEME_COLORS.onBackground,
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
    ? { bg: PROFILE_THEME_SEMANTIC.dangerBg, border: PROFILE_THEME_SEMANTIC.dangerBorderSoft, text: PROFILE_THEME_SEMANTIC.dangerText }
    : { bg: PROFILE_THEME_COLORS.secondaryContainer, border: PROFILE_THEME_COLORS.outlineVariant, text: PROFILE_THEME_COLORS.surfaceTint }

  return (
    <View
      className="mb-4 overflow-hidden rounded-[28px] p-4"
      style={{
        borderWidth: 1,
        borderColor: PROFILE_THEME_COLORS.outlineVariant,
        backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest,
        ...premiumShadow(),
      }}
    >
      {lowMatch ? (
        <View
          className="absolute inset-x-0 top-0 h-1"
          style={{ backgroundColor: PROFILE_THEME_SEMANTIC.dangerStrong }}
        />
      ) : null}

      <Pressable onPress={() => onOpenPlayer(applicant.player_id)} className="active:scale-95">
        <View className="flex-row items-start">
          <View className="relative">
            <View
              className="h-14 w-14 items-center justify-center rounded-2xl"
              style={{ backgroundColor: PROFILE_THEME_COLORS.primary }}
            >
              <Text style={{ fontSize: 18, fontFamily: 'PlusJakartaSans-ExtraBold', color: PROFILE_THEME_COLORS.onPrimary }}>{getInitials(applicant.player.name)}</Text>
            </View>
            <View
              className="absolute -bottom-1 -right-1 h-6 w-6 items-center justify-center rounded-full border-2"
              style={{
                backgroundColor: reliabilityTone.badgeBg,
                borderColor: PROFILE_THEME_COLORS.surfaceContainerLowest,
              }}
            >
              <ShieldCheck size={12} color={reliabilityTone.badgeIcon} strokeWidth={ICON_STROKE} />
            </View>
          </View>

          <View className="ml-4 min-w-0 flex-1">
            <Text style={{ fontSize: 17, fontFamily: 'PlusJakartaSans-ExtraBold', color: PROFILE_THEME_COLORS.onSurface }}>{applicant.player.name}</Text>
            <Text className="mt-1" style={{ fontSize: 13, fontFamily: 'PlusJakartaSans-SemiBold', color: PROFILE_THEME_COLORS.onSurfaceVariant }}>
              {`Elo ${playerElo} • ${applicant.player.sessions_joined ?? 0} kèo đã chơi`}
            </Text>
            <Text className="mt-1" style={{ fontSize: 12, fontFamily: 'PlusJakartaSans-Bold', color: reliabilityTone.badgeText }}>
              {reliability != null ? `${reliability}% uy tín` : 'Chưa đủ dữ liệu uy tín'}
            </Text>
          </View>

          <View
            className="rounded-2xl border px-3 py-1.5"
            style={{ backgroundColor: matchTone.bg, borderColor: matchTone.border }}
          >
            <Text className="text-[12px]" style={{ fontFamily: 'PlusJakartaSans-ExtraBold', color: matchTone.text }}>
              {`${matchScore}% ph\u00F9 h\u1EE3p`}
            </Text>
          </View>
        </View>
      </Pressable>

      {lowMatch ? (
        <View
          className="mt-4 flex-row rounded-2xl border px-4 py-3"
          style={{
            borderColor: PROFILE_THEME_SEMANTIC.dangerBorderSoft,
            backgroundColor: PROFILE_THEME_SEMANTIC.dangerBg,
          }}
        >
          <View className="mt-0.5">
            <AlertTriangle size={16} color={PROFILE_THEME_SEMANTIC.dangerStrong} strokeWidth={ICON_STROKE} />
          </View>
          <Text className="ml-3 flex-1" style={{ fontSize: 13, lineHeight: 20, fontFamily: 'PlusJakartaSans-Bold', color: PROFILE_THEME_SEMANTIC.dangerText }}>
            Trình độ hơi lệch ({diffFromTarget >= 0 ? '+' : ''}
            {diffFromTarget} Elo). {'\u0042\u1EA1\u006E\u0020\u0063\u0068\u1EAF\u0063\u0020\u0063\u0068\u1EE9\u003F'}
          </Text>
        </View>
      ) : null}

      <View
        className="relative mt-4 rounded-2xl border p-4"
        style={{ borderColor: PROFILE_THEME_COLORS.outlineVariant, backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow }}
      >
        <View
          className="absolute left-3 top-0 -translate-y-1/2 rounded-full border px-2 py-1"
          style={{ borderColor: PROFILE_THEME_COLORS.outlineVariant, backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest }}
        >
          <Text className="text-[10px]" style={{ fontFamily: 'PlusJakartaSans-ExtraBold', color: PROFILE_THEME_COLORS.outline, textTransform: 'uppercase', letterSpacing: 1.2 }}>
            {'L\u1EDDi nh\u1EAFn'}
          </Text>
        </View>
        <Text className="pt-2 text-[14px] leading-6" style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: 'PlusJakartaSans-Regular' }}>
          {applicant.intro_note?.trim() ? applicant.intro_note : 'Người chơi chưa để lại lời nhắn nào.'}
        </Text>
      </View>

      <View className="mt-4 flex-row gap-3">
        <Pressable
          onPress={() => onReject(applicant.id, applicant.player_id)}
          disabled={busy}
          className="active:scale-95 h-14 flex-1 flex-row items-center justify-center rounded-[20px] px-4"
          style={{ borderWidth: 1, borderColor: PROFILE_THEME_COLORS.outlineVariant, backgroundColor: PROFILE_THEME_COLORS.errorContainer }}
        >
          <UserX size={18} color={PROFILE_THEME_COLORS.onErrorContainer} strokeWidth={ICON_STROKE} />
          <Text className="ml-2 text-[14px]" style={{ fontFamily: 'PlusJakartaSans-ExtraBold', color: PROFILE_THEME_COLORS.onErrorContainer }}>{'\u0054\u1EEB\u0020\u0063\u0068\u1ED1\u0069'}</Text>
        </Pressable>

        <Pressable
          onPress={() => onAccept(applicant.id, applicant.player_id)}
          disabled={busy}
          className="active:scale-95 h-14 flex-[1.5] flex-row items-center justify-center rounded-[20px] px-4"
          style={{ backgroundColor: PROFILE_THEME_COLORS.primary }}
        >
          <UserCheck size={18} color={PROFILE_THEME_COLORS.onPrimary} strokeWidth={ICON_STROKE} />
          <Text className="ml-2 text-[14px]" style={{ fontFamily: 'PlusJakartaSans-ExtraBold', color: PROFILE_THEME_COLORS.onPrimary }}>{'\u0043\u0068\u1EA5\u0070\u0020\u006E\u0068\u1EAD\u006E'}</Text>
        </Pressable>
      </View>

      <View className="mt-4 flex-row flex-wrap gap-2">
        {QUICK_REPLY_TEMPLATES.map((template) => (
          <Pressable
            key={template}
            onPress={() => onQuickReply(applicant.id, applicant.player_id, template)}
            disabled={busy}
            className="active:scale-95 rounded-full border px-3 py-2"
            style={{
              borderColor: PROFILE_THEME_COLORS.outlineVariant,
              backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest,
            }}
          >
            <Text className="text-[12px]" style={{ fontFamily: 'PlusJakartaSans-SemiBold', color: PROFILE_THEME_SEMANTIC.infoText }}>{template}</Text>
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
    if (!id) return

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
          reliability_score: player?.reliability_score ?? null,
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
      '\u0110\u01B0\u1EE3\u0063\u0020\u0064\u0075\u0079\u1EC7\u0074\u0021',
      `\u0042\u1EA1\u006E\u0020\u0111\u00E3\u0020\u0111\u01B0\u1EE3\u0063\u0020\u0063\u0068\u1EA5\u0070\u0020\u006E\u0068\u1EAD\u006E\u0020\u0076\u00E0\u006F\u0020\u006B\u00E8\u006F\u0020\u006C\u00FA\u0063\u0020${slotTime}.`,
      'join_approved',
      `/session/${session.id}`,
    )

    setSubmittingId(null)
    router.replace({ pathname: '/session/[id]' as any, params: { id: session.id } })
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
      '\u0048\u006F\u0073\u0074\u0020\u0111\u00E3\u0020\u0074\u1EEB\u0020\u0063\u0068\u1ED1\u0069\u0020\u0079\u00EA\u0075\u0020\u0063\u1EA7\u0075\u0020\u0074\u0068\u0061\u006D\u0020\u0067\u0069\u0061\u0020\u0063\u1EE7\u0061\u0020\u0062\u1EA1\u006E\u002E',
      'join_rejected',
      `/session/${session.id}`,
    )

    setSubmittingId(null)
    router.replace({ pathname: '/session/[id]' as any, params: { id: session.id } })
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
        ? '\u004B\u00E8\u006F\u0020\u0111\u00E3\u0020\u0111\u1EE7\u0020\u006E\u0067\u01B0\u1EDD\u0069\u0020\u0063\u0068\u01A1\u0069\u002C\u0020\u0076\u0069\u1EC7\u0063\u0020\u0068\u1EE7\u0079\u0020\u006B\u00E8\u006F\u0020\u0073\u1EBD\u0020\u1EA3\u006E\u0068\u0020\u0068\u01B0\u1EDF\u006E\u0067\u0020\u0111\u1EBF\u006E\u0020\u0074\u1EF7\u0020\u006C\u1EC7\u0020\u0075\u0079\u0020\u0074\u00ED\u006E\u0020\u0063\u1EE7\u0061\u0020\u0062\u1EA1\u006E\u002E\u0020\u0042\u1EA1\u006E\u0020\u0063\u00F3\u0020\u0063\u0068\u1EAF\u0063\u0020\u006B\u0068\u00F4\u006E\u0067\u003F'
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
      <SafeAreaView className="flex-1 items-center justify-center" style={{ backgroundColor: PROFILE_THEME_COLORS.background }}>
        <ActivityIndicator size="large" color={PROFILE_THEME_COLORS.primary} />
      </SafeAreaView>
    )
  }

  if (!session) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center px-6" style={{ backgroundColor: PROFILE_THEME_COLORS.background }}>
        <Text style={{ textAlign: 'center', fontSize: 15, fontFamily: 'PlusJakartaSans-SemiBold', color: PROFILE_THEME_SEMANTIC.infoIcon }}>{'\u004B\u0068\u00F4\u006E\u0067\u0020\u0074\u00EC\u006D\u0020\u0074\u0068\u1EA5\u0079\u0020\u0064\u1EEF\u0020\u006C\u0069\u1EC7\u0075\u0020\u0072\u0065\u0076\u0069\u0065\u0077\u0020\u0063\u0068\u006F\u0020\u006B\u00E8\u006F\u0020\u006E\u00E0\u0079\u002E'}</Text>
      </SafeAreaView>
    )
  }

  if (!userId || userId !== session.host.id) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center px-6" style={{ backgroundColor: PROFILE_THEME_COLORS.background }}>
        <CircleX size={28} color={PROFILE_THEME_SEMANTIC.dangerStrong} strokeWidth={ICON_STROKE} />
        <Text className="mt-4 text-center" style={{ fontSize: 18, fontFamily: 'PlusJakartaSans-ExtraBold', color: PROFILE_THEME_COLORS.onSurface }}>{'\u0042\u1EA1\u006E\u0020\u006B\u0068\u00F4\u006E\u0067\u0020\u0063\u00F3\u0020\u0071\u0075\u0079\u1EC1\u006E\u0020\u0074\u0072\u0075\u0079\u0020\u0063\u1EAD\u0070'}</Text>
        <Text className="mt-2 text-center text-[14px] leading-6" style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant }}>
          {'\u0043\u0068\u1EC9\u0020\u0068\u006F\u0073\u0074\u0020\u0063\u1EE7\u0061\u0020\u006B\u00E8\u006F\u0020\u006D\u1EDB\u0069\u0020\u0063\u00F3\u0020\u0074\u0068\u1EC3\u0020\u0078\u0065\u006D\u0020\u0076\u00E0\u0020\u0078\u1EED\u0020\u006C\u00FD\u0020\u0074\u0072\u0075\u006E\u0067\u0020\u0074\u00E2\u006D\u0020\u0064\u0075\u0079\u1EC7\u0074\u0020\u0079\u00EA\u0075\u0020\u0063\u1EA7\u0075\u0020\u006E\u00E0\u0079\u002E'}
        </Text>
        <Pressable
          onPress={() => router.back()}
          className="mt-6 active:scale-95 rounded-2xl px-5 py-3.5"
          style={{ backgroundColor: PROFILE_THEME_COLORS.primary }}
        >
          <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans-ExtraBold', color: PROFILE_THEME_COLORS.onPrimary }}>{'\u0051\u0075\u0061\u0079\u0020\u006C\u1EA1\u0069'}</Text>
        </Pressable>
      </SafeAreaView>
    )
  }

  const sessionSkill = getSkillLevelFromEloRange(session.elo_min, session.elo_max)

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: PROFILE_THEME_COLORS.background }} edges={['top']}>
      <View className="flex-1">
        <ScreenHeader variant="brand" title="KINETIC" onBackPress={() => router.back()} />
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 140 + insets.bottom,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View className="mt-5">
            <SessionMetaCard
              skillLevelId={sessionSkill.id}
              sessionSkillLabel={getShortSkillLabel(sessionSkill)}
              courtBookingStatus={session.court_booking_status ?? 'unconfirmed'}
              courtName={session.slot.court.name}
              courtAddress={session.slot.court.address}
              courtCity={session.slot.court.city}
              timeLabel={formatTimeLabel(session.slot.start_time, session.slot.end_time)}
              priceLabel={formatPricePerPerson(session.slot.price, session.max_players)}
              isRanked={session.is_ranked ?? true}
              hostNote={session.booking_notes}
              sessionStatus={session.status}
            />
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
                className="items-center rounded-[28px] border px-6 py-12"
                style={{
                  borderColor: PROFILE_THEME_COLORS.outlineVariant,
                  backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest,
                  ...premiumShadow(4),
                }}
              >
                <View className="h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: PROFILE_THEME_SEMANTIC.successBg }}>
                  <ShieldCheck size={24} color={PROFILE_THEME_COLORS.surfaceTint} strokeWidth={ICON_STROKE} />
                </View>
                <Text className="mt-4 text-center" style={{ fontSize: 22, fontFamily: 'PlusJakartaSans-ExtraBold', color: PROFILE_THEME_COLORS.onSurface }}>{'\u004B\u0068\u00F4\u006E\u0067\u0020\u0063\u00F2\u006E\u0020\u0079\u00EA\u0075\u0020\u0063\u1EA7\u0075\u0020\u0063\u0068\u1EDD\u0020\u0064\u0075\u0079\u1EC7\u0074'}</Text>
                <Text
                  className="mt-2 text-center"
                  style={{ fontSize: 14, lineHeight: 24, fontFamily: 'PlusJakartaSans-Regular', color: PROFILE_THEME_SEMANTIC.infoIcon }}
                >
                  {'\u0052\u0065\u0076\u0069\u0065\u0077\u0020\u0063\u0065\u006E\u0074\u0065\u0072\u0020\u0111\u0061\u006E\u0067\u0020\u0074\u0072\u1ED1\u006E\u0067\u002E\u0020\u004B\u0068\u0069\u0020\u0063\u00F3\u0020\u006E\u0067\u01B0\u1EDD\u0069\u0020\u006D\u0075\u1ED1\u006E\u0020\u0074\u0068\u0061\u006D\u0020\u0067\u0069\u0061\u002C\u0020\u0068\u1ED3\u0020\u0073\u01A1\u0020\u0063\u1EE7\u0061\u0020\u0068\u1ECD\u0020\u0073\u1EBD\u0020\u0078\u0075\u1EA5\u0074\u0020\u0068\u0069\u1EC7\u006E\u0020\u0074\u1EA1\u0069\u0020\u0111\u00E2\u0079\u002E'}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>

        <View
          className="absolute bottom-0 left-0 right-0 border-t px-5 pt-4"
          style={{
            borderColor: PROFILE_THEME_COLORS.outlineVariant,
            backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest,
            paddingBottom: Math.max(insets.bottom, 16),
          }}
        >
          <View className="flex-row gap-3">
            <Pressable
              onPress={cancelSession}
              disabled={cancelling}
              className="active:scale-95 h-14 flex-1 flex-row items-center justify-center rounded-[20px]"
              style={{
                borderWidth: 1,
                borderColor: PROFILE_THEME_COLORS.outlineVariant,
                backgroundColor: PROFILE_THEME_COLORS.errorContainer,
              }}
            >
              {cancelling ? (
                <LoaderCircle size={18} color={PROFILE_THEME_COLORS.onErrorContainer} strokeWidth={ICON_STROKE} />
              ) : (
                <CircleX size={18} color={PROFILE_THEME_COLORS.onErrorContainer} strokeWidth={ICON_STROKE} />
              )}
              <Text className="ml-2 text-[14px]" style={{ fontFamily: 'PlusJakartaSans-ExtraBold', color: PROFILE_THEME_COLORS.onErrorContainer }}>
                {cancelling ? '\u0110\u0061\u006E\u0067\u0020\u0068\u1EE7\u0079\u002E\u002E\u002E' : '\u0048\u1EE7\u0079\u0020\u006B\u00E8\u006F'}
              </Text>
            </Pressable>

            <Pressable
              onPress={() =>
                router.replace({
                  pathname: '/session/[id]' as any,
                  params: { id: session.id, edit: '1' },
                })
              }
              className="active:scale-95 h-14 flex-[1.2] flex-row items-center justify-center rounded-[20px]" style={{ backgroundColor: PROFILE_THEME_COLORS.primary }}
            >
              <PencilLine size={18} color={PROFILE_THEME_COLORS.onPrimary} strokeWidth={ICON_STROKE} />
              <Text className="ml-2 text-[14px]" style={{ fontFamily: 'PlusJakartaSans-ExtraBold', color: PROFILE_THEME_COLORS.onPrimary }}>{'\u0043\u0068\u1EC9\u006E\u0068\u0020\u0073\u1EED\u0061\u0020\u006B\u00E8\u006F'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  )
}
