import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import 'react-native-url-polyfill/auto'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
const isBrowser = typeof window !== 'undefined'
const serverSafeStorage = {
  getItem: async () => null,
  setItem: async (_key: string, _value: string) => {},
  removeItem: async (_key: string) => {},
}

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: isBrowser ? AsyncStorage : serverSafeStorage,
    autoRefreshToken: true,
    persistSession: isBrowser,
    detectSessionInUrl: false,
  },
})
