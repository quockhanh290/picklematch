import DateTimePicker from '@react-native-community/datetimepicker'
import { ArrowRight, Calendar, Clock3, Info, MapPin, Search } from 'lucide-react-native'
import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'

import type { NearByCourt } from '@/lib/useNearbyCourts'

type Props = {
  courts: NearByCourt[]
  loadingCourts: boolean
  fallbackMode: boolean
  keyword: string
  setKeyword: (value: string) => void
  searching: boolean
  selectedCourt: NearByCourt | null
  selectedDate: Date | null
  startTime: Date | null
  endTime: Date | null
  showStartPicker: boolean
  showEndPicker: boolean
  timeError: string | null
  duration: string | null
  onCourtSelect: (court: NearByCourt) => void
  onChangeCourt: () => void
  onDateSelect: (date: Date) => void
  onStartTimeChange: (date: Date) => void
  onEndTimeChange: (date: Date) => void
  onToggleStartPicker: () => void
  onToggleEndPicker: () => void
  onCloseStartPicker: () => void
  onCloseEndPicker: () => void
  defaultPickerValue: (type: 'start' | 'end') => Date
  onContinue: () => void
}

const WEEKDAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
const MONTH_LABELS = [
  '\u0054\u0068\u00e1\u006e\u0067\u0020\u0031',
  '\u0054\u0068\u00e1\u006e\u0067\u0020\u0032',
  '\u0054\u0068\u00e1\u006e\u0067\u0020\u0033',
  '\u0054\u0068\u00e1\u006e\u0067\u0020\u0034',
  '\u0054\u0068\u00e1\u006e\u0067\u0020\u0035',
  '\u0054\u0068\u00e1\u006e\u0067\u0020\u0036',
  '\u0054\u0068\u00e1\u006e\u0067\u0020\u0037',
  '\u0054\u0068\u00e1\u006e\u0067\u0020\u0038',
  '\u0054\u0068\u00e1\u006e\u0067\u0020\u0039',
  '\u0054\u0068\u00e1\u006e\u0067\u0020\u0031\u0030',
  '\u0054\u0068\u00e1\u006e\u0067\u0020\u0031\u0031',
  '\u0054\u0068\u00e1\u006e\u0067\u0020\u0031\u0032',
]

function startOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
}

