import { router } from 'expo-router'
import { Plus } from 'phosphor-react-native'
import { memo, useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat,
  withSequence,
  withSpring, 
  withTiming 
} from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'

import { FamiliarCourtCard } from '@/components/home/FamiliarCourtCard'
import { HomeCarouselSection } from '@/components/home/HomeCarouselSection'
import { HomeGreetingHeader } from '@/components/home/HomeGreetingHeader'
import { MatchSessionCard } from '@/components/home/MatchSessionCard'
import { PostMatchInboxSection } from '@/components/home/PostMatchInboxSection'
import { PROFILE_THEME_COLORS } from '@/constants/profileTheme'
import { AppLoading } from '@/components/design/AppLoading'
import { SCREEN_FONTS } from '@/constants/typography'
import { useHomeFeedData } from '@/hooks/useHomeFeedData'
import type { FamiliarCourt, MatchSession } from '@/lib/homeFeed'
import { useAppTheme } from '@/lib/theme-context'
import { useAuth } from '@/lib/useAuth'
import { SPACING } from '@/constants/screenLayout'

const CAROUSEL_SECTION_HEIGHT = 430
const COURT_CAROUSEL_HEIGHT = 272

function withAlpha(hex: string, alpha: number) {
  const clean = hex.replace('#', '')
  const n = Number.parseInt(clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean, 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

const SmartMatchCard = memo(function SmartMatchCard({ item, accentMode = 'default' }: { item: MatchSession; accentMode?: 'default' | 'rescue' }) {
  return <MatchSessionCard item={item} variant="standard" actionLabel={item.joined ? 'XEM KÈO' : 'VÀO KÈO'} accentMode={accentMode} />
})

const SmartQueueHeroStyledCard = memo(function SmartQueueHeroStyledCard({ item }: { item: MatchSession }) {
  return <MatchSessionCard item={item} variant="smart" actionLabel={item.joined ? 'XEM KÈO' : 'ƯU TIÊN GHÉP'} />
})

const HeroThemeCard = memo(function HeroThemeCard({
  item,
  actionLabel,
}: {
  item: MatchSession
  actionLabel: string
}) {
  return <MatchSessionCard item={item} variant="hero" actionLabel={actionLabel} />
})

const HomeStreakCard = memo(function HomeStreakCard({ current }: { current: number }) {
  if (current <= 0) return null

  if (current < 3) {
    const remaining = 3 - current

    return (
      <View
        className="mt-4 flex-row items-center rounded-[10px] border"
        style={{ paddingHorizontal: SPACING.md, paddingVertical: 9, borderColor: PROFILE_THEME_COLORS.secondaryFixedDim, backgroundColor: PROFILE_THEME_COLORS.surface, columnGap: 8 }}
      >
        <Text style={{ fontSize: 15, lineHeight: 18 }}>🔥</Text>
        <Text className="min-w-0 flex-1 text-[12px]" style={{ color: PROFILE_THEME_COLORS.onSurface, fontFamily: SCREEN_FONTS.label, lineHeight: 17 }}>
          Chuỗi{' '}
          <Text style={{ color: PROFILE_THEME_COLORS.primary, fontFamily: SCREEN_FONTS.cta }}>{current}</Text>
          {' '}ngày · {remaining} ngày nữa lên huy hiệu
        </Text>
        <Text style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: SCREEN_FONTS.body, fontSize: 14, lineHeight: 18 }}>›</Text>
      </View>
    )
  }

  const filledPips = Math.min(current, 10)

  return (
    <View
      className="mt-4 flex-row items-center rounded-[10px]"
      style={{ paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, backgroundColor: PROFILE_THEME_COLORS.primary, columnGap: 12 }}
    >
      <Text style={{ fontSize: 22, lineHeight: 26 }}>🔥</Text>

      <View className="min-w-0 flex-1">
        <Text
          className="mb-1 text-[10px] uppercase"
          style={{ color: PROFILE_THEME_COLORS.secondaryFixed, fontFamily: SCREEN_FONTS.label, letterSpacing: 0.5, lineHeight: 14 }}
        >
          CHUỖI RA SÂN
        </Text>
        <View className="flex-row" style={{ columnGap: 4 }}>
          {Array.from({ length: 10 }).map((_, index) => (
            <View
              key={index}
              className="h-1 flex-1 rounded-full"
              style={{ backgroundColor: index < filledPips ? PROFILE_THEME_COLORS.tertiary : withAlpha(PROFILE_THEME_COLORS.onPrimary, 0.15) }}
            />
          ))}
        </View>
      </View>

      <View className="items-center">
        <Text style={{ color: PROFILE_THEME_COLORS.onPrimary, fontFamily: SCREEN_FONTS.headline, fontSize: 24, lineHeight: 24 }}>
          {current}
        </Text>
        <Text className="mt-px text-[9px]" style={{ color: PROFILE_THEME_COLORS.secondaryFixed, fontFamily: SCREEN_FONTS.body, lineHeight: 12, textAlign: 'center' }}>
          ngày
        </Text>
      </View>
    </View>
  )
})

