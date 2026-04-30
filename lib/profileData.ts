import type { FeedbackTrait } from '@/components/profile/CommunityFeedbackSection'
import type { TrophyBadge } from '@/components/profile/TrophyRoom'
import { supabase } from '@/lib/supabase'
import type { LucideIcon } from 'lucide-react-native'
import {
  AlertTriangle,
  Award,
  ClipboardList,
  Flame,
  Frown,
  GraduationCap,
  MapPin,
  Scale,
  ShieldCheck,
  ShieldQuestion,
  Swords,
  Timer,
  Trophy,
  Users,
} from 'lucide-react-native'

export const FEEDBACK_META: Record<
  string,
  {
    icon: LucideIcon
    label: string
    context: string
    tone: 'positive' | 'negative'
  }
> = {
  fair_play: { icon: Award, label: 'Chơi đẹp', context: 'Thường được nhắc đến vì fair-play và giữ nhịp trận rất tốt.', tone: 'positive' },
  on_time: { icon: Flame, label: 'Đúng giờ', context: 'Có mặt đúng hẹn và giữ nhịp vào sân khá ổn định.', tone: 'positive' },
  friendly: { icon: Users, label: 'Thân thiện', context: 'Tạo cảm giác dễ chơi chung và giao tiếp khá thoải mái.', tone: 'positive' },
  skilled: { icon: Swords, label: 'Kỹ thuật tốt', context: 'Được đánh giá cao về cảm giác bóng và độ ổn định khi vào trận.', tone: 'positive' },
  good_description: { icon: ClipboardList, label: 'Mô tả rõ ràng', context: 'Nếu là chủ kèo, người này thường lên kèo rõ và đúng mô tả.', tone: 'positive' },
  well_organized: { icon: ShieldCheck, label: 'Tổ chức tốt', context: 'Có xu hướng giữ đội hình, lịch và flow trận khá mượt.', tone: 'positive' },
  fair_pairing: { icon: Scale, label: 'Xếp cặp công bằng', context: 'Thường được ghi nhận ở khả năng cân đội khi làm chủ kèo.', tone: 'positive' },
  toxic: { icon: Frown, label: 'Xấu tính', context: 'Đôi lúc phản ứng căng khi trận đấu hoặc tranh điểm nóng lên.', tone: 'negative' },
  late: { icon: Timer, label: 'Đến trễ', context: 'Có vài phản hồi về việc đến sát giờ hoặc làm đội hình chờ.', tone: 'negative' },
  dishonest: { icon: AlertTriangle, label: 'Gian lận điểm', context: 'Cần cẩn thận hơn ở các tình huống gọi điểm và xác nhận bóng.', tone: 'negative' },
  court_mismatch: { icon: MapPin, label: 'Sân sai mô tả', context: 'Nếu là chủ kèo, đôi lúc chất lượng sân thực tế không khớp mô tả ban đầu.', tone: 'negative' },
  poor_organization: { icon: ShieldQuestion, label: 'Tổ chức kém', context: 'Một số phản hồi cho thấy nhịp tổ chức trận còn thiếu mượt.', tone: 'negative' },
}

export const BADGE_REQUIREMENTS: Record<string, string> = {
  active_member_20: 'Chơi đủ 20 trận',
  giant_slayer: 'Thắng một kèo lệch +100 Elo',
  golden_host: 'Chủ kèo được đánh giá 4.9+',
  win_streak_3: 'Đạt chuỗi thắng 3 trận',
}

export type ProfilePlayer = {
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
  bio?: string | null
}

export type ProfilePlayerStats = {
  current_win_streak: number
  streak_fire_active: boolean
}

export type ProfileSessionHistory = {
  id: string
  status: string
  is_host: boolean
  slot: {
    start_time: string
    end_time: string
    court: { name: string; city: string }
  }
}

export function calculateReliabilityScore(
  sessionsJoined?: number | null,
  noShowCount?: number | null,
  explicitReliabilityScore?: number | null,
) {
  if (explicitReliabilityScore != null) return Math.round(explicitReliabilityScore)
  if (!sessionsJoined) return null
  return Math.round(((sessionsJoined - (noShowCount ?? 0)) / sessionsJoined) * 100)
}

type ProfileAchievementRow = {
  badge_key: string
  badge_title: string
  badge_category: TrophyBadge['category']
  badge_description: string | null
  icon: string | null
  earned_at: string
  meta?: { requirement?: string } | null
}

