import { ScreenHeader } from '@/components/design'
import { MatchSessionCard } from '@/components/home/MatchSessionCard'
import { PROFILE_THEME_COLORS } from '@/components/profile/profileTheme'
import { SCREEN_FONTS } from '@/constants/screenFonts'
import { type MatchSession, getStatusLabel } from '@/lib/homeFeed'
import type { NearByCourt } from '@/lib/useNearbyCourts'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'

import { getCreateSessionSkillOption } from './skillLevelOptions'
import { RADIUS, BORDER } from '@/constants/screenLayout'

type Props = {
  selectedCourt: NearByCourt
  selectedDate: Date
  startTime: Date
  endTime: Date
  maxPlayers: number
  minSkill: number
  maxSkill: number
  bookingStatus: 'confirmed' | 'unconfirmed'
  deadlineMinutes: number
  requireApproval: boolean
  pricePerPerson: number
  onBack: () => void
  onCreate: () => void
  submitting?: boolean
  submitLabel?: string
}

const WEEKDAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
const WEEKDAY_LONG = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
const LEVELS = ['Mới chơi', 'Cơ bản', 'Cọ xát', 'Phong trào', 'Săn giải']

function pad2(n: number) {
  return n.toString().padStart(2, '0')
}

function formatHeroTimeLabel(date: Date, start: Date, end: Date) {
  const dateLabel = `${WEEKDAY_LABELS[date.getDay()]}, ${pad2(date.getDate())}/${pad2(date.getMonth() + 1)}`
  const startClock = `${pad2(start.getHours())}:${pad2(start.getMinutes())}`
  const endClock = `${pad2(end.getHours())}:${pad2(end.getMinutes())}`
  return `${dateLabel} • ${startClock} - ${endClock}`
}

function formatPrice(pricePerPerson: number) {
  if (pricePerPerson <= 0) return 'Miễn phí'
  return `${Math.round(pricePerPerson / 1000)}K`
}

function toLevelId(level: number): MatchSession['levelId'] {
  const clamped = Math.max(1, Math.min(5, level))
  return `level_${clamped}` as MatchSession['levelId']
}

