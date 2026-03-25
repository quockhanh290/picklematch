import { CreateSessionStep1 } from '@/components/create-session/CreateSessionStep1'
import { SKILL_ASSESSMENT_LEVELS } from '@/lib/skillAssessment'
import { supabase } from '@/lib/supabase'
import { type NearByCourt, useNearbyCourts } from '@/lib/useNearbyCourts'
import DateTimePicker from '@react-native-community/datetimepicker'
import * as Linking from 'expo-linking'
import { router } from 'expo-router'
import { AlertTriangle, ArrowLeft, CalendarDays, CheckCircle2, Clock3, MapPin, ShieldCheck, Users, Wallet } from 'lucide-react-native'
import type { ReactNode } from 'react'
import { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator, Alert, FlatList, Keyboard, ScrollView,
  StyleSheet, Switch, Text, TextInput, TouchableOpacity, View,
} from 'react-native'
import { Calendar } from 'react-native-calendars'
import { SafeAreaView } from 'react-native-safe-area-context'

// ── Constants ─────────────────────────────────────────────────────────────────

const ELO_LEVELS = [
  { label: SKILL_ASSESSMENT_LEVELS[0].title, elo: 800 },
  { label: SKILL_ASSESSMENT_LEVELS[1].title, elo: 1000 },
  { label: SKILL_ASSESSMENT_LEVELS[2].title, elo: 1150 },
  { label: SKILL_ASSESSMENT_LEVELS[3].title, elo: 1300 },
  { label: SKILL_ASSESSMENT_LEVELS[4].title, elo: 1500 },
]

const PLAYER_OPTIONS = [2, 4, 6]

const DEADLINE_OPTIONS = [
  { label: '2 giờ',  hours: 2  },
  { label: '4 giờ',  hours: 4  },
  { label: '8 giờ',  hours: 8  },
  { label: '24 giờ', hours: 24 },
]

// ── Helpers ───────────────────────────────────────────────────────────────────

const WEEKDAYS_LONG = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']

