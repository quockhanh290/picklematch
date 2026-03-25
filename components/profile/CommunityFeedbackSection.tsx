import type { LucideIcon } from 'lucide-react-native'
import { Award, Flame, Frown, Timer } from 'lucide-react-native'
import { Text, View } from 'react-native'

type FeedbackTone = 'positive' | 'negative'

export type FeedbackTrait = {
  key: string
  icon: LucideIcon
  label: string
  count: string
  context: string
  tone: FeedbackTone
}

const MOCK_TRAITS: FeedbackTrait[] = [
  {
    key: 'fair-play',
    icon: Award,
    label: 'Chơi đẹp',
    count: '+18 ghi nhận',
    context: 'Thường được đánh giá fair-play và giữ nhịp trận rất tốt.',
    tone: 'positive',
  },
  {
    key: 'on-time',
    icon: Flame,
    label: 'Đúng giờ',
    count: '+14 ghi nhận',
    context: 'Có mặt sớm, vào sân đúng giờ và không làm trễ kèo.',
    tone: 'positive',
  },
  {
    key: 'toxic',
    icon: Frown,
    label: 'Toxic',
    count: '-2 cảnh báo',
    context: 'Đôi lúc phản ứng gắt khi trận đấu căng hoặc tranh điểm.',
    tone: 'negative',
  },
  {
    key: 'late',
    icon: Timer,
    label: 'Đi muộn',
    count: '-1 cảnh báo',
    context: 'Có vài lần đến sát giờ làm host phải chờ đội hình.',
    tone: 'negative',
  },
]

function toneClasses(tone: FeedbackTone) {
  if (tone === 'positive') {
    return {
      card: 'bg-emerald-50',
      title: 'text-emerald-700',
      count: 'text-emerald-600',
      context: 'text-emerald-700/70',
      icon: '#047857',
    }
  }

  return {
    card: 'bg-rose-50',
    title: 'text-rose-600',
    count: 'text-rose-500',
    context: 'text-rose-600/70',
    icon: '#e11d48',
  }
}

type Props = {
  eyebrow?: string
  title?: string
  traits?: FeedbackTrait[]
}

export function CommunityFeedbackSection({
  eyebrow = 'Top Traits',
  title = 'Community Feedback',
  traits = MOCK_TRAITS,
}: Props) {
  return (
    <View className="gap-4">
      <View className="px-1">
        <Text className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">{eyebrow}</Text>
        <Text className="mt-2 text-2xl font-black text-slate-900">{title}</Text>
      </View>

      <View className="flex-row flex-wrap justify-between gap-y-3">
        {traits.map((trait) => {
          const palette = toneClasses(trait.tone)
          const Icon = trait.icon

          return (
            <View key={trait.key} className={`w-[48%] rounded-[20px] p-4 ${palette.card}`}>
              <View className="flex-1 justify-between">
                <Icon size={28} color={palette.icon} strokeWidth={2.2} />
                <View className="mt-6">
                  <Text className={`text-sm font-extrabold ${palette.title}`}>{trait.label}</Text>
                  <Text className={`mt-1 text-[11px] font-bold opacity-75 ${palette.count}`}>{trait.count}</Text>
                  <Text className={`mt-3 text-[11px] leading-5 opacity-80 ${palette.context}`}>{trait.context}</Text>
                </View>
              </View>
            </View>
          )
        })}
      </View>
    </View>
  )
}

export default CommunityFeedbackSection
