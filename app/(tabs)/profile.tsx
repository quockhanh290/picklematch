import { AppButton, AppStatCard, EmptyState, ScreenHeader, SectionCard, StatusBadge } from '@/components/design'
import TrophyRoomSection from '@/components/profile/TrophyRoom'
import { getSkillLevelFromElo, getSkillLevelFromPlayer } from '@/lib/skillAssessment'
import { supabase } from '@/lib/supabase'
import { router, useFocusEffect } from 'expo-router'
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
      .select(`
        status,
        session:session_id (
          id, status, host_id,
          slot:slot_id (
            start_time, end_time,
            court:court_id ( name, city )
          )
        )
      `)
      .eq('player_id', userId)
      .limit(20)

    if (error) {
      console.warn('[Profile] session history query failed:', error.message)
      return
    }

    if (data) {
      const mapped = data.map((d: any) => ({
          id: d.session.id,
          status: d.session.status,
          is_host: d.session.host_id === userId,
          slot: d.session.slot,
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
    const s = new Date(start)
    const weekday = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][s.getDay()]
    const day = `${s.getDate().toString().padStart(2, '0')}/${(s.getMonth() + 1).toString().padStart(2, '0')}`
    const hh = s.getHours().toString().padStart(2, '0')
    const mm = s.getMinutes().toString().padStart(2, '0')
    return `${weekday} ${day} · ${hh}:${mm}`
  }

  function reliabilityScore() {
    if (!player || !player.sessions_joined) return null
    return Math.round(((player.sessions_joined - player.no_show_count) / player.sessions_joined) * 100)
  }

  function reliabilityValueClass(score: number | null) {
    if (score === null) return 'text-slate-700'
    if (score >= 90) return 'text-emerald-700'
    if (score >= 70) return 'text-amber-700'
    return 'text-rose-700'
  }

  function sessionStatusConfig(status: string) {
    switch (status) {
      case 'open':
        return { tone: 'success' as const, label: 'Đang mở' }
      case 'cancelled':
        return { tone: 'danger' as const, label: 'Đã huỷ' }
      default:
        return { tone: 'neutral' as const, label: 'Kết thúc' }
    }
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
          icon="🏓"
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
      <SafeAreaView className="flex-1 items-center justify-center bg-stone-100" edges={['top']}>
        <ActivityIndicator size="large" color="#16a34a" />
      </SafeAreaView>
    )
  }

  if (!player) {
    return (
      <SafeAreaView className="flex-1 bg-stone-100" edges={['top']}>
        <EmptyState icon="😕" title="Không tìm thấy hồ sơ" description="Thử tải lại hoặc đăng nhập lại để tiếp tục." />
      </SafeAreaView>
    )
  }

  const effectiveElo = player.current_elo ?? player.elo
  const calibratedSkill = getSkillLevelFromElo(effectiveElo)
  const fallbackSkill = getSkillLevelFromPlayer(player)
  const skill = calibratedSkill ?? fallbackSkill
  const reliability = reliabilityScore()
  const hostedCount = history.filter((h) => h.is_host).length
  const placementPlayed = player.placement_matches_played ?? 0
  const placementLeft = Math.max(0, 5 - placementPlayed)

  return (
    <SafeAreaView className="flex-1 bg-stone-100" edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
        {__DEV__ ? (
          <TouchableOpacity onPress={() => supabase.auth.signOut()} style={{ position: 'absolute', top: 50, right: 16, zIndex: 999 }}>
            <Text style={{ color: 'red', fontSize: 12 }}>DEV: Logout</Text>
          </TouchableOpacity>
        ) : null}

        <ScreenHeader
          eyebrow="Hồ sơ cá nhân"
          title={player.name}
          subtitle="Theo dõi trình độ, mức độ tin cậy và lịch sử tham gia kèo của bạn."
          rightSlot={<StatusBadge label={player.is_provisional ? 'Placement' : 'Ổn định'} tone={player.is_provisional ? 'warning' : 'success'} />}
        />

        <View className="px-5">
          <SectionCard className="mb-4">
            <View className="flex-row items-center">
              <View className="mr-4 h-20 w-20 items-center justify-center rounded-[28px] bg-emerald-100">
                <Text className="text-3xl font-black text-emerald-700">{player.name?.[0]?.toUpperCase() ?? '?'}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-2xl font-black text-slate-950">{player.name}</Text>
                <Text className="mt-1 text-sm text-slate-500">📍 {player.city}</Text>
                <Text className="mt-3 text-sm font-semibold text-slate-500">Elo {effectiveElo}</Text>
              </View>
            </View>
            <View className="mt-4 flex-row gap-3">
              <View className="flex-1">
                <AppButton label="Chỉnh sửa hồ sơ" onPress={() => router.push('/edit-profile' as any)} variant="secondary" />
              </View>
              <View className="flex-1">
                <AppButton label="Đăng xuất" onPress={logout} variant="ghost" />
              </View>
            </View>
          </SectionCard>

          <View className="mb-3 flex-row gap-3">
            <AppStatCard value={player.elo} label="ELO" />
            <AppStatCard value={history.length} label="Đã chơi" />
          </View>
          <View className="mb-4 flex-row gap-3">
            <AppStatCard value={hostedCount} label="Đã host" />
            <AppStatCard
              value={reliability === null ? 'Mới' : `${reliability}%`}
              label="Tin cậy"
              valueClassName={reliabilityValueClass(reliability)}
            />
          </View>

          <SectionCard
            title={skill?.title ?? 'Chiến thần cọ xát'}
            subtitle={`Elo ${effectiveElo} · ${skill?.subtitle ?? 'Lower Intermediate'}`}
            className="mb-4"
            rightSlot={<StatusBadge label={skill?.dupr ?? 'DUPR'} tone="info" />}
          >
            <Text className="text-sm leading-6 text-slate-500">{skill?.description}</Text>
          </SectionCard>

          {player.is_provisional ? (
            <SectionCard title="Placement Mode" subtitle="Tài khoản của bạn đang ở giai đoạn đánh giá ban đầu." className="mb-4">
              <Text className="text-sm leading-6 text-slate-500">
                Đã chơi {placementPlayed}/5 trận placement. Còn {placementLeft} trận để hệ thống ổn định Elo chính xác hơn.
              </Text>
              <View className="mt-4 h-3 rounded-full bg-amber-100">
                <View className="h-3 rounded-full bg-amber-500" style={{ width: `${Math.min(100, (placementPlayed / 5) * 100)}%` }} />
              </View>
            </SectionCard>
          ) : null}

          <SectionCard title="Thông tin" className="mb-4">
            <View className="gap-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-semibold text-slate-400">Số điện thoại</Text>
                <Text className="text-sm font-semibold text-slate-900">{player.phone || 'Chưa cập nhật'}</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-semibold text-slate-400">No-show</Text>
                <Text className="text-sm font-semibold text-slate-900">{player.no_show_count}</Text>
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-semibold text-slate-400">Tham gia từ</Text>
                <Text className="text-sm font-semibold text-slate-900">{new Date(player.created_at).toLocaleDateString('vi-VN')}</Text>
              </View>
            </View>
          </SectionCard>

          <View className="mb-4">
            <TrophyRoomSection />
          </View>

          <View className="mb-3 px-1">
            <Text className="text-lg font-extrabold text-slate-900">Lịch sử kèo</Text>
            <Text className="mt-1 text-sm text-slate-500">Các kèo gần nhất bạn đã host hoặc tham gia.</Text>
          </View>

          {history.length === 0 ? (
            <EmptyState icon="🗓️" title="Chưa có kèo nào" description="Khi bạn tham gia hoặc tạo kèo, lịch sử sẽ hiện ở đây." />
          ) : (
            history.map((item) => {
              const cfg = sessionStatusConfig(item.status)
              return (
                <TouchableOpacity
                  key={item.id}
                  className="mb-3"
                  onPress={() => router.push({ pathname: '/session/[id]', params: { id: item.id } })}
                  activeOpacity={0.86}
                >
                  <SectionCard rightSlot={<StatusBadge label={cfg.label} tone={cfg.tone} />}>
                    <Text className="text-sm font-semibold uppercase tracking-[1px] text-slate-400">
                      {formatTime(item.slot.start_time)}
                    </Text>
                    <Text className="mt-2 text-lg font-extrabold text-slate-950">{item.slot.court.name}</Text>
                    <View className="mt-2 flex-row items-center justify-between">
                      <Text className="text-sm text-slate-500">📍 {item.slot.court.city}</Text>
                      {item.is_host ? <StatusBadge label="Host" tone="info" /> : null}
                    </View>
                  </SectionCard>
                </TouchableOpacity>
              )
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
