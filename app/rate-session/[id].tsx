import { AppButton, AppChip, EmptyState, ScreenHeader, SectionCard, StatusBadge } from '@/components/design'
import { supabase } from '@/lib/supabase'
import { router, useLocalSearchParams } from 'expo-router'
import type { LucideIcon } from 'lucide-react-native'
import {
  AlertTriangle,
  Award,
  CheckCircle2,
  ClipboardList,
  Flame,
  Frown,
  MapPin,
  Scale,
  ShieldCheck,
  ShieldQuestion,
  Swords,
  Timer,
  UserRoundX,
  Users,
} from 'lucide-react-native'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

type SkillValidation = 'weaker' | 'matched' | 'outclass'

type TagOption = {
  value: string
  label: string
  icon: LucideIcon
}

type SkillOption = {
  value: SkillValidation
  label: string
  icon: LucideIcon
  tone: 'danger' | 'success' | 'info'
}

const PLAYER_TAGS_POSITIVE: TagOption[] = [
  { value: 'fair_play', label: 'Chơi đẹp', icon: Award },
  { value: 'on_time', label: 'Đúng giờ', icon: Flame },
  { value: 'friendly', label: 'Thân thiện', icon: Users },
  { value: 'skilled', label: 'Kỹ thuật tốt', icon: Swords },
]

const PLAYER_TAGS_NEGATIVE: TagOption[] = [
  { value: 'toxic', label: 'Toxic', icon: Frown },
  { value: 'late', label: 'Đi muộn', icon: Timer },
  { value: 'dishonest', label: 'Gian lận điểm', icon: AlertTriangle },
]

const HOST_TAGS: TagOption[] = [
  { value: 'good_description', label: 'Đúng mô tả kèo', icon: ClipboardList },
  { value: 'well_organized', label: 'Tổ chức tốt', icon: ShieldCheck },
  { value: 'fair_pairing', label: 'Xếp cặp công bằng', icon: Scale },
]

const HOST_TAGS_NEGATIVE: TagOption[] = [
  { value: 'court_mismatch', label: 'Sân sai mô tả', icon: MapPin },
  { value: 'poor_organization', label: 'Tổ chức kém', icon: ShieldQuestion },
]

const SKILL_OPTIONS: SkillOption[] = [
  { value: 'weaker', label: 'Yếu hơn mác', icon: UserRoundX, tone: 'danger' },
  { value: 'matched', label: 'Đúng trình', icon: CheckCircle2, tone: 'info' },
  { value: 'outclass', label: 'Out trình', icon: Award, tone: 'info' },
]

type PlayerInSession = {
  player_id: string
  name: string
  is_host: boolean
}

type RatingEntry = {
  tags: string[]
  no_show: boolean
  skill_validation: SkillValidation
}

type SessionRecord = {
  id: string
  status: string
  host_id: string
  slot?: {
    end_time?: string | null
    court?: {
      name?: string | null
    } | null
  } | null
  session_players: {
    player_id: string
    player?: { name?: string | null } | null
  }[]
}

function createDefaultEntry(): RatingEntry {
  return {
    tags: [],
    no_show: false,
    skill_validation: 'matched',
  }
}

function chipClasses(kind: 'positive' | 'negative' | 'skill') {
  if (kind === 'positive') {
    return {
      active: 'bg-emerald-50',
      text: 'text-emerald-700',
      icon: '#047857',
    }
  }

  if (kind === 'negative') {
    return {
      active: 'bg-rose-50',
      text: 'text-rose-700',
      icon: '#be123c',
    }
  }

  return {
    active: 'bg-sky-50',
    text: 'text-sky-700',
    icon: '#0369a1',
  }
}

