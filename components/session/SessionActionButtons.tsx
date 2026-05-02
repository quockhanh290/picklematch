import React from 'react'
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native'
import { LogOut, PencilLine, Repeat2, Save, Star, Trophy, CheckCheck, ShieldAlert, CheckCircle2 } from 'lucide-react-native'
import { router } from 'expo-router'
import { PROFILE_THEME_COLORS, PROFILE_THEME_SEMANTIC } from '@/constants/profileTheme'
import { SCREEN_FONTS } from '@/constants/typography'
import { RADIUS, SPACING, BORDER } from '@/constants/screenLayout'

interface SessionActionButtonsProps {
  id: string
  session: any
  isHost: boolean
  hasJoined: boolean
  isAfterEnd: boolean
  isDuringMatch: boolean
  isCancelled: boolean
  viewerSessionPlayer: any
  hostPrimaryMode: 'edit' | 'arranging' | 'save'
  hostPrimaryDisabled: boolean
  hostActionBusy: boolean
  savingArrangement: boolean
  leaving: boolean
  onSaveArrangement: () => void
  leaveSession: () => void
}

const PartialPlayerWarning = ({ count, max }: { count: number; max: number }) => (
  <View 
    style={{ 
      marginBottom: 12, 
      padding: 12, 
      borderRadius: RADIUS.md, 
      backgroundColor: '#FFF9E6', 
      borderWidth: 1, 
      borderColor: '#FFE082',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10
    }}
  >
    <ShieldAlert size={20} color="#F57C00" />
    <Text style={{ flex: 1, fontSize: 13, fontFamily: SCREEN_FONTS.body, color: '#5D4037' }}>
      Trận đấu chỉ có {count}/{max} người. Nếu trận đấu vẫn diễn ra, bạn có thể tiếp tục báo kết quả.
    </Text>
  </View>
)

