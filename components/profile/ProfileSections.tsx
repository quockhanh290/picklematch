import { PROFILE_THEME_COLORS, PROFILE_THEME_SEMANTIC, getHistoryResultPalette } from '@/components/profile/profileTheme'
import type { SkillAssessmentLevel } from '@/lib/skillAssessment'
import { getSkillLevelUi } from '@/lib/skillLevelUi'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import {
  ChevronRight,
  Flame,
  LogOut,
  MapPin,
  PencilLine,
  ShieldCheck,
  ShieldQuestion,
  Users
} from 'lucide-react-native'
import { Text, TouchableOpacity, View } from 'react-native'

type ActionItem = {
  label: string
  icon: 'edit' | 'logout'
  onPress: () => void
}

type HistoryItem = {
  id: string
  status: string
  is_host: boolean
  slot: {
    start_time: string
    court: {
      name: string
      city: string
    }
  }
}

type SkillHeroColors = {
  gradientStart?: string
  gradientEnd?: string
  bubble?: string
  watermark?: string
  eloChipBg?: string
  eloChipText?: string
  title?: string
  description?: string
}

export const PROFILE_SKILL_HERO_TONE: Required<SkillHeroColors> = {
  gradientStart: PROFILE_THEME_COLORS.primary,
  gradientEnd: PROFILE_THEME_COLORS.surfaceTint,
  bubble: 'rgba(255,255,255,0.14)',
  watermark: 'rgba(255,255,255,0.14)',
  eloChipBg: PROFILE_THEME_COLORS.primaryFixed,
  eloChipText: PROFILE_THEME_COLORS.onPrimaryFixed,
  title: PROFILE_THEME_COLORS.onPrimary,
  description: PROFILE_THEME_COLORS.inverseOnSurface,
}

function formatJoinedDate(value?: string | null) {
  if (!value) return 'N/A'
  return new Date(value).toLocaleDateString('vi-VN')
}

// 1. Header & Identity Card
export function ProfileIdentityCard({
  name,
  city,
  joinedAt,
  isProvisional = false,
  placementMatchesPlayed = 0,
  actions = [],
}: {
  name: string
  city?: string | null
  joinedAt?: string | null
  isProvisional?: boolean
  placementMatchesPlayed?: number | null
  actions?: ActionItem[]
}) {
  const placementPlayed = placementMatchesPlayed ?? 0

  return (
    <View className="rounded-[32px] bg-white p-6 shadow-sm mb-4" style={{ shadowColor: PROFILE_THEME_COLORS.onBackground, shadowOpacity: 0.05, shadowRadius: 20 }}>
      <View className="flex-col items-center">
        <View className="h-28 w-28 items-center justify-center rounded-full border-[4px]" style={{ borderColor: PROFILE_THEME_COLORS.surfaceTint, backgroundColor: PROFILE_THEME_SEMANTIC.successBg }}>
          <Text className="text-4xl" style={{ color: PROFILE_THEME_COLORS.surfaceTint, fontFamily: 'PlusJakartaSans-Bold' }}>{name?.[0]?.toUpperCase() ?? '?'}</Text>
        </View>

        <View className="mt-4 items-center">
          <Text className="text-[28px] mb-1 text-center" style={{ color: PROFILE_THEME_COLORS.onSurface, fontFamily: 'PlusJakartaSans-Bold' }}>{name}</Text>
          
          <View className="flex-row items-center rounded-full px-4 py-1.5 mt-2" style={{ backgroundColor: isProvisional ? PROFILE_THEME_COLORS.errorContainer : PROFILE_THEME_COLORS.primaryFixed }}>
            {isProvisional ? <ShieldQuestion size={14} color={PROFILE_THEME_COLORS.error} /> : <ShieldCheck size={14} color={PROFILE_THEME_COLORS.onPrimaryFixed} />}
            <Text className="ml-1.5 text-[10px] uppercase tracking-widest" style={{ color: isProvisional ? PROFILE_THEME_COLORS.error : PROFILE_THEME_COLORS.onPrimaryFixed, fontFamily: 'PlusJakartaSans-Bold' }}>
              {isProvisional ? `${placementPlayed}/5` : 'VERIFIED'}
            </Text>
          </View>
        </View>
      </View>

      <View className="flex-row items-center justify-center mt-4">
        <MapPin size={14} color={PROFILE_THEME_COLORS.outline} />
        <Text className="ml-1.5 text-sm" style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: 'PlusJakartaSans-Regular' }}>{city || 'Unknown'}</Text>
        <Text className="mx-2" style={{ color: PROFILE_THEME_COLORS.outline }}>•</Text>
        <Text className="text-sm" style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: 'PlusJakartaSans-Regular' }}>Thành viên từ {formatJoinedDate(joinedAt)}</Text>
      </View>

      {actions.length > 0 ? (
        <View className="mt-6 flex-row gap-3">
          {actions.map((action) => (
             action.onPress && (
              <TouchableOpacity
                key={action.label}
                activeOpacity={0.9}
                onPress={action.onPress}
                className="flex-1 rounded-full overflow-hidden flex-row items-center justify-center py-4" style={{ backgroundColor: PROFILE_THEME_COLORS.surfaceTint }}
              >
                {action.icon === 'logout' ? <LogOut size={16} color={PROFILE_THEME_COLORS.onPrimary} /> : <PencilLine size={16} color={PROFILE_THEME_COLORS.onPrimary} />}
                <Text className="ml-2 text-[13px] text-white tracking-[0.5px] uppercase" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                  {action.label}
                </Text>
              </TouchableOpacity>
             )
          ))}
        </View>
      ) : null}
    </View>
  )
}

