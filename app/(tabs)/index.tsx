import { FeedMatchCard } from '@/components/session/FeedMatchCard'
import { getSkillLevelFromEloRange } from '@/lib/skillAssessment'
import { supabase } from '@/lib/supabase'
import { router, useFocusEffect } from 'expo-router'
import { Hand, Plus, Zap } from 'lucide-react-native'
import type { ReactNode } from 'react'
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
  { id: 'open', label: 'Đang mở' },
  { id: 'rescue', label: 'Cứu net' },
  { id: 'confirmed', label: 'Sân đã chốt' },
  { id: 'fit', label: 'Vừa miếng' },
  { id: 'social', label: 'Giao lưu' },
]

function HeaderAction({
  label,
  onPress,
  icon,
  variant,
}: {
  label: string
  onPress: () => void
  icon: ReactNode
  variant: 'primary' | 'secondary'
}) {
  const primary = variant === 'primary'

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={onPress}
      className={`flex-1 flex-row items-center justify-center rounded-2xl px-4 py-4 ${
        primary ? 'bg-emerald-600' : 'border border-orange-100 bg-orange-50'
      }`}
    >
      {icon}
      <Text className={`ml-2 text-sm font-bold ${primary ? 'text-white' : 'text-orange-700'}`}>{label}</Text>
    </TouchableOpacity>
  )
}

export default function HomeScreen() {
  const [playerName, setPlayerName] = useState('')
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeFilter, setActiveFilter] = useState<FilterId>('open')

  const fetchPlayer = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data } = await supabase.from('players').select('name').eq('id', user.id).single()
    if (data) setPlayerName(data.name)
  }, [])

  const fetchSessions = useCallback(async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('sessions')
      .select(
        `
        id, elo_min, elo_max, max_players, status, court_booking_status,
        host_id,
        host:host_id ( name, is_provisional, placement_matches_played ),
        slot:slot_id (
          start_time, end_time, price,
          court:court_id ( name, address, city )
        ),
        session_players ( player_id )
      `,
      )
      .order('created_at', { ascending: false })
      .limit(50)

    if (!error && data) {
      const mapped = data
        .map((session: any) => ({
          ...session,
          player_count: (session.session_players ?? []).length,
        }))
        .sort((a: any, b: any) => {
          const bookingWeight =
            Number(b.court_booking_status === 'confirmed') - Number(a.court_booking_status === 'confirmed')
          if (bookingWeight !== 0) return bookingWeight
          return new Date(a.slot?.start_time ?? 0).getTime() - new Date(b.slot?.start_time ?? 0).getTime()
        })

      setSessions(mapped)
    } else {
      setSessions([])
    }

    setLoading(false)
  }, [])

  useFocusEffect(
    useCallback(() => {
      fetchPlayer()
      fetchSessions()
    }, [fetchPlayer, fetchSessions]),
  )

  async function onRefresh() {
    setRefreshing(true)
    await fetchSessions()
    setRefreshing(false)
  }

  function formatTime(start: string, end: string) {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const pad = (value: number) => value.toString().padStart(2, '0')

    return {
      time: `${pad(startDate.getHours())}:${pad(startDate.getMinutes())} - ${pad(endDate.getHours())}:${pad(
        endDate.getMinutes(),
      )}`,
      date: `${pad(startDate.getDate())}/${pad(startDate.getMonth() + 1)}`,
    }
  }

  function matchTypeLabel(session: Session) {
    return session.elo_max >= 1300 ? 'Tính điểm' : 'Giao lưu'
  }

  const visibleSessions = useMemo(() => {
    const openSessions = sessions.filter((session) => session.status === 'open')

    if (activeFilter === 'open') return openSessions
    if (activeFilter === 'rescue')
      return openSessions.filter((session) => session.player_count >= Math.max(1, session.max_players - 2))
    if (activeFilter === 'confirmed')
      return openSessions.filter((session) => session.court_booking_status === 'confirmed')
    if (activeFilter === 'fit') return openSessions.filter((session) => session.elo_max <= 1300)
    if (activeFilter === 'social') return openSessions.filter((session) => session.elo_max <= 1200)
    return openSessions
  }, [sessions, activeFilter])

  function renderSession({ item }: { item: Session }) {
    const court = item.slot?.court
    const formatted = formatTime(item.slot?.start_time, item.slot?.end_time)
    const currentPlayers = item.player_count

    return (
      <FeedMatchCard
        courtName={court?.name ?? 'Chưa có tên sân'}
        address={court?.address ?? 'Chưa có địa chỉ'}
        timeLabel={formatted.time}
        dateLabel={formatted.date}
        bookingStatus={item.court_booking_status}
        skillLabel={getSkillLevelFromEloRange(item.elo_min, item.elo_max).title}
        matchTypeLabel={matchTypeLabel(item)}
        hostName={item.host?.name ?? 'Ẩn danh'}
        isProvisional={Boolean(item.host?.is_provisional)}
        priceLabel={`${(item.slot?.price ?? 0).toLocaleString('vi-VN')}đ/người`}
        availabilityLabel={currentPlayers >= item.max_players ? 'Đầy' : `${currentPlayers}/${item.max_players}`}
        onPress={() => router.push({ pathname: '/session/[id]', params: { id: item.id } })}
      />
    )
  }

  const header = (
    <View className="bg-gray-50">
      <View className="px-5 pb-3 pt-4">
        <View className="flex-row items-center">
          <Text className="text-sm font-medium text-gray-500">Xin chào</Text>
          <Hand size={14} color="#6b7280" style={{ marginLeft: 6 }} />
        </View>
        <Text className="mt-1 text-3xl font-black text-gray-950">{playerName || 'Player1'}</Text>
      </View>

      <View className="px-5 pb-3">
        <View className="flex-row gap-3">
          <HeaderAction
            label="Cứu net"
            variant="secondary"
            onPress={() => router.push('/(tabs)/find-session' as any)}
            icon={<Zap size={18} color="#c2410c" />}
          />
          <HeaderAction
            label="Tạo kèo mới"
            variant="primary"
            onPress={() => router.push('/create-session' as any)}
            icon={<Plus size={18} color="#ffffff" />}
          />
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 10, paddingTop: 6 }}
      >
        {FILTERS.map((filter) => {
          const active = activeFilter === filter.id

          return (
            <TouchableOpacity
              key={filter.id}
              activeOpacity={0.9}
              onPress={() => setActiveFilter(filter.id)}
              className={`mr-3 rounded-full border px-4 py-2.5 ${
                active ? 'border-gray-900 bg-gray-900' : 'border-gray-200 bg-white'
              }`}
            >
              <Text className={`text-sm font-semibold ${active ? 'text-white' : 'text-gray-600'}`}>{filter.label}</Text>
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
        <ActivityIndicator color="#059669" style={{ marginTop: 40 }} />
      </SafeAreaView>
    )
  }

  if (visibleSessions.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
        {header}
        <View className="px-5 pt-10">
          <View className="rounded-3xl border border-gray-100 bg-white px-6 py-8 shadow-sm">
            <Text className="text-xs font-extrabold uppercase tracking-[1.4px] text-gray-400">Trống</Text>
            <Text className="mt-3 text-2xl font-black text-gray-950">Chưa có kèo phù hợp</Text>
            <Text className="mt-2 text-sm leading-6 text-gray-500">
              Thử đổi bộ lọc hoặc tạo một kèo mới để kéo thêm người chơi vào sân.
            </Text>
          </View>
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
        contentContainerStyle={{ paddingBottom: 28, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />}
      />
    </SafeAreaView>
  )
}
