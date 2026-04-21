import { CreateSessionStep1 } from '@/components/create-session/CreateSessionStep1'
import { CreateSessionStep2 } from '@/components/create-session/CreateSessionStep2'
import { CreateSessionStep3 } from '@/components/create-session/CreateSessionStep3'
import { PROFILE_THEME_COLORS } from '@/components/profile/profileTheme'
import { CREATE_SESSION_ELO_LEVELS } from '@/lib/eloSystem'
import { supabase } from '@/lib/supabase'
import { type NearByCourt, useNearbyCourts } from '@/lib/useNearbyCourts'
import * as Linking from 'expo-linking'
import { useRouter } from 'expo-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

function fmtDuration(start: Date, end: Date): string {
  const mins = Math.round((end.getTime() - start.getTime()) / 60_000)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m} phÃºt`
  if (m === 0) return `${h} giá»`
  return `${h} giá» ${m} phÃºt`
}

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

export default function CreateSession() {
  const router = useRouter()
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
  const [rankedHelperText, setRankedHelperText] = useState<string | null>('Äang kiá»ƒm tra quyá»n dÃ¹ng kÃ¨o tÃ­nh Elo...')
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
  const totalCost = useMemo(() => parseTotalCost(totalCostStr), [totalCostStr])
  const costPerPerson = totalCost > 0 ? Math.ceil(totalCost / maxPlayers) : 0
  const duration = startTime && endTime && endTime > startTime ? fmtDuration(startTime, endTime) : null

  const validateStart = useCallback((time: Date): string | null => {
    const now = new Date()
    const isToday = selectedDate?.toDateString() === now.toDateString()
    const openMins = toMins(selectedCourt?.hours_open ?? '06:00')
    const closeMins = toMins(selectedCourt?.hours_close ?? '22:00')
    const timeMins = time.getHours() * 60 + time.getMinutes()

    if (isToday && time <= now) return 'Giá» báº¯t Ä‘áº§u pháº£i sau thá»i gian hiá»‡n táº¡i'
    if (timeMins < openMins) return `SÃ¢n má»Ÿ cá»­a lÃºc ${selectedCourt?.hours_open ?? '06:00'}`
    if (timeMins >= closeMins) return `SÃ¢n Ä‘Ã³ng cá»­a lÃºc ${selectedCourt?.hours_close ?? '22:00'}`
    return null
  }, [selectedCourt?.hours_close, selectedCourt?.hours_open, selectedDate])

  const validateEnd = useCallback((end: Date, start: Date): string | null => {
    const closeMins = toMins(selectedCourt?.hours_close ?? '22:00')
    const endMins = end.getHours() * 60 + end.getMinutes()
    const diffMins = (end.getTime() - start.getTime()) / 60_000

    if (end <= start) return 'Giá» káº¿t thÃºc pháº£i sau giá» báº¯t Ä‘áº§u'
    if (diffMins > 180) return 'Tá»‘i Ä‘a 3 giá» má»—i kÃ¨o'
    if (endMins > closeMins) return `SÃ¢n Ä‘Ã³ng cá»­a lÃºc ${selectedCourt?.hours_close ?? '22:00'}`
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
        setIsRanked(false)
        setCanToggleRanked(false)
        setRankedHelperText('ÄÄƒng nháº­p Ä‘á»ƒ chá»n kÃ¨o cÃ³ tÃ­nh Elo.')
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
        setIsRanked(false)
        setRankedHelperText('HoÃ n táº¥t onboarding Ä‘á»ƒ dÃ¹ng kÃ¨o tÃ­nh Elo.')
        return
      }

      setIsRanked(true)
      setRankedHelperText('Báº¡n cÃ³ thá»ƒ báº­t hoáº·c táº¯t Elo cho kÃ¨o nÃ y trÆ°á»›c khi Ä‘Äƒng.')
    }

    void loadRankedEligibility()

    return () => {
      mounted = false
    }
  }, [])

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
        'ChÆ°a cÃ³ link Ä‘áº·t sÃ¢n',
        'SÃ¢n nÃ y chÆ°a cÃ³ link booking. Báº¡n váº«n cÃ³ thá»ƒ tá»± Ä‘áº·t rá»“i nháº­p thÃ´ng tin bÃªn dÆ°á»›i.',
      )
      return
    }

    try {
      await Linking.openURL(url)
    } catch {
      Alert.alert(
        'KhÃ´ng má»Ÿ Ä‘Æ°á»£c link',
        'Vui lÃ²ng thá»­ láº¡i hoáº·c má»Ÿ link booking cá»§a sÃ¢n theo cÃ¡ch khÃ¡c.',
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
    const minElo = CREATE_SESSION_ELO_LEVELS[minSkill - 1].elo
    const maxElo = CREATE_SESSION_ELO_LEVELS[maxSkill - 1].elo

    if (minElo > maxElo) {
      Alert.alert('Lá»—i', 'TrÃ¬nh Ä‘á»™ tá»‘i thiá»ƒu khÃ´ng thá»ƒ cao hÆ¡n trÃ¬nh Ä‘á»™ tá»‘i Ä‘a.')
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
        Alert.alert('\u0043\u1ea7\u006e\u0020\u0111\u0103\u006e\u0067\u0020\u006e\u0068\u1ead\u0070', '\u0042\u1ea1\u006e\u0020\u0063\u1ea7\u006e\u0020\u0111\u0103\u006e\u0067\u0020\u006e\u0068\u1ead\u0070\u0020\u0111\u1ec3\u0020\u0074\u1ea1\u006f\u0020\u006b\u00e8\u006f\u002e', [
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
      const message = error instanceof Error ? error.message : '\u004b\u0068\u00f4\u006e\u0067\u0020\u0074\u0068\u1ec3\u0020\u0074\u1ea1\u006f\u0020\u006b\u00e8\u006f\u0020\u006c\u00fac\u0020\u006e\u00e0\u0079\u002e'
      Alert.alert('\u004c\u1ed7\u0069', message)
    } finally {
      setSubmitting(false)
    }
  }

  if (step === 1) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: PROFILE_THEME_COLORS.background, paddingHorizontal: 20 }} edges={['top']}>
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
        />
      </SafeAreaView>
    )
  }

  if (step === 2) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: PROFILE_THEME_COLORS.background, paddingHorizontal: 20 }} edges={['top']}>
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
        />
      </SafeAreaView>
    )
  }

  if (!selectedCourt || !selectedDate || !startTime || !endTime) {
    return null
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: PROFILE_THEME_COLORS.background, paddingHorizontal: 20 }} edges={['top']}>
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
      />
    </SafeAreaView>
  )
}
