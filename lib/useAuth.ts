import { supabase } from '@/lib/supabase'
import { useEffect, useState } from 'react'

export function useAuth() {
  const [userId, setUserId] = useState<string | null | undefined>(undefined)
  // undefined = đang loading, null = chưa login, string = đã login

  useEffect(() => {
    // Lấy session hiện tại
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null)
    })

    // Lắng nghe thay đổi auth (login / logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { userId, isLoading: userId === undefined }
}
