import { router, useLocalSearchParams } from 'expo-router'
import { ArrowLeft, Minus, Plus, Save, Clock, MapPin, Trophy, CheckCheck, Info } from 'lucide-react-native'
import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { AppDialog, type AppDialogConfig } from '@/components/design'
import { PROFILE_THEME_COLORS } from '@/components/profile/profileTheme'
import { supabase } from '@/lib/supabase'
import { SCREEN_FONTS } from '@/constants/typography'
import { RADIUS, SPACING, BORDER, SHADOW } from '@/constants/screenLayout'

function withAlpha(hex: string, alpha: number) {
  const clean = hex.replace('#', '')
  const normalized = clean.length === 3 ? clean.split('').map((char) => char + char).join('') : clean
  const n = Number.parseInt(normalized, 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

const RESULT_THEME = {
  pageBg: PROFILE_THEME_COLORS.surfaceContainerLow,
  accent: PROFILE_THEME_COLORS.primary,
  accentSoft: withAlpha(PROFILE_THEME_COLORS.primary, 0.1),
  cardBg: PROFILE_THEME_COLORS.surfaceContainerLowest,
  cardBorder: PROFILE_THEME_COLORS.outlineVariant,
  title: PROFILE_THEME_COLORS.primary,
  subtitle: PROFILE_THEME_COLORS.onSecondaryContainer,
  muted: PROFILE_THEME_COLORS.outline,
  
  teamABg: PROFILE_THEME_COLORS.primary,
  teamAText: PROFILE_THEME_COLORS.onPrimary,
  teamBBg: PROFILE_THEME_COLORS.surfaceContainerHighest,
  teamBText: PROFILE_THEME_COLORS.primary,
  
  inputBg: PROFILE_THEME_COLORS.surfaceContainer,
  inputText: PROFILE_THEME_COLORS.onSurface,
  inputPlaceholder: PROFILE_THEME_COLORS.outline,
  
  primaryCta: PROFILE_THEME_COLORS.primary,
  primaryCtaText: PROFILE_THEME_COLORS.onPrimary,
  secondaryCta: PROFILE_THEME_COLORS.surfaceContainerHigh,
  secondaryCtaText: PROFILE_THEME_COLORS.onSurfaceVariant,
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
  status: string
  results_status: string
  host?: {
    id?: string
  } | null
  slot?: {
    start_time?: string | null
    end_time?: string | null
    court?: {
      name?: string | null
      address?: string | null
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

function formatMatchDateTime(start?: string | null) {
  if (!start) return 'Chưa rõ lịch'
  const startDate = new Date(start)
  if (Number.isNaN(startDate.getTime())) return 'Chưa rõ lịch'

  const weekday = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][startDate.getDay()]
  const pad = (value: number) => value.toString().padStart(2, '0')
  return `${weekday}, ngày ${pad(startDate.getDate())}/${pad(startDate.getMonth() + 1)}`
}

function formatTimeRange(start?: string | null, end?: string | null) {
  if (!start || !end) return '--:-- - --:--'
  const startDate = new Date(start)
  const endDate = new Date(end)
  const pad = (value: number) => value.toString().padStart(2, '0')
  return `${pad(startDate.getHours())}:${pad(startDate.getMinutes())} - ${pad(endDate.getHours())}:${pad(endDate.getMinutes())}`
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

function TeamScoreCard({
  team,
  score,
  isMain,
  onDecrease,
  onIncrease,
}: {
  team: TeamSummary
  score: number
  isMain: boolean
  onDecrease: () => void
  onIncrease: () => void
}) {
  const bg = isMain ? RESULT_THEME.teamABg : RESULT_THEME.cardBg
  const text = isMain ? RESULT_THEME.teamAText : RESULT_THEME.teamBText
  const label = isMain ? withAlpha(RESULT_THEME.teamAText, 0.7) : RESULT_THEME.muted
  
  return (
    <View
      style={{
        flex: 1,
        borderRadius: RADIUS.xl,
        backgroundColor: bg,
        borderWidth: isMain ? 0 : BORDER.base,
        borderColor: RESULT_THEME.cardBorder,
        padding: 16,
        alignItems: 'center',
        ...SHADOW.sm,
      }}
    >
      <Text style={{ fontFamily: SCREEN_FONTS.bold, fontSize: 13, color: label, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {team.name}
      </Text>
      
      <View style={{ marginVertical: 12, alignItems: 'center' }}>
        <Text style={{ fontFamily: SCREEN_FONTS.headline, fontSize: 64, lineHeight: 72, color: text }}>
          {padScore(score)}
        </Text>
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TouchableOpacity 
          activeOpacity={0.7}
          onPress={onDecrease}
          style={{
            width: 44,
            height: 44,
            borderRadius: RADIUS.full,
            backgroundColor: isMain ? withAlpha(RESULT_THEME.teamAText, 0.2) : RESULT_THEME.inputBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Minus size={20} color={text} strokeWidth={2.5} />
        </TouchableOpacity>
        <TouchableOpacity 
          activeOpacity={0.7}
          onPress={onIncrease}
          style={{
            width: 44,
            height: 44,
            borderRadius: RADIUS.full,
            backgroundColor: isMain ? withAlpha(RESULT_THEME.teamAText, 0.2) : RESULT_THEME.inputBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Plus size={20} color={text} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
      
      <View style={{ marginTop: 16, width: '100%' }}>
        {team.players.map((p, idx) => (
          <Text key={p.id} numberOfLines={1} style={{ 
            fontFamily: SCREEN_FONTS.label, 
            fontSize: 12, 
            color: label, 
            textAlign: 'center',
            marginTop: idx > 0 ? 2 : 0
          }}>
            {p.name}
          </Text>
        ))}
      </View>
    </View>
  )
}

export default function MatchResultEntryScreen() {
  const params = useLocalSearchParams<{ id: string }>()
  const id = Array.isArray(params.id) ? params.id[0] : params.id
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

      await supabase.rpc('process_overdue_session_closures')

      if (mounted) setCurrentUserId(user.id)

      const { data, error } = await supabase.rpc('get_session_detail_overview', { p_session_id: id })
      if (error) {
        openDialog({
          title: 'Lỗi tải dữ liệu',
          message: error.message,
          actions: [{ label: 'Đã hiểu' }],
        })
        if (mounted) setLoading(false)
        return
      }

      const nextSession = (data?.session ?? null) as MatchSessionRecord | null
      const hostId = typeof nextSession?.host === 'string' ? nextSession.host : nextSession?.host?.id
      
      if (hostId && hostId !== user.id) {
        if (mounted) setLoading(false)
        openDialog({
          title: 'Quyền truy cập',
          message: 'Chỉ chủ kèo mới có quyền nhập kết quả trận đấu này.',
          actions: [{ label: 'Quay lại', onPress: () => router.back() }]
        })
        return
      }

      // Check if session needs to be marked as pending_completion
      const endTime = nextSession?.slot?.end_time ? new Date(nextSession.slot.end_time) : null
      const isOverdue = endTime && endTime <= new Date()

      if (isOverdue && nextSession?.status !== 'done' && nextSession?.status !== 'pending_completion') {
        // Attempt to transition to pending_completion so RPC works
        await supabase
          .from('sessions')
          .update({ status: 'pending_completion', pending_completion_marked_at: new Date().toISOString() })
          .eq('id', id)
      }

      if (mounted) {
        setSession(nextSession)
        
        const mins = durationMinutes(nextSession?.slot?.start_time, nextSession?.slot?.end_time)
        if (mins > 0) setMatchDuration(String(mins))
        
        setLoading(false)
        
        if (!isOverdue && nextSession?.status !== 'done' && nextSession?.status !== 'pending_completion') {
           openDialog({
             title: 'Trận chưa kết thúc',
             message: 'Kết quả chỉ nên được nhập sau khi trận đấu đã hoàn thành.',
             actions: [{ label: 'Đã hiểu' }]
           })
        }
      }
    }

    void loadSession()
    return () => { mounted = false }
  }, [id])

  const teams = useMemo(() => buildTeams(session), [session])

  async function onSaveResult() {
    if (!session || !id) return
    const hostId = typeof session.host === 'string' ? session.host : session.host?.id
    if (!currentUserId || hostId !== currentUserId) return

    if (!teams[0].players.length || !teams[1].players.length) {
      openDialog({
        title: 'Thiếu người chơi',
        message: 'Trận đấu cần có người chơi ở cả 2 đội để tính điểm elo.',
        actions: [{ label: 'Đã hiểu' }],
      })
      return
    }

    if (scoreA === scoreB) {
      openDialog({
        title: 'Kết quả hòa',
        message: 'Hiện tại hệ thống chưa hỗ trợ kết quả hòa cho tính điểm elo. Vui lòng chọn đội thắng.',
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
        title: 'Lỗi gửi kết quả',
        message: error.message,
        actions: [{ label: 'Đã hiểu' }],
      })
      return
    }
    openDialog({
      title: 'Thành công',
      message: 'Kết quả đã được gửi và đang chờ người chơi xác nhận.',
      actions: [{ label: 'Quay lại', onPress: () => router.back() }],
    })
  }

  const insets = useSafeAreaInsets()

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: RESULT_THEME.pageBg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={RESULT_THEME.accent} />
      </View>
    )
  }

  if (!session) return null

  const isSubmitted = session.results_status === 'pending_confirmation' || session.results_status === 'finalized'

  return (
    <View style={{ flex: 1, backgroundColor: RESULT_THEME.pageBg, paddingTop: insets.top }}>
      <View style={{ flex: 1 }}>
        <ScrollView 
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={{ width: 40, height: 40, borderRadius: RADIUS.full, backgroundColor: RESULT_THEME.cardBg, alignItems: 'center', justifyContent: 'center', borderWidth: BORDER.base, borderColor: RESULT_THEME.cardBorder }}
            >
              <ArrowLeft size={20} color={RESULT_THEME.title} />
            </TouchableOpacity>
            <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full, backgroundColor: RESULT_THEME.accentSoft }}>
              <Text style={{ fontFamily: SCREEN_FONTS.bold, fontSize: 12, color: RESULT_THEME.accent, textTransform: 'uppercase' }}>
                {isSubmitted ? 'Đã gửi' : 'Đang nhập'}
              </Text>
            </View>
          </View>

          <View style={{ marginTop: 24 }}>
            <Text style={{ fontFamily: SCREEN_FONTS.headline, fontSize: 32, color: RESULT_THEME.title }}>
              Nhập kết quả
            </Text>
            <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <MapPin size={14} color={RESULT_THEME.muted} />
                <Text style={{ fontFamily: SCREEN_FONTS.label, fontSize: 13, color: RESULT_THEME.subtitle }}>
                  {session.slot?.court?.name}
                </Text>
              </View>
              <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: RESULT_THEME.muted }} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Clock size={14} color={RESULT_THEME.muted} />
                <Text style={{ fontFamily: SCREEN_FONTS.label, fontSize: 13, color: RESULT_THEME.subtitle }}>
                  {formatTimeRange(session.slot?.start_time, session.slot?.end_time)}
                </Text>
              </View>
            </View>
          </View>

          {/* Scoreboard */}
          <View style={{ marginTop: 32, flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <TeamScoreCard 
              team={teams[0]} 
              score={scoreA} 
              isMain={scoreA > scoreB}
              onDecrease={() => !isSubmitted && setScoreA(s => clampScore(s - 1))}
              onIncrease={() => !isSubmitted && setScoreA(s => clampScore(s + 1))}
            />
            
            <View style={{ width: 32, alignItems: 'center' }}>
              <Text style={{ fontFamily: SCREEN_FONTS.boldItalic, fontSize: 16, color: RESULT_THEME.muted }}>VS</Text>
            </View>

            <TeamScoreCard 
              team={teams[1]} 
              score={scoreB} 
              isMain={scoreB > scoreA}
              onDecrease={() => !isSubmitted && setScoreB(s => clampScore(s - 1))}
              onIncrease={() => !isSubmitted && setScoreB(s => clampScore(s + 1))}
            />
          </View>

          {/* Form Fields */}
          <View style={{ marginTop: 32, gap: 20 }}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Clock size={16} color={RESULT_THEME.title} />
                <Text style={{ fontFamily: SCREEN_FONTS.bold, fontSize: 16, color: RESULT_THEME.title }}>
                  Thời lượng trận đấu
                </Text>
              </View>
              <View style={{ height: 56, borderRadius: RADIUS.lg, backgroundColor: RESULT_THEME.inputBg, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' }}>
                <TextInput 
                  value={matchDuration}
                  onChangeText={v => !isSubmitted && setMatchDuration(v.replace(/\D/g, ''))}
                  keyboardType="number-pad"
                  editable={!isSubmitted}
                  style={{ flex: 1, fontFamily: SCREEN_FONTS.bold, fontSize: 18, color: RESULT_THEME.inputText }}
                  placeholder="45"
                  placeholderTextColor={RESULT_THEME.inputPlaceholder}
                />
                <Text style={{ fontFamily: SCREEN_FONTS.label, fontSize: 14, color: RESULT_THEME.muted }}>phút</Text>
              </View>
            </View>

            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Info size={16} color={RESULT_THEME.title} />
                <Text style={{ fontFamily: SCREEN_FONTS.bold, fontSize: 16, color: RESULT_THEME.title }}>
                  Ghi chú thêm
                </Text>
              </View>
              <TextInput 
                value={refereeNote}
                onChangeText={v => !isSubmitted && setRefereeNote(v)}
                multiline
                numberOfLines={3}
                editable={!isSubmitted}
                textAlignVertical="top"
                style={{ 
                  minHeight: 100, 
                  borderRadius: RADIUS.lg, 
                  backgroundColor: RESULT_THEME.inputBg, 
                  padding: 16, 
                  fontFamily: SCREEN_FONTS.body, 
                  fontSize: 15, 
                  color: RESULT_THEME.inputText 
                }}
                placeholder="Ví dụ: Trận đấu rất kịch tính, mọi người chơi đều rất fair-play..."
                placeholderTextColor={RESULT_THEME.inputPlaceholder}
              />
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Fixed Bottom Action */}
      <View style={{ 
        paddingHorizontal: 20, 
        paddingTop: 12, 
        paddingBottom: Math.max(insets.bottom, 12), 
        backgroundColor: RESULT_THEME.pageBg,
        borderTopWidth: BORDER.base,
        borderTopColor: RESULT_THEME.cardBorder,
      }}>
        {isSubmitted ? (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.back()}
            style={{
              height: 56,
              borderRadius: RADIUS.full,
              backgroundColor: RESULT_THEME.secondaryCta,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 8,
            }}
          >
            <Text style={{ fontFamily: SCREEN_FONTS.bold, fontSize: 16, color: RESULT_THEME.secondaryCtaText }}>
              QUAY LẠI CHI TIẾT KÈO
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => void onSaveResult()}
            disabled={submitting}
            style={{
              height: 56,
              borderRadius: RADIUS.full,
              backgroundColor: RESULT_THEME.primaryCta,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 8,
              opacity: submitting ? 0.8 : 1,
              ...SHADOW.md,
              shadowColor: RESULT_THEME.primaryCta,
            }}
          >
            {submitting ? (
              <ActivityIndicator color={RESULT_THEME.primaryCtaText} />
            ) : (
              <>
                <Save size={20} color={RESULT_THEME.primaryCtaText} strokeWidth={2.5} />
                <Text style={{ fontFamily: SCREEN_FONTS.bold, fontSize: 18, color: RESULT_THEME.primaryCtaText, textTransform: 'uppercase' }}>
                  Lưu kết quả
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      <AppDialog 
        visible={!!dialogConfig}
        config={dialogConfig!}
        onClose={() => setDialogConfig(null)}
      />
    </View>
  )
}