function ExpandingCreateFAB() {
  const [expanded, setExpanded] = useState(false)
  const width = useSharedValue(60) // Slightly larger
  const opacity = useSharedValue(0)
  const scale = useSharedValue(1)

  // Continuous subtle pulse effect when NOT expanded
  useEffect(() => {
    if (!expanded) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 1000 }),
          withTiming(1, { duration: 1000 })
        ),
        -1, // Infinite
        true
      )
    } else {
      scale.value = withSpring(1)
    }
  }, [expanded])

  const animatedStyle = useAnimatedStyle(() => ({
    width: width.value,
    transform: [{ scale: scale.value }]
  }))

  const textStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  const handlePress = async () => {
    if (!expanded) {
      setExpanded(true)
      // Haptic feedback for expansion
      try {
        const { selectionAsync } = require('expo-haptics')
        await selectionAsync()
      } catch {}

      width.value = withSpring(200, { damping: 15, stiffness: 100 })
      opacity.value = withTiming(1, { duration: 200 })

      // Auto-collapse if not tapped again within 3.5 seconds
      setTimeout(() => {
        setExpanded((curr) => {
          if (curr) {
            width.value = withSpring(60)
            opacity.value = withTiming(0)
            return false
          }
          return curr
        })
      }, 3500)
    } else {
      // Haptic feedback for navigation
      try {
        const { notificationAsync, NotificationFeedbackType } = require('expo-haptics')
        await notificationAsync(NotificationFeedbackType.Success)
      } catch {}

      router.push('/create-session' as never)
      
      // Reset immediately so it's clean when coming back
      setTimeout(() => {
        width.value = 60
        opacity.value = 0
        setExpanded(false)
      }, 500)
    }
  }

  return (
    <Pressable 
      onPress={handlePress}
      style={{
        position: 'absolute',
        bottom: 100,
        right: 24,
        zIndex: 100,
      }}
    >
      <Animated.View
        className="flex-row items-center justify-center overflow-hidden rounded-full"
        style={[
          {
            height: 60,
            backgroundColor: PROFILE_THEME_COLORS.primary,
            shadowColor: PROFILE_THEME_COLORS.primary,
            shadowOpacity: 0.45, // Deeper shadow
            shadowRadius: 18, // Softer, larger glow
            shadowOffset: { width: 0, height: 8 },
            elevation: 12,
            borderWidth: 1.5,
            borderColor: 'rgba(255, 255, 255, 0.2)', // Highlight rim
          },
          animatedStyle,
        ]}
      >
        <LinearGradient
          colors={[PROFILE_THEME_COLORS.primary, PROFILE_THEME_COLORS.surfaceTint]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        
        <View className="absolute left-[16px]">
          <Plus size={28} color="#FFFFFF" strokeWidth={3} />
        </View>
        <Animated.View style={[{ marginLeft: 48 }, textStyle]}>
          <Text
            className="text-[16px] uppercase tracking-[1.5px]"
            numberOfLines={1}
            style={{ 
              color: '#FFFFFF', 
              fontFamily: SCREEN_FONTS.headlineBlack, // Even bolder
              top: 1,
              textShadowColor: 'rgba(0, 0, 0, 0.2)',
              textShadowOffset: { width: 0, height: 1 },
              textShadowRadius: 2
            }}
          >
            Tạo kèo mới
          </Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  )
}

