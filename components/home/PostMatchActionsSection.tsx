import { router } from 'expo-router'
import { AlertTriangle, CheckCheck, Clock3 } from 'lucide-react-native'
import { Pressable, Text, View } from 'react-native'

import type { PostMatchAction } from '@/lib/homeFeed'

export function PostMatchActionsSection({ items }: { items: PostMatchAction[] }) {
  if (items.length === 0) return null

  return (
    <View className="mt-6 rounded-[32px] border border-slate-200 bg-white p-5">
      <Text className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Sau trận</Text>
      <Text className="mt-2 text-[24px] font-black text-slate-950">Việc bạn cần xử lý</Text>

      <View className="mt-4 gap-3">
        {items.map((item) => {
          const isConfirm = item.actionType === 'confirm'
          const iconColor = isConfirm ? '#4338ca' : '#b45309'
          const cardClasses = isConfirm ? 'border-indigo-200 bg-indigo-50' : 'border-amber-200 bg-amber-50'
          const buttonClasses = isConfirm ? 'bg-indigo-600' : 'bg-amber-500'

          return (
            <View key={`${item.actionType}-${item.id}`} className={`rounded-[28px] border p-4 ${cardClasses}`}>
              <View className="flex-row items-start">
                <View className="mt-1 h-11 w-11 items-center justify-center rounded-full bg-white/90">
                  {isConfirm ? (
                    <CheckCheck size={18} color={iconColor} strokeWidth={2.5} />
                  ) : (
                    <AlertTriangle size={18} color={iconColor} strokeWidth={2.5} />
                  )}
                </View>

                <View className="ml-3 flex-1">
                  <Text className={`text-[15px] font-black ${isConfirm ? 'text-indigo-700' : 'text-amber-700'}`}>
                    {isConfirm ? 'Xác nhận kết quả host đã gửi' : 'Host chưa gửi kết quả, bạn có thể báo trận'}
                  </Text>
                  <Text className="mt-2 text-[15px] font-bold text-slate-950">{item.courtName}</Text>
                  <View className="mt-2 flex-row items-center">
                    <Clock3 size={14} color="#64748b" strokeWidth={2.5} />
                    <Text className="ml-2 text-sm font-semibold text-slate-500">{item.timeLabel}</Text>
                  </View>
                </View>
              </View>

              <Pressable
                onPress={() => router.push({ pathname: '/session/[id]/confirm-result' as never, params: { id: item.id } })}
                className={`mt-4 h-12 items-center justify-center rounded-2xl ${buttonClasses}`}
              >
                <Text className="text-[13px] font-black uppercase tracking-[0.08em] text-white">
                  {isConfirm ? 'Mở xác nhận' : 'Báo kết quả'}
                </Text>
              </Pressable>
            </View>
          )
        })}
      </View>
    </View>
  )
}
