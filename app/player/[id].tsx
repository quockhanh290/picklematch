import { AppButton, AppStatCard, EmptyState, ScreenHeader, SectionCard, StatusBadge } from '@/components/design'
import { getSkillLevelFromElo, getSkillLevelFromPlayer } from '@/lib/skillAssessment'
import { supabase } from '@/lib/supabase'
import { router, useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const BADGE_META: Record<string, { emoji: string; label: string }> = {
  fair_play: { emoji: '🏅', label: 'Chơi đẹp' },
  on_time: { emoji: '⚡', label: 'Đúng giờ' },
  friendly: { emoji: '🤝', label: 'Thân thiện' },
  skilled: { emoji: '🎯', label: 'Kỹ thuật tốt' },
}

type Player = {
  id: string
  name: string
  city: string
  skill_label: string
  elo: number
  current_elo?: number | null
  self_assessed_level?: string | null
  sessions_joined: number
  no_show_count: number
  created_at: string
  favorite_court_ids: string[]
}

type SessionHistory = {
  id: string
  status: string
  is_host: boolean
  slot: {
    start_time: string
    court: { name: string; city: string }
  }
}

type Court = { id: string; name: string; city: string }

type HostStats = {
  total: number
  badCancels: number
}

export default function PlayerProfile() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [player, setPlayer] = useState<Player | null>(null)
  const [loading, setLoading] = useState(true)
  const [ratingTags, setRatingTags] = useState<Record<string, number>>({})
  const [history, setHistory] = useState<SessionHistory[]>([])
  const [favCourts, setFavCourts] = useState<Court[]>([])
  const [hostStats, setHostStats] = useState<HostStats>({ total: 0, badCancels: 0 })
  const [isMe, setIsMe] = useState(false)

  const fetchRatingTags = useCallback(async (playerId: string) => {
    const nowIso = new Date().toISOString()
    const { data } = await supabase
      .from('ratings')
      .select('tags, is_hidden, reveal_at')
      .eq('rated_id', playerId)
      .or(`is_hidden.eq.false,reveal_at.lte.${nowIso}`)

    if (data) {
      const counts: Record<string, number> = {}
      data.forEach((r: any) => {
        r.tags?.forEach((tag: string) => {
          counts[tag] = (counts[tag] ?? 0) + 1
        })
      })
      setRatingTags(counts)
    }
  }, [])

  const fetchHistory = useCallback(async (playerId: string) => {
    const { data } = await supabase
      .from('session_players')
      .select(`
        session:session_id (
          id, status, host_id,
          slot:slot_id (
            start_time,
            court:court_id ( name, city )
          )
        )
      `)
      .eq('player_id', playerId)
      .limit(5)

    if (data) {
      setHistory(
        data
          .map((d: any) => ({
          id: d.session.id,
          status: d.session.status,
          is_host: d.session.host_id === playerId,
          slot: d.session.slot,
          }))
          .sort((a: SessionHistory, b: SessionHistory) => new Date(b.slot.start_time).getTime() - new Date(a.slot.start_time).getTime()),
      )
    }
  }, [])

  const fetchFavCourts = useCallback(async (ids: string[]) => {
    if (!ids.length) return
    const { data } = await supabase.from('courts').select('id, name, city').in('id', ids)
    setFavCourts(data ?? [])
  }, [])

  const fetchHostStats = useCallback(async (playerId: string) => {
    const { data } = await supabase.from('sessions').select('status, was_full_when_cancelled').eq('host_id', playerId)

    if (data) {
      const total = data.length
      const badCancels = data.filter((s: any) => s.status === 'cancelled' && s.was_full_when_cancelled).length
      setHostStats({ total, badCancels })
    }
  }, [])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    setIsMe(user?.id === id)

    const { data } = await supabase
      .from('players')
      .select('id, name, city, skill_label, self_assessed_level, elo, current_elo, sessions_joined, no_show_count, created_at, favorite_court_ids')
      .eq('id', id)
      .single()

    if (data) {
      setPlayer(data)
      await Promise.all([
        fetchRatingTags(data.id),
        fetchHistory(data.id),
        fetchFavCourts(data.favorite_court_ids ?? []),
        fetchHostStats(data.id),
      ])
    }
    setLoading(false)
  }, [fetchFavCourts, fetchHistory, fetchHostStats, fetchRatingTags, id])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  function reliabilityScore(joined: number, noShow: number) {
    if (!joined) return null
    return Math.round(((joined - noShow) / joined) * 100)
  }

  function reliabilityValueClass(score: number | null) {
    if (score === null) return 'text-slate-700'
    if (score >= 90) return 'text-emerald-700'
    if (score >= 70) return 'text-amber-700'
    return 'text-rose-700'
  }

  function cancelRateValueClass(bad: number, total: number) {
    if (total === 0) return 'text-slate-700'
    const rate = bad / total
    if (rate === 0) return 'text-emerald-700'
    if (rate <= 0.2) return 'text-amber-700'
    return 'text-rose-700'
  }

  function formatTime(start: string) {
    const s = new Date(start)
    const weekday = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][s.getDay()]
    const day = `${s.getDate().toString().padStart(2, '0')}/${(s.getMonth() + 1).toString().padStart(2, '0')}`
    const hh = s.getHours().toString().padStart(2, '0')
    const mm = s.getMinutes().toString().padStart(2, '0')
    return `${weekday} ${day} · ${hh}:${mm}`
  }

  function sessionStatusConfig(status: string) {
    switch (status) {
      case 'open':
        return { tone: 'success' as const, label: 'Đang mở' }
      case 'cancelled':
        return { tone: 'danger' as const, label: 'Đã huỷ' }
      default:
        return { tone: 'neutral' as const, label: 'Kết thúc' }
    }
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-stone-100" edges={['top']}>
        <ActivityIndicator size="large" color="#16a34a" />
      </SafeAreaView>
    )
  }

  if (!player) {
    return (
      <SafeAreaView className="flex-1 bg-stone-100" edges={['top']}>
        <EmptyState icon="😕" title="Không tìm thấy người chơi" description="Thử tải lại hoặc quay về trang trước để kiểm tra danh sách." />
      </SafeAreaView>
    )
  }

  const reliability = reliabilityScore(player.sessions_joined ?? 0, player.no_show_count ?? 0)
  const sortedTags = Object.entries(ratingTags).sort((a, b) => b[1] - a[1])
  const hostedCount = history.filter((h) => h.is_host).length
  const effectiveElo = player.current_elo ?? player.elo
  const calibratedSkill = getSkillLevelFromElo(effectiveElo)
  const fallbackSkill = getSkillLevelFromPlayer(player)
  const skill = calibratedSkill ?? fallbackSkill

  return (
    <SafeAreaView className="flex-1 bg-stone-100" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        <ScreenHeader
          eyebrow="Người chơi"
          title={player.name}
          subtitle="Xem nhanh phong cách chơi, độ tin cậy và lịch sử tham gia kèo của người chơi này."
          rightSlot={isMe ? <StatusBadge label="Đây là bạn" tone="info" /> : null}
        />

        <View className="px-5">
          <SectionCard className="mb-4">
            <View className="flex-row items-center">
              <View className="mr-4 h-20 w-20 items-center justify-center rounded-[28px] bg-emerald-100">
                <Text className="text-3xl font-black text-emerald-700">{player.name?.[0]?.toUpperCase() ?? '?'}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-2xl font-black text-slate-950">{player.name}</Text>
                <Text className="mt-1 text-sm text-slate-500">📍 {player.city}</Text>
                <Text className="mt-3 text-sm font-semibold text-slate-500">Elo {effectiveElo}</Text>
              </View>
            </View>
            {isMe ? (
              <View className="mt-4">
                <AppButton label="Chỉnh sửa hồ sơ" onPress={() => router.push('/edit-profile' as any)} variant="secondary" />
              </View>
            ) : null}
          </SectionCard>

          <View className="mb-3 flex-row gap-3">
            <AppStatCard value={player.elo ?? '—'} label="ELO" />
            <AppStatCard value={player.sessions_joined ?? 0} label="Đã chơi" />
          </View>
          <View className="mb-4 flex-row gap-3">
            <AppStatCard value={hostedCount} label="Đã host" />
            <AppStatCard
              value={reliability === null ? 'Mới' : `${reliability}%`}
              label="Tin cậy"
              valueClassName={reliabilityValueClass(reliability)}
            />
          </View>

          <SectionCard
            title={skill.title}
            subtitle={`Elo ${effectiveElo} · ${skill.subtitle}`}
            className="mb-4"
            rightSlot={<StatusBadge label={skill.dupr} tone="info" />}
          >
            <Text className="text-sm leading-6 text-slate-500">{skill.description}</Text>
          </SectionCard>

          <View className="mb-4 flex-row gap-3">
            <SectionCard title="Độ tin cậy" className="flex-1">
              <Text className="text-sm text-slate-500">{player.no_show_count ?? 0} no-show / {player.sessions_joined ?? 0} kèo</Text>
              <Text className={`mt-3 text-2xl font-black ${reliabilityValueClass(reliability)}`}>
                {reliability === null ? 'Mới' : `${reliability}%`}
              </Text>
            </SectionCard>

            <SectionCard title="Tỷ lệ huỷ kèo" className="flex-1">
              <Text className="text-sm text-slate-500">{hostStats.badCancels} huỷ xấu / {hostStats.total} kèo host</Text>
              <Text className={`mt-3 text-2xl font-black ${cancelRateValueClass(hostStats.badCancels, hostStats.total)}`}>
                {hostStats.total === 0 ? 'Chưa host' : hostStats.badCancels === 0 ? 'Tốt' : `${hostStats.badCancels}/${hostStats.total}`}
              </Text>
            </SectionCard>
          </View>

          {favCourts.length > 0 ? (
            <SectionCard title="Sân hay chơi" subtitle="Những sân người chơi này thường chọn hoặc ghé đến." className="mb-4">
              <View className="gap-3">
                {favCourts.map((court) => (
                  <View key={court.id} className="rounded-[22px] bg-slate-50 px-4 py-4">
                    <Text className="text-sm font-extrabold text-slate-900">{court.name}</Text>
                    <Text className="mt-1 text-sm text-slate-500">📍 {court.city}</Text>
                  </View>
                ))}
              </View>
            </SectionCard>
          ) : null}

          <View className="mb-3 px-1">
            <Text className="text-lg font-extrabold text-slate-900">Kèo gần đây</Text>
            <Text className="mt-1 text-sm text-slate-500">Lịch sử gần nhất để bạn hình dung tần suất và vai trò tham gia của người chơi này.</Text>
          </View>
          {history.length === 0 ? (
            <EmptyState icon="🗓️" title="Chưa tham gia kèo nào" description="Khi người chơi tham gia hoặc host kèo, lịch sử sẽ hiện ở đây." />
          ) : (
            history.map((item) => {
              const cfg = sessionStatusConfig(item.status)
              return (
                <TouchableOpacity
                  key={item.id}
                  className="mb-3"
                  onPress={() => router.push({ pathname: '/session/[id]', params: { id: item.id } })}
                  activeOpacity={0.86}
                >
                  <SectionCard rightSlot={<StatusBadge label={cfg.label} tone={cfg.tone} />}>
                    <Text className="text-sm font-semibold uppercase tracking-[1px] text-slate-400">{formatTime(item.slot?.start_time)}</Text>
                    <Text className="mt-2 text-lg font-extrabold text-slate-950">{item.slot?.court?.name ?? '—'}</Text>
                    <View className="mt-2 flex-row items-center justify-between">
                      <Text className="text-sm text-slate-500">📍 {item.slot?.court?.city}</Text>
                      {item.is_host ? <StatusBadge label="Host" tone="info" /> : null}
                    </View>
                  </SectionCard>
                </TouchableOpacity>
              )
            })
          )}

          <View className="mb-3 mt-2 px-1">
            <Text className="text-lg font-extrabold text-slate-900">Đánh giá từ cộng đồng</Text>
            <Text className="mt-1 text-sm text-slate-500">Những điểm nổi bật mà người chơi khác thường nhắc đến sau trận.</Text>
          </View>
          {sortedTags.length > 0 ? (
            <View className="mb-4 flex-row flex-wrap gap-3">
              {sortedTags.map(([tag, count]) => {
                const meta =
                  BADGE_META[tag] ??
                  {
                    toxic: { emoji: '😡', label: 'Thái độ Toxic' },
                    late: { emoji: '⏰', label: 'Đi muộn' },
                    dishonest: { emoji: '❌', label: 'Gian lận điểm' },
                    good_description: { emoji: '📋', label: 'Đúng mô tả kèo' },
                    well_organized: { emoji: '🗂️', label: 'Tổ chức tốt' },
                    fair_pairing: { emoji: '⚖️', label: 'Xếp cặp công bằng' },
                    court_mismatch: { emoji: '🏟️', label: 'Sân sai mô tả' },
                    poor_organization: { emoji: '⚠️', label: 'Tổ chức kém' },
                  }[tag]
                if (!meta) return null

                return (
                  <View key={tag} className="w-[48%] rounded-[24px] bg-white px-4 py-5 shadow-sm">
                    <Text className="text-3xl">{meta.emoji}</Text>
                    <Text className="mt-3 text-base font-extrabold text-slate-900">{meta.label}</Text>
                    <Text className="mt-1 text-sm text-slate-500">{count} lượt nhắc đến</Text>
                  </View>
                )
              })}
            </View>
          ) : (
            <EmptyState icon="⭐" title="Chưa có đánh giá nào" description="Sau khi chơi thêm vài kèo, phản hồi từ cộng đồng sẽ xuất hiện ở đây." />
          )}

          <Text className="mt-6 text-center text-sm text-slate-400">
            Tham gia từ {new Date(player.created_at).toLocaleDateString('vi-VN')}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
