import '../global.css'
import { Stack, useRouter, useSegments } from 'expo-router'
import { NotificationsProvider } from '@/lib/NotificationsContext'
import { AppThemeProvider } from '@/lib/theme-context'
import { useAuth } from '@/lib/useAuth'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useEffect } from 'react'

export default function RootLayout() {
  const { userId, isLoading } = useAuth()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return

    const firstSegment = segments[0] ?? ''
    const isPublicRoute = firstSegment === 'login'

    if (!userId && !isPublicRoute) {
      router.replace('/login')
      return
    }

    if (userId && isPublicRoute) {
      router.replace('/(tabs)')
    }
  }, [isLoading, router, segments, userId])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppThemeProvider>
        <NotificationsProvider userId={userId}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
            <Stack.Screen name="profile-setup" options={{ presentation: 'modal' }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false }} />
            <Stack.Screen name="create-session" options={{ headerShown: false }} />
            <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
            <Stack.Screen name="profile-preview" options={{ headerShown: false }} />
            <Stack.Screen name="host-review/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="match-result/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="player/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="rate-session/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="session/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="session/[id]/confirm-result" options={{ headerShown: false }} />
            <Stack.Screen name="session/[id]/review" options={{ headerShown: false }} />
          </Stack>
        </NotificationsProvider>
      </AppThemeProvider>
    </GestureHandlerRootView>
  )
}
