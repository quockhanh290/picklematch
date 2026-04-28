import { router, useLocalSearchParams } from 'expo-router'
import { ArrowLeft, CheckCheck, ShieldAlert } from 'lucide-react-native'
import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share,
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

const CONFIRM_THEME = {
  pageBg: PROFILE_THEME_COLORS.surfaceContainerLow,
  pageChipBg: PROFILE_THEME_COLORS.surfaceContainer,
  pageTitle: PROFILE_THEME_COLORS.primary,
  pageSubtitle: PROFILE_THEME_COLORS.onSecondaryContainer,
  muted: PROFILE_THEME_COLORS.outline,
  cardBg: PROFILE_THEME_COLORS.surfaceContainerLowest,
  cardBorder: PROFILE_THEME_COLORS.outlineVariant,
  heroBg: PROFILE_THEME_COLORS.primaryContainer,
  heroBorder: PROFILE_THEME_COLORS.surfaceTint,
  heroText: PROFILE_THEME_COLORS.onPrimary,
  heroTextSoft: PROFILE_THEME_COLORS.secondaryContainer,
  heroBadgeBg: PROFILE_THEME_COLORS.secondaryContainer,
  heroBadgeText: PROFILE_THEME_COLORS.onSecondaryContainer,
  sectionBg: PROFILE_THEME_COLORS.surfaceContainer,
  sectionBorder: PROFILE_THEME_COLORS.outlineVariant,
  inputBg: PROFILE_THEME_COLORS.surfaceContainerLowest,
  inputBorder: PROFILE_THEME_COLORS.outlineVariant,
  inputText: PROFILE_THEME_COLORS.onSurface,
  inputPlaceholder: PROFILE_THEME_COLORS.outline,
  dangerText: PROFILE_THEME_COLORS.error,
  warningBg: PROFILE_THEME_COLORS.primaryFixed,
  warningBorder: PROFILE_THEME_COLORS.secondaryFixedDim,
  warningText: PROFILE_THEME_COLORS.onPrimaryFixedVariant,
  primaryCtaBg: PROFILE_THEME_COLORS.primaryContainer,
  primaryCtaText: PROFILE_THEME_COLORS.onPrimary,
  secondaryCtaBg: PROFILE_THEME_COLORS.secondaryFixed,
  secondaryCtaText: PROFILE_THEME_COLORS.onSecondaryFixedVariant,
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

function formatHeroDate(value?: string | null) {
  if (!value) return 'Chưa rõ lịch'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Chưa rõ lịch'
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
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

function getInitials(name?: string | null) {
  const safe = (name ?? '').trim()
  if (!safe) return '?'
  return safe
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function getResultHeadline(result?: string | null) {
  return result === 'win' ? 'THẮNG' : 'THUA'
}

function getHeroScore(result?: string | null) {
  if (result === 'win') return { a: '11', b: '08' }
  if (result === 'loss') return { a: '08', b: '11' }
  if (result === 'draw') return { a: '09', b: '09' }
  return { a: '--', b: '--' }
}

function TeamPlayerRow({
  player,
  onOpenPlayer,
}: {
  player: SessionPlayerRecord
  onOpenPlayer: (playerId: string) => void
}) {
  return (
    <View
      style={{
        borderRadius: RADIUS.lg,
        borderWidth: BORDER.base,
        borderColor: CONFIRM_THEME.cardBorder,
        backgroundColor: CONFIRM_THEME.cardBg,
        paddingHorizontal: 12,
        paddingVertical: SPACING.sm,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <Pressable
        onPress={() => onOpenPlayer(player.player_id)}
        style={{
          width: 44,
          height: 44,
          borderRadius: RADIUS.full,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: PROFILE_THEME_COLORS.primary,
          borderWidth: BORDER.base,
          borderColor: PROFILE_THEME_COLORS.surfaceTint,
        }}
      >
        <Text style={{ fontFamily: SCREEN_FONTS.bold, fontSize: 14, color: PROFILE_THEME_COLORS.onPrimary }}>
          {getInitials(player.player?.name)}
        </Text>
      </Pressable>
      <View style={{ marginLeft: 12, flex: 1 }}>
        <Text style={{ fontFamily: SCREEN_FONTS.bold, fontSize: 16, color: PROFILE_THEME_COLORS.primary }}>
          {player.player?.name ?? 'Người chơi'}
        </Text>
        <Text style={{ marginTop: 2, fontFamily: SCREEN_FONTS.label, fontSize: 12, color: PROFILE_THEME_COLORS.onSecondaryContainer }}>
          {`ELO ${player.player?.current_elo ?? player.player?.elo ?? '--'}`}
        </Text>
      </View>
    </View>
  )
}

function TeamBlock({
  title,
  badge,
  players,
  onOpenPlayer,
}: {
  title: string
  badge: string
  players: SessionPlayerRecord[]
  onOpenPlayer: (playerId: string) => void
}) {
  return (
    <View style={{ marginTop: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <Text style={{ fontFamily: SCREEN_FONTS.bold, fontSize: 20, color: PROFILE_THEME_COLORS.primary }}>{title}</Text>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: RADIUS.full,
            backgroundColor: CONFIRM_THEME.primaryCtaBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontFamily: SCREEN_FONTS.bold, fontSize: 13, color: CONFIRM_THEME.cardBg }}>{badge}</Text>
        </View>
      </View>
      <View style={{ gap: 8 }}>
        {players.map((player) => (
          <TeamPlayerRow key={player.player_id} player={player} onOpenPlayer={onOpenPlayer} />
        ))}
        {players.length === 0 ? (
          <View
            style={{
              borderRadius: RADIUS.lg,
              borderWidth: BORDER.base,
              borderStyle: 'dashed',
              borderColor: PROFILE_THEME_COLORS.outlineVariant,
              backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow,
              paddingHorizontal: 12,
              paddingVertical: 12,
            }}
          >
            <Text style={{ fontFamily: SCREEN_FONTS.label, fontSize: 13, color: PROFILE_THEME_COLORS.onSecondaryContainer }}>
              Chưa có người chơi ở đội này
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  )
}

function splitTeamsForDisplay(players: SessionPlayerRecord[]) {
  const normalized = players.map((player, index) => ({ ...player, _index: index }))
  const hasTeamAssignment = normalized.some((player) => player.team_no === 1 || player.team_no === 2)

  if (!hasTeamAssignment) {
    return {
      teamA: normalized.filter((_, index) => index % 2 === 0),
      teamB: normalized.filter((_, index) => index % 2 === 1),
    }
  }

  let teamACount = normalized.filter((player) => player.team_no === 1).length
  let teamBCount = normalized.filter((player) => player.team_no === 2).length

  const resolved = normalized.map((player) => {
    if (player.team_no === 1 || player.team_no === 2) return player
    if (teamACount <= teamBCount) {
      teamACount += 1
      return { ...player, team_no: 1 as const }
    }
    teamBCount += 1
    return { ...player, team_no: 2 as const }
  })

  return {
    teamA: resolved.filter((player) => player.team_no === 1),
    teamB: resolved.filter((player) => player.team_no === 2),
  }
}

export default function ConfirmSessionResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
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

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.replace('/login' as any)
        return
      }

      if (mounted) setUserId(user.id)

      const { data, error } = await supabase.rpc('get_session_detail_overview', {
        p_session_id: id,
      })

      if (error) {
        openDialog({
          title: 'Không tải được kết quả trận',
          message: error.message,
          actions: [{ label: 'Đã hiểu' }],
        })
        if (mounted) {
          setSession(null)
          setLoading(false)
        }
        return
      }

      const nextSession = (data?.session ?? null) as ConfirmableSession | null

      if (nextSession?.host?.id === user.id) {
        openDialog({
          title: 'Chủ kèo không dùng màn này',
          message: 'Chủ kèo gửi kết quả ở bước nhập kết quả trận, không dùng luồng xác nhận của người chơi.',
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

    return () => {
      mounted = false
    }
  }, [id])

  const myEntry = useMemo(
    () => session?.session_players.find((player) => player.player_id === userId) ?? null,
    [session, userId],
  )

  const confirmedPlayers = useMemo(
    () => session?.session_players.filter((player) => player.status === 'confirmed') ?? [],
    [session],
  )

  const { teamA, teamB } = useMemo(
    () => splitTeamsForDisplay(confirmedPlayers),
    [confirmedPlayers],
  )
  const isMemberFallbackFlow =
    session?.results_status === 'not_submitted' && (session.status === 'pending_completion' || session.status === 'done')

  const heroScore = getHeroScore(myEntry?.proposed_result)
  const headline = getResultHeadline(myEntry?.proposed_result)

  async function submitResponse(response: 'confirmed' | 'disputed') {
    if (!id || !myEntry) return

    if (response === 'disputed' && !disputeNote.trim()) {
      openDialog({
        title: 'Thêm ghi chú giúp host',
        message: 'Nếu bạn tranh chấp kết quả, hãy nói ngắn gọn điều gì đang không đúng.',
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
      openDialog({
        title: 'Chưa thể ghi nhận phản hồi',
        message: error.message,
        actions: [{ label: 'Đã hiểu' }],
      })
      return
    }

    const message =
      data === 'finalized'
        ? 'Kết quả trận đã được chốt sau phản hồi của bạn.'
        : data === 'disputed'
          ? 'Trận đã được chuyển sang trạng thái tranh chấp để host và hệ thống xem lại.'
          : 'Phản hồi của bạn đã được ghi nhận.'

    openDialog({
      title: 'Đã cập nhật',
      message,
      actions: [{ label: 'Quay về chi tiết kèo', onPress: () => router.replace({ pathname: '/session/[id]' as any, params: { id } }) }],
    })
  }

  async function submitMemberReport() {
    if (!id) return

    setSubmitting('confirmed')

    const { data, error } = await supabase.rpc('report_host_unprofessional', {
      p_session_id: id,
      p_note: disputeNote.trim() || null,
    })

    setSubmitting(null)

    if (error) {
      openDialog({
        title: 'Chưa thể gửi báo cáo',
        message: error.message,
        actions: [{ label: 'Đã hiểu' }],
      })
      return
    }

    const message =
      data === 'already_reported'
        ? 'Bạn đã gửi báo cáo về host ở kèo này trước đó.'
        : 'Báo cáo của bạn đã được ghi nhận. Hệ thống sẽ dùng tín hiệu này để xem xét việc host không xử lý kết quả đúng hạn.'

    openDialog({
      title: 'Đã ghi nhận',
      message,
      actions: [{ label: 'Quay về chi tiết kèo', onPress: () => router.replace({ pathname: '/session/[id]' as any, params: { id } }) }],
    })
  }

  async function onShare() {
    if (!id) return
    try {
      await Share.share({
        message: `Xem thông tin trận đấu tại PickleMatch: /session/${id}`,
      })
    } catch {}
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: CONFIRM_THEME.pageBg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={PROFILE_THEME_COLORS.primary} />
      </SafeAreaView>
    )
  }

  if (!session || !myEntry) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: CONFIRM_THEME.pageBg, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 }}>
        <Text style={{ fontFamily: SCREEN_FONTS.bold, fontSize: 22, color: CONFIRM_THEME.pageTitle, textAlign: 'center' }}>
          Không tìm thấy dữ liệu xác nhận
        </Text>
        <Text style={{ marginTop: 8, fontFamily: SCREEN_FONTS.body, fontSize: 14, lineHeight: 20, color: CONFIRM_THEME.pageSubtitle, textAlign: 'center' }}>
          Kèo này có thể chưa có kết quả cần xác nhận hoặc bạn không thuộc danh sách người chơi.
        </Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: CONFIRM_THEME.pageBg }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: SPACING.lg, paddingTop: 8, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ alignItems: 'center', justifyContent: 'center', minHeight: 44 }}>
          <Pressable
            onPress={() => router.back()}
            style={{
              position: 'absolute',
              left: 0,
              width: 38,
              height: 38,
              borderRadius: RADIUS.full,
              backgroundColor: CONFIRM_THEME.pageChipBg,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ArrowLeft size={18} color={PROFILE_THEME_COLORS.onSecondaryContainer} />
          </Pressable>
          <Text style={{ fontFamily: SCREEN_FONTS.bold, fontSize: 30, color: CONFIRM_THEME.pageTitle }}>
            Xác nhận kết quả
          </Text>
        </View>

        <View style={{ marginTop: 10, alignItems: 'center' }}>
          <Text
            style={{
              fontFamily: SCREEN_FONTS.cta,
              fontSize: 11,
              letterSpacing: 1.2,
              color: CONFIRM_THEME.muted,
              textTransform: 'uppercase',
            }}
          >
            Thông tin trận đấu
          </Text>
          <Text
            numberOfLines={2}
            style={{
              marginTop: 4,
              textAlign: 'center',
              fontFamily: SCREEN_FONTS.bold,
              fontSize: 30,
              lineHeight: 36,
              color: CONFIRM_THEME.pageTitle,
            }}
          >
            {session.slot.court.name}
          </Text>
          <Text
            style={{
              marginTop: 4,
              fontFamily: SCREEN_FONTS.cta,
              fontSize: 13,
              color: CONFIRM_THEME.pageSubtitle,
            }}
          >
            {formatHeroDate(session.slot.start_time)} • {formatTimeRange(session.slot.start_time, session.slot.end_time)}
          </Text>
        </View>

        <View
          style={{
            marginTop: 14,
            borderRadius: RADIUS.hero,
            backgroundColor: CONFIRM_THEME.heroBg,
            borderWidth: BORDER.base,
            borderColor: CONFIRM_THEME.heroBorder,
            overflow: 'hidden',
            paddingHorizontal: SPACING.lg,
            paddingTop: 16,
            paddingBottom: 18,
          }}
        >
          <View
            style={{
              position: 'absolute',
              width: 220,
              height: 220,
              borderRadius: RADIUS.full,
              backgroundColor: withAlpha(PROFILE_THEME_COLORS.onPrimary, 0.06),
              top: -110,
              right: -50,
            }}
          />
          <View
            style={{
              position: 'absolute',
              width: 180,
              height: 180,
              borderRadius: RADIUS.full,
              backgroundColor: withAlpha(PROFILE_THEME_COLORS.onBackground, 0.08),
              bottom: -60,
              right: -40,
            }}
          />

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ borderRadius: RADIUS.full, backgroundColor: CONFIRM_THEME.heroBadgeBg, paddingHorizontal: 12, paddingVertical: SPACING.xs }}>
              <Text style={{ fontFamily: SCREEN_FONTS.bold, fontSize: 10, letterSpacing: 1.1, color: CONFIRM_THEME.heroBadgeText }}>
                KẾT QUẢ TRẬN ĐẤU
              </Text>
            </View>
          </View>

          <Text
            style={{
              marginTop: 16,
              fontFamily: SCREEN_FONTS.bold,
              fontSize: 70,
              lineHeight: 108,
              color: CONFIRM_THEME.cardBg,
            }}
          >
            {headline}
          </Text>

          <View style={{ marginTop: 18, flexDirection: 'row', alignItems: 'flex-end', gap: 16 }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontFamily: SCREEN_FONTS.bold, fontSize: 54, color: CONFIRM_THEME.heroText }}>{heroScore.a}</Text>
              <Text style={{ marginTop: -4, fontFamily: SCREEN_FONTS.cta, fontSize: 12, letterSpacing: 1.2, color: CONFIRM_THEME.heroTextSoft }}>ĐỘI A</Text>
            </View>
            <Text style={{ marginBottom: 22, fontFamily: SCREEN_FONTS.cta, fontSize: 34, color: CONFIRM_THEME.heroTextSoft }}>|</Text>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontFamily: SCREEN_FONTS.bold, fontSize: 54, color: CONFIRM_THEME.heroText }}>{heroScore.b}</Text>
              <Text style={{ marginTop: -4, fontFamily: SCREEN_FONTS.cta, fontSize: 12, letterSpacing: 1.2, color: CONFIRM_THEME.heroTextSoft }}>ĐỘI B</Text>
            </View>
          </View>
        </View>

        <View
          style={{
            marginTop: 16,
            borderRadius: RADIUS.xl,
            borderWidth: BORDER.base,
            borderColor: CONFIRM_THEME.sectionBorder,
            backgroundColor: CONFIRM_THEME.sectionBg,
            padding: SPACING.md,
          }}
        >
          <Text style={{ fontFamily: SCREEN_FONTS.bold, fontSize: 14, color: CONFIRM_THEME.pageTitle, letterSpacing: 0.8 }}>
            • ĐỘI HÌNH THI ĐẤU
          </Text>

          <TeamBlock
            title="Đội A"
            badge="A"
            players={teamA}
            onOpenPlayer={(playerId) => router.push({ pathname: '/player/[id]' as never, params: { id: playerId } })}
          />
          <TeamBlock
            title="Đội B"
            badge="B"
            players={teamB}
            onOpenPlayer={(playerId) => router.push({ pathname: '/player/[id]' as never, params: { id: playerId } })}
          />
        </View>

        <View
          style={{
            marginTop: 16,
            borderRadius: RADIUS.xl,
            borderWidth: BORDER.base,
            borderColor: CONFIRM_THEME.sectionBorder,
            backgroundColor: CONFIRM_THEME.sectionBg,
            padding: SPACING.md,
          }}
        >
          <Text style={{ fontFamily: SCREEN_FONTS.bold, fontSize: 15, color: CONFIRM_THEME.pageTitle, textTransform: 'uppercase', letterSpacing: 0.8 }}>
            Khiếu nại kết quả
          </Text>
          <Text style={{ marginTop: 8, fontFamily: SCREEN_FONTS.label, fontSize: 13, lineHeight: 20, color: CONFIRM_THEME.pageSubtitle }}>
            Nếu kết quả không chính xác hoặc có tranh chấp trong trận đấu, vui lòng nhập lý do chi tiết bên dưới.
            {' '}
            {isMemberFallbackFlow
              ? 'Host chưa xử lý kết quả đúng hạn, bạn có thể gửi báo cáo để hệ thống ghi nhận.'
              : 'Ban quản trị sẽ xem xét trong vòng 24h.'}
          </Text>

          <TextInput
            value={disputeNote}
            onChangeText={setDisputeNote}
            multiline
            textAlignVertical="top"
            placeholder={
              isMemberFallbackFlow
                ? 'Ví dụ: host không có mặt, không chốt đội hình hoặc không xác nhận kết quả đúng hẹn.'
                : 'Nhập nội dung tranh chấp tại đây...'
            }
            placeholderTextColor={CONFIRM_THEME.inputPlaceholder}
            style={{
              marginTop: 10,
              borderRadius: RADIUS.xl,
              borderWidth: BORDER.base,
              borderColor: CONFIRM_THEME.inputBorder,
              backgroundColor: CONFIRM_THEME.cardBg,
              minHeight: 120,
              paddingHorizontal: 12,
              paddingVertical: SPACING.sm,
              fontFamily: SCREEN_FONTS.body,
              fontSize: 14,
              color: CONFIRM_THEME.inputText,
            }}
          />

          <Pressable
            onPress={() => void (isMemberFallbackFlow ? submitMemberReport() : submitResponse('disputed'))}
            disabled={submitting != null}
            style={{ marginTop: 12 }}
          >
            <View
              style={{
                height: 50,
                borderRadius: RADIUS.full,
                borderWidth: BORDER.thick,
                borderColor: CONFIRM_THEME.dangerText,
                backgroundColor: PROFILE_THEME_COLORS.secondaryContainer,
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'row',
                gap: 6,
              }}
            >
              {submitting === 'disputed' ? (
                <ActivityIndicator color={PROFILE_THEME_COLORS.primary} />
              ) : (
                <>
                  <ShieldAlert size={16} color={CONFIRM_THEME.dangerText} />
                  <Text style={{ fontFamily: SCREEN_FONTS.bold, fontSize: 16, color: CONFIRM_THEME.dangerText }}>
                    {isMemberFallbackFlow ? 'Gửi báo cáo' : 'Gửi khiếu nại'}
                  </Text>
                </>
              )}
            </View>
          </Pressable>
        </View>

        {myEntry.result_confirmation_status === 'disputed' && myEntry.result_dispute_note ? (
          <View style={{ marginTop: 12, borderRadius: RADIUS.xl, borderWidth: BORDER.base, borderColor: CONFIRM_THEME.warningBorder, backgroundColor: CONFIRM_THEME.warningBg, padding: 12 }}>
            <Text style={{ fontFamily: SCREEN_FONTS.bold, fontSize: 14, color: CONFIRM_THEME.warningText }}>
              Bạn đã gửi tranh chấp trước đó
            </Text>
            <Text style={{ marginTop: 4, fontFamily: SCREEN_FONTS.body, fontSize: 13, lineHeight: 19, color: CONFIRM_THEME.warningText }}>
              {myEntry.result_dispute_note}
            </Text>
          </View>
        ) : null}

        {!isMemberFallbackFlow ? (
          <>
            <Pressable
              onPress={() => void submitResponse('confirmed')}
              disabled={submitting != null}
              style={{ marginTop: 16 }}
            >
              <View
                style={{
                  height: 56,
                  borderRadius: RADIUS.full,
                  backgroundColor: CONFIRM_THEME.primaryCtaBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                  gap: 7,
                }}
              >
                {submitting === 'confirmed' ? (
                  <ActivityIndicator color={CONFIRM_THEME.primaryCtaText} />
                ) : (
                  <>
                    <CheckCheck size={18} color={CONFIRM_THEME.primaryCtaText} />
                    <Text style={{ fontFamily: SCREEN_FONTS.bold, fontSize: 18, color: CONFIRM_THEME.cardBg }}>
                      Xác nhận kết quả
                    </Text>
                  </>
                )}
              </View>
            </Pressable>

            <Pressable onPress={() => void onShare()} style={{ marginTop: 10 }}>
              <View
                style={{
                  height: 56,
                  borderRadius: RADIUS.full,
                  backgroundColor: CONFIRM_THEME.secondaryCtaBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text style={{ fontFamily: SCREEN_FONTS.bold, fontSize: 18, color: CONFIRM_THEME.secondaryCtaText }}>
                  Chia sẻ trận đấu
                </Text>
              </View>
            </Pressable>
          </>
        ) : null}

        <View style={{ height: 6 }} />
      </ScrollView>
      <AppDialog
        visible={Boolean(dialogConfig)}
        config={dialogConfig}
        onClose={() => setDialogConfig(null)}
      />
    </SafeAreaView>
  )
}