export default function HomeScreen() {
  const theme = useAppTheme()
  const { userId, isLoading: isAuthLoading } = useAuth()
  const [personalizedIndex, setPersonalizedIndex] = useState(0)
  const [rescueIndex, setRescueIndex] = useState(0)
  const [courtIndex, setCourtIndex] = useState(0)
  const {
    refreshing,
    loading,
    profile,
    playerStats,
    nextMatch,
    pendingMatches,
    postMatchActions,
    personalizedSessions,
    rescueSessions,
    familiarCourts,
    onRefresh,
  } = useHomeFeedData(userId, isAuthLoading)

  const upcomingMatch = nextMatch
  const hasUpcomingMatch = Boolean(upcomingMatch)
  const currentWinStreak = playerStats?.current_win_streak ?? 0
  const displayWinStreak = currentWinStreak
  const statusPrompt = hasUpcomingMatch ? 'Đã sẵn sàng ra sân chưa?' : 'Hôm nay ra sân chứ?'

  const renderPersonalizedCard = useCallback(
    (item: MatchSession) => (hasUpcomingMatch ? <SmartMatchCard item={item} /> : <SmartQueueHeroStyledCard item={item} />),
    [hasUpcomingMatch],
  )
  const renderRescueCard = useCallback((item: MatchSession) => <SmartMatchCard item={item} accentMode="rescue" />, [])
  const renderCourtCard = useCallback(
    (item: FamiliarCourt) => (
      <FamiliarCourtCard
        item={item}
        onPress={() =>
          router.push({
            pathname: '/(tabs)/find-session',
            params: {
              courtId: item.id,
              courtName: item.name,
            },
          })
        }
      />
    ),
    [],
  )

  return (
    <View className="flex-1" style={{ backgroundColor: PROFILE_THEME_COLORS.background }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 160 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        <HomeGreetingHeader name={profile?.name ?? 'Bạn'} statusPrompt={statusPrompt} />

        <View style={{ paddingHorizontal: SPACING.xl }}>
          <HomeStreakCard current={displayWinStreak} />

          <PostMatchInboxSection pendingMatches={pendingMatches} postMatchActions={postMatchActions} marginTopClassName="mt-3" />

          {upcomingMatch ? (
            <View className="mt-4">
              <View className="mb-5">
                <Text className="mb-3 text-[11px] uppercase tracking-[0.16em]" style={{ color: PROFILE_THEME_COLORS.outline, fontFamily: SCREEN_FONTS.headline }}>
                  Sắp diễn ra
                </Text>
                <Text className="text-[24px]" style={{ color: PROFILE_THEME_COLORS.onBackground, fontFamily: SCREEN_FONTS.headline, lineHeight: 32 }}>
                  Trận của bạn
                </Text>
              </View>
              <HeroThemeCard item={upcomingMatch} actionLabel="Sẵn sàng" />
            </View>
          ) : null}


          <HomeCarouselSection
            visible={personalizedSessions.length > 0}
            marginTopClassName="mt-10"
            eyebrow="Gợi ý hợp gu"
            title="Dành riêng cho bạn"
            items={personalizedSessions}
            activeIndex={personalizedIndex}
            containerHeight={CAROUSEL_SECTION_HEIGHT}
            onIndexChange={setPersonalizedIndex}
            renderCard={renderPersonalizedCard}
          />

          <HomeCarouselSection
            visible={rescueSessions.length > 0}
            eyebrow="Cần người gấp"
            title="Cứu nét khẩn cấp"
            items={rescueSessions}
            activeIndex={rescueIndex}
            containerHeight={CAROUSEL_SECTION_HEIGHT}
            onIndexChange={setRescueIndex}
            renderCard={renderRescueCard}
          />

          <HomeCarouselSection
            visible={familiarCourts.length > 0}
            eyebrow="Sân quen"
            title="Sân quen của bạn"
            items={familiarCourts}
            activeIndex={courtIndex}
            containerHeight={COURT_CAROUSEL_HEIGHT}
            onIndexChange={setCourtIndex}
            renderCard={renderCourtCard}
          />
        </View>
      </ScrollView>

      <ExpandingCreateFAB />
    </View>
  )
}

