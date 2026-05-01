import { supabase } from '@/lib/supabase'
import {
    normalizeHomeSessionRecord,
    type FamiliarCourt,
    type HomeProfile,
    type HomeSessionRecordRaw,
    type MatchSession,
    type MySessionOverviewRow,
    type PendingMatch,
    type PendingMatchRaw,
    type PlayerStatsRecord,
    type PostMatchAction,
    isWithinNext24Hours,
    normalizeRelation,
    formatPendingResultTimeLabel,
    mapLiveSessionToMatchSession,
    buildLiveFamiliarCourts,
    isWithinNext12Hours
} from '@/lib/homeFeed'

export type HomeData = {
  profile: HomeProfile | null
  playerStats: PlayerStatsRecord | null
  nextMatch: MatchSession | null
  pendingMatches: PendingMatch[]
  postMatchActions: PostMatchAction[]
  personalizedSessions: MatchSession[]
  rescueSessions: MatchSession[]
  familiarCourts: FamiliarCourt[]
}

export async function fetchHomeDataApi(userId: string | null): Promise<HomeData> {
  const openSessionsPromise = supabase
    .from('sessions')
    .select(
      `
      id, host_id, is_ranked, elo_min, elo_max, max_players, status, court_booking_status, created_at,
      host:host_id ( id, name, current_elo, elo, self_assessed_level, skill_label, reliability_score, host_reputation ),
      slot:slot_id (
        id, start_time, end_time, price,
        court:court_id ( id, name, address, city, thumbnail_url, rating, rating_count, amenities, highlight )
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
  
  // 1. Get IDs of sessions the user is in
  const mySessionIdsPromise = userId
    ? supabase
        .from('session_players')
        .select('session_id')
        .eq('player_id', userId)
        .limit(20)
    : Promise.resolve({ data: [] })

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
            court:court_id ( name, thumbnail_url )
          )
        `,
        )
        .eq('host_id', userId)
        .in('results_status', ['not_submitted', 'disputed'])
        .in('status', ['pending_completion', 'done'])
        .order('created_at', { ascending: false })
        .limit(8)
    : Promise.resolve({ data: [] })

  const playerPostMatchActionsPromise = userId
    ? supabase
        .from('session_players')
        .select(
          `
          player_id, status, result_confirmation_status,
          session:session_id (
            id, status, results_status, host_id,
            slot:slot_id (
              start_time, end_time,
              court:court_id ( name, thumbnail_url )
            )
          )
        `,
        )
        .eq('player_id', userId)
        .eq('status', 'confirmed')
        .order('session_id', { ascending: false })
        .limit(10)
    : Promise.resolve({ data: [] })

  const pendingJoinRequestsPromise = userId
    ? supabase
        .from('join_requests')
        .select('match_id')
        .eq('player_id', userId)
        .eq('status', 'pending')
    : Promise.resolve({ data: [] })

  const courtsPromise = supabase
    .from('courts')
    .select('id, name, address, city, thumbnail_url, rating, rating_count, amenities, highlight')
    .order('rating', { ascending: false })
    .limit(10)

  const overviewPromise = userId ? supabase.rpc('get_my_sessions_overview') : Promise.resolve({ data: [] })

  const [
    openSessionsResult, 
    profileResult, 
    playerStatsResult, 
    pendingMatchesResult, 
    playerPostMatchActionsResult, 
    overviewResult,
    pendingJoinRequestsResult,
    mySessionIdsResult,
    courtsResult
  ] = await Promise.all([
    openSessionsPromise,
    profilePromise,
    playerStatsPromise,
    pendingMatchesPromise,
    playerPostMatchActionsPromise,
    overviewPromise,
    pendingJoinRequestsPromise,
    mySessionIdsPromise,
    courtsPromise
  ])

  const mySessionIds = (mySessionIdsResult.data || []).map((r: any) => r.session_id)
  
  // 2. Fetch full details for those sessions (to get ALL participants)
  let mySessionsRawResult: any[] = []
  if (mySessionIds.length > 0) {
    const { data: fullMySessions } = await supabase
      .from('sessions')
      .select(`
        id, host_id, is_ranked, elo_min, elo_max, max_players, status, court_booking_status, created_at,
        host:host_id ( id, name, current_elo, elo, self_assessed_level, skill_label, reliability_score, host_reputation ),
        slot:slot_id (
          id, start_time, end_time, price,
          court:court_id ( id, name, address, city, thumbnail_url, rating, rating_count, amenities, highlight )
        ),
        session_players (
          player_id, status,
          player:player_id ( id, name, reliability_score, current_elo, self_assessed_level, skill_label )
        )
      `)
      .in('id', mySessionIds)
      .in('status', ['open', 'closed_recruitment'])
      .gte('slot.start_time', new Date().toISOString())
      .order('slot(start_time)', { ascending: true })
    
    mySessionsRawResult = fullMySessions || []
  }

  const openSessionsRaw = (openSessionsResult.data ?? []) as unknown as HomeSessionRecordRaw[]
  const mySessionsRaw = mySessionsRawResult as unknown as HomeSessionRecordRaw[]
  const courtsRaw = (courtsResult.data ?? []) as any[]
  const pendingJoinRequestIds = new Set((pendingJoinRequestsResult.data ?? []).map((r: any) => r.match_id))

  const allFetchedSessions = [
    ...openSessionsRaw.map(normalizeHomeSessionRecord),
    ...mySessionsRaw.map(normalizeHomeSessionRecord)
  ]

  // Remove duplicates by session ID
  const uniqueSessionsMap = new Map(allFetchedSessions.map(s => [s.id, s]))
  const allSessions = Array.from(uniqueSessionsMap.values())

  const totalOpenSessions = allSessions.filter(s => s.status === 'open')

  const openSessions = totalOpenSessions.filter(session => {
    if (!userId) return true
    const isJoined = session.host_id === userId || session.session_players.some(p => p.player_id === userId)
    const hasPendingRequest = pendingJoinRequestIds.has(session.id)
    return !isJoined && !hasPendingRequest
  })

  const myUpcomingSessions = allSessions.filter(session => {
    if (!userId) return false
    return session.host_id === userId || session.session_players.some(p => p.player_id === userId)
  })

  const nextProfile = (profileResult.data ?? null) as HomeProfile | null
  const nextPlayerStats = (playerStatsResult.data ?? null) as PlayerStatsRecord | null
  const favoriteCourtIds = nextProfile?.favorite_court_ids?.filter(Boolean) ?? []
  const pendingRows = (pendingMatchesResult.data ?? []) as PendingMatchRaw[]
  const postMatchRows = (playerPostMatchActionsResult.data ?? []) as any[] // Keeping any for now to avoid huge type definition duplication
  const overviewRows = (overviewResult.data ?? []) as MySessionOverviewRow[]
  const viewerElo = nextProfile?.current_elo ?? nextProfile?.elo ?? null

  let favoriteCourtsMeta: Array<{ id: string; name?: string | null; address?: string | null; city?: string | null }> = []
  if (favoriteCourtIds.length > 0) {
    const { data: favoriteCourtsData } = await supabase
      .from('courts')
      .select('id, name, address, city, thumbnail_url, rating, rating_count, amenities, highlight')
      .in('id', favoriteCourtIds)

    favoriteCourtsMeta = (favoriteCourtsData ?? []) as Array<{ id: string; name?: string | null; address?: string | null; city?: string | null }>
  }

  const sortedOpenSessions = [...openSessions].sort(
    (left, right) => Date.parse(left.slot?.start_time ?? '') - Date.parse(right.slot?.start_time ?? ''),
  )

  const sortedMyUpcoming = [...myUpcomingSessions]
    .filter(s => isWithinNext24Hours(s.slot?.start_time ?? ''))
    .sort((left, right) => Date.parse(left.slot?.start_time ?? '') - Date.parse(right.slot?.start_time ?? ''))

  const liveNextSession = sortedMyUpcoming[0] ?? null

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
        resultsStatus: item.results_status,
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
        if (row.result_confirmation_status === 'confirmed' || row.result_confirmation_status === 'disputed') {
          return acc
        }

        acc.push({
          id: session.id,
          courtName: court?.name ?? 'Kèo Pickleball',
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
          courtName: court?.name ?? 'Kèo Pickleball',
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

  return {
    profile: nextProfile,
    playerStats: nextPlayerStats,
    pendingMatches: nextPendingMatches,
    postMatchActions: nextPostMatchActions,
    familiarCourts: buildLiveFamiliarCourts(totalOpenSessions, {
      favoriteCourtIds,
      favoriteCourtsMeta,
      courtsRaw,
    }),
    nextMatch: liveNextSession
      ? mapLiveSessionToMatchSession(liveNextSession, {
          viewerId: userId,
          viewerElo,
          hostAverageRating: nextPlayerStats?.host_average_rating,
        })
      : null,
    personalizedSessions: sortedOpenSessions
      .filter((session) => session.id !== liveNextSession?.id)
      .map((session) => mapLiveSessionToMatchSession(session, { viewerId: userId, viewerElo }))
      .sort((left, right) => right.matchScore - left.matchScore)
      .slice(0, 5)
      .map((session, index, sessions) => ({
        ...session,
        carouselIndex: index,
        carouselTotal: sessions.length,
      })),
    rescueSessions: sortedOpenSessions
      .filter((session) => {
        const activePlayers = session.session_players.filter((player) => player.status !== 'rejected').length
        const slotsLeft = Math.max(session.max_players - activePlayers, 0)
        return slotsLeft > 0 && slotsLeft <= 2 && isWithinNext12Hours(session.slot?.start_time ?? '')
      })
      .map((session) => mapLiveSessionToMatchSession(session, { viewerId: userId, viewerElo, urgent: true }))
      .sort((left, right) => right.matchScore - left.matchScore)
      .slice(0, 5),
  }
}
