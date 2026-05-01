import type { FeedbackTrait } from '@/components/profile/CommunityFeedbackSection'
import type { TrophyBadge } from '@/components/profile/TrophyRoom'
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

export function calculateReliabilityScore(
  sessionsJoined?: number | null,
  noShowCount?: number | null,
  explicitReliabilityScore?: number | null,
) {
  if (explicitReliabilityScore != null) return Math.round(explicitReliabilityScore)
  if (!sessionsJoined) return null
  return Math.round(((sessionsJoined - (noShowCount ?? 0)) / sessionsJoined) * 100)
}

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
