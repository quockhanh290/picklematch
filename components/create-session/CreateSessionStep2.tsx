import { ScreenHeader } from '@/components/design'
import { PROFILE_THEME_COLORS } from '@/components/profile/profileTheme'
import { SCREEN_FONTS } from '@/constants/typography'
import { UserRound, Users } from 'lucide-react-native'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native'

import { CREATE_SESSION_SKILL_OPTIONS } from './skillLevelOptions'
import { RADIUS, SPACING, BORDER } from '@/constants/screenLayout'

type Props = {
  onBack: () => void
  maxPlayers: number
  setMaxPlayers: (n: number) => void
  minSkill: number
  setMinSkill: (n: number) => void
  maxSkill: number
  setMaxSkill: (n: number) => void
  bookingStatus: 'confirmed' | 'unconfirmed'
  setBookingStatus: (s: 'confirmed' | 'unconfirmed') => void
  wantsBookingNow: boolean | null
  setWantsBookingNow: (value: boolean | null) => void
  bookingReference: string
  setBookingReference: (value: string) => void
  bookingName: string
  setBookingName: (value: string) => void
  bookingPhone: string
  setBookingPhone: (value: string) => void
  bookingNotes: string
  setBookingNotes: (value: string) => void
  canOpenBookingLink: boolean
  onOpenBookingLink: () => void
  deadlineMinutes: number
  setDeadlineMinutes: (minutes: number) => void
  requireApproval: boolean
  setRequireApproval: (value: boolean) => void
  isRanked: boolean
  setIsRanked: (value: boolean) => void
  canToggleRanked: boolean
  rankedHelperText: string | null
  totalCostStr: string
  setTotalCostStr: (value: string) => void
  costPerPerson: number
  onContinue: () => void
  hideHeader?: boolean
}

function formatCurrencyInput(nextValue: string) {
  const digits = nextValue.replace(/\D/g, '')
  if (!digits) return ''
  return Number(digits).toLocaleString('vi-VN')
}

function formatCurrencyLabel(value: number) {
  return `${value.toLocaleString('vi-VN')} đ`
}

function SectionDivider({ index, title }: { index: string; title: string }) {
  return (
    <View style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Text style={{ fontFamily: SCREEN_FONTS.headline, fontSize: 16, textTransform: 'uppercase', letterSpacing: 1.5, color: PROFILE_THEME_COLORS.outline }}>
        {index} / {title}
      </Text>
      <View style={{ height: 1, flex: 1, backgroundColor: PROFILE_THEME_COLORS.outlineVariant }} />
    </View>
  )
}

