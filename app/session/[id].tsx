import * as Linking from 'expo-linking'
import { router, useLocalSearchParams } from 'expo-router'
import {
  CheckCheck,
  LogOut,
  PencilLine,
  Repeat2,
  Save,
  Share2,
  ShieldAlert,
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
import { PROFILE_THEME_COLORS } from '@/components/profile/profileTheme'
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
      <SafeAreaView className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#4f46e5" />
      </SafeAreaView>
    )
  }

  if (!session) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-slate-50 px-6">
        <Text className="text-center text-base font-semibold text-slate-500">KhÃ´ng tÃ¬m tháº¥y kÃ¨o nÃ y.</Text>
      </SafeAreaView>
    )
  }

  const sessionSkillBand = getEloBandForSessionRange(session.elo_min, session.elo_max)
  const sessionSkillLabel = sessionSkillBand.shortLabel
  const spotsLeft = Math.max(0, session.max_players - arrangedPlayers.length)
  const viewerSessionPlayer = session.session_players.find((item) => item.player_id === userId) ?? null
  const showBottomActions = isHost || hasJoined || canShowJoinActions
  const hostActionBusy = savingArrangement || leaving
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

  function renderPlayerRow(player: ArrangementPlayer, mode: 'normal' | 'arranging') {
    const levelUi = getSkillLevelUi(player.levelId)
    const LevelIcon = levelUi.icon

    return (
      <View
        key={`${mode}-${player.id}`}
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 28,
          borderWidth: 1,
          borderColor: PROFILE_THEME_COLORS.outlineVariant,
          backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest,
          paddingHorizontal: 18,
          paddingVertical: 14,
          shadowColor: '#0f172a',
          shadowOpacity: 0.05,
          shadowRadius: 12,
          shadowOffset: { width: 0, height: 5 },
          elevation: 2,
        }}
      >
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            right: -14,
            top: -8,
            opacity: 0.12,
          }}
        >
          <LevelIcon size={78} color={PROFILE_THEME_COLORS.primary} />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View
            style={{
              position: 'relative',
              width: 62,
              height: 62,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 999,
              borderWidth: 1,
              borderColor: PROFILE_THEME_COLORS.primary,
              backgroundColor: PROFILE_THEME_COLORS.primary,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontFamily: 'PlusJakartaSans-ExtraBold',
                color: PROFILE_THEME_COLORS.onPrimary,
              }}
            >
              {getInitials(player.name)}
            </Text>
            <View
              style={{
                position: 'absolute',
                right: -3,
                bottom: -3,
                width: 24,
                height: 24,
                borderRadius: 999,
                borderWidth: 2,
                borderColor: PROFILE_THEME_COLORS.surfaceContainerLowest,
                backgroundColor: PROFILE_THEME_COLORS.surfaceContainerHighest,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <LevelIcon size={12} color={levelUi.iconColor} strokeWidth={2.5} />
            </View>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontFamily: 'PlusJakartaSans-ExtraBold', color: PROFILE_THEME_COLORS.onSurface }}>
              {player.name}
            </Text>

            <View style={{ marginTop: 6, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
              <Text style={{ fontSize: 13, fontFamily: 'PlusJakartaSans-ExtraBold', color: PROFILE_THEME_COLORS.surfaceTint }}>
                {player.skillTag}
              </Text>

              {mode === 'normal' &&
              player.reliability !== null &&
              player.reliability !== undefined ? (
                <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans-SemiBold', color: PROFILE_THEME_COLORS.primary }}>
                  {`${player.reliability}% uy tÃ­n`}
                </Text>
              ) : null}
            </View>
          </View>

          {mode === 'arranging' ? (
            <TouchableOpacity
              style={{
                width: 52,
                height: 52,
                borderRadius: 18,
                borderWidth: 1,
                borderColor: PROFILE_THEME_COLORS.outlineVariant,
                backgroundColor: PROFILE_THEME_COLORS.surfaceContainerHigh,
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onPress={() => switchTeam(player.id)}
              activeOpacity={0.9}
            >
              <Repeat2 size={20} color={PROFILE_THEME_COLORS.primary} strokeWidth={2.5} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      {showUpdatedToast ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 10 + insets.top,
            left: 20,
            right: 20,
            zIndex: 20,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: '#B7E6D3',
            backgroundColor: '#ECFDF5',
            paddingHorizontal: 14,
            paddingVertical: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <CheckCheck size={16} color="#065F46" strokeWidth={2.6} />
          <Text
            style={{
              flex: 1,
              fontSize: 13,
              fontFamily: 'PlusJakartaSans-ExtraBold',
              color: '#065F46',
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
          paddingHorizontal: 20,
        }}
      >
        <ScreenHeader
          variant="brand"
          title="KINETIC"
          onBackPress={() => router.back()}
          rightSlot={
            <TouchableOpacity
              className="h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white"
              onPress={() => {
                void (async () => {
                  try {
                    const url = Linking.createURL(`/session/${id}`)
                    await Share.share({ message: `Tham gia kÃ¨o pickleball nÃ y nhÃ©! ${url}` })
                  } catch (error) {
                    console.warn('[SessionDetail] Failed to share session:', error)
                    setDialogConfig({ title: '\u004b\u0068\u00f4\u006e\u0067\u0020\u0074\u0068\u1ec3\u0020\u0063\u0068\u0069\u0061\u0020\u0073\u1ebb', message: '\u0056\u0075\u0069\u0020\u006c\u00f2\u006e\u0067\u0020\u0074\u0068\u1eed\u0020\u006c\u1ea1\u0069\u0020\u0073\u0061\u0075\u0020\u00ed\u0074\u0020\u0070\u0068\u00fa\u0074\u002e', actions: [{ label: '\u0110\u00f3\u006e\u0067', tone: 'secondary' }] })
                  }
                })()
              }}
              activeOpacity={0.9}
            >
              <Share2 size={18} color="#006948" strokeWidth={2.5} />
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
        />

        {canRespondToResult ? (
          <View
            className={`mt-5 rounded-[32px] border px-5 py-5 ${
              session.results_status === 'disputed' ? 'border-rose-200 bg-rose-50' : 'border-indigo-200 bg-indigo-50'
            }`}
          >
            <View className="flex-row items-center">
              {session.results_status === 'disputed' ? (
                <ShieldAlert size={18} color="#be123c" strokeWidth={2.5} />
              ) : (
                <CheckCheck size={18} color="#4338ca" strokeWidth={2.5} />
              )}
              <Text
                className={`ml-2 text-[15px] font-black ${
                  session.results_status === 'disputed' ? 'text-rose-700' : 'text-indigo-700'
                }`}
              >
                {session.results_status === 'disputed'
                  ? 'Káº¿t quáº£ Ä‘ang bá»‹ tranh cháº¥p'
                  : session.results_status === 'pending_confirmation'
                    ? 'Chá»§ kÃ¨o Ä‘Ã£ gá»­i káº¿t quáº£ tráº­n'
                    : 'Chá»§ kÃ¨o chÆ°a gá»­i káº¿t quáº£'}
              </Text>
            </View>

            <Text
              className={`mt-3 text-sm leading-6 ${
                session.results_status === 'disputed' ? 'text-rose-700' : 'text-indigo-700'
              }`}
              >
              {session.results_status === 'disputed'
                ? 'VÃ o mÃ n xÃ¡c nháº­n Ä‘á»ƒ xem láº¡i káº¿t quáº£ chá»§ kÃ¨o Ä‘Ã£ gá»­i vÃ  cáº­p nháº­t pháº£n há»“i cá»§a báº¡n.'
                : session.results_status === 'pending_confirmation'
                  ? 'Báº¡n cáº§n xÃ¡c nháº­n hoáº·c tranh cháº¥p káº¿t quáº£ trÆ°á»›c khi há»‡ thá»‘ng chá»‘t tráº­n.'
                  : 'Náº¿u chá»§ kÃ¨o chÆ°a gá»­i káº¿t quáº£ Ä‘Ãºng háº¡n, báº¡n cÃ³ thá»ƒ bÃ¡o káº¿t quáº£ cá»§a mÃ¬nh Ä‘á»ƒ há»‡ thá»‘ng xá»­ lÃ½ tiáº¿p.'}
            </Text>

            <TouchableOpacity
              className={`mt-4 h-12 items-center justify-center rounded-2xl ${
                session.results_status === 'disputed' ? 'bg-rose-600' : 'bg-indigo-600'
              }`}
              onPress={() => router.push({ pathname: '/session/[id]/confirm-result' as never, params: { id } })}
              activeOpacity={0.9}
            >
              <Text className="text-[14px] font-black uppercase tracking-[0.08em] text-white">
                {session.results_status === 'pending_confirmation' || session.results_status === 'disputed'
                  ? 'XÃ¡c nháº­n káº¿t quáº£'
                  : 'BÃ¡o káº¿t quáº£'}
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
          isArranging={isArranging}
          setIsArranging={setIsArranging}
          onAutoBalance={onAutoBalance}
          teamA={teamA}
          teamB={teamB}
          averageTeamA={averageTeamA}
          averageTeamB={averageTeamB}
          renderPlayerRow={renderPlayerRow}
        />

        {showBottomActions ? (
          <View style={{ marginTop: 20, paddingBottom: 8 }}>
            {isHost ? (
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
                  paddingHorizontal: 14,
                  minHeight: 52,
                  paddingVertical: 11,
                  borderRadius: 999,
                  borderWidth: 1.5,
                  borderColor: PROFILE_THEME_COLORS.primary,
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
                      fontFamily: 'PlusJakartaSans-ExtraBold',
                      color: PROFILE_THEME_COLORS.onPrimary,
                    }}
                  >
                    {savingArrangement
                      ? '\u0110ang l\u01B0u...'
                      : hostPrimaryMode === 'edit'
                        ? 'S\u1EEDa k\u00E8o'
                        : hostPrimaryMode === 'save'
                          ? 'L\u01B0u thay \u0111\u1ED5i'
                          : '\u0110ang x\u1EBFp \u0111\u1ED9i'}
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
                    paddingHorizontal: 14,
                  minHeight: 52,
                  paddingVertical: 11,
                  borderRadius: 999,
                  borderWidth: 1.5,
                  borderColor: '#e11d48',
                  backgroundColor: '#e11d48',
                  opacity: hostActionBusy ? 0.55 : 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {leaving ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <LogOut size={16} strokeWidth={2.5} color="#ffffff" />
                  )}
                  <Text style={{ fontSize: 15, fontFamily: 'PlusJakartaSans-ExtraBold', color: '#ffffff' }}>
                    {leaving ? '\u0110ang h\u1EE7y...' : 'H\u1EE7y k\u00E8o'}
                  </Text>
                </View>
                </TouchableOpacity>
              </View>
            ) : hasJoined ? (
              <TouchableOpacity
                onPress={() => void leaveSession()}
                disabled={leaving}
                activeOpacity={0.84}
                style={{
                  alignSelf: 'center',
                  minWidth: 190,
                  paddingHorizontal: 20,
                  minHeight: 52,
                  paddingVertical: 11,
                  borderRadius: 999,
                  borderWidth: 2,
                  borderColor: '#e11d48',
                  backgroundColor: '#e11d48',
                  opacity: leaving ? 0.55 : 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  {leaving ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <LogOut size={18} strokeWidth={2.5} color="#ffffff" />
                  )}
                  <Text style={{ fontSize: 15, fontFamily: 'PlusJakartaSans-ExtraBold', color: '#ffffff' }}>
                    {leaving ? '\u0110ang r\u1EDDi...' : 'R\u1EDDi k\u00E8o'}
                  </Text>
                </View>
              </TouchableOpacity>
            ) : (
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
