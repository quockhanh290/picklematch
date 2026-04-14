import { router, useLocalSearchParams } from 'expo-router'
import * as Linking from 'expo-linking'
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import {
  ChevronLeft,
  CheckCheck,
  Repeat2,
  Shield,
  Share2,
  ShieldAlert,
} from 'lucide-react-native'
import { useMemo, useState } from 'react'

import { BookingDetailsCard } from '@/components/session/BookingDetailsCard'
import { JoinRequestModal } from '@/components/session/JoinRequestModal'
import { PlayerRosterSection } from '@/components/session/PlayerRosterSection'
import { SessionMetaCard } from '@/components/session/SessionMetaCard'
import { SessionBottomBar } from '@/components/session/SessionBottomBar'
import { useSessionArrangement } from '@/hooks/useSessionArrangement'
import { useSessionDetail } from '@/hooks/useSessionDetail'
import { useSessionJoinActions } from '@/hooks/useSessionJoinActions'
import {
  formatPricePerPerson,
  formatTimeRange,
  getInitials,
  getSessionSkillLabel,
  type ArrangementPlayer,
} from '@/lib/sessionDetail'
import { useAuth } from '@/lib/useAuth'

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { userId } = useAuth()
  const insets = useSafeAreaInsets()

  const [joinModalVisible, setJoinModalVisible] = useState(false)

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
  })


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
        <Text className="text-center text-base font-semibold text-slate-500">Không tìm thấy kèo này.</Text>
      </SafeAreaView>
    )
  }

  const sessionSkillLabel = getSessionSkillLabel(session.elo_min, session.elo_max)
  const spotsLeft = Math.max(0, session.max_players - arrangedPlayers.length)
  const hasBookingDetails = Boolean(
    session.booking_reference || session.booking_name || session.booking_phone || session.booking_notes,
  )
  const viewerSessionPlayer = session.session_players.find((item) => item.player_id === userId) ?? null
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
    return (
      <View
        key={`${mode}-${player.id}`}
        className="rounded-[32px] border border-slate-100 bg-white px-5 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.06)]"
      >
        <View className="flex-row items-center gap-4">
          <View className="relative h-16 w-16 items-center justify-center rounded-full border border-slate-100 bg-slate-100">
            <Text className="text-[18px] font-black text-slate-800">{getInitials(player.name)}</Text>
            <View className="absolute -bottom-1 -right-1 h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-white shadow-sm">
              <Shield size={12} color="#10b981" strokeWidth={2.5} />
            </View>
          </View>

          <View className="flex-1">
            <Text className="text-[17px] font-black text-slate-950">{player.name}</Text>

            <View className="mt-2 flex-row flex-wrap items-center gap-x-3 gap-y-1">
              <Text className="text-[13px] font-bold text-slate-400">{`Elo ${player.elo}`}</Text>
              <Text className="text-[13px] font-black text-orange-500">{player.skillTag}</Text>

              {mode === 'normal' &&
              player.reliability !== null &&
              player.reliability !== undefined ? (
                <Text className="text-[12px] font-semibold text-emerald-600">{`${player.reliability}% uy tín`}</Text>
              ) : null}
            </View>
          </View>

          {mode === 'arranging' ? (
            <TouchableOpacity
              className="h-14 w-14 items-center justify-center rounded-[22px] border border-slate-100 bg-slate-50"
              onPress={() => switchTeam(player.id)}
              activeOpacity={0.9}
            >
              <Repeat2 size={21} color="#4f46e5" strokeWidth={2.5} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <ScrollView
        className="flex-1"
        stickyHeaderIndices={[0]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
        contentContainerStyle={{
          paddingBottom: (isHost || hasJoined || canShowJoinActions ? 112 : 48) + insets.bottom,
          paddingHorizontal: 20,
        }}
      >
        <View className="bg-white/85 pb-4 pt-2">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity
              className="h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white"
              onPress={() => router.back()}
              activeOpacity={0.9}
            >
              <ChevronLeft size={18} color="#0f172a" strokeWidth={2.5} />
            </TouchableOpacity>

            <Text className="text-[13px] font-black uppercase tracking-[0.28em] text-slate-900">Chi tiết kèo</Text>

            <TouchableOpacity
              className="h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white"
              onPress={() => {
                void (async () => {
                  try {
                    const url = Linking.createURL(`/session/${id}`)
                    await Share.share({ message: `Tham gia kèo pickleball này nhé! ${url}` })
                  } catch (error) {
                    console.warn('[SessionDetail] Failed to share session:', error)
                    Alert.alert('Không thể chia sẻ', 'Vui lòng thử lại sau ít phút.')
                  }
                })()
              }}
              activeOpacity={0.9}
            >
              <Share2 size={18} color="#0f172a" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>

        <SessionMetaCard
          sessionSkillLabel={sessionSkillLabel}
          courtBookingStatus={session.court_booking_status}
          courtName={session.slot.court.name}
          courtAddress={session.slot.court.address}
          courtCity={session.slot.court.city}
          timeLabel={formatTimeRange(session.slot.start_time, session.slot.end_time)}
          priceLabel={formatPricePerPerson(session.slot.price, session.max_players)}
        />

        {isHost && hasBookingDetails ? (
          <BookingDetailsCard
            courtBookingStatus={session.court_booking_status}
            bookingReference={session.booking_reference}
            bookingName={session.booking_name}
            bookingPhone={session.booking_phone}
            bookingNotes={session.booking_notes}
          />
        ) : null}

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
                  ? 'Kết quả đang bị tranh chấp'
                  : session.results_status === 'pending_confirmation'
                    ? 'Chủ kèo đã gửi kết quả trận'
                    : 'Chủ kèo chưa gửi kết quả'}
              </Text>
            </View>

            <Text
              className={`mt-3 text-sm leading-6 ${
                session.results_status === 'disputed' ? 'text-rose-700' : 'text-indigo-700'
              }`}
              >
              {session.results_status === 'disputed'
                ? 'Vào màn xác nhận để xem lại kết quả chủ kèo đã gửi và cập nhật phản hồi của bạn.'
                : session.results_status === 'pending_confirmation'
                  ? 'Bạn cần xác nhận hoặc tranh chấp kết quả trước khi hệ thống chốt trận.'
                  : 'Nếu chủ kèo chưa gửi kết quả đúng hạn, bạn có thể báo kết quả của mình để hệ thống xử lý tiếp.'}
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
          isArranging={isArranging}
          setIsArranging={setIsArranging}
          onAutoBalance={onAutoBalance}
          teamA={teamA}
          teamB={teamB}
          averageTeamA={averageTeamA}
          averageTeamB={averageTeamB}
          renderPlayerRow={renderPlayerRow}
        />
      </ScrollView>

      <SessionBottomBar
        visible={isHost || hasJoined || canShowJoinActions}
        bottomInset={insets.bottom}
        isHost={isHost}
        hasJoined={hasJoined}
        arrangementDirty={arrangementDirty}
        savingArrangement={savingArrangement}
        onSaveArrangement={() => void onSaveArrangement()}
        leaving={leaving}
        onLeaveSession={() => void leaveSession()}
        matchStatus={matchStatus}
        requestStatus={requestStatus}
        hostResponseTemplate={hostResponseTemplate}
        loading={joining || requesting}
        onSmartJoinPress={() => handleSmartJoinPress(() => setJoinModalVisible(true))}
      />

      <JoinRequestModal
        visible={joinModalVisible}
        mode={matchStatus}
        introNote={introNote}
        setIntroNote={setIntroNote}
        loading={requesting}
        onClose={() => setJoinModalVisible(false)}
        onSubmit={() => void sendJoinRequest()}
      />
    </SafeAreaView>
  )
}
