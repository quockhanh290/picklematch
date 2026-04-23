import { AppButton, AppDialog, type AppDialogConfig, EmptyState, ScreenHeader } from '@/components/design'
import { PROFILE_THEME_COLORS } from '@/components/profile/profileTheme'
import { getShortSkillLabel, getSkillLevelFromPlayer } from '@/lib/skillAssessment'
import { supabase } from '@/lib/supabase'
import { router, useLocalSearchParams } from 'expo-router'
import type { LucideIcon } from 'lucide-react-native'
import {
  AlertOctagon,
  ArrowDown,
  ArrowRight,
  Check,
  CheckCheck,
  Clock,
  Heart,
  Hourglass,
  MessageCircle,
  ShieldAlert,
  Trophy,
  UserX,
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

const SW = 2.5

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
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        flex: 1,
        minHeight: 118,
        borderRadius: 18,
        borderWidth: active ? 2 : 1.2,
        borderColor: active ? '#93DEC7' : '#E3E9E6',
        backgroundColor: active ? '#064E3B' : '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: 21,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: active ? '#0A6A52' : '#F0F4F2',
        }}
      >
        <Icon size={18} color={active ? '#DEFBF0' : '#7F8A85'} strokeWidth={SW} />
      </View>
      <Text
        style={{
          textAlign: 'center',
          fontSize: 13,
          lineHeight: 19,
          fontFamily: 'PlusJakartaSans-ExtraBold',
          color: active ? '#E8FFF7' : '#5C6964',
        }}
      >
        {option.label}
      </Text>
    </Pressable>
  )
}

