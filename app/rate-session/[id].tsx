import { EmptyState } from '@/components/design'
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
  ShieldCheck,
  Trophy,
  X,
  Zap,
} from 'lucide-react-native'
import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  Text,
  UIManager,
  View,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

type SkillValidation = 'weaker' | 'matched' | 'outclass'

type SessionRecord = {
  id: string
  status: string
  results_status?: string | null
  host_id: string
  slot?: {
    end_time?: string | null
  } | null
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

const SKILL_OPTIONS: SkillOption[] = [
  { value: 'weaker', label: 'Cần cố gắng', icon: ArrowDown },
  { value: 'matched', label: 'Đúng Trình', icon: Check },
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
  return {
    tags: [],
    no_show: false,
    skill_validation: 'matched',
  }
}

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

function animateSelection() {
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
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

function chipIconColor(active: boolean, tone: TagOption['tone']) {
  if (!active) return '#64748b'
  return tone === 'positive' ? '#047857' : '#e11d48'
}

function chipClassName(active: boolean, tone: TagOption['tone']) {
  if (!active) {
    return 'border border-slate-200 bg-white'
  }

  return tone === 'positive' ? 'border border-emerald-500 bg-emerald-50' : 'border border-rose-300 bg-rose-50'
}

function chipTextClassName(active: boolean, tone: TagOption['tone']) {
  if (!active) {
    return 'text-slate-500'
  }

  return tone === 'positive' ? 'text-emerald-700' : 'text-rose-600'
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
        slot:slot_id (
          end_time
        ),
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
      Alert.alert('Không tải được kèo', sessionError?.message ?? 'Vui lòng thử lại sau ít phút.')
      return
    }

    if (session.status !== 'done') {
      Alert.alert('Kèo chưa kết thúc', 'Chỉ có thể đánh giá sau khi buổi chơi đã hoàn tất.', [
        { text: 'Đã hiểu', onPress: () => router.back() },
      ])
      return
    }

    if (session.results_status !== 'finalized') {
      setLoading(false)
      Alert.alert('Kết quả trận chưa được chốt', 'Bạn chỉ có thể đánh giá sau khi kết quả trận đã được xác nhận xong.', [
        { text: 'Đã hiểu', onPress: () => router.back() },
      ])
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

      return {
        ...prev,
        [playerId]: {
          ...current,
          tags: nextTags,
        },
      }
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

  async function submit() {
    if (!myId || !id || !currentPlayer) return

    setSaving(true)
    const entry = ratings[currentPlayer.player_id] ?? createDefaultEntry()

    const { error: ratingError } = await supabase.rpc('submit_rating', {
      p_session_id: id,
      p_rated_id: currentPlayer.player_id,
      p_tags: entry.tags,
      p_no_show: entry.no_show,
      p_skill_validation: entry.skill_validation,
    })

    if (ratingError) {
      setSaving(false)
      Alert.alert('Không gửi được đánh giá', ratingError.message)
      return
    }

    const { error: processError } = await supabase.rpc('process_final_ratings', {
      p_session_id: id,
    })

    if (processError) {
      setSaving(false)
      Alert.alert('Đánh giá đã lưu nhưng chưa xử lý xong', processError.message)
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
    Alert.alert(
      'Đã gửi đánh giá',
      'Đánh giá của bạn đang ở chế độ ẩn danh và sẽ chỉ hiển thị sau 24 giờ hoặc khi cả hai bên hoàn thành.',
      [{ text: 'OK', onPress: () => router.replace('/(tabs)' as any) }],
    )
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-stone-100" edges={['top']}>
        <ActivityIndicator size="large" color="#059669" />
      </SafeAreaView>
    )
  }

  if (alreadyRated) {
    return (
      <SafeAreaView className="flex-1 bg-stone-100" edges={['top']}>
        <View className="flex-1 px-5 pt-8">
          <EmptyState
            icon={<CheckCheck size={28} color="#059669" strokeWidth={ICON_STROKE_WIDTH} />}
            title="Bạn đã đánh giá rồi"
            description="Phản hồi của bạn đã được ghi nhận và sẽ mở khi đủ điều kiện double-blind."
          />
          <View className="pt-6">
            <Pressable
              onPress={() => router.replace('/(tabs)' as any)}
              className="items-center justify-center rounded-[22px] bg-emerald-600 px-5 py-4"
            >
              <Text className="text-[15px] font-black text-white">Về trang chủ</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  if (!currentPlayer) {
    return (
      <SafeAreaView className="flex-1 bg-stone-100" edges={['top']}>
        <View className="flex-1 px-5 pt-8">
          <EmptyState
            icon={<CheckCheck size={28} color="#059669" strokeWidth={ICON_STROKE_WIDTH} />}
            title="Đã hoàn tất đánh giá"
            description="Bạn đã gửi xong tất cả đánh giá cho kèo này."
          />
          <View className="pt-6">
            <Pressable
              onPress={() => router.replace('/(tabs)' as any)}
              className="items-center justify-center rounded-[22px] bg-emerald-600 px-5 py-4"
            >
              <Text className="text-[15px] font-black text-white">Về trang chủ</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  const currentSkill = getSkillLevelFromPlayer(currentPlayer)
  const skillLabel = getShortSkillLabel(currentSkill)

  return (
    <SafeAreaView className="flex-1 bg-stone-100" edges={['top']}>
      <View className="flex-1">
        <View
          className="absolute left-0 right-0 z-20 flex-row items-center justify-between px-5"
          style={{ top: insets.top + 4 }}
        >
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center rounded-full bg-white/90"
          >
            <X size={20} color="#0f172a" strokeWidth={ICON_STROKE_WIDTH} />
          </Pressable>

          <View className="rounded-full bg-white/80 px-3 py-1.5">
            <Text className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
              {completedCount + 1}/{players.length}
            </Text>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingTop: insets.top + 34,
            paddingBottom: 128 + insets.bottom,
            paddingHorizontal: 20,
          }}
        >
          <View className="items-center pb-6">
            <View className="relative">
              <View className="h-24 w-24 items-center justify-center rounded-[32px] bg-slate-900 shadow-sm">
                <Text className="text-[30px] font-black text-white">{getInitials(currentPlayer.name)}</Text>
              </View>
              <View className="absolute -bottom-1 -right-1 h-8 w-8 items-center justify-center rounded-full border-2 border-stone-100 bg-lime-400">
                <Check size={16} color="#14532d" strokeWidth={ICON_STROKE_WIDTH} />
              </View>
            </View>

            <Text className="mt-4 text-center text-[28px] font-black text-slate-950">{currentPlayer.name}</Text>

            <View className="mt-3 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2">
              <Text className="text-[13px] font-bold text-emerald-700">{skillLabel}</Text>
            </View>
          </View>

          <View className="rounded-[30px] bg-white px-5 py-5 shadow-sm">
            <View>
              <Text className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Trình độ</Text>
              <Text className="mt-2 text-[22px] font-black text-slate-950">Bạn thấy bạn ấy thế nào?</Text>
              <View className="mt-4 flex-row gap-2">
                {SKILL_OPTIONS.map((option) => {
                  const active = currentEntry.skill_validation === option.value
                  const Icon = option.icon

                  return (
                    <Pressable
                      key={option.value}
                      onPress={() => setSkillValidation(currentPlayer.player_id, option.value)}
                      className={`flex-1 rounded-[20px] border px-3 py-3 ${active ? 'border-emerald-600 bg-emerald-600' : 'border-slate-200 bg-white'}`}
                    >
                      <View className="items-center">
                        <Icon
                          size={17}
                          color={active ? '#ffffff' : '#22c55e'}
                          strokeWidth={ICON_STROKE_WIDTH}
                        />
                        <Text
                          className={`mt-2 text-center text-[12px] font-bold leading-4 ${active ? 'text-white' : 'text-slate-500'}`}
                        >
                          {option.label}
                        </Text>
                      </View>
                    </Pressable>
                  )
                })}
              </View>
            </View>

            <View className="mt-7">
              <View className="flex-row items-center">
                <Heart size={16} color="#059669" strokeWidth={ICON_STROKE_WIDTH} />
                <Text className="ml-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                  Lời khen dành cho người chơi
                </Text>
              </View>

              <View className="mt-4 flex-row flex-wrap gap-3">
                {POSITIVE_TAGS.map((tag) => {
                  const active = currentEntry.tags.includes(tag.value)
                  const Icon = tag.icon

                  return (
                    <Pressable
                      key={tag.value}
                      onPress={() => toggleTag(currentPlayer.player_id, tag.value)}
                      className={`flex-row items-center rounded-[18px] px-3.5 py-2.5 ${chipClassName(active, tag.tone)}`}
                    >
                      <Icon size={15} color={chipIconColor(active, tag.tone)} strokeWidth={ICON_STROKE_WIDTH} />
                      <Text className={`ml-2 text-[13px] font-bold ${chipTextClassName(active, tag.tone)}`}>
                        {tag.label}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            </View>

            <View className="mt-8">
              <View className="flex-row items-center">
                <ShieldAlert size={16} color="#f43f5e" strokeWidth={ICON_STROKE_WIDTH} />
                <Text className="ml-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                  Cảnh báo (Chỉ chọn nếu thực sự gặp)
                </Text>
              </View>

              <View className="mt-4 flex-row flex-wrap gap-3">
                {WARNING_TAGS.map((tag) => {
                  const active = currentEntry.tags.includes(tag.value)
                  const Icon = tag.icon

                  return (
                    <Pressable
                      key={tag.value}
                      onPress={() => toggleTag(currentPlayer.player_id, tag.value)}
                      className={`flex-row items-center rounded-[18px] px-3.5 py-2.5 ${chipClassName(active, tag.tone)}`}
                    >
                      <Icon size={15} color={chipIconColor(active, tag.tone)} strokeWidth={ICON_STROKE_WIDTH} />
                      <Text className={`ml-2 text-[13px] font-bold ${chipTextClassName(active, tag.tone)}`}>
                        {tag.label}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            </View>

            <Pressable
              onPress={() => toggleNoShow(currentPlayer.player_id)}
              className={`mt-8 flex-row items-center justify-center rounded-[22px] px-4 py-4 ${
                currentEntry.no_show ? 'bg-rose-600' : 'bg-rose-50'
              }`}
            >
              <ShieldAlert
                size={17}
                color={currentEntry.no_show ? '#ffffff' : '#e11d48'}
                strokeWidth={ICON_STROKE_WIDTH}
              />
              <Text className={`ml-2 text-[14px] font-black ${currentEntry.no_show ? 'text-white' : 'text-rose-600'}`}>
                {currentEntry.no_show ? 'Đã báo no-show' : 'Báo No-show'}
              </Text>
            </Pressable>

            {currentEntry.no_show ? (
              <View className="mt-4 rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-4">
                <Text className="text-[14px] leading-6 text-rose-700">
                  Người chơi này sẽ bị ghi nhận no-show. Hệ thống sẽ áp dụng mức trừ độ tin cậy mạnh hơn và bỏ qua các tag khác.
                </Text>
              </View>
            ) : null}

            <View className="mt-5 rounded-[24px] border border-indigo-100 bg-indigo-50 px-4 py-4">
              <View className="flex-row items-start">
                <View className="mt-0.5">
                  <ShieldCheck size={18} color="#4f46e5" strokeWidth={ICON_STROKE_WIDTH} />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-[14px] font-black text-slate-900">Đánh giá ẩn danh</Text>
                  <Text className="mt-1 text-[13px] leading-5 text-slate-600">
                    Phản hồi của bạn sẽ chỉ hiển thị sau 24 giờ hoặc khi cả hai bên hoàn thành đánh giá.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        <View
          className="border-t border-slate-200 bg-white px-5"
          style={{ paddingTop: 10, paddingBottom: Math.max(insets.bottom, 10) }}
        >
          <View className="flex-row items-center justify-between">
            <View className="mr-4 flex-1">
              <Text className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                Bạn đang đánh giá
              </Text>
              <Text className="mt-1.5 text-[28px] font-black leading-[30px] text-slate-950">{currentPlayer.name}</Text>
            </View>

            <Pressable
              onPress={submit}
              disabled={saving}
              className={`min-w-[160px] flex-row items-center justify-center rounded-[22px] px-5 py-4 ${
                saving ? 'bg-emerald-500/70' : 'bg-emerald-600'
              }`}
            >
              <Text className="text-[14px] font-black uppercase tracking-[0.03em] text-white">
                {saving ? 'Đang gửi' : 'Gửi đánh giá'}
              </Text>
              <ArrowRight size={18} color="#ffffff" strokeWidth={ICON_STROKE_WIDTH} style={{ marginLeft: 8 }} />
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  )
}
