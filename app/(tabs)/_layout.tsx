import { PROFILE_THEME_COLORS } from '@/constants/profileTheme'
import { AppFontSet } from '@/constants/typography'
import { useNotificationsContext } from '@/lib/NotificationsContext'
import { Tabs } from 'expo-router'
import { Bell, Calendar, House, MagnifyingGlass, User } from 'phosphor-react-native'
import { Text, View } from 'react-native'
import { RADIUS, SHADOW } from '@/constants/screenLayout'

function TabIcon({
  focused,
  Icon,
  activeColor,
  inactiveColor,
}: {
  focused: boolean
  Icon: React.ComponentType<any>
  activeColor: string
  inactiveColor: string
}) {
  return (
    <View style={{ transform: [{ scale: focused ? 1.08 : 1 }] }}>
      <Icon size={30} color={focused ? activeColor : inactiveColor} weight={focused ? 'fill' : 'regular'} />
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
    <View style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center', transform: [{ scale: focused ? 1.08 : 1 }] }}>
      <Bell size={30} color={focused ? activeColor : inactiveColor} weight={focused ? 'fill' : 'regular'} />
      {unread > 0 ? (
        <View
          style={{
            position: 'absolute',
            top: -3,
            right: -6,
            minWidth: 16,
            height: 16,
            borderRadius: RADIUS.full,
            backgroundColor: dangerColor,
            paddingHorizontal: 3,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: PROFILE_THEME_COLORS.onPrimary, fontSize: 10, fontWeight: '700' }}>{unread > 99 ? '99+' : unread}</Text>
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
          height: 68,
          paddingTop: 12,
          paddingBottom: 12,
          backgroundColor: PROFILE_THEME_COLORS.background,
          ...SHADOW.sm,
          borderRadius: RADIUS.xl,
          marginHorizontal: 16,
          marginBottom: 20,
          position: 'absolute',
          left: 0,
          right: 0,
          borderWidth: 0,
          borderTopWidth: 0,
          borderTopColor: 'transparent',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: AppFontSet.label,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} Icon={House} activeColor={PROFILE_THEME_COLORS.primary} inactiveColor={PROFILE_THEME_COLORS.outline} />
          ),
        }}
      />

      <Tabs.Screen
        name="my-sessions"
        options={{
          title: 'Kèo của tôi',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} Icon={Calendar} activeColor={PROFILE_THEME_COLORS.primary} inactiveColor={PROFILE_THEME_COLORS.outline} />
          ),
        }}
      />

      <Tabs.Screen
        name="find-session"
        options={{
          title: 'Tìm kèo',
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} Icon={MagnifyingGlass} activeColor={PROFILE_THEME_COLORS.primary} inactiveColor={PROFILE_THEME_COLORS.outline} />
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


