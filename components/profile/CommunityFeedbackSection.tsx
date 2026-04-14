import type { LucideIcon } from 'lucide-react-native'
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

function toneClasses(tone: FeedbackTone) {
  if (tone === 'positive') {
    return {
      card: 'bg-emerald-50 border border-emerald-100',
      title: 'text-emerald-700',
      count: 'text-emerald-600',
      context: 'text-emerald-700/70',
      icon: '#047857',
      watermark: 'rgba(4, 120, 87, 0.1)',
    }
  }

  return {
    card: 'bg-rose-50 border border-rose-100',
    title: 'text-rose-600',
    count: 'text-rose-500',
    context: 'text-rose-600/70',
    icon: '#e11d48',
    watermark: 'rgba(225, 29, 72, 0.1)',
  }
}

type Props = {
  eyebrow?: string
  title?: string
  traits?: FeedbackTrait[]
}

export function CommunityFeedbackSection({ eyebrow = 'Điểm nổi bật', title = 'Đánh giá từ cộng đồng', traits = [] }: Props) {
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
            <View key={trait.key} className={`relative w-[48%] overflow-hidden rounded-[20px] p-4 flex flex-col ${palette.card}`}>
              <Icon
                size={80}
                color={palette.watermark}
                strokeWidth={1.8}
                style={{ position: 'absolute', right: -16, bottom: -16 }}
              />
              <View className="flex-1 justify-between">
                <View className="relative z-10">
                  <Icon size={28} color={palette.icon} strokeWidth={2.2} />
                </View>
                <View className="mt-6">
                  <Text className={`relative z-10 text-sm font-extrabold ${palette.title}`}>{trait.label}</Text>
                  <Text className={`relative z-10 mt-1 text-[11px] font-bold opacity-75 ${palette.count}`}>{trait.count}</Text>
                  <Text className={`relative z-10 mt-3 text-[11px] leading-5 opacity-80 ${palette.context}`}>{trait.context}</Text>
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
