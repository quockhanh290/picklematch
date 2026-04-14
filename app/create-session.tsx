import { CreateSessionStep1 } from '@/components/create-session/CreateSessionStep1'
import { CreateSessionStep2 } from '@/components/create-session/CreateSessionStep2'
import { CreateSessionStep3 } from '@/components/create-session/CreateSessionStep3'
import { CREATE_SESSION_ELO_LEVELS } from '@/lib/eloSystem'
import { supabase } from '@/lib/supabase'
import { type NearByCourt, useNearbyCourts } from '@/lib/useNearbyCourts'
import * as Linking from 'expo-linking'
import { useRouter } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

function fmtDuration(start: Date, end: Date): string {
  const mins = Math.round((end.getTime() - start.getTime()) / 60_000)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m} phút`
  if (m === 0) return `${h} giờ`
  return `${h} giờ ${m} phút`
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

function WizardHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <View style={s.headerWrap}>
      <Text style={s.headerEyebrow}>Tạo kèo</Text>
      <Text style={s.headerTitle}>{title}</Text>
      <Text style={s.headerSubtitle}>{subtitle}</Text>
    </View>
  )
}

function BackLink({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} style={s.backLink} activeOpacity={0.85}>
      <ArrowLeft size={16} color="#059669" />
      <Text style={s.backLinkText}>{label}</Text>
    </TouchableOpacity>
  )
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
  const [deadlineHours, setDeadlineHours] = useState(4)
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
  const totalCost = useMemo(() => parseTotalCost(totalCostStr), [totalCostStr])
  const costPerPerson = totalCost > 0 ? Math.ceil(totalCost / maxPlayers) : 0
  const duration = startTime && endTime && endTime > startTime ? fmtDuration(startTime, endTime) : null

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
    const diffMins = (end.getTime() - start.getTime()) / 60_000

    if (end <= start) return 'Giờ kết thúc phải sau giờ bắt đầu'
    if (diffMins > 180) return 'Tối đa 3 giờ mỗi kèo'
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
        setIsRanked(false)
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
        setIsRanked(false)
        setRankedHelperText('Hoàn tất onboarding để dùng kèo tính Elo.')
        return
      }

      setIsRanked(true)
      setRankedHelperText('Bạn có thể bật hoặc tắt Elo cho kèo này trước khi đăng.')
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
        'Chưa có link đặt sân',
        'Sân này chưa có link booking. Bạn vẫn có thể tự đặt rồi nhập thông tin bên dưới.',
      )
      return
    }

    try {
      await Linking.openURL(url)
    } catch {
      Alert.alert(
        'Không mở được link',
        'Vui lòng thử lại hoặc mở link booking của sân theo cách khác.',
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
      Alert.alert('Lỗi', 'Trình độ tối thiểu không thể cao hơn trình độ tối đa.')
      return
    }

    setEloMin(minElo)
    setEloMax(maxElo)
    setStep(3)
  }

  async function submit() {
    if (!selectedCourt || !startTime || !endTime) return

    setSubmitting(true)

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setSubmitting(false)
      Alert.alert('Cần đăng nhập', 'Bạn cần đăng nhập để tạo kèo.', [
        { text: 'Đăng nhập', onPress: () => router.push('/login') },
        { text: 'Hủy', style: 'cancel' },
      ])
      return
    }

    const fillDeadline = new Date(Date.now() + deadlineHours * 3_600_000)
    const { data: newSessionId, error: createError } = await supabase.rpc('create_session_with_host', {
      p_court_id: selectedCourt.id,
      p_start_time: startTime.toISOString(),
      p_end_time: endTime.toISOString(),
      p_price: totalCost,
      p_elo_min: eloMin,
      p_elo_max: eloMax,
      p_is_ranked: isRanked,
      p_max_players: maxPlayers,
      p_fill_deadline: fillDeadline.toISOString(),
      p_total_cost: totalCost || null,
      p_require_approval: requireApproval,
      p_court_booking_status: bookingStatus,
      p_booking_reference: bookingReference.trim() || null,
      p_booking_name: bookingName.trim() || null,
      p_booking_phone: bookingPhone.trim() || null,
      p_booking_notes: bookingNotes.trim() || null,
      p_booking_confirmed_at: bookingStatus === 'confirmed' ? new Date().toISOString() : null,
    })

    if (createError || !newSessionId) {
      setSubmitting(false)
      Alert.alert('Lỗi', createError?.message ?? 'Không thể tạo kèo.')
      return
    }

    setSubmitting(false)
    router.replace({
      pathname: '/session/[id]',
      params: { id: newSessionId, created: '1' },
    } as never)
  }

  if (step === 1) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <BackLink label="Quay lại" onPress={() => router.back()} />
        <WizardHeader
          title="Tạo kèo mới"
          subtitle="Bước 1/3 · Chọn sân và khung giờ phù hợp để bắt đầu tạo trận."
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
      <SafeAreaView style={s.container} edges={['top']}>
        <BackLink label="Đổi sân / giờ" onPress={() => setStep(1)} />
        <WizardHeader
          title="Cấu hình kèo"
          subtitle="Bước 2/3 · Chọn số người, dải trình độ, booking và các thiết lập trước khi lên feed."
        />
        <CreateSessionStep2
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
          deadlineHours={deadlineHours}
          setDeadlineHours={setDeadlineHours}
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
    <SafeAreaView style={s.container} edges={['top']}>
      <BackLink label="Chỉnh lại" onPress={() => setStep(2)} />
      <WizardHeader
        title="Xác nhận và đăng kèo"
        subtitle="Bước 3/3 · Xem đúng preview trên feed trước khi tạo kèo."
      />
      <CreateSessionStep3
        selectedCourt={selectedCourt}
        selectedDate={selectedDate}
        startTime={startTime}
        endTime={endTime}
        maxPlayers={maxPlayers}
        maxSkill={maxSkill}
        bookingStatus={bookingStatus}
        deadlineHours={deadlineHours}
        requireApproval={requireApproval}
        pricePerPerson={costPerPerson}
        onCreate={submit}
        submitting={submitting}
      />
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f4', paddingHorizontal: 20 },
  headerWrap: { marginBottom: 20 },
  headerEyebrow: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#6b7280',
    marginBottom: 8,
  },
  headerTitle: { fontSize: 30, fontWeight: '900', color: '#020617', marginBottom: 8 },
  headerSubtitle: { fontSize: 14, lineHeight: 21, color: '#64748b' },
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  backLinkText: { fontSize: 14, color: '#059669', fontWeight: '700' },
})
