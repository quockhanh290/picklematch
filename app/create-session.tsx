import { CreateSessionStep1 } from '@/components/create-session/CreateSessionStep1'
import { CreateSessionStep2 } from '@/components/create-session/CreateSessionStep2'
import { CreateSessionStep3 } from '@/components/create-session/CreateSessionStep3'
import { supabase } from '@/lib/supabase'
import { type NearByCourt, useNearbyCourts } from '@/lib/useNearbyCourts'
import * as Linking from 'expo-linking'
import { useRouter } from 'expo-router'
import { ArrowLeft } from 'lucide-react-native'
import { useCallback, useEffect, useState } from 'react'
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const ELO_LEVELS = [
  { elo: 800 },
  { elo: 1000 },
  { elo: 1150 },
  { elo: 1300 },
  { elo: 1500 },
]

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

function withTime(base: Date, time: Date): Date {
  const next = new Date(base)
  next.setHours(time.getHours(), time.getMinutes(), 0, 0)
  return next
}

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
  const [eloMin, setEloMin] = useState(ELO_LEVELS[0].elo)
  const [eloMax, setEloMax] = useState(ELO_LEVELS[4].elo)
  const [deadlineHours, setDeadlineHours] = useState(4)
  const [requireApproval, setRequireApproval] = useState(false)
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

  function defaultPickerValue(type: 'start' | 'end'): Date {
    const base = selectedDate ?? new Date()
    const next = new Date(base)
    if (type === 'start') {
      next.setHours(18, 0, 0, 0)
      return next
    }
    next.setHours(20, 0, 0, 0)
    return next
  }

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
        '\u0043\u0068\u01b0\u0061\u0020\u0063\u00f3\u0020\u006c\u0069\u006e\u006b\u0020\u0111\u1eb7\u0074\u0020\u0073\u00e2\u006e',
        '\u0053\u00e2\u006e\u0020\u006e\u00e0\u0079\u0020\u0063\u0068\u01b0\u0061\u0020\u0063\u00f3\u0020\u006c\u0069\u006e\u006b\u0020\u0062\u006f\u006f\u006b\u0069\u006e\u0067\u002e\u0020\u0042\u1ea1\u006e\u0020\u0076\u1eab\u006e\u0020\u0063\u00f3\u0020\u0074\u0068\u1ec3\u0020\u0074\u1ef1\u0020\u0111\u1eb7\u0074\u0020\u0072\u1ed3\u0069\u0020\u006e\u0068\u1ead\u0070\u0020\u0074\u0068\u00f4\u006e\u0067\u0020\u0074\u0069\u006e\u0020\u0062\u00ea\u006e\u0020\u0064\u01b0\u1edb\u0069\u002e',
      )
      return
    }

    try {
      await Linking.openURL(url)
    } catch {
      Alert.alert(
        '\u004b\u0068\u00f4\u006e\u0067\u0020\u006d\u1edf\u0020\u0111\u01b0\u1ee3\u0063\u0020\u006c\u0069\u006e\u006b',
        '\u0056\u0075\u0069\u0020\u006c\u00f2\u006e\u0067\u0020\u0074\u0068\u1eed\u0020\u006c\u1ea1\u0069\u0020\u0068\u006f\u1eb7\u0063\u0020\u006d\u1edf\u0020\u006c\u0069\u006e\u006b\u0020\u0062\u006f\u006f\u006b\u0069\u006e\u0067\u0020\u0063\u1ee7\u0061\u0020\u0073\u00e2\u006e\u0020\u0074\u0068\u0065\u006f\u0020\u0063\u00e1\u0063\u0068\u0020\u006b\u0068\u00e1\u0063\u002e',
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
    const minElo = ELO_LEVELS[minSkill - 1].elo
    const maxElo = ELO_LEVELS[maxSkill - 1].elo

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

    const totalCost = parseInt(totalCostStr.replace(/\D/g, ''), 10) || 0

    const { data: newSlot, error: slotErr } = await supabase
      .from('court_slots')
      .insert({
        court_id: selectedCourt.id,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        price: totalCost,
        status: 'booked',
      })
      .select()
      .single()

    if (slotErr || !newSlot) {
      setSubmitting(false)
      Alert.alert('Lỗi', slotErr?.message ?? 'Không thể tạo giờ chơi.')
      return
    }

    const fillDeadline = new Date(Date.now() + deadlineHours * 3_600_000)
    const { data: newSession, error: sessionErr } = await supabase
      .from('sessions')
      .insert({
        host_id: user.id,
        slot_id: newSlot.id,
        elo_min: eloMin,
        elo_max: eloMax,
        max_players: maxPlayers,
        status: 'open',
        fill_deadline: fillDeadline.toISOString(),
        total_cost: totalCost || null,
        require_approval: requireApproval,
        court_booking_status: bookingStatus,
        booking_reference: bookingReference.trim() || null,
        booking_name: bookingName.trim() || null,
        booking_phone: bookingPhone.trim() || null,
        booking_notes: bookingNotes.trim() || null,
        booking_confirmed_at: bookingStatus === 'confirmed' ? new Date().toISOString() : null,
      })
      .select()
      .single()

    if (sessionErr || !newSession) {
      setSubmitting(false)
      Alert.alert('Lỗi', sessionErr?.message ?? 'Không thể tạo kèo.')
      return
    }

    await supabase.from('session_players').insert({
      session_id: newSession.id,
      player_id: user.id,
      status: 'confirmed',
    })

    setSubmitting(false)
    router.replace({
      pathname: '/session/[id]',
      params: { id: newSession.id, created: '1' },
    } as never)
  }

  const totalCost = parseInt(totalCostStr.replace(/\D/g, ''), 10) || 0
  const costPerPerson = totalCost > 0 ? Math.ceil(totalCost / maxPlayers) : 0
  const duration = startTime && endTime && endTime > startTime ? fmtDuration(startTime, endTime) : null

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
          totalCostStr={totalCostStr}
          setTotalCostStr={setTotalCostStr}
          costPerPerson={costPerPerson}
          onContinue={goToStep3FromNew}
        />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <BackLink label="Chỉnh lại" onPress={() => setStep(2)} />
      <WizardHeader
        title="Xác nhận và đăng kèo"
        subtitle="Bước 3/3 · Xem đúng preview trên feed trước khi tạo kèo."
      />
      <CreateSessionStep3
        selectedCourt={selectedCourt!}
        selectedDate={selectedDate!}
        startTime={startTime!}
        endTime={endTime!}
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
