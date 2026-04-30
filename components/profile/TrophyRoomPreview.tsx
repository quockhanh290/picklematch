import type { LucideIcon } from 'lucide-react-native'
import { Check, Lock } from 'lucide-react-native'
import { Text, View } from 'react-native'

import { PROFILE_THEME_COLORS, getTrophyBadgePalette } from '@/constants/theme/profileTheme'

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

function withAlpha(hex: string, alpha: number) {
  const clean = hex.replace('#', '')
  const normalized = clean.length === 3 ? clean.split('').map((char) => char + char).join('') : clean
  const n = Number.parseInt(normalized, 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

function tonePalette(tone: BadgeTone) {
  const badge = getTrophyBadgePalette(tone)

  switch (tone) {
    case 'emerald':
      return {
        card: PROFILE_THEME_COLORS.primaryFixed,
        border: PROFILE_THEME_COLORS.secondaryFixedDim,
        text: PROFILE_THEME_COLORS.onPrimaryFixedVariant,
        subtext: withAlpha(PROFILE_THEME_COLORS.onPrimaryFixedVariant, 0.8),
        divider: withAlpha(PROFILE_THEME_COLORS.onPrimaryFixedVariant, 0.1),
        icon: badge.icon,
        watermark: withAlpha(PROFILE_THEME_COLORS.surfaceTint, 0.1),
      }
    case 'amber':
      return {
        card: PROFILE_THEME_COLORS.secondaryFixed,
        border: PROFILE_THEME_COLORS.secondaryFixedDim,
        text: PROFILE_THEME_COLORS.onSecondaryFixedVariant,
        subtext: withAlpha(PROFILE_THEME_COLORS.onSecondaryFixedVariant, 0.8),
        divider: withAlpha(PROFILE_THEME_COLORS.onSecondaryFixedVariant, 0.1),
        icon: badge.icon,
        watermark: withAlpha(PROFILE_THEME_COLORS.onPrimaryFixedVariant, 0.1),
      }
    case 'rose':
      return {
        card: PROFILE_THEME_COLORS.errorContainer,
        border: PROFILE_THEME_COLORS.outlineVariant,
        text: PROFILE_THEME_COLORS.onErrorContainer,
        subtext: withAlpha(PROFILE_THEME_COLORS.onErrorContainer, 0.8),
        divider: withAlpha(PROFILE_THEME_COLORS.onErrorContainer, 0.1),
        icon: badge.icon,
        watermark: withAlpha(PROFILE_THEME_COLORS.error, 0.1),
      }
    case 'sky':
      return {
        card: PROFILE_THEME_COLORS.tertiaryFixed,
        border: PROFILE_THEME_COLORS.secondaryFixedDim,
        text: PROFILE_THEME_COLORS.onTertiaryFixedVariant,
        subtext: withAlpha(PROFILE_THEME_COLORS.onTertiaryFixedVariant, 0.8),
        divider: withAlpha(PROFILE_THEME_COLORS.onTertiaryFixedVariant, 0.1),
        icon: badge.icon,
        watermark: withAlpha(PROFILE_THEME_COLORS.onTertiaryFixedVariant, 0.1),
      }
    case 'violet':
      return {
        card: PROFILE_THEME_COLORS.secondaryContainer,
        border: PROFILE_THEME_COLORS.outlineVariant,
        text: PROFILE_THEME_COLORS.onSecondaryContainer,
        subtext: withAlpha(PROFILE_THEME_COLORS.onSecondaryContainer, 0.8),
        divider: withAlpha(PROFILE_THEME_COLORS.onSecondaryContainer, 0.1),
        icon: badge.icon,
        watermark: withAlpha(PROFILE_THEME_COLORS.onSecondaryContainer, 0.1),
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
        <Text className="text-[10px] font-extrabold uppercase tracking-widest" style={{ color: PROFILE_THEME_COLORS.outline }}>
          Badges
        </Text>
        <Text className="mt-2 text-2xl font-black" style={{ color: PROFILE_THEME_COLORS.onSurface }}>
          Trophy Room
        </Text>
        <Text className="mt-2 text-sm leading-6" style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant }}>
          {earnedCount}/{badges.length} danh hiệu đã mở khóa dựa trên phong độ, độ uy tín và chất lượng host.
        </Text>
      </View>

      <View className="flex-row flex-wrap justify-between gap-y-3">
        {badges.map((badge) => {
          const palette = tonePalette(badge.tone)
          const Icon = badge.icon
          const isEarned = badge.earned

          return (
            <View
              key={badge.key}
              className="relative w-[48%] overflow-hidden rounded-[20px] border p-4 flex flex-col"
              style={{
                borderColor: isEarned ? palette.border : PROFILE_THEME_COLORS.outlineVariant,
                backgroundColor: isEarned ? palette.card : PROFILE_THEME_COLORS.surfaceContainer,
                opacity: isEarned ? 1 : 0.75,
              }}
            >
              <Icon
                size={80}
                color={isEarned ? palette.watermark : withAlpha(PROFILE_THEME_COLORS.outline, 0.18)}
                strokeWidth={1.8}
                style={{ position: 'absolute', right: -16, bottom: -16 }}
              />

              <View className="relative z-10 flex-row items-start justify-between">
                <Icon size={24} color={isEarned ? palette.icon : PROFILE_THEME_COLORS.outline} strokeWidth={2.1} />
                {isEarned ? <Check size={16} color={palette.icon} /> : <Lock size={16} color={PROFILE_THEME_COLORS.outline} />}
              </View>

              <Text
                className="relative z-10 mt-4 text-[9px] font-extrabold uppercase tracking-widest opacity-60"
                style={{ color: isEarned ? palette.text : PROFILE_THEME_COLORS.onSurfaceVariant }}
              >
                {categoryLabel(badge.category)}
              </Text>
              <Text
                className="relative z-10 mt-2 text-sm font-extrabold"
                style={{ color: isEarned ? palette.text : PROFILE_THEME_COLORS.onSurfaceVariant }}
              >
                {badge.title}
              </Text>
              <Text
                className="relative z-10 mt-2 text-[11px] leading-5 opacity-80"
                style={{ color: isEarned ? palette.subtext : PROFILE_THEME_COLORS.onSurfaceVariant }}
              >
                {badge.description}
              </Text>

              <View
                className="relative z-10 mt-4 border-t pt-3"
                style={{ borderColor: isEarned ? palette.divider : withAlpha(PROFILE_THEME_COLORS.onSurfaceVariant, 0.1) }}
              >
                <Text
                  className="relative z-10 text-[11px] font-bold opacity-80"
                  style={{ color: isEarned ? palette.text : PROFILE_THEME_COLORS.onSurfaceVariant }}
                >
                  {isEarned ? `Mở khóa: ${badge.earnedAt}` : `Yêu cầu: ${badge.requirement}`}
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
