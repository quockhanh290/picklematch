import { EmptyState, ScreenHeader } from '@/components/design'
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
        rightSlot={
          <TouchableOpacity
            onPress={markAllAsRead}
            activeOpacity={0.9}
            disabled={unreadCount === 0}
            className={`rounded-full border p-2 ${unreadCount > 0 ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-100 opacity-60'}`}
          >
            <CheckCircle2 size={20} color="#475569" />
          </TouchableOpacity>
        }
      />

      {notifications.length === 0 ? (
        <View className="px-5 pb-8">
          <EmptyState
            icon={<Bell size={28} color="#64748b" />}
            title="Chưa có thông báo nào"
            description="Khi có yêu cầu tham gia, thay đổi kèo hoặc phản hồi mới, bạn sẽ thấy chúng ở đây."
          />
        </View>
      ) : (
        <View className="mx-5 overflow-hidden rounded-[28px] border border-slate-200 bg-white">
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 8 }}
            renderItem={({ item, index }) => {
              const meta = typeIcon(item.type)
              const Icon = meta.icon
              const isLast = index === notifications.length - 1

              return (
                <TouchableOpacity
                  onPress={() => handleTap(item)}
                  activeOpacity={0.86}
                  className={`relative flex-row items-start gap-3.5 p-4 ${!item.is_read ? 'bg-sky-50/40' : 'bg-white'}`}
                >
                  {!item.is_read ? (
                    <View className="absolute left-1.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-sky-500" />
                  ) : null}

                  <View className={`h-[46px] w-[46px] items-center justify-center rounded-[14px] border ${meta.bg}`} style={{ borderColor: `${meta.color}22` }}>
                    <Icon size={20} color={meta.color} />
                  </View>

                  <View className="flex-1">
                    <View className="mb-1 flex-row items-start justify-between gap-2">
                      <Text
                        className={`flex-1 text-[15px] leading-5 ${
                          item.is_read ? 'font-bold text-slate-700' : 'font-black text-slate-900'
                        }`}
                      >
                        {item.title}
                      </Text>
                      <Text
                        className={`text-[11px] ${
                          item.is_read ? 'font-semibold text-slate-400' : 'font-bold text-sky-600'
                        }`}
                      >
                        {timeAgo(item.created_at)}
                      </Text>
                    </View>

                    <Text className="pr-4 text-[13px] leading-[18px] text-slate-500" numberOfLines={3}>
                      {item.body}
                    </Text>
                  </View>

                  {!isLast ? <View className="absolute bottom-0 left-[74px] right-4 border-b border-slate-100" /> : null}
                </TouchableOpacity>
              )
            }}
          />
        </View>
      )}
    </SafeAreaView>
  )
}
