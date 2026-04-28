import { AppButton, AppDialog, type AppDialogConfig, EmptyState } from '@/components/design'
import { PROFILE_THEME_COLORS } from '@/components/profile/profileTheme'
import { getShortSkillLabel, getSkillLevelFromPlayer } from '@/lib/skillAssessment'
import { supabase } from '@/lib/supabase'
import { router, useLocalSearchParams } from 'expo-router'
import type { LucideIcon } from 'lucide-react-native'
import {
  AlertOctagon,
  ArrowDown,
  ArrowLeft,
  Check,
  CheckCheck,
  Clock,
  Heart,
  Hourglass,
  MessageCircle,
  ShieldAlert,
  ShieldCheck,
  Trophy,
  UserX,
  Zap,
} from 'lucide-react-native'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, LayoutAnimation, Platform, ScrollView, Text, TouchableOpacity, UIManager, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SCREEN_FONTS } from '@/constants/typography'
import { RADIUS, SPACING, BORDER, SHADOW } from '@/constants/screenLayout'

type SkillValidation = 'weaker' | 'matched' | 'outclass'

type SessionRecord = {
  id: string
  status: string
  results_status?: string | null
  host_id: string
  session_players: {
    player_id: string
    player?: {
      name?: string | null
      self_assessed_level?: string | null
      skill_label?: string | null
    } | null
  }[]
}

type PlayerInSession = {
  player_id: string
  name: string
  is_host: boolean
  self_assessed_level?: string | null
  skill_label?: string | null
}

type RatingEntry = {
  tags: string[]
  no_show: boolean
  skill_validation: SkillValidation
}

type SkillOption = {
  value: SkillValidation
  label: string
  subtitle: string
  icon: LucideIcon
}

type TagOption = {
  value: string
  label: string
  icon: LucideIcon
  tone: 'positive' | 'warning'
}

const SW = 2.5

function withAlpha(hex: string, alpha: number) {
  const clean = hex.replace('#', '')
  const normalized = clean.length === 3 ? clean.split('').map((char) => char + char).join('') : clean
  const n = Number.parseInt(normalized, 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

const SKILL_OPTIONS: SkillOption[] = [
  { value: 'weaker', label: 'Cần cố gắng', subtitle: 'Dưới trình', icon: ArrowDown },
  { value: 'matched', label: 'Đúng trình', subtitle: 'Như kỳ vọng', icon: Check },
  { value: 'outclass', label: 'Out trình', subtitle: 'Trên hẳn', icon: Trophy },
]

const POSITIVE_TAGS: TagOption[] = [
  { value: 'fair_play', label: 'Chơi đẹp', icon: Heart, tone: 'positive' },
  { value: 'on_time', label: 'Đúng giờ', icon: Clock, tone: 'positive' },
  { value: 'friendly', label: 'Thân thiện', icon: MessageCircle, tone: 'positive' },
  { value: 'skilled', label: 'Kỹ thuật tốt', icon: Zap, tone: 'positive' },
]

const WARNING_TAGS: TagOption[] = [
  { value: 'toxic', label: 'Xấu tính', icon: AlertOctagon, tone: 'warning' },
  { value: 'late', label: 'Đến trễ', icon: Hourglass, tone: 'warning' },
  { value: 'dishonest', label: 'Gian lận', icon: ShieldAlert, tone: 'warning' },
]

function createDefaultEntry(): RatingEntry {
  return { tags: [], no_show: false, skill_validation: 'matched' }
}

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

function animateSelection() {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
}

function getAvatarLetter(name: string) {
  const first = name.trim().charAt(0)
  return first ? first.toUpperCase() : 'U'
}

function StepProgress({ total, current }: { total: number; current: number }) {
  if (total <= 0) return null
  return (
    <View
      style={{
        borderRadius: RADIUS.full,
        backgroundColor: PROFILE_THEME_COLORS.surfaceContainerHighest,
        paddingHorizontal: 12,
        paddingVertical: SPACING.xs,
      }}
    >
      <Text
        style={{
          fontSize: 11,
          fontFamily: SCREEN_FONTS.bold,
          letterSpacing: 1.2,
          color: PROFILE_THEME_COLORS.outline,
          textTransform: 'uppercase',
        }}
      >
        {Math.min(current + 1, total)}/{total}
      </Text>
    </View>
  )
}

function SectionLabel({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text
        style={{
          fontSize: 10,
          fontFamily: SCREEN_FONTS.bold,
          letterSpacing: 1.8,
          textTransform: 'uppercase',
          color: PROFILE_THEME_COLORS.outline,
        }}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text
          style={{
            marginTop: 6,
            fontSize: 18,
            lineHeight: 24,
            fontFamily: SCREEN_FONTS.bold,
            color: PROFILE_THEME_COLORS.onSurface,
          }}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  )
}

function SkillChip({
  option,
  active,
  disabled,
  onPress,
}: {
  option: SkillOption
  active: boolean
  disabled: boolean
  onPress: () => void
}) {
  const Icon = option.icon

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={active ? 0.9 : 0.75}
      style={{
        flex: 1,
        minHeight: 118,
        borderRadius: RADIUS.lg,
        borderWidth: active ? 2 : 1.5,
        borderColor: active ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.outlineVariant,
        backgroundColor: active ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.surfaceContainerHigh,
        paddingHorizontal: SPACING.sm,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        opacity: disabled ? 0.36 : 1,
        shadowColor: active ? PROFILE_THEME_COLORS.primary : 'transparent',
        shadowOpacity: active ? 0.24 : 0,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 10,
        elevation: active ? 4 : 0,
      }}
    >
      {active ? (
        <View
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 18,
            height: 18,
            borderRadius: RADIUS.full,
            backgroundColor: PROFILE_THEME_COLORS.onPrimary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Check size={11} color={PROFILE_THEME_COLORS.primary} strokeWidth={SW} />
        </View>
      ) : null}
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 19,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: active ? withAlpha(PROFILE_THEME_COLORS.onPrimary, 0.2) : PROFILE_THEME_COLORS.surfaceContainerHighest,
        }}
      >
        <Icon size={18} color={active ? PROFILE_THEME_COLORS.onPrimary : PROFILE_THEME_COLORS.onSurfaceVariant} strokeWidth={SW} />
      </View>

      <Text
        style={{
          textAlign: 'center',
          fontSize: 13,
          lineHeight: 18,
          fontFamily: SCREEN_FONTS.bold,
          color: active ? PROFILE_THEME_COLORS.onPrimary : PROFILE_THEME_COLORS.onSurface,
        }}
      >
        {option.label}
      </Text>
      <Text
        style={{
          textAlign: 'center',
          fontSize: 11,
          lineHeight: 15,
          fontFamily: SCREEN_FONTS.body,
          color: active ? withAlpha(PROFILE_THEME_COLORS.onPrimary, 0.75) : PROFILE_THEME_COLORS.onSurfaceVariant,
        }}
      >
        {option.subtitle}
      </Text>
    </TouchableOpacity>
  )
}

