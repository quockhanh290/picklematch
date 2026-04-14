import { router, useLocalSearchParams } from 'expo-router'
import {
  ActivityIndicator,
  Alert,
  Animated,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  Text,
  UIManager,
  View,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  ArrowLeft,
  ArrowRight,
  MinusCircle,
  PlusCircle,
  Timer,
  Trophy,
} from 'lucide-react-native'
import { useEffect, useMemo, useRef, useState } from 'react'

import { supabase } from '@/lib/supabase'

const ICON_STROKE_WIDTH = 2.5

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

type SessionPlayerRecord = {
  player_id: string
  status?: string | null
  team_no?: 1 | 2 | null
  player?: {
    name?: string | null
  } | null
}

type MatchSessionRecord = {
  id: string
  status: string
  results_status?: string | null
  host?: {
    id?: string
    name?: string | null
  } | null
  slot?: {
    start_time?: string | null
    end_time?: string | null
    court?: {
      name?: string | null
    } | null
  } | null
  session_players: SessionPlayerRecord[]
}

type TeamPlayer = {
  id: string
  name: string
  avatar: string
  accent: string
}

type TeamSummary = {
  id: 'A' | 'B'
  name: string
  theme: {
    border: string
    tint: string
    text: string
    button: string
    buttonSoft: string
    subtext: string
    widgetText: string
  }
  players: TeamPlayer[]
}

const TEAM_VISUALS = {
  A: {
    border: '#10b981',
    tint: '#ecfdf5',
    text: '#065f46',
    button: '#059669',
    buttonSoft: '#d1fae5',
    subtext: '#047857',
    widgetText: '#34d399',
    accentPalette: ['#a7f3d0', '#6ee7b7', '#d1fae5', '#bbf7d0'],
  },
  B: {
    border: '#6366f1',
    tint: '#eef2ff',
    text: '#312e81',
    button: '#4f46e5',
    buttonSoft: '#e0e7ff',
    subtext: '#4338ca',
    widgetText: '#a5b4fc',
    accentPalette: ['#c7d2fe', '#a5b4fc', '#e0e7ff', '#c4b5fd'],
  },
} as const

function clampScore(value: number) {
  return Math.max(0, Math.min(99, value))
}

function getInitials(name: string) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)

  if (!parts.length) return '?'
  return parts.map((part) => part[0]?.toUpperCase() ?? '').join('')
}

