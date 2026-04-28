import { router, useLocalSearchParams } from 'expo-router'
import { ArrowLeft, CheckCheck, ShieldAlert, Clock, MapPin, Share2, Info } from 'lucide-react-native'
import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  ScrollView,
  Share,
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
  danger: PROFILE_THEME_COLORS.error,
} as const

type SessionPlayerRecord = {
  player_id: string
  status?: string | null
  team_no?: 1 | 2 | null
  proposed_result?: string | null
  result_confirmation_status?: string | null
  result_dispute_note?: string | null
  player?: {
    name?: string | null
    current_elo?: number | null
    elo?: number | null
  } | null
}

type ConfirmableSession = {
  id: string
  status: string
  results_status?: string | null
  results_confirmation_deadline?: string | null
  host: {
    id: string
    name?: string | null
  }
  slot: {
    start_time: string
    end_time: string
    court: {
      name: string
      address?: string | null
      city?: string | null
    }
  }
  session_players: SessionPlayerRecord[]
}

function formatTimeRange(start?: string | null, end?: string | null) {
  if (!start || !end) return '--:-- - --:--'
  const startDate = new Date(start)
  const endDate = new Date(end)
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) return '--:-- - --:--'
  const fmt = (date: Date) =>
    `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  return `${fmt(startDate)} - ${fmt(endDate)}`
}

function padScore(val: number) {
  return val.toString().padStart(2, '0')
}

function TeamScoreCard({ 
  teamName, 
  players, 
  score, 
  isMain 
}: { 
  teamName: string, 
  players: SessionPlayerRecord[], 
  score: number, 
  isMain: boolean 
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
        Đội {teamName}
      </Text>
      
      <View style={{ marginVertical: 12, alignItems: 'center' }}>
        <Text style={{ fontFamily: SCREEN_FONTS.headline, fontSize: 64, lineHeight: 72, color: text }}>
          {padScore(score)}
        </Text>
      </View>
      
      <View style={{ marginTop: 16, width: '100%' }}>
        {players.map((p, idx) => (
          <Text key={p.player_id} numberOfLines={1} style={{ 
            fontFamily: SCREEN_FONTS.label, 
            fontSize: 12, 
            color: label, 
            textAlign: 'center',
            marginTop: idx > 0 ? 2 : 0
          }}>
            {p.player?.name ?? 'Người chơi'}
          </Text>
        ))}
      </View>
    </View>
  )
}

export default function ConfirmSessionResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState<'confirmed' | 'disputed' | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [session, setSession] = useState<ConfirmableSession | null>(null)
  const [disputeNote, setDisputeNote] = useState('')
  const [dialogConfig, setDialogConfig] = useState<AppDialogConfig | null>(null)

  function openDialog(config: AppDialogConfig) {
    setDialogConfig(config)
  }

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!id) {
        if (mounted) setLoading(false)
        return
      }
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.replace('/login' as any)
        return
      }
      if (mounted) setUserId(user.id)
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
      const nextSession = (data?.session ?? null) as ConfirmableSession | null
      if (nextSession?.host?.id === user.id) {
        if (mounted) setLoading(false)
        openDialog({
          title: 'Chủ kèo',
          message: 'Vui lòng sử dụng màn hình Nhập kết quả dành cho chủ kèo.',
          actions: [{ label: 'Quay lại', onPress: () => router.back() }],
        })
        return
      }
      if (mounted) {
        setSession(nextSession)
        setLoading(false)
      }
    }
    void load()
    return () => { mounted = false }
  }, [id])

  const myEntry = useMemo(
    () => session?.session_players.find((player) => player.player_id === userId) ?? null,
    [session, userId],
  )

  const confirmedPlayers = useMemo(
    () => session?.session_players.filter((player) => player.status === 'confirmed') ?? [],
    [session],
  )

  const teamA = confirmedPlayers.filter(p => p.team_no === 1)
  const teamB = confirmedPlayers.filter(p => p.team_no === 2)
  
  const resultsStatus = session?.results_status
  const isFinalized = resultsStatus === 'finalized'
  const isDisputed = resultsStatus === 'disputed'
  const hasActed = myEntry?.result_confirmation_status === 'confirmed' || myEntry?.result_confirmation_status === 'disputed'

  function getHeroScore(result?: string | null) {
    if (result === 'win') return { a: 11, b: 8 }
    if (result === 'loss') return { a: 8, b: 11 }
    if (result === 'draw') return { a: 9, b: 9 }
    return { a: 0, b: 0 }
  }
  const scores = getHeroScore(myEntry?.proposed_result)

  async function submitResponse(response: 'confirmed' | 'disputed') {
    if (!id || !myEntry) return
    if (response === 'disputed' && !disputeNote.trim()) {
      openDialog({
        title: 'Thêm ghi chú',
        message: 'Vui lòng nhập lý do bạn khiếu nại kết quả này.',
        actions: [{ label: 'Đã hiểu' }],
      })
      return
    }
    setSubmitting(response)
    const { data, error } = await supabase.rpc('respond_to_session_result', {
      p_session_id: id,
      p_response: response,
      p_note: response === 'disputed' ? disputeNote.trim() : null,
    })
    setSubmitting(null)
    if (error) {
      openDialog({ title: 'Lỗi', message: error.message, actions: [{ label: 'Đã hiểu' }] })
      return
    }
    openDialog({
      title: 'Đã ghi nhận',
      message: response === 'confirmed' ? 'Cảm ơn bạn đã xác nhận kết quả.' : 'Khiếu nại của bạn đã được gửi tới hệ thống.',
      actions: [{ label: 'Quay lại', onPress: () => router.replace({ pathname: '/session/[id]' as any, params: { id } }) }],
    })
  }

  async function onShare() {
    if (!id) return
    try {
      await Share.share({ message: `Xem kết quả trận đấu tại PickleMatch: /session/${id}` })
    } catch {}
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: RESULT_THEME.pageBg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={RESULT_THEME.accent} />
      </View>
    )
  }

  if (!session || !myEntry) return null

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
                {isFinalized ? 'Hoàn tất' : isDisputed ? 'Khiếu nại' : 'Chờ xác nhận'}
              </Text>
            </View>
          </View>

          <View style={{ marginTop: 24 }}>
            <Text style={{ fontFamily: SCREEN_FONTS.headline, fontSize: 32, color: RESULT_THEME.title }}>
              Xác nhận kết quả
            </Text>
            
            <View style={{ marginTop: 12, padding: 16, borderRadius: RADIUS.lg, backgroundColor: RESULT_THEME.cardBg, borderWidth: BORDER.base, borderColor: RESULT_THEME.cardBorder }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 36, height: 36, borderRadius: RADIUS.full, backgroundColor: RESULT_THEME.accentSoft, alignItems: 'center', justifyContent: 'center' }}>
                  <MapPin size={18} color={RESULT_THEME.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: SCREEN_FONTS.bold, fontSize: 15, color: RESULT_THEME.title }}>
                    {session.slot.court.name}
                  </Text>
                  <View style={{ marginTop: 2, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Clock size={12} color={RESULT_THEME.muted} />
                    <Text style={{ fontFamily: SCREEN_FONTS.label, fontSize: 12, color: RESULT_THEME.muted }}>
                      {formatTimeRange(session.slot.start_time, session.slot.end_time)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Scoreboard */}
          <View style={{ marginTop: 32 }}>
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontFamily: SCREEN_FONTS.headline, fontSize: 18, color: RESULT_THEME.title }}>
                Điểm số trận đấu
              </Text>
            </View>
            
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
              <TeamScoreCard 
                teamName="A"
                players={teamA} 
                score={scores.a} 
                isMain={scores.a >= scores.b}
              />
              
              <View style={{ width: 32, alignItems: 'center' }}>
                <Text style={{ fontFamily: SCREEN_FONTS.boldItalic, fontSize: 16, color: RESULT_THEME.muted }}>VS</Text>
              </View>

              <TeamScoreCard 
                teamName="B"
                players={teamB} 
                score={scores.b} 
                isMain={scores.b > scores.a}
              />
            </View>
          </View>

          {/* Dispute Form (if not acted yet) */}
          {!hasActed && (
            <View style={{ marginTop: 32 }}>
              <View style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Info size={16} color={RESULT_THEME.title} />
                <Text style={{ fontFamily: SCREEN_FONTS.headline, fontSize: 18, color: RESULT_THEME.title }}>
                  Khiếu nại (nếu có)
                </Text>
              </View>
              <TextInput 
                value={disputeNote}
                onChangeText={setDisputeNote}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                style={{ 
                  minHeight: 120, 
                  borderRadius: RADIUS.xl, 
                  backgroundColor: RESULT_THEME.inputBg, 
                  padding: 16, 
                  fontFamily: SCREEN_FONTS.body, 
                  fontSize: 15, 
                  color: RESULT_THEME.inputText,
                  borderWidth: BORDER.base,
                  borderColor: RESULT_THEME.cardBorder,
                }}
                placeholder="Nếu kết quả không đúng, hãy nhập lý do tại đây..."
                placeholderTextColor={RESULT_THEME.inputPlaceholder}
              />
            </View>
          )}

          {/* Dispute Summary (if already disputed) */}
          {myEntry.result_confirmation_status === 'disputed' && (
            <View style={{ marginTop: 32, padding: 20, borderRadius: RADIUS.xl, backgroundColor: withAlpha(RESULT_THEME.danger, 0.08), borderWidth: BORDER.base, borderColor: withAlpha(RESULT_THEME.danger, 0.2) }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <ShieldAlert size={18} color={RESULT_THEME.danger} />
                <Text style={{ fontFamily: SCREEN_FONTS.headline, fontSize: 18, color: RESULT_THEME.danger }}>
                  Nội dung khiếu nại
                </Text>
              </View>
              <Text style={{ fontFamily: SCREEN_FONTS.body, fontSize: 15, color: RESULT_THEME.inputText, lineHeight: 22 }}>
                {myEntry.result_dispute_note}
              </Text>
            </View>
          )}
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
        {hasActed ? (
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.back()}
              style={{
                flex: 1,
                height: 56,
                borderRadius: RADIUS.full,
                backgroundColor: RESULT_THEME.secondaryCta,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontFamily: SCREEN_FONTS.bold, fontSize: 16, color: RESULT_THEME.secondaryCtaText }}>
                QUAY LẠI CHI TIẾT KÈO
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onShare}
              style={{
                width: 56,
                height: 56,
                borderRadius: RADIUS.full,
                backgroundColor: RESULT_THEME.accentSoft,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Share2 size={24} color={RESULT_THEME.accent} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => void submitResponse('confirmed')}
              disabled={submitting !== null}
              style={{
                height: 56,
                borderRadius: RADIUS.full,
                backgroundColor: RESULT_THEME.primaryCta,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
                ...SHADOW.md,
                shadowColor: RESULT_THEME.accent,
              }}
            >
              {submitting === 'confirmed' ? (
                <ActivityIndicator color={RESULT_THEME.primaryCtaText} />
              ) : (
                <>
                  <CheckCheck size={20} color={RESULT_THEME.primaryCtaText} strokeWidth={2.5} />
                  <Text style={{ fontFamily: SCREEN_FONTS.bold, fontSize: 18, color: RESULT_THEME.primaryCtaText, textTransform: 'uppercase' }}>
                    Xác nhận kết quả
                  </Text>
                </>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => void submitResponse('disputed')}
              disabled={submitting !== null}
              style={{
                height: 50,
                borderRadius: RADIUS.full,
                borderWidth: BORDER.medium,
                borderColor: RESULT_THEME.danger,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
              }}
            >
              {submitting === 'disputed' ? (
                <ActivityIndicator color={RESULT_THEME.danger} />
              ) : (
                <>
                  <ShieldAlert size={18} color={RESULT_THEME.danger} />
                  <Text style={{ fontFamily: SCREEN_FONTS.bold, fontSize: 16, color: RESULT_THEME.danger, textTransform: 'uppercase' }}>
                    Gửi khiếu nại
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
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
