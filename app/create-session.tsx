import { CreateSessionStep1 } from '@/components/create-session/CreateSessionStep1'
import { SKILL_ASSESSMENT_LEVELS } from '@/lib/skillAssessment'
import { supabase } from '@/lib/supabase'
import { type NearByCourt, useNearbyCourts } from '@/lib/useNearbyCourts'
import * as Linking from 'expo-linking'
import { router } from 'expo-router'
import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, MapPin, ShieldCheck, Users, Wallet } from 'lucide-react-native'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useState } from 'react'
import {
  Alert, Keyboard, ScrollView,
  StyleSheet, Switch, Text, TextInput, TouchableOpacity, View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Constants ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬

const ELO_LEVELS = [
  { label: SKILL_ASSESSMENT_LEVELS[0].title, elo: 800 },
  { label: SKILL_ASSESSMENT_LEVELS[1].title, elo: 1000 },
  { label: SKILL_ASSESSMENT_LEVELS[2].title, elo: 1150 },
  { label: SKILL_ASSESSMENT_LEVELS[3].title, elo: 1300 },
  { label: SKILL_ASSESSMENT_LEVELS[4].title, elo: 1500 },
]

const PLAYER_OPTIONS = [2, 4, 6]

const DEADLINE_OPTIONS = [
  { label: '2 giÃƒÂ¡Ã‚Â»Ã‚Â',  hours: 2  },
  { label: '4 giÃƒÂ¡Ã‚Â»Ã‚Â',  hours: 4  },
  { label: '8 giÃƒÂ¡Ã‚Â»Ã‚Â',  hours: 8  },
  { label: '24 giÃƒÂ¡Ã‚Â»Ã‚Â', hours: 24 },
]

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Helpers ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬

const WEEKDAYS_LONG = ['ChÃƒÂ¡Ã‚Â»Ã‚Â§ nhÃƒÂ¡Ã‚ÂºÃ‚Â­t', 'ThÃƒÂ¡Ã‚Â»Ã‚Â© 2', 'ThÃƒÂ¡Ã‚Â»Ã‚Â© 3', 'ThÃƒÂ¡Ã‚Â»Ã‚Â© 4', 'ThÃƒÂ¡Ã‚Â»Ã‚Â© 5', 'ThÃƒÂ¡Ã‚Â»Ã‚Â© 6', 'ThÃƒÂ¡Ã‚Â»Ã‚Â© 7']

function fmtDateFull(d: Date): string {
  return `${WEEKDAYS_LONG[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
}

/** "YYYY-MM-DD" string for react-native-calendars */

function fmtTime(d: Date): string {
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

/** "HH:MM" string ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ total minutes since midnight */
function toMins(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

/** Copy date part from `base` and time part from `time` */
function withTime(base: Date, time: Date): Date {
  const d = new Date(base)
  d.setHours(time.getHours(), time.getMinutes(), 0, 0)
  return d
}

/** Duration string, e.g. "1 giÃƒÂ¡Ã‚Â»Ã‚Â 30 phÃƒÆ’Ã‚Âºt" */
function fmtDuration(start: Date, end: Date): string {
  const mins = Math.round((end.getTime() - start.getTime()) / 60_000)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m} \u0070\u0068\u00fa\u0074`
  if (m === 0) return `${h} \u0067\u0069\u1edd`
  return `${h} \u0067\u0069\u1edd ${m} \u0070\u0068\u00fa\u0074`
}

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Component ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬

function WizardHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={s.headerWrap}>
      <Text style={s.headerEyebrow}>Create Session</Text>
      <Text style={s.headerTitle}>{title}</Text>
      <Text style={s.headerSubtitle}>{subtitle}</Text>
    </View>
  )
}

function BackLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={s.backLink}>
      <ArrowLeft size={16} color="#059669" />
      <Text style={s.backLinkText}>{label}</Text>
    </TouchableOpacity>
  )
}

