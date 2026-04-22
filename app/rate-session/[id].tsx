import { AppButton, AppDialog, type AppDialogConfig, EmptyState, ScreenHeader } from '@/components/design'
import { getShortSkillLabel, getSkillLevelFromPlayer } from '@/lib/skillAssessment'
import { supabase } from '@/lib/supabase'
import { router, useLocalSearchParams } from 'expo-router'
import type { LucideIcon } from 'lucide-react-native'
import {
  AlertOctagon,
  ArrowDown,
  Check,
  CheckCheck,
  Clock,
  Heart,
  Hourglass,
  MessageCircle,
  ShieldAlert,
  ShieldCheck,
  Trophy,
  Zap,
} from 'lucide-react-native'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, LayoutAnimation, Platform, Pressable, ScrollView, Text, UIManager, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

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
  icon: LucideIcon
}

type TagOption = {
  value: string
  label: string
  icon: LucideIcon
  tone: 'positive' | 'warning'
}

const ICON_STROKE_WIDTH = 2.5
const C = {
  pageBg: '#F2F5F3',
  cardBg: '#EDF1EF',
  cardBorder: '#E4EBE7',
  white: '#FFFFFF',
  primary: '#045840',
  primarySoft: '#EAF5F1',
  primaryBorder: '#C7DCD4',
  neutralBorder: '#DCE6E1',
  textStrong: '#123E32',
  textMuted: '#6A847B',
  dangerSoft: '#FFF1F2',
  dangerBorder: '#FBCED8',
  dangerText: '#B42342',
}

