import { AppButton, ScreenHeader } from '@/components/design'
import { PROFILE_THEME_COLORS } from '@/components/profile/profileTheme'
import { Info, UserRound, Users } from 'lucide-react-native'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native'

import { CREATE_SESSION_SKILL_OPTIONS } from './skillLevelOptions'

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
      <Text
        style={{
          fontFamily: 'PlusJakartaSans-Bold',
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: 2.8,
          color: PROFILE_THEME_COLORS.outline,
        }}
      >
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
    if (level > maxSkill) {
      setMaxSkill(level)
    }
    setMinSkill(level)
  }

  function onSelectMax(level: number) {
    if (level < minSkill) {
      setMinSkill(level)
    }
    setMaxSkill(level)
  }

  function SkillChoiceRow({
    title,
    selected,
    onSelect,
  }: {
    title: string
    selected: number
    onSelect: (level: number) => void
  }) {
    return (
      <View style={{ marginBottom: 10 }}>
        <Text style={{ fontFamily: 'PlusJakartaSans-Bold', fontSize: 11, color: PROFILE_THEME_COLORS.onSecondaryContainer, marginBottom: 8 }}>
          {title}
        </Text>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {CREATE_SESSION_SKILL_OPTIONS.map((option) => {
            const Icon = option.icon
            const isSelected = option.id === selected

            return (
              <View key={`${title}-${option.id}`} style={{ flex: 1 }}>
                <Pressable
                  onPress={() => onSelect(option.id)}
                  style={({ pressed }) => ({ opacity: pressed ? 0.78 : 1 })}
                >
                  <View
                    style={{
                      borderRadius: 14,
                      height: 56,
                      paddingHorizontal: 4,
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      backgroundColor: isSelected ? PROFILE_THEME_COLORS.primaryContainer : PROFILE_THEME_COLORS.surfaceContainerLowest,
                      borderWidth: 1,
                      borderColor: isSelected ? PROFILE_THEME_COLORS.primaryContainer : PROFILE_THEME_COLORS.outlineVariant,
                      shadowColor: PROFILE_THEME_COLORS.primary,
                      shadowOpacity: isSelected ? 0.15 : 0.05,
                      shadowOffset: { width: 0, height: 2 },
                      shadowRadius: isSelected ? 6 : 2,
                      elevation: isSelected ? 3 : 1,
                    }}
                  >
                    <View style={{ position: 'absolute', right: -8, bottom: -4, opacity: isSelected ? 0.2 : 0.08 }}>
                      <Icon size={36} color={isSelected ? PROFILE_THEME_COLORS.onPrimary : PROFILE_THEME_COLORS.primaryContainer} />
                    </View>
                    <Text
                      style={{
                        fontFamily: 'PlusJakartaSans-Bold',
                        fontSize: 12,
                        lineHeight: 16,
                        color: isSelected ? PROFILE_THEME_COLORS.onPrimary : PROFILE_THEME_COLORS.onSecondaryContainer,
                        textAlign: 'center',
                      }}
                      numberOfLines={2}
                    >
                      {option.label}
                    </Text>
                  </View>
                </Pressable>
              </View>
            )
          })}
        </View>
      </View>
    )
  }

  return (
    <View>
      <SkillChoiceRow title="Mức tối thiểu" selected={minSkill} onSelect={onSelectMin} />
      <SkillChoiceRow title="Mức tối đa" selected={maxSkill} onSelect={onSelectMax} />

      <Text style={{ marginTop: 10, fontFamily: 'PlusJakartaSans-Regular', fontSize: 11, color: PROFILE_THEME_COLORS.onSecondaryContainer }}>
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
}: Props) {
  const minSkillOption = CREATE_SESSION_SKILL_OPTIONS.find((o) => o.id === minSkill)
  const maxSkillOption = CREATE_SESSION_SKILL_OPTIONS.find((o) => o.id === maxSkill)
  const showBookingLinkCta = bookingStatus === 'unconfirmed' && wantsBookingNow === true && canOpenBookingLink
  const shouldShowBookingDetails =
    bookingStatus === 'confirmed' ||
    (bookingStatus === 'unconfirmed' && wantsBookingNow === true && !canOpenBookingLink)

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 28 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        style={{ flex: 1 }}
      >
        <ScreenHeader
          variant="brand"
          title="KINETIC"
          onBackPress={onBack}
          style={{ marginHorizontal: -20, marginTop: -12 }}
          rightSlot={<View style={{ width: 32, height: 32 }} />}
        />

        <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 2, paddingTop: 14, paddingBottom: 14 }}>
          <Text style={{ fontFamily: 'PlusJakartaSans-ExtraBoldItalic', fontSize: 56, color: PROFILE_THEME_COLORS.primary, lineHeight: 56, marginTop: 2 }}>02</Text>
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={{ fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 48, color: PROFILE_THEME_COLORS.primary, lineHeight: 48 }}>{'\u0043\u1ea5\u0075\u0020\u0068\u00ec\u006e\u0068'}</Text>
            <Text style={{ fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 48, color: PROFILE_THEME_COLORS.primary, lineHeight: 48 }}>{'\u0054\u0072\u1ead\u006e\u0020\u0111\u1ea5\u0075'}</Text>
            <View style={{ marginTop: 10, width: 84, height: 4, borderRadius: 999, backgroundColor: PROFILE_THEME_COLORS.primaryFixed }} />
          </View>
        </View>

        <SectionDivider index="01" title="Cấu hình trận đấu" />

        <View
          style={{
            borderRadius: 22,
            borderWidth: 1,
            borderColor: PROFILE_THEME_COLORS.outlineVariant,
            backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow,
            padding: 18,
            marginBottom: 16,
          }}
        >
          <Text style={{ fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 12, letterSpacing: 1.2, color: PROFILE_THEME_COLORS.primary, marginBottom: 10 }}>
            {'\u0053\u1ed0\u0020\u004c\u01af\u1ee2\u004e\u0047\u0020\u004e\u0047\u01af\u1edc\u0049\u0020\u0043\u0048\u01a0\u0049'}
          </Text>

          <View style={{ flexDirection: 'row', gap: 10, width: '100%' }}>
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
                    <View
                      style={{
                        flex: 1,
                        borderRadius: 18,
                        backgroundColor: isSelected ? PROFILE_THEME_COLORS.primaryContainer : PROFILE_THEME_COLORS.surfaceContainerLowest,
                        paddingVertical: 18,
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                        borderWidth: 1,
                        borderColor: isSelected ? PROFILE_THEME_COLORS.primaryContainer : PROFILE_THEME_COLORS.outlineVariant,
                        shadowColor: PROFILE_THEME_COLORS.primary,
                        shadowOpacity: isSelected ? 0.18 : 0.06,
                        shadowOffset: { width: 0, height: 2 },
                        shadowRadius: isSelected ? 8 : 4,
                        elevation: isSelected ? 4 : 2,
                      }}
                    >
                      <Icon size={24} color={isSelected ? PROFILE_THEME_COLORS.onPrimary : PROFILE_THEME_COLORS.surfaceTint} />
                      <Text style={{ fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 32, lineHeight: 36, color: isSelected ? PROFILE_THEME_COLORS.onPrimary : PROFILE_THEME_COLORS.surfaceTint }}>
                        {playerCount}
                      </Text>
                      <Text style={{ fontFamily: 'PlusJakartaSans-Bold', fontSize: 13, color: isSelected ? PROFILE_THEME_COLORS.onPrimary : PROFILE_THEME_COLORS.onSecondaryContainer }}>
                        {label}
                      </Text>
                    </View>
                  </Pressable>
                </View>
              )
            })}
          </View>
        </View>
        <View style={{ borderRadius: 22, borderWidth: 1, borderColor: PROFILE_THEME_COLORS.outlineVariant, backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow, padding: 18, marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={{ fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 16, color: PROFILE_THEME_COLORS.primary }}>{'\u0054\u00ed\u006e\u0068\u0020\u0111\u0069\u1ec3\u006d\u0020\u0078\u1ebf\u0070\u0020\u0068\u1ea1\u006e\u0067'}</Text>
              <Text style={{ fontFamily: 'PlusJakartaSans-Regular', fontSize: 12, color: PROFILE_THEME_COLORS.onSecondaryContainer, marginTop: 2 }}>{'\u004b\u1ebf\u0074\u0020\u0071\u0075\u1ea3\u0020\u0073\u1ebd\u0020\u1ea3\u006e\u0068\u0020\u0068\u01b0\u1edf\u006e\u0067\u0020\u0111\u1ebf\u006e\u0020\u0045\u004c\u004f\u0020\u0063\u1ee7\u0061\u0020\u0062\u1ea1\u006e'}</Text>
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
              <Text style={{ fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 16, color: PROFILE_THEME_COLORS.primary }}>{'\u0059\u00ea\u0075\u0020\u0063\u1ea7\u0075\u0020\u0070\u0068\u00ea\u0020\u0064\u0075\u0079\u1ec7\u0074'}</Text>
              <Text style={{ fontFamily: 'PlusJakartaSans-Regular', fontSize: 12, color: PROFILE_THEME_COLORS.onSecondaryContainer, marginTop: 2 }}>{'\u0043\u0068\u1ee7\u0020\u0073\u00e2\u006e\u0020\u0063\u1ea7\u006e\u0020\u0064\u0075\u0079\u1ec7\u0074\u0020\u006e\u0067\u01b0\u1eddi\u0020\u0074\u0068\u0061\u006d\u0020\u0067\u0069\u0061'}</Text>
            </View>
            <Switch
              value={requireApproval}
              onValueChange={setRequireApproval}
              trackColor={{ false: PROFILE_THEME_COLORS.surfaceDim, true: PROFILE_THEME_COLORS.surfaceTint }}
              thumbColor={PROFILE_THEME_COLORS.surfaceContainerLowest}
            />
          </View>

          {!canToggleRanked && rankedHelperText ? (
            <Text style={{ marginTop: 10, fontFamily: 'PlusJakartaSans-Regular', fontSize: 12, color: PROFILE_THEME_COLORS.onPrimaryFixedVariant }}>{rankedHelperText}</Text>
          ) : null}
        </View>

        <View
          style={{
            borderRadius: 22,
            borderWidth: 1,
            borderColor: PROFILE_THEME_COLORS.outlineVariant,
            backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow,
            padding: 18,
            marginBottom: 14,
          }}
        >
          <Text style={{ fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 12, letterSpacing: 1.2, color: PROFILE_THEME_COLORS.primary, marginBottom: 10 }}>{'\u0050\u0048\u1ea0\u004d\u0020\u0056\u0049\u0020\u0054\u0052\u00cc\u004e\u0048\u0020\u0110\u1ed8'}</Text>

          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <View>
              <Text style={{ fontFamily: 'PlusJakartaSans-Bold', fontSize: 10, color: PROFILE_THEME_COLORS.onSecondaryContainer, textTransform: 'uppercase', letterSpacing: 0.8 }}>Tối thiểu</Text>
              <Text style={{ fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 18, color: PROFILE_THEME_COLORS.primary, marginTop: 2 }}>{minSkillOption?.label}</Text>
            </View>
            <Text style={{ fontFamily: 'PlusJakartaSans-Bold', fontSize: 16, color: PROFILE_THEME_COLORS.secondaryFixedDim }}>{'→'}</Text>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontFamily: 'PlusJakartaSans-Bold', fontSize: 10, color: PROFILE_THEME_COLORS.onSecondaryContainer, textTransform: 'uppercase', letterSpacing: 0.8 }}>Tối đa</Text>
              <Text style={{ fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 18, color: PROFILE_THEME_COLORS.primary, marginTop: 2 }}>{maxSkillOption?.label}</Text>
            </View>
          </View>

          <SkillRangeSelector
            minSkill={minSkill}
            maxSkill={maxSkill}
            setMinSkill={setMinSkill}
            setMaxSkill={setMaxSkill}
          />

          <View style={{ marginTop: 14, borderRadius: 18, borderWidth: 1, borderColor: PROFILE_THEME_COLORS.outlineVariant, backgroundColor: PROFILE_THEME_COLORS.secondaryContainer, padding: 12, flexDirection: 'row', gap: 10 }}>
            <Info size={16} color={PROFILE_THEME_COLORS.onSecondaryContainer} />
            <Text style={{ flex: 1, fontFamily: 'PlusJakartaSans-Regular', fontSize: 12, lineHeight: 18, color: PROFILE_THEME_COLORS.onSecondaryContainer }}>
              Chỉ người chơi trong phạm vi trình độ này mới có thể tham gia buổi. Bạn có thể nới lỏng giới hạn nếu không tìm được đủ người.
            </Text>
          </View>
        </View>

        <SectionDivider index="02" title="Booking và chi phí" />

        <View
          style={{
            borderRadius: 22,
            borderWidth: 1,
            borderColor: PROFILE_THEME_COLORS.outlineVariant,
            backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow,
            padding: 18,
            marginBottom: 16,
          }}
        >
          <Text style={{ fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 12, letterSpacing: 1.2, color: PROFILE_THEME_COLORS.primary, marginBottom: 10 }}>
            CHI PHÍ TRẬN ĐẤU
          </Text>

          <Text style={{ fontFamily: 'PlusJakartaSans-Bold', fontSize: 12, color: PROFILE_THEME_COLORS.onSecondaryContainer, marginBottom: 6 }}>
            Tổng chi phí sân
          </Text>
          <View
            style={{
              borderRadius: 14,
              borderWidth: 1,
              borderColor: PROFILE_THEME_COLORS.outlineVariant,
              backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest,
              paddingHorizontal: 14,
              paddingVertical: 10,
              marginBottom: 10,
            }}
          >
            <TextInput
              value={totalCostStr}
              onChangeText={(value) => setTotalCostStr(formatCurrencyInput(value))}
              placeholder="Nhập tổng chi phí (ví dụ: 240000)"
              placeholderTextColor={PROFILE_THEME_COLORS.outline}
              keyboardType="number-pad"
              style={{ fontFamily: 'PlusJakartaSans-Bold', fontSize: 16, color: PROFILE_THEME_COLORS.primary, padding: 0 }}
            />
          </View>

          <View
            style={{
              borderRadius: 14,
              borderWidth: 1,
              borderColor: PROFILE_THEME_COLORS.outlineVariant,
              backgroundColor: PROFILE_THEME_COLORS.secondaryContainer,
              paddingHorizontal: 12,
              paddingVertical: 10,
            }}
          >
            <Text style={{ fontFamily: 'PlusJakartaSans-Bold', fontSize: 12, color: PROFILE_THEME_COLORS.onSecondaryContainer }}>
              Chi phí / người: {costPerPerson > 0 ? formatCurrencyLabel(costPerPerson) : 'Chưa có'}
            </Text>
          </View>
        </View>

        <View
          style={{
            borderRadius: 22,
            borderWidth: 1,
            borderColor: PROFILE_THEME_COLORS.outlineVariant,
            backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow,
            padding: 18,
            marginBottom: 16,
          }}
        >
          <Text style={{ fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 12, letterSpacing: 1.2, color: PROFILE_THEME_COLORS.primary, marginBottom: 10 }}>
            HẠN CHỐT VÀO KÈO
          </Text>
          <Text style={{ fontFamily: 'PlusJakartaSans-Regular', fontSize: 12, color: PROFILE_THEME_COLORS.onSecondaryContainer, marginBottom: 8 }}>
            Chọn mốc trước giờ bắt đầu
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {[
              { value: 30, label: '30 \u0070\u0068\u00fa\u0074' },
              { value: 45, label: '45 \u0070\u0068\u00fa\u0074' },
              { value: 60, label: '1 \u0067\u0069\u1edd' },
              { value: 120, label: '2 \u0067\u0069\u1edd' },
            ].map((option) => {
              const active = deadlineMinutes === option.value
              return (
                <Pressable key={option.value} onPress={() => setDeadlineMinutes(option.value)} style={({ pressed }) => ({ opacity: pressed ? 0.82 : 1 })}>
                  <View
                    style={{
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: active ? PROFILE_THEME_COLORS.primaryContainer : PROFILE_THEME_COLORS.outlineVariant,
                      backgroundColor: active ? PROFILE_THEME_COLORS.primaryContainer : PROFILE_THEME_COLORS.surfaceContainerLowest,
                      paddingHorizontal: 14,
                      paddingVertical: 10,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontFamily: 'PlusJakartaSans-Bold', fontSize: 12, color: active ? PROFILE_THEME_COLORS.onPrimary : PROFILE_THEME_COLORS.onSecondaryContainer }}>
                      {option.label}
                    </Text>
                  </View>
                </Pressable>
              )
            })}
          </View>
        </View>

        <View
          style={{
            borderRadius: 22,
            borderWidth: 1,
            borderColor: PROFILE_THEME_COLORS.outlineVariant,
            backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow,
            padding: 18,
            marginBottom: 14,
          }}
        >
          <Text style={{ fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 12, letterSpacing: 1.2, color: PROFILE_THEME_COLORS.primary, marginBottom: 10 }}>
            TÌNH TRẠNG SÂN
          </Text>

          <Text style={{ fontFamily: 'PlusJakartaSans-Bold', fontSize: 12, color: PROFILE_THEME_COLORS.onSecondaryContainer, marginBottom: 8 }}>
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
                  <View
                    style={{
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor: active ? PROFILE_THEME_COLORS.primaryContainer : PROFILE_THEME_COLORS.outlineVariant,
                      backgroundColor: active ? PROFILE_THEME_COLORS.primaryContainer : PROFILE_THEME_COLORS.surfaceContainerLowest,
                      paddingHorizontal: 14,
                      paddingVertical: 11,
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontFamily: 'PlusJakartaSans-Bold', fontSize: 13, color: active ? PROFILE_THEME_COLORS.onPrimary : PROFILE_THEME_COLORS.onSecondaryContainer }}>
                      {item.label}
                    </Text>
                  </View>
                </Pressable>
              )
            })}
          </View>

          {bookingStatus === 'unconfirmed' ? (
            <View style={{ marginBottom: 12 }}>
              <Text style={{ fontFamily: 'PlusJakartaSans-Bold', fontSize: 12, color: PROFILE_THEME_COLORS.onSecondaryContainer, marginBottom: 8 }}>
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
                      <View
                        style={{
                          borderRadius: 999,
                          borderWidth: 1,
                          borderColor: active ? PROFILE_THEME_COLORS.surfaceTint : PROFILE_THEME_COLORS.outlineVariant,
                          backgroundColor: active ? PROFILE_THEME_COLORS.surfaceTint : PROFILE_THEME_COLORS.surfaceContainerLowest,
                          paddingHorizontal: 14,
                          paddingVertical: 9,
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ fontFamily: 'PlusJakartaSans-Bold', fontSize: 13, color: active ? PROFILE_THEME_COLORS.onPrimary : PROFILE_THEME_COLORS.onSecondaryContainer }}>
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
              <View
                style={{
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: PROFILE_THEME_COLORS.secondaryFixedDim,
                  backgroundColor: PROFILE_THEME_COLORS.secondaryContainer,
                  paddingVertical: 10,
                  alignItems: 'center',
                }}
              >
                <Text style={{ fontFamily: 'PlusJakartaSans-Bold', fontSize: 13, color: PROFILE_THEME_COLORS.surfaceTint }}>Mở link đặt sân</Text>
              </View>
            </Pressable>
          ) : null}

          {shouldShowBookingDetails ? (
            <View style={{ gap: 10 }}>
              <Text style={{ fontFamily: 'PlusJakartaSans-Bold', fontSize: 12, color: PROFILE_THEME_COLORS.onSecondaryContainer }}>
                Thông tin booking
              </Text>

              <View style={{ borderRadius: 12, borderWidth: 1, borderColor: PROFILE_THEME_COLORS.outlineVariant, backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest, paddingHorizontal: 12, paddingVertical: 9 }}>
                <TextInput
                  value={bookingReference}
                  onChangeText={setBookingReference}
                  placeholder="Mã đặt sân"
                  placeholderTextColor={PROFILE_THEME_COLORS.outline}
                  style={{ fontFamily: 'PlusJakartaSans-Regular', fontSize: 14, color: PROFILE_THEME_COLORS.primary, padding: 0 }}
                />
              </View>

              <View style={{ borderRadius: 12, borderWidth: 1, borderColor: PROFILE_THEME_COLORS.outlineVariant, backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest, paddingHorizontal: 12, paddingVertical: 9 }}>
                <TextInput
                  value={bookingName}
                  onChangeText={setBookingName}
                  placeholder="Tên người đặt sân"
                  placeholderTextColor={PROFILE_THEME_COLORS.outline}
                  style={{ fontFamily: 'PlusJakartaSans-Regular', fontSize: 14, color: PROFILE_THEME_COLORS.primary, padding: 0 }}
                />
              </View>

              <View style={{ borderRadius: 12, borderWidth: 1, borderColor: PROFILE_THEME_COLORS.outlineVariant, backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest, paddingHorizontal: 12, paddingVertical: 9 }}>
                <TextInput
                  value={bookingPhone}
                  onChangeText={setBookingPhone}
                  placeholder="Số điện thoại"
                  placeholderTextColor={PROFILE_THEME_COLORS.outline}
                  keyboardType="phone-pad"
                  style={{ fontFamily: 'PlusJakartaSans-Regular', fontSize: 14, color: PROFILE_THEME_COLORS.primary, padding: 0 }}
                />
              </View>

              <View style={{ borderRadius: 12, borderWidth: 1, borderColor: PROFILE_THEME_COLORS.outlineVariant, backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest, paddingHorizontal: 12, paddingVertical: 10 }}>
                <TextInput
                  value={bookingNotes}
                  onChangeText={setBookingNotes}
                  placeholder="Ghi chú booking (tuỳ chọn)"
                  placeholderTextColor={PROFILE_THEME_COLORS.outline}
                  multiline
                  textAlignVertical="top"
                  style={{ minHeight: 68, fontFamily: 'PlusJakartaSans-Regular', fontSize: 14, color: PROFILE_THEME_COLORS.primary, padding: 0 }}
                />
              </View>
            </View>
          ) : null}
        </View>

        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 8 }}>
          <View style={{ flex: 1 }}>
            <AppButton
              label={'\u0051\u0075\u0061\u0079\u0020\u006c\u1ea1\u0069'}
              onPress={onBack}
              variant="secondary"
            />
          </View>
          <View style={{ flex: 1 }}>
            <AppButton
              label={'\u0054\u0069\u1ebf\u0070\u0020\u0074\u1ee5\u0063'}
              onPress={onContinue}
              variant="primary"
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}




