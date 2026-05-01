import { useFocusEffect } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { 
    type FamiliarCourt,
    type HomeProfile,
    type MatchSession,
    type PendingMatch,
    type PlayerStatsRecord,
    type PostMatchAction,
} from '@/lib/homeFeed'
import { fetchHomeDataApi } from '../api'

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
      const data = await fetchHomeDataApi(userId ?? null)
      setProfile(data.profile)
      setPlayerStats(data.playerStats)
      setPendingMatches(data.pendingMatches)
      setPostMatchActions(data.postMatchActions)
      setNextMatch(data.nextMatch)
      setPersonalizedSessions(data.personalizedSessions)
      setRescueSessions(data.rescueSessions)
      setFamiliarCourts(data.familiarCourts)
    } catch (error) {
      console.error('[HomeHook] fetchHomeData failed:', error)
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
