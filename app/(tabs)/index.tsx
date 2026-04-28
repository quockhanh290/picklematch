import { router } from 'expo-router'
import { Plus } from 'phosphor-react-native'
import { memo, useCallback, useState } from 'react'
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { FamiliarCourtCard } from '@/components/home/FamiliarCourtCard'
import { HomeCarouselSection } from '@/components/home/HomeCarouselSection'
import { HomeGreetingHeader } from '@/components/home/HomeGreetingHeader'
import { MatchSessionCard } from '@/components/home/MatchSessionCard'
import { PostMatchInboxSection } from '@/components/home/PostMatchInboxSection'
import { PROFILE_THEME_COLORS } from '@/components/profile/profileTheme'
import { SCREEN_FONTS } from '@/constants/screenFonts'
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
    <SafeAreaView className="flex-1" style={{ backgroundColor: PROFILE_THEME_COLORS.background }} edges={['top']}>
      <View className="flex-1" style={{ backgroundColor: PROFILE_THEME_COLORS.background }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: SPACING.xl, paddingTop: 16, paddingBottom: 160 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        >
          <HomeGreetingHeader name={profile?.name ?? 'Bạn'} statusPrompt={statusPrompt} />

          <HomeStreakCard current={displayWinStreak} />

          <PostMatchInboxSection pendingMatches={pendingMatches} postMatchActions={postMatchActions} marginTopClassName="mt-3" />

          {upcomingMatch ? (
            <View className="mt-4">
              <View className="mb-5">
                <Text className="mb-3 text-[11px] uppercase tracking-[0.16em]" style={{ color: PROFILE_THEME_COLORS.outline, fontFamily: SCREEN_FONTS.bold }}>
                  Sắp diễn ra
                </Text>
                <Text className="text-[24px]" style={{ color: PROFILE_THEME_COLORS.onBackground, fontFamily: SCREEN_FONTS.bold, lineHeight: 32 }}>
                  Trận của bạn
                </Text>
              </View>
              <HeroThemeCard item={upcomingMatch} actionLabel="Sẵn sàng" />
            </View>
          ) : null}

          {loading ? (
            <View
              className="mt-8 items-center rounded-[24px] border py-12"
              style={{ borderColor: PROFILE_THEME_COLORS.outlineVariant, backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest }}
            >
              <ActivityIndicator color={theme.primary} />
              <Text className="mt-4 text-sm" style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: SCREEN_FONTS.bold }}>
                Đang tải dữ liệu thật từ hệ thống...
              </Text>
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
        </ScrollView>

        <Pressable
          onPress={() => router.push('/create-session' as never)}
          className="absolute flex-row items-center rounded-full px-8 py-5"
          style={{
            bottom: 100,
            right: 24,
            zIndex: 100,
            borderColor: PROFILE_THEME_COLORS.primaryFixed,
            backgroundColor: PROFILE_THEME_COLORS.primary,
            shadowColor: PROFILE_THEME_COLORS.primary,
            shadowOpacity: 0.28,
            shadowRadius: 24,
            shadowOffset: { width: 0, height: 16 },
          }}
        >
          <Plus size={20} color={PROFILE_THEME_COLORS.onPrimary} />
          <Text className="ml-3 text-[15px] uppercase tracking-[1.3px]" style={{ color: PROFILE_THEME_COLORS.onPrimary, fontFamily: SCREEN_FONTS.headline }}>
            Tạo kèo mới
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}