function TagPill({
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
  let backgroundColor = '#E3F5EE'
  let textColor = '#1F6B58'

  if (tag.tone === 'warning') {
    backgroundColor = '#FAF1F1'
    textColor = '#CC4C4C'
  }

  if (active && tag.tone === 'positive') {
    backgroundColor = '#C8F2E3'
    textColor = '#0F5E4A'
  }

  if (active && tag.tone === 'warning') {
    backgroundColor = '#FFDAD6'
    textColor = '#A23636'
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        borderRadius: 999,
        borderWidth: active ? 1 : 0,
        borderColor: active ? (tag.tone === 'positive' ? '#9FE5CF' : '#F3B3B3') : 'transparent',
        paddingHorizontal: 14,
        paddingVertical: 7,
        backgroundColor,
        opacity: disabled ? 0.45 : 1,
      }}
    >
      <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans-Bold', color: textColor }}>{tag.label}</Text>
      {active ? <Text style={{ marginLeft: 6, fontSize: 14, color: textColor, fontFamily: 'PlusJakartaSans-Bold' }}>×</Text> : null}
    </Pressable>
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
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F1F3F2', alignItems: 'center', justifyContent: 'center' }} edges={['top']}>
        <ActivityIndicator size="large" color="#0B5B47" />
      </SafeAreaView>
    )
  }

  if (alreadyRated || !currentPlayer) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: PROFILE_THEME_COLORS.background }} edges={['top']}>
        <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 24 }}>
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
      </SafeAreaView>
    )
  }

  const skillLabel = getShortSkillLabel(getSkillLevelFromPlayer(currentPlayer))
  const progressCurrent = Math.min(currentIndex + 1, players.length)
  const progressPercent = players.length ? Math.round((progressCurrent / players.length) * 100) : 0

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F6F8F7' }} edges={['top']}>
      <View style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 114 + insets.bottom }}
        >
          <View style={{ marginBottom: 10 }}>
            <ScreenHeader
              compact
              title="Đánh giá trận"
              onBackPress={() => router.back()}
              rightSlot={
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: '#A8E6D2',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ fontSize: 15, fontFamily: 'PlusJakartaSans-ExtraBold', color: '#0D5A47' }}>{getAvatarLetter(currentPlayer.name)}</Text>
                </View>
              }
            />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ flex: 1, fontSize: 14, fontFamily: 'PlusJakartaSans-Bold', color: '#5B6661' }}>
              Đánh giá người chơi {progressCurrent}/{players.length}
            </Text>
            <Text style={{ fontSize: 16, fontFamily: 'PlusJakartaSans-ExtraBold', color: '#2B7C67' }}>{progressPercent}%</Text>
          </View>
          <View style={{ height: 5, borderRadius: 999, backgroundColor: '#DBE2DF', marginTop: 8, overflow: 'hidden', marginBottom: 18 }}>
            <View style={{ height: '100%', width: `${progressPercent}%`, backgroundColor: '#0C5B47', borderRadius: 999 }} />
          </View>

          <View
            style={{
              borderRadius: 22,
              borderWidth: 1,
              borderColor: '#E6ECE9',
              backgroundColor: '#FFFFFF',
              paddingHorizontal: 16,
              paddingVertical: 15,
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 16,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                position: 'absolute',
                right: -14,
                top: -12,
                width: 70,
                height: 70,
                borderRadius: 35,
                backgroundColor: '#F0F4F2',
              }}
            />
            <View
              style={{
                width: 78,
                height: 78,
                borderRadius: 39,
                backgroundColor: '#1F2937',
                borderWidth: 2,
                borderColor: '#DDE7E2',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 30, fontFamily: 'PlusJakartaSans-ExtraBold', color: '#FFFFFF' }}>{getAvatarLetter(currentPlayer.name)}</Text>
              <View
                style={{
                  position: 'absolute',
                  right: -2,
                  bottom: -2,
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  backgroundColor: '#0F5F49',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: '#FFFFFF',
                }}
              >
                <Check size={12} color="#E7FFF7" strokeWidth={SW} />
              </View>
            </View>
            <View style={{ marginLeft: 14, flex: 1 }}>
              <Text style={{ fontSize: 20, lineHeight: 25, fontFamily: 'PlusJakartaSans-ExtraBold', color: '#0F4E3D' }}>{currentPlayer.name}</Text>
              <Text style={{ fontSize: 15, lineHeight: 21, fontFamily: 'PlusJakartaSans-Bold', color: '#6A7571', marginTop: 2 }}>Mức chơi: {skillLabel}</Text>
            </View>
          </View>

          <Pressable
            onPress={() => toggleNoShow(currentPlayer.player_id)}
            style={{
              borderRadius: 22,
              borderWidth: 1,
              borderColor: '#E6ECE9',
              backgroundColor: '#FFFFFF',
              paddingHorizontal: 16,
              paddingVertical: 14,
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 22,
            }}
          >
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 21,
                backgroundColor: '#FDF0F0',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <UserX size={20} color="#D43E3E" strokeWidth={SW} />
            </View>
              <Text style={{ flex: 1, marginLeft: 12, fontSize: 16, lineHeight: 22, fontFamily: 'PlusJakartaSans-ExtraBold', color: '#2E3432' }}>
                Người này không đến{`\n`}(No-show)
              </Text>
            <View
              style={{
                width: 52,
                height: 30,
                borderRadius: 16,
                paddingHorizontal: 4,
                justifyContent: 'center',
                backgroundColor: currentEntry.no_show ? '#0C5B47' : '#D6DBD8',
              }}
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: '#FFFFFF',
                  alignSelf: currentEntry.no_show ? 'flex-end' : 'flex-start',
                }}
              />
            </View>
          </Pressable>

          <Text style={{ fontSize: 20, lineHeight: 26, fontFamily: 'PlusJakartaSans-ExtraBold', color: '#222D28', marginBottom: 12 }}>
            Đánh giá trình độ
          </Text>
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
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

          <Text style={{ fontSize: 20, lineHeight: 26, fontFamily: 'PlusJakartaSans-ExtraBold', color: '#222D28', marginBottom: 10 }}>
            Nhận xét tích cực
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
            {POSITIVE_TAGS.map((tag) => (
              <TagPill
                key={tag.value}
                tag={tag}
                active={currentEntry.tags.includes(tag.value)}
                disabled={currentEntry.no_show}
                onPress={() => toggleTag(currentPlayer.player_id, tag.value)}
              />
            ))}
          </View>

          <Text style={{ fontSize: 20, lineHeight: 26, fontFamily: 'PlusJakartaSans-ExtraBold', color: '#222D28', marginBottom: 10 }}>
            Lưu ý
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {WARNING_TAGS.map((tag) => (
              <TagPill
                key={tag.value}
                tag={tag}
                active={currentEntry.tags.includes(tag.value)}
                disabled={currentEntry.no_show}
                onPress={() => toggleTag(currentPlayer.player_id, tag.value)}
              />
            ))}
          </View>
        </ScrollView>

        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            paddingHorizontal: 16,
            paddingTop: 10,
            paddingBottom: Math.max(insets.bottom, 12),
            backgroundColor: '#F6F8F7',
            borderTopWidth: 1,
            borderTopColor: '#E5EBE8',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Pressable
              onPress={handleSkip}
              disabled={saving}
              style={{
                flex: 1,
                borderRadius: 999,
                backgroundColor: '#DFE4E1',
                alignItems: 'center',
                justifyContent: 'center',
                height: 52,
                opacity: saving ? 0.6 : 1,
              }}
            >
              <Text style={{ fontSize: 15, fontFamily: 'PlusJakartaSans-ExtraBold', color: '#303734' }}>Bỏ qua</Text>
            </Pressable>

            <Pressable
              onPress={() => void submit()}
              disabled={saving}
              style={{
                flex: 1.6,
                borderRadius: 999,
                backgroundColor: '#064E3B',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                height: 52,
                opacity: saving ? 0.75 : 1,
              }}
            >
              <Text style={{ fontSize: 15, fontFamily: 'PlusJakartaSans-ExtraBold', color: '#F4FFF9' }}>
                {saving ? 'Đang gửi...' : players.length > 1 && currentIndex < players.length - 1 ? 'Tiếp theo' : 'Gửi đánh giá'}
              </Text>
              {!saving ? <ArrowRight size={18} color="#F4FFF9" strokeWidth={SW} /> : null}
            </Pressable>
          </View>
        </View>
      </View>

      <AppDialog visible={Boolean(dialogConfig)} config={dialogConfig} onClose={() => setDialogConfig(null)} />
    </SafeAreaView>
  )
}


