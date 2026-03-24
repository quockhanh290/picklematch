import { supabase } from '@/lib/supabase'
import { getSkillLevelFromEloRange } from '@/lib/skillAssessment'
import { router, useFocusEffect } from 'expo-router'
import { useCallback, useMemo, useState } from 'react'
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

type Session = {
  id: string
  elo_min: number
  elo_max: number
  max_players: number
  status: string
  court_booking_status: 'confirmed' | 'unconfirmed'
  host_id: string
  host: { name: string; is_provisional?: boolean; placement_matches_played?: number }
  slot: {
    start_time: string
    end_time: string
    price: number
    court: { name: string; address: string; city: string }
  }
  player_count: number
}

type FilterId = 'open' | 'rescue' | 'confirmed' | 'fit' | 'social'

const FILTERS: { id: FilterId; label: string }[] = [
  { id: 'open', label: 'Đang mở 🔥' },
  { id: 'rescue', label: '🔥 Cứu Net' },
  { id: 'confirmed', label: '✅ Sân đã chốt' },
  { id: 'fit', label: '🎯 Vừa miếng' },
  { id: 'social', label: '🍻 Giao lưu' },
]

export default function HomeScreen() {
  const [playerName, setPlayerName] = useState('')
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeFilter, setActiveFilter] = useState<FilterId>('open')

  useFocusEffect(
    useCallback(() => {
      fetchPlayer()
      fetchSessions()
    }, [])
  )

  async function fetchPlayer() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data } = await supabase.from('players').select('name').eq('id', user.id).single()
    if (data) setPlayerName(data.name)
  }

  async function fetchSessions() {
    setLoading(true)

    const { data, error } = await supabase
      .from('sessions')
      .select(`
        id, elo_min, elo_max, max_players, status, court_booking_status,
        host_id,
        host:host_id ( name, is_provisional, placement_matches_played ),
        slot:slot_id (
          start_time, end_time, price,
          court:court_id ( name, address, city )
        ),
        session_players ( player_id )
      `)
      .order('created_at', { ascending: false })
      .limit(50)

    if (!error && data) {
      const mapped = data.map((session: any) => ({
        ...session,
        player_count: (session.session_players ?? []).length,
      }))
      .sort((a: any, b: any) => {
        const bookingWeight = Number(b.court_booking_status === 'confirmed') - Number(a.court_booking_status === 'confirmed')
        if (bookingWeight !== 0) return bookingWeight
        return new Date(a.slot?.start_time ?? 0).getTime() - new Date(b.slot?.start_time ?? 0).getTime()
      })

      setSessions(mapped)
    }

    setLoading(false)
  }

  async function onRefresh() {
    setRefreshing(true)
    await fetchSessions()
    setRefreshing(false)
  }

  function formatTime(start: string, end: string) {
    const s = new Date(start)
    const e = new Date(end)
    const fmt = (date: Date) =>
      `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    const day = `${s.getDate().toString().padStart(2, '0')}/${(s.getMonth() + 1).toString().padStart(2, '0')}`
    return {
      time: `${fmt(s)} → ${fmt(e)}`,
      date: day,
    }
  }

  function skillLabel(eloMin: number, eloMax: number) {
    return getSkillLevelFromEloRange(eloMin, eloMax).title
  }

  function matchTypeLabel(session: Session) {
    return session.elo_max >= 1300 ? '⚔️ Tính điểm' : '🍻 Giao lưu'
  }

  const visibleSessions = useMemo(() => {
    const openSessions = sessions.filter((session) => session.status === 'open' && session.player_count < session.max_players)

    if (activeFilter === 'open') return openSessions
    if (activeFilter === 'rescue') return openSessions.filter((session) => session.player_count >= Math.max(1, session.max_players - 2))
    if (activeFilter === 'confirmed') return openSessions.filter((session) => session.court_booking_status === 'confirmed')
    if (activeFilter === 'fit') return openSessions.filter((session) => session.elo_max <= 1300)
    if (activeFilter === 'social') return openSessions.filter((session) => session.elo_max <= 1200 || !session.court_booking_status)
    return openSessions
  }, [sessions, activeFilter])

  function renderSession({ item }: { item: Session }) {
    const court = (item.slot as any)?.court
    const isConfirmed = item.court_booking_status === 'confirmed'
    const matchType = matchTypeLabel(item)
    const isCompetitive = matchType.includes('Tính điểm')
    const { time, date } = formatTime(item.slot?.start_time, item.slot?.end_time)
    const spotsLeft = Math.max(item.max_players - item.player_count, 0)

    return (
      <TouchableOpacity
        activeOpacity={0.92}
        className={`mx-5 mb-4 rounded-[28px] border border-gray-100 bg-white p-4 ${
          isConfirmed ? 'opacity-100 shadow-sm' : 'opacity-80'
        }`}
        onPress={() => router.push({ pathname: '/session/[id]', params: { id: item.id } })}
      >
        <View className="flex-row items-start justify-between">
          <Text className="mr-3 flex-1 text-lg font-bold text-black" numberOfLines={1}>
            {court?.name ?? 'Chưa có tên sân'}
          </Text>

          <View className={`rounded-full px-3 py-1.5 ${isConfirmed ? 'bg-green-100' : 'bg-amber-100'}`}>
            <Text className={`text-xs font-bold ${isConfirmed ? 'text-green-700' : 'text-amber-700'}`}>
              {isConfirmed ? '✅ Sân đã chốt' : '⏳ Chờ xác nhận sân'}
            </Text>
          </View>
        </View>

        <View className="mt-3">
          <Text className="text-sm text-gray-500" numberOfLines={1}>
            📍 {court?.address ?? 'Chưa có địa chỉ'}
          </Text>
          <Text className="mt-1 text-sm text-gray-500">
            🕒 {time} • {date}
          </Text>
        </View>

        <View className="mt-3 flex-row items-center justify-between">
          <Text className="mr-3 flex-1 text-sm font-medium text-gray-700">🏆 {skillLabel(item.elo_min, item.elo_max)}</Text>

          <View className={`rounded-full px-3 py-1.5 ${isCompetitive ? 'bg-orange-100' : 'bg-sky-100'}`}>
            <Text className={`text-xs font-bold ${isCompetitive ? 'text-orange-700' : 'text-sky-700'}`}>
              {matchType}
            </Text>
          </View>
        </View>

        <View className="my-3 border-t border-gray-100" />

        <View className="flex-row items-center justify-between">
          <View className="flex-1 flex-row items-center">
            <View className="h-6 w-6 items-center justify-center rounded-full bg-gray-900">
              <Text className="text-[10px] font-bold text-white">
                {((item.host as any)?.name ?? '?').slice(0, 1).toUpperCase()}
              </Text>
            </View>

            <View className="ml-2 flex-row items-center">
              <Text className="text-xs text-gray-500">bởi </Text>
              <Text className="text-xs font-semibold text-gray-800">{(item.host as any)?.name ?? 'Ẩn danh'}</Text>
              {(item.host as any)?.is_provisional ? <Text className="ml-1 text-xs">🛡️</Text> : null}
            </View>
          </View>

          <Text className="mx-3 text-sm font-semibold text-gray-900">
            💰 {(item.slot?.price ?? 0).toLocaleString('vi-VN')}đ/người
          </Text>

          <View className="rounded-full bg-green-50 px-3 py-1.5">
            <Text className="text-xs font-bold text-green-700">👥 {spotsLeft}/{item.max_players} Còn chỗ</Text>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  const header = (
    <View className="px-5 pt-4">
      <Text className="text-sm text-gray-500">Xin chào 👋</Text>
      <Text className="mt-1 text-3xl font-bold text-black">{playerName || 'Player1'}</Text>

      <View className="mt-5 flex-row gap-3">
        <TouchableOpacity
          activeOpacity={0.9}
          className="flex-1 rounded-2xl border border-green-500 bg-white px-4 py-4"
          onPress={() => router.push('/(tabs)/find-session' as any)}
        >
          <Text className="text-center text-sm font-bold text-green-700">⚡ Cứu net quanh đây</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.9}
          className="flex-1 rounded-2xl bg-green-600 px-4 py-4"
          onPress={() => router.push('/create-session' as any)}
        >
          <Text className="text-center text-sm font-bold text-white">+ Tạo kèo</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingTop: 20, paddingBottom: 8 }}>
        {FILTERS.map((filter) => {
          const isActive = activeFilter === filter.id

          return (
            <TouchableOpacity
              key={filter.id}
              activeOpacity={0.9}
              className={`mr-3 rounded-full px-4 py-2.5 ${isActive ? 'bg-green-600' : 'bg-gray-200'}`}
              onPress={() => setActiveFilter(filter.id)}
            >
              <Text className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-gray-900'}`}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </ScrollView>
    </View>
  )

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        {header}
        <ActivityIndicator color="#16a34a" style={{ marginTop: 40 }} />
      </SafeAreaView>
    )
  }

  if (visibleSessions.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        {header}
        <View className="mt-16 items-center px-8">
          <Text className="mb-3 text-5xl">🎾</Text>
          <Text className="mb-1 text-center text-base font-semibold text-gray-900">Chưa có kèo phù hợp với bộ lọc này</Text>
          <Text className="text-center text-sm leading-6 text-gray-500">
            Thử chuyển filter khác hoặc tạo một kèo mới để kéo thêm người chơi vào sân.
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <FlatList
        data={visibleSessions}
        keyExtractor={(item) => item.id}
        renderItem={renderSession}
        ListHeaderComponent={header}
        contentContainerStyle={{ paddingBottom: 28, paddingTop: 6 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16a34a" />}
      />
    </SafeAreaView>
  )
}
