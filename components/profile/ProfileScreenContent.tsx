import { colors } from '@/constants/colors'
import { AppButton, EmptyState, ScreenHeader } from '@/components/design'
import type { FeedbackTrait } from '@/components/profile/CommunityFeedbackSection'
import CommunityFeedbackPanel from '@/components/profile/CommunityFeedbackSection'
import {
    PROFILE_SKILL_HERO_TONE,
    ProfileHistoryList,
    ProfileSkillHero,
    ProfileWinStreak,
} from '@/components/profile/ProfileSections'
import { PROFILE_THEME_COLORS } from '@/components/profile/profileTheme'
import { SCREEN_FONTS } from '@/constants/typography'
import type { TrophyBadge } from '@/components/profile/TrophyRoom'
import TrophyRoomSection from '@/components/profile/TrophyRoom'
import {
    FEEDBACK_META,
    buildCommunityTraits,
    calculateReliabilityScore,
    clearCurrentPlayerProfileCache,
    fetchCurrentPlayerProfileData,
    getBadgeIcon,
    getBadgeTone,
    type ProfilePlayer as Player,
    type ProfilePlayerStats as PlayerStats,
    type ProfileSessionHistory as SessionHistory,
} from '@/lib/profileData'
import { getSkillLevelFromElo, getSkillLevelFromPlayer } from '@/lib/skillAssessment'
import { supabase } from '@/lib/supabase'
import { useAppTheme } from '@/lib/theme-context'
import { router, useFocusEffect } from 'expo-router'
import {
    CalendarDays,
    CircleAlert,
    Menu,
    PencilLine,
    Swords,
    UserCircle2
} from 'lucide-react-native'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { SPACING } from '@/constants/screenLayout'

const PROFILE_PAGE_COLORS = PROFILE_THEME_COLORS

function ProfileSectionDivider({ index, title }: { index: string; title: string }) {
  return (
    <View className="mb-6 flex-row items-center gap-4">
      <Text className="text-[11px] uppercase tracking-[4px]" style={{ color: PROFILE_PAGE_COLORS.outline, fontFamily: SCREEN_FONTS.cta }}>
        {index} / {title}
      </Text>
      <View className="h-px flex-1" style={{ backgroundColor: PROFILE_PAGE_COLORS.outlineVariant }} />
    </View>
  )
}

const PROFILE_MOCK_TRAITS: FeedbackTrait[] = [
  {
    key: 'friendly-mock',
    icon: FEEDBACK_META.friendly.icon,
    label: FEEDBACK_META.friendly.label,
    count: '+12 ghi nhận',
    context: FEEDBACK_META.friendly.context,
    tone: 'positive',
  },
  {
    key: 'skilled-mock',
    icon: FEEDBACK_META.skilled.icon,
    label: FEEDBACK_META.skilled.label,
    count: '+9 ghi nhận',
    context: FEEDBACK_META.skilled.context,
    tone: 'positive',
  },
  {
    key: 'on-time-mock',
    icon: FEEDBACK_META.on_time.icon,
    label: FEEDBACK_META.on_time.label,
    count: '+8 ghi nhận',
    context: FEEDBACK_META.on_time.context,
    tone: 'positive',
  },
  {
    key: 'fair-play-mock',
    icon: FEEDBACK_META.fair_play.icon,
    label: FEEDBACK_META.fair_play.label,
    count: '+6 ghi nhận',
    context: FEEDBACK_META.fair_play.context,
    tone: 'positive',
  },
]

const PROFILE_MOCK_BADGES: TrophyBadge[] = [
  {
    key: 'active_member_20',
    title: 'Active Member',
    category: 'progression',
    description: 'Duy trì nhịp chơi đều và xuất hiện thường xuyên trong cộng đồng.',
    requirement: 'Chơi đủ 20 trận',
    icon: getBadgeIcon('graduation-cap'),
    tone: getBadgeTone('progression'),
    earned: true,
    earnedAt: '12/03/2026',
  },
  {
    key: 'golden_host',
    title: 'Golden Host',
    category: 'conduct',
    description: 'Được đánh giá cao ở khả năng giữ nhịp kèo và tổ chức mượt.',
    requirement: 'Chủ kèo được đánh giá 4.9+',
    icon: getBadgeIcon('shield'),
    tone: getBadgeTone('conduct'),
    earned: true,
    earnedAt: '02/04/2026',
  },
  {
    key: 'win_streak_3',
    title: 'Hot Streak',
    category: 'momentum',
    description: 'Giữ chuỗi thắng liên tiếp và duy trì phong độ ổn định.',
    requirement: 'Đạt chuỗi thắng 3 trận',
    icon: getBadgeIcon('flame'),
    tone: getBadgeTone('momentum'),
    earned: true,
    earnedAt: '08/04/2026',
  },
]

