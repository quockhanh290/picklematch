import '../global.css'
import { Stack, useRouter, useSegments } from 'expo-router'
import { NotificationsProvider } from '@/lib/NotificationsContext'
import { AppThemeProvider } from '@/lib/theme-context'
import { useAuth } from '@/lib/useAuth'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useEffect } from 'react'

void SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const { userId, isLoading } = useAuth()
  const segments = useSegments()
  const router = useRouter()
  const [fontsLoaded] = useFonts({
    'PlusJakartaSans-Regular': require('../assets/fonts/PlusJakartaSans-Regular.ttf'),
    'PlusJakartaSans-Bold': require('../assets/fonts/PlusJakartaSans-Bold.ttf'),
    'PlusJakartaSans-ExtraBoldItalic': require('../assets/fonts/PlusJakartaSans-ExtraBoldItalic.ttf'),
  })

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync()
    }
  }, [fontsLoaded])

  useEffect(() => {
    if (isLoading || !fontsLoaded) return

    const firstSegment = segments[0] ?? ''
    const isPublicRoute = firstSegment === 'login'

    if (!userId && !isPublicRoute) {
      router.replace('/login')
      return
    }

    if (userId && isPublicRoute) {
      router.replace('/(tabs)')
    }
  }, [fontsLoaded, isLoading, router, segments, userId])

  if (!fontsLoaded) {
    return null
  }

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
