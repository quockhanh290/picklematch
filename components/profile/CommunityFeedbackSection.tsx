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
      tag: 'bg-[#ecfdf5]', // soft green
      text: 'text-[#059669]', // emerald
      icon: '#059669',
    }
  }

  return {
    tag: 'bg-[#ffdad6]', // soft red
    text: 'text-[#ba1a1a]', // dark red
    icon: '#ba1a1a',
  }
}

type Props = {
  eyebrow?: string
  title?: string
  traits?: FeedbackTrait[]
}

export function CommunityFeedbackSection({ title = 'Đánh giá từ cộng đồng', traits = [] }: Props) {
  if (traits.length === 0) return null

  return (
    <View className="mb-6">
      <View className="mb-4">
        <Text className="text-[24px] text-[#191c1e]" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>{title}</Text>
      </View>

      <View className="flex-row flex-wrap gap-2">
        {traits.map((trait) => {
          const palette = toneClasses(trait.tone)
          const Icon = trait.icon

          // Clean tags layout per "Electric Court" rules
          return (
            <View key={trait.key} className={`flex-row items-center rounded-full px-4 py-2 ${palette.tag}`}>
              <Icon size={14} color={palette.icon} strokeWidth={2.2} />
              <Text className={`ml-2 text-[13px] ${palette.text}`} style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                {trait.label} <Text className="font-normal opacity-70">({trait.count.replace(/[^\d]/g, '')})</Text>
              </Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}

export default CommunityFeedbackSection
