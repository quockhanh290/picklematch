import AsyncStorage from '@react-native-async-storage/async-storage'
import { SectionCard, StatusBadge } from '@/components/design'
import { getShadowStyle } from '@/lib/designSystem'
import { supabase } from '@/lib/supabase'
import { useAppTheme } from '@/lib/theme-context'
import { useAuth } from '@/lib/useAuth'
import { router } from 'expo-router'
import {
  Calendar,
  CalendarDays,
  CheckCircle2,
  Clock,
  FileText,
  Hourglass,
  Pencil as Edit3,
  Share2,
  Star,
  Users,
} from 'lucide-react-native'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

type SessionRequestStatus = 'pending' | 'accepted' | 'rejected' | null
type SessionRole = 'host' | 'player'
type SessionTab = 'upcoming' | 'pending' | 'history'

type MySession = {
  id: string
  status: string
  court_booking_status: 'confirmed' | 'unconfirmed'
  role: SessionRole
  request_status: SessionRequestStatus
  start_time: string
  end_time: string
  court_name: string
  court_city: string
  court_address: string
  host_name: string
  player_count: number
  max_players: number
}

type MySessionsCache = {
  userId: string
  sessions: MySession[]
  updatedAt: number
}

const mySessionsCacheByUser = new Map<string, MySessionsCache>()
const MY_SESSIONS_LAST_USER_KEY = 'my_sessions_last_user_id_v1'
const ENABLE_MY_SESSIONS_TIMING_LOGS = false
const MY_SESSIONS_CACHE_FRESH_MS = 30_000

function getMySessionsCacheKey(userId: string) {
  return `my_sessions_overview_cache_v1:${userId}`
}

const TAB_OPTIONS: { key: SessionTab; label: string }[] = [
  { key: 'upcoming', label: 'Sắp đánh' },
  { key: 'pending', label: 'Chờ duyệt' },
  { key: 'history', label: 'Lịch sử' },
]

function isValidDate(value?: string | null) {
  if (!value) return false
  return !Number.isNaN(new Date(value).getTime())
}

function logTiming(label: string, startedAt: number, extra?: Record<string, unknown>) {
  if (!ENABLE_MY_SESSIONS_TIMING_LOGS) return

  const payload = extra ? ` ${JSON.stringify(extra)}` : ''
  console.log(`[MySessions][timing] ${label}: ${Date.now() - startedAt}ms${payload}`)
}

function sessionsFingerprint(items: MySession[]) {
  return JSON.stringify(
    items.map((item) => ({
      id: item.id,
      status: item.status,
      court_booking_status: item.court_booking_status,
      role: item.role,
      request_status: item.request_status,
      start_time: item.start_time,
      end_time: item.end_time,
      court_name: item.court_name,
      court_city: item.court_city,
      court_address: item.court_address,
      host_name: item.host_name,
      player_count: item.player_count,
      max_players: item.max_players,
    })),
  )
}

type MySessionsTheme = ReturnType<typeof useAppTheme>

function MySessionsEmptyStateCard({
  activeTab,
  theme,
}: {
  activeTab: SessionTab
  theme: MySessionsTheme
}) {
  const config =
    activeTab === 'upcoming'
      ? {
          eyebrow: 'SẴN SÀNG RA SÂN',
          title: 'Bạn chưa có kèo sắp đánh',
          description: 'Tạo kèo mới hoặc tham gia một trận phù hợp để lịch chơi của bạn bắt đầu đầy lên.',
        }
      : activeTab === 'pending'
        ? {
            eyebrow: 'ĐANG CHỜ',
            title: 'Chưa có yêu cầu nào cần duyệt',
            description: 'Những kèo bạn đang chờ chủ kèo phản hồi sẽ xuất hiện tại đây.',
          }
        : {
            eyebrow: 'LỊCH SỬ THI ĐẤU',
            title: 'Bạn chưa có lịch sử trận đấu',
            description: 'Sau khi hoàn thành các trận đã chơi, phần lịch sử sẽ hiển thị tại đây.',
          }

  return (
    <SectionCard className="px-6 py-7">
      <Text className="text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: theme.textSoft }}>
        {config.eyebrow}
      </Text>
      <Text className="mt-3 text-[24px] font-black leading-[30px]" style={{ color: theme.text }}>
        {config.title}
      </Text>
      <Text className="mt-2 text-[14px] leading-6" style={{ color: theme.textMuted }}>
        {config.description}
      </Text>
    </SectionCard>
  )
}

