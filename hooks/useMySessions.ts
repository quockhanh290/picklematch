import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Share } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useFocusEffect } from '@react-navigation/native'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/useAuth'
import { resolveTab } from '@/lib/mySessionsLogic'
import type { MySession, SessionTab } from '@/components/sessions/MySessionCard'

export type HistoryStatusFilter = 'all' | 'done' | 'pending_completion' | 'cancelled'
export type HistoryRoleFilter = 'all' | 'host' | 'player'
export type HistoryTimeFilter = 'all' | '7d' | '30d' | '90d'
export type HistoryRatingFilter = 'all' | 'rated' | 'not_rated'
export type HistoryResultFilter = 'all' | 'submitted' | 'not_submitted'

type MySessionsCache = {
  userId: string
  sessions: MySession[]
  updatedAt: number
}

const mySessionsCacheByUser = new Map<string, MySessionsCache>()
const MY_SESSIONS_LAST_USER_KEY = 'my_sessions_last_user_id_v1'

function getMySessionsCacheKey(userId: string) {
  return `my_sessions_overview_cache_v1:${userId}`
}

export const HISTORY_PAGE_SIZE = 20

function sessionsFingerprint(items: MySession[]) {
  return JSON.stringify(
    items.map((item) => ({
      id: item.id,
      status: item.status,
      court_booking_status: item.court_booking_status,
      host_id: item.host_id,
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
      elo_min: item.elo_min,
      elo_max: item.elo_max,
      has_rated: item.has_rated,
      results_status: item.results_status ?? null,
    })),
  )
}

function isSessionInPast(session: Pick<MySession, 'start_time' | 'end_time'>, nowMs = Date.now()) {
  const endAt = new Date(session.end_time).getTime()
  if (!Number.isNaN(endAt)) return endAt < nowMs

  const startAt = new Date(session.start_time).getTime()
  if (!Number.isNaN(startAt)) return startAt < nowMs

  return false
}

