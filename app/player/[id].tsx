import { EmptyState, ScreenHeader, StatusBadge } from '@/components/design'
import CommunityFeedbackPanel from '@/components/profile/CommunityFeedbackSection'
import type { FeedbackTrait } from '@/components/profile/CommunityFeedbackSection'
import {
  ProfileHistoryList,
  ProfileIdentityCard,
  ProfileSkillHero,
  ProfileStatsGrid,
} from '@/components/profile/ProfileSections'
import { getSkillLevelFromElo, getSkillLevelFromPlayer } from '@/lib/skillAssessment'
import { supabase } from '@/lib/supabase'
import { router, useLocalSearchParams } from 'expo-router'
import type { LucideIcon } from 'lucide-react-native'
import {
  AlertTriangle,
  Award,
  CalendarDays,
  CircleAlert,
  ClipboardList,
  Flame,
  Frown,
  MapPin,
  Scale,
  ShieldCheck,
  ShieldQuestion,
  Swords,
  Timer,
  Users,
} from 'lucide-react-native'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const FEEDBACK_META: Record<
  string,
  {
    icon: LucideIcon
    label: string
    context: string
    tone: 'positive' | 'negative'
  }
> = {
  fair_play: {
    icon: Award,
    label: 'Chơi đẹp',
    context: 'Thường được nhắc đến vì fair-play và giữ nhịp trận rất tốt.',
    tone: 'positive',
  },
  on_time: {
    icon: Flame,
    label: 'Đúng giờ',
    context: 'Có mặt đúng hẹn và giữ nhịp vào sân khá ổn định.',
    tone: 'positive',
  },
  friendly: {
    icon: Users,
    label: 'Thân thiện',
    context: 'Tạo cảm giác dễ chơi chung và giao tiếp khá thoải mái.',
    tone: 'positive',
  },
  skilled: {
    icon: Swords,
    label: 'Kỹ thuật tốt',
    context: 'Được đánh giá cao về cảm giác bóng và độ ổn định khi vào trận.',
    tone: 'positive',
  },
  good_description: {
    icon: ClipboardList,
    label: 'Mô tả rõ ràng',
    context: 'Nếu host, người này thường lên kèo rõ và đúng mô tả.',
    tone: 'positive',
  },
  well_organized: {
    icon: ShieldCheck,
    label: 'Tổ chức tốt',
    context: 'Có xu hướng giữ đội hình, lịch và flow trận khá mượt.',
    tone: 'positive',
  },
  fair_pairing: {
    icon: Scale,
    label: 'Xếp cặp công bằng',
    context: 'Thường được ghi nhận ở khả năng cân team khi host.',
    tone: 'positive',
  },
  toxic: {
    icon: Frown,
    label: 'Xấu tính',
    context: 'Đôi lúc phản ứng căng khi trận đấu hoặc tranh điểm nóng lên.',
    tone: 'negative',
  },
  late: {
    icon: Timer,
    label: 'Đến trễ',
    context: 'Có vài phản hồi về việc đến sát giờ hoặc làm đội hình chờ.',
    tone: 'negative',
  },
  dishonest: {
    icon: AlertTriangle,
    label: 'Gian lận điểm',
    context: 'Cần cẩn thận hơn ở các tình huống gọi điểm và xác nhận bóng.',
    tone: 'negative',
  },
  court_mismatch: {
    icon: MapPin,
    label: 'Sân sai mô tả',
    context: 'Nếu host, đôi lúc chất lượng sân thực tế không khớp mô tả ban đầu.',
    tone: 'negative',
  },
  poor_organization: {
    icon: ShieldQuestion,
    label: 'Tổ chức kém',
    context: 'Một số phản hồi cho thấy nhịp tổ chức trận còn thiếu mượt.',
    tone: 'negative',
  },
}

