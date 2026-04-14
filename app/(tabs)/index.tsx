import { router } from 'expo-router'
import { Plus } from 'lucide-react-native'
import { memo, useCallback, useState } from 'react'
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { DashboardStatsStrip, buildDashboardStats } from '@/components/home/DashboardStatsStrip'
import { FamiliarCourtCard, COURT_CARD_HEIGHT } from '@/components/home/FamiliarCourtCard'
import { HomeCarouselSection } from '@/components/home/HomeCarouselSection'
import { HomeGreetingHeader } from '@/components/home/HomeGreetingHeader'
import { MatchSessionCard, SMART_MATCH_CARD_HEIGHT } from '@/components/home/MatchSessionCard'
import { PostMatchActionsSection } from '@/components/home/PostMatchActionsSection'
import { PendingMatchResultCarousel as HomePendingMatchResultCarousel } from '@/components/home/PendingMatchResultCarousel'
import { useHomeFeedData } from '@/hooks/useHomeFeedData'
import type { FamiliarCourt, MatchSession } from '@/lib/homeFeed'
import { useAppTheme } from '@/lib/theme-context'
import { useAuth } from '@/lib/useAuth'

const iconStroke = 2.7
const CAROUSEL_SECTION_HEIGHT = 536
const COURT_CAROUSEL_HEIGHT = 272

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
  const dashboardStats = buildDashboardStats(profile, playerStats)
  const statusPrompt = hasUpcomingMatch ? 'Đã sẵn sàng ra sân chưa?' : 'Hôm nay ra sân chứ'

  const renderPersonalizedCard = useCallback(
    (item: MatchSession) => (hasUpcomingMatch ? <SmartMatchCard item={item} /> : <SmartQueueHeroStyledCard item={item} />),
    [hasUpcomingMatch],
  )
  const renderRescueCard = useCallback((item: MatchSession) => <SmartMatchCard item={item} />, [])
  const renderCourtCard = useCallback((item: FamiliarCourt) => <FamiliarCourtCard item={item} />, [])

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.backgroundMuted }} edges={['top']}>
      <View className="flex-1" style={{ backgroundColor: theme.backgroundMuted }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 160 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        >
          <HomeGreetingHeader name={profile?.name ?? 'Bạn'} statusPrompt={statusPrompt} />

          <DashboardStatsStrip items={dashboardStats} />

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
            <View className="mt-8 items-center rounded-[28px] border border-slate-200 bg-white py-12">
              <ActivityIndicator color={theme.primary} />
              <Text className="mt-4 text-sm font-semibold text-slate-500">Đang tải dữ liệu thật từ hệ thống...</Text>
            </View>
          ) : null}

          <HomeCarouselSection
            visible={personalizedSessions.length > 0}
            marginTopClassName="mt-6"
            eyebrow="Gợi ý hợp gu"
            title="Dành riêng cho bạn"
            items={personalizedSessions}
            activeIndex={personalizedIndex}
            containerHeight={CAROUSEL_SECTION_HEIGHT || SMART_MATCH_CARD_HEIGHT}
            onIndexChange={setPersonalizedIndex}
            renderCard={renderPersonalizedCard}
          />

          <HomeCarouselSection
            visible={rescueSessions.length > 0}
            eyebrow="Cần người gấp"
            title="Cứu nét khẩn cấp"
            items={rescueSessions}
            activeIndex={rescueIndex}
            containerHeight={CAROUSEL_SECTION_HEIGHT || SMART_MATCH_CARD_HEIGHT}
            onIndexChange={setRescueIndex}
            renderCard={renderRescueCard}
          />

          <HomeCarouselSection
            visible={familiarCourts.length > 0}
            eyebrow="Sân quen"
            title="Sân quen của bạn"
            items={familiarCourts}
            activeIndex={courtIndex}
            containerHeight={COURT_CAROUSEL_HEIGHT || COURT_CARD_HEIGHT}
            onIndexChange={setCourtIndex}
            renderCard={renderCourtCard}
          />
        </ScrollView>

        <Pressable
          onPress={() => router.push('/create-session' as never)}
          className="absolute bottom-8 right-5 flex-row items-center rounded-full px-8 py-5"
          style={{
            backgroundColor: theme.primary,
            shadowColor: theme.primaryStrong,
            shadowOpacity: 0.34,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: 16 },
          }}
        >
          <Plus size={20} color={theme.primaryContrast} strokeWidth={iconStroke} />
          <Text className="ml-3 text-sm font-black uppercase tracking-[2.6px]" style={{ color: theme.primaryContrast }}>
            Tạo kèo mới
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}
