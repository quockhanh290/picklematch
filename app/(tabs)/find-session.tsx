import { FeedMatchCard } from '@/components/session/FeedMatchCard'
import { getSkillLevelFromEloRange, getSkillLevelFromPlayer, SKILL_ASSESSMENT_LEVELS } from '@/lib/skillAssessment'
import { getSkillLevelUi, getSkillTargetElo } from '@/lib/skillLevelUi'
import { supabase } from '@/lib/supabase'
import { router, useFocusEffect } from 'expo-router'
import { Search, SlidersHorizontal } from 'lucide-react-native'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const CITIES = ['Tất cả', 'Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng']

const SKILL_LEVELS = [
  { label: 'Tất cả', value: 'all' },
  { label: SKILL_ASSESSMENT_LEVELS[0].title, value: 'level_1', eloMax: 850 },
  { label: SKILL_ASSESSMENT_LEVELS[1].title, value: 'level_2', eloMax: 1050 },
  { label: SKILL_ASSESSMENT_LEVELS[2].title, value: 'level_3', eloMax: 1200 },
  { label: SKILL_ASSESSMENT_LEVELS[3].title, value: 'level_4', eloMax: 1400 },
  { label: SKILL_ASSESSMENT_LEVELS[4].title, value: 'level_5', eloMax: 9999 },
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
  host: {
    name: string
    is_provisional?: boolean | null
    current_elo?: number | null
    elo?: number | null
    self_assessed_level?: string | null
    skill_label?: string | null
  }
  slot: {
    start_time: string
    end_time: string
    price: number
    court: { name: string; address: string; city: string }
  }
  player_count: number
}

