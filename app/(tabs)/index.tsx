import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { Flame, Plus } from 'lucide-react-native'
import { memo, useCallback, useState } from 'react'
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { FamiliarCourtCard } from '@/components/home/FamiliarCourtCard'
import { HomeCarouselSection } from '@/components/home/HomeCarouselSection'
import { HomeGreetingHeader } from '@/components/home/HomeGreetingHeader'
import { MatchSessionCard } from '@/components/home/MatchSessionCard'
import { PendingMatchResultCarousel as HomePendingMatchResultCarousel } from '@/components/home/PendingMatchResultCarousel'
import { PostMatchActionsSection } from '@/components/home/PostMatchActionsSection'
import { PROFILE_THEME_COLORS } from '@/components/profile/profileTheme'
import { useHomeFeedData } from '@/hooks/useHomeFeedData'
import type { FamiliarCourt, MatchSession } from '@/lib/homeFeed'
import { useAppTheme } from '@/lib/theme-context'
import { useAuth } from '@/lib/useAuth'

const iconStroke = 2.7
const CAROUSEL_SECTION_HEIGHT = 536
const COURT_CAROUSEL_HEIGHT = 272
const HOME_MOCK_STREAK_DAYS = 7

const SmartMatchCard = memo(function SmartMatchCard({ item }: { item: MatchSession }) {
  return <MatchSessionCard item={item} variant="standard" actionLabel={item.joined ? 'Xem kèo' : 'Vào kèo'} />
})

const SmartQueueHeroStyledCard = memo(function SmartQueueHeroStyledCard({ item }: { item: MatchSession }) {
  return <MatchSessionCard item={item} variant="smart" actionLabel={item.joined ? 'Xem kèo' : 'Ưu tiên ghép'} />
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

  return (
    <View className="relative mt-5 overflow-hidden rounded-[32px] px-6 py-5 shadow-sm">
      <LinearGradient
        colors={[PROFILE_THEME_COLORS.primaryContainer, PROFILE_THEME_COLORS.tertiaryContainer]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
      />
      <Flame
        size={132}
        color="rgba(255,255,255,0.12)"
        strokeWidth={1.8}
        style={{ position: 'absolute', right: -18, bottom: -36 }}
      />

      <View style={{ paddingRight: 0 }}>
        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-1 flex-row items-center">
          <View
            className="mr-2 h-9 w-9 items-center justify-center rounded-full"
            style={{ backgroundColor: 'rgba(255,255,255,0.14)' }}
          >
            <Flame size={16} color={PROFILE_THEME_COLORS.onPrimary} strokeWidth={2.3} />
          </View>
          <Text
            className="text-[20px] uppercase tracking-[1px]"
            style={{ color: PROFILE_THEME_COLORS.onPrimary, fontFamily: 'PlusJakartaSans-Bold', lineHeight: 32 }}
          >
            Chuỗi Ra Sân
          </Text>
          </View>
          <View
            className="rounded-full px-4 py-2"
            style={{ backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest }}
          >
            <Text
              className="text-[18px] uppercase"
              style={{ color: PROFILE_THEME_COLORS.primary, fontFamily: 'PlusJakartaSans-ExtraBoldItalic' }}
            >
              {current} NGÀY
            </Text>
          </View>
        </View>
      </View>
    </View>
  )
})

export default function HomeScreen() {
  const theme = useAppTheme()
  const { userId, isLoading: isAuthLoading } = useAuth()
  const [pendingMatchIndex, setPendingMatchIndex] = useState(0)
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

  const hasUpcomingMatch = Boolean(nextMatch)
  const currentWinStreak = playerStats?.current_win_streak ?? 0
  const displayWinStreak = currentWinStreak > 0 ? currentWinStreak : HOME_MOCK_STREAK_DAYS
  const statusPrompt = hasUpcomingMatch ? 'Đã sẵn sàng ra sân chưa?' : 'Hôm nay ra sân chứ?'

  const renderPersonalizedCard = useCallback(
    (item: MatchSession) => (hasUpcomingMatch ? <SmartMatchCard item={item} /> : <SmartQueueHeroStyledCard item={item} />),
    [hasUpcomingMatch],
  )
  const renderRescueCard = useCallback((item: MatchSession) => <SmartMatchCard item={item} />, [])
  const renderCourtCard = useCallback((item: FamiliarCourt) => <FamiliarCourtCard item={item} />, [])

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: PROFILE_THEME_COLORS.background }} edges={['top']}>
      <View className="flex-1" style={{ backgroundColor: PROFILE_THEME_COLORS.background }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 160 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        >
          <HomeGreetingHeader name={profile?.name ?? 'Bạn'} statusPrompt={statusPrompt} />

          <HomeStreakCard current={displayWinStreak} />

          <HomePendingMatchResultCarousel
            items={pendingMatches}
            activeIndex={pendingMatchIndex}
            onIndexChange={setPendingMatchIndex}
          />

          <PostMatchActionsSection items={postMatchActions} />

          {nextMatch ? (
            <View className="mt-8">
              <HeroThemeCard item={nextMatch} actionLabel="Sẵn sàng" />
            </View>
          ) : null}

          {loading ? (
            <View
              className="mt-8 items-center rounded-[28px] border py-12"
              style={{ borderColor: PROFILE_THEME_COLORS.outlineVariant, backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest }}
            >
              <ActivityIndicator color={theme.primary} />
              <Text className="mt-4 text-sm" style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: 'PlusJakartaSans-SemiBold' }}>
                Đang tải dữ liệu thật từ hệ thống...
              </Text>
            </View>
          ) : null}

          <HomeCarouselSection
            visible={personalizedSessions.length > 0}
            marginTopClassName="mt-6"
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
        </ScrollView>

        <Pressable
          onPress={() => router.push('/create-session' as never)}
          className="absolute bottom-8 right-5 flex-row items-center rounded-full border px-8 py-5"
          style={{
            borderColor: PROFILE_THEME_COLORS.primaryFixed,
            backgroundColor: PROFILE_THEME_COLORS.primary,
            shadowColor: PROFILE_THEME_COLORS.primary,
            shadowOpacity: 0.28,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: 16 },
          }}
        >
          <Plus size={20} color={PROFILE_THEME_COLORS.onPrimary} strokeWidth={iconStroke} />
          <Text className="ml-3 text-sm uppercase tracking-[2.6px]" style={{ color: PROFILE_THEME_COLORS.onPrimary, fontFamily: 'PlusJakartaSans-ExtraBold' }}>
            Tạo kèo mới
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}
