import { Tabs } from 'expo-router'
import { Text } from 'react-native'

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trang chủ',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>🏠</Text>,
        }}
      />
      
      {/* ⭐ THÊM TAB MỚI Ở ĐÂY */}
      <Tabs.Screen
        name="my-sessions"
        options={{
          title: 'Kèo của tôi',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>📱</Text>,
        }}
      />
      
      <Tabs.Screen
        name="find-session"
        options={{
          title: 'Tìm kèo',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>🔍</Text>,
        }}
      />
      
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Hồ sơ',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>👤</Text>,
        }}
      />
    </Tabs>
  )
}
