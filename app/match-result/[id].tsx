import { router, useLocalSearchParams } from 'expo-router'
import { ArrowLeft, Minus, Plus, Save, Clock, MapPin, Trophy, CheckCheck, Info, ShieldAlert } from 'lucide-react-native'
import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context'

import { AppDialog, type AppDialogConfig, NavbarDoneButton, SecondaryNavbar } from '@/components/design'
import { PROFILE_THEME_COLORS } from '@/components/profile/profileTheme'
import { supabase } from '@/lib/supabase'
import { SCREEN_FONTS } from '@/constants/typography'
import { RADIUS, SPACING, BORDER, SHADOW } from '@/constants/screenLayout'
import { formatPricePerPerson, formatTimeRange as _formatTimeRange } from '@/lib/sessionDetail'

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
  result_dispute_note?: string | null
  player?: {
    name?: string | null
  } | null
}

type MatchSessionRecord = {
  id: string
  status: string
  results_status: string
  max_players: number
  booking_notes?: string | null
  host?: {
    id?: string
  } | null
  slot?: {
    start_time?: string | null
    end_time?: string | null
    price?: number | null
    court?: {
      name?: string | null
      address?: string | null
      city?: string | null
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

function SessionResultMetaCard({
  session,
  scoreA,
  scoreB,
  setScoreA,
  setScoreB,
  isSubmitted,
  teams,
}: {
  session: MatchSessionRecord
  scoreA: number
  scoreB: number
  setScoreA: (dispatch: (s: number) => number) => void
  setScoreB: (dispatch: (s: number) => number) => void
  isSubmitted: boolean
  teams: TeamSummary[]
}) {
  const courtName = session.slot?.court?.name || 'Sân chưa xác định'
  const courtAddress = session.slot?.court?.address || ''
  const courtCity = session.slot?.court?.city || ''
  const startTime = session.slot?.start_time
  const endTime = session.slot?.end_time
  const price = session.slot?.price || 0
  const maxPlayers = session.max_players || 4
  const hostNote = session.booking_notes
  
  const timeLabel = _formatTimeRange(startTime || '', endTime || '')
  const [datePart, clockPart] = timeLabel.split('•').map((s) => s.trim())
  const priceLabel = formatPricePerPerson(price, maxPlayers)

  const compactAddress = [courtAddress, courtCity]
    .filter(Boolean)
    .join(', ')
    .split(',')
    .slice(0, 3)
    .join(',')

  return (
    <View
      style={{
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
        backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest,
        borderWidth: BORDER.hairline,
        borderColor: PROFILE_THEME_COLORS.outlineVariant,
        ...SHADOW.sm,
      }}
    >
      {/* Brand Header */}
      <View
        style={{
          backgroundColor: '#1D9E75',
          paddingHorizontal: 16,
          paddingVertical: SPACING.xs,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 6 }}>
          <View style={{ width: 5, height: 5, borderRadius: RADIUS.full, backgroundColor: '#FFFFFF' }} />
          <Text style={{ color: '#FFFFFF', fontFamily: SCREEN_FONTS.cta, fontSize: 11, letterSpacing: 0.5 }}>
            KẾT QUẢ TRẬN ĐẤU
          </Text>
        </View>
        <Text style={{ color: 'rgba(255,255,255,0.8)', fontFamily: SCREEN_FONTS.label, fontSize: 11 }}>
          {maxPlayers === 2 ? 'Đánh đơn' : 'Đánh đôi'}
        </Text>
      </View>

      {/* Court Info */}
      <View style={{ paddingTop: 12, paddingHorizontal: 16, paddingBottom: 12 }}>
        <Text
          numberOfLines={2}
          style={{
            color: '#1A2E2A',
            fontFamily: SCREEN_FONTS.headline,
            fontSize: 31,
            lineHeight: 36,
            marginBottom: 4,
            textTransform: 'uppercase',
          }}
        >
          {courtName}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 6 }}>
          <MapPin size={13} color="#7A8884" strokeWidth={2.5} />
          <Text numberOfLines={1} style={{ color: '#7A8884', fontFamily: SCREEN_FONTS.body, fontSize: 13, flexShrink: 1 }}>
            {compactAddress}
          </Text>
        </View>
      </View>

      {/* Main Scoreboard */}
      <View style={{ backgroundColor: '#F5F1E8', paddingHorizontal: 16, paddingVertical: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          {/* Team A */}
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text numberOfLines={1} style={{ 
              color: scoreA > scoreB ? '#1D9E75' : scoreA < scoreB ? '#7A8884' : '#7A8884', 
              fontFamily: SCREEN_FONTS.headline, 
              fontSize: 16, 
              textTransform: 'uppercase', 
              letterSpacing: 1, 
              marginBottom: 8,
              textAlign: 'center'
            }}>
              {scoreA > scoreB ? 'THẮNG' : scoreA < scoreB ? 'THUA' : 'HÒA'}
            </Text>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {!isSubmitted && (
                <TouchableOpacity 
                  onPress={() => setScoreA(s => Math.max(0, s - 1))}
                  style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.04)', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Minus size={12} color="#1A2E2A" />
                </TouchableOpacity>
              )}
              
              <View style={{ 
                backgroundColor: '#FFFFFF', 
                borderRadius: RADIUS.md, 
                paddingHorizontal: 12, 
                paddingVertical: 6,
                minWidth: 80,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: scoreA > scoreB ? '#1D9E75' : 'rgba(0,0,0,0.05)',
                ...SHADOW.sm,
              }}>
                <Text style={{ 
                  color: scoreA > scoreB ? '#1D9E75' : '#1A2E2A', 
                  fontFamily: SCREEN_FONTS.headline, 
                  fontSize: 64, 
                  lineHeight: 68 
                }}>
                  {scoreA.toString().padStart(2, '0')}
                </Text>
              </View>

              {!isSubmitted && (
                <TouchableOpacity 
                  onPress={() => setScoreA(s => Math.min(99, s + 1))}
                  style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.04)', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Plus size={12} color="#1A2E2A" />
                </TouchableOpacity>
              )}
            </View>

            <View style={{ marginTop: 10, alignItems: 'center' }}>
              <Text numberOfLines={1} style={{ color: '#1A2E2A', fontFamily: SCREEN_FONTS.headline, fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' }}>
                {teams[0].name}
              </Text>
              <Text numberOfLines={1} style={{ color: '#7A8884', fontFamily: SCREEN_FONTS.body, fontSize: 11, textAlign: 'center', marginTop: 2 }}>
                {teams[0].players.map(p => p.name).join(' · ')}
              </Text>
            </View>
          </View>

          <View style={{ width: 1, height: 100, backgroundColor: '#7A8884', opacity: 0.15, alignSelf: 'center', marginTop: 10, marginHorizontal: 24 }} />

          {/* Team B */}
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text numberOfLines={1} style={{ 
              color: scoreB > scoreA ? '#1D9E75' : scoreB < scoreA ? '#7A8884' : '#7A8884', 
              fontFamily: SCREEN_FONTS.headline, 
              fontSize: 16, 
              textTransform: 'uppercase', 
              letterSpacing: 1, 
              marginBottom: 8,
              textAlign: 'center'
            }}>
              {scoreB > scoreA ? 'THẮNG' : scoreB < scoreA ? 'THUA' : 'HÒA'}
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {!isSubmitted && (
                <TouchableOpacity 
                  onPress={() => setScoreB(s => Math.max(0, s - 1))}
                  style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.04)', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Minus size={12} color="#1A2E2A" />
                </TouchableOpacity>
              )}

              <View style={{ 
                backgroundColor: '#FFFFFF', 
                borderRadius: RADIUS.md, 
                paddingHorizontal: 12, 
                paddingVertical: 6,
                minWidth: 80,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: scoreB > scoreA ? '#1D9E75' : 'rgba(0,0,0,0.05)',
                ...SHADOW.sm,
              }}>
                <Text style={{ 
                  color: scoreB > scoreA ? '#1D9E75' : '#1A2E2A', 
                  fontFamily: SCREEN_FONTS.headline, 
                  fontSize: 64, 
                  lineHeight: 68 
                }}>
                  {scoreB.toString().padStart(2, '0')}
                </Text>
              </View>

              {!isSubmitted && (
                <TouchableOpacity 
                  onPress={() => setScoreB(s => Math.min(99, s + 1))}
                  style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.04)', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Plus size={12} color="#1A2E2A" />
                </TouchableOpacity>
              )}
            </View>

            <View style={{ marginTop: 10, alignItems: 'center' }}>
              <Text numberOfLines={1} style={{ color: '#1A2E2A', fontFamily: SCREEN_FONTS.headline, fontSize: 14, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' }}>
                {teams[1].name}
              </Text>
              <Text numberOfLines={1} style={{ color: '#7A8884', fontFamily: SCREEN_FONTS.body, fontSize: 11, textAlign: 'center', marginTop: 2 }}>
                {teams[1].players.map(p => p.name).join(' · ')}
              </Text>
            </View>
          </View>
        </View>


        <View style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.06)', marginVertical: 16 }} />

        {/* Time & Price Info */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <View>
            <Text style={{ color: '#7A8884', fontFamily: SCREEN_FONTS.label, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>
              THỜI GIAN
            </Text>
            <Text style={{ color: '#1A2E2A', fontFamily: SCREEN_FONTS.headline, fontSize: 26, lineHeight: 28 }}>
              {clockPart}
            </Text>
            <Text style={{ color: '#7A8884', fontFamily: SCREEN_FONTS.body, fontSize: 13, marginTop: 2 }}>
              {datePart}
            </Text>
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: '#7A8884', fontFamily: SCREEN_FONTS.label, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>
              CHI PHÍ
            </Text>
            <Text style={{ color: '#1D9E75', fontFamily: SCREEN_FONTS.headline, fontSize: 26, lineHeight: 28 }}>
              {priceLabel}
            </Text>
            {priceLabel !== 'Miễn phí' && (
              <Text style={{ color: '#7A8884', fontFamily: SCREEN_FONTS.body, fontSize: 13, marginTop: 2 }}>
                /người
              </Text>
            )}
          </View>
        </View>

        {/* Note */}
        {hostNote && hostNote.trim().length > 0 && (
          <>
            <View style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.06)', marginVertical: 16 }} />
            <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#7A8884', fontFamily: SCREEN_FONTS.label, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  LỜI NHẮN
                </Text>
                <Text style={{ color: '#1A2E2A', fontFamily: SCREEN_FONTS.body, fontSize: 13, marginTop: 2 }}>
                  {hostNote.trim()}
                </Text>
              </View>
            </View>
          </>
        )}
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

  const disputeNotes = useMemo(() => {
    return (session?.session_players ?? [])
      .filter((p) => p.result_dispute_note && p.result_dispute_note.trim().length > 0)
      .map((p) => ({ name: p.player?.name || 'Người chơi', note: p.result_dispute_note }))
  }, [session])

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
    <View style={{ flex: 1, backgroundColor: RESULT_THEME.pageBg }}>
      <SecondaryNavbar
        title="KẾT QUẢ TRẬN ĐẤU"
        onBackPress={() => router.back()}
      />
      <View style={{ flex: 1 }}>
        <ScrollView 
          contentContainerStyle={{ paddingHorizontal: SPACING.xl, paddingBottom: insets.bottom + 40, paddingTop: 16 }}
          showsVerticalScrollIndicator={false}
        >

          {session.results_status === 'disputed' && disputeNotes.length > 0 && (
            <View
              style={{
                marginTop: 16,
                padding: 16,
                backgroundColor: '#FEF2F2',
                borderRadius: RADIUS.lg,
                borderWidth: 1,
                borderColor: '#FECACA',
                gap: 12,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ShieldAlert size={18} color="#EF4444" strokeWidth={2.5} />
                <Text style={{ fontFamily: SCREEN_FONTS.headline, fontSize: 14, color: '#991B1B', textTransform: 'uppercase' }}>
                  Nội dung khiếu nại từ người chơi
                </Text>
              </View>
              <View style={{ gap: 8 }}>
                {disputeNotes.map((dn, idx) => (
                  <View key={idx} style={{ paddingLeft: 8, borderLeftWidth: 2, borderLeftColor: '#FCA5A5' }}>
                    <Text style={{ fontFamily: SCREEN_FONTS.headline, fontSize: 12, color: '#B91C1C' }}>
                      {dn.name}:
                    </Text>
                    <Text style={{ fontFamily: SCREEN_FONTS.body, fontSize: 13, color: '#991B1B', marginTop: 2 }}>
                      {dn.note}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          <View style={{ marginTop: 24 }}>

            <SessionResultMetaCard
              session={session}
              scoreA={scoreA}
              scoreB={scoreB}
              setScoreA={setScoreA}
              setScoreB={setScoreB}
              isSubmitted={isSubmitted}
              teams={teams}
            />
          </View>

          {/* Form Fields */}
          <View style={{ marginTop: 32, gap: 20 }}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Info size={16} color={RESULT_THEME.title} />
                <Text style={{ fontFamily: SCREEN_FONTS.headline, fontSize: 18, color: RESULT_THEME.title, textTransform: 'uppercase', letterSpacing: 0.5 }}>
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
                  fontSize: 13, 
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
        flexDirection: 'row',
        gap: 10,
        paddingHorizontal: 16, 
        paddingTop: 12, 
        paddingBottom: Math.max(insets.bottom, 28), 
        backgroundColor: '#F2F0E8',
        borderTopWidth: 0.5,
        borderTopColor: '#E5E3DC',
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{ 
            flex: 1, 
            height: 50,
            borderRadius: RADIUS.full, 
            borderWidth: BORDER.medium, 
            borderColor: '#E5E3DC', 
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: 'white' 
          }}
        >
          <Text style={{ fontFamily: SCREEN_FONTS.cta, fontSize: 15, color: '#1A2E2A', textTransform: 'uppercase' }}>
            Hủy
          </Text>
        </TouchableOpacity>

        {isSubmitted ? (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.back()}
            style={{
              flex: 2,
              height: 50,
              borderRadius: RADIUS.full,
              backgroundColor: RESULT_THEME.secondaryCta,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ fontFamily: SCREEN_FONTS.cta, fontSize: 15, color: RESULT_THEME.secondaryCtaText, textTransform: 'uppercase' }}>
              Xong
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => void onSaveResult()}
            disabled={submitting}
            style={{
              flex: 2,
              height: 50,
              borderRadius: RADIUS.full,
              backgroundColor: '#0F6E56',
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 8,
              opacity: submitting ? 0.8 : 1,
            }}
          >
            {submitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text style={{ fontFamily: SCREEN_FONTS.cta, fontSize: 15, color: 'white', textTransform: 'uppercase' }}>
                  Lưu kết quả →
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
