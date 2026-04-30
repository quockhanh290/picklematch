import {
    ADVANCED_FILTER_INITIAL,
    AdvancedFilter,
    AdvancedSessionFilterModal,
} from '@/components/find-session/AdvancedSessionFilterModal'
import { AppDialog, AppLoading, type AppDialogConfig, MainHeader } from '@/components/design'
import { PROFILE_THEME_COLORS } from '@/constants/theme/profileTheme'
import SessionCard from '@/components/sessions/SessionCard'
import { SCREEN_FONTS } from '@/constants/typography'
import { getSkillLevelFromEloRange, getSkillLevelFromPlayer, getSkillScoreFromLevelId } from '@/lib/skillAssessment'
import { supabase } from '@/lib/supabase'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Linking from 'expo-linking'
import * as Location from 'expo-location'
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router'
import {
    Map,
    Navigation,
    Search,
    SlidersHorizontal,
    Sparkles,
    X,
} from 'lucide-react-native'
import { haversineKm } from '@/lib/useNearbyCourts'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    RefreshControl,
    Text,
    TextInput,
    View,
} from 'react-native'

import { SafeAreaView } from 'react-native-safe-area-context'
import { RADIUS, SPACING, BORDER } from '@/constants/screenLayout'

type Session = {
  id: string
  host_id: string
  elo_min: number
  elo_max: number
  max_players: number
  status: string
  court_booking_status: 'confirmed' | 'unconfirmed'
  host: {
    id: string
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
    court: { id: string; name: string; address: string; city: string } | null
  } | null
  session_players?: { player_id: string }[]
  player_count: number
  lat?: number | null
  lng?: number | null
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

function hexToRgb(hex: string) {
  const clean = hex.replace('#', '')
  const value = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean
  const n = Number.parseInt(value, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

function withAlpha(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function formatPrice(price: number, maxPlayers: number) {
  const pricePerPlayer = maxPlayers > 0 ? Math.round(price / maxPlayers) : price
  return `${Math.max(1, Math.round(pricePerPlayer / 1000))}k`
}

function formatDateTime(start: string, end: string) {
  const s = new Date(start)
  const e = new Date(end)
  const pad = (v: number) => v.toString().padStart(2, '0')
  const weekday = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][s.getDay()]
  return {
    dayLabel: `${weekday} ${pad(s.getDate())}/${pad(s.getMonth() + 1)}`,
    timeLabel: `${pad(s.getHours())}:${pad(s.getMinutes())} - ${pad(e.getHours())}:${pad(e.getMinutes())}`,
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
  return (value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim()
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


function getCardStatus(session: Session): 'open' | 'starting_soon' | 'full' | 'past' {
  const startTime = new Date(session.slot?.start_time ?? 0).getTime()
  const minutesToStart = (startTime - Date.now()) / 60000
  if (session.status === 'closed' || session.status === 'completed' || startTime < Date.now()) return 'past'
  if (session.player_count >= session.max_players) return 'full'
  if (minutesToStart >= 0 && minutesToStart <= 30) return 'starting_soon'
  return 'open'
}

function SearchResultCard({ session, rescueMode: _rescueMode, userLocation }: { session: Session; rescueMode: boolean; userLocation: Location.LocationObject | null }) {
  const court = session.slot?.court
  const district = extractDistrict(court?.address) ?? court?.city ?? 'Khu vuc chua ro'
  const fullAddress = court?.address?.trim() || district
  const skill = getSkillLevelFromEloRange(session.elo_min, session.elo_max)
  const hostName = session.host?.name ?? 'An danh'
  const hostInitial = hostName.slice(0, 1).toUpperCase()
  const startTime = new Date(session.slot?.start_time ?? new Date().toISOString())
  const endTime = new Date(session.slot?.end_time ?? new Date().toISOString())
  const pricePerPlayer = session.max_players > 0 ? Math.round((session.slot?.price ?? 0) / session.max_players) : 0
  const status = getCardStatus(session)
  const distance = session.lat != null && session.lng != null && userLocation 
    ? haversineKm(userLocation.coords.latitude, userLocation.coords.longitude, session.lat, session.lng)
    : undefined

  const openSessionDetail = () =>
    router.push({
      pathname: '/session/[id]',
      params: { id: session.id, navStartedAt: String(Date.now()), navSource: 'find-session' },
    })

  return (
    <SessionCard
      session={{
        id: session.id,
        courtName: court?.name ?? 'Keo Pickleball',
        courtAddress: fullAddress,
        distanceKm: distance,
        courtBookingConfirmed: session.court_booking_status === 'confirmed',
        startTime,
        endTime,
        level: String(getSkillScoreFromLevelId(skill.id) ?? 3),
        levelDescription: skill.title,
        levelMatchesUser: true,
        host: {
          id: session.host?.id ?? `host-${session.id}`,
          name: hostName,
          initial: hostInitial || '?',
        },
        enrolledCount: session.player_count,
        capacity: session.max_players,
        pricePerPerson: pricePerPlayer,
        status,
      }}
      onPress={openSessionDetail}
      onJoinPress={openSessionDetail}
    />
  )
}
function extractDistrict(address?: string | null): string | null {
  if (!address) return null
  const match = address.match(/(?:Quận|Huyện)\s+[^,\n]+/i)
  return match ? match[0].trim() : null
}

export default function FindSession() {
  const params = useLocalSearchParams<{ courtId?: string; courtName?: string }>()
  const [sessions, setSessions] = useState<Session[]>([])
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null)
  const [loading, setLoading] = useState(true)
  const [dialogConfig, setDialogConfig] = useState<AppDialogConfig | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [query, setQuery] = useState('')
  const [sortMode, setSortMode] = useState<'match' | 'time'>('match')
  const [quickFilters, setQuickFilters] = useState<Record<QuickFilterId, boolean>>({
    nearby: false,
    recent: false,
    level3: false,
    rescue: false,
  })
  const [preferredCourtFilter, setPreferredCourtFilter] = useState<{ id?: string; name?: string } | null>(null)
  const [filterModalVisible, setFilterModalVisible] = useState(false)
  const [advancedFilter, setAdvancedFilter] = useState<AdvancedFilter>(ADVANCED_FILTER_INITIAL)
  const [playerProfile, setPlayerProfile] = useState<PlayerQueueProfile | null>(null)
  const [smartQueueEnabled, setSmartQueueEnabled] = useState(false)
  const [smartQueueHydrated, setSmartQueueHydrated] = useState(false)

  const smartQueueStorageKey = playerProfile?.id ? getSmartQueueKey(playerProfile.id) : null

  const activeAdvancedFiltersCount = useMemo(
    () =>
      [
        advancedFilter.district,
        advancedFilter.date,
        advancedFilter.weekend,
        advancedFilter.timeSlot,
        advancedFilter.skillLevel,
        advancedFilter.priceMin != null,
        advancedFilter.priceMax != null,
        advancedFilter.bookingStatus,
        advancedFilter.slotsLeft != null,
      ].filter(Boolean).length,
    [advancedFilter],
  )

  const fetchSessions = useCallback(async () => {
    setLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const currentUserId = user?.id ?? null

    const { data, error } = await supabase
      .from('sessions')
      .select(
        `id, host_id, elo_min, elo_max, max_players, status, court_booking_status,
        host:host_id ( id, name, is_provisional, current_elo, elo, self_assessed_level, skill_label ),
        slot:slot_id (
          start_time, end_time, price,
          court:court_id ( id, name, address, city, lat, lng )
        ),
        session_players ( player_id )`,
      )
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(50)

    if (!error && data) {
      const normalized = data.map((s: any) => ({ 
        ...s, 
        player_count: (s.session_players ?? []).length,
        lat: s.slot?.court?.lat,
        lng: s.slot?.court?.lng
      })) as Session[]
      const visibleSessions = currentUserId
        ? normalized.filter((session) => {
            const joined = (session.session_players ?? []).some((player) => player.player_id === currentUserId)
            const hosted = session.host_id === currentUserId
            return !joined && !hosted
          })
        : normalized
      setSessions(visibleSessions)
    } else {
      setSessions([])
    }
    setLoading(false)
  }, [])

  const fetchPlayerProfile = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setPlayerProfile(null)
      setSmartQueueEnabled(false)
      setSmartQueueHydrated(true)
      return
    }
    const [{ data: profile }, storedFlag] = await Promise.all([
      supabase.from('players').select('id, city, current_elo, elo, self_assessed_level, skill_label, favorite_court_ids').eq('id', user.id).single(),
      AsyncStorage.getItem(getSmartQueueKey(user.id)),
    ])
    setPlayerProfile((profile as PlayerQueueProfile | null) ?? null)
    setSmartQueueEnabled(storedFlag === '1')
    setSmartQueueHydrated(true)
  }, [])

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

  const handleNearbyFilter = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync()
      if (status !== 'granted') {
        setDialogConfig({
          title: 'Quyền truy cập',
          message: 'Vui lòng cho phép ứng dụng truy cập vị trí để tìm các kèo gần bạn.',
          actions: [{ label: 'Đã hiểu' }],
        })
        return
      }

      setLoading(true)
      
      // Haptic feedback
      try {
        const { selectionAsync } = require('expo-haptics')
        await selectionAsync()
      } catch {}

      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      setUserLocation(location)

      // Enable nearby filter
      setQuickFilters(prev => ({ ...prev, nearby: true }))
      
      // Optional: If we want to be more specific, we could reverse geocode
      // and set the query to the city name, but for now nearby flag is enough
      
    } catch (error) {
      console.warn('[FindSession] nearby filter failed:', error)
      setDialogConfig({
        title: 'Lỗi',
        message: 'Không thể xác định vị trí của bạn lúc này.',
        actions: [{ label: 'Đã hiểu' }],
      })
    } finally {
      setLoading(false)
    }
  }, [])

  const applySmartQueueFilters = useCallback(
    async (enabled: boolean) => {
      if (!playerProfile?.id) {
        setDialogConfig({
          title: 'Cần hoàn thiện hồ sơ',
          message: 'Gợi ý hợp gu cần thành phố và mức trình gần đúng để ưu tiên kèo phù hợp hơn.',
          actions: [
            { label: 'Để sau', tone: 'secondary' },
            { label: 'Chỉnh hồ sơ', onPress: () => router.push('/edit-profile' as never) },
          ],
        })
        return
      }
      if (!enabled) {
        setSmartQueueEnabled(false)
        setQuickFilters({ nearby: false, recent: false, level3: false, rescue: false })
        setQuery('')
        if (smartQueueStorageKey) await AsyncStorage.setItem(smartQueueStorageKey, '0')
        return
      }
      const playerLevel = getSkillLevelFromPlayer(playerProfile)
      const nextQuery = playerProfile.city?.trim() ?? ''
      const normalizedCity = normalizeText(playerProfile.city)
      const canUseNearbyFilter = normalizedCity.includes('ho chi minh') || normalizedCity.includes('thu duc')
      setSortMode('match')
      setQuery(nextQuery)
      setQuickFilters({ nearby: canUseNearbyFilter, recent: true, level3: playerLevel?.id === 'level_3', rescue: false })
      setSmartQueueEnabled(true)
      if (smartQueueStorageKey) await AsyncStorage.setItem(smartQueueStorageKey, '1')
    },
    [playerProfile, smartQueueStorageKey],
  )

  useEffect(() => {
    if (!smartQueueHydrated || !playerProfile?.id || !smartQueueEnabled) return
    void applySmartQueueFilters(true)
  }, [applySmartQueueFilters, playerProfile?.id, smartQueueEnabled, smartQueueHydrated])

  useEffect(() => {
    const routeCourtId = typeof params.courtId === 'string' ? params.courtId : undefined
    const routeCourtName = typeof params.courtName === 'string' ? params.courtName : undefined
    if (!routeCourtId && !routeCourtName) return
    setPreferredCourtFilter({ id: routeCourtId, name: routeCourtName })
    if (routeCourtName) setQuery(routeCourtName)
  }, [params.courtId, params.courtName])

  // Build list of all districts from sessions
  const allDistricts = useMemo(() => {
    const set = new Set<string>()
    sessions.forEach((s) => {
      const d = extractDistrict(s.slot?.court?.address)
      if (d) set.add(d)
    })
    return Array.from(set)
  }, [sessions])

  // Build list of skill levels
  const skillLevels = [
    { id: 'level_1', label: 'Mới chơi' },
    { id: 'level_2', label: 'Cơ bản' },
    { id: 'level_3', label: 'Trung cấp' },
    { id: 'level_4', label: 'Khá' },
    { id: 'level_5', label: 'Nâng cao' },
  ]

  const filteredSessions = useMemo(() => {
    const normalizedSearch = normalizeText(query)
    return sessions.filter((session) => {
      // Search bar
      if (normalizedSearch && !buildSearchIndex(session).includes(normalizedSearch)) return false
      // Quick filters
      // advancedFilter.skillLevel takes precedence over quickFilters.level3 to avoid conflict
      if (!advancedFilter.skillLevel && quickFilters.level3 && getSkillLevelFromEloRange(session.elo_min, session.elo_max).id !== 'level_3') return false
      if (quickFilters.rescue && session.max_players - session.player_count > 2) return false
      if (quickFilters.recent) {
        const hoursUntilStart = (new Date(session.slot?.start_time ?? 0).getTime() - Date.now()) / 3600000
        if (hoursUntilStart < 0 || hoursUntilStart > 48) return false
      }
      if (quickFilters.nearby) {
        if (userLocation && session.lat != null && session.lng != null) {
          const dist = haversineKm(
            userLocation.coords.latitude, 
            userLocation.coords.longitude, 
            session.lat, 
            session.lng
          )
          if (dist > 15) return false // Filter within 15km
        } else {
          const city = normalizeText(session.slot?.court?.city)
          if (!city.includes('ho chi minh') && !city.includes('thu duc')) return false
        }
      }
      // Preferred court
      if (preferredCourtFilter?.id) {
        if (session.slot?.court?.id !== preferredCourtFilter.id) return false
      } else if (preferredCourtFilter?.name) {
        if (normalizeText(session.slot?.court?.name) !== normalizeText(preferredCourtFilter.name)) return false
      }
      // Advanced filter
      // District
      if (advancedFilter.district) {
        const d = extractDistrict(session.slot?.court?.address)
        if (d !== advancedFilter.district) return false
      }
      // Date
      if (advancedFilter.weekend) {
        const day = session.slot?.start_time ? new Date(session.slot.start_time).getDay() : -1
        if (day !== 0 && day !== 6) return false
      } else if (advancedFilter.date && /^\d{2}\/\d{2}\/\d{4}$/.test(advancedFilter.date)) {
        const s = session.slot?.start_time ? new Date(session.slot.start_time) : null
        const [d, m, y] = advancedFilter.date.split('/')
        if (!s || s.getDate() !== Number(d) || s.getMonth() + 1 !== Number(m) || s.getFullYear() !== Number(y)) return false
      }
      // Time slot
      if (advancedFilter.timeSlot) {
        const s = session.slot?.start_time ? new Date(session.slot.start_time) : null
        if (s) {
          const hour = s.getHours()
          if (advancedFilter.timeSlot === 'Sáng' && (hour < 5 || hour >= 12)) return false
          if (advancedFilter.timeSlot === 'Chiều' && (hour < 12 || hour >= 18)) return false
          if (advancedFilter.timeSlot === 'Tối' && (hour < 18 || hour >= 23)) return false
        }
      }
      // Skill level
      if (advancedFilter.skillLevel) {
        if (getSkillLevelFromEloRange(session.elo_min, session.elo_max).id !== advancedFilter.skillLevel) return false
      }
      // Price (skip if invalid range)
      if (typeof advancedFilter.priceMin === 'number' || typeof advancedFilter.priceMax === 'number') {
        const validRange = !(typeof advancedFilter.priceMin === 'number' && typeof advancedFilter.priceMax === 'number' && advancedFilter.priceMin > advancedFilter.priceMax)
        if (validRange) {
          const pricePer = session.max_players > 0 ? Math.round((session.slot?.price ?? 0) / session.max_players) : 0
          if (typeof advancedFilter.priceMin === 'number' && pricePer < advancedFilter.priceMin * 1000) return false
          if (typeof advancedFilter.priceMax === 'number' && pricePer > advancedFilter.priceMax * 1000) return false
        }
      }
      // Booking status
      if (advancedFilter.bookingStatus) {
        if (session.court_booking_status !== advancedFilter.bookingStatus) return false
      }
      // Slots left (at least N)
      if (typeof advancedFilter.slotsLeft === 'number') {
        if ((session.max_players - session.player_count) < advancedFilter.slotsLeft) return false
      }
      return true
    }).sort((a, b) => {
      if (sortMode === 'time') {
        return new Date(a.slot?.start_time ?? 0).getTime() - new Date(b.slot?.start_time ?? 0).getTime()
      }
      return (
        computeMatchScore(b, quickFilters.rescue, quickFilters.level3) -
        computeMatchScore(a, quickFilters.rescue, quickFilters.level3)
      )
    })
  }, [preferredCourtFilter, query, quickFilters, sessions, sortMode, advancedFilter])

  const listHeader = useMemo(() => (
    <View>
      <MainHeader
        title="Tìm kèo"
        subtitle={loading ? 'Đang cập nhật...' : `${filteredSessions.length} kèo phù hợp`}
        rightElement={
          <Pressable
            onPress={() => void handleNearbyFilter()}
            className="h-14 w-14 items-center justify-center rounded-full"
            style={{
              backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow,
              borderWidth: 1,
              borderColor: PROFILE_THEME_COLORS.outlineVariant,
            }}
          >
            <Navigation size={24} color={PROFILE_THEME_COLORS.primary} strokeWidth={2.4} />
          </Pressable>
        }
      />

      {/* Search bar */}
      <View className="px-5 pb-4">
        <View
          className="h-14 flex-row items-center px-4"
          style={{
            backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow,
            borderRadius: RADIUS.lg,
            borderWidth: 1,
            borderColor: PROFILE_THEME_COLORS.outlineVariant,
          }}
        >
          <Search size={18} color={PROFILE_THEME_COLORS.onSurfaceVariant} strokeWidth={2.4} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Tìm sân, quận hoặc trình độ..."
            placeholderTextColor={PROFILE_THEME_COLORS.outline}
            style={{
              flex: 1,
              marginLeft: 10,
              fontSize: 15,
              fontFamily: SCREEN_FONTS.body,
              color: PROFILE_THEME_COLORS.onSurface,
            }}
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery('')} className="ml-2 p-1">
              <X size={16} color={PROFILE_THEME_COLORS.onSurfaceVariant} strokeWidth={2.4} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {/* Bộ lọc + sắp xếp */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingBottom: 16, columnGap: 8 }}>
        <Pressable
          onPress={() => setFilterModalVisible(true)}
          className="flex-row items-center justify-center px-4 py-2.5"
          style={{
            minWidth: 152,
            backgroundColor: activeAdvancedFiltersCount > 0 ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.surfaceContainerLow,
            borderRadius: RADIUS.full,
            borderWidth: BORDER.base,
            borderColor: activeAdvancedFiltersCount > 0 ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.outlineVariant,
          }}
        >
          <SlidersHorizontal
            size={13}
            color={activeAdvancedFiltersCount > 0 ? PROFILE_THEME_COLORS.onPrimary : PROFILE_THEME_COLORS.onSurfaceVariant}
            strokeWidth={2.5}
          />
          <Text
            className="ml-1.5"
            style={{
              color: activeAdvancedFiltersCount > 0 ? PROFILE_THEME_COLORS.onPrimary : PROFILE_THEME_COLORS.onSurfaceVariant,
              fontFamily: SCREEN_FONTS.cta,
              fontSize: 13,
              textTransform: 'uppercase',
            }}
          >
            {activeAdvancedFiltersCount > 0 ? `Bộ lọc (${activeAdvancedFiltersCount})` : 'Bộ lọc nâng cao'}
          </Text>
        </Pressable>

        <View
          className="flex-1 flex-row items-center p-1"
          style={{
            backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow,
            borderRadius: RADIUS.full,
            borderWidth: BORDER.base,
            borderColor: PROFILE_THEME_COLORS.outlineVariant,
          }}
        >
          <Pressable
            onPress={() => setSortMode('match')}
            className="flex-1 items-center justify-center rounded-full py-2"
            style={{
              backgroundColor: sortMode === 'match' ? PROFILE_THEME_COLORS.primary : 'transparent',
            }}
          >
            <Text
              style={{
                color: sortMode === 'match' ? PROFILE_THEME_COLORS.onPrimary : PROFILE_THEME_COLORS.onSurfaceVariant,
                fontFamily: SCREEN_FONTS.cta,
                fontSize: 12,
                textTransform: 'uppercase',
              }}
            >
              Độ phù hợp
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setSortMode('time')}
            className="flex-1 items-center justify-center rounded-full py-2"
            style={{
              backgroundColor: sortMode === 'time' ? PROFILE_THEME_COLORS.primary : 'transparent',
            }}
          >
            <Text
              style={{
                color: sortMode === 'time' ? PROFILE_THEME_COLORS.onPrimary : PROFILE_THEME_COLORS.onSurfaceVariant,
                fontFamily: SCREEN_FONTS.cta,
                fontSize: 12,
                textTransform: 'uppercase',
              }}
            >
              Giờ chơi
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Preferred court filter banner */}
      {preferredCourtFilter ? (
        <View
          className="mx-5 mb-4 flex-row items-center rounded-[20px] px-4 py-3"
          style={{
            backgroundColor: PROFILE_THEME_COLORS.secondaryContainer,
          }}
        >
          <View className="flex-1 pr-3">
            <Text
              style={{ color: PROFILE_THEME_COLORS.onSecondaryContainer, fontFamily: SCREEN_FONTS.headline, fontSize: 10, letterSpacing: 2.2, textTransform: 'uppercase' }}
            >
              Đang lọc theo sân quen
            </Text>
            <Text
              numberOfLines={1}
              className="mt-1"
              style={{ color: PROFILE_THEME_COLORS.onSecondaryContainer, fontFamily: SCREEN_FONTS.label, fontSize: 13 }}
            >
              {preferredCourtFilter.name ?? 'Sân đã chọn'}
            </Text>
          </View>
          <Pressable
            onPress={() => setPreferredCourtFilter(null)}
            className="flex-row items-center rounded-full px-3 py-2"
            style={{ backgroundColor: withAlpha(PROFILE_THEME_COLORS.onSecondaryContainer, 0.12) }}
          >
            <X size={13} color={PROFILE_THEME_COLORS.onSecondaryContainer} strokeWidth={2.5} />
            <Text
              className="ml-1"
              style={{ color: PROFILE_THEME_COLORS.onSecondaryContainer, fontFamily: SCREEN_FONTS.label, fontSize: 12 }}
            >
              Bỏ lọc
            </Text>
          </Pressable>
        </View>
      ) : null}

      <View style={{ height: 4 }} />
    </View>
  ), [loading, filteredSessions.length, query, activeAdvancedFiltersCount, preferredCourtFilter, sortMode, handleNearbyFilter])

  const listFooter = useMemo(() => (
    <View className="px-5 pb-10">
      {!loading && filteredSessions.length === 0 ? (
        <View
          className="mb-4 rounded-[24px] px-6 py-7"
          style={{
            backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest,
            borderLeftWidth: 3,
            borderLeftColor: PROFILE_THEME_COLORS.primary,
            shadowColor: PROFILE_THEME_COLORS.onBackground,
            shadowOpacity: 0.04,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: 2,
          }}
        >
          <Text style={{ color: PROFILE_THEME_COLORS.outline, fontFamily: SCREEN_FONTS.headline, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' }}>
            Chưa có kèo khớp
          </Text>
          <Text className="mt-3" style={{ color: PROFILE_THEME_COLORS.onBackground, fontFamily: SCREEN_FONTS.headline, fontSize: 22, lineHeight: 28, textTransform: 'uppercase', letterSpacing: 1 }}>
            Thử đổi bộ lọc hoặc bật gợi ý hợp gu
          </Text>
          <Text className="mt-2" style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: SCREEN_FONTS.body, fontSize: 14, lineHeight: 22 }}>
            Hệ thống sẽ tiếp tục săn trận phù hợp để bạn không bỏ lỡ cơ hội vào sân đúng gu.
          </Text>
        </View>
      ) : null}

      <View
        className="rounded-[24px] px-6 py-6"
        style={{
          backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest,
          borderLeftWidth: 3,
          borderLeftColor: PROFILE_THEME_COLORS.primary,
          shadowColor: PROFILE_THEME_COLORS.onBackground,
          shadowOpacity: 0.04,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 4 },
          elevation: 2,
        }}
      >
        <Text style={{ color: PROFILE_THEME_COLORS.outline, fontFamily: SCREEN_FONTS.headline, fontSize: 10, letterSpacing: 2.2, textTransform: 'uppercase' }}>
          Gợi ý thông minh
        </Text>
        <Text className="mt-3" style={{ color: PROFILE_THEME_COLORS.onBackground, fontFamily: SCREEN_FONTS.headline, fontSize: 22, lineHeight: 28, textTransform: 'uppercase', letterSpacing: 1 }}>
          Chưa thấy kèo ưng ý?
        </Text>
        <Text className="mt-2" style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: SCREEN_FONTS.body, fontSize: 14, lineHeight: 22 }}>
          Bật gợi ý hợp gu để ưu tiên kèo vừa trình, vừa giờ, vừa khoảng cách bạn đang săn.
        </Text>

        {smartQueueEnabled ? (
          <Text
            className="mt-3"
            style={{ color: PROFILE_THEME_COLORS.primary, fontFamily: SCREEN_FONTS.label, fontSize: 12, lineHeight: 18 }}
          >
            Đang ưu tiên kèo gần {playerProfile?.city?.trim() || 'gu của bạn'} và khớp nhịp chơi hiện tại
          </Text>
        ) : null}

        <Pressable
          onPress={() => void applySmartQueueFilters(!smartQueueEnabled)}
          disabled={!smartQueueHydrated}
          className="mt-4 flex-row items-center justify-center rounded-[20px] px-4 py-3.5"
          style={{
            backgroundColor: smartQueueEnabled
              ? PROFILE_THEME_COLORS.surfaceContainerHighest
              : PROFILE_THEME_COLORS.primary,
            opacity: !smartQueueHydrated ? 0.5 : 1,
          }}
        >
          <Sparkles
            size={15}
            color={smartQueueEnabled ? PROFILE_THEME_COLORS.onSurfaceVariant : PROFILE_THEME_COLORS.onPrimary}
            strokeWidth={2.3}
          />
          <Text
            className="ml-2 text-[13px]"
            style={{
              color: smartQueueEnabled ? PROFILE_THEME_COLORS.onSurfaceVariant : PROFILE_THEME_COLORS.onPrimary,
              fontFamily: SCREEN_FONTS.label,
            }}
          >
            {smartQueueEnabled ? 'Tắt gợi ý hợp gu' : 'Bật gợi ý hợp gu'}
          </Text>
        </Pressable>
      </View>
    </View>
  ), [loading, filteredSessions.length, smartQueueEnabled, smartQueueHydrated, playerProfile?.city, applySmartQueueFilters])

  return (
    <View className="flex-1" style={{ backgroundColor: PROFILE_THEME_COLORS.background }}>
      {loading ? (
        <View className="flex-1">
          {listHeader}
          <AppLoading 
            label="Đang tải kèo phù hợp..." 
            style={{ flex: 1, justifyContent: 'center' }}
          />
        </View>
      ) : (
        <FlatList
          data={filteredSessions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View className="px-5">
              <SearchResultCard 
                session={item} 
                rescueMode={quickFilters.rescue} 
                userLocation={userLocation}
              />
            </View>
          )}
          ListHeaderComponent={listHeader}
          ListFooterComponent={listFooter}
          contentContainerStyle={{ paddingBottom: 12 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PROFILE_THEME_COLORS.primary} />
          }
        />
      )}
      <AdvancedSessionFilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        filter={advancedFilter}
        setFilter={setAdvancedFilter}
        onApply={() => setFilterModalVisible(false)}
        onReset={() => setAdvancedFilter(ADVANCED_FILTER_INITIAL)}
        districts={allDistricts}
        skillLevels={skillLevels}
      />
      <AppDialog
        visible={Boolean(dialogConfig)}
        config={dialogConfig}
        onClose={() => setDialogConfig(null)}
      />
    </View>
  )
}