type Player = {
  id: string
  name: string
  city: string
  skill_label: string
  elo: number
  current_elo?: number | null
  self_assessed_level?: string | null
  is_provisional?: boolean | null
  placement_matches_played?: number | null
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

export default function PlayerProfile() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [player, setPlayer] = useState<Player | null>(null)
  const [loading, setLoading] = useState(true)
  const [ratingTags, setRatingTags] = useState<Record<string, number>>({})
  const [history, setHistory] = useState<SessionHistory[]>([])
  const [hostedSessionsCount, setHostedSessionsCount] = useState(0)
  const [favCourts, setFavCourts] = useState<Court[]>([])
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
      data.forEach((rating: any) => {
        rating.tags?.forEach((tag: string) => {
          counts[tag] = (counts[tag] ?? 0) + 1
        })
      })
      setRatingTags(counts)
    }
  }, [])

  const fetchHistory = useCallback(async (playerId: string) => {
    const { data } = await supabase
      .from('session_players')
      .select(
        `
        session:session_id (
          id, status, host_id,
          slot:slot_id (
            start_time,
            court:court_id ( name, city )
          )
        )
      `,
      )
      .eq('player_id', playerId)
      .limit(8)

    if (data) {
      setHistory(
        data
          .map((item: any) => ({
            id: item.session.id,
            status: item.session.status,
            is_host: item.session.host_id === playerId,
            slot: item.session.slot,
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

  const fetchHostedSessionsCount = useCallback(async (playerId: string) => {
    const { count, error } = await supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .eq('host_id', playerId)

    if (error) {
      console.warn('[PlayerProfile] hosted session count query failed:', error.message)
      return
    }

    setHostedSessionsCount(count ?? 0)
  }, [])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    setIsMe(user?.id === id)

    const { data } = await supabase
      .from('players')
      .select(
        'id, name, city, skill_label, self_assessed_level, elo, current_elo, is_provisional, placement_matches_played, sessions_joined, no_show_count, created_at, favorite_court_ids',
      )
      .eq('id', id)
      .single()

    if (data) {
      setPlayer(data)
      await Promise.all([
        fetchRatingTags(data.id),
        fetchHistory(data.id),
        fetchHostedSessionsCount(data.id),
        fetchFavCourts(data.favorite_court_ids ?? []),
      ])
    }
    setLoading(false)
  }, [fetchFavCourts, fetchHistory, fetchHostedSessionsCount, fetchRatingTags, id])

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
    if (score >= 70) return 'text-amber-600'
    return 'text-rose-600'
  }

  function formatTime(start: string) {
    const date = new Date(start)
    const weekday = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][date.getDay()]
    const day = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`
    const hh = date.getHours().toString().padStart(2, '0')
    const mm = date.getMinutes().toString().padStart(2, '0')
    return `${weekday} ${day} · ${hh}:${mm}`
  }

  const communityTraits = useMemo<FeedbackTrait[]>(() => {
    return Object.entries(ratingTags)
      .map(([key, count]) => {
        const meta = FEEDBACK_META[key]
        if (!meta) return null

        return {
          key,
          icon: meta.icon,
          label: meta.label,
          count: `${meta.tone === 'positive' ? '+' : '-'}${count} ghi nhận`,
          context: meta.context,
          tone: meta.tone,
        }
      })
      .filter((item): item is FeedbackTrait => Boolean(item))
      .sort((a, b) => {
        const aCount = Number.parseInt(a.count.replace(/[^\d]/g, ''), 10)
        const bCount = Number.parseInt(b.count.replace(/[^\d]/g, ''), 10)
        return bCount - aCount
      })
      .slice(0, 4)
  }, [ratingTags])

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
        <EmptyState
          icon={<CircleAlert size={28} color="#64748b" />}
          title="Không tìm thấy người chơi"
          description="Thử tải lại hoặc quay về trang trước để kiểm tra danh sách."
        />
      </SafeAreaView>
    )
  }

  const reliability = reliabilityScore(player.sessions_joined ?? 0, player.no_show_count ?? 0)
  const hostedCount = hostedSessionsCount
  const effectiveElo = player.current_elo ?? player.elo
  const calibratedSkill = getSkillLevelFromElo(effectiveElo)
  const fallbackSkill = getSkillLevelFromPlayer(player)
  const skill = calibratedSkill ?? fallbackSkill

  return (
    <SafeAreaView className="flex-1 bg-stone-100" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        <ScreenHeader
          eyebrow="Hồ sơ công khai"
          title={player.name}
          subtitle="Phong cách chơi, độ tin cậy và nhịp tham gia kèo của người chơi này."
          rightSlot={isMe ? <StatusBadge label="Đây là bạn" tone="info" /> : null}
        />

        <View className="px-5">
          <ProfileIdentityCard
            name={player.name}
            city={player.city}
            joinedAt={player.created_at}
            isProvisional={Boolean(player.is_provisional)}
            placementMatchesPlayed={player.placement_matches_played}
            actions={isMe ? [{ label: 'Sửa hồ sơ', icon: 'edit', onPress: () => router.push('/edit-profile' as any) }] : []}
          />

          <ProfileSkillHero
            elo={effectiveElo}
            title={skill.title}
            subtitle={skill.subtitle}
            description={skill.description}
            levelId={skill.id}
          />

          <ProfileStatsGrid
            reliability={reliability === null ? 'Mới' : `${reliability}%`}
            reliabilityToneClass={reliabilityValueClass(reliability)}
            reliabilityDescription="Dựa trên số trận đã chơi, tỷ lệ no-show và cách người này hoàn tất các kèo đã tham gia."
            played={player.sessions_joined ?? 0}
            hosted={hostedCount}
          />

          {favCourts.length > 0 ? (
            <View className="mt-6 rounded-[24px] border border-slate-200 bg-white p-5">
              <Text className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Favorite Courts</Text>
              <Text className="mt-2 text-2xl font-black text-slate-900">Sân hay chơi</Text>
              <View className="mt-4 gap-3">
                {favCourts.map((court) => (
                  <View key={court.id} className="rounded-[20px] bg-slate-50 p-4">
                    <Text className="text-sm font-extrabold text-slate-900">{court.name}</Text>
                    <View className="mt-2 flex-row items-center">
                      <MapPin size={12} color="#94a3b8" />
                      <Text className="ml-1 text-xs font-semibold text-slate-500">{court.city}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          <View className="mt-6">
            {communityTraits.length > 0 ? (
              <CommunityFeedbackPanel eyebrow="Top Traits" title="Community Feedback" traits={communityTraits} />
            ) : (
              <EmptyState
                icon={<ClipboardList size={28} color="#64748b" />}
                title="Chưa có đánh giá nào"
                description="Sau khi chơi thêm vài kèo, phản hồi từ cộng đồng sẽ xuất hiện ở đây."
              />
            )}
          </View>

          {history.length === 0 ? (
            <View className="mt-4">
              <EmptyState
                icon={<CalendarDays size={28} color="#64748b" />}
                title="Chưa tham gia kèo nào"
                description="Khi người chơi tham gia hoặc host kèo, lịch sử sẽ hiện ở đây."
              />
            </View>
          ) : (
            <ProfileHistoryList
              title="Lịch sử kèo"
              subtitle="Danh sách kèo gần nhất để bạn hình dung nhịp chơi và tần suất xuất hiện của người này."
              items={history}
              formatTime={formatTime}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
