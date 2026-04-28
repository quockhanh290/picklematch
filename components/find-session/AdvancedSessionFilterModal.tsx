import { colors } from '@/constants/colors'
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker'
import Slider from '@react-native-community/slider'
import React, { useState } from 'react'
import { Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native'
import { X } from 'lucide-react-native'
import { SCREEN_FONTS } from '@/constants/typography'
import { RADIUS, SPACING, BORDER } from '@/constants/screenLayout'

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


const PROFILE_THEME_COLORS = {
  primary: colors.primary,
  onPrimary: '#FFFFFF',
  background: colors.background,
  onBackground: colors.text,
  onSurface: colors.text,
  onSurfaceVariant: colors.textSecondary,
  outline: colors.textSecondary,
  outlineVariant: colors.border,
  surfaceContainerLow: colors.surface,
  surfaceContainerHighest: colors.surfaceAlt,
  error: colors.accentDark,
} as const
const PRICE_SLIDER_MAX = 300
const FILTER_FONTS = {
  headline: SCREEN_FONTS.headline,
  body: SCREEN_FONTS.body,
  label: SCREEN_FONTS.label,
  cta: SCREEN_FONTS.cta,
} as const

function withAlpha(hex: string, alpha: number) {
  const clean = hex.replace('#', '')
  const normalized = clean.length === 3 ? clean.split('').map((char) => char + char).join('') : clean
  const n = Number.parseInt(normalized, 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

function chipStyle(active: boolean) {
  return {
    backgroundColor: active ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.surfaceContainerLow,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 9,
    marginRight: 8,
    borderWidth: BORDER.base,
    borderColor: active ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.outlineVariant,
  }
}

function chipTextStyle(active: boolean) {
  return {
    color: active ? PROFILE_THEME_COLORS.onPrimary : PROFILE_THEME_COLORS.onSurfaceVariant,
    fontFamily: FILTER_FONTS.label,
    fontSize: 12,
  }
}

const sectionLabel = {
  fontFamily: FILTER_FONTS.cta,
  fontSize: 10,
  letterSpacing: 1.4,
  textTransform: 'uppercase',
  color: PROFILE_THEME_COLORS.outline,
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
  const dayOfWeek = today.getDay()
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
      <View style={{ flex: 1, backgroundColor: withAlpha(PROFILE_THEME_COLORS.onBackground, 0.36), justifyContent: 'flex-end' }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
        <View
          style={{
            backgroundColor: PROFILE_THEME_COLORS.background,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            borderTopWidth: 1,
            borderColor: PROFILE_THEME_COLORS.outlineVariant,
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 32,
            maxHeight: '92%',
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <Text style={{ fontFamily: FILTER_FONTS.cta, fontSize: 18, color: PROFILE_THEME_COLORS.onBackground }}>
              BỘ LỌC NÂNG CAO
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Pressable onPress={onReset} hitSlop={8}>
                <Text style={{ color: PROFILE_THEME_COLORS.primary, fontFamily: FILTER_FONTS.cta, fontSize: 13, textTransform: 'uppercase' }}>Đặt lại</Text>
              </Pressable>
              <Pressable
                onPress={onClose}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={16} color={PROFILE_THEME_COLORS.onSurfaceVariant} strokeWidth={2.6} />
              </Pressable>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
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

            <Text style={sectionLabel}>Ngày</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginBottom: 12 }}
              contentContainerStyle={{ paddingRight: 8 }}
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
                <Text
                  style={{
                    fontFamily: FILTER_FONTS.label,
                    fontSize: 13,
                    color: PROFILE_THEME_COLORS.onSurface,
                  }}
                >
                  {hasCustomDate ? filter.date.slice(0, 5) : 'Chọn ngày'}
                </Text>
              </Pressable>
            </ScrollView>

            {showDatePicker && (
              <View
                style={{
                  marginBottom: 12,
                  alignItems: 'center',
                  backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow,
                  borderRadius: RADIUS.md,
                  borderWidth: BORDER.base,
                  borderColor: PROFILE_THEME_COLORS.outlineVariant,
                  paddingVertical: SPACING.xs,
                }}
              >
                <DateTimePicker
                  value={pickerDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  minimumDate={new Date()}
                  onChange={handleDateChange}
                  style={{ width: '100%', maxWidth: 360, backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow }}
                  accentColor={PROFILE_THEME_COLORS.primary}
                  themeVariant="light"
                />
              </View>
            )}

            <Text style={sectionLabel}>Khung giờ</Text>
            <View style={{ flexDirection: 'row', marginBottom: 16, justifyContent: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
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

            <Text style={sectionLabel}>Giá/người</Text>
            <View
              style={{
                backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow,
                borderRadius: RADIUS.lg,
                padding: 12,
                marginBottom: priceInvalid ? 4 : 16,
                borderWidth: BORDER.base,
                borderColor: PROFILE_THEME_COLORS.outlineVariant,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
                <Text style={{ fontFamily: FILTER_FONTS.label, fontSize: 12, color: PROFILE_THEME_COLORS.onSurfaceVariant }}>
                  Từ
                </Text>
                <Text style={{ fontFamily: FILTER_FONTS.cta, fontSize: 13, color: PROFILE_THEME_COLORS.primary }}>
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
                <Text style={{ fontFamily: FILTER_FONTS.label, fontSize: 12, color: PROFILE_THEME_COLORS.onSurfaceVariant }}>
                  Đến
                </Text>
                <Text style={{ fontFamily: FILTER_FONTS.cta, fontSize: 13, color: PROFILE_THEME_COLORS.primary }}>
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
              <Text style={{ color: PROFILE_THEME_COLORS.error, fontFamily: FILTER_FONTS.body, fontSize: 11, marginBottom: 16 }}>
                Giá tối thiểu không được lớn hơn giá tối đa
              </Text>
            )}

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

          <View style={{ marginTop: 12 }}>
            <Pressable
              onPress={onApply}
              disabled={priceInvalid}
              style={{
                backgroundColor: priceInvalid
                  ? PROFILE_THEME_COLORS.surfaceContainerHighest
                  : PROFILE_THEME_COLORS.primary,
                borderRadius: RADIUS.full,
                height: 48,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                style={{
                  color: priceInvalid ? PROFILE_THEME_COLORS.onSurfaceVariant : PROFILE_THEME_COLORS.onPrimary,
                  fontFamily: FILTER_FONTS.cta,
                  fontSize: 15,
                  textTransform: 'uppercase',
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