export function useMySessions() {
  const { userId, isLoading: isAuthLoading } = useAuth()
  const [sessions, setSessions] = useState<MySession[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<SessionTab>('upcoming')
  
  const [historyStatusFilter, setHistoryStatusFilter] = useState<HistoryStatusFilter>('all')
  const [historyRoleFilter, setHistoryRoleFilter] = useState<HistoryRoleFilter>('all')
  const [historyTimeFilter, setHistoryTimeFilter] = useState<HistoryTimeFilter>('all')
  const [historyRatingFilter, setHistoryRatingFilter] = useState<HistoryRatingFilter>('all')
  const [historyResultFilter, setHistoryResultFilter] = useState<HistoryResultFilter>('all')
  
  const [historyVisibleCount, setHistoryVisibleCount] = useState(HISTORY_PAGE_SIZE)
  const [historyExpandedMonths, setHistoryExpandedMonths] = useState<Record<string, boolean>>({})
  
  const initInFlightRef = useRef(false)
  const fetchInFlightRef = useRef<Promise<void> | null>(null)
  const sessionsRef = useRef<MySession[]>([])

  useEffect(() => {
    sessionsRef.current = sessions
  }, [sessions])

  const hydrateCachedSessions = useCallback(async (nextUserId: string) => {
    const memoryCache = mySessionsCacheByUser.get(nextUserId) ?? null
    if (memoryCache?.sessions.length) {
      setSessions(memoryCache.sessions)
      setLoading(false)
      return true
    }

    try {
      const raw = await AsyncStorage.getItem(getMySessionsCacheKey(nextUserId))
      if (!raw) return false
      const parsed = JSON.parse(raw) as MySessionsCache
      if (parsed.userId !== nextUserId || !Array.isArray(parsed.sessions) || parsed.sessions.length === 0) return false
      mySessionsCacheByUser.set(parsed.userId, parsed)
      setSessions(parsed.sessions)
      setLoading(false)
      return true
    } catch (error) {
      console.warn('[MySessions] cache hydrate failed:', error)
      return false
    }
  }, [])

  const fetchMySessions = useCallback(
    async (nextUserId: string, options?: { showLoader?: boolean }) => {
      if (fetchInFlightRef.current) {
        await fetchInFlightRef.current
        return
      }

      const run = async () => {
        const showLoader = options?.showLoader ?? false

        if (showLoader) setLoading(true)

        const { data, error } = await supabase.rpc('get_my_sessions_overview')
        if (error) {
          console.warn('[MySessions] get_my_sessions_overview failed:', error.message)
        }

        let rpcSessions: MySession[] = (data ?? []).map((session: any) => ({
          id: session.id,
          status: session.status,
          court_booking_status: session.court_booking_status,
          host_id: session.host_id ?? null,
          role: session.role,
          request_status: session.request_status,
          results_status: session.results_status ?? null,
          start_time: session.start_time,
          end_time: session.end_time,
          court_name: session.court_name ?? 'Kèo Pickleball',
          court_city: session.court_city ?? '',
          court_address: session.court_address ?? '',
          host_name: session.host_name ?? (session.role === 'host' ? 'Bạn' : 'Ẩn danh'),
          player_count: session.player_count ?? 0,
          max_players: session.max_players ?? 0,
          elo_min: session.elo_min ?? null,
          elo_max: session.elo_max ?? null,
          has_rated: session.has_rated ?? false,
          is_ranked: session.is_ranked ?? true,
        }))

        const rpcSessionIds = Array.from(new Set(rpcSessions.map((session) => session.id).filter(Boolean)))
        if (rpcSessionIds.length > 0) {
          const { data: sessionMetaRows } = await supabase
            .from('sessions')
            .select('id, host_id, results_status, is_ranked')
            .in('id', rpcSessionIds)

          const hostIdBySessionId = new Map<string, string>(
            (sessionMetaRows ?? [])
              .filter((row: any) => row?.id && row?.host_id)
              .map((row: any) => [row.id as string, row.host_id as string]),
          )
          const resultsStatusBySessionId = new Map<string, MySession['results_status']>(
            (sessionMetaRows ?? [])
              .filter((row: any) => row?.id)
              .map((row: any) => [row.id as string, (row.results_status as MySession['results_status']) ?? null]),
          )
          const isRankedBySessionId = new Map<string, boolean>(
            (sessionMetaRows ?? [])
              .filter((row: any) => row?.id)
              .map((row: any) => [row.id as string, row.is_ranked ?? true]),
          )

          const { data: userResultsRows } = await supabase
            .from('session_players')
            .select('session_id, proposed_result')
            .eq('player_id', nextUserId)
            .in('session_id', rpcSessionIds)

          const userResultBySessionId = new Map<string, MySession['user_result']>(
            (userResultsRows ?? [])
              .filter((row: any) => row?.session_id)
              .map((row: any) => [row.session_id as string, (row.proposed_result as MySession['user_result']) ?? null]),
          )

          const { data: myRatingsRows } = await supabase
            .from('ratings')
            .select('session_id')
            .eq('rater_id', nextUserId)
            .in('session_id', rpcSessionIds)

          const ratedSessionIds = new Set<string>(
            (myRatingsRows ?? [])
              .map((row: any) => row?.session_id as string | null)
              .filter((sessionId: string | null): sessionId is string => Boolean(sessionId)),
          )

          rpcSessions = rpcSessions.map((session) => ({
            ...session,
            host_id:
              session.host_id ??
              (session.role === 'host' ? nextUserId : null) ??
              hostIdBySessionId.get(session.id) ??
              null,
            results_status: session.results_status ?? resultsStatusBySessionId.get(session.id) ?? null,
            user_result: userResultBySessionId.get(session.id) ?? null,
            has_rated: session.has_rated || ratedSessionIds.has(session.id),
            is_ranked: isRankedBySessionId.get(session.id) ?? true,
          }))
        }

        const { data: hostPendingRows } = await supabase
          .from('join_requests')
          .select('match_id, sessions!inner(host_id)')
          .eq('status', 'pending')
          .eq('sessions.host_id', nextUserId)

        const { data: playerPendingRows } = await supabase
          .from('join_requests')
          .select('match_id')
          .eq('status', 'pending')
          .eq('player_id', nextUserId)

        const hostPendingIds = new Set<string>((hostPendingRows ?? []).map((row: any) => row.match_id).filter(Boolean))
        const playerPendingIds = new Set<string>((playerPendingRows ?? []).map((row: any) => row.match_id).filter(Boolean))

        const byKey = new Map<string, MySession>()
        for (const session of rpcSessions) {
          const normalizedRequestStatus =
            session.role === 'host' && hostPendingIds.has(session.id)
              ? 'pending'
              : session.role === 'player' && playerPendingIds.has(session.id)
                ? 'pending'
                : session.request_status

          const normalized: MySession = {
            ...session,
            request_status: normalizedRequestStatus,
          }

          const key = `${normalized.role}:${normalized.id}`
          const current = byKey.get(key)
          if (!current) {
            byKey.set(key, normalized)
            continue
          }

          const shouldReplace = current.request_status !== 'pending' && normalized.request_status === 'pending'
          if (shouldReplace) {
            byKey.set(key, normalized)
          }
        }

        const existingPlayerPendingIds = new Set(
          Array.from(byKey.values())
            .filter((session) => session.role === 'player' && session.request_status === 'pending')
            .map((session) => session.id),
        )

        const missingPlayerPendingIds = Array.from(playerPendingIds).filter((id) => !existingPlayerPendingIds.has(id))

        if (missingPlayerPendingIds.length > 0) {
          const { data: missingPendingSessions } = await supabase
            .from('sessions')
            .select(`
              id,
              status,
              results_status,
              host_id,
              is_ranked,
              court_booking_status,
              max_players,
              elo_min,
              elo_max,
              host:host_id(id, name),
              slot:slot_id(
                start_time,
                end_time,
                court:court_id(name, city, address)
              ),
              session_players(status)
            `)
            .in('id', missingPlayerPendingIds)

          for (const rawSession of missingPendingSessions ?? []) {
            const session: any = rawSession
            const slot = session?.slot
            const court = slot?.court
            const host = session?.host
            const players = Array.isArray(session?.session_players) ? session.session_players : []
            const playerCount = players.filter((p: any) => (p?.status ?? 'confirmed') !== 'rejected').length

            const normalized: MySession = {
              id: session.id,
              status: session.status ?? 'open',
              court_booking_status: session.court_booking_status ?? 'unconfirmed',
              host_id: session.host_id ?? host?.id ?? null,
              role: 'player',
              request_status: 'pending',
              results_status: session.results_status ?? null,
              start_time: slot?.start_time ?? new Date().toISOString(),
              end_time: slot?.end_time ?? slot?.start_time ?? new Date().toISOString(),
              court_name: court?.name ?? 'Kèo Pickleball',
              court_city: court?.city ?? '',
              court_address: court?.address ?? '',
              host_name: host?.name ?? 'Ẩn danh',
              player_count: playerCount,
              max_players: session.max_players ?? 0,
              elo_min: session.elo_min ?? null,
              elo_max: session.elo_max ?? null,
              has_rated: false,
              is_ranked: session.is_ranked ?? true,
            }

            byKey.set(`player:${normalized.id}`, normalized)
          }
        }

        const nextSessions: MySession[] = Array.from(byKey.values())

        nextSessions.sort((a, b) => {
          const aTime = new Date(a.start_time).getTime()
          const bTime = new Date(b.start_time).getTime()
          const safeATime = Number.isNaN(aTime) ? Number.MAX_SAFE_INTEGER : aTime
          const safeBTime = Number.isNaN(bTime) ? Number.MAX_SAFE_INTEGER : bTime
          return safeATime - safeBTime
        })

        const nextCache = { userId: nextUserId, sessions: nextSessions, updatedAt: Date.now() }
        mySessionsCacheByUser.set(nextUserId, nextCache)

        try {
          await Promise.all([
            AsyncStorage.setItem(getMySessionsCacheKey(nextUserId), JSON.stringify(nextCache)),
            AsyncStorage.setItem(MY_SESSIONS_LAST_USER_KEY, nextUserId),
          ])
        } catch (error) {
          console.warn('[MySessions] cache persist failed:', error)
        }

        const nextFingerprint = sessionsFingerprint(nextSessions)
        const currentFingerprint = sessionsFingerprint(sessionsRef.current)
        if (nextFingerprint !== currentFingerprint) {
          setSessions(nextSessions)
        }

        if (showLoader) setLoading(false)
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
    if (initInFlightRef.current) return
    initInFlightRef.current = true

    try {
      if (isAuthLoading) return

      if (!userId) {
        setSessions([])
        setLoading(false)
        return
      }

      const hydrated = await hydrateCachedSessions(userId)
      if (hydrated) {
        void fetchMySessions(userId, { showLoader: false })
        return
      }

      await fetchMySessions(userId, { showLoader: true })
    } finally {
      initInFlightRef.current = false
    }
  }, [fetchMySessions, hydrateCachedSessions, isAuthLoading, userId])

  useEffect(() => {
    void init()
  }, [init])

  useFocusEffect(
    useCallback(() => {
      if (!userId) return
      void fetchMySessions(userId, { showLoader: false })
    }, [fetchMySessions, userId]),
  )

  const onRefresh = useCallback(async () => {
    if (!userId) return
    setRefreshing(true)
    try {
      await fetchMySessions(userId, { showLoader: false })
    } finally {
      setRefreshing(false)
    }
  }, [fetchMySessions, userId])

  const sessionsByTab = useMemo(
    () =>
      ({
        upcoming: sessions
          .filter((s) => resolveTab(s) === 'upcoming' && !isSessionInPast(s))
          .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()),
        pending: sessions
          .filter((s) => resolveTab(s) === 'pending'),
        history: sessions
          .filter((s) => resolveTab(s) === 'history' || (resolveTab(s) === 'upcoming' && isSessionInPast(s)))
          .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()), // Reverse chronological for history
      }),
    [sessions],
  )

  const filteredHistorySessions = useMemo(() => {
    const now = Date.now()
    return sessionsByTab.history.filter((session) => {
      if (historyStatusFilter !== 'all' && session.status !== historyStatusFilter) return false
      if (historyRoleFilter !== 'all' && session.role !== historyRoleFilter) return false
      if (historyRatingFilter === 'rated' && !session.has_rated) return false
      if (historyRatingFilter === 'not_rated' && session.has_rated) return false

      const hasSubmittedResult =
        session.results_status !== null &&
        session.results_status !== undefined &&
        session.results_status !== 'not_submitted'
      if (historyResultFilter === 'submitted' && !hasSubmittedResult) return false
      if (historyResultFilter === 'not_submitted' && hasSubmittedResult) return false

      if (historyTimeFilter !== 'all') {
        const startAt = new Date(session.start_time).getTime()
        if (Number.isNaN(startAt)) return false
        const ageDays = (now - startAt) / (1000 * 60 * 60 * 24)
        if (historyTimeFilter === '7d' && ageDays > 7) return false
        if (historyTimeFilter === '30d' && ageDays > 30) return false
        if (historyTimeFilter === '90d' && ageDays > 90) return false
      }
      return true
    })
  }, [historyRatingFilter, historyResultFilter, historyRoleFilter, sessionsByTab.history, historyStatusFilter, historyTimeFilter])

  return {
    userId,
    loading,
    refreshing,
    onRefresh,
    activeTab,
    setActiveTab,
    sessionsByTab,
    filteredHistorySessions,
    historyStatusFilter,
    setHistoryStatusFilter,
    historyRoleFilter,
    setHistoryRoleFilter,
    historyTimeFilter,
    setHistoryTimeFilter,
    historyRatingFilter,
    setHistoryRatingFilter,
    historyResultFilter,
    setHistoryResultFilter,
    historyVisibleCount,
    setHistoryVisibleCount,
    historyExpandedMonths,
    setHistoryExpandedMonths,
  }
}
