import { AppButton } from '@/components/design/AppButton'
import { AppDialog, type AppDialogConfig } from '@/components/design/AppDialog'
import { EmptyState } from '@/components/design/EmptyState'
import { ScreenHeader } from '@/components/design/ScreenHeader'
import type { FeedbackTrait } from '@/components/profile/CommunityFeedbackSection'
import CommunityFeedbackPanel from '@/components/profile/CommunityFeedbackSection'
import {
    PROFILE_SKILL_HERO_TONE,
    ProfileSkillHero,
    ProfileWinStreak,
} from '@/components/profile/ProfileSections'
import { PROFILE_THEME_COLORS } from '@/constants/profileTheme'
import { SCREEN_FONTS } from '@/constants/typography'
import type { TrophyBadge } from '@/components/profile/TrophyRoom'
import TrophyRoomSection from '@/components/profile/TrophyRoom'
import { getSkillLevelFromPlayer, getEloBandByLevelId } from '@/lib/skillAssessment'
import { supabase } from '@/lib/supabase'
import { useAppTheme } from '@/lib/theme-context'
import { router, useFocusEffect } from 'expo-router'
import {
    CalendarDays,
    CircleAlert,
    PencilLine,
    Swords,
    UserCircle2
} from 'lucide-react-native'
import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SPACING } from '@/constants/screenLayout'
import { STRINGS } from '@/constants/strings'

import type { 
    ProfilePlayer as Player, 
    ProfilePlayerStats as PlayerStats, 
    ProfileSessionHistory as SessionHistory 
} from './types'
import { 
    calculateReliabilityScore, 
    buildCommunityTraits, 
    FEEDBACK_META, 
    getBadgeIcon, 
    getBadgeTone 
} from './utils'
import { 
    fetchCurrentPlayerProfileDataApi, 
    clearCurrentPlayerProfileCacheApi 
} from './api'

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
]

