import type { LucideIcon } from 'lucide-react-native'
import { Check, Lock } from 'lucide-react-native'
import { Text, View } from 'react-native'

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
      return {
        card: 'bg-emerald-50 border-emerald-100',
        text: 'text-emerald-700',
        subtext: 'text-emerald-700/80',
        divider: 'border-emerald-700/10',
        icon: '#047857',
        watermark: 'rgba(4, 120, 87, 0.1)',
      }
    case 'amber':
      return {
        card: 'bg-amber-50 border-amber-100',
        text: 'text-amber-700',
        subtext: 'text-amber-700/80',
        divider: 'border-amber-700/10',
        icon: '#b45309',
        watermark: 'rgba(180, 83, 9, 0.1)',
      }
    case 'rose':
      return {
        card: 'bg-rose-50 border-rose-100',
        text: 'text-rose-700',
        subtext: 'text-rose-700/80',
        divider: 'border-rose-700/10',
        icon: '#be123c',
        watermark: 'rgba(190, 18, 60, 0.1)',
      }
    case 'sky':
      return {
        card: 'bg-sky-50 border-sky-100',
        text: 'text-sky-700',
        subtext: 'text-sky-700/80',
        divider: 'border-sky-700/10',
        icon: '#0369a1',
        watermark: 'rgba(3, 105, 161, 0.1)',
      }
    case 'violet':
      return {
        card: 'bg-violet-50 border-violet-100',
        text: 'text-violet-700',
        subtext: 'text-violet-700/80',
        divider: 'border-violet-700/10',
        icon: '#6d28d9',
        watermark: 'rgba(109, 40, 217, 0.1)',
      }
  }
}

type Props = {
  badges?: TrophyBadge[]
}

export function TrophyRoom({ badges = [] }: Props) {
  const earnedCount = badges.filter((badge) => badge.earned).length

  return (
    <View className="gap-4">
      <View className="px-1">
        <Text className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Badges</Text>
        <Text className="mt-2 text-2xl font-black text-slate-900">Trophy Room</Text>
        <Text className="mt-2 text-sm leading-6 text-slate-500">
          {earnedCount}/{badges.length} danh hiệu đã mở khóa dựa trên phong độ, độ uy tín và chất lượng host.
        </Text>
      </View>

      <View className="flex-row flex-wrap justify-between gap-y-3">
        {badges.map((badge) => {
          const palette = toneClasses(badge.tone)
          const Icon = badge.icon

          return (
            <View
              key={badge.key}
              className={`relative w-[48%] overflow-hidden rounded-[20px] border p-4 flex flex-col ${
                badge.earned ? palette.card : 'border-slate-200 bg-slate-100 text-slate-500 opacity-75'
              }`}
            >
              <Icon
                size={80}
                color={badge.earned ? palette.watermark : 'rgba(100, 116, 139, 0.1)'}
                strokeWidth={1.8}
                style={{ position: 'absolute', right: -16, bottom: -16 }}
              />

              <View className="relative z-10 flex-row items-start justify-between">
                <Icon size={24} color={badge.earned ? palette.icon : '#64748b'} strokeWidth={2.1} />
                {badge.earned ? <Check size={16} color={palette.icon} /> : <Lock size={16} color="#64748b" />}
              </View>

              <Text className={`relative z-10 mt-4 text-[9px] font-extrabold uppercase tracking-widest opacity-60 ${badge.earned ? palette.text : 'text-slate-500'}`}>
                {categoryLabel(badge.category)}
              </Text>
              <Text className={`relative z-10 mt-2 text-sm font-extrabold ${badge.earned ? palette.text : 'text-slate-500'}`}>{badge.title}</Text>
              <Text className={`relative z-10 mt-2 text-[11px] leading-5 opacity-80 ${badge.earned ? palette.subtext : 'text-slate-500'}`}>
                {badge.description}
              </Text>

              <View className={`relative z-10 mt-4 border-t pt-3 ${badge.earned ? palette.divider : 'border-slate-500/10'}`}>
                <Text className={`relative z-10 text-[11px] font-bold opacity-80 ${badge.earned ? palette.text : 'text-slate-500'}`}>
                  {badge.earned ? `Mở khóa: ${badge.earnedAt}` : `Yêu cầu: ${badge.requirement}`}
                </Text>
              </View>
            </View>
          )
        })}
      </View>
    </View>
  )
}

export default TrophyRoom
