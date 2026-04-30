import { router } from 'expo-router'
import { useCallback, useMemo, useState } from 'react'

import type { RequestStatus, SessionDetailRecord, ViewerPlayer } from '@/hooks/useSessionDetail'
import { getMatchStatus, type MatchStatus } from '@/lib/matchmaking'
import { getComparableElo } from '@/lib/sessionDetail'
import { supabase } from '@/lib/supabase'

type DialogAction = {
  label: string
  tone?: 'primary' | 'secondary' | 'danger'
  onPress?: () => void | Promise<void>
}

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
  presentDialog: (payload: { title: string; message: string; actions: DialogAction[] }) => void
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
  presentDialog,
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
  const isJoinWindowOpen = useMemo(() => {
    if (session?.status !== 'open') return false
    if (!session?.fill_deadline) return true
    const deadlineMs = Date.parse(session.fill_deadline)
    if (Number.isNaN(deadlineMs)) return true
    return deadlineMs > Date.now()
  }, [session?.fill_deadline, session?.status])

  const canShowJoinActions = !isHost && !hasJoined && isJoinWindowOpen

  const directJoinSession = useCallback(async () => {
    if (!userId) {
      presentDialog({
        title: 'Cần đăng nhập',
        message: 'Bạn cần đăng nhập để tham gia kèo.',
        actions: [
          { label: 'Để sau', tone: 'secondary' },
          { label: 'Đăng nhập', onPress: () => router.push('/login') },
        ],
      })
      return
    }

    if (!session) return
    if (!isJoinWindowOpen) {
      presentDialog({
        title: 'Kèo đã ngưng nhận người',
        message: 'Kèo này đã qua hạn chốt nhận người chơi mới.',
        actions: [{ label: 'Đã hiểu' }],
      })
      return
    }

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
      presentDialog({
        title: 'Không thể tham gia kèo',
        message: error.message,
        actions: [{ label: 'Đóng', tone: 'secondary' }],
      })
      return
    }

    setRequestStatus('accepted')
    onJoinModalClose()
    presentDialog({
      title: 'Tham gia thành công',
      message: 'Bạn đã vào kèo này rồi nhé.',
      actions: [{ label: 'Tuyệt vời' }],
    })
    await refreshSession()
  }, [isJoinWindowOpen, onJoinModalClose, presentDialog, refreshSession, session, setRequestStatus, userId])

  const sendJoinRequest = useCallback(async () => {
    if (!userId) {
      presentDialog({
        title: 'Cần đăng nhập',
        message: 'Bạn cần đăng nhập để gửi yêu cầu.',
        actions: [
          { label: 'Để sau', tone: 'secondary' },
          { label: 'Đăng nhập', onPress: () => router.push('/login') },
        ],
      })
      return
    }

    if (!session) return
    if (!isJoinWindowOpen) {
      presentDialog({
        title: 'Kèo đã ngưng nhận người',
        message: 'Kèo này đã qua hạn chốt nhận người chơi mới.',
        actions: [{ label: 'Đã hiểu' }],
      })
      return
    }

    setRequesting(true)
    const { error } = await supabase.from('join_requests').upsert(
      {
        match_id: session.id,
        player_id: userId,
        status: 'pending',
        intro_note: introNote.trim() || null,
      },
      { onConflict: 'match_id,player_id' },
    )
    setRequesting(false)

    if (error) {
      presentDialog({
        title: 'Không thể gửi yêu cầu',
        message: error.message,
        actions: [{ label: 'Đóng', tone: 'secondary' }],
      })
      return
    }

    setRequestStatus('pending')
    setHostResponseTemplate(null)
    onJoinModalClose()
    presentDialog({
      title: matchStatus === 'WAITLIST' ? 'Đã đăng ký dự bị' : 'Đã gửi yêu cầu',
      message:
        matchStatus === 'WAITLIST'
          ? 'Host sẽ thấy bạn trong danh sách dự bị nếu có chỗ trống.'
          : 'Chờ host duyệt nhé.',
      actions: [{ label: 'Đã rõ' }],
    })
    await refreshSession()
  }, [introNote, isJoinWindowOpen, matchStatus, onJoinModalClose, presentDialog, refreshSession, session, setHostResponseTemplate, setRequestStatus, userId])

  const leaveSession = useCallback(async () => {
    if (!session || !userId) return

    const hostFlow = isHost
    const title = hostFlow ? 'Hủy kèo?' : 'Rời kèo?'
    const message = hostFlow
      ? 'Bạn chắc chắn muốn hủy kèo này? Kèo sẽ bị hủy cho tất cả người chơi.'
      : 'Bạn chắc chắn muốn rời kèo này?'
    const destructiveText = hostFlow ? 'Hủy kèo' : 'Rời kèo'

    presentDialog({
      title,
      message,
      actions: [
        { label: 'Ở lại', tone: 'secondary' },
        {
          label: destructiveText,
          tone: 'danger',
          onPress: async () => {
            setLeaving(true)
            const { error } = hostFlow
              ? await supabase.rpc('cancel_host_session', { p_session_id: session.id })
              : await supabase
                  .from('session_players')
                  .delete()
                  .eq('session_id', session.id)
                  .eq('player_id', userId)

            setLeaving(false)

            if (error) {
              presentDialog({
                title: hostFlow ? 'Không thể hủy kèo' : 'Không thể rời kèo',
                message: error.message,
                actions: [{ label: 'Đóng', tone: 'secondary' }],
              })
              return
            }

            await refreshSession()
          },
        },
      ],
    })
  }, [isHost, presentDialog, refreshSession, session, userId])

  const cancelJoinRequest = useCallback(async () => {
    if (!session || !userId) return

    presentDialog({
      title: 'Hủy yêu cầu?',
      message: 'Bạn chắc chắn muốn hủy yêu cầu tham gia kèo này?',
      actions: [
        { label: 'Giữ lại', tone: 'secondary' },
        {
          label: 'Hủy yêu cầu',
          tone: 'danger',
          onPress: async () => {
            setRequesting(true)
            const { error } = await supabase
              .from('join_requests')
              .delete()
              .eq('match_id', session.id)
              .eq('player_id', userId)
            setRequesting(false)

            if (error) {
              presentDialog({
                title: 'Lỗi',
                message: 'Không thể hủy yêu cầu: ' + error.message,
                actions: [{ label: 'Đóng', tone: 'secondary' }],
              })
              return
            }

            setRequestStatus('none')
            await refreshSession()
          },
        },
      ],
    })
  }, [presentDialog, refreshSession, session, setRequestStatus, userId])

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
    cancelJoinRequest,
    leaveSession,
    handleSmartJoinPress,
  }
}