type ProfileDataSnapshot = {
  loggedIn: boolean
  player: ProfilePlayer | null
  playerStats: ProfilePlayerStats | null
  ratingTags: Record<string, number>
  achievements: TrophyBadge[]
  history: ProfileSessionHistory[]
  hostedSessionsCount: number
}

let profileDataCache:
  | {
      userId: string
      updatedAt: number
      snapshot: ProfileDataSnapshot
    }
  | null = null

const PROFILE_CACHE_FRESH_MS = 30_000

export function getBadgeIcon(iconName?: string | null): LucideIcon {
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

export function getBadgeTone(category: TrophyBadge['category']): TrophyBadge['tone'] {
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

export function formatBadgeDate(dateString: string) {
  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return ''
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  return `${day}/${month}/${year}`
}

export function buildCommunityTraits(ratingTags: Record<string, number>) {
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
}

export async function fetchCurrentPlayerProfileData(options?: { force?: boolean }): Promise<ProfileDataSnapshot> {
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { loggedIn: false, player: null, playerStats: null, ratingTags: {}, achievements: [], history: [], hostedSessionsCount: 0 }
  }

  if (!options?.force && profileDataCache?.userId === user.id && Date.now() - profileDataCache.updatedAt < PROFILE_CACHE_FRESH_MS) {
    return profileDataCache.snapshot
  }

  const nowIso = new Date().toISOString()
  const [playerRes, statsRes, ratingsRes, achievementsRes, historyRes, hostedCountRes] = await Promise.all([
    supabase.from('players').select('*').eq('id', user.id).single(),
    supabase.from('player_stats').select('current_win_streak, streak_fire_active').eq('player_id', user.id).maybeSingle(),
    supabase.from('ratings').select('tags, is_hidden, reveal_at').eq('rated_id', user.id).or(`is_hidden.eq.false,reveal_at.lte.${nowIso}`),
    supabase.from('player_achievements').select('badge_key, badge_title, badge_category, badge_description, icon, earned_at, meta').eq('player_id', user.id).order('earned_at', { ascending: false }),
    supabase.from('session_players').select(`
        status,
        session:session_id (
          id, status, host_id,
          slot:slot_id (
            start_time, end_time,
            court:court_id ( name, city )
          )
        )
      `).eq('player_id', user.id).limit(20),
    supabase.from('sessions').select('id', { count: 'exact', head: true }).eq('host_id', user.id),
  ])

  if (statsRes.error) console.warn('[Profile] player stats query failed:', statsRes.error.message)
  if (ratingsRes.error) console.warn('[Profile] ratings query failed:', ratingsRes.error.message)
  if (achievementsRes.error) console.warn('[Profile] achievements query failed:', achievementsRes.error.message)
  if (historyRes.error) console.warn('[Profile] session history query failed:', historyRes.error.message)
  if (hostedCountRes.error) console.warn('[Profile] hosted session count query failed:', hostedCountRes.error.message)

  const ratingTags: Record<string, number> = {}
  ;(ratingsRes.data ?? []).forEach((rating: any) => {
    rating.tags?.forEach((tag: string) => {
      ratingTags[tag] = (ratingTags[tag] ?? 0) + 1
    })
  })

  const achievements = ((achievementsRes.data ?? []) as ProfileAchievementRow[]).map((badge) => ({
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

  const history = ((historyRes.data ?? []) as any[])
    .map((item) => ({
      id: item.session.id,
      status: item.session.status,
      is_host: item.session.host_id === user.id,
      slot: item.session.slot,
    }))
    .sort((a: ProfileSessionHistory, b: ProfileSessionHistory) => new Date(b.slot.start_time).getTime() - new Date(a.slot.start_time).getTime())

  const snapshot: ProfileDataSnapshot = {
    loggedIn: true,
    player: (playerRes.data as ProfilePlayer | null) ?? null,
    playerStats: (statsRes.data ?? null) as ProfilePlayerStats | null,
    ratingTags,
    achievements,
    history,
    hostedSessionsCount: hostedCountRes.count ?? 0,
  }

  profileDataCache = { userId: user.id, updatedAt: Date.now(), snapshot }
  return snapshot
}

export function clearCurrentPlayerProfileCache() {
  profileDataCache = null
}
