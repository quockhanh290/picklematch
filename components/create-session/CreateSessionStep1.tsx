import { ScreenHeader } from '@/components/design'
import { PROFILE_THEME_COLORS } from '@/components/profile/profileTheme'
import DateTimePicker from '@react-native-community/datetimepicker'
import { LinearGradient } from 'expo-linear-gradient'
import { Calendar, Clock3, CreditCard, Link2, MapPin, Search, ShieldAlert, ShieldCheck, SlidersHorizontal } from 'lucide-react-native'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Keyboard, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'

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
  lockCourtSchedule?: boolean
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

function formatCourtPricePerHour(price: number | null) {
  if (price == null) return null
  if (price >= 1000) return `${Math.round(price / 1000)}K/giờ`
  return `${price.toLocaleString('vi-VN')} VNĐ/giờ`
}

function withAlpha(hex: string, alpha: number) {
  const clean = hex.replace('#', '')
  const fullHex = clean.length === 3 ? clean.split('').map((char) => char + char).join('') : clean
  const value = Number.parseInt(fullHex, 16)
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`
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
        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: PROFILE_THEME_COLORS.secondaryContainer, alignItems: 'center', justifyContent: 'center' }}>
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
            {court.address}{court.city ? ` · ${court.city}` : ''}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
            <View style={{
              borderRadius: 999,
              borderWidth: 1,
              borderColor: isOpen ? PROFILE_THEME_COLORS.outlineVariant : PROFILE_THEME_COLORS.error,
              backgroundColor: isOpen ? PROFILE_THEME_COLORS.secondaryContainer : PROFILE_THEME_COLORS.errorContainer,
              paddingHorizontal: 10,
              paddingVertical: 4,
            }}>
              <Text style={{ fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8, color: isOpen ? PROFILE_THEME_COLORS.surfaceTint : PROFILE_THEME_COLORS.error }}>
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

function SectionDivider({ index, title }: { index: string; title: string }) {
  return (
    <View style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Text style={{ fontFamily: 'PlusJakartaSans-Bold', fontSize: 11, textTransform: 'uppercase', letterSpacing: 2.8, color: PROFILE_THEME_COLORS.outline }}>
        {index} / {title}
      </Text>
      <View style={{ height: 1, flex: 1, backgroundColor: PROFILE_THEME_COLORS.outlineVariant }} />
    </View>
  )
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
  lockCourtSchedule = false,
}: Props) {
  const scrollRef = useRef<ScrollView | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [isChoosingCourt, setIsChoosingCourt] = useState(false)
  const [pickerAnchorY, setPickerAnchorY] = useState(0)
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

  const isCourtScheduleLocked = Boolean(lockCourtSchedule && selectedCourt)
  const showCourtPicker = (!selectedCourt || isChoosingCourt) && !isCourtScheduleLocked
  const selectedCourtDistanceLabel = selectedCourt ? formatDistance(selectedCourt.distance) : null
  const selectedCourtAddress = selectedCourt
    ? `${selectedCourt.address}${selectedCourt.city ? ` · ${selectedCourt.city}` : ''}`
    : ''
  const selectedCourtOpen = selectedCourt ? !!selectedCourt.hasSlots : false
  const selectedCourtPriceLabel = selectedCourt ? formatCourtPricePerHour(selectedCourt.price_per_hour) : null
  const selectedCourtOpenHoursLabel = selectedCourt && (selectedCourt.hours_open || selectedCourt.hours_close)
    ? `${selectedCourt.hours_open ?? '06:00'} - ${selectedCourt.hours_close ?? '22:00'}`
    : null
  const selectedCourtAmenities = selectedCourt
    ? [
      selectedCourt.booking_url ? 'Đặt sân online' : null,
      selectedCourt.google_maps_url ? 'Google Maps' : null,
    ].filter((item): item is string => item !== null)
    : []
  const selectedCourtDetailRowsRaw = [
    selectedCourtPriceLabel ? { icon: CreditCard, label: 'Giá sân', value: selectedCourtPriceLabel } : null,
    selectedCourtOpenHoursLabel ? { icon: Clock3, label: 'Giờ mở cửa', value: selectedCourtOpenHoursLabel } : null,
    selectedCourtAmenities.length > 0 ? { icon: Link2, label: 'Tiện ích', value: selectedCourtAmenities.join(' · ') } : null,
  ].filter((item): item is { icon: any; label: string; value: string } => item !== null)
  const mockCourtDetailRows = selectedCourt
    ? [
      { icon: CreditCard, label: 'Giá sân', value: '120K/giờ' },
      { icon: Clock3, label: 'Giờ mở cửa', value: '05:30 - 23:00' },
      { icon: Link2, label: 'Tiện ích', value: 'Đặt sân online · Đỗ xe · Nhà tắm · Nước uống' },
    ]
    : []
  const selectedCourtDetailRows =
    selectedCourtDetailRowsRaw.length > 0
      ? selectedCourtDetailRowsRaw
      : (__DEV__ ? mockCourtDetailRows : [])

  const durationHours = startTime && endTime
    ? (() => {
        const h = (endTime.getTime() - startTime.getTime()) / 3600000
        return Number.isInteger(h) ? `${h}` : h.toFixed(1)
      })()
    : null

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

  useEffect(() => {
    if (!(showDatePicker || showStartPicker || showEndPicker)) return
    const timer = setTimeout(() => {
      scrollRef.current?.scrollTo({ y: Math.max(0, pickerAnchorY - 12), animated: true })
    }, 60)
    return () => clearTimeout(timer)
  }, [pickerAnchorY, showDatePicker, showEndPicker, showStartPicker])

  function openDatePicker() {
    if (!selectedCourt || isCourtScheduleLocked) return
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
    <View style={{ flex: 1 }}>
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
        keyboardShouldPersistTaps="handled"
        style={{ flex: 1 }}
        scrollEnabled={!(showStartPicker || showEndPicker || showDatePicker)}
      >
        <View style={{ backgroundColor: 'transparent', paddingTop: 12 }}>
          <ScreenHeader
            variant="brand"
            title="KINETIC"
            onBackPress={onBack}
            style={{ marginHorizontal: -20, marginTop: -12 }}
            rightSlot={
              <View style={{ width: 32, height: 32, borderRadius: 999, backgroundColor: PROFILE_THEME_COLORS.primaryContainer, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: PROFILE_THEME_COLORS.outlineVariant }}>
                <Text style={{ fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 11, color: PROFILE_THEME_COLORS.surfaceTint }}>QK</Text>
              </View>
            }
          />

          {/* Progress bar */}
          <View style={{ height: 3, backgroundColor: '#E5E3DC', borderRadius: 999, marginTop: 12, marginBottom: 16, overflow: 'hidden' }}>
            <View style={{ height: '100%', width: '33%', backgroundColor: '#0F6E56', borderRadius: 999 }} />
          </View>

          {/* Step title */}
          <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 6 }}>
              <Text style={{ fontFamily: 'BarlowCondensed-BoldItalic', fontSize: 52, color: '#0F6E56', lineHeight: 44, opacity: 0.2, letterSpacing: -1 }}>
                01
              </Text>
              <Text
                style={{ fontFamily: 'BarlowCondensed-BoldItalic', fontSize: 28, color: '#0F6E56', lineHeight: 30, letterSpacing: -0.3, flex: 1, paddingBottom: 2 }}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                Chọn Sân & Ngày giờ
              </Text>
            </View>
            <View style={{ width: 32, height: 3, backgroundColor: '#5DCAA5', borderRadius: 2 }} />
          </View>

          <SectionDivider index="01" title="Chọn sân" />

          {/* Search bar */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 999, borderWidth: 0.5, borderColor: '#E5E3DC', backgroundColor: 'white', paddingHorizontal: 14, paddingVertical: 10 }}>
            <Search size={16} color={PROFILE_THEME_COLORS.outline} />
            <TextInput
              value={keyword}
              editable={!isCourtScheduleLocked}
              onFocus={() => {
                if (isCourtScheduleLocked) return
                setIsChoosingCourt(true)
              }}
              onChangeText={(value) => {
                if (isCourtScheduleLocked) return
                setKeyword(value)
                setIsChoosingCourt(true)
              }}
              placeholder="Tìm tên sân hoặc khu vực..."
              placeholderTextColor="#B4B2A9"
              style={{ flex: 1, fontFamily: 'PlusJakartaSans-Regular', fontSize: 13, color: PROFILE_THEME_COLORS.onSurface, padding: 0 }}
              returnKeyType="search"
            />
            <View style={{ width: 34, height: 34, borderRadius: 999, backgroundColor: '#0F6E56', alignItems: 'center', justifyContent: 'center', opacity: isCourtScheduleLocked ? 0.45 : 1 }}>
              <SlidersHorizontal size={14} color="white" strokeWidth={2.6} />
            </View>
          </View>
        </View>

        <View style={{ marginTop: 16, marginBottom: 24 }}>
          {selectedCourt ? (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <Text style={{ fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 15, color: PROFILE_THEME_COLORS.onSurface }}>Sân đã chọn</Text>
                {isCourtScheduleLocked ? (
                  <Text style={{ fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 12, color: PROFILE_THEME_COLORS.outline }}>Đã khóa vì đã đặt sân</Text>
                ) : (
                  <Pressable
                    onPress={() => {
                      if (showCourtPicker) {
                        setIsChoosingCourt(false)
                        return
                      }
                      onChangeCourt()
                      setIsChoosingCourt(true)
                    }}
                    style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                  >
                    <Text style={{ fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 13, color: PROFILE_THEME_COLORS.primary }}>
                      {showCourtPicker ? 'Đóng chọn sân' : 'Đổi sân'}
                    </Text>
                  </Pressable>
                )}
              </View>

              <View style={{ borderRadius: 30, overflow: 'hidden', shadowColor: PROFILE_THEME_COLORS.onBackground, shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 7 }, elevation: 3, backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest }}>
                <LinearGradient
                  colors={[PROFILE_THEME_COLORS.primary, PROFILE_THEME_COLORS.surfaceTint]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
                />
                <MapPin size={120} color="rgba(255,255,255,0.12)" style={{ position: 'absolute', right: -18, bottom: -16 }} />

                <View style={{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                    <Text
                      numberOfLines={2}
                      adjustsFontSizeToFit
                      minimumFontScale={0.7}
                      style={{ flex: 1, color: PROFILE_THEME_COLORS.onPrimary, fontFamily: 'PlusJakartaSans-ExtraBoldItalic', fontSize: 36, lineHeight: 41, letterSpacing: 0.8, textTransform: 'uppercase' }}
                    >
                      {selectedCourt.name}
                    </Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: withAlpha(PROFILE_THEME_COLORS.onPrimary, 0.14) }}>
                      {selectedCourtOpen
                        ? <ShieldCheck size={12} color={withAlpha(PROFILE_THEME_COLORS.onPrimary, 0.84)} strokeWidth={2.5} />
                        : <ShieldAlert size={12} color={withAlpha(PROFILE_THEME_COLORS.onPrimary, 0.84)} strokeWidth={2.5} />}
                      <Text style={{ marginLeft: 6, color: withAlpha(PROFILE_THEME_COLORS.onPrimary, 0.9), fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 12 }}>
                        {selectedCourtOpen ? 'Đang mở' : 'Tạm đóng'}
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: withAlpha(PROFILE_THEME_COLORS.onPrimary, 0.14), maxWidth: '100%' }}>
                      <MapPin size={12} color={withAlpha(PROFILE_THEME_COLORS.onPrimary, 0.84)} strokeWidth={2.5} />
                      <Text numberOfLines={1} style={{ marginLeft: 6, color: withAlpha(PROFILE_THEME_COLORS.onPrimary, 0.9), fontFamily: 'PlusJakartaSans-Regular', fontSize: 15, lineHeight: 20, letterSpacing: 0.2, flexShrink: 1 }}>
                        {selectedCourtAddress}
                      </Text>
                    </View>
                    {selectedCourtDistanceLabel ? (
                      <View style={{ borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: withAlpha(PROFILE_THEME_COLORS.onPrimary, 0.14) }}>
                        <Text style={{ color: withAlpha(PROFILE_THEME_COLORS.onPrimary, 0.9), fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 13 }}>
                          {selectedCourtDistanceLabel}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {/* Price row */}
                  <View style={{ marginTop: 12, paddingTop: 10, borderTopWidth: 0.5, borderTopColor: 'rgba(255,255,255,0.2)', flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>💳 Giá sân</Text>
                    <Text style={{ marginLeft: 'auto', fontFamily: 'BarlowCondensed-Bold', fontSize: 16, color: 'white', fontWeight: '700' }}>
                      {selectedCourtPriceLabel ?? '—'}
                    </Text>
                  </View>
                </View>

                {selectedCourtDetailRows.length > 0 ? (
                  <View style={{ borderTopWidth: 1, borderTopColor: PROFILE_THEME_COLORS.outlineVariant, backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest, paddingHorizontal: 14, paddingVertical: 12 }}>
                    {selectedCourtDetailRows.map((row, index) => (
                      <View key={row.label}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <View style={{ width: 36, height: 36, borderRadius: 999, backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow, alignItems: 'center', justifyContent: 'center' }}>
                            <row.icon size={16} color={PROFILE_THEME_COLORS.primary} strokeWidth={2.4} />
                          </View>
                          <View style={{ marginLeft: 12, flex: 1 }}>
                            <Text style={{ fontSize: 10, fontFamily: 'PlusJakartaSans-ExtraBold', textTransform: 'uppercase', letterSpacing: 1.6, color: PROFILE_THEME_COLORS.outline }}>
                              {row.label}
                            </Text>
                            <Text style={{ marginTop: 2, fontSize: 13, fontFamily: 'PlusJakartaSans-SemiBold', color: PROFILE_THEME_COLORS.onSurface, lineHeight: 19 }}>
                              {row.value}
                            </Text>
                          </View>
                        </View>
                        {index < selectedCourtDetailRows.length - 1 ? (
                          <View style={{ height: 1, backgroundColor: PROFILE_THEME_COLORS.outlineVariant, marginVertical: 10 }} />
                        ) : null}
                      </View>
                    ))}
                  </View>
                ) : null}
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
                <View style={{ alignItems: 'center', justifyContent: 'center', borderRadius: 20, borderWidth: 1.5, borderStyle: 'dashed', borderColor: PROFILE_THEME_COLORS.outlineVariant, backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow, paddingVertical: 32, paddingHorizontal: 16 }}>
                  <Text style={{ fontFamily: 'PlusJakartaSans-Regular', fontSize: 13, lineHeight: 20, color: PROFILE_THEME_COLORS.onSurfaceVariant, textAlign: 'center' }}>
                    {fallbackMode ? 'Nhập tên sân để tìm kiếm' : 'Không tìm thấy sân nào'}
                  </Text>
                </View>
              )}
            </View>
          ) : null}
        </View>

        <SectionDivider index="02" title="Chọn ngày giờ chơi" />

        <View style={[sectionCard, { opacity: selectedCourt ? 1 : 0.5 }]}>
          <Pressable
            disabled={!selectedCourt || isCourtScheduleLocked}
            onPress={openDatePicker}
            style={({ pressed }) => ({
              borderRadius: 20,
              borderWidth: 1,
              borderColor: PROFILE_THEME_COLORS.outlineVariant,
              backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow,
              padding: 16,
              opacity: !selectedCourt || isCourtScheduleLocked ? 0.55 : pressed ? 0.86 : 1,
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
                      disabled={isCourtScheduleLocked}
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
                        opacity: isCourtScheduleLocked ? 0.55 : pressed ? 0.85 : 1,
                      })}
                    >
                      <Text style={{ fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 11, textTransform: 'uppercase', color: active ? PROFILE_THEME_COLORS.primary : weekend ? PROFILE_THEME_COLORS.error : PROFILE_THEME_COLORS.outline }}>
                        {WEEKDAY_LABELS[day.getDay()]}
                      </Text>
                      <View style={{ marginTop: 4, width: 30, height: 30, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: active ? PROFILE_THEME_COLORS.primary : 'transparent' }}>
                        <Text style={{ fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 18, lineHeight: 20, color: active ? PROFILE_THEME_COLORS.onPrimary : weekend ? PROFILE_THEME_COLORS.error : PROFILE_THEME_COLORS.onSurface }}>
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
              disabled={!selectedCourt || isCourtScheduleLocked}
              onPress={onToggleStartPicker}
              style={({ pressed }) => ({
                flex: 1, minWidth: 0, borderRadius: 20, borderWidth: 1,
                borderColor: PROFILE_THEME_COLORS.outlineVariant,
                backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow,
                padding: 16,
                opacity: !selectedCourt || isCourtScheduleLocked ? 0.55 : pressed ? 0.86 : 1,
              })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 28, height: 28, borderRadius: 999, backgroundColor: PROFILE_THEME_COLORS.secondaryContainer, alignItems: 'center', justifyContent: 'center' }}>
                  <Clock3 size={14} color={PROFILE_THEME_COLORS.surfaceTint} strokeWidth={2.6} />
                </View>
                <Text style={{ fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, color: PROFILE_THEME_COLORS.outline }}>Bắt đầu</Text>
              </View>
              <Text style={{ fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 32, color: PROFILE_THEME_COLORS.surfaceTint, marginTop: 12, lineHeight: 36 }}>
                {formatTime(startTime)}
              </Text>
            </Pressable>

            <Pressable
              disabled={!selectedDate || !startTime || isCourtScheduleLocked}
              onPress={onToggleEndPicker}
              style={({ pressed }) => ({
                flex: 1, minWidth: 0, borderRadius: 20, borderWidth: 1,
                borderColor: PROFILE_THEME_COLORS.outlineVariant,
                backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow,
                padding: 16,
                opacity: !selectedDate || !startTime || isCourtScheduleLocked ? 0.45 : pressed ? 0.86 : 1,
              })}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 28, height: 28, borderRadius: 999, backgroundColor: PROFILE_THEME_COLORS.secondaryContainer, alignItems: 'center', justifyContent: 'center' }}>
                  <Clock3 size={14} color={PROFILE_THEME_COLORS.surfaceTint} strokeWidth={2.6} />
                </View>
                <Text style={{ fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.2, color: PROFILE_THEME_COLORS.outline }}>Kết thúc</Text>
              </View>
              <Text style={{ fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 32, color: PROFILE_THEME_COLORS.surfaceTint, marginTop: 12, lineHeight: 36 }}>
                {formatTime(endTime)}
              </Text>
            </Pressable>
          </View>

          {/* Duration chip */}
          {durationHours ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, paddingHorizontal: 4 }}>
              <Text style={{ fontSize: 11, color: '#7A8884' }}>Thời lượng:</Text>
              <View style={{ backgroundColor: '#E1F5EE', paddingHorizontal: 12, paddingVertical: 3, borderRadius: 999 }}>
                <Text style={{ fontSize: 11, color: '#0F6E56', fontWeight: '600' }}>{durationHours} tiếng</Text>
              </View>
            </View>
          ) : null}

          {timeError ? (
            <Text style={{ fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 13, color: PROFILE_THEME_COLORS.error, marginTop: 10 }}>
              {timeError}
            </Text>
          ) : null}
          {isCourtScheduleLocked ? (
            <Text style={{ fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 12, color: PROFILE_THEME_COLORS.outline, marginTop: 8 }}>
              Kèo đã đặt sân nên không thể đổi sân và ngày giờ.
            </Text>
          ) : null}
        </View>

        <View onLayout={(event) => { setPickerAnchorY(event.nativeEvent.layout.y) }} />

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
              onChange={(_e, d) => { if (d) setDraftDate(d) }}
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
              onChange={(_e, d) => { if (d) setDraftStartTime(d) }}
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
              onChange={(_e, d) => { if (d) setDraftEndTime(d) }}
            />
          </View>
        ) : null}

        {/* Info note */}
        <View style={{ backgroundColor: '#E1F5EE', borderRadius: 10, padding: 12, flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          <Text style={{ fontSize: 14 }}>ℹ️</Text>
          <Text style={{ fontSize: 12, color: '#0F6E56', lineHeight: 18, flex: 1 }}>
            Vui lòng đảm bảo bạn đã liên hệ đặt sân trước khi tạo kèo trên hệ thống.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom bar */}
      <View style={{ flexDirection: 'row', gap: 10, marginHorizontal: -20, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 28, backgroundColor: '#F2F0E8', borderTopWidth: 0.5, borderTopColor: '#E5E3DC' }}>
        <TouchableOpacity
          onPress={onBack}
          style={{ flex: 1, borderRadius: 999, borderWidth: 1.5, borderColor: '#E5E3DC', paddingVertical: 13, alignItems: 'center', backgroundColor: 'white' }}
        >
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#1A2E2A', fontFamily: 'PlusJakartaSans-Bold' }}>Quay lại</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onContinue}
          style={{ flex: 2, borderRadius: 999, backgroundColor: '#0F6E56', paddingVertical: 13, alignItems: 'center' }}
        >
          <Text style={{ fontSize: 14, fontWeight: '700', color: 'white', fontFamily: 'PlusJakartaSans-Bold' }}>Tiếp tục →</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
