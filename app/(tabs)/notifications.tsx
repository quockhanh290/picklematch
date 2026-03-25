import { AppButton, EmptyState, ScreenHeader, SectionCard } from '@/components/design'
import type { Notification } from '@/hooks/useNotifications'
import { useNotificationsContext } from '@/lib/NotificationsContext'
import { router } from 'expo-router'
import type { LucideIcon } from 'lucide-react-native'
import {
  Bell,
  CheckCircle2,
  DoorOpen,
  MessageCircleMore,
  Megaphone,
  ShieldAlert,
  UserPlus,
  XCircle,
} from 'lucide-react-native'
import { FlatList, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'vừa xong'
  if (mins < 60) return `${mins} phút trước`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} giờ trước`
  const days = Math.floor(hrs / 24)
  return `${days} ngày trước`
}

function typeIcon(type: string): { icon: LucideIcon; color: string; bg: string } {
  if (type === 'join_request') return { icon: UserPlus, color: '#2563eb', bg: 'bg-blue-50' }
  if (type === 'join_approved') return { icon: CheckCircle2, color: '#059669', bg: 'bg-emerald-50' }
  if (type === 'join_rejected') return { icon: XCircle, color: '#dc2626', bg: 'bg-rose-50' }
  if (type === 'player_left') return { icon: DoorOpen, color: '#ea580c', bg: 'bg-orange-50' }
  if (type === 'session_cancelled') return { icon: Megaphone, color: '#be123c', bg: 'bg-rose-50' }
  if (type === 'session_updated') return { icon: ShieldAlert, color: '#7c3aed', bg: 'bg-violet-50' }
  if (type === 'join_request_reply') return { icon: MessageCircleMore, color: '#0f766e', bg: 'bg-teal-50' }
  return { icon: Bell, color: '#475569', bg: 'bg-slate-100' }
}

export default function NotificationsScreen() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationsContext()

  async function handleTap(notification: Notification) {
    if (!notification.is_read) await markAsRead(notification.id)
    if (notification.deep_link) router.push(notification.deep_link as any)
  }

  return (
    <SafeAreaView className="flex-1 bg-stone-100" edges={['top']}>
      <ScreenHeader
        eyebrow="Hộp thư"
        title="Thông báo"
        subtitle="Theo dõi các cập nhật mới nhất về kèo, phản hồi từ host và thay đổi trạng thái tham gia."
        rightSlot={
          unreadCount > 0 ? (
            <View className="min-w-[36px] items-center rounded-full bg-emerald-100 px-3 py-1.5">
              <Text className="text-xs font-extrabold text-emerald-700">{unreadCount}</Text>
            </View>
          ) : null
        }
      />

      {unreadCount > 0 ? (
        <View className="px-5 pb-4">
          <AppButton label="Đọc tất cả" onPress={markAllAsRead} variant="secondary" />
        </View>
      ) : null}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
        ListEmptyComponent={
          <EmptyState
            icon={<Bell size={28} color="#64748b" />}
            title="Chưa có thông báo nào"
            description="Khi có yêu cầu tham gia, thay đổi kèo hoặc phản hồi mới, bạn sẽ thấy chúng ở đây."
          />
        }
        renderItem={({ item }) => {
          const meta = typeIcon(item.type)
          const Icon = meta.icon

          return (
            <TouchableOpacity onPress={() => handleTap(item)} activeOpacity={0.86} className="mb-3">
              <SectionCard className={item.is_read ? '' : 'border border-emerald-100 bg-emerald-50/60'}>
                <View className="flex-row items-start">
                  <View className={`mr-3 h-12 w-12 items-center justify-center rounded-2xl ${meta.bg}`}>
                    <Icon size={20} color={meta.color} />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-start justify-between">
                      <Text
                        className={`flex-1 pr-3 text-base ${
                          item.is_read ? 'font-semibold text-slate-800' : 'font-extrabold text-slate-950'
                        }`}
                      >
                        {item.title}
                      </Text>
                      {!item.is_read ? <View className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-500" /> : null}
                    </View>
                    <Text className="mt-2 text-sm leading-6 text-slate-500" numberOfLines={3}>
                      {item.body}
                    </Text>
                    <Text className="mt-3 text-xs font-semibold uppercase tracking-[1px] text-slate-400">
                      {timeAgo(item.created_at)}
                    </Text>
                  </View>
                </View>
              </SectionCard>
            </TouchableOpacity>
          )
        }}
      />
    </SafeAreaView>
  )
}
