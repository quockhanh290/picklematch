import { AppButton, EmptyState, ScreenHeader } from '@/components/design'
import type { FeedbackTrait } from '@/components/profile/CommunityFeedbackSection'
import CommunityFeedbackPanel from '@/components/profile/CommunityFeedbackSection'
import {
  ProfileHistoryList,
  ProfileIdentityCard,
  ProfileSkillHero,
  ProfileStatsGrid,
  ProfileWinStreak,
} from '@/components/profile/ProfileSections'
import type { TrophyBadge } from '@/components/profile/TrophyRoom'
import TrophyRoomSection from '@/components/profile/TrophyRoom'
import {
  buildCommunityTraits,
  clearCurrentPlayerProfileCache,
  fetchCurrentPlayerProfileData,
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
  ClipboardList,
  LogOut,
  Trophy,
  UserCircle2,
} from 'lucide-react-native'
import { useCallback, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'


export default function ProfileScreen() {
  const theme = useAppTheme()
  const [checking, setChecking] = useState(true)
  const [loggedIn, setLoggedIn] = useState(false)
  const [player, setPlayer] = useState<Player | null>(null)
  const [playerStats, setPlayerStats] = useState<PlayerStats | null>(null)
  const [ratingTags, setRatingTags] = useState<Record<string, number>>({})
  const [achievements, setAchievements] = useState<TrophyBadge[]>([])
  const [history, setHistory] = useState<SessionHistory[]>([])
  const [hostedSessionsCount, setHostedSessionsCount] = useState(0)
  const [loading, setLoading] = useState(false)

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

  function reliabilityScore() {
    if (!player || !player.sessions_joined) return null
    return Math.round(((player.sessions_joined - player.no_show_count) / player.sessions_joined) * 100)
  }

  function reliabilityTone(score: number | null) {
    if (score === null) return 'text-slate-700'
    if (score >= 90) return 'text-emerald-700'
    if (score >= 70) return 'text-amber-600'
    return 'text-rose-600'
  }

  const communityTraits = useMemo<FeedbackTrait[]>(() => {
    return buildCommunityTraits(ratingTags)
  }, [ratingTags])

  if (checking) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center" style={{ backgroundColor: theme.backgroundMuted }} edges={['top']}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    )
  }

  if (!loggedIn) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: theme.backgroundMuted }} edges={['top']}>
        <ScreenHeader
          eyebrow="Hồ sơ"
          title="Tài khoản của bạn"
          subtitle="Đăng nhập để xem lịch sử kèo, độ tin cậy và tiến trình placement."
        />
        <EmptyState
          icon={<UserCircle2 size={28} color="#64748b" />}
          title="Đăng nhập để xem hồ sơ"
          description="Quản lý thông tin cá nhân và lịch sử tham gia kèo của bạn ở một nơi gọn gàng hơn."
        />
        <View className="mt-6 gap-3 px-5">
          <AppButton label="Đăng nhập" onPress={() => router.push('/login' as any)} />
          <AppButton label="Về trang chủ" onPress={() => router.replace('/(tabs)')} variant="secondary" />
        </View>
      </SafeAreaView>
    )
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center" style={{ backgroundColor: theme.backgroundMuted }} edges={['top']}>
        <ActivityIndicator size="large" color={theme.primary} />
      </SafeAreaView>
    )
  }

  if (!player) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: theme.backgroundMuted }} edges={['top']}>
        <EmptyState
          icon={<CircleAlert size={28} color="#64748b" />}
          title="Không tìm thấy hồ sơ"
          description="Thử tải lại hoặc đăng nhập lại để tiếp tục."
        />
      </SafeAreaView>
    )
  }

  const effectiveElo = player.current_elo ?? player.elo
  const calibratedSkill = getSkillLevelFromElo(effectiveElo)
  const fallbackSkill = getSkillLevelFromPlayer(player)
  const skill = calibratedSkill ?? fallbackSkill
  const reliability = reliabilityScore()
  const hostedCount = hostedSessionsCount
  const placementPlayed = player.placement_matches_played ?? 0
  const currentWinStreak = playerStats?.current_win_streak ?? 0
  const streakActive = playerStats?.streak_fire_active ?? currentWinStreak > 0

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.backgroundMuted }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        <ScreenHeader
          eyebrow="Hồ sơ cá nhân"
          title="Hồ sơ"
          subtitle="Theo dõi trình độ, độ tin cậy và những tín hiệu cộng đồng quanh tài khoản của bạn."
        />

        <View className="px-5">
          <ProfileIdentityCard
            name={player.name}
            city={player.city}
            joinedAt={player.created_at}
            isProvisional={Boolean(player.is_provisional)}
            placementMatchesPlayed={placementPlayed}
            actions={[{ label: 'Sửa hồ sơ', icon: 'edit', onPress: () => router.push('/edit-profile' as any) }]}
          />

          <ProfileSkillHero
            elo={effectiveElo}
            title={skill?.title ?? 'Đang hiệu chỉnh'}
            subtitle="Mức khởi điểm hiện tại. Hệ thống sẽ tiếp tục tinh chỉnh sau vài trận."
            description={
              skill?.description
                ? `${skill.description} Đây là ảnh chụp hiện tại để ghép kèo dễ chịu hơn, không phải nhãn cố định.`
                : 'Hệ thống đang dùng Elo và tín hiệu sau trận để tinh chỉnh nhịp ghép kèo phù hợp hơn.'
            }
            levelId={skill?.id}
          />

          <ProfileWinStreak current={currentWinStreak} active={streakActive} />

          <ProfileStatsGrid
            reliability={reliability === null ? 'Mới' : `${reliability}%`}
            reliabilityToneClass={reliabilityTone(reliability)}
            reliabilityDescription="Độ tin cậy hiện tại dựa trên số trận đã chơi, no-show và tần suất hoàn tất kèo đúng nhịp."
            played={player.sessions_joined ?? 0}
            hosted={hostedCount}
          />

          <View className="mt-6">
            {communityTraits.length > 0 ? (
              <CommunityFeedbackPanel eyebrow="Điểm nổi bật" title="Đánh giá từ cộng đồng" traits={communityTraits} />
            ) : (
              <EmptyState
                icon={<ClipboardList size={28} color="#64748b" />}
                title="Chưa có đánh giá nào"
                description="Sau khi chơi thêm vài kèo, phản hồi từ cộng đồng sẽ xuất hiện ở đây."
              />
            )}
          </View>

          <View className="mt-6">
            {achievements.length > 0 ? (
              <TrophyRoomSection badges={achievements} />
            ) : (
              <EmptyState
                icon={<Trophy size={28} color="#64748b" />}
                title="Chưa mở khoá danh hiệu nào"
                description="Khi đạt các mốc về phong độ, host uy tín hoặc thành tích, Trophy Room sẽ cập nhật tại đây."
              />
            )}
          </View>

          {history.length === 0 ? (
            <View className="mt-4">
              <EmptyState
                icon={<CalendarDays size={28} color="#64748b" />}
                title="Chưa có kèo nào"
                description="Khi bạn tham gia hoặc tạo kèo, lịch sử sẽ hiện ở đây."
              />
            </View>
          ) : (
            <ProfileHistoryList
              title="Lịch sử kèo"
              subtitle="Danh sách kèo gần nhất bạn đã host hoặc tham gia."
              items={history}
              formatTime={formatTime}
              showRateAction
            />
          )}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={logout}
            className="mt-6 flex-row items-center justify-center rounded-[18px] px-5 py-4"
            style={{ borderWidth: 1, borderColor: theme.dangerSoft, backgroundColor: theme.surface }}
          >
            <LogOut size={16} color={theme.danger} />
            <Text className="ml-2 text-sm font-bold text-rose-700">Đăng xuất</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