function TagChip({
  tag,
  active,
  disabled,
  onPress,
}: {
  tag: TagOption
  active: boolean
  disabled: boolean
  onPress: () => void
}) {
  const Icon = tag.icon
  const isPositive = tag.tone === 'positive'
  const bg = active
    ? isPositive
      ? PROFILE_THEME_COLORS.primary
      : PROFILE_THEME_COLORS.error
    : PROFILE_THEME_COLORS.surfaceContainerHigh
  const border = active
    ? isPositive
      ? PROFILE_THEME_COLORS.primary
      : PROFILE_THEME_COLORS.error
    : PROFILE_THEME_COLORS.outlineVariant
  const iconBg = active
    ? withAlpha(isPositive ? PROFILE_THEME_COLORS.onPrimary : PROFILE_THEME_COLORS.onError, 0.2)
    : PROFILE_THEME_COLORS.surfaceContainerHighest
  const iconColor = active
    ? isPositive ? PROFILE_THEME_COLORS.onPrimary : PROFILE_THEME_COLORS.onError
    : PROFILE_THEME_COLORS.onSurfaceVariant
  const textColor = active
    ? isPositive ? PROFILE_THEME_COLORS.onPrimary : PROFILE_THEME_COLORS.onError
    : PROFILE_THEME_COLORS.onSurface

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={active ? 0.9 : 0.75}
      style={{
        flex: 1,
        minHeight: 80,
        borderRadius: RADIUS.lg,
        borderWidth: active ? 2 : 1.5,
        borderColor: border,
        backgroundColor: bg,
        paddingHorizontal: 6,
        paddingVertical: 10,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        opacity: disabled ? 0.36 : 1,
        shadowColor: active ? border : 'transparent',
        shadowOpacity: active ? 0.22 : 0,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 10,
        elevation: active ? 3 : 0,
      }}
    >
      {active ? (
        <View
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            width: 14,
            height: 14,
            borderRadius: RADIUS.full,
            backgroundColor: isPositive ? PROFILE_THEME_COLORS.onPrimary : PROFILE_THEME_COLORS.onError,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Check size={9} color={isPositive ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.error} strokeWidth={SW} />
        </View>
      ) : null}
      <View
        style={{
          width: 30,
          height: 30,
          borderRadius: 15,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: iconBg,
        }}
      >
        <Icon size={15} color={iconColor} strokeWidth={SW} />
      </View>
      <Text
        style={{
          textAlign: 'center',
          fontSize: 11,
          lineHeight: 14,
          fontFamily: SCREEN_FONTS.bold,
          color: textColor,
        }}
      >
        {tag.label}
      </Text>
    </TouchableOpacity>
  )
}