export const SessionActionButtons: React.FC<SessionActionButtonsProps> = ({
  id,
  session,
  isHost,
  hasJoined,
  isAfterEnd,
  isDuringMatch,
  isCancelled,
  viewerSessionPlayer,
  hostPrimaryMode,
  hostPrimaryDisabled,
  hostActionBusy,
  savingArrangement,
  leaving,
  onSaveArrangement,
  leaveSession,
}) => {
  const resultsStatus = session?.results_status
  const isFinalized = resultsStatus === 'finalized'
  const isPendingConfirm = resultsStatus === 'pending_confirmation' || resultsStatus === 'disputed'
  const hasRated = session?.has_rated
  
  const confirmedPlayerCount = (session?.session_players ?? []).filter((p: any) => p.status === 'confirmed').length
  const maxPlayers = Number(session?.max_players || 0)
  
  // Logic: 
  // - Must have at least 2 players.
  // - Must have an even number of players.
  // - Must not exceed max_players.
  const isEven = confirmedPlayerCount % 2 === 0
  const isValidCount = confirmedPlayerCount >= 2 && isEven && confirmedPlayerCount <= maxPlayers
    
  const sessionStatus = session?.status
  const isEnded = isAfterEnd || sessionStatus === 'done' || sessionStatus === 'pending_completion' || sessionStatus === 'pending_results'
  const isInvalidPlayerCount = isEnded && !isValidCount
  const isPartialPlayerCount = isEnded && isValidCount && confirmedPlayerCount < maxPlayers

  // Top-level block: If cancelled or invalid player count, show banner and STOP.
  if (isCancelled || (isInvalidPlayerCount && !isFinalized && !isPendingConfirm)) {
    return (
      <View
        style={{
          width: '100%',
          minHeight: 52,
          paddingVertical: 11,
          borderRadius: RADIUS.md,
          backgroundColor: PROFILE_THEME_SEMANTIC.dangerBg,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: BORDER.base,
          borderColor: PROFILE_THEME_SEMANTIC.dangerBorderSoft,
        }}
      >
        <Text
          style={{
            fontSize: 15,
            fontFamily: SCREEN_FONTS.headline,
            color: PROFILE_THEME_SEMANTIC.dangerText,
            textTransform: 'uppercase',
          }}
        >
          {isInvalidPlayerCount ? 'Kèo bị hủy do không đủ người' : 'Kèo đã bị hủy'}
        </Text>
      </View>
    )
  }

  if (isHost) {
    const isResultSubmitted = resultsStatus === 'pending_confirmation' || resultsStatus === 'disputed'
    const isAwaitingResult =
      isAfterEnd &&
      (resultsStatus === 'not_submitted' || resultsStatus === null || resultsStatus === undefined)

    if (isAfterEnd && !session?.is_ranked) {
      return (
        <View
          style={{
            width: '100%',
            minHeight: 52,
            paddingVertical: 11,
            borderRadius: RADIUS.md,
            backgroundColor: PROFILE_THEME_COLORS.surfaceContainerHigh,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: BORDER.base,
            borderColor: PROFILE_THEME_COLORS.outlineVariant,
          }}
        >
          <Text
            style={{
              fontSize: 15,
              fontFamily: SCREEN_FONTS.headline,
              color: PROFILE_THEME_COLORS.outline,
              textTransform: 'uppercase',
            }}
          >
            Kèo đã kết thúc
          </Text>
        </View>
      )
    }

    if (isFinalized) {
      const label = hasRated ? 'XEM KẾT QUẢ TRẬN' : 'ĐÁNH GIÁ TRẬN ĐẤU'
      const action = hasRated
        ? () => router.push({ pathname: '/match-result/[id]' as any, params: { id } })
        : () => router.push({ pathname: '/rate-session/[id]' as any, params: { id } })
      const Icon = hasRated ? Trophy : Star

      return (
        <TouchableOpacity
          onPress={action}
          activeOpacity={0.84}
          style={{
            alignSelf: 'center',
            paddingHorizontal: SPACING.xl,
            minHeight: 52,
            paddingVertical: 11,
            borderRadius: RADIUS.md,
            backgroundColor: PROFILE_THEME_COLORS.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon size={18} strokeWidth={2.5} color={PROFILE_THEME_COLORS.onPrimary} />
            <Text
              style={{
                fontSize: 15,
                fontFamily: SCREEN_FONTS.headline,
                color: PROFILE_THEME_COLORS.onPrimary,
                textTransform: 'uppercase',
              }}
            >
              {label}
            </Text>
          </View>
        </TouchableOpacity>
      )
    }

    if (isResultSubmitted) {
      const isDisputed = resultsStatus === 'disputed'
      return (
        <TouchableOpacity
          onPress={() => {
            if (isDisputed) {
              router.push({ pathname: '/match-result/[id]' as any, params: { id } })
            }
          }}
          activeOpacity={0.84}
          style={{
            alignSelf: 'center',
            paddingHorizontal: SPACING.xl,
            minHeight: 52,
            paddingVertical: 11,
            borderRadius: RADIUS.md,
            backgroundColor: isDisputed ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.surfaceContainerHigh,
            borderWidth: BORDER.base,
            borderColor: isDisputed ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.outlineVariant,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {isDisputed ? (
              <PencilLine size={18} strokeWidth={2.5} color={PROFILE_THEME_COLORS.onPrimary} />
            ) : (
              <ActivityIndicator size="small" color={PROFILE_THEME_COLORS.outline} />
            )}
            <Text
              style={{
                fontSize: 15,
                fontFamily: SCREEN_FONTS.headline,
                color: isDisputed ? PROFILE_THEME_COLORS.onPrimary : PROFILE_THEME_COLORS.outline,
                textTransform: 'uppercase',
              }}
            >
              {isDisputed ? 'Sửa kết quả' : 'Đang chờ xác nhận'}
            </Text>
          </View>
        </TouchableOpacity>
      )
    }

    if (isAwaitingResult && !isInvalidPlayerCount) {
      return (
        <>
          {isPartialPlayerCount && <PartialPlayerWarning count={confirmedPlayerCount} max={maxPlayers} />}
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/match-result/[id]' as any, params: { id } })}
            activeOpacity={0.84}
            style={{
              width: '100%',
              paddingHorizontal: SPACING.md,
              minHeight: 52,
              paddingVertical: 11,
              borderRadius: RADIUS.md,
              backgroundColor: PROFILE_THEME_COLORS.primary,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              gap: 8,
            }}
          >
            <Trophy size={18} strokeWidth={2.5} color={PROFILE_THEME_COLORS.onPrimary} />
            <Text
              style={{
                fontSize: 15,
                fontFamily: SCREEN_FONTS.headline,
                color: PROFILE_THEME_COLORS.onPrimary,
                textTransform: 'uppercase',
              }}
            >
              Nhập kết quả trận
            </Text>
          </TouchableOpacity>
        </>
      )
    }

    if (isDuringMatch) {
      return (
        <View
          style={{
            width: '100%',
            paddingHorizontal: SPACING.md,
            minHeight: 52,
            paddingVertical: 11,
            borderRadius: RADIUS.md,
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
          <Text
            style={{
              fontSize: 15,
              fontFamily: SCREEN_FONTS.headline,
              color: PROFILE_THEME_COLORS.onSurfaceVariant,
              textTransform: 'uppercase',
            }}
          >
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
              onSaveArrangement()
            }
          }}
          disabled={hostPrimaryDisabled}
          activeOpacity={0.84}
          style={{
            flex: 1,
            paddingHorizontal: SPACING.md,
            minHeight: 52,
            paddingVertical: 11,
            borderRadius: RADIUS.md,
            backgroundColor: PROFILE_THEME_COLORS.primary,
            opacity: hostPrimaryDisabled && !savingArrangement ? 0.55 : 1,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {savingArrangement ? (
              <ActivityIndicator size="small" color={PROFILE_THEME_COLORS.onPrimary} />
            ) : hostPrimaryMode === 'edit' ? (
              <PencilLine size={16} strokeWidth={2.5} color={PROFILE_THEME_COLORS.onPrimary} />
            ) : hostPrimaryMode === 'save' ? (
              <Save size={16} strokeWidth={2.5} color={PROFILE_THEME_COLORS.onPrimary} />
            ) : (
              <Repeat2 size={16} strokeWidth={2.5} color={PROFILE_THEME_COLORS.onPrimary} />
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
          onPress={leaveSession}
          disabled={hostActionBusy}
          activeOpacity={0.84}
          style={{
            flex: 1,
            marginLeft: 10,
            paddingHorizontal: SPACING.md,
            minHeight: 52,
            paddingVertical: 11,
            borderRadius: RADIUS.md,
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
            <Text
              style={{
                fontSize: 15,
                fontFamily: SCREEN_FONTS.headline,
                color: PROFILE_THEME_COLORS.onPrimary,
                textTransform: 'uppercase',
              }}
            >
              {leaving ? 'Đang hủy...' : 'Hủy kèo'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    )
  }

  if (hasJoined) {
    if (isAfterEnd && !session?.is_ranked) {
      return (
        <View
          style={{
            alignSelf: 'center',
            paddingHorizontal: SPACING.xl,
            minHeight: 52,
            paddingVertical: 11,
            borderRadius: RADIUS.md,
            backgroundColor: PROFILE_THEME_COLORS.surfaceContainerHigh,
            borderWidth: BORDER.base,
            borderColor: PROFILE_THEME_COLORS.outlineVariant,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 15, fontFamily: SCREEN_FONTS.headline, color: PROFILE_THEME_COLORS.outline, textTransform: 'uppercase' }}>
            Kèo đã kết thúc
          </Text>
        </View>
      )
    }

    if (isFinalized) {
      const label = hasRated ? 'XEM KẾT QUẢ TRẬN ĐẤU' : 'ĐÁNH GIÁ TRẬN ĐẤU'
      const action = !hasRated 
        ? () => router.push({ pathname: '/rate-session/[id]' as any, params: { id } })
        : () => router.push({ pathname: '/session/[id]/confirm-result' as any, params: { id } })
      const Icon = hasRated ? CheckCheck : Star

      return (
        <TouchableOpacity
          onPress={action}
          activeOpacity={0.84}
          style={{
            alignSelf: 'center',
            paddingHorizontal: SPACING.xl,
            minHeight: 52,
            paddingVertical: 11,
            borderRadius: RADIUS.md,
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

    const hasConfirmed = viewerSessionPlayer?.result_confirmation_status === 'confirmed' || viewerSessionPlayer?.result_confirmation_status === 'disputed'

    if (isPendingConfirm || (hasConfirmed && !isFinalized)) {
      const label = hasConfirmed ? 'XEM KẾT QUẢ' : 'XÁC NHẬN KẾT QUẢ'
      const action = () => router.push({ pathname: '/session/[id]/confirm-result' as any, params: { id } })
      const Icon = hasConfirmed ? CheckCircle2 : PencilLine

      return (
        <TouchableOpacity
          onPress={action}
          activeOpacity={0.84}
          style={{
            alignSelf: 'center',
            paddingHorizontal: SPACING.xl,
            minHeight: 52,
            paddingVertical: 11,
            borderRadius: RADIUS.md,
            backgroundColor: hasConfirmed ? PROFILE_THEME_COLORS.surfaceContainerHigh : PROFILE_THEME_COLORS.primary,
            borderWidth: hasConfirmed ? BORDER.base : 0,
            borderColor: hasConfirmed ? PROFILE_THEME_COLORS.outlineVariant : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Icon size={18} strokeWidth={2.5} color={hasConfirmed ? PROFILE_THEME_COLORS.outline : PROFILE_THEME_COLORS.onPrimary} />
            <Text style={{ 
              fontSize: 15, 
              fontFamily: SCREEN_FONTS.headline, 
              color: hasConfirmed ? PROFILE_THEME_COLORS.outline : PROFILE_THEME_COLORS.onPrimary, 
              textTransform: 'uppercase' 
            }}>
              {label}
            </Text>
          </View>
        </TouchableOpacity>
      )
    }

    if (isAfterEnd) {
      return (
        <View
          style={{
            alignSelf: 'center',
            paddingHorizontal: SPACING.xl,
            minHeight: 52,
            paddingVertical: 11,
            borderRadius: RADIUS.md,
            backgroundColor: PROFILE_THEME_COLORS.surfaceContainerHigh,
            borderWidth: BORDER.base,
            borderColor: PROFILE_THEME_COLORS.outlineVariant,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <ActivityIndicator size="small" color={PROFILE_THEME_COLORS.outline} />
            <Text style={{ fontSize: 15, fontFamily: SCREEN_FONTS.headline, color: PROFILE_THEME_COLORS.outline, textTransform: 'uppercase' }}>
              {isInvalidPlayerCount ? 'Kèo bị hủy do thiếu người' : 'Chờ báo kết quả'}
            </Text>
          </View>
        </View>
      )
    }

    if (isDuringMatch) {
      return (
        <View
          style={{
            alignSelf: 'center',
            paddingHorizontal: SPACING.xl,
            minHeight: 52,
            paddingVertical: 11,
            borderRadius: RADIUS.md,
            backgroundColor: PROFILE_THEME_COLORS.surfaceContainerHigh,
            borderWidth: BORDER.base,
            borderColor: PROFILE_THEME_COLORS.outlineVariant,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <ActivityIndicator size="small" color={PROFILE_THEME_COLORS.outline} />
            <Text style={{ fontSize: 15, fontFamily: SCREEN_FONTS.headline, color: PROFILE_THEME_COLORS.outline, textTransform: 'uppercase' }}>
              Kèo đang diễn ra
            </Text>
          </View>
        </View>
      )
    }
  }

  return null
}
