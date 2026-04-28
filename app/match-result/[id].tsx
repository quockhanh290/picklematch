import { router, useLocalSearchParams } from 'expo-router'
import { ArrowLeft, Minus, Plus, Save } from 'lucide-react-native'
import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { AppDialog, type AppDialogConfig } from '@/components/design'
import { PROFILE_THEME_COLORS } from '@/components/profile/profileTheme'
import { supabase } from '@/lib/supabase'
import { SCREEN_FONTS } from '@/constants/screenFonts'
import { RADIUS, SPACING, BORDER } from '@/constants/screenLayout'

function withAlpha(hex: string, alpha: number) {
  const clean = hex.replace('#', '')
  const normalized = clean.length === 3 ? clean.split('').map((char) => char + char).join('') : clean
  const n = Number.parseInt(normalized, 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

const RESULT_THEME = {
  pageBg: PROFILE_THEME_COLORS.surfaceContainerLow,
  pageBlob: withAlpha(PROFILE_THEME_COLORS.primaryContainer, 0.08),
  headerChipBg: PROFILE_THEME_COLORS.surfaceContainerHigh,
  headerIcon: PROFILE_THEME_COLORS.onSecondaryContainer,
  title: PROFILE_THEME_COLORS.primary,
  subtitle: PROFILE_THEME_COLORS.onSecondaryContainer,
  muted: PROFILE_THEME_COLORS.outline,
  line: PROFILE_THEME_COLORS.outlineVariant,
  vsBg: PROFILE_THEME_COLORS.surfaceContainer,
  vsText: PROFILE_THEME_COLORS.onSurfaceVariant,
  sectionBg: PROFILE_THEME_COLORS.surfaceContainer,
  sectionBorder: PROFILE_THEME_COLORS.outlineVariant,
  sectionCardBg: PROFILE_THEME_COLORS.surfaceContainerLowest,
  inputPlaceholder: PROFILE_THEME_COLORS.outline,
  inputText: PROFILE_THEME_COLORS.onSurface,
  primaryCta: PROFILE_THEME_COLORS.primaryContainer,
  primaryCtaPressed: PROFILE_THEME_COLORS.surfaceTint,
  primaryCtaText: PROFILE_THEME_COLORS.onPrimary,
  shadow: PROFILE_THEME_COLORS.primary,
} as const

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
  host?: {
    id?: string
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

type TeamSummary = {
  id: 'A' | 'B'
  name: string
  players: { id: string; name: string }[]
}

function clampScore(value: number) {
  return Math.max(0, Math.min(99, value))
}

function padScore(value: number) {
  return value.toString().padStart(2, '0')
}

function durationMinutes(start?: string | null, end?: string | null) {
  if (!start || !end) return 0
  const startDate = new Date(start)
  const endDate = new Date(end)
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return 0
  return Math.max(0, Math.round((endDate.getTime() - startDate.getTime()) / 60000))
}

function formatMatchDateTime(start?: string | null, end?: string | null) {
  if (!start || !end) return 'Chưa rõ lịch thi đấu'
  const startDate = new Date(start)
  const endDate = new Date(end)
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return 'Chưa rõ lịch thi đấu'

  const weekday = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][startDate.getDay()]
  const pad = (value: number) => value.toString().padStart(2, '0')
  const dateLabel = `${weekday}, ${pad(startDate.getDate())}/${pad(startDate.getMonth() + 1)}`
  const timeLabel = `${pad(startDate.getHours())}:${pad(startDate.getMinutes())} - ${pad(endDate.getHours())}:${pad(endDate.getMinutes())}`
  return `${dateLabel} • ${timeLabel}`
}

function buildTeams(session: MatchSessionRecord | null): TeamSummary[] {
  const players = (session?.session_players ?? [])
    .filter((item) => item.status !== 'rejected')
    .map((item) => ({
      id: item.player_id,
      name: item.player?.name?.trim() || 'Người chơi',
      teamNo: item.team_no,
    }))

  const hasAssigned = players.some((item) => item.teamNo === 1 || item.teamNo === 2)
  const distributed = hasAssigned
    ? players.map((item, index) => ({
        ...item,
        teamNo: item.teamNo === 1 || item.teamNo === 2 ? item.teamNo : (index % 2 === 0 ? 1 : 2),
      }))
    : players.map((item, index) => ({
        ...item,
        teamNo: index % 2 === 0 ? 1 : 2,
      }))

  return [
    {
      id: 'A',
      name: 'Đội A',
      players: distributed.filter((item) => item.teamNo === 1).map((item) => ({ id: item.id, name: item.name })),
    },
    {
      id: 'B',
      name: 'Đội B',
      players: distributed.filter((item) => item.teamNo === 2).map((item) => ({ id: item.id, name: item.name })),
    },
  ]
}

function PlayerTag({ name, dark }: { name: string; dark: boolean }) {
  return (
    <View
      style={{
        borderRadius: RADIUS.full,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 5,
        backgroundColor: dark ? withAlpha(PROFILE_THEME_COLORS.onPrimary, 0.14) : PROFILE_THEME_COLORS.surfaceContainerLowest,
        borderWidth: BORDER.base,
        borderColor: dark ? withAlpha(PROFILE_THEME_COLORS.onPrimary, 0.22) : PROFILE_THEME_COLORS.outlineVariant,
        marginLeft: 6,
      }}
    >
      <Text
        numberOfLines={1}
        style={{
          fontFamily: SCREEN_FONTS.cta,
          fontSize: 11,
          color: dark ? PROFILE_THEME_COLORS.secondaryContainer : PROFILE_THEME_COLORS.onSecondaryContainer,
        }}
      >
        {name}
      </Text>
    </View>
  )
}

function ScoreCard({
  team,
  score,
  dark,
  onDecrease,
  onIncrease,
}: {
  team: TeamSummary
  score: number
  dark: boolean
  onDecrease: () => void
  onIncrease: () => void
}) {
  const bg = dark ? PROFILE_THEME_COLORS.primaryContainer : PROFILE_THEME_COLORS.surfaceContainerLow
  const text = dark ? PROFILE_THEME_COLORS.onPrimary : PROFILE_THEME_COLORS.primary
  const label = dark ? PROFILE_THEME_COLORS.secondaryContainer : PROFILE_THEME_COLORS.onSecondaryContainer
  const btnMinusBg = dark ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.surfaceContainerLowest
  const btnPlusBg = dark ? PROFILE_THEME_COLORS.secondaryContainer : PROFILE_THEME_COLORS.primaryContainer
  const btnMinusText = dark ? PROFILE_THEME_COLORS.surfaceContainerLowest : PROFILE_THEME_COLORS.primary
  const btnPlusText = dark ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.onPrimary

  return (
    <View
      style={{
        borderRadius: RADIUS.hero,
        borderWidth: BORDER.base,
        borderColor: dark ? PROFILE_THEME_COLORS.surfaceTint : PROFILE_THEME_COLORS.outlineVariant,
        backgroundColor: bg,
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 18,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text
          style={{
            fontFamily: SCREEN_FONTS.bold,
            fontSize: 13,
            color: label,
            textTransform: 'uppercase',
          }}
        >
          {team.name}
        </Text>
        <View style={{ flexDirection: 'row', marginLeft: 8, flex: 1, justifyContent: 'flex-end' }}>
          {team.players.slice(0, 2).map((player) => (
            <PlayerTag key={player.id} name={player.name} dark={dark} />
          ))}
        </View>
      </View>

      <Text
        style={{
          marginTop: 12,
          textAlign: 'center',
          fontFamily: SCREEN_FONTS.bold,
          fontSize: 92,
          lineHeight: 98,
          color: text,
        }}
      >
        {padScore(score)}
      </Text>

      <View style={{ marginTop: 10, flexDirection: 'row', gap: 10 }}>
        <Pressable onPress={onDecrease} style={{ flex: 1 }}>
          <View
            style={{
              borderRadius: RADIUS.full,
              height: 52,
              backgroundColor: btnMinusBg,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 6,
            }}
          >
            <Minus size={20} color={btnMinusText} strokeWidth={2.8} />
          </View>
        </Pressable>
        <Pressable onPress={onIncrease} style={{ flex: 1 }}>
          <View
            style={{
              borderRadius: RADIUS.full,
              height: 52,
              backgroundColor: btnPlusBg,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 6,
            }}
          >
            <Plus size={20} color={btnPlusText} strokeWidth={2.8} />
          </View>
        </Pressable>
      </View>
    </View>
  )
}

export default function MatchResultEntryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [session, setSession] = useState<MatchSessionRecord | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const [scoreA, setScoreA] = useState(11)
  const [scoreB, setScoreB] = useState(9)
  const [matchDuration, setMatchDuration] = useState('45')
  const [refereeNote, setRefereeNote] = useState('')
  const [dialogConfig, setDialogConfig] = useState<AppDialogConfig | null>(null)

  function openDialog(config: AppDialogConfig) {
    setDialogConfig(config)
  }

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

      if (mounted) setCurrentUserId(user.id)

      const { data, error } = await supabase.rpc('get_session_detail_overview', { p_session_id: id })
      if (error) {
        openDialog({
          title: 'Không tải được trận đấu',
          message: error.message,
          actions: [{ label: 'Đã hiểu' }],
        })
        if (mounted) {
          setSession(null)
          setLoading(false)
        }
        return
      }

      const nextSession = (data?.session ?? null) as MatchSessionRecord | null
      if (nextSession?.host?.id && nextSession.host.id !== user.id) {
        openDialog({
          title: 'Chỉ host mới được nhập kết quả',
          message: 'Bạn có thể xem trận này, nhưng chỉ host mới có thể gửi kết quả cuối cùng.',
          actions: [{ label: 'Quay lại', onPress: () => router.back() }],
        })
        if (mounted) {
          setSession(null)
          setLoading(false)
        }
        return
      }

      if (mounted) {
        setSession(nextSession)
        const mins = durationMinutes(nextSession?.slot?.start_time, nextSession?.slot?.end_time)
        if (mins > 0) setMatchDuration(String(mins))
        setLoading(false)
      }
    }

    void loadSession()
    return () => {
      mounted = false
    }
  }, [id])

  const teams = useMemo(() => buildTeams(session), [session])

  async function onSaveResult() {
    if (!session || !id) return
    if (!currentUserId || session.host?.id !== currentUserId) {
      openDialog({
        title: 'Chỉ host mới được nhập kết quả',
        message: 'Kết quả trận chỉ có thể được gửi bởi host của kèo này.',
        actions: [{ label: 'Đã hiểu' }],
      })
      return
    }

    if (!teams[0].players.length || !teams[1].players.length) {
      openDialog({
        title: 'Thiếu đội hình',
        message: 'Trận này chưa có đủ người chơi ở cả hai đội để gửi kết quả.',
        actions: [{ label: 'Đã hiểu' }],
      })
      return
    }

    if (scoreA === scoreB) {
      openDialog({
        title: 'Điểm số chưa hợp lệ',
        message: 'Vui lòng nhập kết quả có đội thắng rõ ràng trước khi lưu.',
        actions: [{ label: 'Đã hiểu' }],
      })
      return
    }

    const payload = [...teams[0].players, ...teams[1].players].map((player) => {
      const teamAWinner = scoreA > scoreB
      const inTeamA = teams[0].players.some((p) => p.id === player.id)
      return {
        player_id: player.id,
        result: (teamAWinner && inTeamA) || (!teamAWinner && !inTeamA) ? 'win' : 'loss',
      }
    })

    setSubmitting(true)
    const { error } = await supabase.rpc('submit_session_results', {
      p_session_id: id,
      p_results: payload,
    })
    setSubmitting(false)

    if (error) {
      openDialog({
        title: 'Chưa thể gửi kết quả',
        message: error.message,
        actions: [{ label: 'Đã hiểu' }],
      })
      return
    }

    openDialog({
      title: 'Đã lưu kết quả',
      message: `${teams[0].name} ${scoreA} - ${scoreB} ${teams[1].name}`,
      actions: [{ label: 'Quay về chi tiết kèo', onPress: () => router.back() }],
    })
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: RESULT_THEME.pageBg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={PROFILE_THEME_COLORS.primary} />
        <Text style={{ marginTop: 10, fontFamily: SCREEN_FONTS.cta, color: RESULT_THEME.subtitle }}>Đang tải trận đấu...</Text>
      </SafeAreaView>
    )
  }

  if (!session) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: RESULT_THEME.pageBg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
        <Text style={{ fontFamily: SCREEN_FONTS.bold, fontSize: 22, color: RESULT_THEME.title }}>Không tìm thấy trận đấu</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 14 }}>
          <Text style={{ fontFamily: SCREEN_FONTS.cta, color: PROFILE_THEME_COLORS.primary }}>Quay lại</Text>
        </Pressable>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: RESULT_THEME.pageBg }}>
      <View style={{ position: 'absolute', width: 220, height: 220, borderRadius: RADIUS.full, backgroundColor: RESULT_THEME.pageBlob, top: 80, right: -80 }} />
      <View style={{ position: 'absolute', width: 180, height: 180, borderRadius: RADIUS.full, backgroundColor: RESULT_THEME.pageBlob, bottom: 20, left: -70 }} />

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingTop: 8, paddingBottom: 10, alignItems: 'center', justifyContent: 'center' }}>
          <Pressable
            onPress={() => router.back()}
            style={{
              position: 'absolute',
              left: 0,
              width: 38,
              height: 38,
              borderRadius: RADIUS.full,
              backgroundColor: RESULT_THEME.headerChipBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ArrowLeft size={18} color={RESULT_THEME.headerIcon} />
          </Pressable>
          <Text style={{ fontFamily: SCREEN_FONTS.bold, fontSize: 28, color: RESULT_THEME.title }}>Kết quả trận đấu</Text>
        </View>

        <View style={{ marginTop: 8, alignItems: 'center' }}>
          <Text style={{ fontFamily: SCREEN_FONTS.cta, fontSize: 11, letterSpacing: 1.2, color: RESULT_THEME.muted, textTransform: 'uppercase' }}>
            Thông tin trận đấu
          </Text>
          <Text
            numberOfLines={2}
            style={{ marginTop: 4, textAlign: 'center', fontFamily: SCREEN_FONTS.bold, fontSize: 30, lineHeight: 36, color: RESULT_THEME.title }}
          >
            {session.slot?.court?.name ?? 'Sân thi đấu'}
          </Text>
          <Text style={{ marginTop: 4, fontFamily: SCREEN_FONTS.cta, fontSize: 13, color: RESULT_THEME.subtitle }}>
            {formatMatchDateTime(session.slot?.start_time, session.slot?.end_time)}
          </Text>
        </View>

        <View style={{ marginTop: 20 }}>
          <ScoreCard
            team={teams[0]}
            score={scoreA}
            dark
            onDecrease={() => setScoreA((value) => clampScore(value - 1))}
            onIncrease={() => setScoreA((value) => clampScore(value + 1))}
          />
        </View>

        <View style={{ marginVertical: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: RESULT_THEME.line }} />
          <View style={{ width: 42, height: 42, borderRadius: RADIUS.full, backgroundColor: RESULT_THEME.vsBg, borderWidth: BORDER.base, borderColor: RESULT_THEME.line, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontFamily: SCREEN_FONTS.boldItalic, fontSize: 15, color: RESULT_THEME.vsText }}>VS</Text>
          </View>
          <View style={{ flex: 1, height: 1, backgroundColor: RESULT_THEME.line }} />
        </View>

        <ScoreCard
          team={teams[1]}
          score={scoreB}
          dark={false}
          onDecrease={() => setScoreB((value) => clampScore(value - 1))}
          onIncrease={() => setScoreB((value) => clampScore(value + 1))}
        />

        <View
          style={{
            marginTop: 18,
            borderRadius: RADIUS.xl,
            borderWidth: BORDER.base,
            borderColor: RESULT_THEME.sectionBorder,
            backgroundColor: RESULT_THEME.sectionBg,
            padding: 16,
          }}
        >
          <Text style={{ fontFamily: SCREEN_FONTS.bold, fontSize: 14, color: RESULT_THEME.subtitle, textTransform: 'uppercase' }}>
            Chi tiết trận đấu
          </Text>

          <View style={{ marginTop: 12, borderRadius: RADIUS.lg, borderWidth: BORDER.base, borderColor: RESULT_THEME.sectionBorder, backgroundColor: RESULT_THEME.sectionCardBg, padding: 12 }}>
            <Text style={{ fontFamily: SCREEN_FONTS.cta, fontSize: 10, color: RESULT_THEME.vsText, textTransform: 'uppercase' }}>
              Thời lượng (phút)
            </Text>
            <TextInput
              value={matchDuration}
              onChangeText={(value) => setMatchDuration(value.replace(/\D/g, ''))}
              keyboardType="number-pad"
              placeholder="45"
              placeholderTextColor={RESULT_THEME.inputPlaceholder}
              style={{
                marginTop: 6,
                fontFamily: SCREEN_FONTS.bold,
                fontSize: 30,
                color: RESULT_THEME.inputText,
                padding: 0,
              }}
            />
          </View>

          <View style={{ marginTop: 10, borderRadius: RADIUS.lg, borderWidth: BORDER.base, borderColor: RESULT_THEME.sectionBorder, backgroundColor: RESULT_THEME.sectionCardBg, padding: 12 }}>
            <Text style={{ fontFamily: SCREEN_FONTS.cta, fontSize: 10, color: RESULT_THEME.vsText, textTransform: 'uppercase' }}>
              Ghi chú trọng tài
            </Text>
            <TextInput
              value={refereeNote}
              onChangeText={setRefereeNote}
              placeholder="Trận đấu kịch tính, không có chấn thương."
              placeholderTextColor={RESULT_THEME.inputPlaceholder}
              multiline
              textAlignVertical="top"
              style={{
                marginTop: 6,
                minHeight: 74,
                fontFamily: SCREEN_FONTS.label,
                fontSize: 14,
                lineHeight: 20,
                color: RESULT_THEME.subtitle,
                padding: 0,
              }}
            />
          </View>
        </View>

        <Pressable onPress={() => void onSaveResult()} disabled={submitting} style={{ marginTop: 18 }}>
          <View
            style={{
              borderRadius: RADIUS.full,
              height: 56,
              backgroundColor: submitting ? RESULT_THEME.primaryCtaPressed : RESULT_THEME.primaryCta,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 8,
              shadowColor: RESULT_THEME.shadow,
              shadowOpacity: 0.22,
              shadowOffset: { width: 0, height: 8 },
              shadowRadius: 16,
              elevation: 5,
            }}
          >
            <Save size={18} color={RESULT_THEME.primaryCtaText} />
            <Text style={{ fontFamily: SCREEN_FONTS.bold, fontSize: 18, color: RESULT_THEME.primaryCtaText }}>
              {submitting ? 'Đang lưu...' : 'Lưu kết quả'}
            </Text>
          </View>
        </Pressable>
      </ScrollView>

      <AppDialog
        visible={Boolean(dialogConfig)}
        config={dialogConfig}
        onClose={() => setDialogConfig(null)}
      />
    </SafeAreaView>
  )
}
