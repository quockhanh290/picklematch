import { PROFILE_THEME_COLORS } from '@/components/profile/profileTheme'
import { ArrowRight, Check, ExternalLink, ShieldCheck, TrendingUp, Wallet } from 'lucide-react-native'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { CREATE_SESSION_SKILL_OPTIONS } from './skillLevelOptions'

type Props = {
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
  deadlineHours: number
  setDeadlineHours: (hours: number) => void
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

const PLAYER_OPTIONS = [2, 4, 6, 8]
const DEADLINE_OPTIONS = [2, 4, 8, 24]

const card = {
  borderRadius: 20,
  borderWidth: 1,
  borderColor: PROFILE_THEME_COLORS.outlineVariant,
  backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest,
  padding: 16,
  marginBottom: 12,
} as const

const sectionLabel = {
  fontFamily: 'PlusJakartaSans-ExtraBold' as const,
  fontSize: 10,
  textTransform: 'uppercase' as const,
  letterSpacing: 1.8,
  color: PROFILE_THEME_COLORS.outline,
  marginBottom: 12,
}

const textInput = {
  borderRadius: 14,
  borderWidth: 1,
  borderColor: PROFILE_THEME_COLORS.outlineVariant,
  backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow,
  paddingHorizontal: 14,
  paddingVertical: 12,
  fontFamily: 'PlusJakartaSans-Regular' as const,
  fontSize: 14,
  color: PROFILE_THEME_COLORS.onSurface,
}

function SkillSelector({ value, onChange, label }: { value: number; onChange: (level: number) => void; label: string }) {
  return (
    <View style={{ ...card, marginBottom: 10 }}>
      <Text style={sectionLabel}>{label}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {CREATE_SESSION_SKILL_OPTIONS.map((option) => {
          const Icon = option.icon
          const active = value === option.id
          return (
            <Pressable
              key={option.id}
              onPress={() => onChange(option.id)}
              style={({ pressed }) => ({
                flexDirection: 'row', alignItems: 'center', gap: 6,
                borderRadius: 12, borderWidth: 1,
                borderColor: active ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.outlineVariant,
                backgroundColor: active ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.surfaceContainerLow,
                paddingHorizontal: 12, paddingVertical: 8,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Icon size={14} color={active ? PROFILE_THEME_COLORS.onPrimary : PROFILE_THEME_COLORS.onSurfaceVariant} />
              <Text style={{
                fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 13,
                color: active ? PROFILE_THEME_COLORS.onPrimary : PROFILE_THEME_COLORS.onSurfaceVariant,
              }}>
                {option.label}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

function BookingStatusCard({
  active, title, description, tone, onPress,
}: {
  active: boolean; title: string; description: string; tone: 'confirmed' | 'unconfirmed'; onPress: () => void
}) {
  const isConfirmed = tone === 'confirmed'
  const activeBg = isConfirmed ? PROFILE_THEME_COLORS.secondaryContainer : '#fff8e6'
  const activeBorder = isConfirmed ? PROFILE_THEME_COLORS.surfaceTint : '#d97706'
  const activeDot = isConfirmed ? PROFILE_THEME_COLORS.surfaceTint : '#d97706'
  const activeText = isConfirmed ? PROFILE_THEME_COLORS.surfaceTint : '#78350f'
  const activeBody = isConfirmed ? PROFILE_THEME_COLORS.onPrimaryFixedVariant : '#92400e'

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row', alignItems: 'flex-start', gap: 12,
        borderRadius: 16, borderWidth: 1,
        borderColor: active ? activeBorder : PROFILE_THEME_COLORS.outlineVariant,
        backgroundColor: active ? activeBg : PROFILE_THEME_COLORS.surfaceContainerLowest,
        padding: 14,
        opacity: pressed ? 0.88 : 1,
      })}
    >
      <View style={{
        marginTop: 2, width: 20, height: 20, borderRadius: 999,
        borderWidth: 1,
        borderColor: active ? activeDot : PROFILE_THEME_COLORS.outlineVariant,
        backgroundColor: active ? activeDot : PROFILE_THEME_COLORS.surfaceContainerLowest,
        alignItems: 'center', justifyContent: 'center',
      }}>
        {active ? <Check size={12} color="#ffffff" /> : null}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{
          fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 14,
          color: active ? activeText : PROFILE_THEME_COLORS.onSurface,
        }}>
          {title}
        </Text>
        <Text style={{
          fontFamily: 'PlusJakartaSans-Regular', fontSize: 12, lineHeight: 18, marginTop: 2,
          color: active ? activeBody : PROFILE_THEME_COLORS.onSurfaceVariant,
        }}>
          {description}
        </Text>
      </View>
    </Pressable>
  )
}

function ToggleRow({ icon: Icon, iconBg, iconColor, title, subtitle, value, onToggle, disabled, helperText, helperRed }: {
  icon: any; iconBg: string; iconColor: string; title: string; subtitle: string
  value: boolean; onToggle: (v: boolean) => void; disabled?: boolean
  helperText?: string | null; helperRed?: boolean
}) {
  return (
    <View style={{ ...card, marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: iconBg, alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} color={iconColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 14, color: PROFILE_THEME_COLORS.onSurface }}>{title}</Text>
          <Text style={{ fontFamily: 'PlusJakartaSans-Regular', fontSize: 12, lineHeight: 18, color: PROFILE_THEME_COLORS.onSurfaceVariant, marginTop: 2 }}>
            {subtitle}
          </Text>
          {helperText ? (
            <Text style={{ fontFamily: 'PlusJakartaSans-Regular', fontSize: 12, color: helperRed ? '#d97706' : PROFILE_THEME_COLORS.onSurfaceVariant, marginTop: 4 }}>
              {helperText}
            </Text>
          ) : null}
        </View>
        <Switch
          value={value}
          onValueChange={onToggle}
          disabled={disabled}
          trackColor={{ false: PROFILE_THEME_COLORS.outlineVariant, true: PROFILE_THEME_COLORS.primaryFixedDim }}
          thumbColor={PROFILE_THEME_COLORS.surfaceContainerLowest}
        />
      </View>
    </View>
  )
}

export function CreateSessionStep2({
  maxPlayers, setMaxPlayers,
  minSkill, setMinSkill, maxSkill, setMaxSkill,
  bookingStatus, setBookingStatus,
  wantsBookingNow, setWantsBookingNow,
  bookingReference, setBookingReference,
  bookingName, setBookingName,
  bookingPhone, setBookingPhone,
  bookingNotes, setBookingNotes,
  canOpenBookingLink, onOpenBookingLink,
  deadlineHours, setDeadlineHours,
  requireApproval, setRequireApproval,
  isRanked, setIsRanked, canToggleRanked, rankedHelperText,
  totalCostStr, setTotalCostStr, costPerPerson,
  onContinue,
}: Props) {
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        style={{ flex: 1 }}
      >
        {/* Số người */}
        <Text style={{ fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 14, color: PROFILE_THEME_COLORS.onSurface, marginBottom: 10 }}>
          Số người chơi
        </Text>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          {PLAYER_OPTIONS.map((num) => (
            <Pressable
              key={num}
              onPress={() => setMaxPlayers(num)}
              style={({ pressed }) => ({
                flex: 1, borderRadius: 14, borderWidth: 1,
                borderColor: maxPlayers === num ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.outlineVariant,
                backgroundColor: maxPlayers === num ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.surfaceContainerLowest,
                paddingVertical: 12, alignItems: 'center',
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Text style={{
                fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 15,
                color: maxPlayers === num ? PROFILE_THEME_COLORS.onPrimary : PROFILE_THEME_COLORS.onSurfaceVariant,
              }}>
                {num}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Skill selectors */}
        <SkillSelector value={minSkill} onChange={setMinSkill} label="Trình độ tối thiểu" />
        <SkillSelector value={maxSkill} onChange={setMaxSkill} label="Trình độ tối đa" />

        {/* Booking status */}
        <Text style={{ fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 14, color: PROFILE_THEME_COLORS.onSurface, marginTop: 6, marginBottom: 10 }}>
          Trạng thái đặt sân
        </Text>
        <BookingStatusCard
          active={bookingStatus === 'confirmed'}
          title="Sân đã xác nhận"
          description="Sân đã được đặt và sẵn sàng đăng kèo ngay."
          tone="confirmed"
          onPress={() => { setBookingStatus('confirmed'); setWantsBookingNow(null) }}
        />
        <View style={{ height: 10 }} />
        <BookingStatusCard
          active={bookingStatus === 'unconfirmed'}
          title="Chưa xác nhận"
          description="Bạn có thể đăng trước rồi cập nhật booking sau."
          tone="unconfirmed"
          onPress={() => setBookingStatus('unconfirmed')}
        />

        {bookingStatus === 'unconfirmed' ? (
          <View style={{ ...card, marginTop: 10 }}>
            <Text style={sectionLabel}>Hỗ trợ booking</Text>
            <Text style={{ fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 14, color: PROFILE_THEME_COLORS.onSurface }}>
              Bạn có muốn đặt sân ngay bây giờ không?
            </Text>
            <Text style={{ fontFamily: 'PlusJakartaSans-Regular', fontSize: 12, lineHeight: 18, color: PROFILE_THEME_COLORS.onSurfaceVariant, marginTop: 4 }}>
              Nếu có, bạn có thể mở link booking và lưu thông tin ngay tại đây.
            </Text>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <Pressable
                onPress={() => setWantsBookingNow(true)}
                style={({ pressed }) => ({
                  flex: 1, alignItems: 'center', borderRadius: 14, borderWidth: 1,
                  borderColor: wantsBookingNow === true ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.outlineVariant,
                  backgroundColor: wantsBookingNow === true ? PROFILE_THEME_COLORS.secondaryContainer : PROFILE_THEME_COLORS.surfaceContainerLowest,
                  paddingVertical: 12, opacity: pressed ? 0.85 : 1,
                })}
              >
                <Text style={{ fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 13, color: wantsBookingNow === true ? PROFILE_THEME_COLORS.surfaceTint : PROFILE_THEME_COLORS.onSurfaceVariant }}>
                  Có
                </Text>
              </Pressable>
              <Pressable
                onPress={() => setWantsBookingNow(false)}
                style={({ pressed }) => ({
                  flex: 1, alignItems: 'center', borderRadius: 14, borderWidth: 1,
                  borderColor: wantsBookingNow === false ? PROFILE_THEME_COLORS.inverseSurface : PROFILE_THEME_COLORS.outlineVariant,
                  backgroundColor: wantsBookingNow === false ? PROFILE_THEME_COLORS.inverseSurface : PROFILE_THEME_COLORS.surfaceContainerLowest,
                  paddingVertical: 12, opacity: pressed ? 0.85 : 1,
                })}
              >
                <Text style={{ fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 13, color: wantsBookingNow === false ? PROFILE_THEME_COLORS.inverseOnSurface : PROFILE_THEME_COLORS.onSurfaceVariant }}>
                  Chưa
                </Text>
              </Pressable>
            </View>

            {wantsBookingNow ? (
              <View style={{
                marginTop: 12, borderRadius: 14, borderWidth: 1,
                borderColor: PROFILE_THEME_COLORS.outlineVariant,
                backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow,
                padding: 12,
              }}>
                <Text style={{ fontFamily: 'PlusJakartaSans-Regular', fontSize: 12, lineHeight: 18, color: PROFILE_THEME_COLORS.onSurfaceVariant }}>
                  Mở link đặt sân để thực hiện booking, sau đó bạn có thể nhập thông tin bên dưới để dễ theo dõi.
                </Text>
                <Pressable
                  onPress={onOpenBookingLink}
                  style={({ pressed }) => ({
                    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
                    marginTop: 10, borderRadius: 14,
                    backgroundColor: canOpenBookingLink ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.outline,
                    paddingVertical: 12, opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <ExternalLink size={16} color={PROFILE_THEME_COLORS.onPrimary} />
                  <Text style={{ fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 13, color: PROFILE_THEME_COLORS.onPrimary }}>
                    Mở link booking của sân
                  </Text>
                </Pressable>

                <View style={{ gap: 8, marginTop: 10 }}>
                  <TextInput
                    value={bookingReference} onChangeText={setBookingReference}
                    placeholder="Mã booking / mã đặt sân"
                    placeholderTextColor={PROFILE_THEME_COLORS.outline}
                    style={textInput}
                  />
                  <TextInput
                    value={bookingName} onChangeText={setBookingName}
                    placeholder="Tên người đặt"
                    placeholderTextColor={PROFILE_THEME_COLORS.outline}
                    style={textInput}
                  />
                  <TextInput
                    value={bookingPhone} onChangeText={setBookingPhone}
                    keyboardType="phone-pad"
                    placeholder="Số điện thoại booking"
                    placeholderTextColor={PROFILE_THEME_COLORS.outline}
                    style={textInput}
                  />
                  <TextInput
                    value={bookingNotes} onChangeText={setBookingNotes}
                    multiline
                    placeholder="Ghi chú booking"
                    placeholderTextColor={PROFILE_THEME_COLORS.outline}
                    style={{ ...textInput, minHeight: 88, textAlignVertical: 'top' }}
                  />
                </View>
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Deadline */}
        <View style={{ ...card, marginTop: 6 }}>
          <Text style={sectionLabel}>Deadline tham gia</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {DEADLINE_OPTIONS.map((hours) => (
              <Pressable
                key={hours}
                onPress={() => setDeadlineHours(hours)}
                style={({ pressed }) => ({
                  borderRadius: 12, borderWidth: 1,
                  borderColor: deadlineHours === hours ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.outlineVariant,
                  backgroundColor: deadlineHours === hours ? PROFILE_THEME_COLORS.secondaryContainer : PROFILE_THEME_COLORS.surfaceContainerLow,
                  paddingHorizontal: 14, paddingVertical: 9,
                  opacity: pressed ? 0.85 : 1,
                })}
              >
                <Text style={{
                  fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 13,
                  color: deadlineHours === hours ? PROFILE_THEME_COLORS.surfaceTint : PROFILE_THEME_COLORS.onSurfaceVariant,
                }}>
                  {`${hours} giờ`}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Toggles */}
        <ToggleRow
          icon={ShieldCheck}
          iconBg={PROFILE_THEME_COLORS.secondaryContainer}
          iconColor={PROFILE_THEME_COLORS.surfaceTint}
          title="Tự động duyệt"
          subtitle="Bật để người chơi vào kèo ngay, tắt để host duyệt thủ công."
          value={!requireApproval}
          onToggle={(v) => setRequireApproval(!v)}
        />

        <ToggleRow
          icon={TrendingUp}
          iconBg="#fff8e6"
          iconColor="#d97706"
          title="Kèo tính Elo"
          subtitle="Bật để trận này cập nhật Elo khi kết quả được chốt."
          value={isRanked}
          onToggle={setIsRanked}
          disabled={!canToggleRanked}
          helperText={rankedHelperText}
          helperRed={!canToggleRanked}
        />

        {/* Chi phí */}
        <View style={card}>
          <Text style={sectionLabel}>Chi phí</Text>
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 10,
            borderRadius: 14, borderWidth: 1,
            borderColor: PROFILE_THEME_COLORS.outlineVariant,
            backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow,
            paddingHorizontal: 14,
          }}>
            <Wallet size={18} color={PROFILE_THEME_COLORS.onSurfaceVariant} />
            <TextInput
              value={totalCostStr}
              onChangeText={setTotalCostStr}
              keyboardType="number-pad"
              placeholder="Ví dụ: 80000"
              placeholderTextColor={PROFILE_THEME_COLORS.outline}
              style={{ flex: 1, paddingVertical: 12, fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 14, color: PROFILE_THEME_COLORS.onSurface }}
            />
          </View>
          <Text style={{ fontFamily: 'PlusJakartaSans-Regular', fontSize: 12, color: PROFILE_THEME_COLORS.onSurfaceVariant, marginTop: 8 }}>
            {costPerPerson > 0
              ? `${costPerPerson.toLocaleString('vi-VN')}đ/người`
              : 'Để trống nếu muốn tạo kèo miễn phí'}
          </Text>
        </View>
      </ScrollView>

      <SafeAreaView
        edges={['bottom']}
        style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          borderTopWidth: 1, borderTopColor: PROFILE_THEME_COLORS.outlineVariant,
          backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest,
          paddingHorizontal: 20, paddingTop: 14, paddingBottom: 12,
        }}
      >
        <Pressable
          onPress={onContinue}
          style={({ pressed }) => ({
            height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
            borderRadius: 14, backgroundColor: PROFILE_THEME_COLORS.primary,
            opacity: pressed ? 0.88 : 1,
          })}
        >
          <Text style={{ fontFamily: 'PlusJakartaSans-ExtraBold', fontSize: 16, color: PROFILE_THEME_COLORS.onPrimary }}>
            Tiếp tục
          </Text>
          <ArrowRight size={18} color={PROFILE_THEME_COLORS.onPrimary} />
        </Pressable>
      </SafeAreaView>
    </KeyboardAvoidingView>
  )
}