export function ProfileScreen() {
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
  const [dialogConfig, setDialogConfig] = useState<AppDialogConfig | null>(null)

  const init = useCallback(async () => {
    setLoading(true)
    const snapshot = await fetchCurrentPlayerProfileDataApi()
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
    setDialogConfig({
      title: `${STRINGS.profile.actions.logout}?`,
      message: 'Bạn chắc muốn đăng xuất không?',
      actions: [
        { label: STRINGS.common.back, tone: 'secondary' },
        {
          label: STRINGS.profile.actions.logout,
          tone: 'danger',
          onPress: async () => {
            await supabase.auth.signOut()
            clearCurrentPlayerProfileCacheApi()
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
      ],
    })
  }

  const communityTraits = useMemo<FeedbackTrait[]>(() => buildCommunityTraits(ratingTags), [ratingTags])

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
          title={STRINGS.profile.title}
        />
        <EmptyState
          icon={<UserCircle2 size={28} color={PROFILE_THEME_COLORS.outline} />}
          title="Đăng nhập để xem hồ sơ"
          description="Quản lý thông tin cá nhân và lịch sử tham gia kèo của bạn ở một nơi gọn gàng hơn."
        />
        <View className="mt-6 gap-3 px-5">
          <AppButton label="Đăng nhập" onPress={() => router.push('/login' as any)} />
          <AppButton label={STRINGS.common.back} onPress={() => router.replace('/(tabs)')} variant="secondary" />
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

  const skill = getSkillLevelFromPlayer(player)
  let effectiveElo = player.current_elo ?? player.elo ?? 0
  
  if (effectiveElo === 0 && skill) {
    effectiveElo = skill.id === 'level_1' ? 800 : (getEloBandByLevelId(skill.id)?.seedElo ?? 800)
  }
  const reliability = calculateReliabilityScore(player.sessions_joined, player.no_show_count)
  const hostedCount = hostedSessionsCount
  const placementPlayed = player.placement_matches_played ?? 0
  const currentWinStreak = playerStats?.current_win_streak ?? 0
  const streakActive = playerStats?.streak_fire_active ?? currentWinStreak > 0
  const joinedYear = player.created_at ? new Date(player.created_at).getFullYear() : null
  const displayCommunityTraits = communityTraits.length > 0 ? communityTraits : PROFILE_MOCK_TRAITS
  const displayAchievements = achievements.length > 0 ? achievements : PROFILE_MOCK_BADGES

  return (
    <View className="flex-1" style={{ backgroundColor: PROFILE_PAGE_COLORS.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 96 }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingTop: insets.top + 20, paddingHorizontal: SPACING.xl }}>
          <View className="pt-4 pb-6">
            <View className="flex-row items-center justify-between">
              <Text
                style={{
                  color: PROFILE_PAGE_COLORS.primary,
                  fontFamily: SCREEN_FONTS.headlineBlack,
                  fontSize: 40,
                  lineHeight: 48, 
                  textTransform: 'uppercase',
                  letterSpacing: -1,
                  flex: 1,
                }}
                numberOfLines={1}
              >
                {player.name}
              </Text>
              
              <TouchableOpacity
                onPress={() => router.push('/edit-profile' as any)}
                hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                activeOpacity={0.7}
                className="ml-4"
              >
                <PencilLine size={22} color={PROFILE_PAGE_COLORS.primary} />
              </TouchableOpacity>
            </View>

            <View className="mt-4 flex-row items-center flex-wrap gap-2">
              <View
                className="rounded-full px-3 py-1"
                style={{ backgroundColor: PROFILE_PAGE_COLORS.primaryContainer }}
              >
                <Text
                  style={{
                    color: PROFILE_PAGE_COLORS.onPrimary,
                    fontFamily: SCREEN_FONTS.cta,
                    fontSize: 10,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                  }}
                >
                  TIN CẬY {reliability === null ? '--' : `${reliability}%`}
                </Text>
              </View>

              <View
                className="rounded-full px-3 py-1"
                style={{ backgroundColor: PROFILE_PAGE_COLORS.primary }}
              >
                <Text
                  style={{
                    color: PROFILE_PAGE_COLORS.onPrimary,
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
                  color: PROFILE_PAGE_COLORS.onSurfaceVariant,
                  fontFamily: SCREEN_FONTS.body,
                  fontSize: 12,
                  marginLeft: 4,
                }}
              >
                Thành viên từ {joinedYear ?? 'N/A'}
              </Text>
            </View>
          </View>

            <Text className="mt-4 text-base leading-7" style={{ color: PROFILE_PAGE_COLORS.onSurfaceVariant, fontFamily: SCREEN_FONTS.body }}>
              {player.bio || 'Chưa có mô tả bản thân.'}
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
            <ProfileSectionDivider index="01" title={STRINGS.profile.sections.overview} />
            <View className="flex-row justify-between gap-4">
              <View className="flex-1 rounded-[24px] p-4" style={{ backgroundColor: PROFILE_PAGE_COLORS.surfaceContainerLow }}>
                <Swords size={22} color={PROFILE_PAGE_COLORS.primary} />
                <Text className="mt-4 text-[28px]" style={{ color: PROFILE_PAGE_COLORS.primary, fontFamily: SCREEN_FONTS.cta }}>
                  {player.sessions_joined ?? 0}
                </Text>
                <Text className="mt-1 text-[12px] uppercase tracking-[2px]" style={{ color: PROFILE_THEME_COLORS.outline, fontFamily: SCREEN_FONTS.cta }}>
                  {STRINGS.profile.stats.matches}
                </Text>
              </View>

              <View className="flex-1 rounded-[24px] p-4" style={{ backgroundColor: PROFILE_PAGE_COLORS.secondaryContainer }}>
                <CalendarDays size={22} color={PROFILE_PAGE_COLORS.surfaceTint} />
                <Text className="mt-4 text-[28px]" style={{ color: PROFILE_PAGE_COLORS.surfaceTint, fontFamily: SCREEN_FONTS.cta }}>
                  {hostedCount}
                </Text>
                <Text className="mt-1 text-[12px] uppercase tracking-[2px]" style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: SCREEN_FONTS.cta }}>
                  {STRINGS.profile.stats.hosted}
                </Text>
              </View>
            </View>
          </View>

          <ProfileWinStreak current={currentWinStreak} active={streakActive} />

          <View className="mt-0 mb-6">
            <ProfileSectionDivider index="02" title={STRINGS.profile.sections.community} />
            <CommunityFeedbackPanel title="" traits={displayCommunityTraits} flushBottom />
          </View>

          <View className="mb-6">
            <ProfileSectionDivider index="03" title={STRINGS.profile.sections.achievements} />
            <TrophyRoomSection badges={displayAchievements} hideHeader flushBottom />
          </View>

          <View className="mt-6">
            <ProfileSectionDivider index="04" title={STRINGS.profile.sections.account} />
            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 py-4 items-center"
                style={{ backgroundColor: PROFILE_PAGE_COLORS.primary, borderRadius: RADIUS.md }}
                onPress={() => router.push('/edit-profile' as any)}
                activeOpacity={0.9}
              >
                <Text style={{ color: PROFILE_THEME_COLORS.onPrimary, fontFamily: SCREEN_FONTS.cta }}>{STRINGS.profile.actions.edit}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-4 items-center"
                style={{ backgroundColor: PROFILE_PAGE_COLORS.secondaryFixed, borderRadius: RADIUS.md }}
                onPress={logout}
                activeOpacity={0.9}
              >
                <Text style={{ color: PROFILE_THEME_COLORS.primary, fontFamily: SCREEN_FONTS.cta }}>{STRINGS.profile.actions.logout}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
      <AppDialog
        visible={Boolean(dialogConfig)}
        config={dialogConfig}
        onClose={() => setDialogConfig(null)}
      />
    </View>
  )
}