const SKILL_OPTIONS: SkillOption[] = [
  { value: 'weaker', label: 'Cần cố gắng', icon: ArrowDown },
  { value: 'matched', label: 'Đúng trình', icon: Check },
  { value: 'outclass', label: 'Out trình', icon: Trophy },
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

function chipColors(active: boolean, tone: TagOption['tone']) {
  if (tone === 'positive') {
    if (!active) return { border: '#CFE0D9', bg: '#FFFFFF', text: '#1B5A49', icon: '#0A5A45', shadow: '#003D2F' }
    return { border: '#064E3B', bg: '#064E3B', text: '#FFFFFF', icon: '#FFFFFF', shadow: '#003D2F' }
  }
  if (!active) return { border: '#F0C8D4', bg: '#FFFFFF', text: '#9F1239', icon: '#BE123C', shadow: '#4A0E1F' }
  return { border: '#B42342', bg: '#B42342', text: '#FFFFFF', icon: '#FFFFFF', shadow: '#4A0E1F' }
}

function SectionHeader({ index, title, color }: { index: string; title: string; color: string }) {
  return (
    <View style={{ marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <View
        style={{
          borderRadius: 999,
          borderWidth: 1,
          borderColor: color,
          backgroundColor: '#FFFFFFCC',
          paddingHorizontal: 10,
          paddingVertical: 5,
        }}
      >
        <Text style={{ fontSize: 10, fontFamily: 'PlusJakartaSans-ExtraBold', color }}>{index}</Text>
      </View>
      <Text style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.6, fontFamily: 'PlusJakartaSans-ExtraBold', color }}>
        {title}
      </Text>
      <View style={{ height: 1, flex: 1, backgroundColor: '#D7E2DD' }} />
    </View>
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
      <SafeAreaView style={{ flex: 1, backgroundColor: C.pageBg, alignItems: 'center', justifyContent: 'center' }} edges={['top']}>
        <ActivityIndicator size="large" color="#059669" />
      </SafeAreaView>
    )
  }

  if (alreadyRated || !currentPlayer) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.pageBg }} edges={['top']}>
        <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 24 }}>
          <EmptyState
            icon={<CheckCheck size={28} color="#059669" strokeWidth={ICON_STROKE_WIDTH} />}
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
      </SafeAreaView>
    )
  }

  const skillLabel = getShortSkillLabel(getSkillLevelFromPlayer(currentPlayer))

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.pageBg }} edges={['top']}>
      <View style={{ flex: 1 }}>
        <ScreenHeader
          variant="brand"
          title="KINETIC"
          onBackPress={() => router.back()}
          rightSlot={
            <View style={{ borderRadius: 999, backgroundColor: '#FFFFFFCC', paddingHorizontal: 12, paddingVertical: 6 }}>
              <Text style={{ fontSize: 11, fontFamily: 'PlusJakartaSans-ExtraBold', textTransform: 'uppercase', letterSpacing: 1.6, color: '#6B7280' }}>
                {completedCount + 1}/{players.length}
              </Text>
            </View>
          }
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 148 + insets.bottom, paddingHorizontal: 20 }}
        >
          <View
            style={{
              borderRadius: 30,
              borderWidth: 1,
              borderColor: C.primaryBorder,
              backgroundColor: '#EAF5F1',
              paddingHorizontal: 18,
              paddingVertical: 18,
              marginBottom: 14,
            }}
          >
            <SectionHeader index="01" title="Người được đánh giá" color="#0A5A45" />
            <View style={{ alignItems: 'center', paddingTop: 4 }}>
              <View style={{ position: 'relative' }}>
                <View
                  style={{
                    width: 118,
                    height: 118,
                    borderRadius: 999,
                    overflow: 'hidden',
                    borderWidth: 4,
                    borderColor: '#B0F0D6',
                  }}
                >
                  <View style={{ flex: 1, backgroundColor: '#CFE8DC', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ color: '#003527', fontSize: 44, fontFamily: 'PlusJakartaSans-Bold' }}>{getAvatarLetter(currentPlayer.name)}</Text>
                  </View>
                </View>
                <View
                  style={{
                    position: 'absolute',
                    right: -4,
                    bottom: -4,
                    width: 32,
                    height: 32,
                    borderRadius: 999,
                    borderWidth: 2,
                    borderColor: C.pageBg,
                    backgroundColor: '#A3E635',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Check size={16} color="#14532D" strokeWidth={ICON_STROKE_WIDTH} />
                </View>
              </View>

              <Text style={{ marginTop: 14, textAlign: 'center', fontSize: 26, fontFamily: 'PlusJakartaSans-ExtraBold', color: C.textStrong }}>
                {currentPlayer.name}
              </Text>

              <View
                style={{
                  marginTop: 10,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: C.primaryBorder,
                  backgroundColor: C.primarySoft,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                }}
              >
                <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans-Bold', color: '#0A5A45' }}>{skillLabel}</Text>
              </View>
            </View>
          </View>

          <View style={{ borderRadius: 30, borderWidth: 1, borderColor: C.cardBorder, backgroundColor: C.cardBg, paddingHorizontal: 20, paddingVertical: 20, marginBottom: 14 }}>
            <SectionHeader index="02" title="Trình độ thi đấu" color={C.textStrong} />
            <Text style={{ marginTop: 2, marginBottom: 10, fontSize: 20, fontFamily: 'PlusJakartaSans-ExtraBold', color: C.textStrong }}>
              Bạn thấy bạn ấy thế nào?
            </Text>

            <View style={{ marginTop: 12, flexDirection: 'row', gap: 8 }}>
              {SKILL_OPTIONS.map((option) => {
                const active = currentEntry.skill_validation === option.value
                const Icon = option.icon
                return (
                  <Pressable
                    key={option.value}
                    disabled={currentEntry.no_show}
                    onPress={() => setSkillValidation(currentPlayer.player_id, option.value)}
                    style={({ pressed }) => ({
                      flex: 1,
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: active ? C.primary : C.neutralBorder,
                      backgroundColor: active ? C.primary : C.white,
                      paddingHorizontal: 10,
                      paddingVertical: 12,
                      opacity: currentEntry.no_show ? 0.42 : pressed ? 0.86 : 1,
                    })}
                  >
                    <View style={{ alignItems: 'center' }}>
                      <Icon size={17} color={active ? '#FFFFFF' : '#22C55E'} strokeWidth={ICON_STROKE_WIDTH} />
                      <Text
                        style={{
                          marginTop: 8,
                          textAlign: 'center',
                          fontSize: 12,
                          lineHeight: 16,
                          fontFamily: 'PlusJakartaSans-Bold',
                          color: active ? '#FFFFFF' : '#64748B',
                        }}
                      >
                        {option.label}
                      </Text>
                    </View>
                  </Pressable>
                )
              })}
            </View>
          </View>

          <View style={{ borderRadius: 30, borderWidth: 1, borderColor: C.cardBorder, backgroundColor: C.cardBg, paddingHorizontal: 20, paddingVertical: 20, marginBottom: 14 }}>
            <SectionHeader index="03" title="Đánh giá chi tiết" color={C.textStrong} />

            <View style={{ marginTop: 4, borderRadius: 22, paddingHorizontal: 14, paddingVertical: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Heart size={16} color="#059669" strokeWidth={ICON_STROKE_WIDTH} />
                <Text style={{ marginLeft: 8, fontSize: 10, fontFamily: 'PlusJakartaSans-ExtraBold', textTransform: 'uppercase', letterSpacing: 1.6, color: C.textMuted }}>
                  Lời khen dành cho người chơi
                </Text>
              </View>
              <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                {POSITIVE_TAGS.map((tag) => {
                  const active = currentEntry.tags.includes(tag.value)
                  const Icon = tag.icon
                  const colors = chipColors(active, tag.tone)
                  return (
                    <Pressable
                      key={tag.value}
                      disabled={currentEntry.no_show}
                      onPress={() => toggleTag(currentPlayer.player_id, tag.value)}
                      style={({ pressed }) => ({
                        width: '48.5%',
                        minHeight: 92,
                        borderRadius: 18,
                        borderWidth: active ? 2 : 1.5,
                        borderColor: colors.border,
                        backgroundColor: active ? '#064E3B' : '#FFFFFF',
                        paddingVertical: 14,
                        paddingHorizontal: 10,
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        overflow: 'hidden',
                        marginBottom: 10,
                        shadowColor: colors.shadow,
                        shadowOpacity: active ? 0.18 : 0.06,
                        shadowOffset: { width: 0, height: 2 },
                        shadowRadius: active ? 8 : 4,
                        elevation: active ? 4 : 2,
                        opacity: currentEntry.no_show ? 0.42 : pressed ? 0.86 : 1,
                      })}
                    >
                      <Icon size={22} color={colors.icon} strokeWidth={ICON_STROKE_WIDTH} />
                      <Text style={{ textAlign: 'center', fontSize: 13, lineHeight: 18, fontFamily: 'PlusJakartaSans-Bold', color: colors.text }}>
                        {tag.label}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            </View>

            <View style={{ marginTop: 12, borderRadius: 22, borderWidth: 1, borderColor: '#F2CDD7', paddingHorizontal: 14, paddingVertical: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <ShieldAlert size={16} color="#F43F5E" strokeWidth={ICON_STROKE_WIDTH} />
                <Text style={{ marginLeft: 8, fontSize: 10, fontFamily: 'PlusJakartaSans-ExtraBold', textTransform: 'uppercase', letterSpacing: 1.6, color: C.textMuted }}>
                  Cảnh báo (chỉ chọn nếu thực sự gặp)
                </Text>
              </View>
              <View style={{ marginTop: 12, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                {WARNING_TAGS.map((tag) => {
                  const active = currentEntry.tags.includes(tag.value)
                  const Icon = tag.icon
                  const colors = chipColors(active, tag.tone)
                  return (
                    <Pressable
                      key={tag.value}
                      disabled={currentEntry.no_show}
                      onPress={() => toggleTag(currentPlayer.player_id, tag.value)}
                      style={({ pressed }) => ({
                        width: '48.5%',
                        minHeight: 92,
                        borderRadius: 18,
                        borderWidth: active ? 2 : 1.5,
                        borderColor: colors.border,
                        backgroundColor: active ? '#B42342' : '#FFFFFF',
                        paddingVertical: 14,
                        paddingHorizontal: 10,
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        overflow: 'hidden',
                        marginBottom: 10,
                        shadowColor: colors.shadow,
                        shadowOpacity: active ? 0.18 : 0.08,
                        shadowOffset: { width: 0, height: 2 },
                        shadowRadius: active ? 8 : 4,
                        elevation: active ? 4 : 2,
                        opacity: currentEntry.no_show ? 0.42 : pressed ? 0.86 : 1,
                      })}
                    >
                      <Icon size={22} color={colors.icon} strokeWidth={ICON_STROKE_WIDTH} />
                      <Text style={{ textAlign: 'center', fontSize: 13, lineHeight: 18, fontFamily: 'PlusJakartaSans-Bold', color: colors.text }}>
                        {tag.label}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            </View>
          </View>

          <View style={{ borderRadius: 30, borderWidth: 1, borderColor: C.cardBorder, backgroundColor: C.cardBg, paddingHorizontal: 20, paddingVertical: 20 }}>
            <SectionHeader index="04" title="Báo cáo no-show" color={C.dangerText} />
            <Pressable
              onPress={() => toggleNoShow(currentPlayer.player_id)}
              style={{
                marginTop: 4,
                borderRadius: 22,
                borderWidth: 1,
                borderColor: currentEntry.no_show ? C.dangerText : C.dangerBorder,
                backgroundColor: currentEntry.no_show ? C.dangerText : C.dangerSoft,
                paddingHorizontal: 16,
                paddingVertical: 14,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldAlert size={17} color={currentEntry.no_show ? '#FFFFFF' : '#E11D48'} strokeWidth={ICON_STROKE_WIDTH} />
              <Text style={{ marginLeft: 8, fontSize: 14, fontFamily: 'PlusJakartaSans-ExtraBold', color: currentEntry.no_show ? '#FFFFFF' : '#E11D48' }}>
                {currentEntry.no_show ? 'Đã báo no-show' : 'Báo no-show'}
              </Text>
            </Pressable>

            {currentEntry.no_show ? (
              <View style={{ marginTop: 12, borderRadius: 22, borderWidth: 1, borderColor: C.dangerBorder, backgroundColor: C.dangerSoft, paddingHorizontal: 14, paddingVertical: 12 }}>
                <Text style={{ fontSize: 14, lineHeight: 22, fontFamily: 'PlusJakartaSans-Regular', color: '#BE123C' }}>
                  Người chơi này sẽ bị ghi nhận no-show. Các đánh giá trình độ và tag khác đã được khóa.
                </Text>
              </View>
            ) : null}

            <View style={{ marginTop: 12, borderRadius: 24, borderWidth: 1, borderColor: C.primaryBorder, backgroundColor: C.primarySoft, paddingHorizontal: 14, paddingVertical: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <View style={{ marginTop: 2 }}>
                  <ShieldCheck size={18} color={C.primary} strokeWidth={ICON_STROKE_WIDTH} />
                </View>
                <View style={{ marginLeft: 10, flex: 1 }}>
                  <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans-ExtraBold', color: '#0F172A' }}>Đánh giá ẩn danh</Text>
                  <Text style={{ marginTop: 4, fontSize: 13, lineHeight: 20, fontFamily: 'PlusJakartaSans-Regular', color: '#475569' }}>
                    Phản hồi của bạn sẽ chỉ hiển thị sau 24 giờ hoặc khi cả hai bên hoàn thành đánh giá.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={{ borderTopWidth: 1, borderTopColor: '#E2E8F0', backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingTop: 10, paddingBottom: Math.max(insets.bottom, 10) }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <AppButton label="Bỏ qua" onPress={handleSkip} disabled={saving} variant="secondary" />
            </View>
            <View style={{ flex: 1 }}>
              <AppButton label={saving ? 'Đang gửi' : 'Gửi đánh giá'} onPress={() => void submit()} loading={saving} variant="primary" />
            </View>
          </View>
        </View>
      </View>

      <AppDialog visible={Boolean(dialogConfig)} config={dialogConfig} onClose={() => setDialogConfig(null)} />
    </SafeAreaView>
  )
}
