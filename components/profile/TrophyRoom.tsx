import type { LucideIcon } from 'lucide-react-native'
import { Check, Lock } from 'lucide-react-native'
import { Text, View, ScrollView } from 'react-native'

type BadgeTone = 'emerald' | 'amber' | 'rose' | 'sky' | 'violet'

export type TrophyBadge = {
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
      return { card: 'bg-[#ecfdf5]', text: 'text-[#059669]', subtext: 'text-[#059669]', icon: '#059669' }
    case 'amber':
      return { card: 'bg-[#fffbeb]', text: 'text-[#d97706]', subtext: 'text-[#d97706]', icon: '#d97706' }
    case 'rose':
      return { card: 'bg-[#fff1f2]', text: 'text-[#e11d48]', subtext: 'text-[#e11d48]', icon: '#e11d48' }
    case 'sky':
      return { card: 'bg-[#f0f9ff]', text: 'text-[#0284c7]', subtext: 'text-[#0284c7]', icon: '#0284c7' }
    case 'violet':
      return { card: 'bg-[#f5f3ff]', text: 'text-[#7c3aed]', subtext: 'text-[#7c3aed]', icon: '#7c3aed' }
  }
}

type Props = {
  badges?: TrophyBadge[]
}

export function TrophyRoom({ badges = [] }: Props) {
  const earnedCount = badges.filter((badge) => badge.earned).length

  return (
    <View className="mb-6">
      <View className="mb-4">
        <Text className="text-[24px] text-[#191c1e]" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>Kho Danh Hiệu</Text>
        <Text className="mt-1 text-[13px] text-[#6d7a72]" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
          {earnedCount}/{badges.length} danh hiệu đã mở khóa
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
        {badges.map((badge, index) => {
          const palette = toneClasses(badge.tone)
          const Icon = badge.icon

          return (
            <View
              key={badge.key}
              className={`mr-4 w-[160px] rounded-[20px] p-5 flex flex-col justify-between ${
                badge.earned ? palette.card : 'bg-[#f2f4f6]'
              }`}
            >
              <View className="flex-row justify-between items-start">
                <Icon size={28} color={badge.earned ? palette.icon : '#a0aab8'} strokeWidth={2.1} />
                {badge.earned ? <Check size={16} color={palette.icon} /> : <Lock size={16} color="#a0aab8" />}
              </View>

              <View className="mt-6">
                <Text className={`text-[10px] uppercase tracking-wider ${badge.earned ? palette.text : 'text-[#a0aab8]'}`} style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                  {categoryLabel(badge.category)}
                </Text>
                <Text className={`mt-1 text-[15px] leading-tight ${badge.earned ? palette.text : 'text-[#6d7a72]'}`} style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                  {badge.title}
                </Text>
              </View>

            </View>
          )
        })}
      </ScrollView>
    </View>
  )
}

export default TrophyRoom
