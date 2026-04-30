import * as Linking from 'expo-linking'
import { router, useLocalSearchParams } from 'expo-router'
import { CheckCheck } from 'lucide-react-native'
import { useEffect, useMemo, useState } from 'react'
import {
  RefreshControl,
  ScrollView,
  Share,
  Text,
  View,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

import { AppDialog, type AppDialogConfig, AppLoading, NavbarShareButton, SecondaryNavbar } from '@/components/design'
import { PROFILE_THEME_COLORS } from '@/constants/profileTheme'
import { JoinRequestModal } from '@/components/session/JoinRequestModal'
import { PlayerRosterSection } from '@/components/session/PlayerRosterSection'
import { SessionMetaCard } from '@/components/session/SessionMetaCard'
import { SmartJoinButton } from '@/components/session/SmartJoinButton'
import { SessionResultBanner } from '@/components/session/SessionResultBanner'
import { SessionActionButtons } from '@/components/session/SessionActionButtons'
import { useSessionArrangement } from '@/hooks/useSessionArrangement'
import { useSessionDetail } from '@/hooks/useSessionDetail'
import { useSessionJoinActions } from '@/hooks/useSessionJoinActions'
import { getEloBandForSessionRange } from '@/lib/eloSystem'
import {
  formatPricePerPerson,
  formatTimeRange,
} from '@/lib/sessionDetail'
import { useAuth } from '@/lib/useAuth'
import { SCREEN_FONTS } from '@/constants/typography'
import { RADIUS, SPACING, BORDER } from '@/constants/screenLayout'
import { STRINGS } from '@/constants/strings'

export default function SessionDetailScreen() {
  const { id, updated } = useLocalSearchParams<{ id: string; updated?: string }>()
  const { userId } = useAuth()
  const insets = useSafeAreaInsets()

  const [joinModalVisible, setJoinModalVisible] = useState(false)
  const [dialogConfig, setDialogConfig] = useState<AppDialogConfig | null>(null)
  const [showUpdatedToast, setShowUpdatedToast] = useState(false)

  const {
    loading,
    refreshing,
    session,
    viewerPlayer,
    requestStatus,
    setRequestStatus,
    setHostResponseTemplate,
    introNote,
    fetchSession,
    onRefresh,
    error,
  } = useSessionDetail(id, userId)

  useEffect(() => {
    if (error) {
      setDialogConfig({
        title: STRINGS.session_detail.errors.load_failed,
        message: error,
        actions: [{ label: STRINGS.common.back }],
      })
    }
  }, [error])

  const isHost = userId !== null && userId !== undefined && userId === session?.host.id
  const hasJoined = useMemo(
    () => (session ? session.session_players.some((item) => item.player_id === userId) : false),
    [session, userId],
  )

  const {
    savingArrangement,
    isArranging,
    setIsArranging,
    arrangedPlayers,
    switchTeam,
    onAutoBalance,
    onSaveArrangement,
    teamA,
    teamB,
    averageTeamA,
    averageTeamB,
    arrangementDirty,
  } = useSessionArrangement(session, isHost, fetchSession, (payload) => setDialogConfig(payload))

  const {
    leaving,
    canShowJoinActions,
    leaveSession,
    handleSmartJoinPress,
  } = useSessionJoinActions({
    session,
    userId,
    viewerPlayer,
    hasJoined,
    requestStatus,
    setRequestStatus,
    setHostResponseTemplate,
    introNote,
    onJoinModalClose: () => setJoinModalVisible(false),
    onJoinModalOpen: () => setJoinModalVisible(true),
    refreshSession: fetchSession,
    presentDialog: (payload) => setDialogConfig(payload),
  })

  useEffect(() => {
    if (updated !== '1' || !id) return

    setShowUpdatedToast(true)
    const hideTimer = setTimeout(() => {
      setShowUpdatedToast(false)
    }, 2400)

    router.replace({
      pathname: '/session/[id]',
      params: { id },
    } as never)

    return () => clearTimeout(hideTimer)
  }, [id, updated])

  if (loading) {
    return <AppLoading fullScreen />
  }

  if (!session) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center px-6" style={{ backgroundColor: PROFILE_THEME_COLORS.background }}>
        <Text style={{ textAlign: 'center', fontSize: 15, fontFamily: SCREEN_FONTS.label, color: PROFILE_THEME_COLORS.onSurfaceVariant }}>{STRINGS.session_detail.errors.not_found}</Text>
      </SafeAreaView>
    )
  }

  const sessionSkillBand = getEloBandForSessionRange(session.elo_min, session.elo_max)
  const sessionSkillLabel = sessionSkillBand.shortLabel
  const spotsLeft = Math.max(0, session.max_players - arrangedPlayers.length)
  const viewerSessionPlayer = session.session_players.find((item) => item.player_id === userId) ?? null
  const showBottomActions = isHost || hasJoined || canShowJoinActions
  const hostActionBusy = savingArrangement || leaving

  // Time-window flags
  const now = new Date()
  const slotStart = session.slot?.start_time ? new Date(session.slot.start_time) : null
  const slotEnd = session.slot?.end_time ? new Date(session.slot.end_time) : null
  const isBeforeStart = slotStart ? now < slotStart : true
  const isDuringMatch = slotStart && slotEnd ? now >= slotStart && now <= slotEnd : false
  const isAfterEnd = slotEnd ? now > slotEnd : false

  // Disable team arrangement during or after match
  const canArrange = isHost && isBeforeStart
  const hostPrimaryMode: 'edit' | 'arranging' | 'save' =
    !isArranging ? 'edit' : arrangementDirty ? 'save' : 'arranging'
  const hostPrimaryDisabled = hostActionBusy || hostPrimaryMode === 'arranging'
  const hasActedOnResult = 
    viewerSessionPlayer?.result_confirmation_status === 'confirmed' || 
    viewerSessionPlayer?.result_confirmation_status === 'disputed' ||
    !!viewerSessionPlayer?.proposed_result

  const canRespondToResult =
    !isHost &&
    hasJoined &&
    viewerSessionPlayer?.status === 'confirmed' &&
    !hasActedOnResult &&
    (
      session.results_status === 'pending_confirmation' ||
      session.results_status === 'disputed' ||
      ((session.results_status === 'not_submitted' ||
        session.results_status === null ||
        session.results_status === undefined) &&
        (session.status === 'pending_completion' || session.status === 'done'))
    )
  const isResultDisputed = session.results_status === 'disputed'

  async function handleShare() {
    try {
      const url = Linking.createURL(`/session/${id}`)
      await Share.share({ message: `Tham gia kèo pickleball này nhé! ${url}` })
    } catch (error) {
      console.warn('[SessionDetail] Failed to share session:', error)
      setDialogConfig({ title: STRINGS.session_detail.errors.share_failed, message: 'Vui lòng thử lại sau ít phút.', actions: [{ label: STRINGS.common.back, tone: 'secondary' }] })
    }
  }

  return (
    <View className="flex-1" style={{ backgroundColor: PROFILE_THEME_COLORS.background }}>
      <SecondaryNavbar
        title={STRINGS.session_detail.title}
        onBackPress={() => router.back()}
        rightSlot={<NavbarShareButton onPress={() => void handleShare()} />}
      />

      {showUpdatedToast ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 10 + insets.top,
            left: 20,
            right: 20,
            zIndex: 20,
            borderRadius: RADIUS.lg,
            borderWidth: BORDER.base,
            borderColor: PROFILE_THEME_COLORS.primaryFixedDim,
            backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest,
            paddingHorizontal: SPACING.md,
            paddingVertical: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <CheckCheck size={16} color={PROFILE_THEME_COLORS.primary} strokeWidth={2.6} />
          <Text
            style={{
              flex: 1,
              fontSize: 13,
              fontFamily: SCREEN_FONTS.headline,
              color: PROFILE_THEME_COLORS.primary,
            }}
          >
            {STRINGS.session_detail.status.updated}
          </Text>
        </View>
      ) : null}

      <ScrollView
        className="flex-1"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
        contentContainerStyle={{
          paddingBottom: 48 + insets.bottom,
          paddingHorizontal: SPACING.xl,
          paddingTop: 12,
        }}
      >

        <SessionMetaCard
          skillLevelId={sessionSkillBand.levelId}
          sessionSkillLabel={sessionSkillLabel}
          sessionStatus={
            session.status === 'done' || session.status === 'cancelled'
              ? session.status
              : isAfterEnd
                ? 'pending_completion'
                : isDuringMatch
                  ? 'in_progress'
                  : session.status
          }
          resultsStatus={session.results_status}
          userResult={viewerSessionPlayer?.proposed_result}
          courtBookingStatus={session.court_booking_status}
          courtName={session.slot.court.name}
          courtAddress={session.slot.court.address}
          courtCity={session.slot.court.city}
          timeLabel={formatTimeRange(session.slot.start_time, session.slot.end_time)}
          priceLabel={formatPricePerPerson(session.slot.price, session.max_players)}
          isRanked={session.is_ranked}
          hostNote={session.booking_notes}
          maxPlayers={session.max_players}
        />

        {session.is_ranked && (
          <View
            style={{
              marginTop: 16,
              borderRadius: RADIUS.md,
              padding: 12,
              backgroundColor: PROFILE_THEME_COLORS.secondaryContainer,
              flexDirection: 'row',
              gap: 12,
              alignItems: 'center',
            }}
          >
            <View style={{ width: 32, height: 32, borderRadius: RADIUS.sm, backgroundColor: PROFILE_THEME_COLORS.onSecondaryContainer, alignItems: 'center', justifyContent: 'center', opacity: 0.1 }}>
            </View>
            <View style={{ position: 'absolute', left: 12, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 16 }}>🏆</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, fontFamily: SCREEN_FONTS.headline, color: PROFILE_THEME_COLORS.primary }}>
                {STRINGS.session_detail.elo_banner.title}
              </Text>
              <Text style={{ fontSize: 11, fontFamily: SCREEN_FONTS.body, color: PROFILE_THEME_COLORS.primary, marginTop: 1, opacity: 0.8 }}>
                {STRINGS.session_detail.elo_banner.description}
              </Text>
            </View>
          </View>
        )}

        <SessionResultBanner
          id={id}
          resultsStatus={session.results_status}
          isHost={isHost}
          isResultDisputed={isResultDisputed}
          canRespondToResult={canRespondToResult}
        />

        <PlayerRosterSection
          arrangedPlayers={arrangedPlayers}
          maxPlayers={session.max_players}
          sessionStatus={session.status}
          spotsLeft={spotsLeft}
          isHost={isHost}
          hostId={session.host.id}
          isArranging={canArrange ? isArranging : false}
          setIsArranging={canArrange ? setIsArranging : () => {}}
          onAutoBalance={onAutoBalance}
          teamA={teamA}
          teamB={teamB}
          averageTeamA={averageTeamA}
          averageTeamB={averageTeamB}
          switchTeam={switchTeam}
          hideEmptySlots={!isBeforeStart}
        />

        {showBottomActions ? (
          <View style={{ marginTop: 20, paddingBottom: 8 }}>
            <SessionActionButtons
              id={id}
              session={session}
              isHost={isHost}
              hasJoined={hasJoined}
              isAfterEnd={isAfterEnd}
              isDuringMatch={isDuringMatch}
              isCancelled={session.status === 'cancelled'}
              viewerSessionPlayer={viewerSessionPlayer}
              hostPrimaryMode={hostPrimaryMode}
              hostPrimaryDisabled={hostPrimaryDisabled}
              hostActionBusy={hostActionBusy}
              savingArrangement={savingArrangement}
              leaving={leaving}
              onSaveArrangement={onSaveArrangement}
              leaveSession={leaveSession}
            />

            {!isHost && canShowJoinActions && (
              <SmartJoinButton
                onPress={() => void handleSmartJoinPress()}
              />
            )}
          </View>
        ) : null}
      </ScrollView>

      <JoinRequestModal
        visible={joinModalVisible}
        onClose={() => setJoinModalVisible(false)}
        session={session}
      />

      <AppDialog config={dialogConfig} onDismiss={() => setDialogConfig(null)} />
    </View>
  )
}
