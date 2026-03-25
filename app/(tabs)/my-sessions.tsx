import { FeedMatchCard } from '@/components/session/FeedMatchCard'
import { getSkillLevelFromEloRange } from '@/lib/skillAssessment'
import { getSkillLevelUi, getSkillTargetElo } from '@/lib/skillLevelUi'
import { supabase } from '@/lib/supabase'
import { router, useFocusEffect } from 'expo-router'
import { CalendarDays } from 'lucide-react-native'
import { useCallback, useState } from 'react'
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

type MySession = {
  id: string
  status: string
  court_booking_status: 'confirmed' | 'unconfirmed'
  role: 'host' | 'player'
  start_time: string
  end_time: string
  court_name: string
  court_city: string
  court_address: string
  host_name: string
  host_is_provisional: boolean
  price: number
  player_count: number
  max_players: number
  elo_min: number
  elo_max: number
}

export default function MySessions() {
  const [sessions, setSessions] = useState<MySession[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [myId, setMyId] = useState<string | null>(null)

  const fetchMySessions = useCallback(async (userId: string) => {
    setLoading(true)
    await supabase.rpc('process_pending_session_completions')
    await supabase.rpc('process_overdue_session_closures')

    const { data: hostSessions, error: hostError } = await supabase
      .from('sessions')
      .select(
        `
        id,
        status,
        court_booking_status,
        max_players,
        elo_min,
        elo_max,
        host:host_id ( name, is_provisional ),
        slot:slot_id (
          start_time,
          end_time,
          price,
          court:court_id ( name, city, address )
        ),
        session_players ( player_id )
      `,
      )
      .eq('host_id', userId)
      .order('created_at', { ascending: false })

    if (hostError) {
      console.warn('[MySessions] hostSessions query failed:', hostError.message)
    }

    const hostList: MySession[] = (hostSessions ?? []).map((session: any) => ({
      id: session.id,
      status: session.status,
      court_booking_status: session.court_booking_status,
      role: 'host',
      start_time: session.slot?.start_time,
      end_time: session.slot?.end_time,
      court_name: session.slot?.court?.name ?? 'Kèo Pickleball',
      court_city: session.slot?.court?.city ?? '',
      court_address: session.slot?.court?.address ?? '',
      host_name: session.host?.name ?? 'Bạn',
      host_is_provisional: Boolean(session.host?.is_provisional),
      price: session.slot?.price ?? 0,
      player_count: (session.session_players ?? []).length,
      max_players: session.max_players,
      elo_min: session.elo_min,
      elo_max: session.elo_max,
    }))

    const { data: playerSessions, error: playerError } = await supabase
      .from('session_players')
      .select(
        `
        session:session_id (
          id,
          status,
          court_booking_status,
          max_players,
          elo_min,
          elo_max,
          host:host_id ( name, is_provisional ),
          slot:slot_id (
            start_time,
            end_time,
            price,
            court:court_id ( name, city, address )
          ),
          session_players ( player_id )
        )
      `,
      )
      .eq('player_id', userId)

    if (playerError) {
      console.warn('[MySessions] playerSessions query failed:', playerError.message)
    }

    const joinedList: MySession[] = (playerSessions ?? [])
      .map((row: any) => {
        const session = row.session
        if (!session) return null

        return {
          id: session.id,
          status: session.status,
          court_booking_status: session.court_booking_status,
          role: 'player' as const,
          start_time: session.slot?.start_time,
          end_time: session.slot?.end_time,
          court_name: session.slot?.court?.name ?? 'Kèo Pickleball',
          court_city: session.slot?.court?.city ?? '',
          court_address: session.slot?.court?.address ?? '',
          host_name: session.host?.name ?? 'Ẩn danh',
          host_is_provisional: Boolean(session.host?.is_provisional),
          price: session.slot?.price ?? 0,
          player_count: (session.session_players ?? []).length,
          max_players: session.max_players,
          elo_min: session.elo_min,
          elo_max: session.elo_max,
        }
      })
      .filter(Boolean) as MySession[]

    const deduped = [...hostList, ...joinedList].filter(
      (session, index, arr) => arr.findIndex((candidate) => candidate.id === session.id) === index,
    )

    deduped.sort((a, b) => {
      const bookingWeight =
        Number(b.court_booking_status === 'confirmed') - Number(a.court_booking_status === 'confirmed')
      if (bookingWeight !== 0) return bookingWeight
      return new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
    })

    setSessions(deduped)
    setLoading(false)
  }, [])

  const init = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setMyId(null)
      setSessions([])
      setLoading(false)
      return
    }

    setMyId(user.id)
    await fetchMySessions(user.id)
  }, [fetchMySessions])

  useFocusEffect(
    useCallback(() => {
      init()
    }, [init]),
  )

  const onRefresh = useCallback(async () => {
    if (!myId) return
    setRefreshing(true)
    await fetchMySessions(myId)
    setRefreshing(false)
  }, [fetchMySessions, myId])

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

  function matchTypeLabel(status: string, role: 'host' | 'player') {
    if (status === 'pending_completion') return 'Chờ xác nhận'
    if (status === 'cancelled') return 'Đã huỷ'
    if (status === 'done') return 'Đã hoàn tất'
    return role === 'host' ? 'Bạn là host' : 'Đã tham gia'
  }

  const renderSession = useCallback(({ item }: { item: MySession }) => {
    const formatted = formatTime(item.start_time, item.end_time)
    const isFull = item.player_count >= item.max_players
    const skillLevel = getSkillLevelFromEloRange(item.elo_min, item.elo_max)
    const skillUi = getSkillLevelUi(skillLevel.id)

    return (
      <FeedMatchCard
        courtName={item.court_name}
        address={`${item.court_address}${item.court_city ? `, ${item.court_city}` : ''}`}
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
        matchTypeLabel={matchTypeLabel(item.status, item.role)}
        hostName={item.host_name}
        isProvisional={item.host_is_provisional}
        priceLabel={`${item.price.toLocaleString('vi-VN')}đ/người`}
        availabilityLabel={isFull ? 'Đầy' : `${item.player_count}/${item.max_players}`}
        onPress={() => router.push({ pathname: '/session/[id]' as any, params: { id: item.id } })}
      />
    )
  }, [])

  const header = (
    <View className="bg-gray-50">
      <View className="px-5 pb-4 pt-4">
        <View className="flex-row items-center">
          <CalendarDays size={16} color="#6b7280" />
          <Text className="ml-2 text-sm font-medium text-gray-500">Lịch chơi của bạn</Text>
        </View>
        <Text className="mt-2 text-3xl font-black text-gray-950">Kèo của tôi</Text>
        <Text className="mt-2 text-sm leading-6 text-gray-500">
          Theo dõi những kèo bạn đang host hoặc đã tham gia, ưu tiên các kèo đã chốt sân ở phía trên.
        </Text>
      </View>
    </View>
  )

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['top']}>
      {loading ? (
        <>
          {header}
          <ActivityIndicator size="large" color="#059669" style={{ marginTop: 40 }} />
        </>
      ) : sessions.length === 0 ? (
        <>
          {header}
          <View className="px-5 pt-6">
            <View className="rounded-3xl border border-gray-100 bg-white px-6 py-8 shadow-sm">
              <Text className="text-xs font-extrabold uppercase tracking-[1.4px] text-gray-400">Bắt đầu</Text>
              <Text className="mt-3 text-2xl font-black text-gray-950">Bạn chưa có kèo nào</Text>
              <Text className="mt-2 text-sm leading-6 text-gray-500">
                Tạo kèo đầu tiên hoặc tham gia một trận phù hợp để bắt đầu lịch sử chơi của bạn.
              </Text>
            </View>
          </View>
        </>
      ) : (
        <FlatList
          data={sessions}
          renderItem={renderSession}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={header}
          contentContainerStyle={{ paddingBottom: 32, paddingTop: 8 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />}
        />
      )}
    </SafeAreaView>
  )
}
