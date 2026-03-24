import { AppButton, AppChip, EmptyState, ScreenHeader, SectionCard, StatusBadge } from '@/components/design'
import { supabase } from '@/lib/supabase'
import { router, useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const PLAYER_TAGS_POSITIVE = [
  { value: 'fair_play', label: '🏅 Chơi đẹp' },
  { value: 'on_time', label: '⚡ Đúng giờ' },
  { value: 'friendly', label: '🤝 Thân thiện' },
  { value: 'skilled', label: '🎯 Kỹ thuật tốt' },
]

const PLAYER_TAGS_NEGATIVE = [
  { value: 'toxic', label: '😡 Thái độ Toxic' },
  { value: 'late', label: '⏰ Đi muộn' },
  { value: 'dishonest', label: '❌ Gian lận điểm' },
]

const HOST_TAGS = [
  { value: 'good_description', label: '📋 Đúng mô tả kèo' },
  { value: 'well_organized', label: '🗂️ Tổ chức tốt' },
  { value: 'fair_pairing', label: '⚖️ Xếp cặp công bằng' },
]

const HOST_TAGS_NEGATIVE = [
  { value: 'court_mismatch', label: '🏟️ Sân sai mô tả' },
  { value: 'poor_organization', label: '⚠️ Tổ chức kém' },
]

const SKILL_OPTIONS: SkillOption[] = [
  { value: 'weaker', label: '🔴 Yếu hơn mác', tone: 'danger' as const },
  { value: 'matched', label: '🟢 Đúng trình', tone: 'success' as const },
  { value: 'outclass', label: '🔵 Out trình', tone: 'info' as const },
]

type SkillValidation = 'weaker' | 'matched' | 'outclass'

type SkillOption = {
  value: SkillValidation
  label: string
  tone: 'danger' | 'success' | 'info'
}

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

    const { data: existing } = await supabase
      .from('ratings')
      .select('id')
      .eq('session_id', id)
      .eq('rater_id', user.id)
      .limit(1)

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
      const nextTags = current.tags.includes(tag)
        ? current.tags.filter((item) => item !== tag)
        : [...current.tags, tag]

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
          icon="✅"
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
          icon="🏓"
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
                <View className="flex-row items-center">
                  <View className="mr-3 h-12 w-12 items-center justify-center rounded-[18px] bg-emerald-100">
                    <Text className="text-lg font-black text-emerald-700">
                      {player.name?.[0]?.toUpperCase() ?? '?'}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-extrabold text-slate-950">{player.name}</Text>
                    <View className="mt-2 flex-row flex-wrap gap-2">
                      {player.is_host ? <StatusBadge label="Host" tone="info" /> : null}
                      {entry.no_show ? (
                        <StatusBadge label="No-show" tone="danger" />
                      ) : (
                        <StatusBadge label="Đã tham gia" tone="success" />
                      )}
                    </View>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.88}
                    className={`rounded-full px-4 py-2 ${entry.no_show ? 'bg-rose-100' : 'bg-slate-100'}`}
                    onPress={() => toggleNoShow(player.player_id)}
                  >
                    <Text
                      className={`text-xs font-extrabold ${entry.no_show ? 'text-rose-700' : 'text-slate-600'}`}
                    >
                      {entry.no_show ? '⚠️ No-show' : 'Báo no-show'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {!entry.no_show ? (
                  <>
                    <View className="mt-5">
                      <Text className="text-sm font-extrabold text-slate-900">Màng lọc 3 · Xác thực trình độ</Text>
                      <Text className="mt-1 text-sm leading-6 text-slate-500">
                        Chọn cảm nhận thực chiến của bạn về trình độ người chơi này so với mức đang hiển thị.
                      </Text>
                      <View className="mt-4 flex-row flex-wrap gap-2">
                        {SKILL_OPTIONS.map((option) => (
                          <AppChip
                            key={option.value}
                            label={option.label}
                            tone={option.tone}
                            active={entry.skill_validation === option.value}
                            onPress={() => setSkillValidation(player.player_id, option.value)}
                          />
                        ))}
                      </View>
                    </View>

                    <View className="mt-5">
                      <Text className="text-sm font-extrabold text-slate-900">Tích cực</Text>
                      <Text className="mt-1 text-sm leading-6 text-slate-500">
                        Những điểm tốt bạn muốn ghi nhận để tăng độ tin cậy và độ khớp của hệ thống.
                      </Text>
                      <View className="mt-4 flex-row flex-wrap gap-2">
                        {PLAYER_TAGS_POSITIVE.map((tag) => (
                          <AppChip
                            key={tag.value}
                            label={tag.label}
                            tone="success"
                            active={entry.tags.includes(tag.value)}
                            onPress={() => toggleTag(player.player_id, tag.value)}
                          />
                        ))}
                        {player.is_host
                          ? HOST_TAGS.map((tag) => (
                              <AppChip
                                key={tag.value}
                                label={tag.label}
                                tone="info"
                                active={entry.tags.includes(tag.value)}
                                onPress={() => toggleTag(player.player_id, tag.value)}
                              />
                            ))
                          : null}
                      </View>
                    </View>

                    <View className="mt-5">
                      <Text className="text-sm font-extrabold text-slate-900">Cảnh báo</Text>
                      <Text className="mt-1 text-sm leading-6 text-slate-500">
                        Chỉ chọn khi bạn thực sự gặp tình huống đó trong trận để đảm bảo đánh giá công bằng.
                      </Text>
                      <View className="mt-4 flex-row flex-wrap gap-2">
                        {PLAYER_TAGS_NEGATIVE.map((tag) => (
                          <AppChip
                            key={tag.value}
                            label={tag.label}
                            tone="danger"
                            active={entry.tags.includes(tag.value)}
                            onPress={() => toggleTag(player.player_id, tag.value)}
                          />
                        ))}
                        {player.is_host
                          ? HOST_TAGS_NEGATIVE.map((tag) => (
                              <AppChip
                                key={tag.value}
                                label={tag.label}
                                tone="danger"
                                active={entry.tags.includes(tag.value)}
                                onPress={() => toggleTag(player.player_id, tag.value)}
                              />
                            ))
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
            <Text className="text-sm font-extrabold text-slate-900">🔐 Ghi chú quyền riêng tư</Text>
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