export default function RateSessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [myId, setMyId] = useState<string | null>(null)
  const [players, setPlayers] = useState<PlayerInSession[]>([])
  const [ratings, setRatings] = useState<Record<string, RatingEntry>>({})
  const [currentIndex, setCurrentIndex] = useState(0)
  const [completedCount, setCompletedCount] = useState(0)
  const [alreadyRated, setAlreadyRated] = useState(false)
  const [dialogConfig, setDialogConfig] = useState<AppDialogConfig | null>(null)

  const currentPlayer = players[currentIndex] ?? null
  const currentEntry = currentPlayer ? (ratings[currentPlayer.player_id] ?? createDefaultEntry()) : createDefaultEntry()

  const init = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.replace('/login' as any)
      return
    }
    setMyId(user.id)

    const { data: session, error: sessionError } = await supabase
      .from('sessions')
      .select(
        `
        id, status, results_status, host_id,
        session_players (
          player_id,
          player:player_id ( name, self_assessed_level, skill_label )
        )
      `,
      )
      .eq('id', id)
      .single()

    if (sessionError || !session) {
      setLoading(false)
      setDialogConfig({
        title: 'Không tải được kèo',
        message: sessionError?.message ?? 'Vui lòng thử lại sau ít phút.',
        actions: [{ label: 'Đã hiểu' }],
      })
      return
    }

    if (session.status !== 'done') {
      setDialogConfig({
        title: 'Kèo chưa kết thúc',
        message: 'Chỉ có thể đánh giá sau khi buổi chơi đã hoàn tất.',
        actions: [{ label: 'Quay lại', onPress: () => router.back() }],
      })
      return
    }

    if (session.results_status !== 'finalized') {
      setLoading(false)
      setDialogConfig({
        title: 'Kết quả trận chưa được chốt',
        message: 'Bạn chỉ có thể đánh giá sau khi kết quả trận đã được xác nhận xong.',
        actions: [{ label: 'Quay lại', onPress: () => router.back() }],
      })
      return
    }

    const typedSession = session as unknown as SessionRecord

    const { data: existingRatings } = await supabase
      .from('ratings')
      .select('rated_id')
      .eq('session_id', id)
      .eq('rater_id', user.id)

    const ratedIds = new Set((existingRatings ?? []).map((item: any) => item.rated_id))
    const unratedPlayers = typedSession.session_players
      .filter((item) => item.player_id !== user.id)
      .filter((item) => !ratedIds.has(item.player_id))
      .map((item) => ({
        player_id: item.player_id,
        name: item.player?.name?.trim() || 'Người chơi',
        is_host: item.player_id === typedSession.host_id,
        self_assessed_level: item.player?.self_assessed_level ?? null,
        skill_label: item.player?.skill_label ?? null,
      }))

    if ((existingRatings?.length ?? 0) > 0 && unratedPlayers.length === 0) {
      setAlreadyRated(true)
      setLoading(false)
      return
    }

    setPlayers(unratedPlayers)
    const initialRatings: Record<string, RatingEntry> = {}
    unratedPlayers.forEach((player) => {
      initialRatings[player.player_id] = createDefaultEntry()
    })
    setRatings(initialRatings)
    setLoading(false)
  }, [id])

  useEffect(() => {
    void init()
  }, [init])

  function toggleTag(playerId: string, tag: string) {
    animateSelection()
    setRatings((prev) => {
      const current = prev[playerId] ?? createDefaultEntry()
      const nextTags = current.tags.includes(tag) ? current.tags.filter((item) => item !== tag) : [...current.tags, tag]
      return { ...prev, [playerId]: { ...current, tags: nextTags } }
    })
  }

  function toggleNoShow(playerId: string) {
    animateSelection()
    setRatings((prev) => {
      const current = prev[playerId] ?? createDefaultEntry()
      const nextNoShow = !current.no_show
      return {
        ...prev,
        [playerId]: {
          ...current,
          no_show: nextNoShow,
          tags: nextNoShow ? [] : current.tags,
          skill_validation: nextNoShow ? 'matched' : current.skill_validation,
        },
      }
    })
  }

  function setSkillValidation(playerId: string, value: SkillValidation) {
    animateSelection()
    setRatings((prev) => ({
      ...prev,
      [playerId]: {
        ...(prev[playerId] ?? createDefaultEntry()),
        skill_validation: value,
      },
    }))
  }

  async function submit(entryOverride?: RatingEntry) {
    if (!myId || !id || !currentPlayer) return

    setSaving(true)
    const entry = entryOverride ?? ratings[currentPlayer.player_id] ?? createDefaultEntry()

    const { error: ratingError } = await supabase.rpc('submit_rating', {
      p_session_id: id,
      p_rated_id: currentPlayer.player_id,
      p_tags: entry.no_show ? [] : entry.tags,
      p_no_show: entry.no_show,
      p_skill_validation: entry.no_show ? 'matched' : entry.skill_validation,
    })

    if (ratingError) {
      setSaving(false)
      setDialogConfig({
        title: 'Không gửi được đánh giá',
        message: ratingError.message,
        actions: [{ label: 'Đã hiểu' }],
      })
      return
    }

    const { error: processError } = await supabase.rpc('process_final_ratings', { p_session_id: id })
    if (processError) {
      setSaving(false)
      setDialogConfig({
        title: 'Đánh giá đã lưu nhưng chưa xử lý xong',
        message: processError.message,
        actions: [{ label: 'Đã hiểu' }],
      })
      return
    }

    const nextCompleted = completedCount + 1
    const hasNext = currentIndex < players.length - 1
    if (hasNext) {
      setCompletedCount(nextCompleted)
      setCurrentIndex((prev) => prev + 1)
      setSaving(false)
      return
    }

    setSaving(false)
    setDialogConfig({
      title: 'Đã gửi đánh giá',
      message: 'Đánh giá của bạn đang ở chế độ ẩn danh và sẽ chỉ hiển thị sau 24 giờ hoặc khi cả hai bên hoàn thành.',
      actions: [{ label: 'Về trang chủ', onPress: () => router.replace('/(tabs)' as any) }],
    })
  }

  function handleSkip() {
    if (saving) return
    void submit(createDefaultEntry())
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={PROFILE_THEME_COLORS.primary} />
      </View>
    )
  }

  if (alreadyRated || !currentPlayer) {
    return (
      <View style={{ flex: 1, backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow, paddingTop: insets.top }}>
        <View style={{ flex: 1, paddingHorizontal: SPACING.xl, paddingTop: 24 }}>
          <EmptyState
            icon={<CheckCheck size={28} color={PROFILE_THEME_COLORS.primary} strokeWidth={SW} />}
            title={alreadyRated ? 'Bạn đã đánh giá rồi' : 'Đã hoàn tất đánh giá'}
            description={
              alreadyRated
                ? 'Phản hồi của bạn đã được ghi nhận và sẽ mở khi đủ điều kiện double-blind.'
                : 'Bạn đã gửi xong tất cả đánh giá cho kèo này.'
            }
          />
          <View style={{ paddingTop: 24 }}>
            <AppButton label="Về trang chủ" onPress={() => router.replace('/(tabs)' as any)} variant="primary" />
          </View>
        </View>
        <AppDialog visible={Boolean(dialogConfig)} config={dialogConfig} onClose={() => setDialogConfig(null)} />
      </View>
    )
  }

  const skillLabel = getShortSkillLabel(getSkillLevelFromPlayer(currentPlayer))

  return (
    <View style={{ flex: 1, backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow, paddingTop: insets.top }}>
      <View style={{ flex: 1 }}>
        {/* Header */}
        <View style={{ marginHorizontal: 20, marginTop: 12, marginBottom: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ width: 40, height: 40, borderRadius: RADIUS.full, backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest, alignItems: 'center', justifyContent: 'center', borderWidth: BORDER.base, borderColor: PROFILE_THEME_COLORS.outlineVariant }}
          >
            <ArrowLeft size={20} color={PROFILE_THEME_COLORS.primary} />
          </TouchableOpacity>
          <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: RADIUS.full, backgroundColor: withAlpha(PROFILE_THEME_COLORS.primary, 0.1) }}>
            <Text style={{ fontFamily: SCREEN_FONTS.bold, fontSize: 12, color: PROFILE_THEME_COLORS.primary, textTransform: 'uppercase' }}>
              Đánh giá trận
            </Text>
          </View>
          <StepProgress total={players.length} current={currentIndex} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 40 }}
        >
          <View
            style={{
              borderRadius: RADIUS.xl,
              borderWidth: BORDER.base,
              borderColor: PROFILE_THEME_COLORS.outlineVariant,
              backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest,
              paddingHorizontal: SPACING.xl,
              paddingVertical: 16,
              marginBottom: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 16,
            }}
          >
            {/* Avatar */}
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: RADIUS.full,
                borderWidth: BORDER.base,
                borderColor: PROFILE_THEME_COLORS.primaryFixed,
                backgroundColor: PROFILE_THEME_COLORS.secondaryContainer,
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Text style={{ fontSize: 22, fontFamily: SCREEN_FONTS.bold, color: PROFILE_THEME_COLORS.primary }}>
                {getAvatarLetter(currentPlayer.name)}
              </Text>
            </View>

            {/* Info */}
            <View style={{ flex: 1 }}>
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 18,
                  fontFamily: SCREEN_FONTS.bold,
                  color: PROFILE_THEME_COLORS.onSurface,
                }}
              >
                {currentPlayer.name}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 }}>
                {currentPlayer.is_host ? (
                  <View
                    style={{
                      borderRadius: RADIUS.full,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      backgroundColor: PROFILE_THEME_COLORS.surfaceContainerHigh,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontFamily: SCREEN_FONTS.bold,
                        letterSpacing: 1.2,
                        color: PROFILE_THEME_COLORS.outline,
                        textTransform: 'uppercase',
                      }}
                    >
                      Host
                    </Text>
                  </View>
                ) : null}
                <View
                  style={{
                    borderRadius: RADIUS.full,
                    borderWidth: BORDER.base,
                    borderColor: PROFILE_THEME_COLORS.primaryFixedDim,
                    backgroundColor: PROFILE_THEME_COLORS.secondaryContainer,
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                  }}
                >
                  <Text style={{ fontSize: 11, fontFamily: SCREEN_FONTS.bold, color: PROFILE_THEME_COLORS.primary }}>{skillLabel}</Text>
                </View>
              </View>
            </View>
          </View>

          <View
            style={{
              borderRadius: RADIUS.xl,
              borderWidth: BORDER.base,
              borderColor: PROFILE_THEME_COLORS.outlineVariant,
              backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest,
              paddingHorizontal: SPACING.xl,
              paddingVertical: SPACING.xl,
              marginBottom: 14,
            }}
          >
            <SectionLabel title="Trình độ thi đấu" subtitle="Bạn thấy họ chơi thế nào?" />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {SKILL_OPTIONS.map((option) => (
                <SkillChip
                  key={option.value}
                  option={option}
                  active={currentEntry.skill_validation === option.value}
                  disabled={currentEntry.no_show}
                  onPress={() => setSkillValidation(currentPlayer.player_id, option.value)}
                />
              ))}
            </View>
          </View>

          <View
            style={{
              borderRadius: RADIUS.xl,
              borderWidth: BORDER.base,
              borderColor: PROFILE_THEME_COLORS.outlineVariant,
              backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest,
              paddingHorizontal: SPACING.xl,
              paddingVertical: SPACING.xl,
              marginBottom: 14,
            }}
          >
            <SectionLabel title="Đánh giá chi tiết" subtitle="Chọn những điều bạn muốn nói" />

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Heart size={14} color={PROFILE_THEME_COLORS.primary} strokeWidth={SW} />
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: SCREEN_FONTS.cta,
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                  color: PROFILE_THEME_COLORS.onSurfaceVariant,
                }}
              >
                Lời khen
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              {POSITIVE_TAGS.map((tag) => (
                <TagChip
                  key={tag.value}
                  tag={tag}
                  active={currentEntry.tags.includes(tag.value)}
                  disabled={currentEntry.no_show}
                  onPress={() => toggleTag(currentPlayer.player_id, tag.value)}
                />
              ))}
            </View>

            <View style={{ height: 1, backgroundColor: PROFILE_THEME_COLORS.outlineVariant, marginBottom: 16 }} />

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <ShieldAlert size={14} color={PROFILE_THEME_COLORS.error} strokeWidth={SW} />
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: SCREEN_FONTS.cta,
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                  color: PROFILE_THEME_COLORS.onSurfaceVariant,
                }}
              >
                Cảnh báo
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {WARNING_TAGS.map((tag) => (
                <TagChip
                  key={tag.value}
                  tag={tag}
                  active={currentEntry.tags.includes(tag.value)}
                  disabled={currentEntry.no_show}
                  onPress={() => toggleTag(currentPlayer.player_id, tag.value)}
                />
              ))}
            </View>
          </View>

          <View
            style={{
              borderRadius: RADIUS.xl,
              borderWidth: BORDER.medium,
              borderColor: currentEntry.no_show ? PROFILE_THEME_COLORS.error : PROFILE_THEME_COLORS.outlineVariant,
              backgroundColor: currentEntry.no_show ? PROFILE_THEME_COLORS.errorContainer : PROFILE_THEME_COLORS.surfaceContainerLowest,
              overflow: 'hidden',
            }}
          >
            <TouchableOpacity
              onPress={() => toggleNoShow(currentPlayer.player_id)}
              activeOpacity={0.8}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingHorizontal: SPACING.xl,
                paddingVertical: 16,
              }}
            >
              <View
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: BORDER.base,
                  borderColor: currentEntry.no_show ? PROFILE_THEME_COLORS.error : PROFILE_THEME_COLORS.outlineVariant,
                  backgroundColor: currentEntry.no_show ? PROFILE_THEME_COLORS.error : PROFILE_THEME_COLORS.surfaceContainerLow,
                }}
              >
                <UserX size={20} color={currentEntry.no_show ? PROFILE_THEME_COLORS.onError : PROFILE_THEME_COLORS.error} strokeWidth={SW} />
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 15,
                    lineHeight: 20,
                    fontFamily: SCREEN_FONTS.bold,
                    color: currentEntry.no_show ? PROFILE_THEME_COLORS.onErrorContainer : PROFILE_THEME_COLORS.onSurface,
                  }}
                >
                  {currentEntry.no_show ? 'Đã báo no-show' : 'Báo no-show'}
                </Text>
                <Text
                  style={{
                    marginTop: 3,
                    fontSize: 12,
                    lineHeight: 18,
                    fontFamily: SCREEN_FONTS.body,
                    color: currentEntry.no_show ? PROFILE_THEME_COLORS.onErrorContainer : PROFILE_THEME_COLORS.onSurfaceVariant,
                  }}
                >
                  {currentEntry.no_show
                    ? 'Đánh giá trình độ và tag khác đã khóa cho người chơi này.'
                    : 'Bật khi người chơi không xuất hiện trong buổi chơi.'}
                </Text>
              </View>
            </TouchableOpacity>

            <View
              style={{
                marginHorizontal: 16,
                marginBottom: 16,
                borderRadius: RADIUS.lg,
                backgroundColor: currentEntry.no_show ? withAlpha(PROFILE_THEME_COLORS.onBackground, 0.04) : PROFILE_THEME_COLORS.surfaceContainerLow,
                paddingHorizontal: 12,
                paddingVertical: SPACING.sm,
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: 9,
              }}
            >
              <ShieldCheck size={16} color={PROFILE_THEME_COLORS.primary} strokeWidth={SW} style={{ marginTop: 1 }} />
              <Text
                style={{
                  flex: 1,
                  fontSize: 12,
                  lineHeight: 18,
                  fontFamily: SCREEN_FONTS.body,
                  color: PROFILE_THEME_COLORS.onSurfaceVariant,
                }}
              >
                Đánh giá ẩn danh: chỉ hiển thị sau 24 giờ hoặc khi cả hai bên hoàn thành đánh giá.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Fixed footer */}
      <View
        style={{
          borderTopWidth: BORDER.base,
          borderTopColor: PROFILE_THEME_COLORS.outlineVariant,
          backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow,
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: Math.max(insets.bottom, 12),
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <AppButton label="Bỏ qua" onPress={handleSkip} disabled={saving} variant="secondary" />
          </View>
          <View style={{ flex: 2 }}>
            <AppButton
              label={players.length > 1 && currentIndex < players.length - 1 ? 'Tiếp theo' : 'Gửi đánh giá'}
              onPress={() => void submit()}
              loading={saving}
              variant="primary"
            />
          </View>
        </View>
      </View>

      <AppDialog visible={Boolean(dialogConfig)} config={dialogConfig} onClose={() => setDialogConfig(null)} />
    </View>
  )
}
