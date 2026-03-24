import { FeedMatchCard } from '@/components/session/FeedMatchCard'
import { getSkillLevelFromEloRange, SKILL_ASSESSMENT_LEVELS } from '@/lib/skillAssessment'
import { supabase } from '@/lib/supabase'
import { router, useFocusEffect } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const CITIES = ['Tất cả', 'Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng']

const SKILL_LEVELS = [
  { label: 'Tất cả', value: 'all' },
  { label: `🎾 ${SKILL_ASSESSMENT_LEVELS[0].title}`, value: 'level_1', eloMax: 850 },
  { label: `🎾 ${SKILL_ASSESSMENT_LEVELS[1].title}`, value: 'level_2', eloMax: 1050 },
  { label: `🎾 ${SKILL_ASSESSMENT_LEVELS[2].title}`, value: 'level_3', eloMax: 1200 },
  { label: `🎾 ${SKILL_ASSESSMENT_LEVELS[3].title}`, value: 'level_4', eloMax: 1400 },
  { label: `🎾 ${SKILL_ASSESSMENT_LEVELS[4].title}`, value: 'level_5', eloMax: 9999 },
]

const DATE_OPTIONS = [
  { label: 'Tất cả', value: 'all' },
  { label: 'Hôm nay', value: 'today' },
  { label: 'Ngày mai', value: 'tomorrow' },
  { label: '7 ngày tới', value: 'week' },
]

type Session = {
  id: string
  elo_min: number
  elo_max: number
  max_players: number
  status: string
  court_booking_status: 'confirmed' | 'unconfirmed'
  host: { name: string; is_provisional?: boolean | null }
  slot: {
    start_time: string
    end_time: string
    price: number
    court: { name: string; address: string; city: string }
  }
  player_count: number
}

