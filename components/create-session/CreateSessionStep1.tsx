import { AppButton, ScreenHeader } from '@/components/design'
import { PROFILE_THEME_COLORS } from '@/components/profile/profileTheme'
import DateTimePicker from '@react-native-community/datetimepicker'
import { Calendar, Clock3, Info, MapPin, Search, SlidersHorizontal } from 'lucide-react-native'
import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Keyboard, Pressable, ScrollView, Text, TextInput, View } from 'react-native'

import type { NearByCourt } from '@/lib/useNearbyCourts'

type Props = {
  onBack: () => void
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
const MONTH_LABELS = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12']

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

function formatHeroDateLabel(date: Date | null) {
  if (!date) return 'Chưa chọn ngày'
  const weekdayLong = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'][date.getDay()]
  return `${weekdayLong}, ngày ${date.getDate()} tháng ${date.getMonth() + 1}`
}

function formatDistance(distance?: number) {
  if (distance == null) return null
  return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`
}

function CourtRow({ court, onPress }: { court: NearByCourt; onPress: (court: NearByCourt) => void }) {
  const distanceLabel = formatDistance(court.distance)
  const isOpen = !!court.hasSlots

  return (
    <Pressable
      onPress={() => onPress(court)}
      style={({ pressed }) => ({
        borderRadius: 20,
        borderWidth: 1,
        borderColor: PROFILE_THEME_COLORS.outlineVariant,
        backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest,
        padding: 14,
        opacity: pressed ? 0.88 : 1,
      })}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            backgroundColor: PROFILE_THEME_COLORS.secondaryContainer,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MapPin size={18} color={PROFILE_THEME_COLORS.surfaceTint} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
            <Text style={{ flex: 1, fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 15, color: PROFILE_THEME_COLORS.onSurface }} numberOfLines={1}>
              {court.name}
            </Text>
            {distanceLabel ? (
              <Text style={{ fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 11, color: PROFILE_THEME_COLORS.outline }}>{distanceLabel}</Text>
            ) : null}
          </View>
          <Text style={{ fontFamily: 'PlusJakartaSans-Regular', fontSize: 12, lineHeight: 18, color: PROFILE_THEME_COLORS.onSurfaceVariant, marginTop: 3 }} numberOfLines={2}>
            {court.address}
            {court.city ? ` · ${court.city}` : ''}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <View
              style={{
                borderRadius: 999,
                borderWidth: 1,
                borderColor: isOpen ? PROFILE_THEME_COLORS.outlineVariant : PROFILE_THEME_COLORS.error,
                backgroundColor: isOpen ? PROFILE_THEME_COLORS.secondaryContainer : PROFILE_THEME_COLORS.errorContainer,
                paddingHorizontal: 10,
                paddingVertical: 4,
              }}
            >
              <Text
                style={{
                  fontFamily: 'PlusJakartaSans-ExtraBold',
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                  color: isOpen ? PROFILE_THEME_COLORS.surfaceTint : PROFILE_THEME_COLORS.error,
                }}
              >
                {isOpen ? 'Đang mở' : 'Đã đóng'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  )
}

const sectionCard = {
  borderRadius: 24,
  borderWidth: 1,
  borderColor: PROFILE_THEME_COLORS.outlineVariant,
  backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest,
  padding: 18,
  marginBottom: 18,
} as const

const pickerHeader = {
  width: '100%' as any,
  maxWidth: 360,
  flexDirection: 'row' as const,
  alignItems: 'center' as const,
  justifyContent: 'space-between' as const,
  borderBottomWidth: 1,
  borderBottomColor: PROFILE_THEME_COLORS.outlineVariant,
  paddingHorizontal: 16,
  paddingVertical: 12,
}

export function CreateSessionStep1({
  onBack,
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
  const [isChoosingCourt, setIsChoosingCourt] = useState(false)
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
  const showCourtPicker = !selectedCourt || isChoosingCourt

  useEffect(() => {
    if (showStartPicker) {
      const nextValue = startTime ?? defaultPickerValue('start')
      setDraftStartTime((cur) => (cur.getTime() === nextValue.getTime() ? cur : nextValue))
    }
  }, [defaultPickerValue, showStartPicker, startTime])

  useEffect(() => {
    if (showEndPicker) {
      const nextValue = endTime ?? defaultPickerValue('end')
      setDraftEndTime((cur) => (cur.getTime() === nextValue.getTime() ? cur : nextValue))
    }
  }, [defaultPickerValue, endTime, showEndPicker])

  function openDatePicker() {
    if (!selectedCourt) return
    setDraftDate(selectedDate ?? new Date())
    setShowDatePicker((v) => !v)
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
      style={{ flex: 1 }}
      scrollEnabled={!(showStartPicker || showEndPicker || showDatePicker)}
    >
      <View style={{ borderRadius: 0, backgroundColor: 'transparent', paddingTop: 12, marginBottom: 16 }}>
        <ScreenHeader
          variant="brand"
          title="KINETIC"
          onBackPress={onBack}
          style={{ marginHorizontal: -20, marginTop: -12 }}
          rightSlot={
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 999,
                backgroundColor: PROFILE_THEME_COLORS.primaryContainer,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: PROFILE_THEME_COLORS.outlineVariant,
              }}
            >
              <Text style={{ fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 11, color: PROFILE_THEME_COLORS.surfaceTint }}>QK</Text>
            </View>
          }
        />

        <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 16, marginBottom: 4 }}>
          <Text style={{ fontFamily: 'PlusJakartaSans-ExtraBoldItalic', fontSize: 56, color: PROFILE_THEME_COLORS.primaryContainer, lineHeight: 56, marginTop: 2 }}>
            01
          </Text>
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={{ fontFamily: 'PlusJakartaSans-ExtraBoldItalic', fontSize: 40, color: PROFILE_THEME_COLORS.primary, lineHeight: 42 }}>
              Chọn Sân
            </Text>
            <Text style={{ fontFamily: 'PlusJakartaSans-ExtraBoldItalic', fontSize: 40, color: PROFILE_THEME_COLORS.primary, lineHeight: 42 }}>
              & Ngày giờ
            </Text>
            <View style={{ marginTop: 10, width: 64, height: 4, borderRadius: 999, backgroundColor: '#A6E6D2' }} />
          </View>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: PROFILE_THEME_COLORS.outlineVariant,
            backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow,
            paddingHorizontal: 14,
            paddingVertical: 11,
          }}
        >
          <Search size={16} color={PROFILE_THEME_COLORS.outline} />
          <TextInput
            value={keyword}
            onFocus={() => setIsChoosingCourt(true)}
            onChangeText={(value) => {
              setKeyword(value)
              setIsChoosingCourt(true)
            }}
            placeholder="Tìm tên sân hoặc khu vực..."
            placeholderTextColor={PROFILE_THEME_COLORS.outline}
            style={{ flex: 1, fontFamily: 'PlusJakartaSans-Regular', fontSize: 14, color: PROFILE_THEME_COLORS.onSurface, padding: 0 }}
            returnKeyType="search"
          />
          <View style={{ width: 34, height: 34, borderRadius: 999, backgroundColor: PROFILE_THEME_COLORS.primary, alignItems: 'center', justifyContent: 'center' }}>
            <SlidersHorizontal size={14} color={PROFILE_THEME_COLORS.onPrimary} strokeWidth={2.6} />
          </View>
        </View>
      </View>

      <View style={sectionCard}>
        {selectedCourt ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 15, color: PROFILE_THEME_COLORS.onSurface }}>Sân đã chọn</Text>
              <Pressable onPress={() => setIsChoosingCourt((v) => !v)} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                <Text style={{ fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 13, color: PROFILE_THEME_COLORS.primary }}>
                  {showCourtPicker ? 'Đóng chọn sân' : 'Đổi sân'}
                </Text>
              </Pressable>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 999, backgroundColor: PROFILE_THEME_COLORS.secondaryContainer, alignItems: 'center', justifyContent: 'center' }}>
                <MapPin size={18} color={PROFILE_THEME_COLORS.surfaceTint} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 15, color: PROFILE_THEME_COLORS.onSurface }} numberOfLines={1}>
                  {selectedCourt.name}
                </Text>
                <Text style={{ fontFamily: 'PlusJakartaSans-Regular', fontSize: 12, lineHeight: 18, color: PROFILE_THEME_COLORS.onSurfaceVariant, marginTop: 2 }} numberOfLines={2}>
                  {selectedCourt.address}
                  {selectedCourt.city ? ` · ${selectedCourt.city}` : ''}
                </Text>
              </View>
            </View>
          </>
        ) : (
          <Text style={{ fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 15, color: PROFILE_THEME_COLORS.onSurface, marginBottom: 12 }}>Gợi ý sân</Text>
        )}

        {showCourtPicker ? (
          <View style={{ gap: 10, marginTop: selectedCourt ? 14 : 0 }}>
            {loadingCourts ? (
              <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 32 }}>
                <ActivityIndicator color={PROFILE_THEME_COLORS.primary} />
                <Text style={{ fontFamily: 'PlusJakartaSans-Regular', fontSize: 13, color: PROFILE_THEME_COLORS.onSurfaceVariant, marginTop: 12 }}>
                  Đang tìm sân gần bạn...
                </Text>
              </View>
            ) : searching ? (
              <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 32 }}>
                <ActivityIndicator color={PROFILE_THEME_COLORS.primary} />
              </View>
            ) : courts.length > 0 ? (
              courts.map((court) => (
                <CourtRow
                  key={court.id}
                  court={court}
                  onPress={(nextCourt) => {
                    onCourtSelect(nextCourt)
                    setKeyword('')
                    setIsChoosingCourt(false)
                    Keyboard.dismiss()
                  }}
                />
              ))
            ) : (
              <View
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 20,
                  borderWidth: 1.5,
                  borderStyle: 'dashed',
                  borderColor: PROFILE_THEME_COLORS.outlineVariant,
                  backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow,
                  paddingVertical: 32,
                  paddingHorizontal: 16,
                }}
              >
                <Text style={{ fontFamily: 'PlusJakartaSans-Regular', fontSize: 13, lineHeight: 20, color: PROFILE_THEME_COLORS.onSurfaceVariant, textAlign: 'center' }}>
                  {fallbackMode ? 'Nhập tên sân để tìm kiếm' : 'Không tìm thấy sân nào'}
                </Text>
              </View>
            )}
          </View>
        ) : null}
      </View>

      <View style={[sectionCard, { opacity: selectedCourt ? 1 : 0.5 }]}>
        <Pressable
          disabled={!selectedCourt}
          onPress={openDatePicker}
          style={({ pressed }) => ({
            borderRadius: 20,
            borderWidth: 1,
            borderColor: PROFILE_THEME_COLORS.outlineVariant,
            backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow,
            padding: 16,
            opacity: pressed ? 0.86 : 1,
            marginBottom: 12,
          })}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 28, height: 28, borderRadius: 999, backgroundColor: PROFILE_THEME_COLORS.secondaryContainer, alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={14} color={PROFILE_THEME_COLORS.surfaceTint} strokeWidth={2.6} />
            </View>
            <Text style={{ fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, color: PROFILE_THEME_COLORS.outline }}>
              Ngày chơi
            </Text>
          </View>
          {selectedCourt ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: 12 }}
              contentContainerStyle={{ flexGrow: 1, flexDirection: 'row', justifyContent: 'space-between', gap: 8, paddingHorizontal: 4 }}
            >
              {dateStrip.map((day) => {
                const active = isSameDay(selectedDate, day)
                const weekend = isWeekend(day)
                return (
                  <Pressable
                    key={day.toISOString()}
                    onPress={() => onDateSelect(day)}
                    style={({ pressed }) => ({
                      width: 46,
                      alignItems: 'center',
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: active ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.outlineVariant,
                      backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow,
                      paddingVertical: 9,
                      paddingHorizontal: 8,
                      opacity: pressed ? 0.85 : 1,
                    })}
                  >
                    <Text
                      style={{
                        fontFamily: 'PlusJakartaSans-ExtraBold',
                        fontSize: 11,
                        textTransform: 'uppercase',
                        color: active ? PROFILE_THEME_COLORS.primary : weekend ? PROFILE_THEME_COLORS.error : PROFILE_THEME_COLORS.outline,
                      }}
                    >
                      {WEEKDAY_LABELS[day.getDay()]}
                    </Text>
                    <View
                      style={{
                        marginTop: 4,
                        width: 30,
                        height: 30,
                        borderRadius: 999,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: active ? PROFILE_THEME_COLORS.primary : 'transparent',
                      }}
                    >
                      <Text
                        style={{
                          fontFamily: 'PlusJakartaSans-ExtraBold',
                          fontSize: 18,
                          lineHeight: 20,
                          color: active ? PROFILE_THEME_COLORS.onPrimary : weekend ? PROFILE_THEME_COLORS.error : PROFILE_THEME_COLORS.onSurface,
                        }}
                      >
                        {day.getDate().toString().padStart(2, '0')}
                      </Text>
                    </View>
                  </Pressable>
                )
              })}
            </ScrollView>
          ) : null}
          <Text style={{ fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 32, color: PROFILE_THEME_COLORS.surfaceTint, marginTop: 12, lineHeight: 36 }}>
            {formatHeroDateLabel(selectedDate)}
          </Text>
        </Pressable>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <Pressable
            disabled={!selectedCourt}
            onPress={onToggleStartPicker}
            style={({ pressed }) => ({
              flex: 1,
              minWidth: 0,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: PROFILE_THEME_COLORS.outlineVariant,
              backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow,
              padding: 16,
              opacity: pressed ? 0.86 : 1,
            })}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={{ width: 28, height: 28, borderRadius: 999, backgroundColor: PROFILE_THEME_COLORS.secondaryContainer, alignItems: 'center', justifyContent: 'center' }}>
                <Clock3 size={14} color={PROFILE_THEME_COLORS.surfaceTint} strokeWidth={2.6} />
              </View>
              <Text style={{ fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, color: PROFILE_THEME_COLORS.outline }}>
                Bắt đầu
              </Text>
            </View>
            <Text style={{ fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 32, color: PROFILE_THEME_COLORS.surfaceTint, marginTop: 12, lineHeight: 36 }}>
              {formatTime(startTime)}
            </Text>
          </Pressable>

          <Pressable
            disabled={!selectedDate || !startTime}
            onPress={onToggleEndPicker}
            style={({ pressed }) => ({
              flex: 1,
              minWidth: 0,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: PROFILE_THEME_COLORS.outlineVariant,
              backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow,
              padding: 16,
              opacity: !selectedDate || !startTime ? 0.45 : pressed ? 0.86 : 1,
            })}
          >
            <Text style={{ fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, color: PROFILE_THEME_COLORS.outline }}>
              Kết thúc
            </Text>
            <Text style={{ fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 32, color: PROFILE_THEME_COLORS.surfaceTint, marginTop: 12, lineHeight: 36 }}>
              {formatTime(endTime)}
            </Text>
          </Pressable>
        </View>

        {duration && !timeError ? (
          <Text style={{ fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 13, color: PROFILE_THEME_COLORS.surfaceTint, marginTop: 10 }}>
            {duration}
          </Text>
        ) : null}
        {timeError ? (
          <Text style={{ fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 13, color: PROFILE_THEME_COLORS.error, marginTop: 10 }}>
            {timeError}
          </Text>
        ) : null}
      </View>

      {showDatePicker ? (
        <View style={{ marginBottom: 14, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: PROFILE_THEME_COLORS.outlineVariant, backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow, alignItems: 'center' }}>
          <View style={pickerHeader}>
            <Pressable onPress={() => setShowDatePicker(false)} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
              <Text style={{ fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 13, color: PROFILE_THEME_COLORS.onSurfaceVariant }}>Hủy</Text>
            </Pressable>
            <Text style={{ fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 13, color: PROFILE_THEME_COLORS.onSurface }}>
              {MONTH_LABELS[draftDate.getMonth()]}
            </Text>
            <Pressable onPress={confirmDraftDate} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
              <Text style={{ fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 13, color: PROFILE_THEME_COLORS.primary }}>Xong</Text>
            </Pressable>
          </View>
          <DateTimePicker
            mode="date"
            display="spinner"
            themeVariant="light"
            value={draftDate}
            minimumDate={new Date()}
            locale="vi-VN"
            style={{ width: '100%', maxWidth: 360, height: 216, backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow }}
            onChange={(_e, d) => {
              if (d) setDraftDate(d)
            }}
          />
        </View>
      ) : null}

      {showStartPicker ? (
        <View style={{ marginBottom: 14, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: PROFILE_THEME_COLORS.outlineVariant, backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest, alignItems: 'center' }}>
          <View style={pickerHeader}>
            <Pressable onPress={onCloseStartPicker} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
              <Text style={{ fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 13, color: PROFILE_THEME_COLORS.onSurfaceVariant }}>Hủy</Text>
            </Pressable>
            <Text style={{ fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 13, color: PROFILE_THEME_COLORS.onSurface }}>Giờ bắt đầu</Text>
            <Pressable onPress={confirmDraftStartTime} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
              <Text style={{ fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 13, color: PROFILE_THEME_COLORS.primary }}>Xong</Text>
            </Pressable>
          </View>
          <DateTimePicker
            mode="time"
            display="spinner"
            themeVariant="light"
            value={draftStartTime}
            is24Hour
            locale="vi-VN"
            style={{ width: '100%', maxWidth: 360, height: 216, backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest }}
            onChange={(_e, d) => {
              if (d) setDraftStartTime(d)
            }}
          />
        </View>
      ) : null}

      {showEndPicker ? (
        <View style={{ marginBottom: 14, borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: PROFILE_THEME_COLORS.outlineVariant, backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest, alignItems: 'center' }}>
          <View style={pickerHeader}>
            <Pressable onPress={onCloseEndPicker} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
              <Text style={{ fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 13, color: PROFILE_THEME_COLORS.onSurfaceVariant }}>Hủy</Text>
            </Pressable>
            <Text style={{ fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 13, color: PROFILE_THEME_COLORS.onSurface }}>Giờ kết thúc</Text>
            <Pressable onPress={confirmDraftEndTime} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
              <Text style={{ fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 13, color: PROFILE_THEME_COLORS.primary }}>Xong</Text>
            </Pressable>
          </View>
          <DateTimePicker
            mode="time"
            display="spinner"
            themeVariant="light"
            value={draftEndTime}
            is24Hour
            locale="vi-VN"
            style={{ width: '100%', maxWidth: 360, height: 216, backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest }}
            onChange={(_e, d) => {
              if (d) setDraftEndTime(d)
            }}
          />
        </View>
      ) : null}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 12,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: PROFILE_THEME_COLORS.outlineVariant,
          backgroundColor: PROFILE_THEME_COLORS.secondaryContainer,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <Info size={18} color={PROFILE_THEME_COLORS.surfaceTint} />
        <Text style={{ flex: 1, fontFamily: 'PlusJakartaSans-Regular', fontSize: 13, lineHeight: 20, color: PROFILE_THEME_COLORS.surfaceTint }}>
          Vui lòng đảm bảo bạn đã liên hệ đặt sân trước khi tạo kèo trên hệ thống.
        </Text>
      </View>

      {canContinue ? (
        <View style={{ marginBottom: 8 }}>
          <AppButton
            label="Tiếp theo"
            onPress={onContinue}
            fullWidth
            variant="primary"
          />
        </View>
      ) : null}
    </ScrollView>
  )
}