function MySessionCard({
  item,
  tab,
  theme,
  onOpenSessionDetail,
  onOpenRateSession,
  onShare,
  formatDatePart,
  formatTimeRange,
}: {
  item: MySession
  tab: SessionTab
  theme: MySessionsTheme
  onOpenSessionDetail: (sessionId: string) => void
  onOpenRateSession: (sessionId: string) => void
  onShare: (session?: MySession) => void | Promise<void>
  formatDatePart: (value: string) => string
  formatTimeRange: (start: string, end: string) => string
}) {
  const isHost = item.role === 'host'
  const isBooked = item.court_booking_status === 'confirmed'
  const progress = item.max_players > 0 ? Math.min(item.player_count / item.max_players, 1) : 0
  const address = [item.court_address, item.court_city].filter(Boolean).join(', ')
  const cardStyle = useMemo(
    () => ({
      backgroundColor: theme.surface,
      borderColor: theme.border,
      ...getShadowStyle(theme),
    }),
    [theme],
  )
  const bookedBadgeStyle = useMemo(() => ({ backgroundColor: theme.primarySoft }), [theme])
  const idBadgeStyle = useMemo(() => ({ backgroundColor: theme.surfaceAlt }), [theme])
  const metaCardStyle = useMemo(() => ({ backgroundColor: theme.surfaceAlt }), [theme])
  const progressTrackStyle = useMemo(() => ({ backgroundColor: theme.surfaceAlt }), [theme])
  const progressFillStyle = useMemo(
    () => ({ width: `${Math.max(progress * 100, 8)}%` as `${number}%`, backgroundColor: theme.primary }),
    [progress, theme],
  )
  const pendingCardStyle = useMemo(
    () => ({ borderColor: theme.warning, backgroundColor: theme.warningSoft }),
    [theme],
  )
  const primaryActionStyle = useMemo(
    () => ({ borderColor: theme.border, backgroundColor: theme.surface }),
    [theme],
  )
  const secondaryActionStyle = useMemo(() => ({ backgroundColor: theme.accent }), [theme])
  const historyActionStyle = useMemo(
    () => ({ backgroundColor: item.status === 'done' ? theme.text : theme.surfaceAlt }),
    [item.status, theme],
  )

  return (
    <Pressable
      onPress={() => onOpenSessionDetail(item.id)}
      className="mb-4 rounded-[32px] border p-5 active:scale-[0.98]"
      style={cardStyle}
    >
      <View className="flex-row items-start justify-between">
        <View className="mr-3 flex-1 flex-row flex-wrap items-center gap-2">
          <StatusBadge label={isHost ? 'Bạn là chủ kèo' : 'Bạn là người chơi'} tone={isHost ? 'info' : 'neutral'} />

          {isBooked ? (
            <View className="rounded-full px-3 py-2" style={bookedBadgeStyle}>
              <View className="flex-row items-center">
                <CheckCircle2 size={13} color={theme.primary} strokeWidth={2.4} />
                <Text className="ml-1.5 text-[10px] font-black uppercase tracking-[0.12em]" style={{ color: theme.primaryStrong }}>
                  Đã chốt sân
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        <View className="rounded-full px-3 py-2" style={idBadgeStyle}>
          <Text className="text-[10px] font-black uppercase tracking-[0.12em]" style={{ color: theme.textMuted }}>
            #{item.id.slice(0, 6)}
          </Text>
        </View>
      </View>

      <View className="mt-5">
        <Text className="text-[19px] font-black" style={{ color: theme.text }}>{item.court_name}</Text>
        {address ? <Text className="mt-2 text-[14px]" style={{ color: theme.textMuted }}>{address}</Text> : null}
      </View>

      <View className="mt-5 rounded-[22px] px-4 py-3" style={metaCardStyle}>
        <View className="flex-row flex-wrap items-center gap-4">
          <View className="flex-row items-center">
            <CalendarDays size={15} color={theme.textMuted} strokeWidth={2.3} />
            <Text className="ml-2 text-[13px] font-semibold" style={{ color: theme.text }}>{formatDatePart(item.start_time)}</Text>
          </View>

          <View className="flex-row items-center">
            <Clock size={15} color={theme.textMuted} strokeWidth={2.3} />
            <Text className="ml-2 text-[13px] font-semibold" style={{ color: theme.text }}>
              {formatTimeRange(item.start_time, item.end_time)}
            </Text>
          </View>
        </View>
      </View>

      <View className="mt-5">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Users size={15} color={theme.text} strokeWidth={2.3} />
            <Text className="ml-2 text-[14px] font-bold" style={{ color: theme.text }}>
              {item.player_count}/{item.max_players} người tham gia
            </Text>
          </View>
          <Text className="text-[12px] font-bold" style={{ color: theme.textSoft }}>{Math.round(progress * 100)}%</Text>
        </View>

        <View className="mt-3 h-2 overflow-hidden rounded-full" style={progressTrackStyle}>
          <View className="h-2 rounded-full" style={progressFillStyle} />
        </View>
      </View>

      {tab === 'pending' ? (
        <View className="mt-5 rounded-[24px] border px-4 py-4" style={pendingCardStyle}>
          <View className="flex-row items-center">
            <Hourglass size={16} color={theme.warning} strokeWidth={2.3} />
            <Text className="ml-2 text-[14px] font-black" style={{ color: theme.warning }}>
              {isHost ? 'Có người đang chờ bạn duyệt' : 'Đang chờ phản hồi'}
            </Text>
          </View>
          <Text className="mt-2 text-[13px] leading-5" style={{ color: theme.warning }}>
            {isHost
              ? 'Mở chi tiết kèo để xem và duyệt những người chơi vừa gửi yêu cầu tham gia.'
              : 'Chủ kèo sẽ duyệt yêu cầu tham gia của bạn trong thời gian sớm nhất.'}
          </Text>
        </View>
      ) : null}

      {tab === 'upcoming' ? (
        <View className="mt-5 flex-row gap-3">
          <Pressable
            onPress={() => onOpenSessionDetail(item.id)}
            className="flex-1 flex-row items-center justify-center rounded-[22px] border px-4 py-4"
            style={primaryActionStyle}
          >
            {isHost ? <Edit3 size={16} color={theme.text} strokeWidth={2.3} /> : <FileText size={16} color={theme.text} strokeWidth={2.3} />}
            <Text className="ml-2 text-[14px] font-black" style={{ color: theme.text }}>{isHost ? 'Sửa kèo' : 'Chi tiết'}</Text>
          </Pressable>

          <Pressable
            onPress={() => void onShare(item)}
            className="flex-1 flex-row items-center justify-center rounded-[22px] px-4 py-4"
            style={secondaryActionStyle}
          >
            <Share2 size={16} color="#000000" strokeWidth={2.3} />
            <Text className="ml-2 text-[14px] font-black text-black">Chia sẻ</Text>
          </Pressable>
        </View>
      ) : null}

      {tab === 'history' ? (
        <Pressable
          onPress={() => (item.status === 'done' ? onOpenRateSession(item.id) : onOpenSessionDetail(item.id))}
          className="mt-5 flex-row items-center justify-center rounded-[22px] px-4 py-4"
          style={historyActionStyle}
        >
          <Star size={16} color={item.status === 'done' ? theme.accent : theme.textMuted} strokeWidth={2.3} />
          <Text className="ml-2 text-[14px] font-black" style={{ color: item.status === 'done' ? theme.primaryContrast : theme.textMuted }}>
            Đánh giá trận đấu
          </Text>
        </Pressable>
      ) : null}
    </Pressable>
  )
}

export default function MySessions() {
  const theme = useAppTheme()
  const { userId, isLoading: isAuthLoading } = useAuth()
  const { width } = useWindowDimensions()
  const [sessions, setSessions] = useState<MySession[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [myId, setMyId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<SessionTab>('upcoming')
  const [segmentWidth, setSegmentWidth] = useState(0)
  const [isPagerDragging, setIsPagerDragging] = useState(false)
  const initInFlightRef = useRef(false)
  const fetchInFlightRef = useRef<Promise<void> | null>(null)
  const sessionsRef = useRef<MySession[]>([])
  const pagerRef = useRef<ScrollView | null>(null)
  const scrollX = useRef(new Animated.Value(0)).current

  useEffect(() => {
    sessionsRef.current = sessions
  }, [sessions])

  const hydrateCachedSessionsForLastUser = useCallback(async () => {
    const startedAt = Date.now()

    const [lastUserId] = await Promise.all([AsyncStorage.getItem(MY_SESSIONS_LAST_USER_KEY)])
    const memoryCache = lastUserId ? mySessionsCacheByUser.get(lastUserId) ?? null : null

    if (memoryCache?.sessions.length) {
      setSessions(memoryCache.sessions)
      setLoading(false)
      logTiming('bootstrap-memory-cache-hit', startedAt, { sessions: memoryCache.sessions.length })
      return
    }

    try {
      if (!lastUserId) {
        logTiming('bootstrap-cache-miss', startedAt)
        return
      }

      const raw = await AsyncStorage.getItem(getMySessionsCacheKey(lastUserId))

      if (!raw) {
        logTiming('bootstrap-cache-miss', startedAt)
        return
      }

      const parsed = JSON.parse(raw) as MySessionsCache
      if (parsed.userId !== lastUserId || !Array.isArray(parsed.sessions) || parsed.sessions.length === 0) {
        logTiming('bootstrap-cache-stale', startedAt, { cacheUserId: parsed.userId, lastUserId })
        return
      }

      mySessionsCacheByUser.set(parsed.userId, parsed)
      setSessions(parsed.sessions)
      setLoading(false)
      logTiming('bootstrap-storage-cache-hit', startedAt, { sessions: parsed.sessions.length })
    } catch (error) {
      console.warn('[MySessions] bootstrap cache hydrate failed:', error)
      logTiming('bootstrap-cache-error', startedAt)
    }
  }, [])

  const hydrateCachedSessions = useCallback(async (nextUserId: string) => {
    const startedAt = Date.now()
    const memoryCache = mySessionsCacheByUser.get(nextUserId) ?? null

    if (memoryCache?.sessions.length) {
      setSessions(memoryCache.sessions)
      setLoading(false)
      logTiming('cache-memory-hit', startedAt, { sessions: memoryCache.sessions.length })
      return true
    }

    try {
      const raw = await AsyncStorage.getItem(getMySessionsCacheKey(nextUserId))
      if (!raw) {
        logTiming('cache-miss', startedAt, { layer: 'storage' })
        return false
      }

      const parsed = JSON.parse(raw) as MySessionsCache
      if (parsed.userId !== nextUserId || !Array.isArray(parsed.sessions) || parsed.sessions.length === 0) {
        logTiming('cache-stale', startedAt, { cacheUserId: parsed.userId, requestedUserId: nextUserId })
        return false
      }

      mySessionsCacheByUser.set(parsed.userId, parsed)
      setSessions(parsed.sessions)
      setLoading(false)
      logTiming('cache-storage-hit', startedAt, { sessions: parsed.sessions.length })
      return true
    } catch (error) {
      console.warn('[MySessions] cache hydrate failed:', error)
      logTiming('cache-error', startedAt)
      return false
    }
  }, [])

  const fetchMySessions = useCallback(
    async (nextUserId: string, options?: { showLoader?: boolean; runMaintenance?: boolean }) => {
      if (fetchInFlightRef.current) {
        logTiming('fetch-deduped', Date.now())
        await fetchInFlightRef.current
        return
      }

      const run = async () => {
        const startedAt = Date.now()
        const showLoader = options?.showLoader ?? false
        const runMaintenance = options?.runMaintenance ?? false

        if (showLoader) {
          setLoading(true)
        }

        if (runMaintenance) {
          const maintenanceStartedAt = Date.now()
          await Promise.all([
            supabase.rpc('process_pending_session_completions'),
            supabase.rpc('process_overdue_session_closures'),
          ])
          logTiming('maintenance-rpc', maintenanceStartedAt)
        }

        const rpcStartedAt = Date.now()
        const { data, error } = await supabase.rpc('get_my_sessions_overview')
        logTiming('overview-rpc', rpcStartedAt, { rows: data?.length ?? 0, hasError: Boolean(error) })

        if (error) {
          console.warn('[MySessions] get_my_sessions_overview failed:', error.message)
        }

        const nextSessions: MySession[] = (data ?? []).map((session: any) => ({
          id: session.id,
          status: session.status,
          court_booking_status: session.court_booking_status,
          role: session.role,
          request_status: session.request_status,
          start_time: session.start_time,
          end_time: session.end_time,
          court_name: session.court_name ?? 'Kèo Pickleball',
          court_city: session.court_city ?? '',
          court_address: session.court_address ?? '',
          host_name: session.host_name ?? (session.role === 'host' ? 'Bạn' : 'Ẩn danh'),
          player_count: session.player_count ?? 0,
          max_players: session.max_players ?? 0,
        }))

        nextSessions.sort((a, b) => {
          const aTime = new Date(a.start_time).getTime()
          const bTime = new Date(b.start_time).getTime()
          const safeATime = Number.isNaN(aTime) ? Number.MAX_SAFE_INTEGER : aTime
          const safeBTime = Number.isNaN(bTime) ? Number.MAX_SAFE_INTEGER : bTime
          return safeATime - safeBTime
        })

        const nextCache = {
          userId: nextUserId,
          sessions: nextSessions,
          updatedAt: Date.now(),
        }
        mySessionsCacheByUser.set(nextUserId, nextCache)

        try {
          const persistStartedAt = Date.now()
          await Promise.all([
            AsyncStorage.setItem(getMySessionsCacheKey(nextUserId), JSON.stringify(nextCache)),
            AsyncStorage.setItem(MY_SESSIONS_LAST_USER_KEY, nextUserId),
          ])
          logTiming('cache-persist', persistStartedAt)
        } catch (error) {
          console.warn('[MySessions] cache persist failed:', error)
        }

        const nextFingerprint = sessionsFingerprint(nextSessions)
        const currentFingerprint = sessionsFingerprint(sessionsRef.current)

        if (nextFingerprint !== currentFingerprint) {
          setSessions(nextSessions)
          logTiming('sessions-updated', startedAt, { changed: true, sessions: nextSessions.length })
        } else {
          logTiming('sessions-skipped-update', startedAt, { changed: false, sessions: nextSessions.length })
        }

        if (showLoader) {
          setLoading(false)
        }

        logTiming('fetch-total', startedAt, { sessions: nextSessions.length, runMaintenance, showLoader })
      }

      fetchInFlightRef.current = run()
      try {
        await fetchInFlightRef.current
      } finally {
        fetchInFlightRef.current = null
      }
    },
    [],
  )

  const init = useCallback(async () => {
    if (initInFlightRef.current) {
      logTiming('init-deduped', Date.now())
      return
    }

    initInFlightRef.current = true
    try {
      const initStartedAt = Date.now()
      if (isAuthLoading) {
        logTiming('auth-context-loading', initStartedAt)
        return
      }

      if (!userId) {
        setMyId(null)
        setSessions([])
        setLoading(false)
        logTiming('init-no-user', initStartedAt)
        return
      }

      setMyId(userId)

      const bootstrapCache = mySessionsCacheByUser.get(userId) ?? null
      const hadBootstrapCache = Boolean(bootstrapCache?.sessions.length)
      if (hadBootstrapCache) {
        const cacheAgeMs = Date.now() - (bootstrapCache?.updatedAt ?? 0)
        if (cacheAgeMs < MY_SESSIONS_CACHE_FRESH_MS) {
          logTiming('init-cache-fresh-skip-network', initStartedAt, { cacheAgeMs })
          return
        }

        void fetchMySessions(userId, { showLoader: false, runMaintenance: false })
        logTiming('init-skip-second-cache-hydrate', initStartedAt)
        return
      }

      const hydrated = await hydrateCachedSessions(userId)
      if (hydrated) {
        void fetchMySessions(userId, { showLoader: false, runMaintenance: false })
        logTiming('init-from-cache', initStartedAt)
        return
      }

      await fetchMySessions(userId, { showLoader: true, runMaintenance: false })
      setLoading(false)
      logTiming('init-network', initStartedAt)
    } finally {
      initInFlightRef.current = false
    }
  }, [fetchMySessions, hydrateCachedSessions, isAuthLoading, userId])

  useEffect(() => {
    void hydrateCachedSessionsForLastUser()
  }, [hydrateCachedSessionsForLastUser])

  useEffect(() => {
    void init()
  }, [init])

  const onRefresh = useCallback(async () => {
    if (!myId) return
    setRefreshing(true)
    await fetchMySessions(myId, { showLoader: false, runMaintenance: true })
    setRefreshing(false)
  }, [fetchMySessions, myId])

  function formatDatePart(value: string) {
    if (!isValidDate(value)) {
      return 'Chưa cập nhật ngày'
    }

    return new Date(value).toLocaleDateString('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  function formatTimeRange(start: string, end: string) {
    if (!isValidDate(start) || !isValidDate(end)) {
      return 'Chưa cập nhật giờ'
    }

    const startDate = new Date(start)
    const endDate = new Date(end)

    return `${startDate.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    })} - ${endDate.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    })}`
  }

  function resolveTab(session: MySession): SessionTab {
    if (session.status === 'pending_completion' || session.status === 'done' || session.status === 'cancelled') {
      return 'history'
    }

    if (session.request_status === 'pending') {
      return 'pending'
    }

    return 'upcoming'
  }

  function shareMessage(session?: MySession) {
    if (!session) {
      return 'Lịch chơi PickleMatch của tôi đang được cập nhật.'
    }

    return [
      'Cùng xem kèo pickleball này nhé:',
      session.court_name,
      `${formatDatePart(session.start_time)} • ${formatTimeRange(session.start_time, session.end_time)}`,
      session.court_address ? `${session.court_address}${session.court_city ? `, ${session.court_city}` : ''}` : '',
    ]
      .filter(Boolean)
      .join('\n')
  }

  async function handleShare(session?: MySession) {
    try {
      await Share.share({ message: shareMessage(session) })
    } catch (error) {
      console.warn('[MySessions] share failed:', error)
    }
  }

  function openSessionDetail(sessionId: string) {
    router.push({ pathname: '/session/[id]' as any, params: { id: sessionId } })
  }

  function openRateSession(sessionId: string) {
    router.push({ pathname: '/rate-session/[id]' as any, params: { id: sessionId } })
  }

  const sessionsByTab = useMemo(
    () =>
      TAB_OPTIONS.reduce<Record<SessionTab, MySession[]>>(
        (acc, tab) => {
          acc[tab.key] = sessions
            .filter((session) => resolveTab(session) === tab.key)
            .sort((a, b) => {
              const aTime = new Date(a.start_time).getTime()
              const bTime = new Date(b.start_time).getTime()
              const safeATime = Number.isNaN(aTime) ? (tab.key === 'history' ? 0 : Number.MAX_SAFE_INTEGER) : aTime
              const safeBTime = Number.isNaN(bTime) ? (tab.key === 'history' ? 0 : Number.MAX_SAFE_INTEGER) : bTime

              if (tab.key === 'history') {
                return safeBTime - safeATime
              }

              const bookingWeight =
                Number(b.court_booking_status === 'confirmed') - Number(a.court_booking_status === 'confirmed')

              if (bookingWeight !== 0) {
                return bookingWeight
              }

              return safeATime - safeBTime
            })

          return acc
        },
        { upcoming: [], pending: [], history: [] },
      ),
    [sessions],
  )

  function handleTabPress(tab: SessionTab) {
    setActiveTab(tab)
    const index = TAB_OPTIONS.findIndex((option) => option.key === tab)
    pagerRef.current?.scrollTo({ x: index * width, animated: true })
  }

  function handlePagerMomentumEnd(offsetX: number) {
    const index = Math.round(offsetX / width)
    const nextTab = TAB_OPTIONS[index]?.key
    if (nextTab && nextTab !== activeTab) {
      setActiveTab(nextTab)
    }
  }

  const indicatorWidth = segmentWidth > 0 ? segmentWidth / TAB_OPTIONS.length : 0
  const indicatorTranslateX =
    indicatorWidth > 0
      ? scrollX.interpolate({
          inputRange: TAB_OPTIONS.map((_, index) => index * width),
          outputRange: TAB_OPTIONS.map((_, index) => index * indicatorWidth),
          extrapolate: 'clamp',
        })
      : 0

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.background }} edges={['top']}>
      {loading ? (
        <View className="flex-1 items-center justify-center px-6">
          <ActivityIndicator size="large" color={theme.info} />
          <Text className="mt-4 text-[14px] font-semibold" style={{ color: theme.textMuted }}>Đang tải kèo của bạn...</Text>
        </View>
      ) : (
        <ScrollView
          scrollEnabled={!isPagerDragging}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 36 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.info} />}
        >
          <View className="flex-row items-start justify-between">
            <View className="mr-4 flex-1">
              <View className="flex-row items-center">
                <Calendar size={14} color={theme.textMuted} strokeWidth={2.5} />
                <Text className="ml-2 text-[10px] font-black uppercase tracking-[0.15em]" style={{ color: theme.textMuted }}>
                  LỊCH CHƠI CỦA BẠN
                </Text>
              </View>
              <Text className="mt-3 text-[32px] font-black leading-[36px]" style={{ color: theme.text }}>Kèo của tôi</Text>
            </View>

            <Pressable
              onPress={() => void handleShare()}
              className="h-12 w-12 items-center justify-center rounded-2xl border"
              style={{ borderColor: theme.border, backgroundColor: theme.surface, ...getShadowStyle(theme) }}
            >
              <Share2 size={18} color={theme.text} strokeWidth={2.3} />
            </Pressable>
          </View>

          <View
            className="mt-6 rounded-[24px] p-1.5"
            style={{ backgroundColor: theme.surfaceAlt }}
            onLayout={(event) => setSegmentWidth(event.nativeEvent.layout.width - 12)}
          >
            <View className="relative flex-row">
              {indicatorWidth > 0 ? (
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.segmentIndicator,
                    {
                      width: indicatorWidth,
                      transform: [{ translateX: indicatorTranslateX }],
                    },
                  ]}
                />
              ) : null}
              {TAB_OPTIONS.map((tab) => {
                const index = TAB_OPTIONS.findIndex((option) => option.key === tab.key)
                const animatedLabelColor =
                  indicatorWidth > 0
                    ? scrollX.interpolate({
                        inputRange: TAB_OPTIONS.map((_, tabIndex) => tabIndex * width),
                        outputRange: TAB_OPTIONS.map((_, tabIndex) =>
                          tabIndex === index ? '#020617' : '#64748b',
                        ),
                        extrapolate: 'clamp',
                      })
                    : '#64748b'

                return (
                  <Pressable
                    key={tab.key}
                    onPress={() => handleTabPress(tab.key)}
                    style={styles.segmentButton}
                  >
                    <Animated.Text style={[styles.segmentLabel, { color: animatedLabelColor }]}>
                      {tab.label}
                    </Animated.Text>
                  </Pressable>
                )
              })}
            </View>
          </View>

          <Animated.ScrollView
            ref={pagerRef}
            horizontal
            pagingEnabled
            snapToInterval={width}
            decelerationRate="fast"
            showsHorizontalScrollIndicator={false}
            nestedScrollEnabled
            scrollEventThrottle={16}
            directionalLockEnabled
            onScrollBeginDrag={() => setIsPagerDragging(true)}
            onScrollEndDrag={() => setIsPagerDragging(false)}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false },
            )}
            onMomentumScrollEnd={(event) => {
              setIsPagerDragging(false)
              handlePagerMomentumEnd(event.nativeEvent.contentOffset.x)
            }}
            contentContainerStyle={{ paddingTop: 24 }}
            style={{ marginHorizontal: -20 }}
          >
            {TAB_OPTIONS.map((tab) => (
              <View key={tab.key} style={{ width, paddingHorizontal: 20 }}>
                {sessionsByTab[tab.key].length === 0 ? (
                  <MySessionsEmptyStateCard activeTab={tab.key} theme={theme} />
                ) : (
                  sessionsByTab[tab.key].map((session) => (
                    <MySessionCard
                      key={`${tab.key}-${session.id}`}
                      item={session}
                      tab={tab.key}
                      theme={theme}
                      onOpenSessionDetail={openSessionDetail}
                      onOpenRateSession={openRateSession}
                      onShare={handleShare}
                      formatDatePart={formatDatePart}
                      formatTimeRange={formatTimeRange}
                    />
                  ))
                )}
              </View>
            ))}
          </Animated.ScrollView>
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  segmentButton: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  segmentIndicator: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  segmentLabel: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '900',
  },
})