function FilterPill({
  label,
  active,
  onPress,
}: {
  label: string
  active: boolean
  onPress: () => void
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onPress}
      className={`mr-3 rounded-full border px-4 py-2.5 ${
        active ? 'border-gray-900 bg-gray-900' : 'border-gray-200 bg-white'
      }`}
    >
      <Text className={`text-sm font-semibold ${active ? 'text-white' : 'text-gray-600'}`}>{label}</Text>
    </TouchableOpacity>
  )
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
      .select(
        `
        id, elo_min, elo_max, max_players, status, court_booking_status,
        host:host_id ( name, is_provisional, current_elo, elo, self_assessed_level, skill_label ),
        slot:slot_id (
          start_time, end_time, price,
          court:court_id ( name, address, city )
        ),
        session_players ( player_id )
      `,
      )
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
            (session) => session.elo_min <= skillInfo.eloMax && session.elo_max >= skillInfo.eloMax - 200,
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
        const bookingWeight =
          Number(b.court_booking_status === 'confirmed') - Number(a.court_booking_status === 'confirmed')
        if (bookingWeight !== 0) return bookingWeight
        return new Date(a.slot?.start_time ?? 0).getTime() - new Date(b.slot?.start_time ?? 0).getTime()
      })

      setSessions(filtered)
    } else {
      setSessions([])
    }

    setLoading(false)
  }, [city, date, skill, spotsOnly])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  useFocusEffect(
    useCallback(() => {
      fetchSessions()
    }, [fetchSessions]),
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
      time: `${pad(startDate.getHours())}:${pad(startDate.getMinutes())} - ${pad(endDate.getHours())}:${pad(
        endDate.getMinutes(),
      )}`,
      date: `${pad(startDate.getDate())}/${pad(startDate.getMonth() + 1)}`,
    }
  }

  function matchTypeLabel(session: Session) {
    return session.elo_max >= 1300 ? 'Tính điểm' : 'Giao lưu'
  }

  const activeFilters = [city !== 'Tất cả', skill !== 'all', date !== 'all', spotsOnly].filter(Boolean).length

  const renderSession = useCallback(({ item }: { item: Session }) => {
    const court = item.slot?.court
    const formatted = formatTime(item.slot?.start_time, item.slot?.end_time)
    const isFull = item.player_count >= item.max_players
    const skillLevel = getSkillLevelFromEloRange(item.elo_min, item.elo_max)
    const skillUi = getSkillLevelUi(skillLevel.id)
    const hostSkillLevel = getSkillLevelFromPlayer(item.host)
    const hostSkillUi = getSkillLevelUi(hostSkillLevel?.id)

    return (
      <FeedMatchCard
        courtName={court?.name ?? 'Kèo Pickleball'}
        address={`${court?.address ?? 'Chưa có địa chỉ'}${court?.city ? `, ${court.city}` : ''}`}
        timeLabel={formatted.time}
        dateLabel={formatted.date}
        bookingStatus={item.court_booking_status}
        skillLabel={skillUi.shortLabel}
        skillIcon={skillUi.icon}
        skillTagClassName={skillUi.tagClassName}
        skillTextClassName={skillUi.textClassName}
        skillBorderClassName={skillUi.borderClassName}
        skillIconColor={skillUi.iconColor}
        eloValue={getSkillTargetElo(item.elo_min, item.elo_max)}
        duprValue={skillUi.duprValue}
        matchTypeLabel={matchTypeLabel(item)}
        hostName={item.host?.name ?? 'Ẩn danh'}
        hostSkillIcon={hostSkillUi.icon}
        priceDivisor={item.max_players}
        priceLabel={`${(item.slot?.price ?? 0).toLocaleString('vi-VN')}đ/người`}
        availabilityLabel={isFull ? 'Đầy' : `${item.player_count}/${item.max_players}`}
        onPress={() => router.push({ pathname: '/session/[id]', params: { id: item.id } })}
      />
    )
  }, [])

  const header = (
    <View className="bg-gray-50">
      <View className="px-5 pb-3 pt-4">
        <View className="flex-row items-center">
          <Search size={16} color="#6b7280" />
          <Text className="ml-2 text-sm font-medium text-gray-500">Khám phá trận đấu</Text>
        </View>
        <Text className="mt-2 text-3xl font-black text-gray-950">Tìm kèo phù hợp</Text>
        <Text className="mt-2 text-sm leading-6 text-gray-500">
          Lọc theo thành phố, ngày chơi, trình độ và số chỗ còn lại để tìm trận vừa ý nhanh hơn.
        </Text>
      </View>

      <View className="px-5 pb-2">
        <View className="mb-4 flex-row items-center justify-between rounded-3xl border border-gray-100 bg-white px-4 py-4 shadow-sm">
          <View className="flex-row items-center">
            <SlidersHorizontal size={18} color="#111827" />
            <Text className="ml-3 text-sm font-bold text-gray-900">Bộ lọc đang dùng</Text>
          </View>
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
              <Text className="text-sm font-semibold text-emerald-700">Xóa {activeFilters}</Text>
            </TouchableOpacity>
          ) : (
            <Text className="text-sm text-gray-400">Mặc định</Text>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 12 }}>
          <FilterPill label="Còn chỗ" active={spotsOnly} onPress={() => setSpotsOnly((prev) => !prev)} />
          {CITIES.map((item) => (
            <FilterPill key={item} label={item} active={city === item} onPress={() => setCity(item)} />
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 12 }}>
          {DATE_OPTIONS.map((item) => (
            <FilterPill key={item.value} label={item.label} active={date === item.value} onPress={() => setDate(item.value)} />
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 12 }}>
          {SKILL_LEVELS.map((item) => (
            <FilterPill key={item.value} label={item.label} active={skill === item.value} onPress={() => setSkill(item.value)} />
          ))}
        </ScrollView>

        {!loading ? <Text className="pt-1 text-sm text-gray-500">{sessions.length} kèo phù hợp</Text> : null}
      </View>
    </View>
  )

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {loading ? (
        <>
          {header}
          <ActivityIndicator color="#059669" style={{ marginTop: 40 }} />
        </>
      ) : sessions.length === 0 ? (
        <>
          {header}
          <View className="px-5 pt-6">
            <View className="rounded-3xl border border-gray-100 bg-white px-6 py-8 shadow-sm">
              <Text className="text-xs font-extrabold uppercase tracking-[1.4px] text-gray-400">Không có kết quả</Text>
              <Text className="mt-3 text-2xl font-black text-gray-950">Chưa có kèo phù hợp</Text>
              <Text className="mt-2 text-sm leading-6 text-gray-500">
                Thử nới điều kiện lọc hoặc tạo một kèo mới để kéo thêm người chơi vào sân.
              </Text>
            </View>
          </View>
        </>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          renderItem={renderSession}
          ListHeaderComponent={header}
          contentContainerStyle={{ paddingBottom: 28, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />}
        />
      )}
    </SafeAreaView>
  )
}
