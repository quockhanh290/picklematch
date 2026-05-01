import { ScreenHeader } from '@/components/design'
import { PROFILE_THEME_COLORS } from '@/constants/profileTheme'
import { SCREEN_FONTS } from '@/constants/typography'
import DateTimePicker from '@react-native-community/datetimepicker'
import { Search, SlidersHorizontal } from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Keyboard, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'

import type { NearByCourt } from '@/lib/useNearbyCourts'
import { RADIUS, SPACING, BORDER } from '@/constants/screenLayout'
import { CourtRow } from './CourtRow'
import { SectionDivider } from './SectionDivider'
import { SelectedCourtCard } from './SelectedCourtCard'
import { DateStripPicker } from './DateStripPicker'
import { TimeRangePicker } from './TimeRangePicker'

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
  hideHeader?: boolean
}

const MONTH_LABELS = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12']

function startOfDay(date: Date) {
  const next = new Date(date)
  next.setHours(0, 0, 0, 0)
  return next
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
  hideHeader = false,
}: Props) {
  const scrollRef = useRef<ScrollView | null>(null)
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [isChoosingCourt, setIsChoosingCourt] = useState(false)
  const [pickerAnchorY, setPickerAnchorY] = useState(0)
  const [draftDate, setDraftDate] = useState(selectedDate ?? new Date())
  const [draftStartTime, setDraftStartTime] = useState(startTime ?? defaultPickerValue('start'))
  const [draftEndTime, setDraftEndTime] = useState(endTime ?? defaultPickerValue('end'))

  const isCourtScheduleLocked = Boolean(lockCourtSchedule && selectedCourt)
  const showCourtPicker = (!selectedCourt || isChoosingCourt) && !isCourtScheduleLocked

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
        <View style={{ backgroundColor: 'transparent', paddingTop: hideHeader ? 0 : 12 }}>
          {!hideHeader && (
            <>
              <ScreenHeader
                variant="brand"
                title="KINETIC"
                onBackPress={onBack}
                style={{ marginHorizontal: -20, marginTop: -12 }}
                rightSlot={
                  <View style={{ width: 32, height: 32, borderRadius: RADIUS.full, backgroundColor: PROFILE_THEME_COLORS.primaryContainer, alignItems: 'center', justifyContent: 'center', borderWidth: BORDER.base, borderColor: PROFILE_THEME_COLORS.outlineVariant }}>
                    <Text style={{ fontFamily: SCREEN_FONTS.headline, fontSize: 11, color: PROFILE_THEME_COLORS.surfaceTint }}>QK</Text>
                  </View>
                }
              />

              {/* Progress bar */}
              <View style={{ height: 3, backgroundColor: PROFILE_THEME_COLORS.outlineVariant, borderRadius: RADIUS.full, marginTop: 12, marginBottom: 24, overflow: 'hidden' }}>
                <View style={{ height: '100%', width: '33%', backgroundColor: PROFILE_THEME_COLORS.primary, borderRadius: RADIUS.full }} />
              </View>
            </>
          )}

          {/* Step title */}
          <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginBottom: 6 }}>
              <Text style={{ fontFamily: SCREEN_FONTS.headlineItalic, fontSize: 52, color: PROFILE_THEME_COLORS.primary, lineHeight: 54, opacity: 0.2, letterSpacing: -1, paddingRight: 6, paddingTop: 6 }}>
                01
              </Text>
              <Text
                style={{ fontFamily: SCREEN_FONTS.headlineItalic, fontSize: 28, color: PROFILE_THEME_COLORS.primary, lineHeight: 30, letterSpacing: -0.3, flex: 1, paddingBottom: 2 }}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                Chọn Sân & Ngày giờ
              </Text>
            </View>
            <View style={{ width: 32, height: 3, backgroundColor: PROFILE_THEME_COLORS.tertiary, borderRadius: 2 }} />
          </View>

          <SectionDivider index="01" title="Chọn sân" />

          {/* Search bar */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: RADIUS.lg, borderWidth: BORDER.hairline, borderColor: PROFILE_THEME_COLORS.outlineVariant, backgroundColor: PROFILE_THEME_COLORS.surface, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm }}>
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
              placeholderTextColor={PROFILE_THEME_COLORS.outline}
              style={{ flex: 1, fontFamily: SCREEN_FONTS.body, fontSize: 13, color: PROFILE_THEME_COLORS.onSurface, padding: 0 }}
              returnKeyType="search"
            />
            <View style={{ width: 34, height: 34, borderRadius: RADIUS.full, backgroundColor: PROFILE_THEME_COLORS.primary, alignItems: 'center', justifyContent: 'center', opacity: isCourtScheduleLocked ? 0.45 : 1 }}>
              <SlidersHorizontal size={14} color="white" strokeWidth={2.6} />
            </View>
          </View>
        </View>

        <View style={{ marginTop: 16, marginBottom: 24 }}>
          {selectedCourt ? (
            <SelectedCourtCard
              selectedCourt={selectedCourt}
              isCourtScheduleLocked={isCourtScheduleLocked}
              showCourtPicker={showCourtPicker}
              setIsChoosingCourt={setIsChoosingCourt}
              onChangeCourt={onChangeCourt}
            />
          ) : (
            <Text style={{ fontFamily: SCREEN_FONTS.headline, fontSize: 15, color: PROFILE_THEME_COLORS.onSurface, marginBottom: 12 }}>Gợi ý sân</Text>
          )}

          {showCourtPicker ? (
            <View style={{ gap: 10, marginTop: selectedCourt ? 14 : 0 }}>
              {loadingCourts ? (
                <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 32 }}>
                  <ActivityIndicator color={PROFILE_THEME_COLORS.primary} />
                  <Text style={{ fontFamily: SCREEN_FONTS.body, fontSize: 13, color: PROFILE_THEME_COLORS.onSurfaceVariant, marginTop: 12 }}>
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
                <View style={{ alignItems: 'center', justifyContent: 'center', borderRadius: RADIUS.lg, borderWidth: BORDER.medium, borderStyle: 'dashed', borderColor: PROFILE_THEME_COLORS.outlineVariant, backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow, paddingVertical: 32, paddingHorizontal: 16 }}>
                  <Text style={{ fontFamily: SCREEN_FONTS.body, fontSize: 13, lineHeight: 20, color: PROFILE_THEME_COLORS.onSurfaceVariant, textAlign: 'center' }}>
                    {fallbackMode ? 'Nhập tên sân để tìm kiếm' : 'Không tìm thấy sân nào'}
                  </Text>
                </View>
              )}
            </View>
          ) : null}
        </View>

        <SectionDivider index="02" title="Chọn ngày giờ chơi" />

        <View style={{
          borderRadius: RADIUS.xl,
          borderWidth: BORDER.base,
          borderColor: PROFILE_THEME_COLORS.outlineVariant,
          backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest,
          padding: SPACING.lg,
          marginBottom: 18,
          opacity: selectedCourt ? 1 : 0.5
        }}>
          <DateStripPicker
            selectedDate={selectedDate}
            isCourtScheduleLocked={isCourtScheduleLocked}
            onDateSelect={onDateSelect}
            openDatePicker={openDatePicker}
            selectedCourt={selectedCourt}
          />

          {selectedCourt && <View style={{ height: 1, backgroundColor: PROFILE_THEME_COLORS.outlineVariant, marginVertical: 12 }} />}

          {selectedDate && (
            <TimeRangePicker
              startTime={startTime}
              endTime={endTime}
              onToggleStartPicker={onToggleStartPicker}
              onToggleEndPicker={onToggleEndPicker}
              selectedCourt={selectedCourt}
              selectedDate={selectedDate}
              isCourtScheduleLocked={isCourtScheduleLocked}
              timeError={timeError}
            />
          )}

          {isCourtScheduleLocked && (
            <Text style={{ fontFamily: SCREEN_FONTS.label, fontSize: 12, color: PROFILE_THEME_COLORS.outline, marginTop: 8 }}>
              Kèo đã đặt sân nên không thể đổi sân và ngày giờ.
            </Text>
          )}
        </View>

        <View onLayout={(event) => { setPickerAnchorY(event.nativeEvent.layout.y) }} />

        {showDatePicker && (
          <View style={{ marginBottom: 14, borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: BORDER.base, borderColor: PROFILE_THEME_COLORS.outlineVariant, backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow, alignItems: 'center' }}>
            <View style={pickerHeader}>
              <Pressable onPress={() => setShowDatePicker(false)} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                <Text style={{ fontFamily: SCREEN_FONTS.headline, fontSize: 18, color: PROFILE_THEME_COLORS.onSurfaceVariant }}>Hủy</Text>
              </Pressable>
              <Text style={{ fontFamily: SCREEN_FONTS.headline, fontSize: 18, color: PROFILE_THEME_COLORS.onSurface }}>
                {MONTH_LABELS[draftDate.getMonth()]}
              </Text>
              <Pressable onPress={confirmDraftDate} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                <Text style={{ fontFamily: SCREEN_FONTS.headline, fontSize: 18, color: PROFILE_THEME_COLORS.primary }}>Xong</Text>
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
        )}

        {showStartPicker && (
          <View style={{ marginBottom: 14, borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: BORDER.base, borderColor: PROFILE_THEME_COLORS.outlineVariant, backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest, alignItems: 'center' }}>
            <View style={pickerHeader}>
              <Pressable onPress={onCloseStartPicker} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                <Text style={{ fontFamily: SCREEN_FONTS.headline, fontSize: 18, color: PROFILE_THEME_COLORS.onSurfaceVariant }}>Hủy</Text>
              </Pressable>
              <Text style={{ fontFamily: SCREEN_FONTS.headline, fontSize: 18, color: PROFILE_THEME_COLORS.onSurface }}>Giờ bắt đầu</Text>
              <Pressable onPress={confirmDraftStartTime} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                <Text style={{ fontFamily: SCREEN_FONTS.headline, fontSize: 18, color: PROFILE_THEME_COLORS.primary }}>Xong</Text>
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
        )}

        {showEndPicker && (
          <View style={{ marginBottom: 14, borderRadius: RADIUS.xl, overflow: 'hidden', borderWidth: BORDER.base, borderColor: PROFILE_THEME_COLORS.outlineVariant, backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest, alignItems: 'center' }}>
            <View style={pickerHeader}>
              <Pressable onPress={onCloseEndPicker} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                <Text style={{ fontFamily: SCREEN_FONTS.headline, fontSize: 18, color: PROFILE_THEME_COLORS.onSurfaceVariant }}>Hủy</Text>
              </Pressable>
              <Text style={{ fontFamily: SCREEN_FONTS.headline, fontSize: 18, color: PROFILE_THEME_COLORS.onSurface }}>Giờ kết thúc</Text>
              <Pressable onPress={confirmDraftEndTime} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
                <Text style={{ fontFamily: SCREEN_FONTS.headline, fontSize: 18, color: PROFILE_THEME_COLORS.primary }}>Xong</Text>
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
        )}

        {/* Info note */}
        <View style={{ backgroundColor: PROFILE_THEME_COLORS.secondaryContainer, borderRadius: RADIUS.sm, padding: 12, flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          <Text style={{ fontSize: 14 }}>ℹ️</Text>
          <Text style={{ fontSize: 12, color: PROFILE_THEME_COLORS.primary, lineHeight: 18, flex: 1, fontFamily: SCREEN_FONTS.body }}>
            Vui lòng đảm bảo bạn đã liên hệ đặt sân trước khi tạo kèo trên hệ thống.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom bar */}
      <View style={{ flexDirection: 'row', gap: 10, marginHorizontal: -20, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 28, backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow, borderTopWidth: 0.5, borderTopColor: PROFILE_THEME_COLORS.outlineVariant }}>
        <TouchableOpacity
          onPress={onBack}
          style={{ flex: 1, borderRadius: RADIUS.md, borderWidth: BORDER.medium, borderColor: PROFILE_THEME_COLORS.outlineVariant, paddingVertical: 13, alignItems: 'center', backgroundColor: PROFILE_THEME_COLORS.surface }}
        >
          <Text style={{ fontSize: 15, fontWeight: '700', color: PROFILE_THEME_COLORS.onSurface, fontFamily: SCREEN_FONTS.cta, textTransform: 'uppercase' }}>Quay lại</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onContinue}
          style={{ flex: 2, borderRadius: RADIUS.md, backgroundColor: PROFILE_THEME_COLORS.primary, paddingVertical: 13, alignItems: 'center' }}
        >
          <Text style={{ fontSize: 15, fontWeight: '700', color: PROFILE_THEME_COLORS.onPrimary, fontFamily: SCREEN_FONTS.cta, textTransform: 'uppercase' }}>Tiếp tục →</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
