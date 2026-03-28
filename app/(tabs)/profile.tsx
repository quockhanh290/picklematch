import { AppButton, EmptyState, ScreenHeader } from '@/components/design'
import CommunityFeedbackPanel from '@/components/profile/CommunityFeedbackSection'
import type { FeedbackTrait } from '@/components/profile/CommunityFeedbackSection'
import {
  ProfileHistoryList,
  ProfileIdentityCard,
  ProfileSkillHero,
  ProfileStatsGrid,
  ProfileWinStreak,
} from '@/components/profile/ProfileSections'
import TrophyRoomSection from '@/components/profile/TrophyRoom'
import type { TrophyBadge } from '@/components/profile/TrophyRoom'
import { getSkillLevelFromElo, getSkillLevelFromPlayer } from '@/lib/skillAssessment'
import { supabase } from '@/lib/supabase'
import { useAppTheme } from '@/lib/theme-context'
import { router, useFocusEffect } from 'expo-router'
import type { LucideIcon } from 'lucide-react-native'
import {
  Award,
  CalendarDays,
  CircleAlert,
  ClipboardList,
  Flame,
  Frown,
  GraduationCap,
  LogOut,
  MapPin,
  Scale,
  ShieldCheck,
  ShieldQuestion,
  Swords,
  Timer,
  Trophy,
  UserCircle2,
  Users,
} from 'lucide-react-native'
import { useCallback, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native'
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
    icon: Award,
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
  phone: string
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
}

type PlayerStats = {
  current_win_streak: number
  streak_fire_active: boolean
}

type PlayerAchievementRow = {
  badge_key: string
  badge_title: string
  badge_category: TrophyBadge['category']
  badge_description: string | null
  icon: string | null
  earned_at: string
  meta?: { requirement?: string } | null
}

type SessionHistory = {
  id: string
  status: string
  is_host: boolean
  slot: {
    start_time: string
    end_time: string
    court: { name: string; city: string }
  }
}

const BADGE_REQUIREMENTS: Record<string, string> = {
  active_member_20: 'Chơi đủ 20 trận',
  giant_slayer: 'Thắng một kèo lệch +100 Elo',
  golden_host: 'Host rating 4.9+',
  win_streak_3: 'Đạt chuỗi thắng 3 trận',
}

function getBadgeIcon(iconName?: string | null): LucideIcon {
  switch (iconName) {
    case 'flame':
      return Flame
    case 'swords':
      return Swords
    case 'shield':
      return ShieldCheck
    case 'graduation-cap':
      return GraduationCap
    case 'trophy':
      return Trophy
    default:
      return Award
  }
}

function getBadgeTone(category: TrophyBadge['category']): TrophyBadge['tone'] {
  switch (category) {
    case 'progression':
      return 'emerald'
    case 'performance':
      return 'rose'
    case 'momentum':
      return 'violet'
    case 'conduct':
      return 'amber'
  }
}

