import { router } from 'expo-router'
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useNotificationsContext } from '@/lib/NotificationsContext'
import type { Notification } from '@/hooks/useNotifications'

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

function typeIcon(type: string) {
  if (type === 'join_request') return '🙋'
  if (type === 'join_approved') return '✅'
  if (type === 'join_rejected') return '❌'
  return '🔔'
}

export default function NotificationsScreen() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationsContext()

  async function handleTap(n: Notification) {
    if (!n.is_read) await markAsRead(n.id)
    if (n.deep_link) router.push(n.deep_link as any)
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.title}>Thông báo</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={s.markAll}>Đọc tất cả</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={notifications.length === 0 ? s.emptyContainer : { paddingBottom: 32 }}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyIcon}>🔕</Text>
            <Text style={s.emptyText}>Chưa có thông báo nào</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[s.item, !item.is_read && s.itemUnread]}
            onPress={() => handleTap(item)}
            activeOpacity={0.7}
          >
            <View style={s.iconWrap}>
              <Text style={s.icon}>{typeIcon(item.type)}</Text>
            </View>
            <View style={s.content}>
              <Text style={[s.itemTitle, !item.is_read && s.itemTitleUnread]}>
                {item.title}
              </Text>
              <Text style={s.body} numberOfLines={2}>{item.body}</Text>
              <Text style={s.time}>{timeAgo(item.created_at)}</Text>
            </View>
            {!item.is_read && <View style={s.dot} />}
          </TouchableOpacity>
        )}
      />
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 64,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e5e7eb',
  },
  title: { fontSize: 22, fontWeight: '700', color: '#111' },
  markAll: { fontSize: 14, color: '#16a34a', fontWeight: '600' },
  emptyContainer: { flex: 1 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 120 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, color: '#9ca3af' },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f3f4f6',
  },
  itemUnread: { backgroundColor: '#f0fdf4' },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  icon: { fontSize: 18 },
  content: { flex: 1 },
  itemTitle: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 2 },
  itemTitleUnread: { fontWeight: '700', color: '#111' },
  body: { fontSize: 13, color: '#6b7280', lineHeight: 18, marginBottom: 4 },
  time: { fontSize: 12, color: '#9ca3af' },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16a34a',
    marginTop: 6,
    marginLeft: 8,
  },
})