export default function FindSession() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [city, setCity] = useState('Tất cả')
  const [skill, setSkill] = useState('all')
  const [date, setDate] = useState('all')
  const [spotsOnly, setSpotsOnly] = useState(false)

  const fetchSessions = useCallback(async () => {
    setLoading(true)

    const { data, error } = await supabase
      .from('sessions')
      .select(`
        id, elo_min, elo_max, max_players, status, court_booking_status,
        host:host_id ( name, is_provisional ),
        slot:slot_id (
          start_time, end_time, price,
          court:court_id ( name, address, city )
        ),
        session_players ( player_id )
      `)
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(50)

    if (!error && data) {
      let filtered = data.map((session: any) => ({
        ...session,
        player_count: (session.session_players ?? []).length,
      })) as Session[]

      if (city !== 'Tất cả') {
        filtered = filtered.filter((session) => session.slot?.court?.city === city)
      }

      if (skill !== 'all') {
        const skillInfo = SKILL_LEVELS.find((level) => level.value === skill)
        if (skillInfo?.eloMax) {
          filtered = filtered.filter(
            (session) => session.elo_min <= skillInfo.eloMax! && session.elo_max >= skillInfo.eloMax! - 200
          )
        }
      }

      if (date !== 'all') {
        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

        filtered = filtered.filter((session) => {
          const slotDate = new Date(session.slot?.start_time)

          if (date === 'today') {
            return slotDate >= today && slotDate < new Date(today.getTime() + 86400000)
          }

          if (date === 'tomorrow') {
            const tomorrow = new Date(today.getTime() + 86400000)
            return slotDate >= tomorrow && slotDate < new Date(tomorrow.getTime() + 86400000)
          }

          if (date === 'week') {
            return slotDate >= today && slotDate < new Date(today.getTime() + 7 * 86400000)
          }

          return true
        })
      }

      if (spotsOnly) {
        filtered = filtered.filter((session) => session.player_count < session.max_players)
      }

      filtered.sort((a, b) => {
        const bookingWeight = Number(b.court_booking_status === 'confirmed') - Number(a.court_booking_status === 'confirmed')
        if (bookingWeight !== 0) return bookingWeight
        return new Date(a.slot?.start_time ?? 0).getTime() - new Date(b.slot?.start_time ?? 0).getTime()
      })

      setSessions(filtered)
    } else {
      setSessions([])
    }

    setLoading(false)
  }, [city, skill, date, spotsOnly])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  useFocusEffect(
    useCallback(() => {
      fetchSessions()
    }, [fetchSessions])
  )

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchSessions()
    setRefreshing(false)
  }, [fetchSessions])

  function formatTime(start: string, end: string) {
    const startDate = new Date(start)
    const endDate = new Date(end)
    const pad = (value: number) => value.toString().padStart(2, '0')

    return {
      time: `${pad(startDate.getHours())}:${pad(startDate.getMinutes())} → ${pad(endDate.getHours())}:${pad(endDate.getMinutes())}`,
      date: `${pad(startDate.getDate())}/${pad(startDate.getMonth() + 1)}`,
    }
  }

  function matchTypeLabel(session: Session) {
    return session.elo_max >= 1300 ? '⚔️ Tính điểm' : '🍻 Giao lưu'
  }

  const activeFilters = [city !== 'Tất cả', skill !== 'all', date !== 'all', spotsOnly].filter(Boolean).length

  const renderSession = useCallback(({ item }: { item: Session }) => {
    const court = item.slot?.court
    const formatted = formatTime(item.slot?.start_time, item.slot?.end_time)
    const spotsLeft = Math.max(item.max_players - item.player_count, 0)
    const isFull = item.player_count >= item.max_players

    return (
      <FeedMatchCard
        courtName={court?.name ?? 'Kèo Pickleball'}
        address={`${court?.address ?? 'Chưa có địa chỉ'}${court?.city ? `, ${court.city}` : ''}`}
        timeLabel={formatted.time}
        dateLabel={formatted.date}
        bookingStatus={item.court_booking_status}
        skillLabel={getSkillLevelFromEloRange(item.elo_min, item.elo_max).title}
        matchTypeLabel={matchTypeLabel(item)}
        hostName={item.host?.name ?? 'Ẩn danh'}
        isProvisional={Boolean(item.host?.is_provisional)}
        priceLabel={`${(item.slot?.price ?? 0).toLocaleString('vi-VN')}đ/người`}
        availabilityLabel={isFull ? `👥 ${item.player_count}/${item.max_players} Đầy` : `👥 ${spotsLeft}/${item.max_players} Còn chỗ`}
        onPress={() => router.push({ pathname: '/session/[id]', params: { id: item.id } })}
      />
    )
  }, [])

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      <View className="px-5 pb-4 pt-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-3xl font-bold text-gray-950">Tìm kèo 🔍</Text>
          {activeFilters > 0 ? (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                setCity('Tất cả')
                setSkill('all')
                setDate('all')
                setSpotsOnly(false)
              }}
            >
              <Text className="text-sm font-semibold text-green-700">Xóa filter ({activeFilters})</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingTop: 18 }}>
          <TouchableOpacity
            activeOpacity={0.85}
            className={`mr-3 rounded-full px-4 py-2.5 ${spotsOnly ? 'bg-green-600' : 'bg-gray-200'}`}
            onPress={() => setSpotsOnly((prev) => !prev)}
          >
            <Text className={`text-sm font-semibold ${spotsOnly ? 'text-white' : 'text-gray-900'}`}>Còn chỗ</Text>
          </TouchableOpacity>

          {CITIES.map((item) => {
            const isActive = city === item
            return (
              <TouchableOpacity
                key={item}
                activeOpacity={0.85}
                className={`mr-3 rounded-full px-4 py-2.5 ${isActive ? 'bg-green-600' : 'bg-gray-200'}`}
                onPress={() => setCity(item)}
              >
                <Text className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-gray-900'}`}>{item}</Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingTop: 12 }}>
          {DATE_OPTIONS.map((item) => {
            const isActive = date === item.value
            return (
              <TouchableOpacity
                key={item.value}
                activeOpacity={0.85}
                className={`mr-3 rounded-full px-4 py-2.5 ${isActive ? 'bg-green-600' : 'bg-gray-200'}`}
                onPress={() => setDate(item.value)}
              >
                <Text className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-gray-900'}`}>{item.label}</Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingTop: 12 }}>
          {SKILL_LEVELS.map((item) => {
            const isActive = skill === item.value
            return (
              <TouchableOpacity
                key={item.value}
                activeOpacity={0.85}
                className={`mr-3 rounded-full px-4 py-2.5 ${isActive ? 'bg-green-600' : 'bg-gray-200'}`}
                onPress={() => setSkill(item.value)}
              >
                <Text className={`text-sm font-semibold ${isActive ? 'text-white' : 'text-gray-900'}`}>{item.label}</Text>
              </TouchableOpacity>
            )
          })}
        </ScrollView>

        {!loading ? (
          <Text className="pt-4 text-sm text-gray-500">
            {sessions.length} kèo {activeFilters > 0 ? 'phù hợp' : 'đang mở'}
          </Text>
        ) : null}
      </View>

      {loading ? (
        <ActivityIndicator color="#16a34a" style={{ marginTop: 40 }} />
      ) : sessions.length === 0 ? (
        <View className="mt-16 items-center px-8">
          <Text className="mb-3 text-5xl">😴</Text>
          <Text className="mb-1 text-center text-base font-semibold text-gray-900">Không có kèo nào phù hợp</Text>
          <Text className="text-center text-sm leading-6 text-gray-500">
            Thử đổi filter hoặc tạo một kèo mới để kéo thêm người chơi vào sân.
          </Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          renderItem={renderSession}
          contentContainerStyle={{ paddingBottom: 28 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#16a34a" />}
        />
      )}
    </SafeAreaView>
  )
}
