import { CreateSessionStep1 } from '@/components/create-session/CreateSessionStep1'
import { CreateSessionStep2 } from '@/components/create-session/CreateSessionStep2'
import { CreateSessionStep3 } from '@/components/create-session/CreateSessionStep3'
import { PROFILE_THEME_COLORS } from '@/components/profile/profileTheme'
import { CREATE_SESSION_ELO_LEVELS, ELO_BANDS } from '@/lib/eloSystem'
import type { SessionDetailRecord } from '@/hooks/useSessionDetail'
import { supabase } from '@/lib/supabase'
import { type NearByCourt, useNearbyCourts } from '@/lib/useNearbyCourts'
import * as Linking from 'expo-linking'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { SPACING } from '@/constants/screenLayout'
import { NavbarUserAvatar, SecondaryNavbar } from '@/components/design'
import { useHomeFeedData } from '@/hooks/useHomeFeedData'
import { useAuth } from '@/lib/useAuth'

function toMins(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

function parseTotalCost(value: string) {
  return parseInt(value.replace(/\D/g, ''), 10) || 0
}

function withTime(base: Date, time: Date): Date {
  const next = new Date(base)
  next.setHours(time.getHours(), time.getMinutes(), 0, 0)
  return next
}

function nearestDeadlineMinutes(value: number | null | undefined): number {
  const options = [30, 45, 60, 120]
  if (!value || value <= 0) return 60
  return options.reduce((closest, current) =>
    Math.abs(current - value) < Math.abs(closest - value) ? current : closest,
  options[0])
}

function skillLevelFromElo(elo: number, edge: 'min' | 'max'): number {
  const levels = CREATE_SESSION_ELO_LEVELS.map((item) => item.elo)
  if (edge === 'min') {
    let idx = 0
    for (let i = 0; i < levels.length; i += 1) {
      if (levels[i] <= elo) idx = i
    }
    return idx + 1
  }

  for (let i = 0; i < levels.length; i += 1) {
    if (levels[i] >= elo) return i + 1
  }
  return levels.length
}

export default function CreateSession() {
  const { userId, isAuthLoading } = useAuth()
  const params = useLocalSearchParams<{ editSessionId?: string }>()
  const router = useRouter()
  const editSessionId = typeof params.editSessionId === 'string' ? params.editSessionId : null
  const isEditMode = Boolean(editSessionId)
  const [step, setStep] = useState<1 | 2 | 3>(1)

  const { courts, loading: loadingCourts, fallbackMode, keyword, setKeyword, searching } = useNearbyCourts()

  const [selectedCourt, setSelectedCourt] = useState<NearByCourt | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [endTime, setEndTime] = useState<Date | null>(null)
  const [showStartPicker, setShowStartPicker] = useState(false)
  const [showEndPicker, setShowEndPicker] = useState(false)
  const [timeError, setTimeError] = useState<string | null>(null)

  const [maxPlayers, setMaxPlayers] = useState(4)
  const [eloMin, setEloMin] = useState(CREATE_SESSION_ELO_LEVELS[0].elo)
  const [eloMax, setEloMax] = useState(CREATE_SESSION_ELO_LEVELS[4].elo)
  const [deadlineMinutes, setDeadlineMinutes] = useState(60)
  const [requireApproval, setRequireApproval] = useState(false)
  const [isRanked, setIsRanked] = useState(true)
  const [canToggleRanked, setCanToggleRanked] = useState(false)
  const [rankedHelperText, setRankedHelperText] = useState<string | null>('\u0110ang ki\u1ec3m tra quy\u1ec1n d\u00f9ng k\u00e8o t\u00ednh Elo...')
  const [totalCostStr, setTotalCostStr] = useState('')
  const [minSkill, setMinSkill] = useState(1)
  const [maxSkill, setMaxSkill] = useState(5)
  const [bookingStatus, setBookingStatus] = useState<'confirmed' | 'unconfirmed'>('confirmed')
  const [wantsBookingNow, setWantsBookingNow] = useState<boolean | null>(null)
  const [bookingReference, setBookingReference] = useState('')
  const [bookingName, setBookingName] = useState('')
  const [bookingPhone, setBookingPhone] = useState('')
  const [bookingNotes, setBookingNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [isHydratingEdit, setIsHydratingEdit] = useState(false)
  const [editHydrated, setEditHydrated] = useState(false)
  const [lockCourtSchedule, setLockCourtSchedule] = useState(false)
  const [lockedSlotSnapshot, setLockedSlotSnapshot] = useState<{ courtId: string; startIso: string; endIso: string } | null>(null)
  const totalCost = useMemo(() => parseTotalCost(totalCostStr), [totalCostStr])
  const costPerPerson = totalCost > 0 ? Math.ceil(totalCost / maxPlayers) : 0

  useEffect(() => {
    if (isEditMode) return
    setLockCourtSchedule(false)
    setLockedSlotSnapshot(null)
  }, [isEditMode])

  useEffect(() => {
    if (!isEditMode || !editSessionId || editHydrated) return
    let mounted = true

    async function hydrateEditSession() {
      setIsHydratingEdit(true)

      const [{ data: authData }, detailResult] = await Promise.all([
        supabase.auth.getUser(),
        supabase.rpc('get_session_detail_overview', { p_session_id: editSessionId }),
      ])

      const user = authData.user
      const session = (detailResult.data?.session ?? null) as SessionDetailRecord | null

      if (!mounted) return

      if (!user) {
        Alert.alert('\u0043\u1ea7n \u0111\u0103ng nh\u1eadp', '\u0042\u1ea1n c\u1ea7n \u0111\u0103ng nh\u1eadp \u0111\u1ec3 ch\u1ec9nh s\u1eeda k\u00e8o.')
        router.back()
        return
      }

      if (detailResult.error || !session) {
        Alert.alert('\u004c\u1ed7i', detailResult.error?.message ?? 'Kh\u00f4ng t\u1ea3i \u0111\u01b0\u1ee3c d\u1eef li\u1ec7u k\u00e8o.')
        router.back()
        return
      }

      if (session.host.id !== user.id) {
        Alert.alert('\u004b\u00f4ng c\u00f3 quy\u1ec1n', '\u0042\u1ea1n kh\u00f4ng ph\u1ea3i ch\u1ee7 k\u00e8o n\u00ean kh\u00f4ng th\u1ec3 ch\u1ec9nh s\u1eeda.')
        router.back()
        return
      }

      const nextStart = new Date(session.slot.start_time)
      const nextEnd = new Date(session.slot.end_time)
      const nextDate = new Date(nextStart)
      nextDate.setHours(0, 0, 0, 0)

      const fillDeadlineMs = session.fill_deadline ? new Date(session.fill_deadline).getTime() : null
      const deadlineDiffMins =
        fillDeadlineMs != null ? Math.max(0, Math.round((nextStart.getTime() - fillDeadlineMs) / 60_000)) : 60

      const nextCourt: NearByCourt = {
        id: session.slot.court.id ?? '',
        name: session.slot.court.name,
        address: session.slot.court.address,
        city: session.slot.court.city,
        lat: null,
        lng: null,
        hours_open: '06:00',
        hours_close: '22:00',
        price_per_hour: null,
        booking_url: null,
        google_maps_url: null,
      }

      const matchedCourt = courts.find((item) => item.id === nextCourt.id) ?? nextCourt

      const minLevel = skillLevelFromElo(session.elo_min, 'min')
      const maxLevel = skillLevelFromElo(session.elo_max, 'max')
      const sendBookingDetails = session.court_booking_status === 'confirmed' || Boolean(session.booking_reference || session.booking_name || session.booking_phone || session.booking_notes)

      setSelectedCourt(matchedCourt)
      setSelectedDate(nextDate)
      setStartTime(nextStart)
      setEndTime(nextEnd)
      setTimeError(null)

      setMaxPlayers(session.max_players <= 2 ? 2 : 4)
      setEloMin(session.elo_min)
      setEloMax(session.elo_max)
      setMinSkill(Math.max(1, Math.min(minLevel, 5)))
      setMaxSkill(Math.max(1, Math.min(Math.max(maxLevel, minLevel), 5)))
      setDeadlineMinutes(nearestDeadlineMinutes(deadlineDiffMins))
      setRequireApproval(Boolean(session.require_approval))
      setIsRanked(Boolean(session.is_ranked))
      setBookingStatus(session.court_booking_status ?? 'unconfirmed')
      setWantsBookingNow(session.court_booking_status === 'unconfirmed' ? (sendBookingDetails ? true : null) : null)
      setBookingReference(session.booking_reference ?? '')
      setBookingName(session.booking_name ?? '')
      setBookingPhone(session.booking_phone ?? '')
      setBookingNotes(session.booking_notes ?? '')
      setTotalCostStr(session.slot.price && session.slot.price > 0 ? String(session.slot.price) : '')
      setLockCourtSchedule(session.court_booking_status === 'confirmed')
      setLockedSlotSnapshot(
        session.court_booking_status === 'confirmed'
          ? {
              courtId: session.slot.court.id ?? '',
              startIso: nextStart.toISOString(),
              endIso: nextEnd.toISOString(),
            }
          : null,
      )

      setEditHydrated(true)
      setIsHydratingEdit(false)
    }

    void hydrateEditSession()

    return () => {
      mounted = false
    }
  }, [courts, editHydrated, editSessionId, isEditMode, router])

  const validateStart = useCallback((time: Date): string | null => {
    const now = new Date()
    const isToday = selectedDate?.toDateString() === now.toDateString()
    const openMins = toMins(selectedCourt?.hours_open ?? '06:00')
    const closeMins = toMins(selectedCourt?.hours_close ?? '22:00')
    const timeMins = time.getHours() * 60 + time.getMinutes()

    if (isToday && time <= now) return '\u0047i\u1edd b\u1eaft \u0111\u1ea7u ph\u1ea3i sau th\u1eddi gian hi\u1ec7n t\u1ea1i'
    if (timeMins < openMins) return `S\u00e2n m\u1edf c\u1eeda l\u00fac ${selectedCourt?.hours_open ?? '06:00'}`
    if (timeMins >= closeMins) return `S\u00e2n \u0111\u00f3ng c\u1eeda l\u00fac ${selectedCourt?.hours_close ?? '22:00'}`
    return null
  }, [selectedCourt?.hours_close, selectedCourt?.hours_open, selectedDate])

  const validateEnd = useCallback((end: Date, start: Date): string | null => {
    const closeMins = toMins(selectedCourt?.hours_close ?? '22:00')
    const endMins = end.getHours() * 60 + end.getMinutes()

    if (end <= start) return '\u0047i\u1edd k\u1ebft th\u00fac ph\u1ea3i sau gi\u1edd b\u1eaft \u0111\u1ea7u'
    if (endMins > closeMins) return `S\u00e2n \u0111\u00f3ng c\u1eeda l\u00fac ${selectedCourt?.hours_close ?? '22:00'}`
    return null
  }, [selectedCourt?.hours_close])

  useEffect(() => {
    if (!startTime) {
      setTimeError(null)
      return
    }

    const startErr = validateStart(startTime)
    if (startErr) {
      setTimeError(startErr)
      return
    }

    if (!endTime) {
      setTimeError(null)
      return
    }

    setTimeError(validateEnd(endTime, startTime))
  }, [endTime, startTime, validateEnd, validateStart])

  useEffect(() => {
    let mounted = true

    async function loadRankedEligibility() {
      const { data: authData } = await supabase.auth.getUser()
      const user = authData.user

      if (!user) {
        if (!mounted) return
        if (!isEditMode) setIsRanked(false)
        setCanToggleRanked(false)
        setRankedHelperText('\u0110\u0103ng nh\u1eadp \u0111\u1ec3 ch\u1ecdn k\u00e8o c\u00f3 t\u00ednh Elo.')
        return
      }

      const { data: playerRow } = await supabase
        .from('players')
        .select('onboarding_completed')
        .eq('id', user.id)
        .single()

      const onboardingCompleted = Boolean(playerRow?.onboarding_completed)

      if (!mounted) return

      setCanToggleRanked(onboardingCompleted)
      if (!onboardingCompleted) {
        if (!isEditMode) setIsRanked(false)
        setRankedHelperText('Ho\u00e0n t\u1ea5t onboarding \u0111\u1ec3 d\u00f9ng k\u00e8o t\u00ednh Elo.')
        return
      }

      if (!isEditMode) setIsRanked(true)
      setRankedHelperText('B\u1ea1n c\u00f3 th\u1ec3 b\u1eadt ho\u1eb7c t\u1eaft Elo cho k\u00e8o n\u00e0y tr\u01b0\u1edbc khi \u0111\u0103ng.')
    }

    void loadRankedEligibility()

    return () => {
      mounted = false
    }
  }, [isEditMode])

  const defaultPickerValue = useCallback((type: 'start' | 'end'): Date => {
    const base = selectedDate ?? new Date()
    const next = new Date(base)
    if (type === 'start') {
      next.setHours(18, 0, 0, 0)
      return next
    }
    next.setHours(20, 0, 0, 0)
    return next
  }, [selectedDate])

  function onCourtSelect(court: NearByCourt) {
    setSelectedCourt(court)
    setStartTime(null)
    setEndTime(null)
    setTimeError(null)
    setWantsBookingNow(null)
    setBookingReference('')
    setBookingName('')
    setBookingPhone('')
    setBookingNotes('')
  }

  async function openCourtBookingLink() {
    const url = selectedCourt?.booking_url ?? selectedCourt?.google_maps_url
    if (!url) {
      Alert.alert(
        'Ch\u01b0a c\u00f3 link \u0111\u1eb7t s\u00e2n',
        'S\u00e2n n\u00e0y ch\u01b0a c\u00f3 link booking. B\u1ea1n v\u1eabn c\u00f3 th\u1ec3 t\u1ef1 \u0111\u1eb7t r\u1ed3i nh\u1eadp th\u00f4ng tin b\u00ean d\u01b0\u1edbi.',
      )
      return
    }

    try {
      await Linking.openURL(url)
    } catch {
      Alert.alert(
        'Kh\u00f4ng m\u1edf \u0111\u01b0\u1ee3c link',
        'Vui l\u00f2ng th\u1eed l\u1ea1i ho\u1eb7c m\u1edf link booking c\u1ee7a s\u00e2n theo c\u00e1ch kh\u00e1c.',
      )
    }
  }

  function onDatePress(date: Date) {
    setSelectedDate(date)
    if (startTime) setStartTime(withTime(date, startTime))
    if (endTime) setEndTime(withTime(date, endTime))
    setTimeError(null)
  }

  function goToStep2() {
    if (!selectedCourt || !selectedDate || !startTime || !endTime || timeError) return
    setStep(2)
  }

  function goToStep3FromNew() {
    const minElo = ELO_BANDS[minSkill - 1].eloMin
    const maxElo = ELO_BANDS[maxSkill - 1].eloMax

    if (minElo > maxElo) {
      Alert.alert('L\u1ed7i', 'Tr\u00ecnh \u0111\u1ed9 t\u1ed1i thi\u1ec3u kh\u00f4ng th\u1ec3 cao h\u01a1n tr\u00ecnh \u0111\u1ed9 t\u1ed1i \u0111a.')
      return
    }

    setEloMin(minElo)
    setEloMax(maxElo)
    setStep(3)
  }
  async function submit() {
    if (!selectedCourt || !startTime || !endTime) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        Alert.alert('\u0043\u1ea7\u006e\u0020\u0111\u0103\u006e\u0067\u0020\u006e\u0068\u1ead\u0070', `\u0042\u1ea1\u006e\u0020\u0063\u1ea7\u006e\u0020\u0111\u0103\u006e\u0067\u0020\u006e\u0068\u1ead\u0070\u0020\u0111\u1ec3\u0020${isEditMode ? '\u0063\u1ead\u0070\u0020\u006e\u0068\u1ead\u0074' : '\u0074\u1ea1\u006f'}\u0020\u006b\u00e8\u006f\u002e`, [
          { text: '\u0110\u0103\u006e\u0067\u0020\u006e\u0068\u1ead\u0070', onPress: () => router.push('/login') },
          { text: '\u0048\u1ee7\u0079', style: 'cancel' },
        ])
        return
      }

      setSubmitting(true)

      const sendBookingDetails = bookingStatus === 'confirmed' || wantsBookingNow === true
      const fillDeadline = new Date(startTime.getTime() - deadlineMinutes * 60_000)
      if (fillDeadline.getTime() <= Date.now()) {
        Alert.alert(
          '\u0048\u1ea1\u006e\u0020\u0063\u0068\u00f3\u0074\u0020\u0063\u0068\u01b0\u0061\u0020\u0068\u1ee3\u0070\u0020\u006c\u1ec7',
          '\u0048\u1ea1\u006e\u0020\u0063\u0068\u00f3\u0074\u0020\u0076\u00e0\u006f\u0020\u006b\u00e8\u006f\u0020\u0070\u0068\u1ea3\u0069\u0020\u006e\u1eb1\u006d\u0020\u0074\u0072\u006f\u006e\u0067\u0020\u0074\u01b0\u01a1\u006e\u0067\u0020\u006c\u0061\u0069\u002e\u0020\u0048\u00e3\u0079\u0020\u0063\u0068\u1ecd\u006e\u0020\u0067\u0069\u1edd\u0020\u0063\u0068\u01a1\u0069\u0020\u006d\u0075\u1ed9\u006e\u0020\u0068\u01a1\u006e\u0020\u0068\u006f\u1eb7\u0063\u0020\u0067\u0069\u1ea3\u006d\u0020\u006d\u1ed1\u0063\u0020\u0068\u1ea1\u006e\u0020\u0063\u0068\u00f3\u0074\u002e',
        )
        return
      }

      if (isEditMode && lockCourtSchedule && lockedSlotSnapshot) {
        const changedCourt = selectedCourt.id !== lockedSlotSnapshot.courtId
        const changedStart = startTime.toISOString() !== lockedSlotSnapshot.startIso
        const changedEnd = endTime.toISOString() !== lockedSlotSnapshot.endIso
        if (changedCourt || changedStart || changedEnd) {
          Alert.alert('Kh\u00f4ng th\u1ec3 thay \u0111\u1ed5i', 'K\u00e8o \u0111\u00e3 \u0111\u1eb7t s\u00e2n n\u00ean kh\u00f4ng th\u1ec3 \u0111\u1ed5i s\u00e2n v\u00e0 ng\u00e0y gi\u1edd ch\u01a1i.')
          return
        }
      }

      const basePayload = {
        p_court_id: selectedCourt.id,
        p_start_time: startTime.toISOString(),
        p_end_time: endTime.toISOString(),
        p_elo_min: eloMin,
        p_elo_max: eloMax,
        p_is_ranked: isRanked,
        p_max_players: maxPlayers,
        p_fill_deadline: fillDeadline.toISOString(),
        p_total_cost: totalCost || null,
        p_require_approval: requireApproval,
        p_court_booking_status: bookingStatus,
      }

      const fullPayload = {
        ...basePayload,
        p_booking_reference: sendBookingDetails ? bookingReference.trim() || null : null,
        p_booking_name: sendBookingDetails ? bookingName.trim() || null : null,
        p_booking_phone: sendBookingDetails ? bookingPhone.trim() || null : null,
        p_booking_notes: sendBookingDetails ? bookingNotes.trim() || null : null,
        p_booking_confirmed_at: bookingStatus === 'confirmed' ? new Date().toISOString() : null,
      }

      if (isEditMode && editSessionId) {
        let { data: updatedSessionId, error: updateError } = await supabase.rpc('update_session_with_host', {
          p_session_id: editSessionId,
          ...fullPayload,
        })

        const missingUpdateFunction =
          Boolean(updateError?.message?.includes('Could not find the function public.update_session_with_host')) ||
          updateError?.code === '42883'

        if (missingUpdateFunction) {
          const { data: currentSession, error: fetchSessionError } = await supabase
            .from('sessions')
            .select('id, slot_id, host_id')
            .eq('id', editSessionId)
            .eq('host_id', user.id)
            .single()

          if (fetchSessionError || !currentSession?.slot_id) {
            updateError = fetchSessionError ?? updateError
          } else {
            const sessionUpdate = await supabase
              .from('sessions')
              .update({
                elo_min: eloMin,
                elo_max: eloMax,
                is_ranked: isRanked,
                max_players: maxPlayers,
                fill_deadline: fillDeadline.toISOString(),
                total_cost: totalCost || null,
                require_approval: requireApproval,
                court_booking_status: bookingStatus,
                booking_reference: sendBookingDetails ? bookingReference.trim() || null : null,
                booking_name: sendBookingDetails ? bookingName.trim() || null : null,
                booking_phone: sendBookingDetails ? bookingPhone.trim() || null : null,
                booking_notes: sendBookingDetails ? bookingNotes.trim() || null : null,
                booking_confirmed_at: bookingStatus === 'confirmed' ? new Date().toISOString() : null,
              })
              .eq('id', editSessionId)
              .eq('host_id', user.id)

            if (sessionUpdate.error) {
              updateError = sessionUpdate.error
            } else {
              const slotUpdate = await supabase
                .from('court_slots')
                .update({
                  court_id: selectedCourt.id,
                  start_time: startTime.toISOString(),
                  end_time: endTime.toISOString(),
                  price: totalCost || 0,
                  status: 'booked',
                })
                .eq('id', currentSession.slot_id)

              updateError = slotUpdate.error ?? null
              updatedSessionId = editSessionId
            }
          }
        }

        if (updateError || !updatedSessionId) {
          Alert.alert('\u004c\u1ed7\u0069', updateError?.message ?? '\u004b\u0068\u00f4\u006e\u0067\u0020\u0074\u0068\u1ec3\u0020\u0063\u1ead\u0070\u0020\u006e\u0068\u1ead\u0074\u0020\u006b\u00e8\u006f\u002e')
          return
        }

        router.replace({
          pathname: '/session/[id]',
          params: { id: updatedSessionId, updated: '1' },
        } as never)
        return
      }

      let { data: newSessionId, error: createError } = await supabase.rpc('create_session_with_host', fullPayload)

      const missingFunction =
        Boolean(createError?.message?.includes('Could not find the function public.create_session_with_host')) ||
        createError?.code === '42883'

      // Backward compatibility: some environments still expose the older RPC signature
      // without booking detail fields. Fallback to the old payload so session creation still works.
      if (missingFunction) {
        const fallbackResult = await supabase.rpc('create_session_with_host', basePayload)
        newSessionId = fallbackResult.data
        createError = fallbackResult.error
      }

      if (createError || !newSessionId) {
        Alert.alert('\u004c\u1ed7\u0069', createError?.message ?? '\u004b\u0068\u00f4\u006e\u0067\u0020\u0074\u0068\u1ec3\u0020\u0074\u1ea1\u006f\u0020\u006b\u00e8\u006f\u002e')
        return
      }

      router.replace({
        pathname: '/session/[id]',
        params: { id: newSessionId, created: '1' },
      } as never)
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : isEditMode
          ? '\u004b\u0068\u00f4\u006e\u0067\u0020\u0074\u0068\u1ec3\u0020\u0063\u1ead\u0070\u0020\u006e\u0068\u1ead\u0074\u0020\u006b\u00e8\u006f\u0020\u006c\u00fac\u0020\u006e\u00e0\u0079\u002e'
          : '\u004b\u0068\u00f4\u006e\u0067\u0020\u0074\u0068\u1ec3\u0020\u0074\u1ea1\u006f\u0020\u006b\u00e8\u006f\u0020\u006c\u00fac\u0020\u006e\u00e0\u0079\u002e'
      Alert.alert('\u004c\u1ed7\u0069', message)
    } finally {
      setSubmitting(false)
    }
  }

  const { profile } = useHomeFeedData(userId, isAuthLoading)

  if (isEditMode && isHydratingEdit && !editHydrated) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: PROFILE_THEME_COLORS.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={PROFILE_THEME_COLORS.primary} />
      </SafeAreaView>
    )
  }

  const progressMap = { 1: 0.33, 2: 0.66, 3: 1 }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F2F0E8' }} edges={['top']}>
      <SecondaryNavbar
        showProgress
        progress={progressMap[step]}
        rightSlot={<NavbarUserAvatar url={profile?.photo_url} />}
        onBackPress={() => {
          if (step === 1) router.back()
          else if (step === 2) setStep(1)
          else if (step === 3) setStep(2)
        }}
      />
      <View style={{ flex: 1, backgroundColor: PROFILE_THEME_COLORS.background, paddingHorizontal: SPACING.xl }}>
        {step === 1 && (
          <CreateSessionStep1
            onBack={() => router.back()}
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
              if (!selectedDate || !date) return
              setStartTime(withTime(selectedDate, date))
            }}
            onEndTimeChange={(date) => {
              if (!selectedDate || !date) return
              setEndTime(withTime(selectedDate, date))
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
            lockCourtSchedule={lockCourtSchedule}
            hideHeader
          />
        )}

        {step === 2 && (
          <CreateSessionStep2
            onBack={() => setStep(1)}
            maxPlayers={maxPlayers}
            setMaxPlayers={setMaxPlayers}
            minSkill={minSkill}
            setMinSkill={setMinSkill}
            maxSkill={maxSkill}
            setMaxSkill={setMaxSkill}
            bookingStatus={bookingStatus}
            setBookingStatus={setBookingStatus}
            wantsBookingNow={wantsBookingNow}
            setWantsBookingNow={setWantsBookingNow}
            bookingReference={bookingReference}
            setBookingReference={setBookingReference}
            bookingName={bookingName}
            setBookingName={setBookingName}
            bookingPhone={bookingPhone}
            setBookingPhone={setBookingPhone}
            bookingNotes={bookingNotes}
            setBookingNotes={setBookingNotes}
            canOpenBookingLink={Boolean(selectedCourt?.booking_url ?? selectedCourt?.google_maps_url)}
            onOpenBookingLink={openCourtBookingLink}
            deadlineMinutes={deadlineMinutes}
            setDeadlineMinutes={setDeadlineMinutes}
            requireApproval={requireApproval}
            setRequireApproval={setRequireApproval}
            isRanked={isRanked}
            setIsRanked={setIsRanked}
            canToggleRanked={canToggleRanked}
            rankedHelperText={rankedHelperText}
            totalCostStr={totalCostStr}
            setTotalCostStr={setTotalCostStr}
            costPerPerson={costPerPerson}
            onContinue={goToStep3FromNew}
            hideHeader
          />
        )}

        {step === 3 && selectedCourt && selectedDate && startTime && endTime && (
          <CreateSessionStep3
            selectedCourt={selectedCourt}
            selectedDate={selectedDate}
            startTime={startTime}
            endTime={endTime}
            maxPlayers={maxPlayers}
            minSkill={minSkill}
            maxSkill={maxSkill}
            bookingStatus={bookingStatus}
            deadlineMinutes={deadlineMinutes}
            requireApproval={requireApproval}
            pricePerPerson={costPerPerson}
            onBack={() => setStep(2)}
            onCreate={submit}
            submitting={submitting}
            submitLabel={isEditMode ? 'L\u01b0u thay \u0111\u1ed5i' : 'T\u1ea1o k\u00e8o'}
            hideHeader
          />
        )}
      </View>
    </SafeAreaView>
  )
}
