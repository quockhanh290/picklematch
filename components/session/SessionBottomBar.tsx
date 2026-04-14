import { ArrowRight } from 'lucide-react-native'
import { Text, TouchableOpacity, View } from 'react-native'

import { SmartJoinButton } from '@/components/session/SmartJoinButton'
import type { MatchStatus } from '@/lib/matchmaking'

type Props = {
  visible: boolean
  bottomInset: number
  isHost: boolean
  hasJoined: boolean
  arrangementDirty: boolean
  savingArrangement: boolean
  onSaveArrangement: () => void
  leaving: boolean
  onLeaveSession: () => void
  matchStatus: MatchStatus
  requestStatus: 'none' | 'pending' | 'accepted' | 'rejected'
  hostResponseTemplate: string | null
  loading: boolean
  onSmartJoinPress: () => void
}

export function SessionBottomBar({
  visible,
  bottomInset,
  isHost,
  hasJoined,
  arrangementDirty,
  savingArrangement,
  onSaveArrangement,
  leaving,
  onLeaveSession,
  matchStatus,
  requestStatus,
  hostResponseTemplate,
  loading,
  onSmartJoinPress,
}: Props) {
  if (!visible) return null
  const shouldShowHostSaveButton = isHost && (arrangementDirty || savingArrangement)

  return (
    <View
      className="border-t border-slate-200 bg-white/95 px-5 pb-4 pt-4"
      style={{ paddingBottom: Math.max(bottomInset, 16) }}
    >
      {shouldShowHostSaveButton ? (
        <TouchableOpacity
          className={`h-14 flex-row items-center justify-center gap-3 rounded-full px-6 ${
            arrangementDirty ? 'bg-[#059669]' : 'bg-emerald-500'
          }`}
          onPress={onSaveArrangement}
          disabled={savingArrangement}
          activeOpacity={0.9}
        >
          <Text className="text-[15px] font-black uppercase tracking-[0.08em] text-white">
            {savingArrangement ? 'ĐANG LƯU...' : 'LƯU THAY ĐỔI'}
          </Text>
          <ArrowRight size={20} color="#ffffff" strokeWidth={2.5} />
        </TouchableOpacity>
      ) : hasJoined ? (
        <TouchableOpacity
          className="h-14 items-center justify-center rounded-2xl border border-rose-100 bg-rose-50"
          onPress={onLeaveSession}
          disabled={leaving}
          activeOpacity={0.9}
        >
          <Text className="text-[15px] font-black uppercase tracking-[0.08em] text-rose-600">
            {leaving ? 'ĐANG RỜI...' : 'RỜI KÈO'}
          </Text>
        </TouchableOpacity>
      ) : (
        <SmartJoinButton
          matchStatus={matchStatus}
          requestStatus={requestStatus}
          hostResponseTemplate={hostResponseTemplate}
          loading={loading}
          onPress={onSmartJoinPress}
        />
      )}
    </View>
  )
}
