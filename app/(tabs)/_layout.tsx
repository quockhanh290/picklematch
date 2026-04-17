import { useNotificationsContext } from '@/lib/NotificationsContext'
import { PROFILE_THEME_COLORS } from '@/components/profile/profileTheme'
import { Tabs } from 'expo-router'
import { Bell, CalendarDays, Home, Search, User } from 'lucide-react-native'
import { Text, View } from 'react-native'

function TabIcon({
  focused,
  Icon,
  activeColor,
  inactiveColor,
}: {
  focused: boolean
  Icon: typeof Home
  activeColor: string
  inactiveColor: string
}) {
  return (
    <View style={{ transform: [{ scale: focused ? 1.08 : 1 }] }}>
      <Icon size={22} color={focused ? activeColor : inactiveColor} strokeWidth={2.1} />
    </View>
  )
}

function NotificationIcon({
  focused,
  unread,
  activeColor,
  inactiveColor,
  dangerColor,
}: {
  focused: boolean
  unread: number
  activeColor: string
  inactiveColor: string
  dangerColor: string
}) {
  return (
    <View style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center', transform: [{ scale: focused ? 1.08 : 1 }] }}>
      <Bell size={22} color={focused ? activeColor : inactiveColor} strokeWidth={2.1} />
      {unread > 0 ? (
        <View
          style={{
            position: 'absolute',
            top: -3,
            right: -6,
            minWidth: 16,
            height: 16,
            borderRadius: 999,
            backgroundColor: dangerColor,
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
        sceneStyle: {
          backgroundColor: PROFILE_THEME_COLORS.background,
        },
        tabBarActiveTintColor: PROFILE_THEME_COLORS.primary,
        tabBarInactiveTintColor: PROFILE_THEME_COLORS.outline,
        tabBarStyle: {
          height: 72,
          paddingTop: 8,
          paddingBottom: 10,
          borderTopColor: PROFILE_THEME_COLORS.outlineVariant,
          backgroundColor: PROFILE_THEME_COLORS.surface,
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
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} Icon={Home} activeColor={PROFILE_THEME_COLORS.primary} inactiveColor={PROFILE_THEME_COLORS.outline} />
          ),
        }}
      />

      <Tabs.Screen
        name="my-sessions"
        options={{
          title: 'Kèo của tôi',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} Icon={CalendarDays} activeColor={PROFILE_THEME_COLORS.primary} inactiveColor={PROFILE_THEME_COLORS.outline} />
          ),
        }}
      />

      <Tabs.Screen
        name="find-session"
        options={{
          title: 'Tìm kèo',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} Icon={Search} activeColor={PROFILE_THEME_COLORS.primary} inactiveColor={PROFILE_THEME_COLORS.outline} />
          ),
        }}
      />

      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Thông báo',
          tabBarIcon: ({ focused }) => (
            <NotificationIcon
              focused={focused}
              unread={unreadCount}
              activeColor={PROFILE_THEME_COLORS.primary}
              inactiveColor={PROFILE_THEME_COLORS.outline}
              dangerColor={PROFILE_THEME_COLORS.error}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Hồ sơ',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} Icon={User} activeColor={PROFILE_THEME_COLORS.primary} inactiveColor={PROFILE_THEME_COLORS.outline} />
          ),
        }}
      />
    </Tabs>
  )
}
