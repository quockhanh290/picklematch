import AsyncStorage from '@react-native-async-storage/async-storage'
import { getSkillLevelFromEloRange, getSkillLevelFromPlayer } from '@/lib/skillAssessment'
import { getSkillLevelUi, getSkillTargetElo } from '@/lib/skillLevelUi'
import { supabase } from '@/lib/supabase'
import { router, useFocusEffect } from 'expo-router'
import {
  Map,
  MapPin,
  Search,
  SlidersHorizontal,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react-native'
import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

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
  } | null
  slot: {
    start_time: string
    end_time: string
    price: number
    court: { name: string; address: string; city: string } | null
  } | null
  player_count: number
}

type QuickFilterId = 'nearby' | 'recent' | 'level3' | 'rescue'

type PlayerQueueProfile = {
  id: string
  city?: string | null
  current_elo?: number | null
  elo?: number | null
  self_assessed_level?: string | null
  skill_label?: string | null
  favorite_court_ids?: string[] | null
}

const SMART_QUEUE_STORAGE_PREFIX = '@picklematch/smart-queue:'

function getSmartQueueKey(userId: string) {
  return `${SMART_QUEUE_STORAGE_PREFIX}${userId}`
}

const QUICK_FILTERS: { id: QuickFilterId; label: string }[] = [
  { id: 'nearby', label: 'Gần tôi' },
  { id: 'recent', label: 'Gần đây' },
  { id: 'level3', label: 'Nấc 3' },
  { id: 'rescue', label: 'Cứu Net 🔥' },
]

function formatPrice(price: number, maxPlayers: number) {
  const pricePerPlayer = maxPlayers > 0 ? Math.round(price / maxPlayers) : price
  return `${Math.max(1, Math.round(pricePerPlayer / 1000))}k`
}

function formatDateTime(start: string, end: string) {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const pad = (value: number) => value.toString().padStart(2, '0')

  return {
    dayLabel: `${pad(startDate.getDate())}/${pad(startDate.getMonth() + 1)}`,
    timeLabel: `${pad(startDate.getHours())}:${pad(startDate.getMinutes())} - ${pad(endDate.getHours())}:${pad(
      endDate.getMinutes(),
    )}`,
  }
}

