import { useNotificationsContext } from '@/lib/NotificationsContext'
import { Tabs } from 'expo-router'
import { Bell, CalendarDays, Home, Search, User } from 'lucide-react-native'
import { Text, View } from 'react-native'

function TabIcon({
  focused,
  Icon,
}: {
  focused: boolean
  Icon: typeof Home
}) {
  return (
    <View style={{ transform: [{ scale: focused ? 1.08 : 1 }] }}>
      <Icon size={22} color={focused ? '#059669' : '#94a3b8'} strokeWidth={2.1} />
    </View>
  )
}

function NotificationIcon({ focused, unread }: { focused: boolean; unread: number }) {
  return (
    <View style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center', transform: [{ scale: focused ? 1.08 : 1 }] }}>
      <Bell size={22} color={focused ? '#059669' : '#94a3b8'} strokeWidth={2.1} />
      {unread > 0 ? (
        <View
          style={{
            position: 'absolute',
            top: -3,
            right: -6,
            minWidth: 16,
            height: 16,
            borderRadius: 999,
            backgroundColor: '#ef4444',
            paddingHorizontal: 3,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{unread > 99 ? '99+' : unread}</Text>
        </View>
      ) : null}
    </View>
  )
}

export default function TabLayout() {
  const { unreadCount } = useNotificationsContext()

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#059669',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          height: 72,
          paddingTop: 8,
          paddingBottom: 10,
          borderTopColor: '#e5e7eb',
          backgroundColor: '#ffffff',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} Icon={Home} />,
        }}
      />

      <Tabs.Screen
        name="my-sessions"
        options={{
          title: 'Kèo của tôi',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} Icon={CalendarDays} />,
        }}
      />

      <Tabs.Screen
        name="find-session"
        options={{
          title: 'Tìm kèo',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} Icon={Search} />,
        }}
      />

      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Thông báo',
          tabBarIcon: ({ focused }) => <NotificationIcon focused={focused} unread={unreadCount} />,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Hồ sơ',
          tabBarIcon: ({ focused }) => <TabIcon focused={focused} Icon={User} />,
        }}
      />
    </Tabs>
  )
}
