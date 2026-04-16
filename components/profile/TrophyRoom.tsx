import type { LucideIcon } from 'lucide-react-native'
import { Check, Lock } from 'lucide-react-native'
import { Text, View, ScrollView } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'

import { PROFILE_THEME_COLORS, getTrophyBadgePalette, type ProfileBadgeTone } from '@/components/profile/profileTheme'

type BadgeTone = ProfileBadgeTone

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

type Props = {
  badges?: TrophyBadge[]
  hideHeader?: boolean
  flushBottom?: boolean
}

export function TrophyRoom({ badges = [], hideHeader = false, flushBottom = false }: Props) {
  const earnedCount = badges.filter((badge) => badge.earned).length

  return (
    <View className={flushBottom ? '' : 'mb-6'}>
      {!hideHeader ? (
        <View className="mb-4">
          <Text className="text-[24px]" style={{ color: PROFILE_THEME_COLORS.onSurface, fontFamily: 'PlusJakartaSans-Bold' }}>Kho Danh Hiệu</Text>
          <Text className="mt-1 text-[13px]" style={{ color: PROFILE_THEME_COLORS.outline, fontFamily: 'PlusJakartaSans-Regular' }}>
            {earnedCount}/{badges.length} danh hiệu đã mở khóa
          </Text>
        </View>
      ) : null}

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
        {badges.map((badge) => {
          const palette = getTrophyBadgePalette(badge.tone)
          const Icon = badge.icon

          return (
            <View
              key={badge.key}
              className="mr-4 w-[160px] overflow-hidden rounded-[24px] p-5 flex flex-col justify-between"
              style={{ backgroundColor: badge.earned ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.surfaceContainerLow }}
            >
              {badge.earned ? (
                <LinearGradient
                  colors={[PROFILE_THEME_COLORS.primary, PROFILE_THEME_COLORS.surfaceTint]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
                />
              ) : null}

              <View className="flex-row justify-between items-start">
                <View
                  className="rounded-full px-3 py-2"
                  style={{ backgroundColor: badge.earned ? palette.card : PROFILE_THEME_COLORS.surfaceContainerHigh }}
                >
                  <Icon size={20} color={badge.earned ? palette.icon : PROFILE_THEME_COLORS.outline} strokeWidth={2.2} />
                </View>
                {badge.earned ? <Check size={16} color={PROFILE_THEME_COLORS.primaryFixed} /> : <Lock size={16} color={PROFILE_THEME_COLORS.outline} />}
              </View>

              <View className="mt-6">
                <Text
                  className="self-start rounded-full px-3 py-1 text-[10px] uppercase tracking-wider"
                  style={{
                    color: badge.earned ? palette.text : PROFILE_THEME_COLORS.outline,
                    backgroundColor: badge.earned ? palette.card : PROFILE_THEME_COLORS.surfaceContainerHigh,
                    fontFamily: 'PlusJakartaSans-Bold',
                  }}
                >
                  {categoryLabel(badge.category)}
                </Text>
                <Text
                  className="mt-3 text-[16px] leading-tight"
                  style={{
                    color: badge.earned ? PROFILE_THEME_COLORS.onPrimary : PROFILE_THEME_COLORS.onSurfaceVariant,
                    fontFamily: 'PlusJakartaSans-Bold',
                  }}
                >
                  {badge.title}
                </Text>
                <Text
                  className="mt-2 text-[12px] leading-5"
                  style={{
                    color: badge.earned ? PROFILE_THEME_COLORS.inverseOnSurface : PROFILE_THEME_COLORS.outline,
                    fontFamily: 'PlusJakartaSans-Regular',
                  }}
                >
                  {badge.earned ? badge.requirement : 'Chưa mở khóa'}
                </Text>
              </View>

              <Icon
                size={56}
                color={badge.earned ? 'rgba(255,255,255,0.14)' : PROFILE_THEME_COLORS.outlineVariant}
                strokeWidth={1.8}
                style={{ position: 'absolute', right: 12, bottom: 12 }}
              />

            </View>
          )
        })}
      </ScrollView>
    </View>
  )
}

export default TrophyRoom
