import { EmptyState, ScreenHeader } from '@/components/design'
import CommunityFeedbackPanel from '@/components/profile/CommunityFeedbackSection'
import {
  ProfileHistoryList,
  ProfileIdentityCard,
  ProfileSkillHero,
  ProfileStatsGrid,
  ProfileWinStreak,
} from '@/components/profile/ProfileSections'
import TrophyRoomSection from '@/components/profile/TrophyRoom'
import { getSkillLevelFromElo, getSkillLevelFromPlayer } from '@/lib/skillAssessment'
import { supabase } from '@/lib/supabase'
import { router, useFocusEffect } from 'expo-router'
import { CalendarDays, CircleAlert, LogOut, UserCircle2 } from 'lucide-react-native'
import { useCallback, useState } from 'react'
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

type Player = {
  id: string
  name: string
  phone: string
  city: string
  skill_label: string
  elo: number
  current_elo?: number | null
  self_assessed_level?: string | null
  is_provisional?: boolean | null
  placement_matches_played?: number | null
  sessions_joined: number
  no_show_count: number
  created_at: string
}

type SessionHistory = {
  id: string
  status: string
  is_host: boolean
  slot: {
    start_time: string
    end_time: string
    court: { name: string; city: string }
  }
}

const WIN_STREAK = {
  current: 5,
  active: true,
}

export default function ProfileScreen() {
  const [checking, setChecking] = useState(true)
  const [loggedIn, setLoggedIn] = useState(false)
  const [player, setPlayer] = useState<Player | null>(null)
  const [history, setHistory] = useState<SessionHistory[]>([])
  const [loading, setLoading] = useState(false)

  const fetchPlayer = useCallback(async (userId: string) => {
    const { data } = await supabase.from('players').select('*').eq('id', userId).single()
    if (data) setPlayer(data)
  }, [])

  const fetchHistory = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('session_players')
      .select(
        `
        status,
        session:session_id (
          id, status, host_id,
          slot:slot_id (
            start_time, end_time,
            court:court_id ( name, city )
          )
        )
      `,
      )
      .eq('player_id', userId)
      .limit(20)

    if (error) {
      console.warn('[Profile] session history query failed:', error.message)
      return
    }

    if (data) {
      const mapped = data
        .map((item: any) => ({
          id: item.session.id,
          status: item.session.status,
          is_host: item.session.host_id === userId,
          slot: item.session.slot,
        }))
        .sort((a: SessionHistory, b: SessionHistory) => new Date(b.slot.start_time).getTime() - new Date(a.slot.start_time).getTime())

      setHistory(mapped)
    }
  }, [])

  const init = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setLoggedIn(false)
      setChecking(false)
      return
    }

    setLoggedIn(true)
    setLoading(true)
    await Promise.all([fetchPlayer(user.id), fetchHistory(user.id)])
    setLoading(false)
    setChecking(false)
  }, [fetchHistory, fetchPlayer])

  useFocusEffect(
    useCallback(() => {
      init()
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
          setLoggedIn(false)
          setPlayer(null)
          setHistory([])
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

  if (checking) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-stone-100" edges={['top']}>
        <ActivityIndicator size="large" color="#16a34a" />
      </SafeAreaView>
    )
  }

  if (!loggedIn) {
    return (
      <SafeAreaView className="flex-1 bg-stone-100" edges={['top']}>
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
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.push('/login' as any)}
            className="items-center justify-center rounded-[18px] bg-emerald-600 px-5 py-4"
          >
            <Text className="text-sm font-bold text-white">Đăng nhập</Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => router.replace('/(tabs)')}
            className="items-center justify-center rounded-[18px] border border-slate-200 bg-white px-5 py-4"
          >
            <Text className="text-sm font-bold text-slate-700">Về trang chủ</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-stone-100" edges={['top']}>
        <ActivityIndicator size="large" color="#16a34a" />
      </SafeAreaView>
    )
  }

  if (!player) {
    return (
      <SafeAreaView className="flex-1 bg-stone-100" edges={['top']}>
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
  const hostedCount = history.filter((item) => item.is_host).length
  const placementPlayed = player.placement_matches_played ?? 0

  return (
    <SafeAreaView className="flex-1 bg-stone-100" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        <ScreenHeader
          eyebrow="Hồ sơ cá nhân"
          title="Profile"
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
            subtitle={skill?.subtitle ?? 'Dữ liệu trình độ sẽ rõ hơn sau thêm vài trận.'}
            description={skill?.description ?? 'Hệ thống đang dùng Elo và tín hiệu sau trận để tinh chỉnh nhịp ghép kèo phù hợp hơn.'}
          />

          <ProfileWinStreak current={WIN_STREAK.current} active={WIN_STREAK.active} />

          <ProfileStatsGrid
            reliability={reliability === null ? 'Mới' : `${reliability}%`}
            reliabilityToneClass={reliabilityTone(reliability)}
            reliabilityDescription="Độ tin cậy hiện tại dựa trên số trận đã chơi, no-show và tần suất hoàn tất kèo đúng nhịp."
            played={history.length}
            hosted={hostedCount}
          />

          <View className="mt-6">
            <CommunityFeedbackPanel />
          </View>

          <View className="mt-6">
            <TrophyRoomSection />
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
            className="mt-6 flex-row items-center justify-center rounded-[18px] border border-rose-100 bg-white px-5 py-4"
          >
            <LogOut size={16} color="#be123c" />
            <Text className="ml-2 text-sm font-bold text-rose-700">Đăng xuất</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