const PROFILE_MOCK_HISTORY: SessionHistory[] = [
  {
    id: 'mock-session-1',
    status: 'done',
    is_host: true,
    slot: {
      start_time: '2026-04-12T19:00:00.000Z',
      end_time: '2026-04-12T21:00:00.000Z',
      court: { name: 'Saigon Pickle Dome', city: 'TP.HCM' },
    },
  },
  {
    id: 'mock-session-2',
    status: 'done',
    is_host: false,
    slot: {
      start_time: '2026-04-09T11:00:00.000Z',
      end_time: '2026-04-09T13:00:00.000Z',
      court: { name: 'Sunrise Courts', city: 'Thủ Đức' },
    },
  },
  {
    id: 'mock-session-3',
    status: 'done',
    is_host: true,
    slot: {
      start_time: '2026-04-05T08:30:00.000Z',
      end_time: '2026-04-05T10:30:00.000Z',
      court: { name: 'Riverside Pickle Club', city: 'Quận 7' },
    },
  },
]

export default function ProfileScreenContent() {
  const insets = useSafeAreaInsets()
  const theme = useAppTheme()
  const { width } = useWindowDimensions()
  const [checking, setChecking] = useState(true)
  const [loggedIn, setLoggedIn] = useState(false)
  const [player, setPlayer] = useState<Player | null>(null)
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null)
  const [ratingTags, setRatingTags] = useState<Record<string, number>>({})
  const [achievements, setAchievements] = useState<TrophyBadge[]>([])
  const [history, setHistory] = useState<SessionHistory[]>([])
  const [hostedSessionsCount, setHostedSessionsCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [nameFitsOneLine, setNameFitsOneLine] = useState<boolean | null>(null)
  const [nameMeasureWidth, setNameMeasureWidth] = useState(0)

  const init = useCallback(async () => {
    setLoading(true)
    const snapshot = await fetchCurrentPlayerProfileData()
    setLoggedIn(snapshot.loggedIn)
    setPlayer(snapshot.player)
    setPlayerStats(snapshot.playerStats)
    setRatingTags(snapshot.ratingTags)
    setAchievements(snapshot.achievements)
    setHistory(snapshot.history)
    setHostedSessionsCount(snapshot.hostedSessionsCount)
    setLoading(false)
    setChecking(false)
  }, [])

  useFocusEffect(
    useCallback(() => {
      void init()
    }, [init]),
  )

  async function logout() {
    Alert.alert('Đăng xuất?', 'Bạn chắc muốn đăng xuất không?', [
      { text: 'Huỷ', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut()
          clearCurrentPlayerProfileCache()
          setLoggedIn(false)
          setPlayer(null)
          setPlayerStats(null)
          setRatingTags({})
          setAchievements([])
          setHistory([])
          setHostedSessionsCount(0)
          router.replace('/(tabs)')
        },
      },
    ])
  }

  function formatTime(start: string) {
    const date = new Date(start)
    const weekday = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][date.getDay()]
    const day = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`
    const hh = date.getHours().toString().padStart(2, '0')
    const mm = date.getMinutes().toString().padStart(2, '0')
    return `${weekday} ${day} · ${hh}:${mm}`
  }

  const communityTraits = useMemo<FeedbackTrait[]>(() => buildCommunityTraits(ratingTags), [ratingTags])

  useEffect(() => {
    setNameFitsOneLine(null)
  }, [player?.name, width])

  if (checking) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: theme.backgroundMuted, paddingTop: insets.top }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    )
  }

  if (!loggedIn) {
    return (
      <View className="flex-1" style={{ backgroundColor: theme.backgroundMuted, paddingTop: insets.top }}>
        <ScreenHeader
          compact
          title="Hồ sơ"
        />
        <EmptyState
          icon={<UserCircle2 size={28} color={PROFILE_THEME_COLORS.outline} />}
          title="Đăng nhập để xem hồ sơ"
          description="Quản lý thông tin cá nhân và lịch sử tham gia kèo của bạn ở một nơi gọn gàng hơn."
        />
        <View className="mt-6 gap-3 px-5">
          <AppButton label="Đăng nhập" onPress={() => router.push('/login' as any)} />
          <AppButton label="Về trang chủ" onPress={() => router.replace('/(tabs)')} variant="secondary" />
        </View>
      </View>
    )
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: theme.backgroundMuted, paddingTop: insets.top }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    )
  }

  if (!player) {
    return (
      <View className="flex-1" style={{ backgroundColor: theme.backgroundMuted, paddingTop: insets.top }}>
        <EmptyState
          icon={<CircleAlert size={28} color={PROFILE_THEME_COLORS.outline} />}
          title="Không tìm thấy hồ sơ"
          description="Thử tải lại hoặc đăng nhập lại để tiếp tục."
        />
      </View>
    )
  }

  const effectiveElo = player.current_elo ?? player.elo
  const calibratedSkill = getSkillLevelFromElo(effectiveElo)
  const fallbackSkill = getSkillLevelFromPlayer(player)
  const skill = calibratedSkill ?? fallbackSkill
  const reliability = calculateReliabilityScore(player.sessions_joined, player.no_show_count)
  const hostedCount = hostedSessionsCount
  const placementPlayed = player.placement_matches_played ?? 0
  const currentWinStreak = playerStats?.current_win_streak ?? 0
  const streakActive = playerStats?.streak_fire_active ?? currentWinStreak > 0
  const nameParts = (player.name || '').trim().split(/\s+/).filter(Boolean)
  const headlineMainName = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : player.name
  const headlineSubName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : ''
  const joinedYear = player.created_at ? new Date(player.created_at).getFullYear() : null
  const editorialNameSize = width < 360 ? 42 : width < 420 ? 50 : 58
  const editorialNameLineHeight = width < 360 ? 52 : width < 420 ? 62 : 72
  const shouldUseSplitEditorialName = Boolean(headlineSubName) && nameFitsOneLine === false
  const displayCommunityTraits = communityTraits.length > 0 ? communityTraits : PROFILE_MOCK_TRAITS
  const displayAchievements = achievements.length > 0 ? achievements : PROFILE_MOCK_BADGES
  const displayHistory = history.length > 0 ? history : PROFILE_MOCK_HISTORY

  return (
    <View className="flex-1" style={{ backgroundColor: PROFILE_PAGE_COLORS.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 96 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingTop: insets.top + 20, paddingHorizontal: SPACING.xl }}>
          <View className="pt-4 pb-6">
            <View className="flex-row items-end justify-between gap-3">
              <View className="flex-1 flex-row items-end flex-wrap gap-2">
                <Text
                  style={{
                    flex: 1,
                    color: colors.primary,
                    fontFamily: SCREEN_FONTS.headlineBlack,
                    fontSize: 40,
                    lineHeight: 48,
                    textTransform: 'uppercase',
                    letterSpacing: -1,
                  }}
                >
                  {player.name}
                </Text>
                
                <View
                  className="rounded-full px-3 py-1.5 mb-1"
                  style={{ backgroundColor: colors.primaryDark }}
                >
                  <Text
                    style={{
                      color: '#FFFFFF',
                      fontFamily: SCREEN_FONTS.cta,
                      fontSize: 10,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    TIN CẬY · {reliability === null ? '--' : `${reliability}%`}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => router.push('/edit-profile' as any)}
                className="h-9 w-9 items-center justify-center rounded-full"
                style={{
                  backgroundColor: colors.primaryLight,
                  shadowColor: colors.primary,
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  shadowOffset: { width: 0, height: 2 },
                }}
              >
                <PencilLine size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <View className="mt-4 flex-row items-center gap-3">
              <View
                className="rounded-full px-4 py-1.5"
                style={{ backgroundColor: colors.primary }}
              >
                <Text
                  style={{
                    color: '#FFFFFF',
                    fontFamily: SCREEN_FONTS.cta,
                    fontSize: 10,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                  }}
                >
                  {player.is_provisional ? `${placementPlayed}/5 PLACEMENT` : 'VERIFIED PLAYER'}
                </Text>
              </View>

              <Text
                style={{
                  color: colors.textSecondary,
                  fontFamily: SCREEN_FONTS.body,
                  fontSize: 13,
                }}
              >
                Thành viên từ {joinedYear ?? 'N/A'}
              </Text>
            </View>
          </View>

            <Text className="mt-4 text-base leading-7" style={{ color: PROFILE_PAGE_COLORS.onSurfaceVariant, fontFamily: SCREEN_FONTS.body }}>
              Đam mê Pickleball với phong cách chơi năng lượng cao. Luôn tìm kiếm những trận đấu kịch tính và phù hợp trình độ.
            </Text>

            <View className="mt-4">
              <ProfileSkillHero
                elo={effectiveElo}
                title={skill?.title ?? 'Đang hiệu chỉnh'}
                subtitle={skill?.subtitle ?? 'Mức khởi điểm hiện tại. Hệ thống sẽ tiếp tục tinh chỉnh sau vài trận.'}
                description={skill?.description ?? 'Hệ thống đang dùng Elo và tín hiệu sau trận để tinh chỉnh nhịp ghép kèo phù hợp hơn.'}
                levelId={skill?.id}
                colors={PROFILE_SKILL_HERO_TONE}
                contentRightInset={16}
              />
            </View>

          <View className="mb-10 gap-4">
            <ProfileSectionDivider index="01" title="TỔNG QUAN" />
            <View className="flex-row justify-between gap-4">
              <View className="flex-1 rounded-[24px] p-4" style={{ backgroundColor: PROFILE_PAGE_COLORS.surfaceContainerLow }}>
                <Swords size={22} color={PROFILE_PAGE_COLORS.primary} />
                <Text className="mt-4 text-[28px]" style={{ color: PROFILE_PAGE_COLORS.primary, fontFamily: SCREEN_FONTS.cta }}>
                  {player.sessions_joined ?? 0}
                </Text>
                <Text className="mt-1 text-[12px] uppercase tracking-[2px]" style={{ color: PROFILE_PAGE_COLORS.outline, fontFamily: SCREEN_FONTS.cta }}>
                  Trận đấu
                </Text>
              </View>

              <View className="flex-1 rounded-[24px] p-4" style={{ backgroundColor: PROFILE_PAGE_COLORS.secondaryContainer }}>
                <CalendarDays size={22} color={PROFILE_PAGE_COLORS.surfaceTint} />
                <Text className="mt-4 text-[28px]" style={{ color: PROFILE_PAGE_COLORS.surfaceTint, fontFamily: SCREEN_FONTS.cta }}>
                  {hostedCount}
                </Text>
                <Text className="mt-1 text-[12px] uppercase tracking-[2px]" style={{ color: PROFILE_PAGE_COLORS.onSurfaceVariant, fontFamily: SCREEN_FONTS.cta }}>
                  Đã host
                </Text>
              </View>
            </View>
          </View>

          <ProfileWinStreak current={currentWinStreak} active={streakActive} />

          <View className="mt-0 mb-6">
            <ProfileSectionDivider index="02" title="CỘNG ĐỒNG" />
            <CommunityFeedbackPanel title="" traits={displayCommunityTraits} flushBottom />
          </View>

          <View className="mb-6">
            <ProfileSectionDivider index="03" title="DANH HIỆU" />
            <TrophyRoomSection badges={displayAchievements} hideHeader flushBottom />
          </View>

          <View className="mt-6">
            <ProfileSectionDivider index="04" title="TÀI KHOẢN" />
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 rounded-full py-4 items-center"
                style={{ backgroundColor: PROFILE_PAGE_COLORS.primary }}
                onPress={() => router.push('/edit-profile' as any)}
                activeOpacity={0.9}
              >
                <Text style={{ color: PROFILE_PAGE_COLORS.onPrimary, fontFamily: SCREEN_FONTS.cta }}>Sửa hồ sơ</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 rounded-full py-4 items-center"
                style={{ backgroundColor: PROFILE_PAGE_COLORS.secondaryFixed }}
                onPress={logout}
                activeOpacity={0.9}
              >
                <Text style={{ color: PROFILE_PAGE_COLORS.primary, fontFamily: SCREEN_FONTS.cta }}>Đăng xuất</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}


