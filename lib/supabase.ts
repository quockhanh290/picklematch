import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import 'react-native-url-polyfill/auto'

const supabaseUrl = 'https://mzqsxgfvtgmsscbqugni.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im16cXN4Z2Z2dGdtc3NjYnF1Z25pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NjI4NzIsImV4cCI6MjA4OTUzODg3Mn0.U4aLAFVO64PmR4E_1QJh-6mt1wiayj2wrPpKTbDv4j8'
const isBrowser = typeof window !== 'undefined'
const serverSafeStorage = {
  getItem: async () => null,
  setItem: async (_key: string, _value: string) => {},
  removeItem: async (_key: string) => {},
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: isBrowser ? AsyncStorage : serverSafeStorage,
    autoRefreshToken: true,
    persistSession: isBrowser,
    detectSessionInUrl: false,
  },
})
