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
import { ActivityIndicator, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { SPACING } from '@/constants/screenLayout'
import { AppDialog, type AppDialogConfig, NavbarUserAvatar, SecondaryNavbar } from '@/components/design'
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
  const { userId, isLoading } = useAuth()
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
  const [rankedHelperText, setRankedHelperText] = useState<string | null>('Đang kiểm tra quyền dùng kèo tính Elo...')
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
  const [dialogConfig, setDialogConfig] = useState<AppDialogConfig | null>(null)
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
        setDialogConfig({
          title: 'Cần đăng nhập',
          message: 'Bạn cần đăng nhập để chỉnh sửa kèo.',
          actions: [{ label: 'OK', onPress: () => router.back() }],
        })
        return
      }

      if (detailResult.error || !session) {
        setDialogConfig({
          title: 'Lỗi',
          message: detailResult.error?.message ?? 'Không tải được dữ liệu kèo.',
          actions: [{ label: 'Quay lại', onPress: () => router.back() }],
        })
        return
      }

      if (session.host.id !== user.id) {
        setDialogConfig({
          title: 'Không có quyền',
          message: 'Bạn không phải chủ kèo nên không thể chỉnh sửa.',
          actions: [{ label: 'Đã hiểu', onPress: () => router.back() }],
        })
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

    if (isToday && time <= now) return 'Giờ bắt đầu phải sau thời gian hiện tại'
    if (timeMins < openMins) return `Sân mở cửa lúc ${selectedCourt?.hours_open ?? '06:00'}`
    if (timeMins >= closeMins) return `Sân đóng cửa lúc ${selectedCourt?.hours_close ?? '22:00'}`
    return null
  }, [selectedCourt?.hours_close, selectedCourt?.hours_open, selectedDate])

  const validateEnd = useCallback((end: Date, start: Date): string | null => {
    const closeMins = toMins(selectedCourt?.hours_close ?? '22:00')
    const endMins = end.getHours() * 60 + end.getMinutes()

    if (end <= start) return 'Giờ kết thúc phải sau giờ bắt đầu'
    if (endMins > closeMins) return `Sân đóng cửa lúc ${selectedCourt?.hours_close ?? '22:00'}`
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
        setRankedHelperText('Đăng nhập để chọn kèo có tính Elo.')
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
      setDialogConfig({
        title: 'Chưa có link đặt sân',
        message: 'Sân này chưa có link booking. Bạn vẫn có thể tự đặt rồi nhập thông tin bên dưới.',
        actions: [{ label: 'Đã hiểu' }],
      })
      return
    }

    try {
      await Linking.openURL(url)
    } catch {
      setDialogConfig({
        title: 'Không mở được link',
        message: 'Vui lòng thử lại hoặc mở link booking của sân theo cách khác.',
        actions: [{ label: 'Đã hiểu' }],
      })
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
      setDialogConfig({
        title: 'Lỗi',
        message: 'Trình độ tối thiểu không thể cao hơn trình độ tối đa.',
        actions: [{ label: 'Đã hiểu' }],
      })
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
        setDialogConfig({
          title: 'Cần đăng nhập',
          message: `Bạn cần đăng nhập để ${isEditMode ? 'cập nhật' : 'tạo'} kèo.`,
          actions: [
            { label: 'Đăng nhập', onPress: () => router.push('/login') },
            { label: 'Hủy', tone: 'secondary' },
          ],
        })
        return
      }

      setSubmitting(true)

      const sendBookingDetails = bookingStatus === 'confirmed' || wantsBookingNow === true
      const fillDeadline = new Date(startTime.getTime() - deadlineMinutes * 60_000)
      if (fillDeadline.getTime() <= Date.now()) {
        setDialogConfig({
          title: 'Hạn chót chưa hợp lệ',
          message: 'Hạn chót vào kèo phải nằm trong tương lai. Hãy chọn giờ chơi muộn hơn hoặc giảm mốc hạn chót.',
          actions: [{ label: 'Đã hiểu' }],
        })
        return
      }

      if (isEditMode && lockCourtSchedule && lockedSlotSnapshot) {
        const changedCourt = selectedCourt.id !== lockedSlotSnapshot.courtId
        const changedStart = startTime.toISOString() !== lockedSlotSnapshot.startIso
        const changedEnd = endTime.toISOString() !== lockedSlotSnapshot.endIso
        if (changedCourt || changedStart || changedEnd) {
          setDialogConfig({
            title: 'Không thể thay đổi',
            message: 'Kèo đã đặt sân nên không thể đổi sân và ngày giờ chơi.',
            actions: [{ label: 'Đã hiểu' }],
          })
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
          setDialogConfig({
            title: 'Lỗi',
            message: updateError?.message ?? 'Không thể cập nhật kèo.',
            actions: [{ label: 'Đã hiểu' }],
          })
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
        setDialogConfig({
          title: 'Lỗi',
          message: createError?.message ?? 'Không thể tạo kèo.',
          actions: [{ label: 'Đã hiểu' }],
        })
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
          ? 'Không thể cập nhật kèo lúc này.'
          : 'Không thể tạo kèo lúc này.'
      setDialogConfig({
        title: 'Lỗi',
        message: message,
        actions: [{ label: 'Đã hiểu' }],
      })
    } finally {
      setSubmitting(false)
    }
  }

  const { profile } = useHomeFeedData(userId, isLoading)

  if (isLoading || (isEditMode && isHydratingEdit && !editHydrated)) {
    return <AppLoading fullScreen />
  }

  const progressMap = { 1: 0.33, 2: 0.66, 3: 1 }

  return (
    <View style={{ flex: 1, backgroundColor: '#F2F0E8' }}>
      <SecondaryNavbar
        title="TẠO KÈO MỚI"
        showProgress
        progress={progressMap[step]}
        onBackPress={() => {
          if (step === 1) router.back()
          else if (step === 2) setStep(1)
          else if (step === 3) setStep(2)
        }}
      />
      <View style={{ flex: 1, backgroundColor: PROFILE_THEME_COLORS.background, paddingHorizontal: SPACING.xl, paddingTop: 16 }}>
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
            submitLabel={isEditMode ? 'Lưu thay đổi' : 'Tạo kèo'}
            hideHeader
          />
        )}
        <AppDialog
          visible={Boolean(dialogConfig)}
          config={dialogConfig}
          onClose={() => setDialogConfig(null)}
        />
      </View>
    </View>
  )
}