function fmtDateFull(d: Date): string {
  return `${WEEKDAYS_LONG[d.getDay()]}, ${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
}

/** "YYYY-MM-DD" string for react-native-calendars */
function toCalKey(d: Date): string {
  const y  = d.getFullYear()
  const m  = (d.getMonth() + 1).toString().padStart(2, '0')
  const dd = d.getDate().toString().padStart(2, '0')
  return `${y}-${m}-${dd}`
}

function fmtTime(d: Date): string {
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

/** "HH:MM" string → total minutes since midnight */
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

/** Duration string, e.g. "1 giờ 30 phút" */
function fmtDuration(start: Date, end: Date): string {
  const mins = Math.round((end.getTime() - start.getTime()) / 60_000)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h === 0) return `${m} phút`
  if (m === 0) return `${h} giờ`
  return `${h} giờ ${m} phút`
}

// ── Component ─────────────────────────────────────────────────────────────────

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

  // Step 1 — court + time
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

  // ── Time helpers ─────────────────────────────────────────────────────────────

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

    if (isToday && time <= now)  return 'Giờ bắt đầu phải sau giờ hiện tại'
    if (tMins < openMins)        return `Sân mở cửa lúc ${selectedCourt?.hours_open ?? '06:00'}`
    if (tMins >= closeMins)      return `Sân đóng cửa lúc ${selectedCourt?.hours_close ?? '22:00'}`
    return null
  }, [selectedCourt?.hours_close, selectedCourt?.hours_open, selectedDate])

  /** Validate end time against start + court close + 3h max */
  const validateEnd = useCallback((end: Date, start: Date): string | null => {
    const closeMins = toMins(selectedCourt?.hours_close ?? '22:00')
    const endMins   = end.getHours() * 60 + end.getMinutes()
    const diffMins  = (end.getTime() - start.getTime()) / 60_000

    if (end <= start) return 'Giờ kết thúc phải sau giờ bắt đầu'
    if (diffMins > 180)        return 'Tối đa 3 tiếng mỗi kèo'
    if (endMins > closeMins)   return `Sân đóng cửa lúc ${selectedCourt?.hours_close ?? '22:00'}`
    return null
  }, [selectedCourt?.hours_close])

  // ── Event handlers ────────────────────────────────────────────────────────────

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
    if (resolvedCourtBookingStatus() === 'confirmed') return 'Đã xác nhận đặt sân'
    if (courtConfirmationChoice === 'needs_booking' && bookNowChoice === false) return 'Sân chưa xác nhận'
    return 'Đang chờ xác nhận sân'
  }

  async function openBookingLink() {
    const url = bookingLink()
    if (!url) {
      Alert.alert('Chưa có link đặt sân', 'Sân này chưa có link booking. Bạn vẫn có thể tự đặt sân và nhập thông tin booking sau.')
      return
    }

    try {
      await Linking.openURL(url)
    } catch {
      Alert.alert('Không mở được link', 'Vui lòng thử lại hoặc mở link booking của sân theo cách khác.')
    }
  }

  function goToStep3() {
    const minIdx = ELO_LEVELS.findIndex(l => l.elo === eloMin)
    const maxIdx = ELO_LEVELS.findIndex(l => l.elo === eloMax)
    if (minIdx > maxIdx) {
      Alert.alert('Lỗi', 'Trình độ tối thiểu không thể cao hơn tối đa')
      return
    }
    if (!courtConfirmationChoice) {
      Alert.alert('Thiếu thông tin', 'Bạn cần xác nhận tình trạng đặt sân trước khi đăng kèo.')
      return
    }
    if (courtConfirmationChoice === 'needs_booking' && bookNowChoice === null) {
      Alert.alert('Thiếu thông tin', 'Hãy chọn bạn có muốn đặt sân ngay lúc này hay không.')
      return
    }
    if (resolvedCourtBookingStatus() === 'confirmed' && !hasBookingInfo()) {
      Alert.alert('Thiếu thông tin booking', 'Hãy cung cấp thông tin booking để xác nhận đã đặt sân.')
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
      Alert.alert('Cần đăng nhập', 'Bạn cần đăng nhập để tạo kèo', [
        { text: 'Đăng nhập', onPress: () => router.push('/login') },
        { text: 'Huỷ', style: 'cancel' },
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
      Alert.alert('Lỗi', slotErr?.message ?? 'Không thể tạo giờ chơi')
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
      Alert.alert('Lỗi', sessionErr?.message ?? 'Không thể tạo kèo')
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

  // ── Derived values ────────────────────────────────────────────────────────────

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
    return `Hết hạn lúc ${hh}:${mm}, ${d.getDate()}/${d.getMonth() + 1}`
  }

  // ── Time picker sub-render ────────────────────────────────────────────────────

  if (step === 1) return (
    <SafeAreaView style={s.container} edges={['top']}>
      <BackLink label="Quay lại" onPress={() => router.back()} />
      <WizardHeader title="Tạo kèo mới" subtitle="Bước 1/3 · Chọn sân và khung giờ phù hợp để bắt đầu tạo trận." />
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

  function renderTimeBtn(type: 'start' | 'end') {
    const isStart  = type === 'start'
    const current  = isStart ? startTime : endTime
    const disabled = !isStart && !startTime
    const label    = isStart ? 'Bắt đầu' : 'Kết thúc'
    const onPress  = isStart
      ? () => { setShowEndPicker(false); setShowStartPicker(v => !v) }
      : () => { setShowStartPicker(false); setShowEndPicker(v => !v) }

    return (
      <View style={s.timeBlock}>
        <Text style={s.timeBlockLabel}>{label}</Text>
        <TouchableOpacity
          style={[s.timeBtn, disabled && s.timeBtnDisabled]}
          onPress={onPress}
          disabled={disabled}
        >
          <Text style={[s.timeBtnTxt, !current && s.timeBtnPlaceholder]}>
            {current ? fmtTime(current) : '--:--'}
          </Text>
        </TouchableOpacity>
      </View>
    )
  }

  // ────────────────────────────────────────────────────────────────────────────
  // STEP 1 — Chọn sân & giờ
  // ────────────────────────────────────────────────────────────────────────────

  if (step === 1) return (
    <SafeAreaView style={s.container} edges={['top']}>
      <BackLink label="Quay lại" onPress={() => router.back()} />
      <WizardHeader title="Tạo kèo mới" subtitle="Bước 1/3 · Chọn sân và khung giờ phù hợp để bắt đầu tạo trận." />

      {/* ── Court list or time picker ── */}
      {!selectedCourt ? (
        fallbackMode ? (
          <>
            <TextInput
              style={s.searchInput}
              placeholder="Tìm tên sân..."
              placeholderTextColor="#aaa"
              value={keyword}
              onChangeText={setKeyword}
              autoFocus
              returnKeyType="search"
            />
            {searching ? (
              <View style={s.center}><ActivityIndicator color="#16a34a" /></View>
            ) : keyword.length > 0 && courts.length === 0 ? (
              <View style={s.center}><Text style={s.noResult}>Không tìm thấy sân nào</Text></View>
            ) : keyword.length === 0 ? (
              <View style={s.center}><Text style={s.noResult}>Nhập tên sân để tìm kiếm</Text></View>
            ) : (
              <FlatList
                data={courts}
                keyExtractor={c => c.id}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 32 }}
                renderItem={({ item }) => <CourtItem item={item} onPress={onCourtSelect} />}
              />
            )}
          </>
        ) : loadingCourts ? (
          <View style={s.center}>
            <ActivityIndicator color="#16a34a" size="large" />
            <Text style={s.loadingText}>Đang tìm sân gần bạn...</Text>
          </View>
        ) : courts.length === 0 ? (
          <View style={s.center}><Text style={s.noResult}>Không tìm thấy sân nào</Text></View>
        ) : (
          <FlatList
            data={courts}
            keyExtractor={c => c.id}
            contentContainerStyle={{ paddingBottom: 32 }}
            renderItem={({ item }) => <CourtItem item={item} onPress={onCourtSelect} />}
          />
        )
      ) : (

        /* ── Court selected: date + free-form time picker ── */
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32, flexGrow: 1 }} keyboardShouldPersistTaps="handled">

          {/* Selected court card */}
          <View style={s.selectedCard}>
            <View style={s.selectedCardRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.selectedCardLabel}>Sân đã chọn</Text>
                <Text style={s.selectedCardName}>{selectedCourt.name}</Text>
                <View style={s.inlineMetaRow}>
                  <MapPin size={14} color="#6b7280" />
                  <Text style={s.selectedCardSub}>{selectedCourt.address} · {selectedCourt.city}</Text>
                </View>
                {(selectedCourt.hours_open || selectedCourt.hours_close) && (
                  <View style={s.inlineMetaRow}>
                    <Clock3 size={14} color="#6b7280" />
                    <Text style={s.selectedCardSub}>
                      {selectedCourt.hours_open ?? '06:00'} – {selectedCourt.hours_close ?? '22:00'}
                    </Text>
                  </View>
                )}
              </View>
              <TouchableOpacity
                onPress={() => { setSelectedCourt(null); setStartTime(null); setEndTime(null); setTimeError(null) }}
              >
                <Text style={s.changeTxt}>Đổi sân</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Calendar */}
          <Calendar
            minDate={toCalKey(new Date())}
            maxDate={toCalKey(new Date(Date.now() + 30 * 86_400_000))}
            markedDates={selectedDate ? { [toCalKey(selectedDate)]: { selected: true, selectedColor: '#00A651' } } : {}}
            onDayPress={(day) => {
              const d = new Date(day.dateString + 'T00:00:00')
              onDatePress(d)
            }}
            hideExtraDays
            enableSwipeMonths
            theme={{
              selectedDayBackgroundColor: '#00A651',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#00A651',
              arrowColor: '#00A651',
              textDayFontSize: 14,
              textMonthFontSize: 14,
            }}
          />

          {/* Time section — only after a date is chosen */}
          {selectedDate && (
            <>
              <Text style={[s.label, { marginTop: 16 }]}>Giờ chơi</Text>
              <View style={s.timeRow}>
                {renderTimeBtn('start')}
                <Text style={s.timeArrow}>→</Text>
                {renderTimeBtn('end')}
              </View>

              {/* Inline start picker */}
              {showStartPicker && (
                <View style={s.inlinePicker}>
                  <View style={s.inlinePickerHeader}>
                    <TouchableOpacity onPress={() => setShowStartPicker(false)}>
                      <Text style={s.inlinePickerCancel}>Huỷ</Text>
                    </TouchableOpacity>
                    <Text style={s.inlinePickerTitle}>Giờ bắt đầu</Text>
                    <TouchableOpacity onPress={() => setShowStartPicker(false)}>
                      <Text style={s.inlinePickerDone}>Xong</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    mode="time"
                    display="spinner"
                    themeVariant="light"
                    value={startTime ?? defaultPickerValue('start')}
                    is24Hour
                    locale="vi"
                    style={{ width: '100%', height: 216, backgroundColor: '#ffffff' }}
                    onChange={(_ev, date) => {
                      if (date) setStartTime(withTime(selectedDate, date))
                    }}
                  />
                </View>
              )}

              {/* Inline end picker */}
              {showEndPicker && (
                <View style={s.inlinePicker}>
                  <View style={s.inlinePickerHeader}>
                    <TouchableOpacity onPress={() => setShowEndPicker(false)}>
                      <Text style={s.inlinePickerCancel}>Huỷ</Text>
                    </TouchableOpacity>
                    <Text style={s.inlinePickerTitle}>Giờ kết thúc</Text>
                    <TouchableOpacity onPress={() => setShowEndPicker(false)}>
                      <Text style={s.inlinePickerDone}>Xong</Text>
                    </TouchableOpacity>
                  </View>
                  <DateTimePicker
                    mode="time"
                    display="spinner"
                    themeVariant="light"
                    value={endTime ?? defaultPickerValue('end')}
                    is24Hour
                    locale="vi"
                    style={{ width: '100%', height: 216, backgroundColor: '#ffffff' }}
                    onChange={(_ev, date) => {
                      if (date) setEndTime(withTime(selectedDate, date))
                    }}
                  />
                </View>
              )}
            </>
          )}

          {/* Duration + error */}
          {duration && !timeError && (
            <View style={s.inlineMetaRow}>
              <Clock3 size={14} color="#16a34a" />
              <Text style={s.durationTxt}>{duration}</Text>
            </View>
          )}
          {timeError && (
            <View style={s.inlineMetaRow}>
              <AlertTriangle size={14} color="#dc2626" />
              <Text style={s.timeError}>{timeError}</Text>
            </View>
          )}

          {/* Booking note */}
          <View style={s.courtNote}>
            <Text style={s.courtNoteTxt}>ℹ️ Vui lòng đặt sân trước khi tạo kèo</Text>
          </View>

          {selectedDate && startTime && endTime && !timeError && (
            <TouchableOpacity style={s.nextBtn} onPress={goToStep2}>
              <Text style={s.nextBtnTxt}>Tiếp theo →</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  )

  // ────────────────────────────────────────────────────────────────────────────
  // STEP 2 — Cấu hình kèo
  // ────────────────────────────────────────────────────────────────────────────

  if (step === 2) return (
    <SafeAreaView style={s.container} edges={['top']}>
    <ScrollView contentContainerStyle={{ paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
      <BackLink label="Đổi sân / giờ" onPress={() => setStep(1)} />
      <WizardHeader title="Cấu hình kèo" subtitle="Bước 2/3 · Thiết lập số người, trình độ, deadline và trạng thái sân." />

      <View style={s.selectedCard}>
        <Text style={s.selectedCardName}>{selectedCourt!.name}</Text>
        <View style={s.inlineMetaRow}>
          <CalendarDays size={14} color="#6b7280" />
          <Text style={s.selectedCardSub}>{fmtDateFull(selectedDate!)} · {fmtTime(startTime!)} → {fmtTime(endTime!)}</Text>
        </View>
        <View style={[s.inlineMetaRow, { marginTop: 6 }]}>
          <Clock3 size={14} color="#6b7280" />
          <Text style={s.selectedCardSub}>{duration}</Text>
        </View>
      </View>

      {/* Số người */}
      <Text style={s.label}>Số người chơi</Text>
      <View style={s.playerRow}>
        {PLAYER_OPTIONS.map(n => (
          <TouchableOpacity
            key={n}
            style={[s.playerBtn, maxPlayers === n && s.optActive]}
            onPress={() => setMaxPlayers(n)}
          >
            <Text style={[s.playerTxt, maxPlayers === n && s.optTxtActive]}>{n} người</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ELO min */}
      <Text style={s.label}>Trình độ tối thiểu</Text>
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
      <Text style={s.label}>Trình độ tối đa</Text>
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
      <Text style={s.label}>Deadline ghép người</Text>
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

      {/* Duyệt người tham gia */}
      <View style={s.approvalRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.approvalTitle}>Duyệt người tham gia</Text>
          <Text style={s.approvalSub}>Host xem xét trước khi chấp nhận</Text>
        </View>
        <Switch
          value={requireApproval}
          onValueChange={setRequireApproval}
          trackColor={{ false: '#ddd', true: '#00A651' }}
          thumbColor="#fff"
        />
      </View>

      {/* Tiền sân */}
      <Text style={s.label}>Tiền sân (tổng)</Text>
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
          {maxPlayers} người ={' '}
          <Text style={s.costPerPerson}>{costPerPerson.toLocaleString('vi-VN')}đ/người</Text>
        </Text>
      )}

      <Text style={s.label}>Tình trạng đặt sân</Text>
      <View style={s.bookingCard}>
        <TouchableOpacity
          style={[s.bookingOption, courtConfirmationChoice === 'confirmed' && s.bookingOptionActive]}
          onPress={() => {
            setCourtConfirmationChoice('confirmed')
            setBookNowChoice(null)
          }}
        >
          <Text style={[s.bookingOptionTitle, courtConfirmationChoice === 'confirmed' && s.bookingOptionTitleActive]}>
            Đã đặt và xác nhận sân
          </Text>
          <Text style={s.bookingOptionSub}>Bạn đã chốt sân và có thể cung cấp thông tin booking ngay.</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.bookingOption, courtConfirmationChoice === 'needs_booking' && s.bookingOptionActive]}
          onPress={() => setCourtConfirmationChoice('needs_booking')}
        >
          <Text style={[s.bookingOptionTitle, courtConfirmationChoice === 'needs_booking' && s.bookingOptionTitleActive]}>
            Chưa xác nhận sân
          </Text>
          <Text style={s.bookingOptionSub}>App sẽ hỏi bạn có muốn đặt sân ngay lúc này hay cập nhật sau.</Text>
        </TouchableOpacity>

        {courtConfirmationChoice === 'needs_booking' && (
          <View style={s.bookingFollowup}>
            <Text style={s.bookingQuestion}>Bạn có muốn đặt sân ngay bây giờ không?</Text>
            <View style={s.bookingChoiceRow}>
              <TouchableOpacity
                style={[s.bookingMiniBtn, bookNowChoice === true && s.bookingMiniBtnActive]}
                onPress={() => setBookNowChoice(true)}
              >
                <Text style={[s.bookingMiniBtnText, bookNowChoice === true && s.bookingMiniBtnTextActive]}>Có, đặt luôn</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.bookingMiniBtn, bookNowChoice === false && s.bookingMiniBtnActive]}
                onPress={() => setBookNowChoice(false)}
              >
                <Text style={[s.bookingMiniBtnText, bookNowChoice === false && s.bookingMiniBtnTextActive]}>Để sau</Text>
              </TouchableOpacity>
            </View>

            {bookNowChoice === true && (
              <View style={s.bookingHelpBox}>
                <Text style={s.bookingHelpText}>Mở link booking của sân, đặt sân xong rồi nhập thông tin booking bên dưới để xác nhận.</Text>
                <TouchableOpacity style={s.bookingLinkBtn} onPress={openBookingLink}>
                  <Text style={s.bookingLinkBtnText}>Mở link đặt sân</Text>
                </TouchableOpacity>
              </View>
            )}

            {bookNowChoice === false && (
              <View style={s.bookingHelpBox}>
                <Text style={s.bookingHelpText}>Kèo sẽ được tạo với trạng thái sân chưa xác nhận. Bạn có thể cập nhật lại sau khi có booking.</Text>
              </View>
            )}
          </View>
        )}

        {((courtConfirmationChoice === 'confirmed') || (courtConfirmationChoice === 'needs_booking' && bookNowChoice === true)) && (
          <View style={s.bookingFields}>
            <Text style={s.bookingFieldTitle}>Thông tin booking</Text>
            <TextInput
              style={s.costInput}
              placeholder="Mã booking / mã đặt sân"
              placeholderTextColor="#aaa"
              value={bookingReference}
              onChangeText={setBookingReference}
            />
            <TextInput
              style={s.costInput}
              placeholder="Tên người đặt"
              placeholderTextColor="#aaa"
              value={bookingName}
              onChangeText={setBookingName}
            />
            <TextInput
              style={s.costInput}
              placeholder="Số điện thoại booking"
              placeholderTextColor="#aaa"
              keyboardType="phone-pad"
              value={bookingPhone}
              onChangeText={setBookingPhone}
            />
            <TextInput
              style={[s.costInput, s.bookingNotesInput]}
              placeholder="Ghi chú booking"
              placeholderTextColor="#aaa"
              multiline
              value={bookingNotes}
              onChangeText={setBookingNotes}
            />
            <Text style={s.bookingFootnote}>Cần ít nhất một thông tin booking để xác nhận sân.</Text>
          </View>
        )}
      </View>

      <TouchableOpacity style={s.nextBtn} onPress={goToStep3}>
        <Text style={s.nextBtnTxt}>Xem lại kèo →</Text>
      </TouchableOpacity>
    </ScrollView>
    </SafeAreaView>
  )

  // ────────────────────────────────────────────────────────────────────────────
  // STEP 3 — Review + Publish
  // ────────────────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={s.container} edges={['top']}>
    <ScrollView contentContainerStyle={{ paddingBottom: 48 }}>
      <BackLink label="Chỉnh lại" onPress={() => setStep(2)} />
      <WizardHeader title="Xác nhận & đăng kèo" subtitle="Bước 3/3 · Kiểm tra lại toàn bộ thông tin trước khi publish." />

      <View style={s.reviewCard}>
        <ReviewRow icon={<ShieldCheck size={18} color="#059669" />} label="Sân" value={selectedCourt!.name} />
        <ReviewRow icon={<MapPin size={18} color="#6b7280" />} label="Địa chỉ" value={`${selectedCourt!.address} · ${selectedCourt!.city}`} />
        <ReviewRow icon={<CalendarDays size={18} color="#4f46e5" />} label="Ngày" value={fmtDateFull(selectedDate!)} />
        <ReviewRow icon={<Clock3 size={18} color="#4f46e5" />} label="Giờ" value={`${fmtTime(startTime!)} → ${fmtTime(endTime!)}`} />
        <ReviewRow icon={<Clock3 size={18} color="#6b7280" />} label="Thời lượng" value={duration ?? ''} />
        <ReviewRow icon={<Users size={18} color="#059669" />} label="Số người" value={`${maxPlayers} người`} />
        <ReviewRow icon={<ShieldCheck size={18} color="#111827" />} label="Trình độ" value={`${eloLabel(eloMin)} → ${eloLabel(eloMax)}`} />
        {costPerPerson > 0 && (
          <ReviewRow icon={<Wallet size={18} color="#111827" />} label="Chi phí" value={`${costPerPerson.toLocaleString('vi-VN')}đ/người`} />
        )}
        <ReviewRow icon={<Clock3 size={18} color="#c2410c" />} label="Deadline" value={deadlinePreview()} />
        <ReviewRow icon={<CheckCircle2 size={18} color="#059669" />} label="Tình trạng sân" value={bookingStatusLabel()} />
        {hasBookingInfo() && (
          <ReviewRow
            icon={<CheckCircle2 size={18} color="#111827" />}
            label="Booking"
            value={[bookingReference, bookingName, bookingPhone].filter((value) => value.trim().length > 0).join(' · ') || bookingNotes}
          />
        )}
      </View>

      <TouchableOpacity
        style={[s.submitBtn, submitting && s.submitBtnDisabled]}
        onPress={submit}
        disabled={submitting}
      >
        <Text style={s.submitTxt}>{submitting ? 'Đang tạo kèo...' : 'Tạo kèo'}</Text>
      </TouchableOpacity>
    </ScrollView>
    </SafeAreaView>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CourtItem({ item, onPress }: { item: NearByCourt; onPress: (c: NearByCourt) => void }) {
  return (
    <TouchableOpacity style={s.courtItem} onPress={() => onPress(item)} activeOpacity={0.92}>
      <View style={s.courtRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.courtName}>{item.name}</Text>
          <View style={s.inlineMetaRow}>
            <MapPin size={14} color="#6b7280" />
            <Text style={s.courtAddr}>{item.address} · {item.city}</Text>
          </View>
        </View>
        <View style={s.courtMeta}>
          {item.distance !== undefined && (
            <Text style={s.distText}>
              {item.distance < 1
                ? `${Math.round(item.distance * 1000)}m`
                : `${item.distance.toFixed(1)}km`}
            </Text>
          )}
          <View style={[s.badge, item.hasSlots ? s.badgeOpen : s.badgeClosed]}>
            <Text style={[s.badgeTxt, item.hasSlots ? s.badgeTxtOpen : s.badgeTxtClosed]}>
              {item.hasSlots ? 'Đang mở' : 'Đã đóng'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
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

// ── Styles ────────────────────────────────────────────────────────────────────

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