export default function CreateSession() {
  const [step, setStep] = useState<1 | 2 | 3>(1)

  // Step 1 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â court + time
  const { courts, loading: loadingCourts, fallbackMode, keyword, setKeyword, searching } = useNearbyCourts()
  const [selectedCourt, setSelectedCourt] = useState<NearByCourt | null>(null)
  const [selectedDate, setSelectedDate]   = useState<Date | null>(null)
  const [startTime, setStartTime]         = useState<Date | null>(null)
  const [endTime, setEndTime]             = useState<Date | null>(null)
  const [showStartPicker, setShowStartPicker] = useState(false)
  const [showEndPicker, setShowEndPicker]     = useState(false)
  const [timeError, setTimeError]         = useState<string | null>(null)

  // Step 2
  const [maxPlayers, setMaxPlayers]       = useState(4)
  const [eloMin, setEloMin]               = useState(ELO_LEVELS[0].elo)
  const [eloMax, setEloMax]               = useState(ELO_LEVELS[4].elo)
  const [deadlineHours, setDeadlineHours]     = useState(4)
  const [requireApproval, setRequireApproval] = useState(false)
  const [totalCostStr, setTotalCostStr]       = useState('')
  const [courtConfirmationChoice, setCourtConfirmationChoice] =
    useState<'confirmed' | 'needs_booking' | null>(null)
  const [bookNowChoice, setBookNowChoice] = useState<boolean | null>(null)
  const [bookingReference, setBookingReference] = useState('')
  const [bookingName, setBookingName] = useState('')
  const [bookingPhone, setBookingPhone] = useState('')
  const [bookingNotes, setBookingNotes] = useState('')

  const [submitting, setSubmitting] = useState(false)

  // ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Time helpers ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬

  /** Default value shown in the picker before user picks anything */
  function defaultPickerValue(type: 'start' | 'end'): Date {
    const base = selectedDate ?? new Date()
    if (type === 'start') {
      if (startTime) return startTime
      const openMins = toMins(selectedCourt?.hours_open ?? '06:00')
      const now      = new Date()
      const nowMins  = now.getHours() * 60 + now.getMinutes()
      const rounded  = Math.ceil((nowMins + 1) / 30) * 30
      const mins     = Math.max(openMins, rounded)
      const d        = new Date(base)
      d.setHours(Math.floor(mins / 60), mins % 60, 0, 0)
      return d
    }
    if (endTime) return endTime
    const b = startTime ?? new Date(base)
    return new Date(b.getTime() + 90 * 60_000)
  }

  /** Validate start time against court hours + "not in the past" */
  const validateStart = useCallback((time: Date): string | null => {
    const now       = new Date()
    const isToday   = selectedDate?.toDateString() === now.toDateString()
    const openMins  = toMins(selectedCourt?.hours_open  ?? '06:00')
    const closeMins = toMins(selectedCourt?.hours_close ?? '22:00')
    const tMins     = time.getHours() * 60 + time.getMinutes()

    if (isToday && time <= now)  return 'GiÃƒÂ¡Ã‚Â»Ã‚Â bÃƒÂ¡Ã‚ÂºÃ‚Â¯t Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚ÂºÃ‚Â§u phÃƒÂ¡Ã‚ÂºÃ‚Â£i sau giÃƒÂ¡Ã‚Â»Ã‚Â hiÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¡n tÃƒÂ¡Ã‚ÂºÃ‚Â¡i'
    if (tMins < openMins)        return `SÃƒÆ’Ã‚Â¢n mÃƒÂ¡Ã‚Â»Ã…Â¸ cÃƒÂ¡Ã‚Â»Ã‚Â­a lÃƒÆ’Ã‚Âºc ${selectedCourt?.hours_open ?? '06:00'}`
    if (tMins >= closeMins)      return `SÃƒÆ’Ã‚Â¢n Ãƒâ€žÃ¢â‚¬ËœÃƒÆ’Ã‚Â³ng cÃƒÂ¡Ã‚Â»Ã‚Â­a lÃƒÆ’Ã‚Âºc ${selectedCourt?.hours_close ?? '22:00'}`
    return null
  }, [selectedCourt?.hours_close, selectedCourt?.hours_open, selectedDate])

  /** Validate end time against start + court close + 3h max */
  const validateEnd = useCallback((end: Date, start: Date): string | null => {
    const closeMins = toMins(selectedCourt?.hours_close ?? '22:00')
    const endMins   = end.getHours() * 60 + end.getMinutes()
    const diffMins  = (end.getTime() - start.getTime()) / 60_000

    if (end <= start) return 'GiÃƒÂ¡Ã‚Â»Ã‚Â kÃƒÂ¡Ã‚ÂºÃ‚Â¿t thÃƒÆ’Ã‚Âºc phÃƒÂ¡Ã‚ÂºÃ‚Â£i sau giÃƒÂ¡Ã‚Â»Ã‚Â bÃƒÂ¡Ã‚ÂºÃ‚Â¯t Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚ÂºÃ‚Â§u'
    if (diffMins > 180)        return 'TÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœi Ãƒâ€žÃ¢â‚¬Ëœa 3 tiÃƒÂ¡Ã‚ÂºÃ‚Â¿ng mÃƒÂ¡Ã‚Â»Ã¢â‚¬â€i kÃƒÆ’Ã‚Â¨o'
    if (endMins > closeMins)   return `SÃƒÆ’Ã‚Â¢n Ãƒâ€žÃ¢â‚¬ËœÃƒÆ’Ã‚Â³ng cÃƒÂ¡Ã‚Â»Ã‚Â­a lÃƒÆ’Ã‚Âºc ${selectedCourt?.hours_close ?? '22:00'}`
    return null
  }, [selectedCourt?.hours_close])

  // ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Event handlers ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬

  function onCourtSelect(court: NearByCourt) {
    setSelectedCourt(court)
    setStartTime(null)
    setEndTime(null)
    setTimeError(null)
    setCourtConfirmationChoice(null)
    setBookNowChoice(null)
    setBookingReference('')
    setBookingName('')
    setBookingPhone('')
    setBookingNotes('')
  }

  function onDatePress(date: Date) {
    setSelectedDate(date)
    // Re-anchor existing times to the new date
    if (startTime) setStartTime(withTime(date, startTime))
    if (endTime)   setEndTime(withTime(date, endTime))
    setTimeError(null)
  }

  // Live validation whenever times change
  useEffect(() => {
    if (!startTime) { setTimeError(null); return }
    const startErr = validateStart(startTime)
    if (startErr) { setTimeError(startErr); return }
    if (!endTime) { setTimeError(null); return }
    setTimeError(validateEnd(endTime, startTime))
  }, [endTime, startTime, validateEnd, validateStart])

  function goToStep2() {
    if (!selectedCourt || !selectedDate || !startTime || !endTime || timeError) return
    setStep(2)
  }

  function hasBookingInfo() {
    return [bookingReference, bookingName, bookingPhone, bookingNotes].some((value) => value.trim().length > 0)
  }

  function resolvedCourtBookingStatus(): 'confirmed' | 'unconfirmed' {
    if (courtConfirmationChoice === 'confirmed') return 'confirmed'
    if (courtConfirmationChoice === 'needs_booking' && bookNowChoice) return 'confirmed'
    return 'unconfirmed'
  }

  function bookingLink() {
    return selectedCourt?.booking_url ?? selectedCourt?.google_maps_url ?? null
  }

  function bookingStatusLabel() {
    if (resolvedCourtBookingStatus() === 'confirmed') return 'Ãƒâ€žÃ‚ÂÃƒÆ’Ã‚Â£ xÃƒÆ’Ã‚Â¡c nhÃƒÂ¡Ã‚ÂºÃ‚Â­n Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚ÂºÃ‚Â·t sÃƒÆ’Ã‚Â¢n'
    if (courtConfirmationChoice === 'needs_booking' && bookNowChoice === false) return 'SÃƒÆ’Ã‚Â¢n chÃƒâ€ Ã‚Â°a xÃƒÆ’Ã‚Â¡c nhÃƒÂ¡Ã‚ÂºÃ‚Â­n'
    return 'Ãƒâ€žÃ‚Âang chÃƒÂ¡Ã‚Â»Ã‚Â xÃƒÆ’Ã‚Â¡c nhÃƒÂ¡Ã‚ÂºÃ‚Â­n sÃƒÆ’Ã‚Â¢n'
  }

  async function openBookingLink() {
    const url = bookingLink()
    if (!url) {
      Alert.alert('ChÃƒâ€ Ã‚Â°a cÃƒÆ’Ã‚Â³ link Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚ÂºÃ‚Â·t sÃƒÆ’Ã‚Â¢n', 'SÃƒÆ’Ã‚Â¢n nÃƒÆ’Ã‚Â y chÃƒâ€ Ã‚Â°a cÃƒÆ’Ã‚Â³ link booking. BÃƒÂ¡Ã‚ÂºÃ‚Â¡n vÃƒÂ¡Ã‚ÂºÃ‚Â«n cÃƒÆ’Ã‚Â³ thÃƒÂ¡Ã‚Â»Ã†â€™ tÃƒÂ¡Ã‚Â»Ã‚Â± Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚ÂºÃ‚Â·t sÃƒÆ’Ã‚Â¢n vÃƒÆ’Ã‚Â  nhÃƒÂ¡Ã‚ÂºÃ‚Â­p thÃƒÆ’Ã‚Â´ng tin booking sau.')
      return
    }

    try {
      await Linking.openURL(url)
    } catch {
      Alert.alert('KhÃƒÆ’Ã‚Â´ng mÃƒÂ¡Ã‚Â»Ã…Â¸ Ãƒâ€žÃ¢â‚¬ËœÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã‚Â£c link', 'Vui lÃƒÆ’Ã‚Â²ng thÃƒÂ¡Ã‚Â»Ã‚Â­ lÃƒÂ¡Ã‚ÂºÃ‚Â¡i hoÃƒÂ¡Ã‚ÂºÃ‚Â·c mÃƒÂ¡Ã‚Â»Ã…Â¸ link booking cÃƒÂ¡Ã‚Â»Ã‚Â§a sÃƒÆ’Ã‚Â¢n theo cÃƒÆ’Ã‚Â¡ch khÃƒÆ’Ã‚Â¡c.')
    }
  }

  function goToStep3() {
    const minIdx = ELO_LEVELS.findIndex(l => l.elo === eloMin)
    const maxIdx = ELO_LEVELS.findIndex(l => l.elo === eloMax)
    if (minIdx > maxIdx) {
      Alert.alert('LÃƒÂ¡Ã‚Â»Ã¢â‚¬â€i', 'TrÃƒÆ’Ã‚Â¬nh Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã¢â€žÂ¢ tÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœi thiÃƒÂ¡Ã‚Â»Ã†â€™u khÃƒÆ’Ã‚Â´ng thÃƒÂ¡Ã‚Â»Ã†â€™ cao hÃƒâ€ Ã‚Â¡n tÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœi Ãƒâ€žÃ¢â‚¬Ëœa')
      return
    }
    if (!courtConfirmationChoice) {
      Alert.alert('ThiÃƒÂ¡Ã‚ÂºÃ‚Â¿u thÃƒÆ’Ã‚Â´ng tin', 'BÃƒÂ¡Ã‚ÂºÃ‚Â¡n cÃƒÂ¡Ã‚ÂºÃ‚Â§n xÃƒÆ’Ã‚Â¡c nhÃƒÂ¡Ã‚ÂºÃ‚Â­n tÃƒÆ’Ã‚Â¬nh trÃƒÂ¡Ã‚ÂºÃ‚Â¡ng Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚ÂºÃ‚Â·t sÃƒÆ’Ã‚Â¢n trÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã¢â‚¬Âºc khi Ãƒâ€žÃ¢â‚¬ËœÃƒâ€žÃ†â€™ng kÃƒÆ’Ã‚Â¨o.')
      return
    }
    if (courtConfirmationChoice === 'needs_booking' && bookNowChoice === null) {
      Alert.alert('ThiÃƒÂ¡Ã‚ÂºÃ‚Â¿u thÃƒÆ’Ã‚Â´ng tin', 'HÃƒÆ’Ã‚Â£y chÃƒÂ¡Ã‚Â»Ã‚Ân bÃƒÂ¡Ã‚ÂºÃ‚Â¡n cÃƒÆ’Ã‚Â³ muÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœn Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚ÂºÃ‚Â·t sÃƒÆ’Ã‚Â¢n ngay lÃƒÆ’Ã‚Âºc nÃƒÆ’Ã‚Â y hay khÃƒÆ’Ã‚Â´ng.')
      return
    }
    if (resolvedCourtBookingStatus() === 'confirmed' && !hasBookingInfo()) {
      Alert.alert('ThiÃƒÂ¡Ã‚ÂºÃ‚Â¿u thÃƒÆ’Ã‚Â´ng tin booking', 'HÃƒÆ’Ã‚Â£y cung cÃƒÂ¡Ã‚ÂºÃ‚Â¥p thÃƒÆ’Ã‚Â´ng tin booking Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã†â€™ xÃƒÆ’Ã‚Â¡c nhÃƒÂ¡Ã‚ÂºÃ‚Â­n Ãƒâ€žÃ¢â‚¬ËœÃƒÆ’Ã‚Â£ Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚ÂºÃ‚Â·t sÃƒÆ’Ã‚Â¢n.')
      return
    }
    setStep(3)
  }

  async function submit() {
    if (!selectedCourt || !startTime || !endTime) return
    setSubmitting(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setSubmitting(false)
      Alert.alert('CÃƒÂ¡Ã‚ÂºÃ‚Â§n Ãƒâ€žÃ¢â‚¬ËœÃƒâ€žÃ†â€™ng nhÃƒÂ¡Ã‚ÂºÃ‚Â­p', 'BÃƒÂ¡Ã‚ÂºÃ‚Â¡n cÃƒÂ¡Ã‚ÂºÃ‚Â§n Ãƒâ€žÃ¢â‚¬ËœÃƒâ€žÃ†â€™ng nhÃƒÂ¡Ã‚ÂºÃ‚Â­p Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã†â€™ tÃƒÂ¡Ã‚ÂºÃ‚Â¡o kÃƒÆ’Ã‚Â¨o', [
        { text: 'Ãƒâ€žÃ‚ÂÃƒâ€žÃ†â€™ng nhÃƒÂ¡Ã‚ÂºÃ‚Â­p', onPress: () => router.push('/login') },
        { text: 'HuÃƒÂ¡Ã‚Â»Ã‚Â·', style: 'cancel' },
      ])
      return
    }

    const totalCost = parseInt(totalCostStr.replace(/\D/g, ''), 10) || 0

    // Create a one-off court_slot for this custom time range
    const { data: newSlot, error: slotErr } = await supabase
      .from('court_slots')
      .insert({
        court_id:   selectedCourt.id,
        start_time: startTime.toISOString(),
        end_time:   endTime.toISOString(),
        price:      totalCost,
        status:     'booked',
      })
      .select()
      .single()

    if (slotErr || !newSlot) {
      setSubmitting(false)
      Alert.alert('LÃƒÂ¡Ã‚Â»Ã¢â‚¬â€i', slotErr?.message ?? 'KhÃƒÆ’Ã‚Â´ng thÃƒÂ¡Ã‚Â»Ã†â€™ tÃƒÂ¡Ã‚ÂºÃ‚Â¡o giÃƒÂ¡Ã‚Â»Ã‚Â chÃƒâ€ Ã‚Â¡i')
      return
    }

    const fillDeadline = new Date(Date.now() + deadlineHours * 3_600_000)

    const { data: newSession, error: sessionErr } = await supabase
      .from('sessions')
      .insert({
        host_id:          user.id,
        slot_id:          newSlot.id,
        elo_min:          eloMin,
        elo_max:          eloMax,
        max_players:      maxPlayers,
        status:           'open',
        fill_deadline:    fillDeadline.toISOString(),
        total_cost:       totalCost || null,
        require_approval: requireApproval,
        court_booking_status: resolvedCourtBookingStatus(),
        booking_reference: bookingReference.trim() || null,
        booking_name: bookingName.trim() || null,
        booking_phone: bookingPhone.trim() || null,
        booking_notes: bookingNotes.trim() || null,
        booking_confirmed_at:
          resolvedCourtBookingStatus() === 'confirmed' ? new Date().toISOString() : null,
      })
      .select()
      .single()

    if (sessionErr || !newSession) {
      setSubmitting(false)
      Alert.alert('LÃƒÂ¡Ã‚Â»Ã¢â‚¬â€i', sessionErr?.message ?? 'KhÃƒÆ’Ã‚Â´ng thÃƒÂ¡Ã‚Â»Ã†â€™ tÃƒÂ¡Ã‚ÂºÃ‚Â¡o kÃƒÆ’Ã‚Â¨o')
      return
    }

    await supabase.from('session_players').insert({
      session_id: newSession.id,
      player_id:  user.id,
      status:     'confirmed',
    })

    setSubmitting(false)
    router.replace({
      pathname: '/session/[id]',
      params: { id: newSession.id, created: '1' },
    } as any)
  }

  // ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Derived values ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬

  const totalCost     = parseInt(totalCostStr.replace(/\D/g, ''), 10) || 0
  const costPerPerson = totalCost > 0 ? Math.ceil(totalCost / maxPlayers) : 0
  const duration      = startTime && endTime && endTime > startTime
    ? fmtDuration(startTime, endTime)
    : null

  function eloLabel(elo: number) {
    return ELO_LEVELS.find(l => l.elo === elo)?.label ?? `ELO ${elo}`
  }

  function deadlinePreview(): string {
    const d  = new Date(Date.now() + deadlineHours * 3_600_000)
    const hh = d.getHours().toString().padStart(2, '0')
    const mm = d.getMinutes().toString().padStart(2, '0')
    return `HÃƒÂ¡Ã‚ÂºÃ‚Â¿t hÃƒÂ¡Ã‚ÂºÃ‚Â¡n lÃƒÆ’Ã‚Âºc ${hh}:${mm}, ${d.getDate()}/${d.getMonth() + 1}`
  }

  // ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Time picker sub-render ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬

  if (step === 1) return (
    <SafeAreaView style={s.container} edges={['top']}>
      <BackLink label={'\u0051\u0075\u0061\u0079\u0020\u006c\u1ea1\u0069'} onPress={() => router.back()} />
      <WizardHeader
        title={'\u0054\u1ea1\u006f\u0020\u006b\u00e8\u006f\u0020\u006d\u1edb\u0069'}
        subtitle={'\u0042\u01b0\u1edb\u0063\u0020\u0031\u002f\u0033\u0020\u00b7\u0020\u0043\u0068\u1ecd\u006e\u0020\u0073\u00e2\u006e\u0020\u0076\u00e0\u0020\u006b\u0068\u0075\u006e\u0067\u0020\u0067\u0069\u1edd\u0020\u0070\u0068\u00f9\u0020\u0068\u1ee3\u0070\u0020\u0111\u1ec3\u0020\u0062\u1eaf\u0074\u0020\u0111\u1ea7\u0075\u0020\u0074\u1ea1\u006f\u0020\u0074\u0072\u1ead\u006e\u002e'}
      />
      <CreateSessionStep1
        courts={courts}
        loadingCourts={loadingCourts}
        fallbackMode={fallbackMode}
        keyword={keyword}
        setKeyword={setKeyword}
        searching={searching}
        selectedCourt={selectedCourt}
        selectedDate={selectedDate}
        startTime={startTime}
        endTime={endTime}
        showStartPicker={showStartPicker}
        showEndPicker={showEndPicker}
        timeError={timeError}
        duration={duration}
        onCourtSelect={onCourtSelect}
        onChangeCourt={() => {
          setSelectedCourt(null)
          setStartTime(null)
          setEndTime(null)
          setTimeError(null)
          setShowStartPicker(false)
          setShowEndPicker(false)
        }}
        onDateSelect={onDatePress}
        onStartTimeChange={(date) => {
          if (selectedDate) setStartTime(withTime(selectedDate, date))
        }}
        onEndTimeChange={(date) => {
          if (selectedDate) setEndTime(withTime(selectedDate, date))
        }}
        onToggleStartPicker={() => {
          setShowEndPicker(false)
          setShowStartPicker(value => !value)
        }}
        onToggleEndPicker={() => {
          setShowStartPicker(false)
          setShowEndPicker(value => !value)
        }}
        onCloseStartPicker={() => setShowStartPicker(false)}
        onCloseEndPicker={() => setShowEndPicker(false)}
        defaultPickerValue={defaultPickerValue}
        onContinue={goToStep2}
      />
    </SafeAreaView>
  )


  // ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
  // STEP 2 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â CÃƒÂ¡Ã‚ÂºÃ‚Â¥u hÃƒÆ’Ã‚Â¬nh kÃƒÆ’Ã‚Â¨o
  // ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬

  if (step === 2) return (
    <SafeAreaView style={s.container} edges={['top']}>
    <ScrollView contentContainerStyle={{ paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
      <BackLink label="Ãƒâ€žÃ‚ÂÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¢i sÃƒÆ’Ã‚Â¢n / giÃƒÂ¡Ã‚Â»Ã‚Â" onPress={() => setStep(1)} />
      <WizardHeader title="CÃƒÂ¡Ã‚ÂºÃ‚Â¥u hÃƒÆ’Ã‚Â¬nh kÃƒÆ’Ã‚Â¨o" subtitle="BÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã¢â‚¬Âºc 2/3 Ãƒâ€šÃ‚Â· ThiÃƒÂ¡Ã‚ÂºÃ‚Â¿t lÃƒÂ¡Ã‚ÂºÃ‚Â­p sÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœ ngÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã‚Âi, trÃƒÆ’Ã‚Â¬nh Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã¢â€žÂ¢, deadline vÃƒÆ’Ã‚Â  trÃƒÂ¡Ã‚ÂºÃ‚Â¡ng thÃƒÆ’Ã‚Â¡i sÃƒÆ’Ã‚Â¢n." />

      <View style={s.selectedCard}>
        <Text style={s.selectedCardName}>{selectedCourt!.name}</Text>
        <View style={s.inlineMetaRow}>
          <CalendarDays size={14} color="#6b7280" />
          <Text style={s.selectedCardSub}>{fmtDateFull(selectedDate!)} Ãƒâ€šÃ‚Â· {fmtTime(startTime!)} ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ {fmtTime(endTime!)}</Text>
        </View>
        <View style={[s.inlineMetaRow, { marginTop: 6 }]}>
          <Clock3 size={14} color="#6b7280" />
          <Text style={s.selectedCardSub}>{duration}</Text>
        </View>
      </View>

      {/* SÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœ ngÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã‚Âi */}
      <Text style={s.label}>SÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœ ngÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã‚Âi chÃƒâ€ Ã‚Â¡i</Text>
      <View style={s.playerRow}>
        {PLAYER_OPTIONS.map(n => (
          <TouchableOpacity
            key={n}
            style={[s.playerBtn, maxPlayers === n && s.optActive]}
            onPress={() => setMaxPlayers(n)}
          >
            <Text style={[s.playerTxt, maxPlayers === n && s.optTxtActive]}>{n} ngÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã‚Âi</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ELO min */}
      <Text style={s.label}>TrÃƒÆ’Ã‚Â¬nh Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã¢â€žÂ¢ tÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœi thiÃƒÂ¡Ã‚Â»Ã†â€™u</Text>
      <View style={s.optRow}>
        {ELO_LEVELS.map(l => (
          <TouchableOpacity
            key={l.elo}
            style={[s.optBtn, eloMin === l.elo && s.optActive]}
            onPress={() => setEloMin(l.elo)}
          >
            <Text style={[s.optTxt, eloMin === l.elo && s.optTxtActive]}>{l.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ELO max */}
      <Text style={s.label}>TrÃƒÆ’Ã‚Â¬nh Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã¢â€žÂ¢ tÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœi Ãƒâ€žÃ¢â‚¬Ëœa</Text>
      <View style={s.optRow}>
        {ELO_LEVELS.map(l => (
          <TouchableOpacity
            key={l.elo}
            style={[s.optBtn, eloMax === l.elo && s.optActive]}
            onPress={() => setEloMax(l.elo)}
          >
            <Text style={[s.optTxt, eloMax === l.elo && s.optTxtActive]}>{l.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Deadline */}
      <Text style={s.label}>Deadline ghÃƒÆ’Ã‚Â©p ngÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã‚Âi</Text>
      <View style={s.deadlineRow}>
        {DEADLINE_OPTIONS.map(d => (
          <TouchableOpacity
            key={d.hours}
            style={[s.deadlineBtn, deadlineHours === d.hours && s.optActive]}
            onPress={() => setDeadlineHours(d.hours)}
          >
            <Text style={[s.deadlineTxt, deadlineHours === d.hours && s.optTxtActive]}>
              {d.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Text style={s.deadlinePreview}>{deadlinePreview()}</Text>

      {/* DuyÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¡t ngÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã‚Âi tham gia */}
      <View style={s.approvalRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.approvalTitle}>DuyÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¡t ngÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã‚Âi tham gia</Text>
          <Text style={s.approvalSub}>Host xem xÃƒÆ’Ã‚Â©t trÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã¢â‚¬Âºc khi chÃƒÂ¡Ã‚ÂºÃ‚Â¥p nhÃƒÂ¡Ã‚ÂºÃ‚Â­n</Text>
        </View>
        <Switch
          value={requireApproval}
          onValueChange={setRequireApproval}
          trackColor={{ false: '#ddd', true: '#00A651' }}
          thumbColor="#fff"
        />
      </View>

      {/* TiÃƒÂ¡Ã‚Â»Ã‚Ân sÃƒÆ’Ã‚Â¢n */}
      <Text style={s.label}>TiÃƒÂ¡Ã‚Â»Ã‚Ân sÃƒÆ’Ã‚Â¢n (tÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¢ng)</Text>
      <TextInput
        style={s.costInput}
        placeholder="VD: 200000"
        placeholderTextColor="#aaa"
        keyboardType="number-pad"
        value={totalCostStr}
        onChangeText={setTotalCostStr}
        returnKeyType="done"
        onSubmitEditing={Keyboard.dismiss}
      />
      {costPerPerson > 0 && (
        <Text style={s.costPreview}>
          {maxPlayers} ngÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã‚Âi ={' '}
          <Text style={s.costPerPerson}>{costPerPerson.toLocaleString('vi-VN')}Ãƒâ€žÃ¢â‚¬Ëœ/ngÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã‚Âi</Text>
        </Text>
      )}

      <Text style={s.label}>TÃƒÆ’Ã‚Â¬nh trÃƒÂ¡Ã‚ÂºÃ‚Â¡ng Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚ÂºÃ‚Â·t sÃƒÆ’Ã‚Â¢n</Text>
      <View style={s.bookingCard}>
        <TouchableOpacity
          style={[s.bookingOption, courtConfirmationChoice === 'confirmed' && s.bookingOptionActive]}
          onPress={() => {
            setCourtConfirmationChoice('confirmed')
            setBookNowChoice(null)
          }}
        >
          <Text style={[s.bookingOptionTitle, courtConfirmationChoice === 'confirmed' && s.bookingOptionTitleActive]}>
            Ãƒâ€žÃ‚ÂÃƒÆ’Ã‚Â£ Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚ÂºÃ‚Â·t vÃƒÆ’Ã‚Â  xÃƒÆ’Ã‚Â¡c nhÃƒÂ¡Ã‚ÂºÃ‚Â­n sÃƒÆ’Ã‚Â¢n
          </Text>
          <Text style={s.bookingOptionSub}>BÃƒÂ¡Ã‚ÂºÃ‚Â¡n Ãƒâ€žÃ¢â‚¬ËœÃƒÆ’Ã‚Â£ chÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœt sÃƒÆ’Ã‚Â¢n vÃƒÆ’Ã‚Â  cÃƒÆ’Ã‚Â³ thÃƒÂ¡Ã‚Â»Ã†â€™ cung cÃƒÂ¡Ã‚ÂºÃ‚Â¥p thÃƒÆ’Ã‚Â´ng tin booking ngay.</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.bookingOption, courtConfirmationChoice === 'needs_booking' && s.bookingOptionActive]}
          onPress={() => setCourtConfirmationChoice('needs_booking')}
        >
          <Text style={[s.bookingOptionTitle, courtConfirmationChoice === 'needs_booking' && s.bookingOptionTitleActive]}>
            ChÃƒâ€ Ã‚Â°a xÃƒÆ’Ã‚Â¡c nhÃƒÂ¡Ã‚ÂºÃ‚Â­n sÃƒÆ’Ã‚Â¢n
          </Text>
          <Text style={s.bookingOptionSub}>App sÃƒÂ¡Ã‚ÂºÃ‚Â½ hÃƒÂ¡Ã‚Â»Ã‚Âi bÃƒÂ¡Ã‚ÂºÃ‚Â¡n cÃƒÆ’Ã‚Â³ muÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœn Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚ÂºÃ‚Â·t sÃƒÆ’Ã‚Â¢n ngay lÃƒÆ’Ã‚Âºc nÃƒÆ’Ã‚Â y hay cÃƒÂ¡Ã‚ÂºÃ‚Â­p nhÃƒÂ¡Ã‚ÂºÃ‚Â­t sau.</Text>
        </TouchableOpacity>

        {courtConfirmationChoice === 'needs_booking' && (
          <View style={s.bookingFollowup}>
            <Text style={s.bookingQuestion}>BÃƒÂ¡Ã‚ÂºÃ‚Â¡n cÃƒÆ’Ã‚Â³ muÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœn Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚ÂºÃ‚Â·t sÃƒÆ’Ã‚Â¢n ngay bÃƒÆ’Ã‚Â¢y giÃƒÂ¡Ã‚Â»Ã‚Â khÃƒÆ’Ã‚Â´ng?</Text>
            <View style={s.bookingChoiceRow}>
              <TouchableOpacity
                style={[s.bookingMiniBtn, bookNowChoice === true && s.bookingMiniBtnActive]}
                onPress={() => setBookNowChoice(true)}
              >
                <Text style={[s.bookingMiniBtnText, bookNowChoice === true && s.bookingMiniBtnTextActive]}>CÃƒÆ’Ã‚Â³, Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚ÂºÃ‚Â·t luÃƒÆ’Ã‚Â´n</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.bookingMiniBtn, bookNowChoice === false && s.bookingMiniBtnActive]}
                onPress={() => setBookNowChoice(false)}
              >
                <Text style={[s.bookingMiniBtnText, bookNowChoice === false && s.bookingMiniBtnTextActive]}>Ãƒâ€žÃ‚ÂÃƒÂ¡Ã‚Â»Ã†â€™ sau</Text>
              </TouchableOpacity>
            </View>

            {bookNowChoice === true && (
              <View style={s.bookingHelpBox}>
                <Text style={s.bookingHelpText}>MÃƒÂ¡Ã‚Â»Ã…Â¸ link booking cÃƒÂ¡Ã‚Â»Ã‚Â§a sÃƒÆ’Ã‚Â¢n, Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚ÂºÃ‚Â·t sÃƒÆ’Ã‚Â¢n xong rÃƒÂ¡Ã‚Â»Ã¢â‚¬Å“i nhÃƒÂ¡Ã‚ÂºÃ‚Â­p thÃƒÆ’Ã‚Â´ng tin booking bÃƒÆ’Ã‚Âªn dÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã¢â‚¬Âºi Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã†â€™ xÃƒÆ’Ã‚Â¡c nhÃƒÂ¡Ã‚ÂºÃ‚Â­n.</Text>
                <TouchableOpacity style={s.bookingLinkBtn} onPress={openBookingLink}>
                  <Text style={s.bookingLinkBtnText}>MÃƒÂ¡Ã‚Â»Ã…Â¸ link Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚ÂºÃ‚Â·t sÃƒÆ’Ã‚Â¢n</Text>
                </TouchableOpacity>
              </View>
            )}

            {bookNowChoice === false && (
              <View style={s.bookingHelpBox}>
                <Text style={s.bookingHelpText}>KÃƒÆ’Ã‚Â¨o sÃƒÂ¡Ã‚ÂºÃ‚Â½ Ãƒâ€žÃ¢â‚¬ËœÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã‚Â£c tÃƒÂ¡Ã‚ÂºÃ‚Â¡o vÃƒÂ¡Ã‚Â»Ã¢â‚¬Âºi trÃƒÂ¡Ã‚ÂºÃ‚Â¡ng thÃƒÆ’Ã‚Â¡i sÃƒÆ’Ã‚Â¢n chÃƒâ€ Ã‚Â°a xÃƒÆ’Ã‚Â¡c nhÃƒÂ¡Ã‚ÂºÃ‚Â­n. BÃƒÂ¡Ã‚ÂºÃ‚Â¡n cÃƒÆ’Ã‚Â³ thÃƒÂ¡Ã‚Â»Ã†â€™ cÃƒÂ¡Ã‚ÂºÃ‚Â­p nhÃƒÂ¡Ã‚ÂºÃ‚Â­t lÃƒÂ¡Ã‚ÂºÃ‚Â¡i sau khi cÃƒÆ’Ã‚Â³ booking.</Text>
              </View>
            )}
          </View>
        )}

        {((courtConfirmationChoice === 'confirmed') || (courtConfirmationChoice === 'needs_booking' && bookNowChoice === true)) && (
          <View style={s.bookingFields}>
            <Text style={s.bookingFieldTitle}>ThÃƒÆ’Ã‚Â´ng tin booking</Text>
            <TextInput
              style={s.costInput}
              placeholder="MÃƒÆ’Ã‚Â£ booking / mÃƒÆ’Ã‚Â£ Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚ÂºÃ‚Â·t sÃƒÆ’Ã‚Â¢n"
              placeholderTextColor="#aaa"
              value={bookingReference}
              onChangeText={setBookingReference}
            />
            <TextInput
              style={s.costInput}
              placeholder="TÃƒÆ’Ã‚Âªn ngÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã‚Âi Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚ÂºÃ‚Â·t"
              placeholderTextColor="#aaa"
              value={bookingName}
              onChangeText={setBookingName}
            />
            <TextInput
              style={s.costInput}
              placeholder="SÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœ Ãƒâ€žÃ¢â‚¬ËœiÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¡n thoÃƒÂ¡Ã‚ÂºÃ‚Â¡i booking"
              placeholderTextColor="#aaa"
              keyboardType="phone-pad"
              value={bookingPhone}
              onChangeText={setBookingPhone}
            />
            <TextInput
              style={[s.costInput, s.bookingNotesInput]}
              placeholder="Ghi chÃƒÆ’Ã‚Âº booking"
              placeholderTextColor="#aaa"
              multiline
              value={bookingNotes}
              onChangeText={setBookingNotes}
            />
            <Text style={s.bookingFootnote}>CÃƒÂ¡Ã‚ÂºÃ‚Â§n ÃƒÆ’Ã‚Â­t nhÃƒÂ¡Ã‚ÂºÃ‚Â¥t mÃƒÂ¡Ã‚Â»Ã¢â€žÂ¢t thÃƒÆ’Ã‚Â´ng tin booking Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã†â€™ xÃƒÆ’Ã‚Â¡c nhÃƒÂ¡Ã‚ÂºÃ‚Â­n sÃƒÆ’Ã‚Â¢n.</Text>
          </View>
        )}
      </View>

      <TouchableOpacity style={s.nextBtn} onPress={goToStep3}>
        <Text style={s.nextBtnTxt}>Xem lÃƒÂ¡Ã‚ÂºÃ‚Â¡i kÃƒÆ’Ã‚Â¨o ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢</Text>
      </TouchableOpacity>
    </ScrollView>
    </SafeAreaView>
  )

  // ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬
  // STEP 3 ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Review + Publish
  // ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬

  return (
    <SafeAreaView style={s.container} edges={['top']}>
    <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
      <BackLink label="ChÃƒÂ¡Ã‚Â»Ã¢â‚¬Â°nh lÃƒÂ¡Ã‚ÂºÃ‚Â¡i" onPress={() => setStep(2)} />
      <WizardHeader title="XÃƒÆ’Ã‚Â¡c nhÃƒÂ¡Ã‚ÂºÃ‚Â­n & Ãƒâ€žÃ¢â‚¬ËœÃƒâ€žÃ†â€™ng kÃƒÆ’Ã‚Â¨o" subtitle="BÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã¢â‚¬Âºc 3/3 Ãƒâ€šÃ‚Â· KiÃƒÂ¡Ã‚Â»Ã†â€™m tra lÃƒÂ¡Ã‚ÂºÃ‚Â¡i toÃƒÆ’Ã‚Â n bÃƒÂ¡Ã‚Â»Ã¢â€žÂ¢ thÃƒÆ’Ã‚Â´ng tin trÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã¢â‚¬Âºc khi publish." />

      <View style={s.reviewCard}>
        <ReviewRow icon={<ShieldCheck size={18} color="#059669" />} label="SÃƒÆ’Ã‚Â¢n" value={selectedCourt!.name} />
        <ReviewRow icon={<MapPin size={18} color="#6b7280" />} label="Ãƒâ€žÃ‚ÂÃƒÂ¡Ã‚Â»Ã¢â‚¬Â¹a chÃƒÂ¡Ã‚Â»Ã¢â‚¬Â°" value={`${selectedCourt!.address} Ãƒâ€šÃ‚Â· ${selectedCourt!.city}`} />
        <ReviewRow icon={<CalendarDays size={18} color="#4f46e5" />} label="NgÃƒÆ’Ã‚Â y" value={fmtDateFull(selectedDate!)} />
        <ReviewRow icon={<Clock3 size={18} color="#4f46e5" />} label="GiÃƒÂ¡Ã‚Â»Ã‚Â" value={`${fmtTime(startTime!)} ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ ${fmtTime(endTime!)}`} />
        <ReviewRow icon={<Clock3 size={18} color="#6b7280" />} label="ThÃƒÂ¡Ã‚Â»Ã‚Âi lÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã‚Â£ng" value={duration ?? ''} />
        <ReviewRow icon={<Users size={18} color="#059669" />} label="SÃƒÂ¡Ã‚Â»Ã¢â‚¬Ëœ ngÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã‚Âi" value={`${maxPlayers} ngÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã‚Âi`} />
        <ReviewRow icon={<ShieldCheck size={18} color="#111827" />} label="TrÃƒÆ’Ã‚Â¬nh Ãƒâ€žÃ¢â‚¬ËœÃƒÂ¡Ã‚Â»Ã¢â€žÂ¢" value={`${eloLabel(eloMin)} ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ ${eloLabel(eloMax)}`} />
        {costPerPerson > 0 && (
          <ReviewRow icon={<Wallet size={18} color="#111827" />} label="Chi phÃƒÆ’Ã‚Â­" value={`${costPerPerson.toLocaleString('vi-VN')}Ãƒâ€žÃ¢â‚¬Ëœ/ngÃƒâ€ Ã‚Â°ÃƒÂ¡Ã‚Â»Ã‚Âi`} />
        )}
        <ReviewRow icon={<Clock3 size={18} color="#c2410c" />} label="Deadline" value={deadlinePreview()} />
        <ReviewRow icon={<CheckCircle2 size={18} color="#059669" />} label="TÃƒÆ’Ã‚Â¬nh trÃƒÂ¡Ã‚ÂºÃ‚Â¡ng sÃƒÆ’Ã‚Â¢n" value={bookingStatusLabel()} />
        {hasBookingInfo() && (
          <ReviewRow
            icon={<CheckCircle2 size={18} color="#111827" />}
            label="Booking"
            value={[bookingReference, bookingName, bookingPhone].filter((value) => value.trim().length > 0).join(' Ãƒâ€šÃ‚Â· ') || bookingNotes}
          />
        )}
      </View>

      <TouchableOpacity
        style={[s.submitBtn, submitting && s.submitBtnDisabled]}
        onPress={submit}
        disabled={submitting}
      >
        <Text style={s.submitTxt}>{submitting ? 'Ãƒâ€žÃ‚Âang tÃƒÂ¡Ã‚ÂºÃ‚Â¡o kÃƒÆ’Ã‚Â¨o...' : 'TÃƒÂ¡Ã‚ÂºÃ‚Â¡o kÃƒÆ’Ã‚Â¨o'}</Text>
      </TouchableOpacity>
    </ScrollView>
    </SafeAreaView>
  )
}

function ReviewRow({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <View style={s.reviewRow}>
      <View style={s.reviewIconWrap}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={s.reviewLabel}>{label}</Text>
        <Text style={s.reviewValue}>{value}</Text>
      </View>
    </View>
  )
}

// ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ Styles ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#f5f5f4', paddingHorizontal: 20 },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: '#64748b', marginTop: 8 },
  backBtn:     { marginBottom: 8 },
  backText:    { fontSize: 14, color: '#16a34a', fontWeight: '600' },
  title:       { fontSize: 30, fontWeight: '900', color: '#020617', marginBottom: 6 },
  stepLabel:   { fontSize: 13, color: '#64748b', marginBottom: 24, fontWeight: '600' },
  headerWrap: { marginBottom: 20 },
  headerEyebrow: { fontSize: 12, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase', color: '#6b7280', marginBottom: 8 },
  headerTitle: { fontSize: 30, fontWeight: '900', color: '#020617', marginBottom: 8 },
  headerSubtitle: { fontSize: 14, lineHeight: 21, color: '#64748b' },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  backLinkText: { fontSize: 14, color: '#059669', fontWeight: '700' },
  label:       { fontSize: 14, fontWeight: '600', color: '#333', marginTop: 20, marginBottom: 10 },
  noResult:    { fontSize: 14, color: '#888', textAlign: 'center', marginTop: 32 },
  inlineMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  // Search (fallback)
  searchInput: { borderWidth: 1.5, borderColor: '#cbd5e1', borderRadius: 18, paddingHorizontal: 16, height: 52, fontSize: 16, color: '#334155', marginBottom: 12, backgroundColor: '#fff' },

  // Court list
  courtItem:  { paddingVertical: 16, paddingHorizontal: 16, borderRadius: 24, marginBottom: 12, backgroundColor: '#fff', shadowColor: '#0f172a', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 1 },
  courtRow:   { flexDirection: 'row', alignItems: 'flex-start' },
  courtName:  { fontSize: 15, fontWeight: '600', color: '#111', marginBottom: 2 },
  courtAddr:  { fontSize: 13, color: '#6b7280', flexShrink: 1 },
  courtMeta:  { alignItems: 'flex-end', gap: 6 },
  distText:   { fontSize: 12, color: '#555', fontWeight: '500' },
  badge:      { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  badgeOpen:      { backgroundColor: '#f0fdf4' },
  badgeClosed:    { backgroundColor: '#f3f4f6' },
  badgeTxt:       { fontSize: 11, fontWeight: '600' },
  badgeTxtOpen:   { color: '#16a34a' },
  badgeTxtClosed: { color: '#9ca3af' },

  // Selected court card
  selectedCard:      { backgroundColor: '#ffffff', borderRadius: 24, padding: 18, marginBottom: 12, shadowColor: '#0f172a', shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  selectedCardRow:   { flexDirection: 'row', alignItems: 'flex-start' },
  selectedCardLabel: { fontSize: 12, color: '#16a34a', fontWeight: '600', marginBottom: 4 },
  selectedCardName:  { fontSize: 16, fontWeight: '700', color: '#111', marginBottom: 4 },
  selectedCardSub:   { fontSize: 13, color: '#555', marginBottom: 2 },
  changeTxt:         { fontSize: 13, color: '#16a34a', fontWeight: '600', marginTop: 4 },

  // Date chips
  dateChip:          { width: 72, height: 64, borderWidth: 1.5, borderColor: '#ddd', borderRadius: 12, marginRight: 8, alignItems: 'center', justifyContent: 'center' },
  dateChipActive:    { borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
  dateChipTxt:       { fontSize: 12, color: '#555', textAlign: 'center', lineHeight: 17 },
  dateChipTxtActive: { color: '#16a34a', fontWeight: '700' },

  // Time picker
  timeRow:          { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
  timeArrow:        { fontSize: 18, color: '#888', marginTop: 20 },
  timeBlock:        { flex: 1 },
  timeBlockLabel:   { fontSize: 12, color: '#888', fontWeight: '600', marginBottom: 6 },
  timeBtn:          { backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: '#cbd5e1', borderRadius: 18, padding: 16, alignItems: 'center' },
  timeBtnDisabled:  { backgroundColor: '#fafafa', borderColor: '#f0f0f0' },
  timeBtnTxt:       { fontSize: 24, fontWeight: 'bold', color: '#111' },
  timeBtnPlaceholder: { fontSize: 24, fontWeight: 'bold', color: '#AAAAAA' },
  durationTxt:      { fontSize: 13, color: '#16a34a', fontWeight: '600', marginTop: 4 },
  timeError:        { fontSize: 13, color: '#dc2626', marginTop: 6 },
  courtNote:        { backgroundColor: '#fffbeb', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, marginTop: 16 },
  courtNoteTxt:     { fontSize: 13, color: '#92400e' },

  // Inline time picker
  inlinePicker:       { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E0E0E0', marginTop: 8, borderRadius: 12 },
  inlinePickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#E0E0E0' },
  inlinePickerCancel: { fontSize: 16, color: '#666' },
  inlinePickerTitle:  { fontSize: 16, fontWeight: '600', color: '#111' },
  inlinePickerDone:   { fontSize: 16, fontWeight: '600', color: '#00A651' },

  // Shared option buttons
  optRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optBtn:      { borderWidth: 1.5, borderColor: '#cbd5e1', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#fff' },
  optActive:   { borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
  optTxt:      { fontSize: 13, color: '#555' },
  optTxtActive:{ color: '#16a34a', fontWeight: '600' },

  // Player count
  playerRow: { flexDirection: 'row', gap: 12 },
  playerBtn: { flex: 1, borderWidth: 1.5, borderColor: '#cbd5e1', borderRadius: 18, paddingVertical: 14, alignItems: 'center', backgroundColor: '#fff' },
  playerTxt: { fontSize: 14, fontWeight: '600', color: '#555' },

  // Deadline
  deadlineRow:     { flexDirection: 'row', gap: 8 },
  deadlineBtn:     { flex: 1, borderWidth: 1.5, borderColor: '#cbd5e1', borderRadius: 18, paddingVertical: 12, alignItems: 'center', backgroundColor: '#fff' },
  deadlineTxt:     { fontSize: 13, fontWeight: '600', color: '#555' },
  deadlinePreview: { fontSize: 12, color: '#888', marginTop: 8 },
  approvalRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#f0f0f0', marginTop: 8 },
  approvalTitle: { fontSize: 15, fontWeight: '600', color: '#111', marginBottom: 2 },
  approvalSub:   { fontSize: 12, color: '#888' },

  // Cost
  costInput:     { borderWidth: 1.5, borderColor: '#cbd5e1', borderRadius: 18, paddingHorizontal: 16, height: 52, fontSize: 16, color: '#334155', backgroundColor: '#fff' },
  costPreview:   { fontSize: 13, color: '#555', marginTop: 8 },
  costPerPerson: { fontWeight: '700', color: '#16a34a' },
  bookingCard: { backgroundColor: '#ffffff', borderRadius: 24, padding: 16, marginTop: 12, gap: 12, shadowColor: '#0f172a', shadowOpacity: 0.05, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  bookingOption: { borderWidth: 1.5, borderColor: '#e2e8f0', borderRadius: 18, padding: 14, backgroundColor: '#fff' },
  bookingOptionActive: { borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
  bookingOptionTitle: { fontSize: 15, fontWeight: '700', color: '#111', marginBottom: 4 },
  bookingOptionTitleActive: { color: '#166534' },
  bookingOptionSub: { fontSize: 13, color: '#6b7280', lineHeight: 18 },
  bookingFollowup: { gap: 12 },
  bookingQuestion: { fontSize: 14, fontWeight: '600', color: '#111' },
  bookingChoiceRow: { flexDirection: 'row', gap: 10 },
  bookingMiniBtn: { flex: 1, borderWidth: 1.5, borderColor: '#d1d5db', borderRadius: 18, paddingVertical: 12, alignItems: 'center', backgroundColor: '#fff' },
  bookingMiniBtnActive: { borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
  bookingMiniBtnText: { fontSize: 14, fontWeight: '600', color: '#4b5563' },
  bookingMiniBtnTextActive: { color: '#166534' },
  bookingHelpBox: { backgroundColor: '#fffbeb', borderRadius: 18, padding: 12, gap: 10 },
  bookingHelpText: { fontSize: 13, color: '#92400e', lineHeight: 18 },
  bookingLinkBtn: { backgroundColor: '#16a34a', borderRadius: 16, paddingVertical: 12, alignItems: 'center' },
  bookingLinkBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  bookingFields: { gap: 10 },
  bookingFieldTitle: { fontSize: 14, fontWeight: '700', color: '#111' },
  bookingNotesInput: { height: 92, paddingTop: 14, textAlignVertical: 'top' },
  bookingFootnote: { fontSize: 12, color: '#6b7280' },

  // Next button
  nextBtn:    { backgroundColor: '#16a34a', borderRadius: 18, height: 56, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  nextBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Review card
  reviewCard:  { backgroundColor: '#ffffff', borderRadius: 28, padding: 20, gap: 16, marginBottom: 24, shadowColor: '#0f172a', shadowOpacity: 0.05, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  reviewRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  reviewIcon:  { fontSize: 18, marginTop: 1 },
  reviewIconWrap: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center' },
  reviewLabel: { fontSize: 12, color: '#888', marginBottom: 2 },
  reviewValue: { fontSize: 14, fontWeight: '600', color: '#111' },

  // Submit
  submitBtn:         { backgroundColor: '#16a34a', borderRadius: 18, height: 56, alignItems: 'center', justifyContent: 'center' },
  submitBtnDisabled: { backgroundColor: '#86efac' },
  submitTxt:         { color: '#fff', fontSize: 17, fontWeight: '700' },
})
