import { NotificationsProvider } from '@/lib/NotificationsContext'
import { AppThemeProvider } from '@/lib/theme-context'
import { useAuth } from '@/lib/useAuth'
import { supabase } from '@/lib/supabase'
import { BarlowCondensed_700Bold, BarlowCondensed_700Bold_Italic, BarlowCondensed_900Black } from '@expo-google-fonts/barlow-condensed'
import { PlusJakartaSans_400Regular } from '@expo-google-fonts/plus-jakarta-sans/400Regular'
import { PlusJakartaSans_500Medium } from '@expo-google-fonts/plus-jakarta-sans/500Medium'
import { PlusJakartaSans_600SemiBold } from '@expo-google-fonts/plus-jakarta-sans/600SemiBold'
import { PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans/700Bold'
import { PlusJakartaSans_800ExtraBold } from '@expo-google-fonts/plus-jakarta-sans/800ExtraBold'
import { PlusJakartaSans_800ExtraBold_Italic } from '@expo-google-fonts/plus-jakarta-sans/800ExtraBold_Italic'
import { useFonts } from 'expo-font'
import { Stack, useRouter, useSegments } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import '../global.css'
import { SCREEN_FONTS } from '@/constants/typography'

void SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const { userId, isLoading } = useAuth()
  const segments = useSegments()
  const router = useRouter()
  const [fontsLoaded] = useFonts({
    [SCREEN_FONTS.headline]: BarlowCondensed_700Bold,
    [SCREEN_FONTS.headlineItalic]: BarlowCondensed_700Bold_Italic,
    [SCREEN_FONTS.headlineBlack]: BarlowCondensed_900Black,
    [SCREEN_FONTS.body]: PlusJakartaSans_400Regular,
    [SCREEN_FONTS.medium]: PlusJakartaSans_500Medium,
    [SCREEN_FONTS.label]: PlusJakartaSans_600SemiBold,
    [SCREEN_FONTS.bold]: PlusJakartaSans_800ExtraBold,
    [SCREEN_FONTS.boldItalic]: PlusJakartaSans_800ExtraBold_Italic,
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
    const isOnboardingRoute = firstSegment === 'onboarding'
    const isProfileSetupRoute = firstSegment === 'profile-setup'

    if (!userId && !isPublicRoute) {
      router.replace('/login')
      return
    }

    if (userId) {
      if (isPublicRoute) {
        router.replace('/(tabs)')
        return
      }

      // Production Guard: Ensure Profile & Onboarding are complete
      const checkGuard = async () => {
        try {
          const { data, error } = await supabase
            .from('players')
            .select('onboarding_completed')
            .eq('id', userId)
            .maybeSingle()

          if (error) {
            console.error('[RootLayout] Guard check failed:', error.message)
            return
          }

          // Case 1: No player record yet -> Profile Setup
          if (!data) {
            if (!isProfileSetupRoute) {
              router.replace('/profile-setup')
            }
            return
          }

          // Case 2: Record exists but onboarding not done -> Onboarding
          if (!data.onboarding_completed) {
            if (!isOnboardingRoute) {
              router.replace('/onboarding')
            }
            return
          }

          // Case 3: Fully onboarded but somehow on setup/onboarding routes -> Home
          if (data.onboarding_completed && (isOnboardingRoute || isProfileSetupRoute)) {
            router.replace('/(tabs)')
          }
        } catch (e) {
          console.error('[RootLayout] Guard execution error:', e)
        }
      }

      checkGuard()
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
            <Stack.Screen name="(dev)/session-card-preview" options={{ headerShown: false }} />
          </Stack>
        </NotificationsProvider>
      </AppThemeProvider>
    </GestureHandlerRootView>
  )
}
