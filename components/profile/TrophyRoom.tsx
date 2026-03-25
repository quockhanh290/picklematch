import type { LucideIcon } from 'lucide-react-native'
import { Award, Check, Crown, Flame, GraduationCap, Lock, Swords, Trophy } from 'lucide-react-native'
import { Text, View } from 'react-native'

type BadgeTone = 'emerald' | 'amber' | 'rose' | 'sky' | 'violet'

type TrophyBadge = {
  key: string
  title: string
  category: 'progression' | 'performance' | 'momentum' | 'conduct'
  description: string
  requirement: string
  icon: LucideIcon
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
    icon: Award,
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
    icon: Crown,
    tone: 'amber',
    earned: false,
  },
  {
    key: 'giant-slayer',
    title: 'Giant Slayer',
    category: 'performance',
    description: 'Thắng kèo có ngưỡng trình cao hơn bạn ít nhất 100 Elo.',
    requirement: 'Thắng một kèo lệch +100 Elo',
    icon: Swords,
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
    icon: GraduationCap,
    tone: 'sky',
    earned: false,
  },
  {
    key: 'streak-keeper',
    title: 'Lửa không tắt',
    category: 'momentum',
    description: 'Duy trì phong độ và giữ chuỗi thắng đủ dài trong thời gian ngắn.',
    requirement: 'Đạt chuỗi thắng 7 trận',
    icon: Flame,
    tone: 'violet',
    earned: true,
    earnedAt: '24/03/2026',
  },
  {
    key: 'golden-host',
    title: 'Host vàng',
    category: 'conduct',
    description: 'Điểm host xuất sắc, lên kèo rõ ràng và tổ chức rất mượt.',
    requirement: 'Host rating 4.9+',
    icon: Trophy,
    tone: 'emerald',
    earned: true,
    earnedAt: '12/03/2026',
  },
]

function categoryLabel(category: TrophyBadge['category']) {
  switch (category) {
    case 'progression':
      return 'Tiến trình'
    case 'performance':
      return 'Thành tích'
    case 'momentum':
      return 'Phong độ'
    case 'conduct':
      return 'Uy tín'
  }
}

function toneClasses(tone: BadgeTone) {
  switch (tone) {
    case 'emerald':
      return {
        card: 'bg-emerald-50 border-emerald-100',
        text: 'text-emerald-700',
        subtext: 'text-emerald-700/80',
        icon: '#047857',
      }
    case 'amber':
      return {
        card: 'bg-amber-50 border-amber-100',
        text: 'text-amber-700',
        subtext: 'text-amber-700/80',
        icon: '#b45309',
      }
    case 'rose':
      return {
        card: 'bg-rose-50 border-rose-100',
        text: 'text-rose-700',
        subtext: 'text-rose-700/80',
        icon: '#be123c',
      }
    case 'sky':
      return {
        card: 'bg-sky-50 border-sky-100',
        text: 'text-sky-700',
        subtext: 'text-sky-700/80',
        icon: '#0369a1',
      }
    case 'violet':
      return {
        card: 'bg-violet-50 border-violet-100',
        text: 'text-violet-700',
        subtext: 'text-violet-700/80',
        icon: '#6d28d9',
      }
  }
}

export function TrophyRoom() {
  const earnedCount = MOCK_BADGES.filter((badge) => badge.earned).length

  return (
    <View className="gap-4">
      <View className="px-1">
        <Text className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Badges</Text>
        <Text className="mt-2 text-2xl font-black text-slate-900">Trophy Room</Text>
        <Text className="mt-2 text-sm leading-6 text-slate-500">
          {earnedCount}/{MOCK_BADGES.length} danh hiệu đã mở khóa dựa trên phong độ, độ uy tín và chất lượng host.
        </Text>
      </View>

      <View className="flex-row flex-wrap justify-between gap-y-3">
        {MOCK_BADGES.map((badge) => {
          const palette = toneClasses(badge.tone)
          const Icon = badge.icon

          return (
            <View
              key={badge.key}
              className={`w-[48%] rounded-[20px] border p-4 ${
                badge.earned ? `${palette.card} ${palette.text}` : 'border-slate-200 bg-slate-100 text-slate-500 opacity-75'
              }`}
            >
              <View className="flex-1 flex-col">
                <View className="flex-row items-start justify-between">
                  <Icon size={28} color={badge.earned ? palette.icon : '#64748b'} strokeWidth={2.1} />
                  {badge.earned ? <Check size={16} color={palette.icon} /> : <Lock size={16} color="#64748b" />}
                </View>

                <Text className="mt-4 text-[9px] font-extrabold uppercase tracking-widest opacity-60">
                  {categoryLabel(badge.category)}
                </Text>
                <Text className="mt-2 text-sm font-extrabold">{badge.title}</Text>
                <Text className={`mt-2 text-[11px] leading-5 opacity-80 ${badge.earned ? palette.subtext : 'text-slate-500'}`}>
                  {badge.description}
                </Text>

                <View className="mt-4 border-t border-current/10 pt-3">
                  <Text className="text-[11px] font-bold opacity-80">
                    {badge.earned ? `Mở khóa: ${badge.earnedAt}` : `Yêu cầu: ${badge.requirement}`}
                  </Text>
                </View>
              </View>
            </View>
          )
        })}
      </View>
    </View>
  )
}

export default TrophyRoom
