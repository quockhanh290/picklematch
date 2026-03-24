import '../global.css'
import { Stack } from 'expo-router'
import { NotificationsProvider } from '@/lib/NotificationsContext'
import { useAuth } from '@/lib/useAuth'

export default function RootLayout() {
  const { userId } = useAuth()

  return (
    <NotificationsProvider userId={userId}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        <Stack.Screen name="profile-setup" options={{ presentation: 'modal' }} />
        <Stack.Screen name="skill-assessment" options={{ headerShown: false }} />
      </Stack>
    </NotificationsProvider>
  )
}