function getDateLabel(value?: string | null) {
  if (!value) return 'Chưa rõ ngày thi đấu'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Chưa rõ ngày thi đấu'

  return date.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function getTimeRangeLabel(start?: string | null, end?: string | null) {
  if (!start || !end) return 'Chưa rõ thời gian'

  const startDate = new Date(start)
  const endDate = new Date(end)
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return 'Chưa rõ thời gian'

  const startClock = startDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  const endClock = endDate.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  return `${startClock} - ${endClock}`
}

function getEloSwing(diff: number) {
  return 12 + Math.min(diff * 2, 10)
}

function getStreakLabel(scoreA: number, scoreB: number) {
  if (scoreA === scoreB) return '0 STREAK'
  return '+1 STREAK'
}

function buildTeams(session: MatchSessionRecord | null) {
  const players = (session?.session_players ?? [])
    .filter((item) => item.status !== 'rejected')
    .map((item) => ({
      id: item.player_id,
      name: item.player?.name?.trim() || 'Người chơi',
      teamNo: item.team_no,
    }))

  const hasSavedTeams = players.some((player) => player.teamNo === 1 || player.teamNo === 2)
  const distributed = hasSavedTeams
    ? players.map((player, index) => ({
        ...player,
        teamNo: player.teamNo === 1 || player.teamNo === 2 ? player.teamNo : null,
        index,
      }))
    : players.map((player, index) => ({
        ...player,
        teamNo: index % 2 === 0 ? 1 : 2,
        index,
      }))

  const teamAPlayers = distributed
    .filter((player) => player.teamNo === 1)
    .map((player, index) => ({
      id: player.id,
      name: player.name,
      avatar: getInitials(player.name),
      accent: TEAM_VISUALS.A.accentPalette[index % TEAM_VISUALS.A.accentPalette.length],
    }))

  const teamBPlayers = distributed
    .filter((player) => player.teamNo === 2)
    .map((player, index) => ({
      id: player.id,
      name: player.name,
      avatar: getInitials(player.name),
      accent: TEAM_VISUALS.B.accentPalette[index % TEAM_VISUALS.B.accentPalette.length],
    }))

  return [
    {
      id: 'A' as const,
      name: 'Team A',
      theme: TEAM_VISUALS.A,
      players: teamAPlayers,
    },
    {
      id: 'B' as const,
      name: 'Team B',
      theme: TEAM_VISUALS.B,
      players: teamBPlayers,
    },
  ]
}

function PlayerChip({ player }: { player: TeamPlayer }) {
  return (
    <View className="mr-3 flex-row items-center">
      <View
        className="h-11 w-11 items-center justify-center rounded-full border border-white/70"
        style={{ backgroundColor: player.accent }}
      >
        <Text className="text-[13px] font-black text-slate-950">{player.avatar}</Text>
      </View>
      <Text className="ml-3 text-[15px] font-black text-slate-900">{player.name}</Text>
    </View>
  )
}

function ScoreControl({
  icon: Icon,
  label,
  onPress,
  color,
  background,
}: {
  icon: typeof PlusCircle
  label: string
  onPress: () => void
  color: string
  background: string
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="flex-1 flex-row items-center justify-center rounded-[24px] px-4 py-4"
      style={{ backgroundColor: background }}
    >
      <Icon color={color} size={24} strokeWidth={ICON_STROKE_WIDTH} />
      <Text className="ml-2 text-[14px] font-black uppercase tracking-[1.1px]" style={{ color }}>
        {label}
      </Text>
    </Pressable>
  )
}

function ScorePanel({
  team,
  score,
  onIncrease,
  onDecrease,
}: {
  team: TeamSummary
  score: number
  onIncrease: () => void
  onDecrease: () => void
}) {
  return (
    <View className="flex-1">
      <View
        className="rounded-[40px] border-[3px] px-5 pb-6 pt-5"
        style={{
          backgroundColor: team.theme.tint,
          borderColor: team.theme.border,
          shadowColor: team.theme.border,
          shadowOpacity: 0.14,
          shadowRadius: 22,
          shadowOffset: { width: 0, height: 12 },
          elevation: 6,
        }}
      >
        <Text className="text-[13px] font-black uppercase tracking-[2.5px]" style={{ color: team.theme.subtext }}>
          {team.name}
        </Text>
        <Text className="mt-4 text-center text-[64px] font-black leading-none" style={{ color: team.theme.text }}>
          {score}
        </Text>
        <Text className="mt-3 text-center text-[13px] font-black uppercase tracking-[1.6px]" style={{ color: team.theme.subtext }}>
          Final Score
        </Text>
      </View>

      <View className="mt-4 flex-row gap-3">
        <ScoreControl
          icon={MinusCircle}
          label="Giảm"
          onPress={onDecrease}
          color={team.theme.text}
          background={team.theme.buttonSoft}
        />
        <ScoreControl
          icon={PlusCircle}
          label="Tăng"
          onPress={onIncrease}
          color="#ffffff"
          background={team.theme.button}
        />
      </View>
    </View>
  )
}

export default function MatchResultEntryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [session, setSession] = useState<MatchSessionRecord | null>(null)
  const [scoreA, setScoreA] = useState(0)
  const [scoreB, setScoreB] = useState(0)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const entryFade = useRef(new Animated.Value(0)).current
  const entryTranslate = useRef(new Animated.Value(18)).current
  const previewFade = useRef(new Animated.Value(1)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(entryFade, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.timing(entryTranslate, {
        toValue: 0,
        duration: 420,
        useNativeDriver: true,
      }),
    ]).start()
  }, [entryFade, entryTranslate])

  useEffect(() => {
    let mounted = true

    async function loadSession() {
      if (!id) {
        if (mounted) setLoading(false)
        return
      }

      setLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.replace('/login' as any)
        return
      }

      if (mounted) {
        setCurrentUserId(user.id)
      }

      const { data, error } = await supabase.rpc('get_session_detail_overview', {
        p_session_id: id,
      })

      if (error) {
        Alert.alert('Không tải được trận đấu', error.message)
        if (mounted) {
          setSession(null)
          setLoading(false)
        }
        return
      }

      const nextSession = (data?.session ?? null) as MatchSessionRecord | null

      if (nextSession?.host?.id && nextSession.host.id !== user.id) {
        Alert.alert('Chỉ host mới được nhập kết quả', 'Bạn có thể xem trận này, nhưng chỉ host mới có thể gửi kết quả cuối cùng.', [
          {
            text: 'Quay lại',
            onPress: () => router.back(),
          },
        ])

        if (mounted) {
          setSession(null)
          setLoading(false)
        }
        return
      }

      if (mounted) {
        setSession(nextSession)
        setLoading(false)
      }
    }

    void loadSession()

    return () => {
      mounted = false
    }
  }, [id])

  const teams = useMemo(() => buildTeams(session), [session])

  const winner = useMemo(() => {
    if (scoreA === scoreB) {
      return null
    }

    return scoreA > scoreB ? teams[0] : teams[1]
  }, [scoreA, scoreB, teams])

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    previewFade.setValue(0.72)
    Animated.timing(previewFade, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start()
  }, [previewFade, winner, scoreA, scoreB])

  const scoreDiff = Math.abs(scoreA - scoreB)
  const winningElo = getEloSwing(scoreDiff)
  const losingElo = -Math.max(8, winningElo - 6)
  const eloLabel = winner ? `+${winningElo} ELO` : '0 ELO'
  const streakLabel = getStreakLabel(scoreA, scoreB)
  const resultHeadline = winner ? `${winner.name.toUpperCase()} THẮNG` : 'ĐANG HÒA'
  const eloDetail = winner ? `Đội còn lại ${losingElo} ELO` : 'Chưa xác định thay đổi'

  function adjustScore(teamId: 'A' | 'B', delta: number) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    if (teamId === 'A') {
      setScoreA((current) => clampScore(current + delta))
      return
    }

    setScoreB((current) => clampScore(current + delta))
  }

  async function onConfirm() {
    if (!session || !id) return

    if (!currentUserId || session.host?.id !== currentUserId) {
      Alert.alert('Chỉ host mới được nhập kết quả', 'Kết quả trận chỉ có thể được gửi bởi host của kèo này.')
      return
    }

    if (!teams[0].players.length || !teams[1].players.length) {
      Alert.alert('Thiếu đội hình', 'Trận này chưa có đủ người chơi ở cả hai đội để gửi kết quả.')
      return
    }

    if (scoreA === scoreB) {
      Alert.alert('Điểm số chưa hợp lệ', 'Vui lòng nhập kết quả có đội thắng rõ ràng trước khi xác nhận.')
      return
    }

    const payload = [...teams[0].players, ...teams[1].players].map((player) => {
      const belongsToWinner = winner?.players.some((entry) => entry.id === player.id) ?? false
      return {
        player_id: player.id,
        result: belongsToWinner ? 'win' : 'loss',
      }
    })

    setSubmitting(true)

    const { error } = await supabase.rpc('submit_session_results', {
      p_session_id: id,
      p_results: payload,
    })

    setSubmitting(false)

    if (error) {
      Alert.alert('Chưa thể gửi kết quả', error.message)
      return
    }

    Alert.alert(
      'Đã gửi kết quả',
      `Kết quả ${teams[0].name} ${scoreA} - ${scoreB} ${teams[1].name} đã được gửi đến người chơi để xác nhận.`,
      [
        {
          text: 'Đóng',
          onPress: () => router.back(),
        },
      ],
    )
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#f6f7fb]" edges={['top']}>
        <ActivityIndicator color="#059669" />
        <Text className="mt-4 text-[14px] font-black text-slate-500">Đang tải trận đấu...</Text>
      </SafeAreaView>
    )
  }

  if (!session) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#f6f7fb] px-6" edges={['top']}>
        <Text className="text-center text-[22px] font-black text-slate-950">Không tìm thấy trận đấu</Text>
        <Text className="mt-3 text-center text-[15px] font-semibold leading-6 text-slate-500">
          Trận này có thể đã bị xóa hoặc bạn không còn quyền truy cập.
        </Text>
        <Pressable onPress={() => router.back()} className="mt-6 rounded-2xl bg-slate-900 px-5 py-3">
          <Text className="text-[14px] font-black uppercase text-white">Quay lại</Text>
        </Pressable>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-[#f6f7fb]" edges={['top']}>
      <View
        className="absolute left-0 right-0 top-0 z-20 border-b border-white/70 bg-white/70 px-5 pb-4"
        style={{ paddingTop: insets.top > 0 ? 6 : 18 }}
      >
        <View className="flex-row items-center justify-between">
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            className="h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white/90"
          >
            <ArrowLeft color="#0f172a" size={22} strokeWidth={ICON_STROKE_WIDTH} />
          </Pressable>

          <Text className="text-[20px] font-black text-slate-950">Nhập kết quả</Text>

          <View className="h-12 min-w-12 items-center justify-center rounded-full bg-white/50 px-3">
            <Text className="text-[11px] font-black uppercase tracking-[1.4px] text-slate-400">
              #{session.id.slice(0, 4).toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      <Animated.View
        className="flex-1"
        style={{
          opacity: entryFade,
          transform: [{ translateY: entryTranslate }],
        }}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingTop: 104,
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 160,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View className="items-center rounded-[36px] border border-white/80 bg-white px-6 py-6">
            <View className="flex-row items-center rounded-full bg-emerald-50 px-4 py-2">
              <Trophy color="#059669" size={16} strokeWidth={ICON_STROKE_WIDTH} />
              <Text className="ml-2 text-[11px] font-black uppercase tracking-[1.8px] text-emerald-700">
                Đã xong
              </Text>
            </View>
            <Text className="mt-5 text-center text-[28px] font-black leading-[32px] text-slate-950">
              {session.slot?.court?.name ?? 'Kèo Pickleball'}
            </Text>
            <Text className="mt-3 text-center text-[15px] font-black text-slate-500">
              {getDateLabel(session.slot?.start_time)}
            </Text>
            <View className="mt-2 flex-row items-center">
              <Timer color="#64748b" size={16} strokeWidth={ICON_STROKE_WIDTH} />
              <Text className="ml-2 text-[15px] font-black text-slate-600">
                {getTimeRangeLabel(session.slot?.start_time, session.slot?.end_time)}
              </Text>
            </View>
          </View>

          <View className="mt-6 rounded-[40px] bg-white px-5 py-5">
            <View className="flex-row gap-4">
              <ScorePanel
                team={teams[0]}
                score={scoreA}
                onIncrease={() => adjustScore('A', 1)}
                onDecrease={() => adjustScore('A', -1)}
              />
              <ScorePanel
                team={teams[1]}
                score={scoreB}
                onIncrease={() => adjustScore('B', 1)}
                onDecrease={() => adjustScore('B', -1)}
              />
            </View>
          </View>

          <Animated.View
            className="mt-6 overflow-hidden rounded-[36px] bg-slate-900 px-5 py-5"
            style={{ opacity: previewFade }}
          >
            <Text className="text-[12px] font-black uppercase tracking-[2.4px] text-slate-400">
              TÓM TẮT TẠM TÍNH
            </Text>
            <Text className="mt-4 text-[30px] font-black leading-[34px]" style={{ color: '#BEF264' }}>
              {resultHeadline}
            </Text>
            <Text className="mt-2 text-[15px] font-black text-slate-400">
              Chỉ dùng để tham khảo nhanh trước khi gửi kết quả. Elo chính thức chỉ được cập nhật sau khi trận được xác nhận xong.
            </Text>

            <View className="mt-5 flex-row gap-3">
              <View className="flex-1 rounded-[28px] bg-white/6 px-4 py-4">
                <Text className="text-[11px] font-black uppercase tracking-[1.4px] text-slate-400">
                  ELO dự kiến đổi
                </Text>
                <Text className="mt-3 text-[26px] font-black" style={{ color: winner?.theme.widgetText ?? '#86efac' }}>
                  {eloLabel}
                </Text>
                <Text className="mt-1 text-[12px] font-black text-slate-500">{eloDetail}</Text>
              </View>

              <View className="flex-1 rounded-[28px] bg-white/6 px-4 py-4">
                <Text className="text-[11px] font-black uppercase tracking-[1.4px] text-slate-400">
                  Ảnh hưởng chuỗi
                </Text>
                <Text className="mt-3 text-[26px] font-black text-orange-300">{`${streakLabel} 🔥`}</Text>
              </View>
            </View>
          </Animated.View>

          <View className="mt-6 rounded-[36px] bg-white px-5 py-5">
            <Text className="text-[12px] font-black uppercase tracking-[2px] text-slate-500">
              Đội hình
            </Text>

            <View className="mt-5 rounded-[30px] bg-emerald-50 px-4 py-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-[18px] font-black text-emerald-900">{teams[0].name}</Text>
                <View className="rounded-full bg-white/80 px-3 py-1.5">
                  <Text className="text-[11px] font-black uppercase tracking-[1.3px] text-emerald-700">
                    {teams[0].players.length} người
                  </Text>
                </View>
              </View>
              <View className="mt-4">
                {teams[0].players.map((player) => (
                  <View key={player.id} className="mb-3 last:mb-0">
                    <PlayerChip player={player} />
                  </View>
                ))}
              </View>
            </View>

            <View className="mt-4 rounded-[30px] bg-indigo-50 px-4 py-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-[18px] font-black text-indigo-950">{teams[1].name}</Text>
                <View className="rounded-full bg-white/80 px-3 py-1.5">
                  <Text className="text-[11px] font-black uppercase tracking-[1.3px] text-indigo-700">
                    {teams[1].players.length} người
                  </Text>
                </View>
              </View>
              <View className="mt-4">
                {teams[1].players.map((player) => (
                  <View key={player.id} className="mb-3 last:mb-0">
                    <PlayerChip player={player} />
                  </View>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>

        <View
          className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white/95 px-5 pt-4"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              void onConfirm()
            }}
            disabled={submitting}
            className={`flex-row items-center justify-center rounded-2xl px-5 py-4 ${submitting ? 'bg-emerald-400' : 'bg-[#059669]'}`}
          >
            <Text className="text-[15px] font-black uppercase tracking-[1.2px] text-white">
              {submitting ? 'Đang gửi kết quả...' : 'Xác nhận và cập nhật ELO'}
            </Text>
            {!submitting ? (
              <View className="ml-2">
                <ArrowRight color="#ffffff" size={18} strokeWidth={ICON_STROKE_WIDTH} />
              </View>
            ) : null}
          </Pressable>
          <Text className="mt-3 text-center text-[12px] font-black leading-[18px] text-slate-500">
            Kết quả sẽ được gửi đến tất cả thành viên để xác nhận tính công bằng.
          </Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  )
}
