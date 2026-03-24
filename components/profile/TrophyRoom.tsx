import { AppChip, SectionCard, StatusBadge } from '@/components/design'
import {
  Award,
  Clock3,
  Crown,
  Flame,
  LockKeyhole,
  Medal,
  ShieldCheck,
  Swords,
  Trophy,
  UserRoundCheck,
} from 'lucide-react-native'
import { Text, View } from 'react-native'

type BadgeTone = 'emerald' | 'amber' | 'rose' | 'sky' | 'violet' | 'slate'

type TrophyBadge = {
  key: string
  title: string
  category: 'progression' | 'performance' | 'momentum' | 'conduct'
  description: string
  requirement: string
  icon: 'trophy' | 'medal' | 'swords' | 'flame' | 'clock' | 'shield' | 'crown' | 'award' | 'user-check'
  tone: BadgeTone
  earned: boolean
  earnedAt?: string
}

const MOCK_BADGES: TrophyBadge[] = [
  {
    key: 'active-member',
    title: 'Hội viên tích cực',
    category: 'progression',
    description: 'Hoàn thành 20 trận và luôn xuất hiện đều đặn trên sân.',
    requirement: 'Chơi đủ 20 trận',
    icon: 'medal',
    tone: 'emerald',
    earned: true,
    earnedAt: '18/03/2026',
  },
  {
    key: 'court-warrior',
    title: 'Chiến thần sân bãi',
    category: 'progression',
    description: 'Cán mốc 100 trận đã hoàn thành trên PickleMatch.',
    requirement: 'Chơi đủ 100 trận',
    icon: 'crown',
    tone: 'amber',
    earned: false,
  },
  {
    key: 'giant-slayer',
    title: 'Giant Slayer',
    category: 'performance',
    description: 'Thắng kèo có ngưỡng trình cao hơn bạn ít nhất 100 Elo.',
    requirement: 'Thắng một kèo lệch +100 Elo',
    icon: 'swords',
    tone: 'rose',
    earned: true,
    earnedAt: '06/03/2026',
  },
  {
    key: 'placement-perfect',
    title: 'Tốt nghiệp xuất sắc',
    category: 'performance',
    description: 'Thắng trọn 5/5 trận placement với tỷ lệ thắng tuyệt đối.',
    requirement: '100% win rate trong 5 placement matches',
    icon: 'award',
    tone: 'sky',
    earned: false,
  },
  {
    key: 'win-streak',
    title: 'Win Streak 🔥',
    category: 'momentum',
    description: 'Lửa sẽ sáng ở 3 trận thắng liên tiếp và bùng mạnh hơn ở mốc 7.',
    requirement: 'Chuỗi thắng từ 3 trận',
    icon: 'flame',
    tone: 'amber',
    earned: true,
    earnedAt: '24/03/2026',
  },
  {
    key: 'swiss-clock',
    title: 'Đồng hồ Thụy Sĩ',
    category: 'conduct',
    description: 'Giữ 100% reliability trong 30 ngày gần nhất.',
    requirement: '100% Reliability trong 30 ngày',
    icon: 'clock',
    tone: 'violet',
    earned: false,
  },
  {
    key: 'golden-host',
    title: 'Host Vàng',
    category: 'conduct',
    description: 'Điểm host xuất sắc, lên kèo rõ ràng và tổ chức rất mượt.',
    requirement: 'Host rating 4.9+',
    icon: 'shield',
    tone: 'emerald',
    earned: true,
    earnedAt: '12/03/2026',
  },
]

const MOCK_STREAK = {
  current: 5,
  max: 8,
  active: true,
  decayInDays: 6,
}

function iconToneClasses(tone: BadgeTone, earned: boolean) {
  if (!earned) {
    return {
      wrap: 'bg-slate-100 border border-slate-200',
      icon: '#94a3b8',
    }
  }

  switch (tone) {
    case 'emerald':
      return { wrap: 'bg-emerald-50 border border-emerald-100', icon: '#059669' }
    case 'amber':
      return { wrap: 'bg-amber-50 border border-amber-100', icon: '#d97706' }
    case 'rose':
      return { wrap: 'bg-rose-50 border border-rose-100', icon: '#e11d48' }
    case 'sky':
      return { wrap: 'bg-sky-50 border border-sky-100', icon: '#0284c7' }
    case 'violet':
      return { wrap: 'bg-violet-50 border border-violet-100', icon: '#7c3aed' }
    default:
      return { wrap: 'bg-slate-50 border border-slate-100', icon: '#334155' }
  }
}

