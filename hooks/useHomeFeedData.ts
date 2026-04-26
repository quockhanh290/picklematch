import { useFocusEffect } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'

import {
    buildLiveFamiliarCourts,
    formatPendingResultTimeLabel,
    isWithinNext24Hours,
    mapLiveSessionToMatchSession,
    normalizeHomeSessionRecord,
    normalizeRelation,
    type FamiliarCourt,
    type HomeProfile,
    type HomeSessionRecordRaw,
    type MatchSession,
    type MySessionOverviewRow,
    type PendingMatch,
    type PendingMatchRaw,
    type PlayerStatsRecord,
    type PostMatchAction,
} from '@/lib/homeFeed'
import { supabase } from '@/lib/supabase'

export function useHomeFeedData(userId?: string | null, isAuthLoading?: boolean) {
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<HomeProfile | null>(null)
  const [playerStats, setPlayerStats] = useState<PlayerStatsRecord | null>(null)
  const [nextMatch, setNextMatch] = useState<MatchSession | null>(null)
  const [pendingMatches, setPendingMatches] = useState<PendingMatch[]>([])
  const [postMatchActions, setPostMatchActions] = useState<PostMatchAction[]>([])
  const [personalizedSessions, setPersonalizedSessions] = useState<MatchSession[]>([])
  const [rescueSessions, setRescueSessions] = useState<MatchSession[]>([])
  const [familiarCourts, setFamiliarCourts] = useState<FamiliarCourt[]>([])

  const fetchHomeData = useCallback(async () => {
    if (isAuthLoading) return

    setLoading(true)

    try {
      await Promise.all([
        supabase.rpc('process_fill_deadline_session_closures'),
        supabase.rpc('process_pending_session_completions'),
        supabase.rpc('process_overdue_session_closures'),
      ])

      const openSessionsPromise = supabase
        .from('sessions')
        .select(
          `
          id, host_id, is_ranked, elo_min, elo_max, max_players, status, court_booking_status, created_at,
          host:host_id ( id, name, current_elo, elo, self_assessed_level, skill_label, reliability_score, host_reputation ),
          slot:slot_id (
            id, start_time, end_time, price,
            court:court_id ( id, name, address, city )
          ),
          session_players (
            player_id, status,
            player:player_id ( id, name, reliability_score, current_elo, self_assessed_level, skill_label )
          )
        `,
        )
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(30)

      const profilePromise = userId
        ? supabase
            .from('players')
            .select('id, name, current_elo, elo, reliability_score, host_reputation, favorite_court_ids')
            .eq('id', userId)
            .maybeSingle()
        : Promise.resolve({ data: null })

      const playerStatsPromise = userId
        ? supabase
            .from('player_stats')
            .select('current_win_streak, host_average_rating')
            .eq('player_id', userId)
            .maybeSingle()
        : Promise.resolve({ data: null })

      const pendingMatchesPromise = userId
        ? supabase
            .from('sessions')
            .select(
              `
              id, status, results_status,
              slot:slot_id (
                start_time, end_time,
                court:court_id ( name )
              )
            `,
            )
            .eq('host_id', userId)
            .eq('results_status', 'not_submitted')
            .in('status', ['pending_completion', 'done'])
            .order('created_at', { ascending: false })
            .limit(8)
        : Promise.resolve({ data: [] })

      const playerPostMatchActionsPromise = userId
        ? supabase
            .from('session_players')
            .select(
              `
              player_id, status,
              session:session_id (
                id, status, results_status, host_id,
                slot:slot_id (
                  start_time, end_time,
                  court:court_id ( name )
                )
              )
            `,
            )
            .eq('player_id', userId)
            .eq('status', 'confirmed')
            .order('session_id', { ascending: false })
            .limit(10)
        : Promise.resolve({ data: [] })

      const overviewPromise = userId ? supabase.rpc('get_my_sessions_overview') : Promise.resolve({ data: [] })

      const [openSessionsResult, profileResult, playerStatsResult, pendingMatchesResult, playerPostMatchActionsResult, overviewResult] = await Promise.all([
        openSessionsPromise,
        profilePromise,
        playerStatsPromise,
        pendingMatchesPromise,
        playerPostMatchActionsPromise,
        overviewPromise,
      ])

      const openSessions = ((openSessionsResult.data ?? []) as unknown as HomeSessionRecordRaw[]).map(normalizeHomeSessionRecord)
      const nextProfile = (profileResult.data ?? null) as HomeProfile | null
      const nextPlayerStats = (playerStatsResult.data ?? null) as PlayerStatsRecord | null
      const favoriteCourtIds = nextProfile?.favorite_court_ids?.filter(Boolean) ?? []
      const pendingRows = (pendingMatchesResult.data ?? []) as PendingMatchRaw[]
      const postMatchRows = (playerPostMatchActionsResult.data ?? []) as Array<{
        player_id: string
        status?: string | null
        session?: {
          id: string
          status: string
          results_status?: 'not_submitted' | 'pending_confirmation' | 'disputed' | 'finalized' | 'void' | null
          host_id: string
          slot?: {
            start_time?: string | null
            end_time?: string | null
            court?: { name?: string | null } | { name?: string | null }[] | null
          } | { start_time?: string | null; end_time?: string | null; court?: { name?: string | null } | { name?: string | null }[] | null }[] | null
        } | {
          id: string
          status: string
          results_status?: 'not_submitted' | 'pending_confirmation' | 'disputed' | 'finalized' | 'void' | null
          host_id: string
          slot?: {
            start_time?: string | null
            end_time?: string | null
            court?: { name?: string | null } | { name?: string | null }[] | null
          } | null
        }[] | null
      }>
      const overviewRows = (overviewResult.data ?? []) as MySessionOverviewRow[]
      const viewerElo = nextProfile?.current_elo ?? nextProfile?.elo ?? null

      let favoriteCourtsMeta: Array<{ id: string; name?: string | null; address?: string | null; city?: string | null }> = []
      if (favoriteCourtIds.length > 0) {
        const { data: favoriteCourtsData } = await supabase
          .from('courts')
          .select('id, name, address, city')
          .in('id', favoriteCourtIds)

        favoriteCourtsMeta = (favoriteCourtsData ?? []) as Array<{ id: string; name?: string | null; address?: string | null; city?: string | null }>
      }

      const sortedOpenSessions = [...openSessions].sort(
        (left, right) => Date.parse(left.slot?.start_time ?? '') - Date.parse(right.slot?.start_time ?? ''),
      )

      const upcomingOverview = overviewRows
        .filter((item) => item.status === 'open' && isWithinNext24Hours(item.start_time))
        .sort((left, right) => Date.parse(left.start_time) - Date.parse(right.start_time))[0]

      const liveNextSession =
        sortedOpenSessions.find((session) => session.id === upcomingOverview?.id) ??
        sortedOpenSessions.find(
          (session) =>
            isWithinNext24Hours(session.slot?.start_time ?? '') &&
            (session.host_id === userId || session.session_players.some((player) => player.player_id === userId)),
        ) ??
        null

      const nextPendingMatches = pendingRows
        .map((item) => {
          const slot = normalizeRelation(item.slot)
          const court = normalizeRelation(slot?.court ?? null)
          const startTime = slot?.start_time ?? ''
          const endTime = slot?.end_time ?? ''

          return {
            id: item.id,
            courtName: court?.name ?? 'Kèo Pickleball',
            timeLabel: formatPendingResultTimeLabel(endTime),
            startTime,
            endTime,
          }
        })
        .filter((item) => {
          const endMs = Date.parse(item.endTime)
          return !Number.isNaN(endMs) && endMs < Date.now()
        })
        .sort((left, right) => Date.parse(right.endTime) - Date.parse(left.endTime))

      const nextPostMatchActions = postMatchRows
        .reduce<PostMatchAction[]>((acc, row) => {
          const session = normalizeRelation(row.session ?? null)
          const slot = normalizeRelation(session?.slot ?? null)
          const court = normalizeRelation(slot?.court ?? null)
          const startTime = slot?.start_time ?? ''
          const endTime = slot?.end_time ?? ''
          const endMs = Date.parse(endTime)

          if (!session || session.host_id === userId) return acc
          if (!slot || Number.isNaN(endMs) || endMs > Date.now()) return acc

          if (session.results_status === 'pending_confirmation' || session.results_status === 'disputed') {
            acc.push({
              id: session.id,
              courtName: court?.name ?? 'K??o Pickleball',
              timeLabel: formatPendingResultTimeLabel(endTime),
              startTime,
              endTime,
              actionType: 'confirm' as const,
              resultsStatus: session.results_status,
            })
            return acc
          }

          if (session.results_status === 'not_submitted' && (session.status === 'pending_completion' || session.status === 'done')) {
            acc.push({
              id: session.id,
              courtName: court?.name ?? 'K??o Pickleball',
              timeLabel: formatPendingResultTimeLabel(endTime),
              startTime,
              endTime,
              actionType: 'report' as const,
              resultsStatus: 'not_submitted' as const,
            })
            return acc
          }

          return acc
        }, [])
        .slice(0, 4)

      setProfile(nextProfile)
      setPlayerStats(nextPlayerStats)
      setPendingMatches(nextPendingMatches)
      setPostMatchActions(nextPostMatchActions)
      setNextMatch(
        liveNextSession
          ? mapLiveSessionToMatchSession(liveNextSession, {
              viewerId: userId,
              viewerElo,
              hostAverageRating: nextPlayerStats?.host_average_rating,
            })
          : null,
      )
      const nextPersonalizedSessions = sortedOpenSessions
          .filter((session) => session.id !== liveNextSession?.id)
          .map((session) => mapLiveSessionToMatchSession(session, { viewerId: userId, viewerElo }))
          .sort((left, right) => right.matchScore - left.matchScore)
          .slice(0, 5)
          .map((session, index, sessions) => ({
            ...session,
            carouselIndex: index,
            carouselTotal: sessions.length,
          }))

      setPersonalizedSessions(nextPersonalizedSessions)
      setRescueSessions(
        sortedOpenSessions
          .filter((session) => {
            const activePlayers = session.session_players.filter((player) => player.status !== 'rejected').length
            const slotsLeft = Math.max(session.max_players - activePlayers, 0)
            return slotsLeft > 0 && slotsLeft <= 2 && isWithinNext24Hours(session.slot?.start_time ?? '')
          })
          .map((session) => mapLiveSessionToMatchSession(session, { viewerId: userId, viewerElo, urgent: true }))
          .sort((left, right) => right.matchScore - left.matchScore)
          .slice(0, 5),
      )
      setFamiliarCourts(
        buildLiveFamiliarCourts(sortedOpenSessions, {
          favoriteCourtIds,
          favoriteCourtsMeta,
        }),
      )
    } catch (error) {
      console.warn('[HomeScreen] fetchHomeData failed:', error)
      setProfile(null)
      setPlayerStats(null)
      setNextMatch(null)
      setPendingMatches([])
      setPostMatchActions([])
      setPersonalizedSessions([])
      setRescueSessions([])
      setFamiliarCourts([])
    } finally {
      setLoading(false)
    }
  }, [isAuthLoading, userId])

  useEffect(() => {
    void fetchHomeData()
  }, [fetchHomeData])

  useFocusEffect(
    useCallback(() => {
      void fetchHomeData()
    }, [fetchHomeData]),
  )

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchHomeData()
    setRefreshing(false)
  }, [fetchHomeData])

  return {
    refreshing,
    loading,
    profile,
    playerStats,
    nextMatch,
    pendingMatches,
    postMatchActions,
    personalizedSessions,
    rescueSessions,
    familiarCourts,
    fetchHomeData,
    onRefresh,
  }
}
