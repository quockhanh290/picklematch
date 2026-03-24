import * as Location from 'expo-location'
import { useEffect, useRef, useState } from 'react'
import { supabase } from './supabase'

// ── Types ────────────────────────────────────────────────────────────────────

export type NearByCourt = {
  id: string
  name: string
  address: string
  city: string
  lat: number | null
  lng: number | null
  hours_open: string | null   // "HH:MM", e.g. "06:00"
  hours_close: string | null  // "HH:MM", e.g. "22:00"
  price_per_hour: number | null
  booking_url: string | null
  google_maps_url?: string | null
  hasSlots?: boolean
  distance?: number // km, present only in geo mode
}

type Result = {
  /** Geo-sorted court list (geo mode) or keyword-matched list (fallback mode) */
  courts: NearByCourt[]
  /** True while the initial location + court fetch is running */
  loading: boolean
  /** True when the user denied location — manual search is active instead */
  fallbackMode: boolean
  /** Controlled search keyword (fallback mode only) */
  keyword: string
  setKeyword: (k: string) => void
  /** True while the debounced keyword search is in flight */
  searching: boolean
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Normalize a Vietnamese string for accent-insensitive matching.
 * "Tân Bình" → "tan binh",  "Đống Đa" → "dong da"
 */
function normalizeVN(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip combining diacritical marks
    .replace(/[đĐ]/g, m => (m === 'đ' ? 'd' : 'D'))
    .toLowerCase()
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

async function fetchOpenCourtIds(): Promise<Set<string>> {
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999)

  const { data } = await supabase
    .from('court_slots')
    .select('court_id')
    .eq('status', 'available')
    .gte('start_time', todayStart.toISOString())
    .lte('start_time', todayEnd.toISOString())

  return new Set((data ?? []).map((s: any) => s.court_id))
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useNearbyCourts(): Result {
  const [courts, setCourts]             = useState<NearByCourt[]>([])
  const [loading, setLoading]           = useState(true)
  const [fallbackMode, setFallbackMode] = useState(false)
  const [keyword, setKeyword]           = useState('')
  const [searching, setSearching]       = useState(false)

  // All courts cached for client-side filtering in fallback mode
  const allCourtsRef = useRef<NearByCourt[]>([])

  // ── Initial load: try location, fallback if denied ──────────────────────

  useEffect(() => {
    let cancelled = false

    async function init() {
      setLoading(true)

      let userCoords: { lat: number; lon: number } | null = null

      try {
        const { status } = await Location.requestForegroundPermissionsAsync()

        if (status !== 'granted') {
          // Load all courts for client-side search, then enter fallback mode
          await loadAllCourtsForFallback(cancelled)
          if (!cancelled) setLoading(false)
          return
        }

        const locPromise = Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        })
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('location_timeout')), 8000)
        )
        const loc = await Promise.race([locPromise, timeoutPromise])
        userCoords = { lat: loc.coords.latitude, lon: loc.coords.longitude }
      } catch (_) {
        // Timeout or any location error → fallback
        await loadAllCourtsForFallback(cancelled)
        if (!cancelled) setLoading(false)
        return
      }

      // Geo mode: load all courts and sort by distance
      const [{ data: courtData }, openIds] = await Promise.all([
        supabase
          .from('courts')
          .select('id, name, address, city, lat, lng, hours_open, hours_close, price_per_hour, booking_url, google_maps_url')
          .limit(50),
        fetchOpenCourtIds(),
      ])

      if (cancelled) return

      const enriched: NearByCourt[] = (courtData ?? []).map((c: any) => ({
        ...c,
        hasSlots: openIds.has(c.id),
        distance:
          userCoords && c.lat != null && c.lng != null
            ? haversineKm(userCoords.lat, userCoords.lon, c.lat, c.lng)
            : undefined,
      }))

      enriched.sort((a, b) => {
        if (a.hasSlots !== b.hasSlots) return a.hasSlots ? -1 : 1
        if (a.distance !== undefined && b.distance !== undefined) return a.distance - b.distance
        return 0
      })

      setCourts(enriched)
      setLoading(false)
    }

    async function loadAllCourtsForFallback(cancelled: boolean) {
      const [{ data: courtData }, openIds] = await Promise.all([
        supabase
          .from('courts')
          .select('id, name, address, city, lat, lng, hours_open, hours_close, price_per_hour, booking_url, google_maps_url')
          .limit(100),
        fetchOpenCourtIds(),
      ])
      if (cancelled) return

      const all: NearByCourt[] = (courtData ?? []).map((c: any) => ({
        ...c,
        hasSlots: openIds.has(c.id),
        distance: undefined,
      }))

      allCourtsRef.current = all
      setFallbackMode(true)
      setCourts([]) // start empty; results appear as user types
    }

    init()
    return () => { cancelled = true }
  }, [])

  // ── Fallback: instant client-side filter (accent-insensitive) ────────────

  useEffect(() => {
    if (!fallbackMode) return

    const q = keyword.trim()
    if (!q) {
      setCourts([])
      setSearching(false)
      return
    }

    setSearching(true)
    const normalized = normalizeVN(q)
    const matched = allCourtsRef.current.filter(c =>
      normalizeVN(c.name).includes(normalized) ||
      normalizeVN(c.address).includes(normalized)
    )
    setCourts(matched)
    setSearching(false)
  }, [keyword, fallbackMode])

  return { courts, loading, fallbackMode, keyword, setKeyword, searching }
}