function buildSearchIndex(session: Session) {
  const court = session.slot?.court
  const skill = getSkillLevelFromEloRange(session.elo_min, session.elo_max)

  return [court?.name, court?.address, court?.city, skill.title, session.host?.name]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function normalizeText(value?: string | null) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function computeMatchScore(session: Session, rescueMode: boolean, level3Mode: boolean) {
  const slotsLeft = Math.max(session.max_players - session.player_count, 0)
  const startAt = new Date(session.slot?.start_time ?? 0).getTime()
  const hoursUntilStart = (startAt - Date.now()) / 3600000
  const skill = getSkillLevelFromEloRange(session.elo_min, session.elo_max)

  let score = 74

  if (session.court_booking_status === 'confirmed') score += 10
  if (slotsLeft > 0) score += 6
  if (slotsLeft === 1) score += 4
  if (hoursUntilStart >= 0 && hoursUntilStart <= 24) score += 4
  if (hoursUntilStart > 24 && hoursUntilStart <= 72) score += 2
  if (rescueMode && slotsLeft <= 2) score += 6
  if (level3Mode && skill.id === 'level_3') score += 8

  return Math.max(78, Math.min(score, 99))
}

function SearchResultCard({
  session,
  rescueMode,
}: {
  session: Session
  rescueMode: boolean
}) {
  const court = session.slot?.court
  const formatted = formatDateTime(session.slot?.start_time ?? new Date().toISOString(), session.slot?.end_time ?? new Date().toISOString())
  const skillLevel = getSkillLevelFromEloRange(session.elo_min, session.elo_max)
  const skillUi = getSkillLevelUi(skillLevel.id)
  const hostSkillLevel = getSkillLevelFromPlayer(session.host ?? {})
  const hostSkillUi = hostSkillLevel ? getSkillLevelUi(hostSkillLevel.id) : null
  const matchScore = computeMatchScore(session, rescueMode, skillLevel.id === 'level_3')
  const slotsLeft = Math.max(session.max_players - session.player_count, 0)
  const openSessionDetail = () =>
    router.push({
      pathname: '/session/[id]',
      params: {
        id: session.id,
        navStartedAt: String(Date.now()),
        navSource: 'find-session',
      },
    })

  return (
    <Pressable
      onPress={openSessionDetail}
      className="mb-5 rounded-[36px] border border-slate-200 bg-white p-5 shadow-sm active:scale-[0.98]"
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1 flex-row flex-wrap items-center gap-2">
          <View className={`rounded-full px-3 py-1.5 ${session.court_booking_status === 'confirmed' ? 'bg-emerald-100' : 'bg-amber-100'}`}>
            <Text
              className={`text-[11px] font-bold uppercase tracking-widest ${
                session.court_booking_status === 'confirmed' ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {session.court_booking_status === 'confirmed' ? 'Sân đã chốt' : 'Đang giữ sân'}
            </Text>
          </View>

          <View className="rounded-full bg-indigo-100 px-3 py-1.5">
            <Text className="text-[11px] font-bold uppercase tracking-widest text-indigo-700">{formatted.timeLabel}</Text>
          </View>
        </View>

        <View className="rounded-full bg-indigo-600 px-3 py-2">
          <Text className="text-[12px] font-black text-white">{matchScore}% phù hợp</Text>
        </View>
      </View>

      <View className="mt-4">
        <Text className="text-[22px] font-black text-slate-950">{court?.name ?? 'PickleMatch Arena'}</Text>
        <View className="mt-2 flex-row items-start gap-2">
          <MapPin size={16} color="#64748b" strokeWidth={2.5} />
          <Text className="flex-1 text-sm leading-6 text-slate-500">
            {court?.address ?? 'Đang cập nhật địa chỉ'}
            {court?.city ? `, ${court.city}` : ''}
          </Text>
        </View>
      </View>

      <View className="mt-4 flex-row flex-wrap gap-2">
        <View className={`rounded-full border px-3 py-2 ${skillUi.borderClassName} ${skillUi.tagClassName}`}>
          <Text className={`text-[12px] font-bold uppercase tracking-widest ${skillUi.textClassName}`}>{skillUi.shortLabel}</Text>
        </View>

        <View className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
          <Text className="text-[12px] font-bold uppercase tracking-widest text-slate-600">
            ELO {getSkillTargetElo(session.elo_min, session.elo_max)}
          </Text>
        </View>

        <View className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2">
          <Text className="text-[12px] font-bold uppercase tracking-widest text-slate-600">DUPR {skillUi.duprValue}</Text>
        </View>

        {rescueMode ? (
          <View className="rounded-full border border-rose-200 bg-rose-50 px-3 py-2">
            <Text className="text-[12px] font-bold uppercase tracking-widest text-rose-600">Cứu Net</Text>
          </View>
        ) : null}
      </View>

      <View className="mt-4 border-t border-slate-50 pt-4">
        <View className="flex-row items-end justify-between gap-4">
          <View className="flex-1">
            <Text className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Chủ kèo</Text>
            <Text className="mt-1 text-base font-black text-slate-900">{session.host?.name ?? 'Ẩn danh'}</Text>
            <View className="mt-2 flex-row flex-wrap items-center gap-2">
              <View className="flex-row items-center gap-2 rounded-full bg-slate-100 px-3 py-2">
                <Users size={14} color="#475569" strokeWidth={2.5} />
                <Text className="text-[11px] font-bold uppercase tracking-widest text-slate-600">
                  {session.player_count}/{session.max_players} Slots
                </Text>
              </View>

              {hostSkillUi ? (
                <View className="rounded-full bg-slate-100 px-3 py-2">
                  <Text className="text-[11px] font-bold uppercase tracking-widest text-slate-600">{hostSkillUi.shortLabel}</Text>
                </View>
              ) : null}
            </View>
          </View>

          <View className="items-end">
            <Text className="text-[11px] font-bold uppercase tracking-widest text-slate-400">{formatted.dayLabel}</Text>
            <Text className="mt-1 text-2xl font-black text-slate-950">{formatPrice(session.slot?.price ?? 0, session.max_players)}</Text>
            <Text className="mt-1 text-xs font-semibold text-slate-500">{slotsLeft > 0 ? `${slotsLeft} chỗ trống` : 'Đã đủ người'}</Text>

            <Pressable
              onPress={openSessionDetail}
              className="mt-3 rounded-2xl bg-emerald-600 px-6 py-2.5 active:scale-[0.98]"
            >
              <Text className="text-[12px] font-black uppercase tracking-widest text-white">Vào kèo</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Pressable>
  )
}

export default function FindSession() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [query, setQuery] = useState('')
  const [sortMode, setSortMode] = useState<'match' | 'time'>('match')
  const [quickFilters, setQuickFilters] = useState<Record<QuickFilterId, boolean>>({
    nearby: false,
    recent: false,
    level3: false,
    rescue: false,
  })
  const [playerProfile, setPlayerProfile] = useState<PlayerQueueProfile | null>(null)
  const [smartQueueEnabled, setSmartQueueEnabled] = useState(false)
  const [smartQueueHydrated, setSmartQueueHydrated] = useState(false)

  const smartQueueStorageKey = playerProfile?.id ? getSmartQueueKey(playerProfile.id) : null

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
      const mapped = data.map((session: any) => ({
        ...session,
        player_count: (session.session_players ?? []).length,
      })) as Session[]

      setSessions(mapped)
    } else {
      setSessions([])
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions])

  const fetchPlayerProfile = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setPlayerProfile(null)
      setSmartQueueEnabled(false)
      setSmartQueueHydrated(true)
      return
    }

    const [{ data: profile }, storedFlag] = await Promise.all([
      supabase
        .from('players')
        .select('id, city, current_elo, elo, self_assessed_level, skill_label, favorite_court_ids')
        .eq('id', user.id)
        .single(),
      AsyncStorage.getItem(getSmartQueueKey(user.id)),
    ])

    setPlayerProfile((profile as PlayerQueueProfile | null) ?? null)
    setSmartQueueEnabled(storedFlag === '1')
    setSmartQueueHydrated(true)
  }, [])

  useEffect(() => {
    void fetchPlayerProfile()
  }, [fetchPlayerProfile])

  useFocusEffect(
    useCallback(() => {
      fetchSessions()
      void fetchPlayerProfile()
    }, [fetchPlayerProfile, fetchSessions]),
  )

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await Promise.all([fetchSessions(), fetchPlayerProfile()])
    setRefreshing(false)
  }, [fetchPlayerProfile, fetchSessions])

  const toggleQuickFilter = useCallback((filterId: QuickFilterId) => {
    setQuickFilters((current) => {
      if (filterId === 'nearby') {
        return {
          ...current,
          nearby: !current.nearby,
        }
      }

      return {
        ...current,
        [filterId]: !current[filterId],
      }
    })
  }, [])

  const activeFiltersCount = Object.values(quickFilters).filter(Boolean).length

  const applySmartQueueFilters = useCallback(
    async (enabled: boolean) => {
      if (!playerProfile?.id) {
        Alert.alert(
          'Cần hoàn thiện hồ sơ',
          'Smart Queue cần thành phố và mức trình gần đúng để ưu tiên kèo hợp gu hơn.',
          [
            { text: 'Để sau', style: 'cancel' },
            { text: 'Chỉnh hồ sơ', onPress: () => router.push('/edit-profile' as never) },
          ],
        )
        return
      }

      if (!enabled) {
        setSmartQueueEnabled(false)
        setQuickFilters({ nearby: false, recent: false, level3: false, rescue: false })
        setQuery('')
        if (smartQueueStorageKey) {
          await AsyncStorage.setItem(smartQueueStorageKey, '0')
        }
        return
      }

      const playerLevel = getSkillLevelFromPlayer(playerProfile)
      const nextQuery = playerProfile.city?.trim() ?? ''
      const normalizedCity = normalizeText(playerProfile.city)
      const canUseNearbyFilter = normalizedCity.includes('ho chi minh') || normalizedCity.includes('thu duc')

      setSortMode('match')
      setQuery(nextQuery)
      setQuickFilters({
        nearby: canUseNearbyFilter,
        recent: true,
        level3: playerLevel?.id === 'level_3',
        rescue: false,
      })
      setSmartQueueEnabled(true)
      if (smartQueueStorageKey) {
        await AsyncStorage.setItem(smartQueueStorageKey, '1')
      }
    },
    [playerProfile, smartQueueStorageKey],
  )

  useEffect(() => {
    if (!smartQueueHydrated || !playerProfile?.id) return
    void applySmartQueueFilters(smartQueueEnabled)
  }, [applySmartQueueFilters, playerProfile?.id, smartQueueEnabled, smartQueueHydrated])

  const filteredSessions = sessions
    .filter((session) => {
      const search = query.trim().toLowerCase()
      const searchMatches = !search || buildSearchIndex(session).includes(search)
      if (!searchMatches) return false

      if (quickFilters.level3 && getSkillLevelFromEloRange(session.elo_min, session.elo_max).id !== 'level_3') {
        return false
      }

      if (quickFilters.rescue && session.max_players - session.player_count > 2) {
        return false
      }

      if (quickFilters.recent) {
        const hoursUntilStart = (new Date(session.slot?.start_time ?? 0).getTime() - Date.now()) / 3600000
        if (hoursUntilStart < 0 || hoursUntilStart > 48) return false
      }

      if (quickFilters.nearby) {
        const city = session.slot?.court?.city?.toLowerCase() ?? ''
        if (!city.includes('hồ chí minh') && !city.includes('ho chi minh') && !city.includes('thủ đức')) return false
      }

      return true
    })
    .sort((left, right) => {
      if (sortMode === 'time') {
        return new Date(left.slot?.start_time ?? 0).getTime() - new Date(right.slot?.start_time ?? 0).getTime()
      }

      return (
        computeMatchScore(right, quickFilters.rescue, quickFilters.level3) -
        computeMatchScore(left, quickFilters.rescue, quickFilters.level3)
      )
    })

  const stickyHeader = (
    <View className="border-b border-slate-100 bg-white/80 px-6 pb-4 pt-12">
      <View className="flex-row items-center gap-3">
        <View className="h-14 flex-1 flex-row items-center gap-3 rounded-[24px] border border-slate-200 bg-slate-50 px-4">
          <Search size={18} color="#94a3b8" strokeWidth={2.5} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Tìm sân, quận hoặc trình độ..."
            placeholderTextColor="#94a3b8"
            className="flex-1 text-[15px] font-semibold text-slate-900"
          />
        </View>

        <Pressable className="h-14 w-14 items-center justify-center rounded-[24px] bg-slate-900 shadow-lg shadow-slate-900/20 active:scale-[0.98]">
          <Map size={20} color="#ffffff" strokeWidth={2.5} />
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingTop: 16, paddingRight: 24 }}
      >
        <Pressable
          onPress={() =>
            setQuickFilters((current) =>
              activeFiltersCount > 0
                ? { nearby: false, recent: false, level3: false, rescue: false }
                : { ...current, recent: true, rescue: true },
            )
          }
          className="flex-row items-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 active:scale-[0.98]"
        >
          <SlidersHorizontal size={14} color="#ffffff" strokeWidth={2.5} />
          <Text className="text-[12px] font-black text-white">BỘ LỌC</Text>
        </Pressable>

        {QUICK_FILTERS.map((filter) => {
          const active = quickFilters[filter.id]

          return (
            <Pressable
              key={filter.id}
              onPress={() => toggleQuickFilter(filter.id)}
              className={`rounded-full border px-5 py-2.5 active:scale-[0.98] ${
                active ? 'border-slate-900 bg-slate-900' : 'border-slate-200 bg-white'
              }`}
            >
              <Text className={`text-[12px] font-black uppercase ${active ? 'text-white' : 'text-slate-600'}`}>{filter.label}</Text>
            </Pressable>
          )
        })}
      </ScrollView>
    </View>
  )

  const listIntro = (
    <View className="px-6 pb-4 pt-6">
      <View className="flex-row items-center justify-between gap-4">
        <View className="flex-1">
          <Text className="text-[24px] font-black text-slate-950">Kết quả phù hợp ({filteredSessions.length})</Text>
          <Text className="mt-1 text-sm text-slate-500">Khám phá các kèo có điểm match cao nhất cho gu chơi của bạn.</Text>
        </View>

        <Pressable
          onPress={() => setSortMode((current) => (current === 'match' ? 'time' : 'match'))}
          className="rounded-full border border-slate-200 bg-white px-4 py-3 active:scale-[0.98]"
        >
          <Text className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Sắp xếp theo</Text>
          <Text className="mt-1 text-[13px] font-black text-slate-900">
            {sortMode === 'match' ? 'Độ phù hợp' : 'Giờ chơi'}
          </Text>
        </Pressable>
      </View>
    </View>
  )

  const smartQueueFooter = (
    <View className="px-6 pb-10">
      {filteredSessions.length === 0 ? (
        <View className="mb-5 rounded-[28px] border border-slate-200 bg-white p-5">
          <Text className="text-[12px] font-bold uppercase tracking-widest text-slate-400">Hiện chưa có kèo khớp</Text>
          <Text className="mt-3 text-[22px] font-black text-slate-950">Thử đổi từ khóa hoặc bật Smart Queue</Text>
          <Text className="mt-2 text-sm leading-6 text-slate-500">
            Hệ thống sẽ tiếp tục săn các trận phù hợp hơn để bạn không bỏ lỡ cơ hội vào sân đúng gu.
          </Text>
        </View>
      ) : null}

      <View className="items-center rounded-[32px] border border-indigo-100 bg-indigo-50 p-6">
        <View className="h-14 w-14 items-center justify-center rounded-full bg-white">
          <TrendingUp size={24} color="#4f46e5" strokeWidth={2.5} />
        </View>
        <Text className="mt-4 text-center text-[24px] font-black text-slate-950">Chưa thấy kèo ưng ý?</Text>
        <Text className="mt-3 text-center text-sm leading-6 text-slate-600">
          Bật Smart Queue để nhận cảnh báo ngay khi có trận vừa trình, vừa giờ, vừa khoảng cách bạn đang săn.
        </Text>

        <Pressable
          onPress={() => void applySmartQueueFilters(!smartQueueEnabled)}
          disabled={!smartQueueHydrated}
          className={`mt-5 flex-row items-center gap-2 rounded-2xl px-5 py-3 active:scale-[0.98] ${
            !smartQueueHydrated ? 'bg-slate-400 opacity-70' : smartQueueEnabled ? 'bg-slate-900' : 'bg-indigo-600'
          }`}
        >
          <Sparkles size={16} color="#ffffff" strokeWidth={2.5} />
          <Text className="text-[12px] font-black uppercase tracking-widest text-white">
            {smartQueueEnabled ? 'Tắt Smart Queue' : 'Bật Smart Queue'}
          </Text>
        </Pressable>

        {smartQueueEnabled ? (
          <Text className="mt-3 text-center text-xs font-bold uppercase tracking-widest text-slate-500">
            Đang ưu tiên kèo gần {playerProfile?.city?.trim() || 'gu của bạn'} và khớp nhịp chơi hiện tại
          </Text>
        ) : null}
      </View>
    </View>
  )

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      {loading ? (
        <View className="flex-1">
          {stickyHeader}
          <View className="px-6 pt-10">
            {listIntro}
            <ActivityIndicator color="#059669" />
          </View>
        </View>
      ) : (
        <FlatList
          data={filteredSessions}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <View className={index === 0 ? 'px-6 pb-1' : 'px-6'}>
              {index === 0 ? listIntro : null}
              <SearchResultCard session={item} rescueMode={quickFilters.rescue} />
            </View>
          )}
          ListHeaderComponent={stickyHeader}
          ListEmptyComponent={listIntro}
          ListFooterComponent={smartQueueFooter}
          stickyHeaderIndices={[0]}
          contentContainerStyle={{ paddingBottom: 12 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#059669" />}
        />
      )}
    </SafeAreaView>
  )
}