export function CreateSessionStep3({
  selectedCourt, selectedDate, startTime, endTime,
  maxPlayers, minSkill, maxSkill, bookingStatus, deadlineMinutes,
  requireApproval, pricePerPerson, onBack, onCreate, submitting = false, submitLabel = 'Tạo kèo',
}: Props) {
  const minSkillOption = getCreateSessionSkillOption(minSkill)
  const maxSkillOption = getCreateSessionSkillOption(maxSkill)

  const previewMatch: MatchSession = {
    id: 'preview-upcoming-match',
    title: 'Xem trước',
    bookingId: 'PREVIEW',
    courtName: selectedCourt.name,
    address: selectedCourt.city ? `${selectedCourt.address}, ${selectedCourt.city}` : selectedCourt.address,
    matchScore: 90,
    skillLabel: maxSkillOption.label,
    timeLabel: formatHeroTimeLabel(selectedDate, startTime, endTime),
    priceLabel: formatPrice(pricePerPerson),
    openSlotsLabel: `${Math.max(maxPlayers - 1, 0)} chỗ trống`,
    statusLabel: getStatusLabel(bookingStatus, 'open'),
    isRanked: true,
    activePlayers: 1,
    maxPlayers,
    levelId: toLevelId(maxSkill),
    host: {
      id: 'preview-host',
      name: 'Bạn',
      initials: 'B',
      rating: 5,
      vibe: 'Host đang tạo kèo mới',
    },
    players: [
      {
        id: 'preview-host',
        name: 'Bạn',
        initials: 'B',
        badge: 'trusted',
      },
    ],
    urgent: false,
    joined: true,
  }

  const dayLabel = WEEKDAY_LONG[selectedDate.getDay()]
  const dd = pad2(selectedDate.getDate())
  const mm = pad2(selectedDate.getMonth() + 1)
  const yyyy = selectedDate.getFullYear().toString()
  const startStr = `${pad2(startTime.getHours())}:${pad2(startTime.getMinutes())}`
  const endStr = `${pad2(endTime.getHours())}:${pad2(endTime.getMinutes())}`
  const deadlineLabel = deadlineMinutes < 60
    ? `${deadlineMinutes} phút`
    : `${deadlineMinutes / 60} giờ`

  const minLevelLabel = LEVELS[(minSkill - 1) % LEVELS.length] ?? minSkillOption.label
  const maxLevelLabel = LEVELS[(maxSkill - 1) % LEVELS.length] ?? maxSkillOption.label

  const details = [
    { icon: '👥', label: 'LOẠI KÈO', value: maxPlayers === 2 ? 'Đánh đơn · 2 người' : 'Đánh đôi · 4 người' },
    { icon: '💰', label: 'CHI PHÍ / NGƯỜI', value: pricePerPerson > 0 ? formatPrice(pricePerPerson) : 'Miễn phí' },
    { icon: '📊', label: 'PHẠM VI TRÌNH ĐỘ', value: `${minLevelLabel} → ${maxLevelLabel}` },
    { icon: '🛡️', label: 'TỰ DUYỆT', value: requireApproval ? 'Bật' : 'Tắt' },
    { icon: '⏰', label: 'HẠN CHỐT', value: `${deadlineLabel} trước giờ bắt đầu` },
    { icon: '📅', label: 'NGÀY & GIỜ CHƠI', value: `${dayLabel}, ${dd}/${mm}/${yyyy} · ${startStr}–${endStr}` },
  ]

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
        style={{ flex: 1 }}
      >
        <ScreenHeader
          variant="brand"
          title="KINETIC"
          onBackPress={onBack}
          style={{ marginHorizontal: -20, marginTop: -12 }}
          rightSlot={<View style={{ width: 32, height: 32 }} />}
        />

        {/* Progress bar */}
        <View style={{ height: 3, backgroundColor: PROFILE_THEME_COLORS.outlineVariant, borderRadius: RADIUS.full, marginTop: 12, marginBottom: 16, overflow: 'hidden' }}>
          <View style={{ height: '100%', width: '100%', backgroundColor: PROFILE_THEME_COLORS.primary, borderRadius: RADIUS.full }} />
        </View>

        {/* Step title */}
        <View style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 6 }}>
            <Text style={{ fontFamily: SCREEN_FONTS.headlineItalic, fontSize: 52, color: PROFILE_THEME_COLORS.primary, lineHeight: 44, opacity: 0.2, letterSpacing: -1 }}>
              03
            </Text>
            <Text
              style={{ fontFamily: SCREEN_FONTS.headlineItalic, fontSize: 28, color: PROFILE_THEME_COLORS.primary, lineHeight: 30, letterSpacing: -0.3, flex: 1, paddingBottom: 2 }}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.8}
            >
              Xác nhận Tạo kèo
            </Text>
          </View>
          <View style={{ width: 32, height: 3, backgroundColor: PROFILE_THEME_COLORS.tertiary, borderRadius: 2 }} />
        </View>

        {/* Preview card */}
        <View style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 10, color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: SCREEN_FONTS.cta, letterSpacing: 0.8, marginBottom: 8 }}>
            XEM TRƯỚC
          </Text>
          <View pointerEvents="none">
            <MatchSessionCard item={previewMatch} variant="standard" actionLabel={'Vào kèo'} showFullAddress={true} />
          </View>
        </View>

        {/* Detail list */}
        <View style={{ backgroundColor: PROFILE_THEME_COLORS.surface, borderRadius: RADIUS.md, borderWidth: BORDER.hairline, borderColor: PROFILE_THEME_COLORS.outlineVariant, overflow: 'hidden', marginBottom: 16 }}>
          {details.map((item, i) => (
            <View
              key={i}
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 12,
                paddingVertical: 11, paddingHorizontal: 16,
                borderTopWidth: i === 0 ? 0 : 0.5,
                borderTopColor: PROFILE_THEME_COLORS.surfaceDim,
              }}
            >
              <View style={{ width: 32, height: 32, borderRadius: RADIUS.sm, backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 14 }}>{item.icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: SCREEN_FONTS.cta, letterSpacing: 0.3, marginBottom: 1 }}>
                  {item.label}
                </Text>
                <Text style={{ fontSize: 13, color: PROFILE_THEME_COLORS.onSurface, fontFamily: SCREEN_FONTS.label }}>
                  {item.value}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Info note */}
        <View style={{ backgroundColor: PROFILE_THEME_COLORS.secondaryContainer, borderRadius: RADIUS.sm, padding: 12, flexDirection: 'row', gap: 10, marginBottom: 16 }}>
          <Text style={{ fontSize: 14 }}>ℹ️</Text>
          <Text style={{ fontSize: 12, color: PROFILE_THEME_COLORS.primary, lineHeight: 18, flex: 1, fontFamily: SCREEN_FONTS.body }}>
            Kiểm tra lại thông tin, chi phí và trạng thái booking để bài đăng ra feed đúng ngay từ lần đầu.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom bar */}
      <View style={{ flexDirection: 'row', gap: 10, marginHorizontal: -20, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 28, backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow, borderTopWidth: 0.5, borderTopColor: PROFILE_THEME_COLORS.outlineVariant }}>
        <TouchableOpacity
          onPress={onBack}
          disabled={submitting}
          style={{ flex: 1, borderRadius: RADIUS.full, borderWidth: BORDER.medium, borderColor: PROFILE_THEME_COLORS.outlineVariant, paddingVertical: 13, alignItems: 'center', backgroundColor: PROFILE_THEME_COLORS.surface, opacity: submitting ? 0.5 : 1 }}
        >
          <Text style={{ fontSize: 14, color: PROFILE_THEME_COLORS.onSurface, fontFamily: SCREEN_FONTS.cta }}>Quay lại</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onCreate}
          disabled={submitting}
          style={{ flex: 2, borderRadius: RADIUS.full, backgroundColor: PROFILE_THEME_COLORS.primary, paddingVertical: 13, alignItems: 'center', opacity: submitting ? 0.7 : 1 }}
        >
          <Text style={{ fontSize: 14, color: PROFILE_THEME_COLORS.onPrimary, fontFamily: SCREEN_FONTS.cta }}>
            {submitting ? 'Đang tạo...' : 'Tạo kèo'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}
