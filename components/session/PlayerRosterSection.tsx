import { Repeat2 } from 'lucide-react-native'
import { Text, TouchableOpacity, View } from 'react-native'

import type { ArrangementPlayer } from '@/lib/sessionDetail'

type Props = {
  arrangedPlayers: ArrangementPlayer[]
  maxPlayers: number
  sessionStatus: string
  spotsLeft: number
  isHost: boolean
  isArranging: boolean
  setIsArranging: (value: boolean | ((prev: boolean) => boolean)) => void
  onAutoBalance: () => void
  teamA: ArrangementPlayer[]
  teamB: ArrangementPlayer[]
  averageTeamA: number
  averageTeamB: number
  renderPlayerRow: (player: ArrangementPlayer, mode: 'normal' | 'arranging') => React.ReactNode
}

export function PlayerRosterSection({
  arrangedPlayers,
  maxPlayers,
  sessionStatus,
  spotsLeft,
  isHost,
  isArranging,
  setIsArranging,
  onAutoBalance,
  teamA,
  teamB,
  averageTeamA,
  averageTeamB,
  renderPlayerRow,
}: Props) {
  return (
    <>
      <View className="mt-6 flex-row items-center justify-between gap-3">
        <View className="flex-1">
          <Text className="text-[22px] font-black text-slate-950">{`Người chơi • ${arrangedPlayers.length}/${maxPlayers}`}</Text>
          {sessionStatus === 'open' && spotsLeft > 0 ? (
            <Text className="mt-1 text-[13px] font-bold text-emerald-600">
              {spotsLeft === 1 ? 'Còn 1 chỗ cuối' : `Còn ${spotsLeft} chỗ trống`}
            </Text>
          ) : (
            <Text className="mt-1 text-[13px] font-medium text-slate-500">Danh sách hiện tại của kèo này.</Text>
          )}
        </View>

        {isHost ? (
          <TouchableOpacity
            className={`min-w-[140px] flex-row items-center justify-center rounded-[24px] px-5 py-4 shadow-sm ${
              isArranging ? 'bg-slate-900' : 'bg-slate-100'
            }`}
            onPress={() => setIsArranging((prev) => !prev)}
            activeOpacity={0.9}
          >
            {isArranging ? <Repeat2 size={16} color="#ffffff" strokeWidth={2.5} /> : null}
            <Text className={`text-[12px] font-black uppercase tracking-[0.08em] ${isArranging ? 'text-white' : 'text-slate-700'}`}>
              {isArranging ? ' XONG' : 'Sắp xếp đội'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {isHost && isArranging ? (
        <View className="mt-4 gap-3">
          <View className="rounded-[28px] border border-dashed border-indigo-200 bg-indigo-50 px-5 py-5">
            <Text className="text-[13px] leading-7 text-indigo-600">
              Nhấn vào biểu tượng đổi đội để chuyển người chơi giữa Team A và Team B.
            </Text>
          </View>

          <TouchableOpacity
            className="self-start rounded-[20px] bg-indigo-600 px-5 py-3 shadow-sm"
            onPress={onAutoBalance}
            activeOpacity={0.9}
          >
            <Text className="text-[12px] font-black uppercase tracking-[0.08em] text-white">Chia đội tự động</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View className="mt-3">
        {isArranging ? (
          <View className="mt-6 gap-6">
            <View>
              <View className="mb-4 flex-row items-center justify-between px-2">
                <Text className="text-[18px] font-black uppercase tracking-[0.14em] text-slate-900">ĐỘI A</Text>
                <View className="rounded-2xl border border-slate-200 bg-white px-4 py-2">
                  <Text className="text-[12px] font-black uppercase tracking-[0.04em] text-slate-400">{`ELO TB: ${averageTeamA}`}</Text>
                </View>
              </View>
              <View className="gap-3">
                {teamA.length > 0 ? teamA.map((player) => renderPlayerRow(player, 'arranging')) : null}
              </View>
            </View>

            <View>
              <View className="mb-4 flex-row items-center justify-between px-2">
                <Text className="text-[18px] font-black uppercase tracking-[0.14em] text-slate-900">ĐỘI B</Text>
                <View className="rounded-2xl border border-slate-200 bg-white px-4 py-2">
                  <Text className="text-[12px] font-black uppercase tracking-[0.04em] text-slate-400">{`ELO TB: ${averageTeamB}`}</Text>
                </View>
              </View>
              <View className="gap-3">
                {teamB.length > 0 ? teamB.map((player) => renderPlayerRow(player, 'arranging')) : null}
              </View>
            </View>
          </View>
        ) : (
          <View className="gap-3">
            {arrangedPlayers.map((player) => renderPlayerRow(player, 'normal'))}

            {Array.from({ length: spotsLeft }).map((_, index) => (
              <View
                key={`empty-slot-${index}`}
                className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5"
              >
                <View className="flex-row items-center gap-3">
                  <View className="h-14 w-14 items-center justify-center rounded-full border border-dashed border-slate-300 bg-white">
                    <Text className="text-[18px] font-black text-slate-400">?</Text>
                  </View>
                  <Text className="text-[14px] font-bold text-slate-400">Chờ người chơi...</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </>
  )
}