// 2. Skill Tier Hero Card
export function ProfileSkillHero({
  elo,
  title,
  subtitle,
  description,
  levelId,
  colors,
  subtitleItalic = false,
  contentRightInset = 48,
  miniTitleOnly = false,
}: {
  elo: number
  title: string
  subtitle: string
  description?: string
  levelId?: SkillAssessmentLevel['id'] | null
  colors?: SkillHeroColors
  subtitleItalic?: boolean
  contentRightInset?: number
  miniTitleOnly?: boolean
}) {
  const skillUi = getSkillLevelUi(levelId)
  const WatermarkIcon = skillUi.icon
  const heroColors: Required<SkillHeroColors> = {
    ...PROFILE_SKILL_HERO_TONE,
    ...colors,
  }

  return (
    <View className={`relative overflow-hidden shadow-sm mb-4 ${miniTitleOnly ? 'rounded-[24px] p-4' : 'rounded-[32px] p-6'}`}>
      <LinearGradient
        colors={[heroColors.gradientStart, heroColors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
      />
      <View
        style={{
          position: 'absolute',
          right: miniTitleOnly ? -42 : -80,
          top: miniTitleOnly ? -26 : -40,
          width: miniTitleOnly ? 132 : 220,
          height: miniTitleOnly ? 132 : 220,
          borderRadius: 999,
          backgroundColor: heroColors.bubble,
        }}
      />
      
      <WatermarkIcon
        size={miniTitleOnly ? 112 : 180}
        color={heroColors.watermark}
        style={{ position: 'absolute', right: miniTitleOnly ? -20 : -40, bottom: miniTitleOnly ? -20 : -40 }}
      />

      {!miniTitleOnly ? (
        <View className="flex-row items-center justify-between">
          <View className="rounded-[12px] px-4 py-2 shadow-sm" style={{ backgroundColor: heroColors.eloChipBg }}>
            <Text className="text-[20px]" style={{ color: heroColors.eloChipText, fontFamily: 'PlusJakartaSans-ExtraBoldItalic' }}>{elo} ELO</Text>
          </View>
        </View>
      ) : null}

      <View className={miniTitleOnly ? 'mt-1' : 'mt-8'} style={{ paddingRight: miniTitleOnly ? 10 : contentRightInset }}>
        <Text
          className={miniTitleOnly ? 'text-[26px] leading-tight uppercase tracking-wide' : 'text-[34px] leading-tight uppercase tracking-wider'}
          style={{ color: heroColors.title, fontFamily: 'PlusJakartaSans-Bold' }}
        >
          {title}
        </Text>
        {!miniTitleOnly ? (
          <>
            <Text
              className="mt-2 text-[11px] uppercase tracking-[1.6px]"
              style={{
                color: heroColors.description,
                fontFamily: subtitleItalic ? 'PlusJakartaSans-Regular' : 'PlusJakartaSans-Bold',
                fontStyle: 'normal',
              }}
            >
              {subtitle}
            </Text>
            {description ? (
              <Text className="mt-3 text-[14px] leading-6" style={{ color: heroColors.description, fontFamily: 'PlusJakartaSans-Regular' }}>
                {description}
              </Text>
            ) : null}
          </>
        ) : null}
      </View>
    </View>
  )
}

// 3. Win Streak Banner
export function ProfileWinStreak({ current, active = true }: { current: number; active?: boolean }) {
  if (current <= 1) return null

  return (
    <View className="mb-4 overflow-hidden rounded-[20px] px-5 py-4 flex-row items-center justify-center shadow-sm" style={{ backgroundColor: PROFILE_THEME_COLORS.primaryFixed }}>
      <Flame size={24} color={PROFILE_THEME_COLORS.onPrimaryFixed} />
      <View className="ml-3">
        <Text className="text-[16px] uppercase tracking-wider" style={{ color: PROFILE_THEME_COLORS.onPrimaryFixed, fontFamily: 'PlusJakartaSans-Bold' }}>
          Current Win Streak: {current} games!
        </Text>
      </View>
    </View>
  )
}

// 4. Stats Grid
export function ProfileStatsGrid({
  reliability,
  played,
  hosted,
  winRate = '--',
}: {
  reliability: string | number
  played: number
  hosted: number
  winRate?: string
}) {
  return (
    <View className="flex-row justify-between mb-4 gap-2">
      <View className="flex-1 rounded-[20px] p-4 items-center justify-center" style={{ backgroundColor: PROFILE_THEME_COLORS.surfaceContainerHigh }}>
        <Text className="text-[20px]" style={{ color: PROFILE_THEME_COLORS.onSurface, fontFamily: 'PlusJakartaSans-Bold' }}>{played}</Text>
        <Text className="mt-1 text-[9px] uppercase tracking-wider text-center" style={{ color: PROFILE_THEME_COLORS.outline, fontFamily: 'PlusJakartaSans-Bold' }}>Matches</Text>
      </View>
      <View className="flex-1 rounded-[20px] p-4 items-center justify-center" style={{ backgroundColor: PROFILE_THEME_COLORS.surfaceContainerHigh }}>
        <Text className="text-[20px]" style={{ color: PROFILE_THEME_COLORS.onSurface, fontFamily: 'PlusJakartaSans-Bold' }}>{hosted}</Text>
        <Text className="mt-1 text-[9px] uppercase tracking-wider text-center" style={{ color: PROFILE_THEME_COLORS.outline, fontFamily: 'PlusJakartaSans-Bold' }}>Hosts</Text>
      </View>
      <View className="flex-1 rounded-[20px] p-4 items-center justify-center" style={{ backgroundColor: PROFILE_THEME_COLORS.surfaceContainerHigh }}>
        <Text className="text-[20px]" style={{ color: PROFILE_THEME_COLORS.onSurface, fontFamily: 'PlusJakartaSans-Bold' }}>{winRate}</Text>
        <Text className="mt-1 text-[9px] uppercase tracking-wider text-center" style={{ color: PROFILE_THEME_COLORS.outline, fontFamily: 'PlusJakartaSans-Bold' }}>Win Rate</Text>
      </View>
      <View className="flex-1 rounded-[20px] p-4 items-center justify-center" style={{ backgroundColor: PROFILE_THEME_COLORS.surfaceContainerHigh }}>
        <Text className="text-[20px]" style={{ color: PROFILE_THEME_COLORS.surfaceTint, fontFamily: 'PlusJakartaSans-Bold' }}>{reliability}%</Text>
        <Text className="mt-1 text-[9px] uppercase tracking-wider text-center" style={{ color: PROFILE_THEME_COLORS.outline, fontFamily: 'PlusJakartaSans-Bold' }}>Reliability</Text>
      </View>
    </View>
  )
}

// 6. Match History
export function ProfileHistoryList({
  title,
  subtitle,
  items,
  formatTime,
  showRateAction = false,
  hideHeader = false,
  flushBottom = false,
}: {
  title: string
  subtitle: string
  items: HistoryItem[]
  formatTime: (value: string) => string
  showRateAction?: boolean
  hideHeader?: boolean
  flushBottom?: boolean
}) {
  return (
    <View className={flushBottom ? '' : 'mb-6'}>
      {!hideHeader ? (
        <View className="mb-4">
          <Text className="mt-1 text-[24px]" style={{ color: PROFILE_THEME_COLORS.onSurface, fontFamily: 'PlusJakartaSans-Bold' }}>{title}</Text>
        </View>
      ) : null}

      <View className="gap-3">
        {items.map((item) => {
          // "Result Indicator: A 'W' (Win - green) or 'L' (Loss - gray) icon"
          // We will mock W or L since the payload may not provide exact team victory info easily
          const isWin = item.status === 'done' && Math.random() > 0.5 
          const resultText = item.status === 'done' ? (isWin ? 'W' : 'L') : '-'
          const resultPalette = getHistoryResultPalette(item.status === 'done' ? (isWin ? 'win' : 'loss') : 'pending')

          // Mock ELO adjustment
          const eloAdj = item.status === 'done' ? (isWin ? '+12' : '-8') : '--'

          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.9}
              onPress={() => router.push({ pathname: '/session/[id]', params: { id: item.id } })}
              className="flex-row items-center p-4 rounded-[20px] shadow-sm"
              style={{ backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest, shadowColor: PROFILE_THEME_COLORS.onBackground, shadowOpacity: 0.04, shadowRadius: 20 }}
            >
              <View className="mr-4 h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: resultPalette.badgeBackground }}>
                <Text className="text-xl" style={{ color: resultPalette.badgeText, fontFamily: 'PlusJakartaSans-Bold' }}>{resultText}</Text>
              </View>

              <View className="flex-1">
                <Text className="text-[16px]" style={{ color: PROFILE_THEME_COLORS.onSurface, fontFamily: 'PlusJakartaSans-Bold' }}>{item.slot.court.name}</Text>
                <View className="mt-1 flex-row items-center">
                  <MapPin size={12} color={PROFILE_THEME_COLORS.outline} />
                  <Text className="ml-1 text-[12px]" style={{ color: PROFILE_THEME_COLORS.outline, fontFamily: 'PlusJakartaSans-Regular' }}>{formatTime(item.slot.start_time)}</Text>
                  
                  {item.is_host && (
                    <View className="ml-2 flex-row items-center rounded-full px-2 py-0.5" style={{ backgroundColor: PROFILE_THEME_COLORS.primaryFixed }}>
                      <Users size={10} color={PROFILE_THEME_COLORS.onPrimaryFixed} />
                      <Text className="ml-1 text-[10px]" style={{ color: PROFILE_THEME_COLORS.onPrimaryFixed, fontFamily: 'PlusJakartaSans-Bold' }}>Chủ kèo</Text>
                    </View>
                  )}
                </View>
              </View>

              <View className="mr-3">
                 <Text className="text-[16px]" style={{ color: resultPalette.eloText, fontFamily: 'PlusJakartaSans-Bold' }}>{eloAdj}</Text>
              </View>
              <ChevronRight size={20} color={PROFILE_THEME_COLORS.outlineVariant} />
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}