function SkillRangeSelector({
  minSkill,
  maxSkill,
  setMinSkill,
  setMaxSkill,
}: {
  minSkill: number
  maxSkill: number
  setMinSkill: (n: number) => void
  setMaxSkill: (n: number) => void
}) {
  function onSelectMin(level: number) {
    if (level > maxSkill) setMaxSkill(level)
    setMinSkill(level)
  }

  function onSelectMax(level: number) {
    if (level < minSkill) setMinSkill(level)
    setMaxSkill(level)
  }

  return (
    <View style={{ gap: 12 }}>
      <View>
        <Text style={{ fontSize: 11, color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: SCREEN_FONTS.body, marginBottom: 6 }}>Tối thiểu</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {CREATE_SESSION_SKILL_OPTIONS.map((option) => {
              const isSelected = option.id === minSkill
              return (
                <TouchableOpacity
                  key={`min-${option.id}`}
                  onPress={() => onSelectMin(option.id)}
                  style={{
                    paddingHorizontal: 12, paddingVertical: SPACING.xs,
                    borderRadius: RADIUS.full,
                    backgroundColor: isSelected ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.surface,
                    borderWidth: BORDER.base,
                    borderColor: isSelected ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.outlineVariant,
                  }}
                >
                  <Text style={{ fontSize: 12, fontFamily: SCREEN_FONTS.label, color: isSelected ? PROFILE_THEME_COLORS.onPrimary : PROFILE_THEME_COLORS.onSurface }}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </ScrollView>
      </View>

      <View>
        <Text style={{ fontSize: 11, color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: SCREEN_FONTS.body, marginBottom: 6 }}>Tối đa</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {CREATE_SESSION_SKILL_OPTIONS.map((option) => {
              const isSelected = option.id === maxSkill
              return (
                <TouchableOpacity
                  key={`max-${option.id}`}
                  onPress={() => onSelectMax(option.id)}
                  style={{
                    paddingHorizontal: 12, paddingVertical: SPACING.xs,
                    borderRadius: RADIUS.full,
                    backgroundColor: isSelected ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.surface,
                    borderWidth: BORDER.base,
                    borderColor: isSelected ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.outlineVariant,
                  }}
                >
                  <Text style={{ fontSize: 12, fontFamily: SCREEN_FONTS.label, color: isSelected ? PROFILE_THEME_COLORS.onPrimary : PROFILE_THEME_COLORS.onSurface }}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </ScrollView>
      </View>

      <Text style={{ fontFamily: SCREEN_FONTS.body, fontSize: 11, color: PROFILE_THEME_COLORS.onSecondaryContainer }}>
        Bạn có thể chọn cùng một mức ở cả hai dòng để chỉ nhận đúng một trình độ.
      </Text>
    </View>
  )
}

export function CreateSessionStep2({
  onBack,
  maxPlayers,
  setMaxPlayers,
  minSkill,
  setMinSkill,
  maxSkill,
  setMaxSkill,
  bookingStatus,
  setBookingStatus,
  wantsBookingNow,
  setWantsBookingNow,
  bookingReference,
  setBookingReference,
  bookingName,
  setBookingName,
  bookingPhone,
  setBookingPhone,
  bookingNotes,
  setBookingNotes,
  canOpenBookingLink,
  onOpenBookingLink,
  deadlineMinutes,
  setDeadlineMinutes,
  requireApproval,
  setRequireApproval,
  isRanked,
  setIsRanked,
  canToggleRanked,
  rankedHelperText,
  totalCostStr,
  setTotalCostStr,
  costPerPerson,
  onContinue,
  hideHeader = false,
}: Props) {
  const minSkillOption = CREATE_SESSION_SKILL_OPTIONS.find((o) => o.id === minSkill)
  const maxSkillOption = CREATE_SESSION_SKILL_OPTIONS.find((o) => o.id === maxSkill)
  const showBookingLinkCta = bookingStatus === 'unconfirmed' && wantsBookingNow === true && canOpenBookingLink
  const shouldShowBookingDetails =
    bookingStatus === 'confirmed' ||
    (bookingStatus === 'unconfirmed' && wantsBookingNow === true && !canOpenBookingLink)

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
      <View style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 16 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          style={{ flex: 1 }}
        >
          {!hideHeader && (
            <>
              <ScreenHeader
                variant="brand"
                title="KINETIC"
                onBackPress={onBack}
                style={{ marginHorizontal: -20, marginTop: -12 }}
                rightSlot={<View style={{ width: 32, height: 32 }} />}
              />

              {/* Progress bar */}
              <View style={{ height: 3, backgroundColor: PROFILE_THEME_COLORS.outlineVariant, borderRadius: RADIUS.full, marginTop: 12, marginBottom: 16, overflow: 'hidden' }}>
                <View style={{ height: '100%', width: '66%', backgroundColor: PROFILE_THEME_COLORS.primary, borderRadius: RADIUS.full }} />
              </View>
            </>
          )}

          {/* Step title */}
          <View style={{ marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 6 }}>
              <Text style={{ fontFamily: SCREEN_FONTS.headlineItalic, fontSize: 52, color: PROFILE_THEME_COLORS.primary, lineHeight: 44, opacity: 0.2, letterSpacing: -1 }}>
                02
              </Text>
              <Text
                style={{ fontFamily: SCREEN_FONTS.headlineItalic, fontSize: 28, color: PROFILE_THEME_COLORS.primary, lineHeight: 30, letterSpacing: -0.3, flex: 1, paddingBottom: 2 }}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                Cấu hình Trận đấu
              </Text>
            </View>
            <View style={{ width: 32, height: 3, backgroundColor: PROFILE_THEME_COLORS.tertiary, borderRadius: 2 }} />
          </View>

          <SectionDivider index="01" title="Cấu hình trận đấu" />

          {/* Player count */}
          <View style={{ borderRadius: RADIUS.md, borderWidth: BORDER.hairline, borderColor: PROFILE_THEME_COLORS.outlineVariant, backgroundColor: PROFILE_THEME_COLORS.surface, padding: SPACING.md, marginBottom: 16 }}>
            <Text style={{ fontFamily: SCREEN_FONTS.bold, fontSize: 12, letterSpacing: 1.2, color: PROFILE_THEME_COLORS.primary, marginBottom: 10 }}>
              {'SỐ LƯỢNG NGƯỜI CHƠI'}
            </Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[
                { value: 2, label: 'Đơn (2)' },
                { value: 4, label: 'Đôi (4)' },
              ].map(({ value, label }) => {
                const playerCount = value as 2 | 4
                const isSelected = maxPlayers === playerCount
                const Icon = playerCount === 2 ? UserRound : Users
                return (
                  <View key={playerCount} style={{ flex: 1 }}>
                    <Pressable
                      onPress={() => setMaxPlayers(playerCount)}
                      style={({ pressed }) => ({ flex: 1, opacity: pressed ? 0.85 : 1 })}
                    >
                      <View style={{
                        flex: 1, borderRadius: RADIUS.sm,
                        backgroundColor: isSelected ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.surface,
                        paddingVertical: 12, paddingHorizontal: 8,
                        alignItems: 'center', justifyContent: 'center', gap: 4,
                        borderWidth: BORDER.medium,
                        borderColor: isSelected ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.outlineVariant,
                      }}>
                        <Icon size={20} color={isSelected ? PROFILE_THEME_COLORS.onPrimary : PROFILE_THEME_COLORS.onSurfaceVariant} />
                        <Text style={{ fontFamily: SCREEN_FONTS.headline, fontSize: 32, lineHeight: 36, color: isSelected ? PROFILE_THEME_COLORS.onPrimary : PROFILE_THEME_COLORS.onSurfaceVariant }}>
                          {playerCount}
                        </Text>
                        <Text style={{ fontFamily: SCREEN_FONTS.label, fontSize: 11, color: isSelected ? PROFILE_THEME_COLORS.onPrimary : PROFILE_THEME_COLORS.onSurfaceVariant }}>
                          {label}
                        </Text>
                      </View>
                    </Pressable>
                  </View>
                )
              })}
            </View>
          </View>

          {/* Toggles */}
          <View style={{ borderRadius: RADIUS.xl, borderWidth: BORDER.base, borderColor: PROFILE_THEME_COLORS.outlineVariant, backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow, padding: SPACING.lg, marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{ fontFamily: SCREEN_FONTS.bold, fontSize: 16, color: PROFILE_THEME_COLORS.primary }}>{'Tính điểm xếp hạng'}</Text>
                <Text style={{ fontFamily: SCREEN_FONTS.body, fontSize: 12, color: PROFILE_THEME_COLORS.onSecondaryContainer, marginTop: 2 }}>{'Kết quả sẽ ảnh hưởng đến ELO của bạn'}</Text>
              </View>
              <Switch
                value={isRanked}
                onValueChange={setIsRanked}
                disabled={!canToggleRanked}
                trackColor={{ false: PROFILE_THEME_COLORS.surfaceDim, true: PROFILE_THEME_COLORS.surfaceTint }}
                thumbColor={PROFILE_THEME_COLORS.surfaceContainerLowest}
              />
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{ fontFamily: SCREEN_FONTS.bold, fontSize: 16, color: PROFILE_THEME_COLORS.primary }}>{'Yêu cầu phê duyệt'}</Text>
                <Text style={{ fontFamily: SCREEN_FONTS.body, fontSize: 12, color: PROFILE_THEME_COLORS.onSecondaryContainer, marginTop: 2 }}>{'Chủ sân cần duyệt người tham gia'}</Text>
              </View>
              <Switch
                value={requireApproval}
                onValueChange={setRequireApproval}
                trackColor={{ false: PROFILE_THEME_COLORS.surfaceDim, true: PROFILE_THEME_COLORS.surfaceTint }}
                thumbColor={PROFILE_THEME_COLORS.surfaceContainerLowest}
              />
            </View>

            {!canToggleRanked && rankedHelperText ? (
              <Text style={{ marginTop: 10, fontFamily: SCREEN_FONTS.body, fontSize: 12, color: PROFILE_THEME_COLORS.onPrimaryFixedVariant }}>{rankedHelperText}</Text>
            ) : null}
          </View>

          {/* Skill range */}
          <View style={{ borderRadius: RADIUS.xl, borderWidth: BORDER.base, borderColor: PROFILE_THEME_COLORS.outlineVariant, backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow, padding: SPACING.lg, marginBottom: 14 }}>
            <Text style={{ fontFamily: SCREEN_FONTS.bold, fontSize: 12, letterSpacing: 1.2, color: PROFILE_THEME_COLORS.primary, marginBottom: 10 }}>
              {'PHẠM VI TRÌNH ĐỘ'}
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <Text style={{ fontFamily: SCREEN_FONTS.headline, fontSize: 24, color: PROFILE_THEME_COLORS.primary }}>{minSkillOption?.label}</Text>
              <Text style={{ fontFamily: SCREEN_FONTS.cta, fontSize: 16, color: PROFILE_THEME_COLORS.secondaryFixedDim }}>{'→'}</Text>
              <Text style={{ fontFamily: SCREEN_FONTS.headline, fontSize: 24, color: PROFILE_THEME_COLORS.primary }}>{maxSkillOption?.label}</Text>
            </View>

            <SkillRangeSelector
              minSkill={minSkill}
              maxSkill={maxSkill}
              setMinSkill={setMinSkill}
              setMaxSkill={setMaxSkill}
            />
          </View>

          <SectionDivider index="02" title="Booking và chi phí" />

          {/* Cost input */}
          <View style={{ borderRadius: RADIUS.xl, borderWidth: BORDER.base, borderColor: PROFILE_THEME_COLORS.outlineVariant, backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow, padding: SPACING.lg, marginBottom: 16 }}>
            <Text style={{ fontFamily: SCREEN_FONTS.bold, fontSize: 12, letterSpacing: 1.2, color: PROFILE_THEME_COLORS.primary, marginBottom: 10 }}>
              CHI PHÍ TRẬN ĐẤU
            </Text>
            <View style={{ gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', borderRadius: RADIUS.md, borderWidth: BORDER.base, borderColor: PROFILE_THEME_COLORS.outlineVariant, backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest, paddingHorizontal: 12, paddingVertical: 9 }}>
                  <TextInput
                    value={totalCostStr}
                    onChangeText={(value) => setTotalCostStr(formatCurrencyInput(value))}
                    placeholder="Tổng chi phí sân (vd: 240000)"
                    placeholderTextColor={PROFILE_THEME_COLORS.outline}
                    keyboardType="number-pad"
                    style={{ flex: 1, fontFamily: SCREEN_FONTS.body, fontSize: 14, color: PROFILE_THEME_COLORS.primary, padding: 0 }}
                  />
                  <Text style={{ fontSize: 12, color: PROFILE_THEME_COLORS.outline, marginLeft: 8 }}>VNĐ</Text>
                </View>
              </View>
              <View style={{ backgroundColor: PROFILE_THEME_COLORS.primary, borderRadius: RADIUS.sm, padding: SPACING.sm }}>
                <Text style={{ fontSize: 13, color: PROFILE_THEME_COLORS.onPrimary, fontFamily: SCREEN_FONTS.label }}>
                  {costPerPerson > 0
                    ? `Chi phí / người: ${formatCurrencyLabel(costPerPerson)}`
                    : 'Chi phí / người: Chưa có'}
                </Text>
              </View>
            </View>
          </View>

          {/* Deadline */}
          <View style={{ borderRadius: RADIUS.xl, borderWidth: BORDER.base, borderColor: PROFILE_THEME_COLORS.outlineVariant, backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow, padding: SPACING.lg, marginBottom: 16 }}>
            <Text style={{ fontFamily: SCREEN_FONTS.bold, fontSize: 12, letterSpacing: 1.2, color: PROFILE_THEME_COLORS.primary, marginBottom: 10 }}>
              HẠN CHỐT VÀO KÈO
            </Text>
            <Text style={{ fontFamily: SCREEN_FONTS.body, fontSize: 12, color: PROFILE_THEME_COLORS.onSecondaryContainer, marginBottom: 8 }}>
              Chọn mốc trước giờ bắt đầu
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {[
                { value: 30, label: '30 phút' },
                { value: 45, label: '45 phút' },
                { value: 60, label: '1 giờ' },
                { value: 120, label: '2 giờ' },
              ].map((option) => {
                const active = deadlineMinutes === option.value
                return (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => setDeadlineMinutes(option.value)}
                    style={{
                      paddingHorizontal: 16, paddingVertical: 8,
                      borderRadius: RADIUS.full,
                      backgroundColor: active ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.surface,
                      borderWidth: BORDER.medium,
                      borderColor: active ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.outlineVariant,
                    }}
                  >
                    <Text style={{ fontSize: 12, fontFamily: SCREEN_FONTS.label, color: active ? PROFILE_THEME_COLORS.onPrimary : PROFILE_THEME_COLORS.onSurface }}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>

          {/* Booking status */}
          <View style={{ borderRadius: RADIUS.xl, borderWidth: BORDER.base, borderColor: PROFILE_THEME_COLORS.outlineVariant, backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow, padding: SPACING.lg, marginBottom: 14 }}>
            <Text style={{ fontFamily: SCREEN_FONTS.bold, fontSize: 12, letterSpacing: 1.2, color: PROFILE_THEME_COLORS.primary, marginBottom: 10 }}>
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
        </ScrollView>

        {/* Bottom bar */}
        <View style={{ flexDirection: 'row', gap: 10, marginHorizontal: -20, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 28, backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow, borderTopWidth: 0.5, borderTopColor: PROFILE_THEME_COLORS.outlineVariant }}>
          <TouchableOpacity
            onPress={onBack}
            style={{ flex: 1, borderRadius: RADIUS.full, borderWidth: BORDER.medium, borderColor: PROFILE_THEME_COLORS.outlineVariant, paddingVertical: 13, alignItems: 'center', backgroundColor: PROFILE_THEME_COLORS.surface }}
          >
            <Text style={{ fontSize: 15, color: PROFILE_THEME_COLORS.onSurface, fontFamily: SCREEN_FONTS.cta, textTransform: 'uppercase' }}>Quay lại</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onContinue}
            style={{ flex: 2, borderRadius: RADIUS.full, backgroundColor: PROFILE_THEME_COLORS.primary, paddingVertical: 13, alignItems: 'center' }}
          >
            <Text style={{ fontSize: 15, color: PROFILE_THEME_COLORS.onPrimary, fontFamily: SCREEN_FONTS.cta, textTransform: 'uppercase' }}>Tiếp tục →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}
