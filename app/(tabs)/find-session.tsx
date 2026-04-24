import {
    ADVANCED_FILTER_INITIAL,
    AdvancedFilter,
    AdvancedSessionFilterModal,
} from '@/components/find-session/AdvancedSessionFilterModal'
import { PROFILE_THEME_COLORS } from '@/components/profile/profileTheme'
import { getSkillLevelFromEloRange, getSkillLevelFromPlayer } from '@/lib/skillAssessment'
import { getSkillLevelUi } from '@/lib/skillLevelUi'
import { supabase } from '@/lib/supabase'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { LinearGradient } from 'expo-linear-gradient'
import * as Linking from 'expo-linking'
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router'
import {
    AlertCircle,
    CalendarDays,
    Map,
    MapPin,
    Search,
    ShieldCheck,
    SlidersHorizontal,
    Sparkles,
    UserRound,
    X,
} from 'lucide-react-native'
import { useCallback, useEffect, useMemo, useState } from 'react'
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Pressable,
    RefreshControl,
    Text,
    TextInput,
    View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

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

const BADGE = {
  backgroundColor: withAlpha(PROFILE_THEME_COLORS.primary, 0.1),
} as const

function SearchResultCard({ session, rescueMode }: { session: Session; rescueMode: boolean }) {
  const court = session.slot?.court
  const { dayLabel, timeLabel } = formatDateTime(
    session.slot?.start_time ?? new Date().toISOString(),
    session.slot?.end_time ?? new Date().toISOString(),
  )
  const skillLevel = getSkillLevelFromEloRange(session.elo_min, session.elo_max)
  const skillUi = getSkillLevelUi(skillLevel.id)
  const SkillIcon = skillUi.icon
  const slotsLeft = Math.max(session.max_players - session.player_count, 0)
  const isFull = slotsLeft === 0
  const isBooked = session.court_booking_status === 'confirmed'
  const progress = session.max_players > 0 ? Math.min(session.player_count / session.max_players, 1) : 0
  const progressPercent = Math.max(progress * 100, 0)
  const hostInitials = (session.host?.name || '?').slice(0, 1).toUpperCase()
  const address = [court?.address, court?.city].filter(Boolean).join(', ')
  const compactAddress = address.split(',').map((p) => p.trim()).filter(Boolean).slice(0, 2).join(', ')
  const matchScore = computeMatchScore(session, rescueMode, skillLevel.id === 'level_3')

  const openSessionDetail = () =>
    router.push({
      pathname: '/session/[id]',
      params: { id: session.id, navStartedAt: String(Date.now()), navSource: 'find-session' },
    })

  return (
    <Pressable
      onPress={openSessionDetail}
      className="mb-4 overflow-hidden rounded-[34px] px-6 pt-6 pb-4"
      style={{
        backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest,
        borderLeftWidth: 3,
        borderLeftColor: PROFILE_THEME_COLORS.primary,
        shadowColor: PROFILE_THEME_COLORS.onBackground,
        shadowOpacity: 0.06,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
        elevation: 3,
      }}
    >
      <View style={{ position: 'absolute', top: -10, right: -16, zIndex: 0, opacity: 0.07 }} pointerEvents="none">
        <SkillIcon size={96} color={PROFILE_THEME_COLORS.primary} strokeWidth={1.4} />
      </View>

      <Text
        numberOfLines={2}
        ellipsizeMode="tail"
        style={{
          color: PROFILE_THEME_COLORS.primary,
          fontFamily: 'PlusJakartaSans-ExtraBold',
          fontSize: 20,
          lineHeight: 24,
          letterSpacing: 0.8,
          textTransform: 'uppercase',
        }}
      >
        {court?.name ?? 'Kèo Pickleball'}
      </Text>

      {compactAddress ? (
        <View className="mt-1">
          <View
            className="self-start flex-row items-center rounded-full px-3 py-1.5"
            style={{ ...BADGE, maxWidth: '100%' }}
          >
            <MapPin size={13} color={PROFILE_THEME_COLORS.primary} strokeWidth={2.4} />
            <Text
              className="ml-1.5"
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{
                color: PROFILE_THEME_COLORS.onSurfaceVariant,
                fontFamily: 'PlusJakartaSans-SemiBold',
                fontSize: 13,
                lineHeight: 18,
              }}
            >
              {compactAddress}
            </Text>
          </View>
        </View>
      ) : null}

      <View className="mt-2 flex-row flex-wrap gap-2">
        <View className="flex-row items-center rounded-full px-3 py-1.5" style={BADGE}>
          <CalendarDays size={13} color={PROFILE_THEME_COLORS.primary} strokeWidth={2.4} />
          <Text
            className="ml-1.5"
            numberOfLines={1}
            style={{ color: PROFILE_THEME_COLORS.primary, fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 13, lineHeight: 18 }}
          >
            {dayLabel} • {timeLabel}
          </Text>
        </View>

        <View className="flex-row items-center rounded-full px-3 py-1.5" style={BADGE}>
          <SkillIcon size={13} color={PROFILE_THEME_COLORS.primary} strokeWidth={2.4} />
          <Text
            className="ml-1.5"
            style={{ color: PROFILE_THEME_COLORS.primary, fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 13, lineHeight: 18 }}
          >
            {skillUi.shortLabel}
          </Text>
        </View>

        <View className="flex-row items-center rounded-full px-3 py-1.5" style={BADGE}>
          {isBooked
            ? <ShieldCheck size={13} color={PROFILE_THEME_COLORS.primary} strokeWidth={2.4} />
            : <AlertCircle size={13} color={PROFILE_THEME_COLORS.primary} strokeWidth={2.4} />}
          <Text
            className="ml-1.5"
            style={{ color: PROFILE_THEME_COLORS.primary, fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 13, lineHeight: 18 }}
          >
            {isBooked ? 'Đã đặt sân' : 'Chưa đặt sân'}
          </Text>
        </View>

        <View
          className="flex-row items-center rounded-full px-3 py-1.5"
          style={{ backgroundColor: withAlpha(PROFILE_THEME_COLORS.primary, 0.1) }}
        >
          <Text
            style={{ color: PROFILE_THEME_COLORS.primary, fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 12, lineHeight: 18 }}
          >
            {matchScore}% phù hợp
          </Text>
        </View>
      </View>

      <View
        className="mt-4 rounded-[24px] p-3.5"
        style={{ backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow }}
      >
        <View className="flex-row items-center justify-between">
          <View className="mr-3 flex-1 flex-row items-center">
            <Pressable
              onPress={(event) => {
                event.stopPropagation()
                if (!session.host?.id) return
                router.push({ pathname: '/player/[id]' as never, params: { id: session.host.id } })
              }}
              className="mr-3 h-11 w-11 items-center justify-center rounded-full"
              style={{
                backgroundColor: PROFILE_THEME_COLORS.primary,
                borderWidth: 1,
                borderColor: withAlpha(PROFILE_THEME_COLORS.primary, 0.14),
              }}
            >
              <Text style={{ color: PROFILE_THEME_COLORS.onPrimary, fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 15 }}>
                {hostInitials}
              </Text>
            </Pressable>
            <View className="flex-1">
              <Text
                numberOfLines={1}
                style={{ color: PROFILE_THEME_COLORS.onSurface, fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 13 }}
              >
                {session.host?.name ?? 'Ẩn danh'}
              </Text>
              <Text style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: 'PlusJakartaSans-Regular', fontSize: 11, marginTop: 1 }}>
                Chủ kèo
              </Text>
            </View>
          </View>

          <View className="items-end">
            <Text style={{ color: PROFILE_THEME_COLORS.onSurface, fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 18 }}>
              {formatPrice(session.slot?.price ?? 0, session.max_players)}
            </Text>
            <Text style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: 'PlusJakartaSans-Regular', fontSize: 10 }}>
              /người
            </Text>
          </View>
        </View>

        <View
          className="mt-3 h-2 overflow-hidden rounded-full"
          style={{ backgroundColor: PROFILE_THEME_COLORS.surfaceContainerHighest }}
        >
          <LinearGradient
            colors={[PROFILE_THEME_COLORS.primary, PROFILE_THEME_COLORS.tertiary]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ width: `${Math.max(progressPercent, 8)}%`, height: '100%', borderRadius: 999 }}
          />
        </View>

        <View className="mt-2 flex-row items-center justify-between">
          <View className="flex-row items-center">
            {Array.from({ length: Math.min(session.player_count, 4) }).map((_, index) => (
              <View
                key={index}
                className={`h-7 w-7 items-center justify-center rounded-full ${index === 0 ? '' : '-ml-2'}`}
                style={{
                  backgroundColor: PROFILE_THEME_COLORS.primary,
                  borderWidth: 2,
                  borderColor: PROFILE_THEME_COLORS.surfaceContainerLow,
                }}
              >
                <UserRound size={12} color={PROFILE_THEME_COLORS.onPrimary} strokeWidth={2.2} />
              </View>
            ))}
            {session.player_count > 4 ? (
              <View
                className="-ml-2 h-7 w-7 items-center justify-center rounded-full"
                style={{
                  backgroundColor: PROFILE_THEME_COLORS.surfaceContainerHighest,
                  borderWidth: 2,
                  borderColor: PROFILE_THEME_COLORS.surfaceContainerLow,
                }}
              >
                <Text style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 9 }}>
                  +{session.player_count - 4}
                </Text>
              </View>
            ) : null}
          </View>
          <Text style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 12 }}>
            {isFull ? 'Đã đủ người' : `Còn ${slotsLeft} chỗ`}
          </Text>
        </View>

        <Pressable
          onPress={openSessionDetail}
          className="mt-3 flex-row items-center justify-center rounded-[20px] px-4 py-3.5"
          style={{
            backgroundColor: isFull ? PROFILE_THEME_COLORS.surfaceContainerHighest : PROFILE_THEME_COLORS.primary,
          }}
        >
          <Text
            style={{
              color: isFull ? PROFILE_THEME_COLORS.onSurfaceVariant : PROFILE_THEME_COLORS.onPrimary,
              fontFamily: 'PlusJakartaSans-ExtraBold',
              fontSize: 13,
              letterSpacing: 0.5,
            }}
          >
            {isFull ? 'Đã đủ người' : 'Vào kèo'}
          </Text>
        </Pressable>
      </View>
    </Pressable>
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

    await supabase.rpc('process_fill_deadline_session_closures')
    const { data, error } = await supabase
      .from('sessions')
      .select(
        `id, host_id, elo_min, elo_max, max_players, status, court_booking_status,
        host:host_id ( id, name, is_provisional, current_elo, elo, self_assessed_level, skill_label ),
        slot:slot_id (
          start_time, end_time, price,
          court:court_id ( id, name, address, city )
        ),
        session_players ( player_id )`,
      )
      .eq('status', 'open')
      .order('created_at', { ascending: false })
      .limit(50)

    if (!error && data) {
      const normalized = data.map((s: any) => ({ ...s, player_count: (s.session_players ?? []).length })) as Session[]
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

  const openMapSearch = useCallback(async () => {
    const fallbackQuery = query.trim() || playerProfile?.city?.trim() || sessions[0]?.slot?.court?.city?.trim() || 'Hồ Chí Minh'
    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fallbackQuery)}`
    try {
      await Linking.openURL(url)
    } catch {
      Alert.alert('Không mở được bản đồ', 'Vui lòng thử lại sau ít phút.')
    }
  }, [playerProfile?.city, query, sessions])

  const applySmartQueueFilters = useCallback(
    async (enabled: boolean) => {
      if (!playerProfile?.id) {
        Alert.alert(
          'Cần hoàn thiện hồ sơ',
          'Gợi ý hợp gu cần thành phố và mức trình gần đúng để ưu tiên kèo phù hợp hơn.',
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
        const city = normalizeText(session.slot?.court?.city)
        if (!city.includes('ho chi minh') && !city.includes('thu duc')) return false
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
      {/* Page title */}
      <View className="flex-row items-start justify-between px-5 pt-5 pb-4">
        <View className="flex-1 pr-4">
          <Text
            className="text-[11px] uppercase tracking-[0.16em]"
            style={{ color: PROFILE_THEME_COLORS.outline, fontFamily: 'PlusJakartaSans-ExtraBold' }}
          >
            KHÁM PHÁ
          </Text>
          <Text
            className="mt-2 text-[28px] leading-[34px]"
            style={{ color: PROFILE_THEME_COLORS.onBackground, fontFamily: 'PlusJakartaSans-ExtraBold' }}
          >
            Tìm kèo
          </Text>
        </View>

        <Pressable
          onPress={() => void openMapSearch()}
          className="mt-1 h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow }}
        >
          <Map size={24} color={PROFILE_THEME_COLORS.primary} strokeWidth={2.4} />
        </Pressable>
      </View>

      {/* Search bar */}
      <View className="px-5 pb-3">
        <View
          className="h-14 flex-row items-center rounded-[24px] px-4"
          style={{
            backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow,
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
              fontFamily: 'PlusJakartaSans-SemiBold',
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

      {/* Bộ lọc nâng cao */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16 }}>
        <Pressable
          onPress={() => setFilterModalVisible(true)}
          className="flex-row items-center rounded-full px-4 py-2.5"
          style={{
            backgroundColor: activeAdvancedFiltersCount > 0 ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.surfaceContainerLow,
            borderWidth: 1,
            borderColor: activeAdvancedFiltersCount > 0 ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.outlineVariant,
            marginRight: 8,
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
              fontFamily: 'PlusJakartaSans-ExtraBold',
              fontSize: 12,
            }}
          >
            {activeAdvancedFiltersCount > 0 ? `Bộ lọc (${activeAdvancedFiltersCount})` : 'Bộ lọc nâng cao'}
          </Text>
        </Pressable>
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
              style={{ color: PROFILE_THEME_COLORS.onSecondaryContainer, fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' }}
            >
              Đang lọc theo sân quen
            </Text>
            <Text
              numberOfLines={1}
              className="mt-1"
              style={{ color: PROFILE_THEME_COLORS.onSecondaryContainer, fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 13 }}
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
              style={{ color: PROFILE_THEME_COLORS.onSecondaryContainer, fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 12 }}
            >
              Bỏ lọc
            </Text>
          </Pressable>
        </View>
      ) : null}

      {/* Results header */}
      <View className="flex-row items-center justify-between px-5 pb-4">
        <View className="flex-1 pr-4">
          <Text
            style={{ color: PROFILE_THEME_COLORS.onBackground, fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 16 }}
          >
            {loading
              ? 'Đang tải...'
              : filteredSessions.length > 0
                ? `${filteredSessions.length} kèo phù hợp`
                : 'Không tìm thấy kèo'}
          </Text>
        </View>

        <Pressable
          onPress={() => setSortMode((current) => (current === 'match' ? 'time' : 'match'))}
          className="flex-row items-center rounded-full px-4 py-2.5"
          style={BADGE}
        >
          <Text style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 12 }}>
            {sortMode === 'match' ? 'Độ phù hợp ↕' : 'Giờ chơi ↕'}
          </Text>
        </Pressable>
      </View>
    </View>
  ), [loading, filteredSessions.length, query, activeAdvancedFiltersCount, preferredCourtFilter, sortMode, openMapSearch])

  const listFooter = useMemo(() => (
    <View className="px-5 pb-10">
      {!loading && filteredSessions.length === 0 ? (
        <View
          className="mb-4 rounded-[28px] px-6 py-7"
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
          <Text style={{ color: PROFILE_THEME_COLORS.outline, fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' }}>
            Chưa có kèo khớp
          </Text>
          <Text className="mt-3" style={{ color: PROFILE_THEME_COLORS.onBackground, fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 22, lineHeight: 28 }}>
            Thử đổi bộ lọc hoặc bật gợi ý hợp gu
          </Text>
          <Text className="mt-2" style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: 'PlusJakartaSans-Regular', fontSize: 14, lineHeight: 22 }}>
            Hệ thống sẽ tiếp tục săn trận phù hợp để bạn không bỏ lỡ cơ hội vào sân đúng gu.
          </Text>
        </View>
      ) : null}

      <View
        className="rounded-[28px] px-6 py-6"
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
        <Text style={{ color: PROFILE_THEME_COLORS.outline, fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' }}>
          Gợi ý thông minh
        </Text>
        <Text className="mt-3" style={{ color: PROFILE_THEME_COLORS.onBackground, fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 22, lineHeight: 28 }}>
          Chưa thấy kèo ưng ý?
        </Text>
        <Text className="mt-2" style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: 'PlusJakartaSans-Regular', fontSize: 14, lineHeight: 22 }}>
          Bật gợi ý hợp gu để ưu tiên kèo vừa trình, vừa giờ, vừa khoảng cách bạn đang săn.
        </Text>

        {smartQueueEnabled ? (
          <Text
            className="mt-3"
            style={{ color: PROFILE_THEME_COLORS.primary, fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 12, lineHeight: 18 }}
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
              fontFamily: 'PlusJakartaSans-ExtraBold',
            }}
          >
            {smartQueueEnabled ? 'Tắt gợi ý hợp gu' : 'Bật gợi ý hợp gu'}
          </Text>
        </Pressable>
      </View>
    </View>
  ), [loading, filteredSessions.length, smartQueueEnabled, smartQueueHydrated, playerProfile?.city, applySmartQueueFilters])

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: PROFILE_THEME_COLORS.background }} edges={['top']}>
      {loading ? (
        <View className="flex-1">
          {listHeader}
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={PROFILE_THEME_COLORS.primary} />
            <Text
              className="mt-4 text-[14px]"
              style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: 'PlusJakartaSans-SemiBold' }}
            >
              Đang tải kèo phù hợp...
            </Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={filteredSessions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View className="px-5">
              <SearchResultCard session={item} rescueMode={quickFilters.rescue} />
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
    </SafeAreaView>
  )
}


