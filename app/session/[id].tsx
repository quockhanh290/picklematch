import * as Linking from 'expo-linking'
import { router, useLocalSearchParams } from 'expo-router'
import {
  CheckCheck,
  KeyRound,
  LogOut,
  PencilLine,
  Repeat2,
  Save,
  Share2,
  ShieldAlert,
  Star,
  Trophy,
} from 'lucide-react-native'
import { useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

import { AppDialog, type AppDialogConfig, ScreenHeader } from '@/components/design'
import { PROFILE_THEME_COLORS, PROFILE_THEME_SEMANTIC } from '@/components/profile/profileTheme'
import { JoinRequestModal } from '@/components/session/JoinRequestModal'
import { PlayerRosterSection } from '@/components/session/PlayerRosterSection'
import { SessionMetaCard } from '@/components/session/SessionMetaCard'
import { SmartJoinButton } from '@/components/session/SmartJoinButton'
import { useSessionArrangement } from '@/hooks/useSessionArrangement'
import { useSessionDetail } from '@/hooks/useSessionDetail'
import { useSessionJoinActions } from '@/hooks/useSessionJoinActions'
import { getEloBandForSessionRange } from '@/lib/eloSystem'
import {
  formatPricePerPerson,
  formatTimeRange,
  getInitials,
  type ArrangementPlayer,
} from '@/lib/sessionDetail'
import { getSkillLevelUi } from '@/lib/skillLevelUi'
import { useAuth } from '@/lib/useAuth'
import { SCREEN_FONTS } from '@/constants/typography'
import { RADIUS, SPACING, BORDER, SHADOW } from '@/constants/screenLayout'

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
    hostResponseTemplate,
    setHostResponseTemplate,
    introNote,
    setIntroNote,
    fetchSession,
    onRefresh,
  } = useSessionDetail(id, userId)

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
  } = useSessionArrangement(session, isHost, fetchSession)

  const {
    joining,
    requesting,
    leaving,
    matchStatus,
    canShowJoinActions,
    leaveSession,
    sendJoinRequest,
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
    return (
      <SafeAreaView className="flex-1 items-center justify-center" style={{ backgroundColor: PROFILE_THEME_COLORS.background }}>
        <ActivityIndicator size="large" color={PROFILE_THEME_COLORS.primary} />
      </SafeAreaView>
    )
  }

  if (!session) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center px-6" style={{ backgroundColor: PROFILE_THEME_COLORS.background }}>
        <Text style={{ textAlign: 'center', fontSize: 15, fontFamily: SCREEN_FONTS.label, color: PROFILE_THEME_COLORS.onSurfaceVariant }}>Không tìm thấy kèo này.</Text>
      </SafeAreaView>
    )
  }

  const sessionSkillBand = getEloBandForSessionRange(session.elo_min, session.elo_max)
  const sessionSkillLabel = sessionSkillBand.shortLabel
  const hostId = session.host.id
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
  const canRespondToResult =
    !isHost &&
    hasJoined &&
    viewerSessionPlayer?.status === 'confirmed' &&
    (
      session.results_status === 'pending_confirmation' ||
      session.results_status === 'disputed' ||
      ((session.results_status === 'not_submitted' ||
        session.results_status === null ||
        session.results_status === undefined) &&
        (session.status === 'pending_completion' || session.status === 'done'))
    )
  const isResultDisputed = session.results_status === 'disputed'
  const resultBannerTone = isResultDisputed
    ? {
        border: PROFILE_THEME_SEMANTIC.dangerBorderSoft,
        background: PROFILE_THEME_SEMANTIC.dangerBg,
        text: PROFILE_THEME_SEMANTIC.dangerText,
        button: PROFILE_THEME_SEMANTIC.dangerStrong,
      }
    : {
        border: PROFILE_THEME_COLORS.secondaryFixedDim,
        background: PROFILE_THEME_COLORS.tertiaryFixed,
        text: PROFILE_THEME_COLORS.onTertiaryFixedVariant,
        button: PROFILE_THEME_COLORS.primaryContainer,
      }

  function renderPlayerRow(player: ArrangementPlayer, mode: 'normal' | 'arranging') {
    const levelUi = getSkillLevelUi(player.levelId)
    const isHostPlayer = player.id === hostId

    return (
      <View
        key={`${mode}-${player.id}`}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderRadius: RADIUS.lg,
          borderWidth: BORDER.base,
          borderColor: PROFILE_THEME_COLORS.outlineVariant,
          backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest,
          paddingHorizontal: 16,
          paddingVertical: 12,
          gap: 12,
        }}
      >
        <TouchableOpacity
          onPress={() => router.push({ pathname: '/player/[id]' as never, params: { id: player.id } })}
          activeOpacity={0.86}
          style={{
            width: 44,
            height: 44,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: RADIUS.full,
            backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontFamily: SCREEN_FONTS.bold,
              color: PROFILE_THEME_COLORS.primary,
            }}
          >
            {getInitials(player.name)}
          </Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text
              numberOfLines={1}
              style={{
                fontSize: 15,
                fontFamily: SCREEN_FONTS.headline,
                color: PROFILE_THEME_COLORS.onSurface,
                textTransform: 'uppercase',
              }}
            >
              {player.name}
            </Text>
            {isHostPlayer && (
              <KeyRound size={12} color={PROFILE_THEME_COLORS.surfaceTint} strokeWidth={2.5} />
            )}
          </View>
          <Text style={{ fontSize: 10, fontFamily: SCREEN_FONTS.label, color: PROFILE_THEME_COLORS.outline, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {isHostPlayer ? 'Chủ kèo' : 'Thành viên'}
          </Text>
        </View>

        <View
          style={{
            backgroundColor: levelUi.iconColor + '15',
            borderRadius: 6,
            paddingHorizontal: 10,
            paddingVertical: 5,
            borderWidth: 1,
            borderColor: levelUi.iconColor + '30',
          }}
        >
          <Text
            style={{
              fontSize: 11,
              fontFamily: SCREEN_FONTS.bold,
              color: levelUi.iconColor,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
            }}
          >
            {levelUi.shortLabel}
          </Text>
        </View>

        {mode === 'arranging' && (
          <TouchableOpacity
            onPress={() => switchTeam(player.id)}
            style={{
              width: 36,
              height: 36,
              borderRadius: RADIUS.full,
              backgroundColor: PROFILE_THEME_COLORS.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Repeat2 size={16} color={PROFILE_THEME_COLORS.onPrimary} />
          </TouchableOpacity>
        )}
      </View>
    )
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: PROFILE_THEME_COLORS.background }} edges={['top']}>
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
            backgroundColor: PROFILE_THEME_SEMANTIC.successBg,
            paddingHorizontal: SPACING.md,
            paddingVertical: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <CheckCheck size={16} color={PROFILE_THEME_COLORS.primaryContainer} strokeWidth={2.6} />
          <Text
            style={{
              flex: 1,
              fontSize: 13,
              fontFamily: SCREEN_FONTS.bold,
              color: PROFILE_THEME_COLORS.primaryContainer,
            }}
          >
            Đã cập nhật kèo
          </Text>
        </View>
      ) : null}

      <ScrollView
        className="flex-1"
        stickyHeaderIndices={[0]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
        contentContainerStyle={{
          paddingBottom: 48 + insets.bottom,
          paddingHorizontal: SPACING.xl,
        }}
      >
        <ScreenHeader
          variant="brand"
          title="KINETIC"
          onBackPress={() => router.back()}
          rightSlot={
            <TouchableOpacity
              className="h-11 w-11 items-center justify-center rounded-2xl border"
              style={{
                borderColor: PROFILE_THEME_COLORS.outlineVariant,
                backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest,
              }}
              onPress={() => {
                void (async () => {
                  try {
                    const url = Linking.createURL(`/session/${id}`)
                    await Share.share({ message: `Tham gia kèo pickleball này nhé! ${url}` })
                  } catch (error) {
                    console.warn('[SessionDetail] Failed to share session:', error)
                    setDialogConfig({ title: '\u004b\u0068\u00f4\u006e\u0067\u0020\u0074\u0068\u1ec3\u0020\u0063\u0068\u0069\u0061\u0020\u0073\u1ebb', message: '\u0056\u0075\u0069\u0020\u006c\u00f2\u006e\u0067\u0020\u0074\u0068\u1eed\u0020\u006c\u1ea1\u0069\u0020\u0073\u0061\u0075\u0020\u00ed\u0074\u0020\u0070\u0068\u00fa\u0074\u002e', actions: [{ label: '\u0110\u00f3\u006e\u0067', tone: 'secondary' }] })
                  }
                })()
              }}
              activeOpacity={0.9}
            >
              <Share2 size={18} color={PROFILE_THEME_COLORS.primaryContainer} strokeWidth={2.5} />
            </TouchableOpacity>
          }
        />

        <SessionMetaCard
          skillLevelId={sessionSkillBand.levelId}
          sessionSkillLabel={sessionSkillLabel}
          sessionStatus={session.status}
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
              <Text style={{ fontSize: 13, fontFamily: SCREEN_FONTS.bold, color: PROFILE_THEME_COLORS.primary }}>
                Kèo tính điểm ELO
              </Text>
              <Text style={{ fontSize: 11, fontFamily: SCREEN_FONTS.body, color: PROFILE_THEME_COLORS.primary, marginTop: 1, opacity: 0.8 }}>
                Kết quả trận đấu này sẽ được dùng để cập nhật trình độ và bảng xếp hạng.
              </Text>
            </View>
          </View>
        )}

        {canRespondToResult ? (
          <View
            style={{ marginTop: 20, borderRadius: RADIUS.lg, borderWidth: BORDER.base, padding: SPACING.xl, borderColor: resultBannerTone.border, backgroundColor: resultBannerTone.background }}
          >
            <View className="flex-row items-center">
              {session.results_status === 'disputed' ? (
                <ShieldAlert size={18} color={PROFILE_THEME_SEMANTIC.dangerText} strokeWidth={2.5} />
              ) : (
                <CheckCheck size={18} color={PROFILE_THEME_COLORS.onSecondaryFixedVariant} strokeWidth={2.5} />
              )}
              <Text
                style={{ marginLeft: 8, fontSize: 15, fontFamily: SCREEN_FONTS.bold, color: resultBannerTone.text }}
              >
                {session.results_status === 'disputed'
                  ? 'Kết quả đang bị tranh chấp'
                  : session.results_status === 'pending_confirmation'
                    ? 'Chủ kèo đã gửi kết quả trận'
                    : 'Chủ kèo chưa gửi kết quả'}
              </Text>
            </View>

            <Text
              style={{ marginTop: 12, fontSize: 14, lineHeight: 22, fontFamily: SCREEN_FONTS.body, color: resultBannerTone.text }}
            >
              {session.results_status === 'disputed'
                ? 'Vào màn xác nhận để xem lại kết quả chủ kèo đã gửi và cập nhật phản hồi của bạn.'
                : session.results_status === 'pending_confirmation'
                  ? 'Bạn cần xác nhận hoặc tranh chấp kết quả trước khi hệ thống chốt trận.'
                  : 'Nếu chủ kèo chưa gửi kết quả đúng hạn, bạn có thể báo kết quả của mình để hệ thống xử lý tiếp.'}
            </Text>

            <TouchableOpacity
              className="mt-4 h-12 items-center justify-center rounded-2xl"
              style={{ backgroundColor: resultBannerTone.button }}
              onPress={() => router.push({ pathname: '/session/[id]/confirm-result' as never, params: { id } })}
              activeOpacity={0.9}
            >
              <Text style={{ fontSize: 14, fontFamily: SCREEN_FONTS.headline, textTransform: 'uppercase', letterSpacing: 1.1, color: PROFILE_THEME_COLORS.onPrimary }}>
                {session.results_status === 'pending_confirmation' || session.results_status === 'disputed'
                  ? 'Xác nhận kết quả'
                  : 'Báo kết quả'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <PlayerRosterSection
          arrangedPlayers={arrangedPlayers}
          maxPlayers={session.max_players}
          sessionStatus={session.status}
          spotsLeft={spotsLeft}
          isHost={isHost}
          isArranging={canArrange ? isArranging : false}
          setIsArranging={canArrange ? setIsArranging : () => {}}
          onAutoBalance={onAutoBalance}
          teamA={teamA}
          teamB={teamB}
          averageTeamA={averageTeamA}
          averageTeamB={averageTeamB}
          renderPlayerRow={renderPlayerRow}
          hideEmptySlots={!isBeforeStart}
        />

        {showBottomActions ? (
          <View style={{ marginTop: 20, paddingBottom: 8 }}>
            {isHost ? (() => {
              const isAwaitingResult =
                isAfterEnd &&
                (session.results_status === 'not_submitted' || session.results_status === null || session.results_status === undefined)

              // After end, no result yet — prompt to enter result
              if (isAwaitingResult) {
                return (
                  <TouchableOpacity
                    onPress={() => router.push({ pathname: '/match-result/[id]' as any, params: { id } })}
                    activeOpacity={0.84}
                    style={{
                      width: '100%',
                      paddingHorizontal: SPACING.md,
                      minHeight: 52,
                      paddingVertical: 11,
                      borderRadius: RADIUS.full,
                      backgroundColor: PROFILE_THEME_COLORS.primary,
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'row',
                      gap: 8,
                    }}
                  >
                    <Trophy size={18} strokeWidth={2.5} color={PROFILE_THEME_COLORS.onPrimary} />
                    <Text style={{ fontSize: 15, fontFamily: SCREEN_FONTS.headline, color: PROFILE_THEME_COLORS.onPrimary, textTransform: 'uppercase' }}>
                      Nhập kết quả trận
                    </Text>
                  </TouchableOpacity>
                )
              }

              // During match — informational disabled banner
              if (isDuringMatch) {
                return (
                  <View
                    style={{
                      width: '100%',
                      paddingHorizontal: SPACING.md,
                      minHeight: 52,
                      paddingVertical: 11,
                      borderRadius: RADIUS.full,
                      backgroundColor: PROFILE_THEME_COLORS.surfaceContainerHigh,
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'row',
                      gap: 8,
                      borderWidth: BORDER.base,
                      borderColor: PROFILE_THEME_COLORS.outlineVariant,
                    }}
                  >
                    <ActivityIndicator size="small" color={PROFILE_THEME_COLORS.primary} />
                    <Text style={{ fontSize: 15, fontFamily: SCREEN_FONTS.headline, color: PROFILE_THEME_COLORS.onSurfaceVariant, textTransform: 'uppercase' }}>
                      Kèo đang diễn ra
                    </Text>
                  </View>
                )
              }

              return (
                <View style={{ width: '100%', flexDirection: 'row', alignSelf: 'center' }}>
                  <TouchableOpacity
                    onPress={() => {
                      if (hostPrimaryMode === 'edit') {
                        router.push({
                          pathname: '/create-session',
                          params: { editSessionId: session.id },
                        } as never)
                        return
                      }
                      if (hostPrimaryMode === 'save') {
                        void onSaveArrangement()
                      }
                    }}
                    disabled={hostPrimaryDisabled}
                    activeOpacity={0.84}
                    style={{
                      flex: 1,
                      paddingHorizontal: SPACING.md,
                      minHeight: 52,
                      paddingVertical: 11,
                      borderRadius: RADIUS.full,
                      backgroundColor: PROFILE_THEME_COLORS.primary,
                      opacity: hostPrimaryDisabled && !savingArrangement ? 0.55 : 1,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      {savingArrangement ? (
                        <ActivityIndicator
                          size="small"
                          color={PROFILE_THEME_COLORS.onPrimary}
                        />
                      ) : hostPrimaryMode === 'edit' ? (
                        <PencilLine
                          size={16}
                          strokeWidth={2.5}
                          color={PROFILE_THEME_COLORS.onPrimary}
                        />
                      ) : hostPrimaryMode === 'save' ? (
                        <Save
                          size={16}
                          strokeWidth={2.5}
                          color={PROFILE_THEME_COLORS.onPrimary}
                        />
                      ) : (
                        <Repeat2
                          size={16}
                          strokeWidth={2.5}
                          color={PROFILE_THEME_COLORS.onPrimary}
                        />
                      )}
                      <Text
                        style={{
                          fontSize: 15,
                          fontFamily: SCREEN_FONTS.headline,
                          color: PROFILE_THEME_COLORS.onPrimary,
                          textTransform: 'uppercase',
                        }}
                      >
                        {savingArrangement
                          ? 'ĐANG LƯU...'
                          : hostPrimaryMode === 'edit'
                            ? 'SỬA KÈO'
                            : hostPrimaryMode === 'save'
                              ? 'LƯU THAY ĐỔI'
                              : 'ĐANG XẾP ĐỘI'}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => void leaveSession()}
                    disabled={hostActionBusy}
                    activeOpacity={0.84}
                    style={{
                      flex: 1,
                      marginLeft: 10,
                      paddingHorizontal: SPACING.md,
                      minHeight: 52,
                      paddingVertical: 11,
                      borderRadius: RADIUS.full,
                      backgroundColor: PROFILE_THEME_SEMANTIC.dangerStrong,
                      opacity: hostActionBusy ? 0.55 : 1,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      {leaving ? (
                        <ActivityIndicator size="small" color={PROFILE_THEME_COLORS.onPrimary} />
                      ) : (
                        <LogOut size={16} strokeWidth={2.5} color={PROFILE_THEME_COLORS.onPrimary} />
                      )}
                      <Text style={{ fontSize: 15, fontFamily: SCREEN_FONTS.headline, color: PROFILE_THEME_COLORS.onPrimary, textTransform: 'uppercase' }}>
                        {leaving ? 'Đang hủy...' : 'Hủy kèo'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )
            })() : hasJoined ? (() => {
              const resultsStatus = session?.results_status
              const isFinalized = resultsStatus === 'finalized'
              const isPendingConfirm = resultsStatus === 'pending_confirmation' || resultsStatus === 'disputed'
              const hasRated = session?.has_rated

              if (isFinalized) {
                const label = hasRated ? 'XEM KẾT QUẢ TRẬN ĐẤU' : 'ĐÁNH GIÁ TRẬN ĐẤU'
                const action = hasRated 
                  ? () => router.push({ pathname: '/session/[id]/confirm-result' as any, params: { id } })
                  : () => router.push({ pathname: '/rate-session/[id]' as any, params: { id } })
                const Icon = hasRated ? CheckCheck : Star

                return (
                  <TouchableOpacity
                    onPress={action}
                    activeOpacity={0.84}
                    style={{
                      alignSelf: 'center',
                      minWidth: 220,
                      paddingHorizontal: SPACING.xl,
                      minHeight: 52,
                      paddingVertical: 11,
                      borderRadius: RADIUS.full,
                      backgroundColor: PROFILE_THEME_COLORS.primary,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Icon size={18} strokeWidth={2.5} color={PROFILE_THEME_COLORS.onPrimary} />
                      <Text style={{ fontSize: 15, fontFamily: SCREEN_FONTS.headline, color: PROFILE_THEME_COLORS.onPrimary, textTransform: 'uppercase' }}>
                        {label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )
              }

              if (isPendingConfirm) {
                const label = isHost ? 'ĐANG CHỜ XÁC NHẬN' : 'XÁC NHẬN KẾT QUẢ'
                const action = () => router.push({ pathname: '/session/[id]/confirm-result' as any, params: { id } })
                const Icon = isHost ? ActivityIndicator : PencilLine

                return (
                  <TouchableOpacity
                    onPress={isHost ? undefined : action}
                    activeOpacity={0.84}
                    style={{
                      alignSelf: 'center',
                      minWidth: 220,
                      paddingHorizontal: SPACING.xl,
                      minHeight: 52,
                      paddingVertical: 11,
                      borderRadius: RADIUS.full,
                      backgroundColor: isHost ? PROFILE_THEME_COLORS.surfaceContainerHigh : PROFILE_THEME_COLORS.primary,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      {isHost ? (
                        <ActivityIndicator size="small" color={PROFILE_THEME_COLORS.outline} />
                      ) : (
                        <PencilLine size={18} strokeWidth={2.5} color={PROFILE_THEME_COLORS.onPrimary} />
                      )}
                      <Text style={{ 
                        fontSize: 15, 
                        fontFamily: SCREEN_FONTS.headline, 
                        color: isHost ? PROFILE_THEME_COLORS.outline : PROFILE_THEME_COLORS.onPrimary, 
                        textTransform: 'uppercase' 
                      }}>
                        {label}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )
              }

              return (
                <TouchableOpacity
                  onPress={() => void leaveSession()}
                  disabled={leaving}
                  activeOpacity={0.84}
                  style={{
                    alignSelf: 'center',
                    minWidth: 190,
                    paddingHorizontal: SPACING.xl,
                    minHeight: 52,
                    paddingVertical: 11,
                    borderRadius: RADIUS.full,
                    backgroundColor: PROFILE_THEME_SEMANTIC.dangerStrong,
                    opacity: leaving ? 0.55 : 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {leaving ? (
                      <ActivityIndicator size="small" color={PROFILE_THEME_COLORS.onPrimary} />
                    ) : (
                      <LogOut size={18} strokeWidth={2.5} color={PROFILE_THEME_COLORS.onPrimary} />
                    )}
                    <Text style={{ fontSize: 15, fontFamily: SCREEN_FONTS.headline, color: PROFILE_THEME_COLORS.onPrimary, textTransform: 'uppercase' }}>
                      {leaving ? 'Đang rời...' : 'Rời kèo'}
                    </Text>
                  </View>
                </TouchableOpacity>
              )
            })() : (
              <SmartJoinButton
                matchStatus={matchStatus}
                requestStatus={requestStatus}
                hostResponseTemplate={hostResponseTemplate}
                loading={joining || requesting}
                onPress={() => handleSmartJoinPress(() => setJoinModalVisible(true))}
              />
            )}
          </View>
        ) : null}
      </ScrollView>

      <JoinRequestModal
        visible={joinModalVisible}
        mode={matchStatus}
        introNote={introNote}
        setIntroNote={setIntroNote}
        loading={requesting}
        onClose={() => setJoinModalVisible(false)}
        onSubmit={() => void sendJoinRequest()}
      />
      <AppDialog visible={dialogConfig !== null} config={dialogConfig} onClose={() => setDialogConfig(null)} />
    </SafeAreaView>
  )
}