export default function RateSession() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [myId, setMyId] = useState<string | null>(null)
  const [players, setPlayers] = useState<PlayerInSession[]>([])
  const [sessionName, setSessionName] = useState('')
  const [sessionEndTime, setSessionEndTime] = useState<string | null>(null)
  const [ratings, setRatings] = useState<Record<string, RatingEntry>>({})
  const [alreadyRated, setAlreadyRated] = useState(false)

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
        id, status, host_id,
        slot:slot_id (
          end_time,
          court:court_id ( name )
        ),
        session_players (
          player_id,
          player:player_id ( name )
        )
      `,
      )
      .eq('id', id)
      .single()

    if (sessionError || !session) {
      setLoading(false)
      Alert.alert('Không tải được kèo', sessionError?.message ?? 'Vui lòng thử lại sau.')
      return
    }

    if (session.status !== 'done') {
      Alert.alert('Kèo chưa kết thúc', 'Chỉ có thể đánh giá sau khi kèo đã kết thúc.')
      router.back()
      return
    }

    const { data: existing } = await supabase.from('ratings').select('id').eq('session_id', id).eq('rater_id', user.id).limit(1)

    if ((existing?.length ?? 0) > 0) {
      setAlreadyRated(true)
      setLoading(false)
      return
    }

    const typedSession = session as unknown as SessionRecord
    setSessionName(typedSession.slot?.court?.name ?? 'Kèo pickleball')
    setSessionEndTime(typedSession.slot?.end_time ?? null)

    const others = typedSession.session_players
      .filter((item) => item.player_id !== user.id)
      .map((item) => ({
        player_id: item.player_id,
        name: item.player?.name?.trim() || 'Người chơi',
        is_host: item.player_id === typedSession.host_id,
      }))

    setPlayers(others)

    const initialRatings: Record<string, RatingEntry> = {}
    others.forEach((player) => {
      initialRatings[player.player_id] = createDefaultEntry()
    })
    setRatings(initialRatings)
    setLoading(false)
  }, [id])

  useEffect(() => {
    init()
  }, [init])

  const revealAt = useMemo(() => {
    const base = sessionEndTime ? new Date(sessionEndTime) : new Date()
    const next = new Date(base)
    next.setHours(next.getHours() + 24)
    return next.toISOString()
  }, [sessionEndTime])

  function toggleTag(playerId: string, tag: string) {
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
    setRatings((prev) => ({
      ...prev,
      [playerId]: {
        ...(prev[playerId] ?? createDefaultEntry()),
        skill_validation: value,
      },
    }))
  }

  async function submit() {
    if (!myId || !id) return

    setSaving(true)

    const inserts = Object.entries(ratings).map(([playerId, entry]) => ({
      session_id: id,
      rater_id: myId,
      rated_id: playerId,
      tags: entry.no_show ? [] : entry.tags,
      no_show: entry.no_show,
      skill_validation: entry.skill_validation,
      is_hidden: true,
      reveal_at: revealAt,
    }))

    const { error: ratingError } = await supabase.from('ratings').insert(inserts)

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

    setSaving(false)
    Alert.alert(
      'Đã gửi đánh giá',
      'Đánh giá của bạn đang ở chế độ ẩn danh và sẽ chỉ hiển thị sau 24 giờ hoặc khi cả hai bên hoàn thành.',
      [{ text: 'OK', onPress: () => router.replace('/(tabs)' as any) }],
    )
  }

  function renderChip(option: TagOption | SkillOption, kind: 'positive' | 'negative' | 'skill', active: boolean, onPress: () => void) {
    const palette = chipClasses(kind)
    const Icon = option.icon

    return (
      <AppChip
        key={option.value}
        icon={<Icon size={15} color={active ? palette.icon : '#64748b'} />}
        label={option.label}
        tone={'tone' in option ? option.tone : kind === 'negative' ? 'danger' : kind === 'skill' ? 'info' : 'success'}
        active={active}
        onPress={onPress}
        className="flex-row items-center rounded-[10px] px-3 py-2"
        labelClassName={`text-[13px] font-bold ${active ? palette.text : 'text-slate-500'}`}
        activeClassName={palette.active}
        inactiveClassName="border border-slate-200 bg-white"
      />
    )
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-stone-100" edges={['top']}>
        <ActivityIndicator size="large" color="#16a34a" />
      </SafeAreaView>
    )
  }

  if (alreadyRated) {
    return (
      <SafeAreaView className="flex-1 bg-stone-100" edges={['top']}>
        <ScreenHeader
          eyebrow="Hoàn tất"
          title="Bạn đã đánh giá rồi"
          subtitle="Phản hồi của bạn đã được ghi nhận và sẽ mở khi đủ điều kiện double-blind."
        />
        <EmptyState
          icon={<CheckCircle2 size={28} color="#059669" />}
          title="Đánh giá đã được lưu"
          description="Bạn có thể quay về trang chủ để tiếp tục tìm kèo mới."
        />
        <View className="px-5 pt-6">
          <AppButton label="Về trang chủ" onPress={() => router.replace('/(tabs)' as any)} />
        </View>
      </SafeAreaView>
    )
  }

  if (players.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-stone-100" edges={['top']}>
        <ScreenHeader
          eyebrow="Đánh giá"
          title="Không có ai để đánh giá"
          subtitle="Kèo này hiện không có người chơi nào khác ngoài bạn."
        />
        <EmptyState
          icon={<Users size={28} color="#64748b" />}
          title="Chưa có dữ liệu đánh giá"
          description="Khi có đồng đội hoặc đối thủ trong kèo, bạn sẽ đánh giá được ở đây."
        />
        <View className="px-5 pt-6">
          <AppButton label="Về trang chủ" onPress={() => router.replace('/(tabs)' as any)} />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-stone-100" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        <ScreenHeader
          eyebrow="Sau trận đấu"
          title="Đánh giá kèo"
          subtitle={sessionName || 'Ghi lại cảm nhận của bạn để hệ thống cải thiện độ ghép kèo và độ tin cậy.'}
        />

        <View className="px-5">
          {players.map((player) => {
            const entry = ratings[player.player_id] ?? createDefaultEntry()

            return (
              <SectionCard key={player.player_id} className="mb-4">
                <View className="flex-row items-start">
                  <View className="mr-3 h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                    <Text className="text-lg font-black text-emerald-700">{player.name?.[0]?.toUpperCase() ?? '?'}</Text>
                  </View>

                  <View className="flex-1">
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1 pr-3">
                        <Text className="text-base font-extrabold text-slate-950">{player.name}</Text>
                        <View className="mt-2 flex-row flex-wrap gap-2">
                          {player.is_host ? <StatusBadge label="Host" tone="info" /> : null}
                          {entry.no_show ? <StatusBadge label="No-show" tone="danger" /> : <StatusBadge label="Đã tham gia" tone="success" />}
                        </View>
                      </View>

                      <TouchableOpacity
                        activeOpacity={0.88}
                        className={`rounded-full px-4 py-2 ${entry.no_show ? 'bg-rose-100' : 'bg-slate-100'}`}
                        onPress={() => toggleNoShow(player.player_id)}
                      >
                        <Text className={`text-xs font-extrabold uppercase tracking-[1px] ${entry.no_show ? 'text-rose-700' : 'text-slate-600'}`}>
                          {entry.no_show ? 'Đã báo no-show' : 'Báo no-show'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {!entry.no_show ? (
                  <>
                    <View className="mt-5">
                      <Text className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Skill Validation</Text>
                      <Text className="mt-2 text-sm leading-6 text-slate-500">
                        Chọn cảm nhận thực chiến của bạn về trình độ người chơi này so với mức đang hiển thị.
                      </Text>
                      <View className="mt-4 flex-row flex-wrap gap-2">
                        {SKILL_OPTIONS.map((option) =>
                          renderChip(option, 'skill', entry.skill_validation === option.value, () =>
                            setSkillValidation(player.player_id, option.value),
                          ),
                        )}
                      </View>
                    </View>

                    <View className="mt-5">
                      <Text className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Tích cực</Text>
                      <Text className="mt-2 text-sm leading-6 text-slate-500">
                        Những điểm tốt bạn muốn ghi nhận để tăng độ tin cậy và độ khớp của hệ thống.
                      </Text>
                      <View className="mt-4 flex-row flex-wrap gap-2">
                        {PLAYER_TAGS_POSITIVE.map((tag) =>
                          renderChip(tag, 'positive', entry.tags.includes(tag.value), () =>
                            toggleTag(player.player_id, tag.value),
                          ),
                        )}
                        {player.is_host
                          ? HOST_TAGS.map((tag) =>
                              renderChip(tag, 'skill', entry.tags.includes(tag.value), () =>
                                toggleTag(player.player_id, tag.value),
                              ),
                            )
                          : null}
                      </View>
                    </View>

                    <View className="mt-5">
                      <Text className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Cảnh báo</Text>
                      <Text className="mt-2 text-sm leading-6 text-slate-500">
                        Chỉ chọn khi bạn thực sự gặp tình huống đó trong trận để đảm bảo đánh giá công bằng.
                      </Text>
                      <View className="mt-4 flex-row flex-wrap gap-2">
                        {PLAYER_TAGS_NEGATIVE.map((tag) =>
                          renderChip(tag, 'negative', entry.tags.includes(tag.value), () =>
                            toggleTag(player.player_id, tag.value),
                          ),
                        )}
                        {player.is_host
                          ? HOST_TAGS_NEGATIVE.map((tag) =>
                              renderChip(tag, 'negative', entry.tags.includes(tag.value), () =>
                                toggleTag(player.player_id, tag.value),
                              ),
                            )
                          : null}
                      </View>
                    </View>
                  </>
                ) : (
                  <View className="mt-5 rounded-[22px] bg-rose-50 px-4 py-4">
                    <Text className="text-sm leading-6 text-rose-700">
                      Người chơi này sẽ bị ghi nhận no-show. Hệ thống sẽ áp dụng mức trừ độ tin cậy mạnh hơn và bỏ qua các tag khác.
                    </Text>
                  </View>
                )}
              </SectionCard>
            )
          })}

          <SectionCard className="mb-5">
            <Text className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Quyền riêng tư</Text>
            <Text className="mt-2 text-sm leading-6 text-slate-500">
              Đánh giá của bạn là ẩn danh và chỉ hiển thị sau 24 giờ hoặc khi cả hai bên hoàn thành.
            </Text>
          </SectionCard>

          <AppButton label={saving ? 'Đang gửi...' : 'Gửi đánh giá'} onPress={submit} loading={saving} />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