function addDays(date: Date, amount: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

function isSameDay(left: Date | null, right: Date) {
  return !!left && left.toDateString() === right.toDateString()
}

function isWeekend(date: Date) {
  const day = date.getDay()
  return day === 0 || day === 6
}

function formatTime(date: Date | null) {
  if (!date) return '--:--'
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

function formatSelectedDate(date: Date | null) {
  if (!date) return '\u0056\u0075\u0069\u0020\u006c\u00f2\u006e\u0067\u0020\u0063\u0068\u1ecd\u006e\u0020\u006e\u0067\u00e0\u0079\u0020\u0063\u0068\u01a1\u0069'
  return `${WEEKDAY_LABELS[date.getDay()]}, ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
}

function formatDistance(distance?: number) {
  if (distance == null) return null
  return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`
}

function CourtRow({ court, onPress }: { court: NearByCourt; onPress: (court: NearByCourt) => void }) {
  const distanceLabel = formatDistance(court.distance)
  const isOpen = !!court.hasSlots

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      className="rounded-[18px] border border-slate-200 bg-white p-3.5"
      onPress={() => onPress(court)}
    >
      <View className="flex-row items-start gap-3">
        <View className="h-11 w-11 items-center justify-center rounded-[14px] bg-emerald-100">
          <MapPin size={18} color="#059669" />
        </View>
        <View className="flex-1">
          <View className="flex-row items-start justify-between gap-3">
            <Text className="flex-1 text-[15px] font-black text-slate-900" numberOfLines={1}>
              {court.name}
            </Text>
            {distanceLabel ? (
              <Text className="text-[11px] font-bold text-slate-400">{distanceLabel}</Text>
            ) : null}
          </View>
          <Text className="mt-1 text-[12px] leading-[18px] text-slate-500" numberOfLines={2}>
            {court.address}
            {court.city ? ` · ${court.city}` : ''}
          </Text>
          <View className="mt-2 flex-row items-center gap-2">
            <View className={`rounded-full border px-2.5 py-1 ${isOpen ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
              <Text className={`text-[10px] font-bold uppercase tracking-[0.8px] ${isOpen ? 'text-emerald-700' : 'text-rose-700'}`}>
                {isOpen ? '\u0110\u0061\u006e\u0067\u0020\u006d\u1edf' : '\u0110\u00e3\u0020\u0111\u00f3\u006e\u0067'}
              </Text>
            </View>
            {(court.hours_open || court.hours_close) ? (
              <Text className="text-[11px] font-medium text-slate-400">
                {court.hours_open ?? '06:00'} - {court.hours_close ?? '22:00'}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
}

export function CreateSessionStep1({
  courts,
  loadingCourts,
  fallbackMode,
  keyword,
  setKeyword,
  searching,
  selectedCourt,
  selectedDate,
  startTime,
  endTime,
  showStartPicker,
  showEndPicker,
  timeError,
  duration,
  onCourtSelect,
  onChangeCourt,
  onDateSelect,
  onStartTimeChange,
  onEndTimeChange,
  onToggleStartPicker,
  onToggleEndPicker,
  onCloseStartPicker,
  onCloseEndPicker,
  defaultPickerValue,
  onContinue,
}: Props) {
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [draftDate, setDraftDate] = useState(selectedDate ?? new Date())
  const [draftStartTime, setDraftStartTime] = useState(startTime ?? defaultPickerValue('start'))
  const [draftEndTime, setDraftEndTime] = useState(endTime ?? defaultPickerValue('end'))

  const dateStrip = useMemo(() => {
    const today = startOfDay(new Date())
    const selected = selectedDate ? startOfDay(selectedDate) : today
    const diffDays = Math.floor((selected.getTime() - today.getTime()) / 86_400_000)
    const offset = diffDays > 6 ? diffDays - 3 : 0
    const stripStart = addDays(today, Math.max(0, offset))
    return Array.from({ length: 7 }, (_, index) => addDays(stripStart, index))
  }, [selectedDate])

  const canContinue = !!selectedCourt && !!selectedDate && !!startTime && !!endTime && !timeError

  useEffect(() => {
    if (showStartPicker) {
      setDraftStartTime(startTime ?? defaultPickerValue('start'))
    }
  }, [defaultPickerValue, showStartPicker, startTime])

  useEffect(() => {
    if (showEndPicker) {
      setDraftEndTime(endTime ?? defaultPickerValue('end'))
    }
  }, [defaultPickerValue, endTime, showEndPicker])

  function openDatePicker() {
    if (!selectedCourt) return
    setDraftDate(selectedDate ?? new Date())
    setShowDatePicker(value => !value)
  }

  function confirmDraftDate() {
    onDateSelect(startOfDay(draftDate))
    setShowDatePicker(false)
  }

  function confirmDraftStartTime() {
    onStartTimeChange(draftStartTime)
    onCloseStartPicker()
  }

  function confirmDraftEndTime() {
    onEndTimeChange(draftEndTime)
    onCloseEndPicker()
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 32 }}
      keyboardShouldPersistTaps="handled"
      className="flex-1"
    >
      <View className="rounded-[20px] border border-slate-200 bg-white p-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-[14px] font-extrabold text-slate-900">{'\u0110\u1ecba\u0020\u0111\u0069\u1ec3\u006d'}</Text>
          {selectedCourt ? (
            <TouchableOpacity onPress={onChangeCourt}>
              <Text className="text-[12px] font-bold text-emerald-600">{'\u0110\u1ed5\u0069\u0020\u0073\u00e2\u006e'}</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {selectedCourt ? (
          <View className="mt-3.5 flex-row items-center gap-3.5 rounded-[14px] border border-slate-100 bg-slate-50 p-3.5">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
              <MapPin size={18} color="#059669" />
            </View>
            <View className="flex-1">
              <Text className="text-[15px] font-black text-slate-900" numberOfLines={1}>
                {selectedCourt.name}
              </Text>
              <Text className="mt-0.5 text-[12px] leading-[18px] text-slate-500" numberOfLines={2}>
                {selectedCourt.address}
                {selectedCourt.city ? ` · ${selectedCourt.city}` : ''}
              </Text>
            </View>
          </View>
        ) : (
          <>
            <View className="mt-3.5 flex-row items-center gap-3 rounded-[14px] border border-slate-200 bg-slate-50 px-3.5 py-3">
              <Search size={16} color="#94a3b8" />
              <TextInput
                value={keyword}
                onChangeText={setKeyword}
                placeholder={'\u0054\u00ec\u006d\u0020\u0074\u00ea\u006e\u0020\u0073\u00e2\u006e\u0020\u0068\u006f\u1eb7\u0063\u0020\u0111\u1ecba\u0020\u0063\u0068\u1ec9'}
                placeholderTextColor="#94a3b8"
                className="flex-1 py-0 text-[14px] text-slate-700"
                returnKeyType="search"
              />
            </View>

            <View className="mt-3 gap-3">
              {loadingCourts ? (
                <View className="items-center justify-center rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-8">
                  <ActivityIndicator color="#059669" />
                  <Text className="mt-3 text-[13px] font-medium text-slate-500">
                    {'\u0110\u0061\u006e\u0067\u0020\u0074\u00ec\u006d\u0020\u0073\u00e2\u006e\u0020\u0067\u1ea7\u006e\u0020\u0062\u1ea1\u006e\u002e\u002e\u002e'}
                  </Text>
                </View>
              ) : searching ? (
                <View className="items-center justify-center rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-8">
                  <ActivityIndicator color="#059669" />
                </View>
              ) : courts.length > 0 ? (
                courts.map(court => (
                  <CourtRow key={court.id} court={court} onPress={onCourtSelect} />
                ))
              ) : (
                <View className="items-center justify-center rounded-[18px] border border-dashed border-slate-200 bg-slate-50 px-4 py-8">
                  <Text className="text-center text-[13px] leading-[20px] text-slate-500">
                    {fallbackMode
                      ? '\u004e\u0068\u1ead\u0070\u0020\u0074\u00ea\u006e\u0020\u0073\u00e2\u006e\u0020\u0111\u1ec3\u0020\u0074\u00ec\u006d\u0020\u006b\u0069\u1ebf\u006d'
                      : '\u004b\u0068\u00f4\u006e\u0067\u0020\u0074\u00ec\u006d\u0020\u0074\u0068\u1ea5\u0079\u0020\u0073\u00e2\u006e\u0020\u006e\u00e0\u006f'}
                  </Text>
                </View>
              )}
            </View>
          </>
        )}
      </View>

      <View className={`mt-5 rounded-[20px] border border-slate-200 bg-white p-4 ${selectedCourt ? '' : 'opacity-60'}`}>
        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-1">
            <Text className="text-[14px] font-extrabold text-slate-900">{'\u0054\u0068\u1eddi\u0020\u0067\u0069\u0061\u006e'}</Text>
            <Text className="mt-1 text-[12px] font-medium text-slate-500">
              {formatSelectedDate(selectedDate)}
            </Text>
          </View>
          <TouchableOpacity
            disabled={!selectedCourt}
            onPress={openDatePicker}
            className={`flex-row items-center gap-1.5 rounded-full border px-3 py-2 ${selectedCourt ? 'border-slate-200 bg-white' : 'border-slate-100 bg-slate-50'}`}
          >
            <Calendar size={14} color={selectedCourt ? '#475569' : '#cbd5e1'} />
            <Text className={`text-[12px] font-bold ${selectedCourt ? 'text-slate-600' : 'text-slate-300'}`}>
              {showDatePicker ? '\u0110\u00f3\u006e\u0067\u0020\u006c\u1ecb\u0063\u0068' : '\u004d\u1edf\u0020\u006c\u1ecb\u0063\u0068'}
            </Text>
          </TouchableOpacity>
        </View>

        {selectedCourt ? (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mt-4" contentContainerStyle={{ gap: 10 }}>
              {dateStrip.map(day => {
                const active = isSameDay(selectedDate, day)
                const weekend = isWeekend(day)
                return (
                  <TouchableOpacity
                    key={day.toISOString()}
                    activeOpacity={0.92}
                    onPress={() => onDateSelect(day)}
                    className={`min-w-[64px] items-center rounded-[16px] border p-3 ${active ? 'border-emerald-600 bg-emerald-600' : 'border-slate-100 bg-slate-50'}`}
                  >
                    <Text className={`text-[10px] font-bold uppercase ${active ? 'text-emerald-100' : weekend ? 'text-rose-500' : 'text-slate-400'}`}>
                      {WEEKDAY_LABELS[day.getDay()]}
                    </Text>
                    <Text className={`mt-1 text-[20px] font-black ${active ? 'text-white' : weekend ? 'text-rose-600' : 'text-slate-700'}`}>
                      {day.getDate()}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </ScrollView>

            {showDatePicker ? (
              <View className="mt-4 overflow-hidden rounded-[18px] border border-slate-200 bg-slate-50">
                <View className="flex-row items-center justify-between border-b border-slate-200 px-4 py-3">
                  <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                    <Text className="text-[13px] font-bold text-slate-500">{'\u0048\u1ee7\u0079'}</Text>
                  </TouchableOpacity>
                  <Text className="text-[13px] font-black text-slate-800">
                    {MONTH_LABELS[draftDate.getMonth()]}
                  </Text>
                  <TouchableOpacity onPress={confirmDraftDate}>
                    <Text className="text-[13px] font-bold text-emerald-600">{'\u0058\u006f\u006e\u0067'}</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  mode="date"
                  display="spinner"
                  themeVariant="light"
                  value={draftDate}
                  minimumDate={new Date()}
                  locale="vi-VN"
                  style={{ width: '100%', height: 216, backgroundColor: '#f8fafc' }}
                  onChange={(_event, nextDate) => {
                    if (nextDate) setDraftDate(nextDate)
                  }}
                />
              </View>
            ) : null}

            <View className="my-4 h-px w-full bg-slate-100" />

            <View className="flex-row items-center gap-3">
              <TouchableOpacity
                activeOpacity={0.92}
                onPress={onToggleStartPicker}
                className="relative flex-1 overflow-hidden rounded-[16px] border border-slate-100 bg-slate-50 p-3"
              >
                <Text className="relative z-10 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  {'\u0042\u1eaf\u0074\u0020\u0111\u1ea7\u0075'}
                </Text>
                <Text className="relative z-10 mt-1.5 text-[22px] font-black text-indigo-900">{formatTime(startTime)}</Text>
                <View className="absolute -bottom-3 -right-3 opacity-10">
                  <Clock3 size={52} color="#312e81" />
                </View>
              </TouchableOpacity>

              <ArrowRight size={20} color="#cbd5e1" />

              <TouchableOpacity
                activeOpacity={0.92}
                disabled={!selectedDate || !startTime}
                onPress={onToggleEndPicker}
                className={`relative flex-1 overflow-hidden rounded-[16px] border p-3 ${selectedDate && startTime ? 'border-slate-100 bg-slate-50' : 'border-slate-100 bg-slate-50 opacity-60'}`}
              >
                <Text className="relative z-10 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  {'\u004b\u1ebf\u0074\u0020\u0074\u0068\u00fa\u0063'}
                </Text>
                <Text className="relative z-10 mt-1.5 text-[22px] font-black text-indigo-900">{formatTime(endTime)}</Text>
                <View className="absolute -bottom-3 -right-3 opacity-10">
                  <Clock3 size={52} color="#312e81" />
                </View>
              </TouchableOpacity>
            </View>

            {showStartPicker ? (
              <View className="mt-4 overflow-hidden rounded-[18px] border border-slate-200 bg-white">
                <View className="flex-row items-center justify-between border-b border-slate-200 px-4 py-3">
                  <TouchableOpacity onPress={onCloseStartPicker}>
                    <Text className="text-[13px] font-bold text-slate-500">{'\u0048\u1ee7\u0079'}</Text>
                  </TouchableOpacity>
                  <Text className="text-[13px] font-black text-slate-800">{'\u0047\u0069\u1edd\u0020\u0062\u1eaf\u0074\u0020\u0111\u1ea7\u0075'}</Text>
                  <TouchableOpacity onPress={confirmDraftStartTime}>
                    <Text className="text-[13px] font-bold text-emerald-600">{'\u0058\u006f\u006e\u0067'}</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  mode="time"
                  display="spinner"
                  themeVariant="light"
                  value={draftStartTime}
                  is24Hour
                  locale="vi-VN"
                  style={{ width: '100%', height: 216, backgroundColor: '#ffffff' }}
                  onChange={(_event, nextDate) => {
                    if (nextDate) setDraftStartTime(nextDate)
                  }}
                />
              </View>
            ) : null}

            {showEndPicker ? (
              <View className="mt-4 overflow-hidden rounded-[18px] border border-slate-200 bg-white">
                <View className="flex-row items-center justify-between border-b border-slate-200 px-4 py-3">
                  <TouchableOpacity onPress={onCloseEndPicker}>
                    <Text className="text-[13px] font-bold text-slate-500">{'\u0048\u1ee7\u0079'}</Text>
                  </TouchableOpacity>
                  <Text className="text-[13px] font-black text-slate-800">{'\u0047\u0069\u1edd\u0020\u006b\u1ebf\u0074\u0020\u0074\u0068\u00fa\u0063'}</Text>
                  <TouchableOpacity onPress={confirmDraftEndTime}>
                    <Text className="text-[13px] font-bold text-emerald-600">{'\u0058\u006f\u006e\u0067'}</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  mode="time"
                  display="spinner"
                  themeVariant="light"
                  value={draftEndTime}
                  is24Hour
                  locale="vi-VN"
                  style={{ width: '100%', height: 216, backgroundColor: '#ffffff' }}
                  onChange={(_event, nextDate) => {
                    if (nextDate) setDraftEndTime(nextDate)
                  }}
                />
              </View>
            ) : null}

            {duration && !timeError ? (
              <Text className="mt-4 text-[13px] font-semibold text-emerald-700">{duration}</Text>
            ) : null}
            {timeError ? (
              <Text className="mt-4 text-[13px] font-semibold text-rose-600">{timeError}</Text>
            ) : null}
          </>
        ) : (
          <View className="mt-4 rounded-[16px] border border-dashed border-slate-200 bg-slate-50 px-4 py-6">
            <Text className="text-center text-[13px] leading-[20px] text-slate-500">
              {'\u0056\u0075\u0069\u0020\u006c\u00f2\u006e\u0067\u0020\u0063\u0068\u1ecd\u006e\u0020\u0073\u00e2\u006e\u0020\u0074\u0072\u01b0\u1edb\u0063\u0020\u0111\u1ec3\u0020\u0074\u0068\u0069\u1ebf\u0074\u0020\u006c\u1ead\u0070\u0020\u006e\u0067\u00e0\u0079\u0020\u0067\u0069\u1edd\u0020\u0063\u0068\u01a1\u0069'}
            </Text>
          </View>
        )}
      </View>

      <View className="mt-5 flex-row items-start gap-3 rounded-[16px] border border-amber-200 bg-amber-50 p-4">
        <Info size={18} color="#d97706" />
        <Text className="flex-1 text-[13px] leading-[20px] text-amber-800">
          {'\u0056\u0075\u0069\u0020\u006c\u00f2\u006e\u0067\u0020\u0111\u1ea3\u006d\u0020\u0062\u1ea3\u006f\u0020\u0062\u1ea1\u006e\u0020\u0111\u00e3\u0020\u006c\u0069\u00ea\u006e\u0020\u0068\u1ec7\u0020\u0111\u1eb7\u0074\u0020\u0073\u00e2\u006e\u0020\u0074\u0072\u01b0\u1edb\u0063\u0020\u006b\u0068\u0069\u0020\u0074\u1ea1\u006f\u0020\u006b\u00e8\u006f\u0020\u0074\u0072\u00ea\u006e\u0020\u0068\u1ec7\u0020\u0074\u0068\u1ed1\u006e\u0067\u002e'}
        </Text>
      </View>

      {canContinue ? (
        <TouchableOpacity
          activeOpacity={0.92}
          onPress={onContinue}
          className="mt-5 items-center rounded-[18px] bg-emerald-600 px-4 py-4"
        >
          <Text className="text-[15px] font-black text-white">{'\u0054\u0069\u1ebf\u0070\u0020\u0074\u0068\u0065\u006f'}</Text>
        </TouchableOpacity>
      ) : null}
    </ScrollView>
  )
}
