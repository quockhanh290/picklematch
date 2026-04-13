import { router } from 'expo-router'
import { useCallback, useMemo, useState } from 'react'
import { Alert } from 'react-native'

import type { RequestStatus, SessionDetailRecord, ViewerPlayer } from '@/hooks/useSessionDetail'
import { getMatchStatus, type MatchStatus } from '@/lib/matchmaking'
import { getComparableElo } from '@/lib/sessionDetail'
import { supabase } from '@/lib/supabase'

type Params = {
  session: SessionDetailRecord | null
  userId?: string | null
  viewerPlayer: ViewerPlayer | null
  hasJoined: boolean
  requestStatus: RequestStatus
  setRequestStatus: (status: RequestStatus) => void
  setHostResponseTemplate: (value: string | null) => void
  introNote: string
  onJoinModalClose: () => void
  refreshSession: () => Promise<void>
}

export function useSessionJoinActions({
  session,
  userId,
  viewerPlayer,
  hasJoined,
  requestStatus,
  setRequestStatus,
  setHostResponseTemplate,
  introNote,
  onJoinModalClose,
  refreshSession,
}: Params) {
  const [joining, setJoining] = useState(false)
  const [requesting, setRequesting] = useState(false)
  const [leaving, setLeaving] = useState(false)

  const isHost = userId != null && userId === session?.host.id
  const viewerElo = getComparableElo(viewerPlayer)
  const playerCount = session?.session_players.length ?? 0
  const maxPlayers = session?.max_players ?? 0
  const eloMin = session?.elo_min ?? 0

  const matchStatus: MatchStatus = useMemo(
    () => getMatchStatus(viewerElo, eloMin, playerCount, maxPlayers),
    [eloMin, maxPlayers, playerCount, viewerElo],
  )

  const hostRequiresApproval = Boolean(session?.require_approval || session?.host.auto_accept === false)
  const canShowJoinActions = !isHost && !hasJoined && session?.status === 'open'

  const directJoinSession = useCallback(async () => {
    if (!userId) {
      Alert.alert('Cần đăng nhập', 'Bạn cần đăng nhập để tham gia kèo.', [
        { text: 'Để sau', style: 'cancel' },
        { text: 'Đăng nhập', onPress: () => router.push('/login') },
      ])
      return
    }

    if (!session) return

    setJoining(true)
    const { error } = await supabase.from('session_players').insert({
      session_id: session.id,
      player_id: userId,
      status: 'confirmed',
    })

    if (!error) {
      await supabase
        .from('join_requests')
        .update({ status: 'accepted' })
        .eq('match_id', session.id)
        .eq('player_id', userId)
    }

    setJoining(false)

    if (error) {
      Alert.alert('Không thể tham gia kèo', error.message)
      return
    }

    setRequestStatus('accepted')
    onJoinModalClose()
    Alert.alert('Tham gia thành công', 'Bạn đã vào kèo này rồi nhé.')
    await refreshSession()
  }, [onJoinModalClose, refreshSession, session, setRequestStatus, userId])

  const sendJoinRequest = useCallback(async () => {
    if (!userId) {
      Alert.alert('Cần đăng nhập', 'Bạn cần đăng nhập để gửi yêu cầu.', [
        { text: 'Để sau', style: 'cancel' },
        { text: 'Đăng nhập', onPress: () => router.push('/login') },
      ])
      return
    }

    if (!session) return

    setRequesting(true)
    const { error } = await supabase.from('join_requests').upsert(
      {
        match_id: session.id,
        player_id: userId,
        status: 'pending',
        intro_note: introNote.trim() || null,
      },
      { onConflict: 'match_id,player_id' }
    )
    setRequesting(false)

    if (error) {
      Alert.alert('Không thể gửi yêu cầu', error.message)
      return
    }

    setRequestStatus('pending')
    setHostResponseTemplate(null)
    onJoinModalClose()
    Alert.alert(
      matchStatus === 'WAITLIST' ? 'Đã đăng ký dự bị' : 'Đã gửi yêu cầu',
      matchStatus === 'WAITLIST'
        ? 'Host sẽ thấy bạn trong danh sách dự bị nếu có chỗ trống.'
        : 'Chờ host duyệt nhé.'
    )
    await refreshSession()
  }, [introNote, matchStatus, onJoinModalClose, refreshSession, session, setHostResponseTemplate, setRequestStatus, userId])

  const leaveSession = useCallback(async () => {
    if (!session || !userId) return

    Alert.alert('Rời kèo?', 'Bạn chắc chắn muốn rời kèo này?', [
      { text: 'Ở lại', style: 'cancel' },
      {
        text: 'Rời kèo',
        style: 'destructive',
        onPress: async () => {
          setLeaving(true)
          const { error } = await supabase
            .from('session_players')
            .delete()
            .eq('session_id', session.id)
            .eq('player_id', userId)

          setLeaving(false)

          if (error) {
            Alert.alert('Không thể rời kèo', error.message)
            return
          }

          await refreshSession()
        },
      },
    ])
  }, [refreshSession, session, userId])

  function handleSmartJoinPress(onOpenJoinModal: () => void) {
    if (matchStatus === 'MATCHED' && !hostRequiresApproval) {
      void directJoinSession()
      return
    }

    onOpenJoinModal()
  }

  return {
    joining,
    requesting,
    leaving,
    matchStatus,
    hostRequiresApproval,
    canShowJoinActions,
    requestStatus,
    directJoinSession,
    sendJoinRequest,
    leaveSession,
    handleSmartJoinPress,
  }
}
