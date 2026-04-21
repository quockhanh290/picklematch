import { PROFILE_THEME_COLORS } from '@/components/profile/profileTheme'
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'
import Slider from '@react-native-community/slider'
import React, { useState } from 'react'
import { Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native'

export type AdvancedFilter = {
  district: string | null
  date: string
  weekend: boolean
  timeSlot: string | null
  skillLevel: string | null
  priceMin: number | undefined
  priceMax: number | undefined
  bookingStatus: 'confirmed' | 'unconfirmed' | undefined
  slotsLeft: number | undefined
}

export const ADVANCED_FILTER_INITIAL: AdvancedFilter = {
  district: null,
  date: '',
  weekend: false,
  timeSlot: null,
  skillLevel: null,
  priceMin: undefined,
  priceMax: undefined,
  bookingStatus: undefined,
  slotsLeft: undefined,
}

type Props = {
  visible: boolean
  onClose: () => void
  filter: AdvancedFilter
  setFilter: React.Dispatch<React.SetStateAction<AdvancedFilter>>
  onApply: () => void
  onReset: () => void
  districts?: string[]
  skillLevels?: { id: string; label: string }[]
}

const PRICE_SLIDER_MAX = 300

function chipStyle(active: boolean) {
  return {
    backgroundColor: active ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.surfaceContainerLow,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 8,
  }
}

function chipTextStyle(active: boolean) {
  return {
    color: active ? PROFILE_THEME_COLORS.onPrimary : PROFILE_THEME_COLORS.onSurfaceVariant,
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 13,
  }
}

const sectionLabel = {
  fontFamily: 'PlusJakartaSans-SemiBold',
  fontSize: 13,
  color: PROFILE_THEME_COLORS.onSurface,
  marginBottom: 8,
} as const

const BOOKING_OPTIONS: { value: 'confirmed' | 'unconfirmed'; label: string }[] = [
  { value: 'confirmed', label: 'Đã đặt sân' },
  { value: 'unconfirmed', label: 'Chưa đặt sân' },
]

function fmtDate(d: Date): string {
  const pad = (v: number) => v.toString().padStart(2, '0')
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
}

function addDays(n: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return d
}

function buildDateChips(): { label: string; value: string }[] {
  const today = new Date()
  const dayOfWeek = today.getDay() // 0=Sun, 6=Sat
  const daysToSat = ((6 - dayOfWeek) + 7) % 7
  const daysToSun = (7 - dayOfWeek) % 7

  const chips: { label: string; value: string }[] = [
    { label: 'Hôm nay', value: fmtDate(today) },
    { label: 'Ngày mai', value: fmtDate(addDays(1)) },
  ]
  if (daysToSat >= 2) chips.push({ label: 'Thứ 7', value: fmtDate(addDays(daysToSat)) })
  if (daysToSun >= 2) chips.push({ label: 'Chủ nhật', value: fmtDate(addDays(daysToSun)) })
  return chips
}

function parseDateStr(s: string): Date {
  const [d, m, y] = s.split('/')
  return new Date(Number(y), Number(m) - 1, Number(d))
}

export function AdvancedSessionFilterModal({
  visible,
  onClose,
  filter,
  setFilter,
  onApply,
  onReset,
  districts = [],
  skillLevels = [],
}: Props) {
  const [showDatePicker, setShowDatePicker] = useState(false)

  const dateChips = React.useMemo(() => buildDateChips(), [])
  const isQuickDate = dateChips.some((c) => c.value === filter.date)
  const hasCustomDate = !!filter.date && !isQuickDate

  const pickerDate = React.useMemo(
    () => (filter.date && /^\d{2}\/\d{2}\/\d{4}$/.test(filter.date) ? parseDateStr(filter.date) : new Date()),
    [filter.date],
  )

  const priceMin = filter.priceMin ?? 0
  const priceMax = filter.priceMax ?? PRICE_SLIDER_MAX
  const priceInvalid =
    typeof filter.priceMin === 'number' &&
    typeof filter.priceMax === 'number' &&
    filter.priceMin > filter.priceMax

  const priceMinLabel = priceMin === 0 ? 'Bất kỳ' : `${priceMin}k`
  const priceMaxLabel = priceMax >= PRICE_SLIDER_MAX ? `${PRICE_SLIDER_MAX}k+` : `${priceMax}k`

  function handleDateChange(event: DateTimePickerEvent, selected?: Date) {
    if (Platform.OS === 'android') setShowDatePicker(false)
    if (event.type === 'dismissed') return
    if (selected) {
      setFilter((f) => ({ ...f, date: fmtDate(selected), weekend: false }))
    }
  }

  function selectQuickDate(value: string) {
    setShowDatePicker(false)
    setFilter((f) => ({ ...f, date: f.date === value ? '' : value, weekend: false }))
  }

  function toggleWeekend() {
    setShowDatePicker(false)
    setFilter((f) => ({ ...f, weekend: !f.weekend, date: '' }))
  }

  function openDatePicker() {
    setFilter((f) => ({ ...f, weekend: false }))
    setShowDatePicker((v) => !v)
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.18)', justifyContent: 'flex-end' }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View
          style={{
            backgroundColor: PROFILE_THEME_COLORS.background,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            padding: 24,
            maxHeight: '92%',
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <Text style={{ fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 18, color: PROFILE_THEME_COLORS.onBackground }}>
              Bộ lọc nâng cao
            </Text>
            <Pressable onPress={onClose} hitSlop={12}>
              <Text style={{ color: PROFILE_THEME_COLORS.primary, fontFamily: 'PlusJakartaSans-ExtraBold' }}>Đóng</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* District */}
            {districts.length > 0 && (
              <>
                <Text style={sectionLabel}>Quận/Huyện</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                  {districts.map((d) => (
                    <Pressable
                      key={d}
                      onPress={() => setFilter((f) => ({ ...f, district: f.district === d ? null : d }))}
                      style={chipStyle(filter.district === d)}
                    >
                      <Text style={chipTextStyle(filter.district === d)}>{d}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </>
            )}

            {/* Date chips */}
            <Text style={sectionLabel}>Ngày</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 12 }}
              contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingRight: 8 }}
            >
              {dateChips.map((chip) => (
                <Pressable
                  key={chip.value}
                  onPress={() => selectQuickDate(chip.value)}
                  style={chipStyle(filter.date === chip.value)}
                >
                  <Text style={chipTextStyle(filter.date === chip.value)}>{chip.label}</Text>
                </Pressable>
              ))}
              <Pressable onPress={toggleWeekend} style={chipStyle(filter.weekend)}>
                <Text style={chipTextStyle(filter.weekend)}>Cuối tuần</Text>
              </Pressable>
              <Pressable onPress={openDatePicker} style={chipStyle(hasCustomDate || showDatePicker)}>
                <Text style={chipTextStyle(hasCustomDate || showDatePicker)}>
                  {hasCustomDate ? filter.date.slice(0, 5) : 'Chọn ngày'}
                </Text>
              </Pressable>
            </ScrollView>

            {/* Date picker */}
            {showDatePicker && (
              <View style={{ marginBottom: 12, alignItems: 'center' }}>
                <DateTimePicker
                  value={pickerDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  minimumDate={new Date()}
                  onChange={handleDateChange}
                  style={{ width: '100%', maxWidth: 360 }}
                  accentColor={PROFILE_THEME_COLORS.primary}
                />
              </View>
            )}

            {/* Time slot */}
            <Text style={sectionLabel}>Khung giờ</Text>
            <View style={{ flexDirection: 'row', marginBottom: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              {['Sáng', 'Chiều', 'Tối'].map((slot) => (
                <Pressable
                  key={slot}
                  onPress={() => setFilter((f) => ({ ...f, timeSlot: f.timeSlot === slot ? null : slot }))}
                  style={chipStyle(filter.timeSlot === slot)}
                >
                  <Text style={chipTextStyle(filter.timeSlot === slot)}>{slot}</Text>
                </Pressable>
              ))}
            </View>

            {/* Skill level */}
            <Text style={sectionLabel}>Trình độ</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {skillLevels.map((level) => (
                <Pressable
                  key={level.id}
                  onPress={() =>
                    setFilter((f) => ({ ...f, skillLevel: f.skillLevel === level.id ? null : level.id }))
                  }
                  style={chipStyle(filter.skillLevel === level.id)}
                >
                  <Text style={chipTextStyle(filter.skillLevel === level.id)}>{level.label}</Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Price sliders */}
            <Text style={sectionLabel}>Giá/người</Text>
            <View
              style={{
                backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow,
                borderRadius: 16,
                padding: 12,
                marginBottom: priceInvalid ? 4 : 16,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                <Text style={{ fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 12, color: PROFILE_THEME_COLORS.onSurfaceVariant }}>
                  Từ
                </Text>
                <Text style={{ fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 13, color: PROFILE_THEME_COLORS.primary }}>
                  {priceMinLabel}
                </Text>
              </View>
              <Slider
                value={priceMin}
                onValueChange={(v) =>
                  setFilter((f) => ({ ...f, priceMin: Math.round(v) === 0 ? undefined : Math.round(v) }))
                }
                minimumValue={0}
                maximumValue={PRICE_SLIDER_MAX}
                step={10}
                minimumTrackTintColor={PROFILE_THEME_COLORS.primary}
                maximumTrackTintColor={PROFILE_THEME_COLORS.surfaceContainerHighest}
                thumbTintColor={PROFILE_THEME_COLORS.primary}
                style={{ marginHorizontal: -4 }}
              />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, marginBottom: 2 }}>
                <Text style={{ fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 12, color: PROFILE_THEME_COLORS.onSurfaceVariant }}>
                  Đến
                </Text>
                <Text style={{ fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 13, color: PROFILE_THEME_COLORS.primary }}>
                  {priceMaxLabel}
                </Text>
              </View>
              <Slider
                value={priceMax}
                onValueChange={(v) =>
                  setFilter((f) => ({
                    ...f,
                    priceMax: Math.round(v) >= PRICE_SLIDER_MAX ? undefined : Math.round(v),
                  }))
                }
                minimumValue={0}
                maximumValue={PRICE_SLIDER_MAX}
                step={10}
                minimumTrackTintColor={PROFILE_THEME_COLORS.primary}
                maximumTrackTintColor={PROFILE_THEME_COLORS.surfaceContainerHighest}
                thumbTintColor={PROFILE_THEME_COLORS.primary}
                style={{ marginHorizontal: -4 }}
              />
            </View>
            {priceInvalid && (
              <Text style={{ color: '#ef4444', fontSize: 11, marginBottom: 16 }}>
                Giá tối thiểu không được lớn hơn giá tối đa
              </Text>
            )}

            {/* Booking status */}
            <Text style={sectionLabel}>Trạng thái sân</Text>
            <View style={{ flexDirection: 'row', marginBottom: 16 }}>
              {BOOKING_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  onPress={() =>
                    setFilter((f) => ({
                      ...f,
                      bookingStatus: f.bookingStatus === opt.value ? undefined : opt.value,
                    }))
                  }
                  style={chipStyle(filter.bookingStatus === opt.value)}
                >
                  <Text style={chipTextStyle(filter.bookingStatus === opt.value)}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>

            {/* Slots left */}
            <Text style={sectionLabel}>Còn ít nhất</Text>
            <View style={{ flexDirection: 'row', marginBottom: 24 }}>
              {[1, 2, 3, 4].map((n) => (
                <Pressable
                  key={n}
                  onPress={() => setFilter((f) => ({ ...f, slotsLeft: f.slotsLeft === n ? undefined : n }))}
                  style={chipStyle(filter.slotsLeft === n)}
                >
                  <Text style={chipTextStyle(filter.slotsLeft === n)}>{n} chỗ</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
            <Pressable onPress={onReset} style={{ padding: 12 }}>
              <Text style={{ color: PROFILE_THEME_COLORS.outline, fontFamily: 'PlusJakartaSans-ExtraBold' }}>Đặt lại</Text>
            </Pressable>
            <Pressable
              onPress={onApply}
              disabled={priceInvalid}
              style={{
                backgroundColor: priceInvalid
                  ? PROFILE_THEME_COLORS.surfaceContainerHighest
                  : PROFILE_THEME_COLORS.primary,
                borderRadius: 16,
                paddingHorizontal: 32,
                paddingVertical: 12,
              }}
            >
              <Text
                style={{
                  color: priceInvalid ? PROFILE_THEME_COLORS.onSurfaceVariant : PROFILE_THEME_COLORS.onPrimary,
                  fontFamily: 'PlusJakartaSans-ExtraBold',
                }}
              >
                Áp dụng
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}