function formatBadgeDate(dateString: string) {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return ''
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

export default function ProfileScreen() {
  const theme = useAppTheme()
  const [checking, setChecking] = useState(true)
  const [loggedIn, setLoggedIn] = useState(false)
  const [player, setPlayer] = useState<Player | null>(null)
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null)
  const [ratingTags, setRatingTags] = useState<Record<string, number>>({})
  const [achievements, setAchievements] = useState<TrophyBadge[]>([])
  const [history, setHistory] = useState<SessionHistory[]>([])
  const [hostedSessionsCount, setHostedSessionsCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchPlayer = useCallback(async (userId: string) => {
    const { data } = await supabase.from('players').select('*').eq('id', userId).single()
    if (data) setPlayer(data)
  }, [])

  const fetchPlayerStats = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('player_stats')
      .select('current_win_streak, streak_fire_active')
      .eq('player_id', userId)
      .maybeSingle()

    if (error) {
      console.warn('[Profile] player stats query failed:', error.message)
      return
    }

    setPlayerStats((data ?? null) as PlayerStats | null)
  }, [])

  const fetchRatingTags = useCallback(async (userId: string) => {
    const nowIso = new Date().toISOString()
    const { data, error } = await supabase
      .from('ratings')
      .select('tags, is_hidden, reveal_at')
      .eq('rated_id', userId)
      .or(`is_hidden.eq.false,reveal_at.lte.${nowIso}`)

    if (error) {
      console.warn('[Profile] ratings query failed:', error.message)
      return
    }

    const counts: Record<string, number> = {}
    ;(data ?? []).forEach((rating: any) => {
      rating.tags?.forEach((tag: string) => {
        counts[tag] = (counts[tag] ?? 0) + 1
      })
    })

    setRatingTags(counts)
  }, [])

  const fetchAchievements = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('player_achievements')
      .select('badge_key, badge_title, badge_category, badge_description, icon, earned_at, meta')
      .eq('player_id', userId)
      .order('earned_at', { ascending: false })

    if (error) {
      console.warn('[Profile] achievements query failed:', error.message)
      return
    }

    const mapped = ((data ?? []) as PlayerAchievementRow[]).map((badge) => ({
      key: badge.badge_key,
      title: badge.badge_title,
      category: badge.badge_category,
      description: badge.badge_description ?? 'Danh hiệu mở khóa từ kết quả và uy tín trong hệ thống.',
      requirement: badge.meta?.requirement ?? BADGE_REQUIREMENTS[badge.badge_key] ?? 'Đạt mốc hệ thống',
      icon: getBadgeIcon(badge.icon),
      tone: getBadgeTone(badge.badge_category),
      earned: true,
      earnedAt: formatBadgeDate(badge.earned_at),
    }))

    setAchievements(mapped)
  }, [])

  const fetchHistory = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('session_players')
      .select(
        `
        status,
        session:session_id (
          id, status, host_id,
          slot:slot_id (
            start_time, end_time,
            court:court_id ( name, city )
          )
        )
      `,
      )
      .eq('player_id', userId)
      .limit(20)

    if (error) {
      console.warn('[Profile] session history query failed:', error.message)
      return
    }

    if (data) {
      const mapped = data
        .map((item: any) => ({
          id: item.session.id,
          status: item.session.status,
          is_host: item.session.host_id === userId,
          slot: item.session.slot,
        }))
        .sort((a: SessionHistory, b: SessionHistory) => new Date(b.slot.start_time).getTime() - new Date(a.slot.start_time).getTime())

      setHistory(mapped)
    }
  }, [])

  const fetchHostedSessionsCount = useCallback(async (userId: string) => {
    const { count, error } = await supabase
      .from('sessions')
      .select('id', { count: 'exact', head: true })
      .eq('host_id', userId)

    if (error) {
      console.warn('[Profile] hosted session count query failed:', error.message)
      return
    }

    setHostedSessionsCount(count ?? 0)
  }, [])

  const init = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setLoggedIn(false)
      setPlayer(null)
      setPlayerStats(null)
      setRatingTags({})
      setAchievements([])
      setHistory([])
      setHostedSessionsCount(0)
      setChecking(false)
      return
    }

    setLoggedIn(true)
    setLoading(true)
    await Promise.all([
      fetchPlayer(user.id),
      fetchPlayerStats(user.id),
      fetchRatingTags(user.id),
      fetchAchievements(user.id),
      fetchHistory(user.id),
      fetchHostedSessionsCount(user.id),
    ])
    setLoading(false)
    setChecking(false)
  }, [fetchAchievements, fetchHistory, fetchHostedSessionsCount, fetchPlayer, fetchPlayerStats, fetchRatingTags])

  useFocusEffect(
    useCallback(() => {
      void init()
    }, [init]),
  )

  async function logout() {
    Alert.alert('Đăng xuất?', 'Bạn chắc muốn đăng xuất không?', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut()
          setLoggedIn(false)
          setPlayer(null)
          setPlayerStats(null)
          setRatingTags({})
          setAchievements([])
          setHistory([])
          setHostedSessionsCount(0)
          router.replace('/(tabs)')
        },
      },
    ])
  }

  function formatTime(start: string) {
    const date = new Date(start)
    const weekday = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][date.getDay()]
    const day = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`
    const hh = date.getHours().toString().padStart(2, '0')
    const mm = date.getMinutes().toString().padStart(2, '0')
    return `${weekday} ${day} · ${hh}:${mm}`
  }

  function reliabilityScore() {
    if (!player || !player.sessions_joined) return null
    return Math.round(((player.sessions_joined - player.no_show_count) / player.sessions_joined) * 100)
  }

  function reliabilityTone(score: number | null) {
    if (score === null) return 'text-slate-700'
    if (score >= 90) return 'text-emerald-700'
    if (score >= 70) return 'text-amber-600'
    return 'text-rose-600'
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

  if (checking) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center" style={{ backgroundColor: theme.backgroundMuted }} edges={['top']}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    )
  }

  if (!loggedIn) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: theme.backgroundMuted }} edges={['top']}>
        <ScreenHeader
          eyebrow="Hồ sơ"
          title="Tài khoản của bạn"
          subtitle="Đăng nhập để xem lịch sử kèo, độ tin cậy và tiến trình placement."
        />
        <EmptyState
          icon={<UserCircle2 size={28} color="#64748b" />}
          title="Đăng nhập để xem hồ sơ"
          description="Quản lý thông tin cá nhân và lịch sử tham gia kèo của bạn ở một nơi gọn gàng hơn."
        />
        <View className="mt-6 gap-3 px-5">
          <AppButton label="Đăng nhập" onPress={() => router.push('/login' as any)} />
          <AppButton label="Về trang chủ" onPress={() => router.replace('/(tabs)')} variant="secondary" />
        </View>
      </SafeAreaView>
    )
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center" style={{ backgroundColor: theme.backgroundMuted }} edges={['top']}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    )
  }

  if (!player) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: theme.backgroundMuted }} edges={['top']}>
        <EmptyState
          icon={<CircleAlert size={28} color="#64748b" />}
          title="Không tìm thấy hồ sơ"
          description="Thử tải lại hoặc đăng nhập lại để tiếp tục."
        />
      </SafeAreaView>
    )
  }

  const effectiveElo = player.current_elo ?? player.elo
  const calibratedSkill = getSkillLevelFromElo(effectiveElo)
  const fallbackSkill = getSkillLevelFromPlayer(player)
  const skill = calibratedSkill ?? fallbackSkill
  const reliability = reliabilityScore()
  const hostedCount = hostedSessionsCount
  const placementPlayed = player.placement_matches_played ?? 0
  const currentWinStreak = playerStats?.current_win_streak ?? 0
  const streakActive = playerStats?.streak_fire_active ?? currentWinStreak > 0

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.backgroundMuted }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        <ScreenHeader
          eyebrow="Hồ sơ cá nhân"
          title="Profile"
          subtitle="Theo dõi trình độ, độ tin cậy và những tín hiệu cộng đồng quanh tài khoản của bạn."
        />

        <View className="px-5">
          <ProfileIdentityCard
            name={player.name}
            city={player.city}
            joinedAt={player.created_at}
            isProvisional={Boolean(player.is_provisional)}
            placementMatchesPlayed={placementPlayed}
            actions={[{ label: 'Sửa hồ sơ', icon: 'edit', onPress: () => router.push('/edit-profile' as any) }]}
          />

          <ProfileSkillHero
            elo={effectiveElo}
            title={skill?.title ?? 'Đang hiệu chỉnh'}
            subtitle={skill?.subtitle ?? 'Dữ liệu trình độ sẽ rõ hơn sau thêm vài trận.'}
            description={skill?.description ?? 'Hệ thống đang dùng Elo và tín hiệu sau trận để tinh chỉnh nhịp ghép kèo phù hợp hơn.'}
            levelId={skill?.id}
          />

          <ProfileWinStreak current={currentWinStreak} active={streakActive} />

          <ProfileStatsGrid
            reliability={reliability === null ? 'Mới' : `${reliability}%`}
            reliabilityToneClass={reliabilityTone(reliability)}
            reliabilityDescription="Độ tin cậy hiện tại dựa trên số trận đã chơi, no-show và tần suất hoàn tất kèo đúng nhịp."
            played={player.sessions_joined ?? 0}
            hosted={hostedCount}
          />

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

          <View className="mt-6">
            {achievements.length > 0 ? (
              <TrophyRoomSection badges={achievements} />
            ) : (
              <EmptyState
                icon={<Trophy size={28} color="#64748b" />}
                title="Chưa mở khoá danh hiệu nào"
                description="Khi đạt các mốc về phong độ, host uy tín hoặc thành tích, Trophy Room sẽ cập nhật tại đây."
              />
            )}
          </View>

          {history.length === 0 ? (
            <View className="mt-4">
              <EmptyState
                icon={<CalendarDays size={28} color="#64748b" />}
                title="Chưa có kèo nào"
                description="Khi bạn tham gia hoặc tạo kèo, lịch sử sẽ hiện ở đây."
              />
            </View>
          ) : (
            <ProfileHistoryList
              title="Lịch sử kèo"
              subtitle="Danh sách kèo gần nhất bạn đã host hoặc tham gia."
              items={history}
              formatTime={formatTime}
              showRateAction
            />
          )}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={logout}
            className="mt-6 flex-row items-center justify-center rounded-[18px] px-5 py-4"
            style={{ borderWidth: 1, borderColor: theme.dangerSoft, backgroundColor: theme.surface }}
          >
            <LogOut size={16} color={theme.danger} />
            <Text className="ml-2 text-sm font-bold text-rose-700">Đăng xuất</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
