import React, { useEffect, useState } from 'react'
import { useRouter, useSegments } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/useAuth'

export type AuthStatus = 'loading' | 'unauthenticated' | 'needs_setup' | 'needs_onboarding' | 'ready'

interface AuthGateProps {
  children: React.ReactNode
  fontsLoaded: boolean
}

export function AuthGate({ children, fontsLoaded }: AuthGateProps) {
  const { userId, isLoading } = useAuth()
  const segments = useSegments()
  const router = useRouter()
  const [authStatus, setAuthStatus] = useState<AuthStatus>('loading')

  useEffect(() => {
    if (isLoading || !fontsLoaded) return

    if (!userId) {
      setAuthStatus('unauthenticated')
      return
    }

    const checkPlayerStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('players')
          .select('onboarding_completed')
          .eq('id', userId)
          .maybeSingle()

        if (error) {
          console.error('[AuthGate] Player check failed:', error.message)
          return
        }

        if (!data) {
          setAuthStatus('needs_setup')
        } else if (!data.onboarding_completed) {
          setAuthStatus('needs_onboarding')
        } else {
          setAuthStatus('ready')
        }
      } catch (e) {
        console.error('[AuthGate] Auth status execution error:', e)
      }
    }

    checkPlayerStatus()
  }, [isLoading, fontsLoaded, userId])

  useEffect(() => {
    if (authStatus === 'loading' || !fontsLoaded) return

    const firstSegment = segments[0] ?? ''
    const isPublicRoute = firstSegment === 'login'
    const isOnboardingRoute = firstSegment === 'onboarding'
    const isProfileSetupRoute = firstSegment === 'profile-setup'

    // Prevent infinite loops and handle redirects
    if (authStatus === 'unauthenticated' && !isPublicRoute) {
      router.replace('/login')
    } else if (authStatus === 'needs_setup' && !isProfileSetupRoute) {
      router.replace('/profile-setup')
    } else if (authStatus === 'needs_onboarding' && !isOnboardingRoute) {
      router.replace('/onboarding')
    } else if (authStatus === 'ready' && (isPublicRoute || isOnboardingRoute || isProfileSetupRoute)) {
      router.replace('/(tabs)')
    }
  }, [authStatus, fontsLoaded, segments, router])

  // Don't render anything while determining auth status or loading fonts
  if (authStatus === 'loading' || !fontsLoaded) {
    return null
  }

  return <>{children}</>
}
