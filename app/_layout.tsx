import '../global.css'
import { Stack } from 'expo-router'
import { NotificationsProvider } from '@/lib/NotificationsContext'
import { AppThemeProvider } from '@/lib/theme-context'
import { useAuth } from '@/lib/useAuth'
import { GestureHandlerRootView } from 'react-native-gesture-handler'

export default function RootLayout() {
  const { userId } = useAuth()

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppThemeProvider>
        <NotificationsProvider userId={userId}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
            <Stack.Screen name="profile-setup" options={{ presentation: 'modal' }} />
            <Stack.Screen name="skill-assessment" options={{ headerShown: false }} />
          </Stack>
        </NotificationsProvider>
      </AppThemeProvider>
    </GestureHandlerRootView>
  )
}
