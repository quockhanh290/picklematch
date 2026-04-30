import { router } from 'expo-router'
import { AlertTriangle, CheckCheck, Clock3 } from 'lucide-react-native'
import { Pressable, Text, View } from 'react-native'
import { PROFILE_THEME_COLORS, PROFILE_THEME_SEMANTIC } from '@/constants/theme/profileTheme'

import type { PostMatchAction } from '@/lib/homeFeed'

export function PostMatchActionsSection({ items }: { items: PostMatchAction[] }) {
  if (items.length === 0) return null

  return (
    <View
      className="mt-6 rounded-[24px] border p-5"
      style={{ borderColor: PROFILE_THEME_COLORS.outlineVariant, backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest }}
    >
      <Text className="text-[11px] font-black uppercase tracking-[0.16em]" style={{ color: PROFILE_THEME_COLORS.outline }}>Sau trận</Text>
      <Text className="mt-2 text-[24px] font-black" style={{ color: PROFILE_THEME_COLORS.onSurface }}>Việc bạn cần xử lý</Text>

      <View className="mt-4 gap-3">
        {items.map((item) => {
          const isConfirm = item.actionType === 'confirm'
          const tone = isConfirm
            ? {
                icon: PROFILE_THEME_COLORS.onSecondaryFixedVariant,
                cardBg: PROFILE_THEME_COLORS.tertiaryFixed,
                cardBorder: PROFILE_THEME_COLORS.secondaryFixedDim,
                title: PROFILE_THEME_COLORS.onTertiaryFixedVariant,
                button: PROFILE_THEME_COLORS.primaryContainer,
              }
            : {
                icon: PROFILE_THEME_SEMANTIC.warningText,
                cardBg: PROFILE_THEME_COLORS.primaryFixed,
                cardBorder: PROFILE_THEME_COLORS.secondaryFixedDim,
                title: PROFILE_THEME_COLORS.onPrimaryFixedVariant,
                button: PROFILE_THEME_SEMANTIC.warningStrong,
              }

          return (
            <View
              key={`${item.actionType}-${item.id}`}
              className="rounded-[24px] border p-4"
              style={{ borderColor: tone.cardBorder, backgroundColor: tone.cardBg }}
            >
              <View className="flex-row items-start">
                <View
                  className="mt-1 h-11 w-11 items-center justify-center rounded-full"
                  style={{ backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest }}
                >
                  {isConfirm ? (
                    <CheckCheck size={18} color={tone.icon} strokeWidth={2.5} />
                  ) : (
                    <AlertTriangle size={18} color={tone.icon} strokeWidth={2.5} />
                  )}
                </View>

                <View className="ml-3 flex-1">
                  <Text className="text-[15px] font-black" style={{ color: tone.title }}>
                    {isConfirm ? 'Xác nhận kết quả chủ kèo đã gửi' : 'Chủ kèo chưa gửi kết quả, bạn có thể báo trận'}
                  </Text>
                  <Text className="mt-2 text-[15px] font-bold" style={{ color: PROFILE_THEME_COLORS.onSurface }}>{item.courtName}</Text>
                  <View className="mt-2 flex-row items-center">
                    <Clock3 size={14} color={PROFILE_THEME_COLORS.outline} strokeWidth={2.5} />
                    <Text className="ml-2 text-sm font-semibold" style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant }}>{item.timeLabel}</Text>
                  </View>
                </View>
              </View>

              <Pressable
                onPress={() => router.push({ pathname: '/session/[id]/confirm-result' as never, params: { id: item.id } })}
                className="mt-4 h-12 items-center justify-center rounded-full"
                style={{ backgroundColor: tone.button }}
              >
                <Text className="text-[13px] font-black uppercase tracking-[0.08em]" style={{ color: PROFILE_THEME_COLORS.onPrimary }}>
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



