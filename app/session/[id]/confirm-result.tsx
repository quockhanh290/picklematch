import { router, useLocalSearchParams } from 'expo-router'
import { ArrowLeft, CheckCheck, ShieldAlert, MapPin, Share2, Info } from 'lucide-react-native'
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

import { AppDialog, type AppDialogConfig, NavbarShareButton, SecondaryNavbar } from '@/components/design'
import { PROFILE_THEME_COLORS } from '@/components/profile/profileTheme'
import { supabase } from '@/lib/supabase'
import { SCREEN_FONTS } from '@/constants/typography'
import { RADIUS, BORDER, SHADOW } from '@/constants/screenLayout'
import { formatPricePerPerson, formatTimeRange as _formatTimeRange } from '@/lib/sessionDetail'

function withAlpha(hex: string, alpha: number) {
  const clean = hex.replace('#', '')
  const normalized = clean.length === 3 ? clean.split('').map((char) => char + char).join('') : clean
  const n = Number.parseInt(normalized, 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

const RESULT_THEME = {
  pageBg: '#F2F0E8',
  accent: '#0F6E56',
  accentSoft: '#E1F5EE',
  cardBg: '#FFFFFF',
  cardBorder: '#E5E3DC',
  title: '#1A2E2A',
  subtitle: '#7A8884',
  muted: '#B4B2A9',
  
  inputBg: '#F5F1E8',
  inputText: '#1A2E2A',
  inputPlaceholder: '#7A8884',
  
  secondaryCta: '#F5F1E8',
  secondaryCtaText: '#1A2E2A',
  danger: '#E53935',
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
  max_players?: number
  booking_notes?: string | null
  slot: {
    start_time: string
    end_time: string
    price?: number
    court: {
      name: string
      address?: string | null
      city?: string | null
    }
  }
  session_players: SessionPlayerRecord[]
}

type TeamSummary = {
  id: string
  name: string
  players: { id: string; name: string }[]
}

function buildTeams(session: ConfirmableSession | null): TeamSummary[] {
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
  teams,
}: {
  session: ConfirmableSession
  scoreA: number
  scoreB: number
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
  
  const timeLabel = _formatTimeRange(startTime, endTime)
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
          paddingVertical: 8,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 6 }}>
          <View style={{ width: 5, height: 5, borderRadius: RADIUS.full, backgroundColor: '#FFFFFF' }} />
          <Text style={{ color: '#FFFFFF', fontFamily: SCREEN_FONTS.cta, fontSize: 11, letterSpacing: 0.5 }}>
            XÁC NHẬN KẾT QUẢ
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
      </View>

      {/* Note / Host message */}
      {hostNote && hostNote.trim().length > 0 && (
        <>
          <View style={{ height: 1, backgroundColor: 'rgba(0,0,0,0.06)', marginVertical: 16 }} />
          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
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
          </View>
        </>
      )}
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

  const teams = useMemo(() => buildTeams(session), [session])
  
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
    <View style={{ flex: 1, backgroundColor: RESULT_THEME.pageBg }}>
      <SecondaryNavbar
        onBackPress={() => router.back()}
        rightSlot={<NavbarShareButton onPress={() => void onShare()} />}
      />
      <View style={{ flex: 1 }}>
        <ScrollView 
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >

          <View style={{ marginTop: 24 }}>
            <SessionResultMetaCard
              session={session}
              scoreA={scores.a}
              scoreB={scores.b}
              teams={teams}
            />
          </View>

          {/* Dispute Form (if not acted yet) */}
          {!hasActed && (
            <View style={{ marginTop: 32 }}>
              <View style={{ marginBottom: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <ShieldAlert size={16} color={RESULT_THEME.title} />
                <Text style={{ fontFamily: SCREEN_FONTS.headline, fontSize: 18, color: RESULT_THEME.title, textTransform: 'uppercase', letterSpacing: 0.5 }}>
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
                  borderRadius: RADIUS.lg, 
                  backgroundColor: RESULT_THEME.inputBg, 
                  padding: 16, 
                  fontFamily: SCREEN_FONTS.body, 
                  fontSize: 13, 
                  color: RESULT_THEME.inputText,
                }}
                placeholder="Nếu kết quả không đúng, hãy nhập lý do tại đây..."
                placeholderTextColor={RESULT_THEME.inputPlaceholder}
              />
            </View>
          )}

          {/* Dispute Summary (if already disputed) */}
          {myEntry.result_confirmation_status === 'disputed' && (
            <View style={{ marginTop: 32, padding: 20, borderRadius: RADIUS.lg, backgroundColor: withAlpha(RESULT_THEME.danger, 0.08), borderWidth: BORDER.base, borderColor: withAlpha(RESULT_THEME.danger, 0.2) }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <ShieldAlert size={18} color={RESULT_THEME.danger} />
                <Text style={{ fontFamily: SCREEN_FONTS.headline, fontSize: 18, color: RESULT_THEME.danger, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Nội dung khiếu nại
                </Text>
              </View>
              <Text style={{ fontFamily: SCREEN_FONTS.body, fontSize: 13, color: RESULT_THEME.inputText, lineHeight: 18 }}>
                {myEntry.result_dispute_note}
              </Text>
            </View>
          )}
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
        {hasActed ? (
          <>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.back()}
              style={{
                flex: 1,
                height: 50,
                borderRadius: RADIUS.full,
                backgroundColor: 'white',
                borderWidth: BORDER.medium,
                borderColor: '#E5E3DC',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontFamily: SCREEN_FONTS.cta, fontSize: 15, color: '#1A2E2A', textTransform: 'uppercase' }}>
                Quay lại
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={onShare}
              style={{
                flex: 2,
                height: 50,
                borderRadius: RADIUS.full,
                backgroundColor: '#0F6E56',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
              }}
            >
              <Share2 size={18} color="white" strokeWidth={2.5} />
              <Text style={{ fontFamily: SCREEN_FONTS.cta, fontSize: 15, color: 'white', textTransform: 'uppercase' }}>
                Chia sẻ kết quả
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => void submitResponse('disputed')}
              disabled={submitting !== null}
              style={{
                flex: 1,
                height: 50,
                borderRadius: RADIUS.full,
                borderWidth: BORDER.medium,
                borderColor: '#E5E3DC',
                backgroundColor: 'white',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {submitting === 'disputed' ? (
                <ActivityIndicator color={RESULT_THEME.danger} />
              ) : (
                <Text style={{ fontFamily: SCREEN_FONTS.cta, fontSize: 15, color: RESULT_THEME.danger, textTransform: 'uppercase' }}>
                  Khiếu nại
                </Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => void submitResponse('confirmed')}
              disabled={submitting !== null}
              style={{
                flex: 2,
                height: 50,
                borderRadius: RADIUS.full,
                backgroundColor: '#0F6E56',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 8,
              }}
            >
              {submitting === 'confirmed' ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <CheckCheck size={18} color="white" strokeWidth={2.5} />
                  <Text style={{ fontFamily: SCREEN_FONTS.cta, fontSize: 15, color: 'white', textTransform: 'uppercase' }}>
                    Xác nhận kết quả →
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </>
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
