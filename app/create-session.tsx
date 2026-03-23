import DateTimePicker from '@react-native-community/datetimepicker'
import { supabase } from '@/lib/supabase'
import { type NearByCourt, useNearbyCourts } from '@/lib/useNearbyCourts'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator, Alert, FlatList, Keyboard, ScrollView,
  StyleSheet, Switch, Text, TextInput, TouchableOpacity, View,
} from 'react-native'
import { Calendar } from 'react-native-calendars'

// ── Constants ─────────────────────────────────────────────────────────────────

const ELO_LEVELS = [
  { label: '🌱 Mới bắt đầu', elo: 800  },
  { label: '🏃 Cơ bản',      elo: 900  },
  { label: '⚡ Trung bình',  elo: 1000 },
  { label: '🔥 Khá',         elo: 1150 },
  { label: '🏆 Giỏi',        elo: 1300 },
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
  function validateStart(time: Date): string | null {
    const now       = new Date()
    const isToday   = selectedDate?.toDateString() === now.toDateString()
    const openMins  = toMins(selectedCourt?.hours_open  ?? '06:00')
    const closeMins = toMins(selectedCourt?.hours_close ?? '22:00')
    const tMins     = time.getHours() * 60 + time.getMinutes()

    if (isToday && time <= now)  return 'Giờ bắt đầu phải sau giờ hiện tại'
    if (tMins < openMins)        return `Sân mở cửa lúc ${selectedCourt?.hours_open ?? '06:00'}`
    if (tMins >= closeMins)      return `Sân đóng cửa lúc ${selectedCourt?.hours_close ?? '22:00'}`
    return null
  }

  /** Validate end time against start + court close + 3h max */
  function validateEnd(end: Date, start: Date): string | null {
    const closeMins = toMins(selectedCourt?.hours_close ?? '22:00')
    const endMins   = end.getHours() * 60 + end.getMinutes()
    const diffMins  = (end.getTime() - start.getTime()) / 60_000

    if (end <= start) return 'Giờ kết thúc phải sau giờ bắt đầu'
    if (diffMins > 180)        return 'Tối đa 3 tiếng mỗi kèo'
    if (endMins > closeMins)   return `Sân đóng cửa lúc ${selectedCourt?.hours_close ?? '22:00'}`
    return null
  }

  // ── Event handlers ────────────────────────────────────────────────────────────

  function onCourtSelect(court: NearByCourt) {
    setSelectedCourt(court)
    setStartTime(null)
    setEndTime(null)
    setTimeError(null)
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
  }, [startTime, endTime])

  // Auto-advance to step 2 once a valid endTime is set and the end picker is closed
  useEffect(() => {
    if (step === 1 && startTime && endTime && endTime > startTime && !timeError && !showEndPicker) {
      const t = setTimeout(() => setStep(2), 300)
      return () => clearTimeout(t)
    }
  }, [endTime, showEndPicker])

  function goToStep2() {
    if (!selectedCourt || !selectedDate || !startTime || !endTime || timeError) return
    setStep(2)
  }

  function goToStep3() {
    const minIdx = ELO_LEVELS.findIndex(l => l.elo === eloMin)
    const maxIdx = ELO_LEVELS.findIndex(l => l.elo === eloMax)
    if (minIdx > maxIdx) {
      Alert.alert('Lỗi', 'Trình độ tối thiểu không thể cao hơn tối đa')
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
    <View style={s.container}>
      <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
        <Text style={s.backText}>← Quay lại</Text>
      </TouchableOpacity>
      <Text style={s.title}>Tạo kèo mới 🏓</Text>
      <Text style={s.stepLabel}>Bước 1/3 — Chọn sân & giờ</Text>

      {/* ── Court list or time picker ── */}
      {!selectedCourt ? (
        fallbackMode ? (
          <>
            <TextInput
              style={s.searchInput}
              placeholder="🔍 Tìm tên sân..."
              placeholderTextColor="#aaa"
              value={keyword}
              onChangeText={setKeyword}
              autoFocus
              returnKeyType="search"
            />
            {searching ? (
              <View style={s.center}><ActivityIndicator color="#16a34a" /></View>
            ) : keyword.length > 0 && courts.length === 0 ? (
              <View style={s.center}><Text style={s.noResult}>Không tìm thấy sân nào 😕</Text></View>
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
          <View style={s.center}><Text style={s.noResult}>Không tìm thấy sân nào 😕</Text></View>
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
                <Text style={s.selectedCardSub}>📍 {selectedCourt.address} · {selectedCourt.city}</Text>
                {(selectedCourt.hours_open || selectedCourt.hours_close) && (
                  <Text style={s.selectedCardSub}>
                    🕐 {selectedCourt.hours_open ?? '06:00'} – {selectedCourt.hours_close ?? '22:00'}
                  </Text>
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
            <Text style={s.durationTxt}>⏱ {duration}</Text>
          )}
          {timeError && (
            <Text style={s.timeError}>⚠️ {timeError}</Text>
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
    </View>
  )

  // ────────────────────────────────────────────────────────────────────────────
  // STEP 2 — Cấu hình kèo
  // ────────────────────────────────────────────────────────────────────────────

  if (step === 2) return (
    <ScrollView
      style={s.container}
      contentContainerStyle={{ paddingBottom: 48 }}
      keyboardShouldPersistTaps="handled"
    >
      <TouchableOpacity onPress={() => setStep(1)} style={s.backBtn}>
        <Text style={s.backText}>← Đổi sân/giờ</Text>
      </TouchableOpacity>
      <Text style={s.title}>Tạo kèo mới 🏓</Text>
      <Text style={s.stepLabel}>Bước 2/3 — Cấu hình kèo</Text>

      <View style={s.selectedCard}>
        <Text style={s.selectedCardName}>{selectedCourt!.name}</Text>
        <Text style={s.selectedCardSub}>
          🗓 {fmtDateFull(selectedDate!)} · {fmtTime(startTime!)} → {fmtTime(endTime!)}
        </Text>
        <Text style={s.selectedCardSub}>⏱ {duration}</Text>
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
            <Text style={[s.playerTxt, maxPlayers === n && s.optTxtActive]}>👥 {n} người</Text>
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
          👥 {maxPlayers} người ={' '}
          <Text style={s.costPerPerson}>{costPerPerson.toLocaleString('vi-VN')}đ/người</Text>
        </Text>
      )}

      <TouchableOpacity style={s.nextBtn} onPress={goToStep3}>
        <Text style={s.nextBtnTxt}>Xem lại kèo →</Text>
      </TouchableOpacity>
    </ScrollView>
  )

  // ────────────────────────────────────────────────────────────────────────────
  // STEP 3 — Review + Publish
  // ────────────────────────────────────────────────────────────────────────────

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 48 }}>
      <TouchableOpacity onPress={() => setStep(2)} style={s.backBtn}>
        <Text style={s.backText}>← Chỉnh lại</Text>
      </TouchableOpacity>
      <Text style={s.title}>Tạo kèo mới 🏓</Text>
      <Text style={s.stepLabel}>Bước 3/3 — Xác nhận & đăng kèo</Text>

      <View style={s.reviewCard}>
        <ReviewRow icon="🏟" label="Sân"      value={selectedCourt!.name} />
        <ReviewRow icon="📍" label="Địa chỉ"  value={`${selectedCourt!.address} · ${selectedCourt!.city}`} />
        <ReviewRow icon="📅" label="Ngày"      value={fmtDateFull(selectedDate!)} />
        <ReviewRow icon="🕐" label="Giờ"       value={`${fmtTime(startTime!)} → ${fmtTime(endTime!)}`} />
        <ReviewRow icon="⏱" label="Thời lượng" value={duration ?? ''} />
        <ReviewRow icon="👥" label="Số người"  value={`${maxPlayers} người`} />
        <ReviewRow icon="⚡" label="Trình độ" value={`${eloLabel(eloMin)} → ${eloLabel(eloMax)}`} />
        {costPerPerson > 0 && (
          <ReviewRow icon="💰" label="Chi phí" value={`${costPerPerson.toLocaleString('vi-VN')}đ/người`} />
        )}
        <ReviewRow icon="⏰" label="Deadline" value={deadlinePreview()} />
      </View>

      <TouchableOpacity
        style={[s.submitBtn, submitting && s.submitBtnDisabled]}
        onPress={submit}
        disabled={submitting}
      >
        <Text style={s.submitTxt}>{submitting ? 'Đang tạo kèo...' : '🏓 Tạo kèo'}</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function CourtItem({ item, onPress }: { item: NearByCourt; onPress: (c: NearByCourt) => void }) {
  return (
    <TouchableOpacity style={s.courtItem} onPress={() => onPress(item)}>
      <View style={s.courtRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.courtName}>{item.name}</Text>
          <Text style={s.courtAddr}>📍 {item.address} · {item.city}</Text>
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

function ReviewRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={s.reviewRow}>
      <Text style={s.reviewIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={s.reviewLabel}>{label}</Text>
        <Text style={s.reviewValue}>{value}</Text>
      </View>
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#fff', paddingTop: 60, paddingHorizontal: 20 },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14, color: '#888', marginTop: 8 },
  backBtn:     { marginBottom: 8 },
  backText:    { fontSize: 14, color: '#16a34a', fontWeight: '600' },
  title:       { fontSize: 26, fontWeight: '700', color: '#111', marginBottom: 4 },
  stepLabel:   { fontSize: 13, color: '#888', marginBottom: 24 },
  label:       { fontSize: 14, fontWeight: '600', color: '#333', marginTop: 20, marginBottom: 10 },
  noResult:    { fontSize: 14, color: '#888', textAlign: 'center', marginTop: 32 },

  // Search (fallback)
  searchInput: { borderWidth: 1.5, borderColor: '#ddd', borderRadius: 14, paddingHorizontal: 16, height: 52, fontSize: 16, color: '#333', marginBottom: 12 },

  // Court list
  courtItem:  { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  courtRow:   { flexDirection: 'row', alignItems: 'flex-start' },
  courtName:  { fontSize: 15, fontWeight: '600', color: '#111', marginBottom: 2 },
  courtAddr:  { fontSize: 13, color: '#888' },
  courtMeta:  { alignItems: 'flex-end', gap: 6 },
  distText:   { fontSize: 12, color: '#555', fontWeight: '500' },
  badge:      { borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  badgeOpen:      { backgroundColor: '#f0fdf4' },
  badgeClosed:    { backgroundColor: '#f3f4f6' },
  badgeTxt:       { fontSize: 11, fontWeight: '600' },
  badgeTxtOpen:   { color: '#16a34a' },
  badgeTxtClosed: { color: '#9ca3af' },

  // Selected court card
  selectedCard:      { backgroundColor: '#f0fdf4', borderRadius: 14, padding: 16, marginBottom: 8 },
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
  timeBtn:          { backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 12, padding: 16, alignItems: 'center' },
  timeBtnDisabled:  { backgroundColor: '#fafafa', borderColor: '#f0f0f0' },
  timeBtnTxt:       { fontSize: 24, fontWeight: 'bold', color: '#111' },
  timeBtnPlaceholder: { fontSize: 24, fontWeight: 'bold', color: '#AAAAAA' },
  durationTxt:      { fontSize: 13, color: '#16a34a', fontWeight: '600', marginTop: 4 },
  timeError:        { fontSize: 13, color: '#dc2626', marginTop: 6 },
  courtNote:        { backgroundColor: '#fffbeb', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginTop: 16 },
  courtNoteTxt:     { fontSize: 13, color: '#92400e' },

  // Inline time picker
  inlinePicker:       { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E0E0E0', marginTop: 8, borderRadius: 12 },
  inlinePickerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#E0E0E0' },
  inlinePickerCancel: { fontSize: 16, color: '#666' },
  inlinePickerTitle:  { fontSize: 16, fontWeight: '600', color: '#111' },
  inlinePickerDone:   { fontSize: 16, fontWeight: '600', color: '#00A651' },

  // Shared option buttons
  optRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optBtn:      { borderWidth: 1.5, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  optActive:   { borderColor: '#16a34a', backgroundColor: '#f0fdf4' },
  optTxt:      { fontSize: 13, color: '#555' },
  optTxtActive:{ color: '#16a34a', fontWeight: '600' },

  // Player count
  playerRow: { flexDirection: 'row', gap: 12 },
  playerBtn: { flex: 1, borderWidth: 1.5, borderColor: '#ddd', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  playerTxt: { fontSize: 14, fontWeight: '600', color: '#555' },

  // Deadline
  deadlineRow:     { flexDirection: 'row', gap: 8 },
  deadlineBtn:     { flex: 1, borderWidth: 1.5, borderColor: '#ddd', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  deadlineTxt:     { fontSize: 13, fontWeight: '600', color: '#555' },
  deadlinePreview: { fontSize: 12, color: '#888', marginTop: 8 },
  approvalRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderTopWidth: 1, borderTopColor: '#f0f0f0', marginTop: 8 },
  approvalTitle: { fontSize: 15, fontWeight: '600', color: '#111', marginBottom: 2 },
  approvalSub:   { fontSize: 12, color: '#888' },

  // Cost
  costInput:     { borderWidth: 1.5, borderColor: '#ddd', borderRadius: 14, paddingHorizontal: 16, height: 52, fontSize: 16, color: '#333' },
  costPreview:   { fontSize: 13, color: '#555', marginTop: 8 },
  costPerPerson: { fontWeight: '700', color: '#16a34a' },

  // Next button
  nextBtn:    { backgroundColor: '#16a34a', borderRadius: 14, height: 54, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  nextBtnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Review card
  reviewCard:  { backgroundColor: '#f9fafb', borderRadius: 16, padding: 20, gap: 16, marginBottom: 24 },
  reviewRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  reviewIcon:  { fontSize: 18, marginTop: 1 },
  reviewLabel: { fontSize: 12, color: '#888', marginBottom: 2 },
  reviewValue: { fontSize: 14, fontWeight: '600', color: '#111' },

  // Submit
  submitBtn:         { backgroundColor: '#16a34a', borderRadius: 14, height: 56, alignItems: 'center', justifyContent: 'center' },
  submitBtnDisabled: { backgroundColor: '#86efac' },
  submitTxt:         { color: '#fff', fontSize: 17, fontWeight: '700' },
})