function BadgeIcon({ icon, color }: { icon: TrophyBadge['icon']; color: string }) {
  const props = { size: 20, color, strokeWidth: 2.2 }

  switch (icon) {
    case 'medal':
      return <Medal {...props} />
    case 'crown':
      return <Crown {...props} />
    case 'swords':
      return <Swords {...props} />
    case 'flame':
      return <Flame {...props} />
    case 'clock':
      return <Clock3 {...props} />
    case 'shield':
      return <ShieldCheck {...props} />
    case 'award':
      return <Award {...props} />
    case 'user-check':
      return <UserRoundCheck {...props} />
    default:
      return <Trophy {...props} />
  }
}

function categoryLabel(category: TrophyBadge['category']) {
  switch (category) {
    case 'progression':
      return 'Tiến trình'
    case 'performance':
      return 'Thành tích'
    case 'momentum':
      return 'Phong độ'
    case 'conduct':
      return 'Hành vi'
  }
}

export function TrophyRoom() {
  const earnedCount = MOCK_BADGES.filter((badge) => badge.earned).length

  return (
    <View className="gap-4">
      <SectionCard
        title="Trophy Room"
        subtitle="Danh hiệu mở khóa theo trận đấu, phong độ, độ uy tín và chất lượng host."
      >
        <View className="flex-row flex-wrap gap-2">
          <AppChip label={`${earnedCount} đã mở khóa`} tone="success" active />
          <AppChip label={`${MOCK_BADGES.length - earnedCount} chưa đạt`} tone="neutral" active />
        </View>
      </SectionCard>

      <SectionCard title="Win Streak" subtitle="Chuỗi thắng sẽ tắt nếu bạn nghỉ sân quá 14 ngày.">
        <View
          className={`rounded-[24px] border px-5 py-5 ${
            MOCK_STREAK.active ? 'border-orange-200 bg-orange-50' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-xs font-extrabold uppercase tracking-[1.2px] text-slate-500">Momentum</Text>
              <Text className="mt-2 text-3xl font-black text-slate-950">
                {MOCK_STREAK.active ? `🔥 ${MOCK_STREAK.current}` : '🔥 0'}
              </Text>
              <Text className="mt-2 text-sm leading-6 text-slate-600">
                {MOCK_STREAK.active
                  ? `Chuỗi đang hoạt động. Còn ${MOCK_STREAK.decayInDays} ngày trước khi bị decay nếu không chơi tiếp.`
                  : 'Chuỗi hiện không hoạt động. Chơi lại để kích hoạt lửa từ mốc 3 trận thắng.'}
              </Text>
            </View>
            <View className="rounded-full bg-white px-4 py-2">
              <Text className="text-xs font-extrabold uppercase tracking-[1px] text-slate-500">Max</Text>
              <Text className="mt-1 text-lg font-black text-slate-950">{MOCK_STREAK.max}</Text>
            </View>
          </View>
        </View>
      </SectionCard>

      <View className="gap-4">
        {MOCK_BADGES.map((badge) => {
          const palette = iconToneClasses(badge.tone, badge.earned)

          return (
            <SectionCard key={badge.key} className={badge.earned ? '' : 'opacity-60'}>
              <View className="flex-row items-start gap-4">
                <View className={`h-14 w-14 items-center justify-center rounded-[18px] ${palette.wrap}`}>
                  <BadgeIcon icon={badge.icon} color={palette.icon} />
                </View>

                <View className="flex-1">
                  <View className="flex-row flex-wrap items-center gap-2">
                    <Text className="flex-1 text-base font-black text-slate-950">{badge.title}</Text>
                    {badge.earned ? (
                      <StatusBadge label="Đã đạt" tone="success" />
                    ) : (
                      <View className="flex-row items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5">
                        <LockKeyhole size={12} color="#64748b" />
                        <Text className="text-xs font-bold text-slate-500">Đang khóa</Text>
                      </View>
                    )}
                  </View>

                  <Text className="mt-2 text-xs font-extrabold uppercase tracking-[1.1px] text-slate-500">
                    {categoryLabel(badge.category)}
                  </Text>

                  <Text className="mt-2 text-sm leading-6 text-slate-600">{badge.description}</Text>

                  <View className="mt-4 rounded-[18px] bg-slate-50 px-4 py-3">
                    {badge.earned ? (
                      <Text className="text-sm font-semibold text-slate-700">Earned on {badge.earnedAt}</Text>
                    ) : (
                      <Text className="text-sm font-semibold text-slate-700">Requirement: {badge.requirement}</Text>
                    )}
                  </View>
                </View>
              </View>
            </SectionCard>
          )
        })}
      </View>
    </View>
  )
}

export default TrophyRoom
