import React from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import { PROFILE_THEME_COLORS } from '@/constants/profileTheme'
import { SCREEN_FONTS } from '@/constants/typography'
import { RADIUS, SPACING, BORDER } from '@/constants/screenLayout'

interface BookingStatusSectionProps {
  bookingStatus: 'confirmed' | 'unconfirmed'
  setBookingStatus: (s: 'confirmed' | 'unconfirmed') => void
  wantsBookingNow: boolean | null
  setWantsBookingNow: (value: boolean | null) => void
  showBookingLinkCta: boolean
  onOpenBookingLink: () => void
  shouldShowBookingDetails: boolean
  bookingReference: string
  setBookingReference: (value: string) => void
  bookingName: string
  setBookingName: (value: string) => void
  bookingPhone: string
  setBookingPhone: (value: string) => void
  bookingNotes: string
  setBookingNotes: (value: string) => void
}

export function BookingStatusSection({
  bookingStatus,
  setBookingStatus,
  wantsBookingNow,
  setWantsBookingNow,
  showBookingLinkCta,
  onOpenBookingLink,
  shouldShowBookingDetails,
  bookingReference,
  setBookingReference,
  bookingName,
  setBookingName,
  bookingPhone,
  setBookingPhone,
  bookingNotes,
  setBookingNotes,
}: BookingStatusSectionProps) {
  return (
    <View style={{ borderRadius: RADIUS.xl, borderWidth: BORDER.base, borderColor: PROFILE_THEME_COLORS.outlineVariant, backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow, padding: SPACING.lg, marginBottom: 14 }}>
      <Text style={{ fontFamily: SCREEN_FONTS.headline, fontSize: 12, letterSpacing: 1.2, color: PROFILE_THEME_COLORS.primary, marginBottom: 10 }}>
        TÌNH TRẠNG SÂN
      </Text>
      <Text style={{ fontFamily: SCREEN_FONTS.label, fontSize: 12, color: PROFILE_THEME_COLORS.onSecondaryContainer, marginBottom: 8 }}>
        Trạng thái đặt sân
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        {[
          { value: 'confirmed' as const, label: 'Đã đặt sân' },
          { value: 'unconfirmed' as const, label: 'Chưa đặt sân' },
        ].map((item) => {
          const active = bookingStatus === item.value
          return (
            <Pressable
              key={item.value}
              onPress={() => setBookingStatus(item.value)}
              style={({ pressed }) => ({ opacity: pressed ? 0.82 : 1 })}
            >
              <View style={{
                borderRadius: RADIUS.full, borderWidth: BORDER.base,
                borderColor: active ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.outlineVariant,
                backgroundColor: active ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.surfaceContainerLowest,
                paddingHorizontal: SPACING.md, paddingVertical: 11, alignItems: 'center',
              }}>
                <Text style={{ fontFamily: SCREEN_FONTS.label, fontSize: 13, color: active ? PROFILE_THEME_COLORS.onPrimary : PROFILE_THEME_COLORS.onSecondaryContainer }}>
                  {item.label}
                </Text>
              </View>
            </Pressable>
          )
        })}
      </View>

      {bookingStatus === 'unconfirmed' ? (
        <View style={{ marginBottom: 12 }}>
          <Text style={{ fontFamily: SCREEN_FONTS.label, fontSize: 12, color: PROFILE_THEME_COLORS.onSecondaryContainer, marginBottom: 8 }}>
            Bạn có muốn đặt ngay bây giờ không?
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {[
              { value: true, label: 'Có' },
              { value: false, label: 'Không' },
            ].map((item) => {
              const active = wantsBookingNow === item.value
              return (
                <Pressable
                  key={item.label}
                  onPress={() => setWantsBookingNow(item.value)}
                  style={({ pressed }) => ({ opacity: pressed ? 0.82 : 1 })}
                >
                  <View style={{
                    borderRadius: RADIUS.full, borderWidth: BORDER.base,
                    borderColor: active ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.outlineVariant,
                    backgroundColor: active ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.surfaceContainerLowest,
                    paddingHorizontal: SPACING.md, paddingVertical: 9, alignItems: 'center',
                  }}>
                    <Text style={{ fontFamily: SCREEN_FONTS.label, fontSize: 13, color: active ? PROFILE_THEME_COLORS.onPrimary : PROFILE_THEME_COLORS.onSecondaryContainer }}>
                      {item.label}
                    </Text>
                  </View>
                </Pressable>
              )
            })}
          </View>
        </View>
      ) : null}

      {showBookingLinkCta ? (
        <Pressable onPress={onOpenBookingLink} style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1, marginBottom: 12 })}>
          <View style={{ borderRadius: RADIUS.md, borderWidth: BORDER.base, borderColor: PROFILE_THEME_COLORS.secondaryFixedDim, backgroundColor: PROFILE_THEME_COLORS.secondaryContainer, paddingVertical: SPACING.sm, alignItems: 'center' }}>
            <Text style={{ fontFamily: SCREEN_FONTS.label, fontSize: 13, color: PROFILE_THEME_COLORS.surfaceTint }}>Mở link đặt sân</Text>
          </View>
        </Pressable>
      ) : null}

      {shouldShowBookingDetails ? (
        <View style={{ gap: 10 }}>
          <Text style={{ fontFamily: SCREEN_FONTS.label, fontSize: 12, color: PROFILE_THEME_COLORS.onSecondaryContainer }}>
            Thông tin booking
          </Text>
          <View style={{ borderRadius: RADIUS.md, borderWidth: BORDER.base, borderColor: PROFILE_THEME_COLORS.outlineVariant, backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest, paddingHorizontal: 12, paddingVertical: 9 }}>
            <TextInput
              value={bookingReference}
              onChangeText={setBookingReference}
              placeholder="Mã đặt sân"
              placeholderTextColor={PROFILE_THEME_COLORS.outline}
              style={{ fontFamily: SCREEN_FONTS.body, fontSize: 14, color: PROFILE_THEME_COLORS.primary, padding: 0 }}
            />
          </View>
          <View style={{ borderRadius: RADIUS.md, borderWidth: BORDER.base, borderColor: PROFILE_THEME_COLORS.outlineVariant, backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest, paddingHorizontal: 12, paddingVertical: 9 }}>
            <TextInput
              value={bookingName}
              onChangeText={setBookingName}
              placeholder="Tên người đặt sân"
              placeholderTextColor={PROFILE_THEME_COLORS.outline}
              style={{ fontFamily: SCREEN_FONTS.body, fontSize: 14, color: PROFILE_THEME_COLORS.primary, padding: 0 }}
            />
          </View>
          <View style={{ borderRadius: RADIUS.md, borderWidth: BORDER.base, borderColor: PROFILE_THEME_COLORS.outlineVariant, backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest, paddingHorizontal: 12, paddingVertical: 9 }}>
            <TextInput
              value={bookingPhone}
              onChangeText={setBookingPhone}
              placeholder="Số điện thoại"
              placeholderTextColor={PROFILE_THEME_COLORS.outline}
              keyboardType="phone-pad"
              style={{ fontFamily: SCREEN_FONTS.body, fontSize: 14, color: PROFILE_THEME_COLORS.primary, padding: 0 }}
            />
          </View>
          <View style={{ borderRadius: RADIUS.md, borderWidth: BORDER.base, borderColor: PROFILE_THEME_COLORS.outlineVariant, backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest, paddingHorizontal: 12, paddingVertical: SPACING.sm }}>
            <TextInput
              value={bookingNotes}
              onChangeText={setBookingNotes}
              placeholder="Ghi chú booking (tuỳ chọn)"
              placeholderTextColor={PROFILE_THEME_COLORS.outline}
              multiline
              textAlignVertical="top"
              style={{ minHeight: 68, fontFamily: SCREEN_FONTS.body, fontSize: 14, color: PROFILE_THEME_COLORS.primary, padding: 0 }}
            />
          </View>
        </View>
      ) : null}
    </View>
  )
}
