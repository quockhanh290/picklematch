import { colors } from '@/constants/colors'
import { SCREEN_FONTS } from '@/constants/screenFonts'
import { resolveTab, type SessionRequestStatus, type SessionRole } from '@/lib/mySessionsLogic'
import { getSessionSkillLabel } from '@/lib/sessionDetail'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/useAuth'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useFocusEffect } from '@react-navigation/native'
import { router } from 'expo-router'
import {
  ChevronDown,
  ChevronRight,
  Pencil as Edit3,
  Plus,
  Share2,
  SlidersHorizontal,
  Star,
  UserRound,
  X,
} from 'lucide-react-native'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  Share,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { RADIUS, SPACING, BORDER } from '@/constants/screenLayout'


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
  surfaceContainerLowest: colors.surface,
  surfaceContainerHighest: colors.surfaceAlt,
  primaryContainer: colors.primaryLight,
  onPrimaryContainer: colors.primaryDark,
  secondaryContainer: colors.primaryLight,
  onSecondaryContainer: colors.primaryDark,
} as const

function hexToRgb(hex: string) {
  const clean = hex.replace('#', '')
  const value = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean
  const n = Number.parseInt(value, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

function withAlpha(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

type SessionTab = 'upcoming' | 'pending' | 'history'
type HistoryStatusFilter = 'all' | 'done' | 'pending_completion' | 'cancelled'
type HistoryRoleFilter = 'all' | 'host' | 'player'
type HistoryTimeFilter = 'all' | '7d' | '30d' | '90d'
type HistoryRatingFilter = 'all' | 'rated' | 'not_rated'
type HistoryResultFilter = 'all' | 'submitted' | 'not_submitted'

type MySession = {
  id: string
  status: string
  court_booking_status: 'confirmed' | 'unconfirmed'
  host_id?: string | null
  role: SessionRole
  request_status: SessionRequestStatus
  start_time: string
  end_time: string
  court_name: string
  court_city: string
  court_address: string
  host_name: string
  player_count: number
  max_players: number
  elo_min: number | null
  elo_max: number | null
  has_rated: boolean
  results_status?: 'not_submitted' | 'pending_confirmation' | 'disputed' | 'finalized' | 'void' | null
}

type MySessionsCache = {
  userId: string
  sessions: MySession[]
  updatedAt: number
}

const mySessionsCacheByUser = new Map<string, MySessionsCache>()
const MY_SESSIONS_LAST_USER_KEY = 'my_sessions_last_user_id_v1'

function getMySessionsCacheKey(userId: string) {
  return `my_sessions_overview_cache_v1:${userId}`
}

const TAB_OPTIONS: { key: SessionTab; label: string }[] = [
  { key: 'upcoming', label: 'Sắp đánh' },
  { key: 'pending', label: 'Chờ duyệt' },
  { key: 'history', label: 'Lịch sử' },
]

const HISTORY_PAGE_SIZE = 20
const HISTORY_STATUS_OPTIONS: { id: HistoryStatusFilter; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'done', label: 'Đã chơi' },
  { id: 'pending_completion', label: 'Chờ chốt' },
  { id: 'cancelled', label: 'Đã hủy' },
]
const HISTORY_ROLE_OPTIONS: { id: HistoryRoleFilter; label: string }[] = [
  { id: 'all', label: 'Mọi vai trò' },
  { id: 'host', label: 'Host' },
  { id: 'player', label: 'Người chơi' },
]
const HISTORY_TIME_OPTIONS: { id: HistoryTimeFilter; label: string }[] = [
  { id: 'all', label: 'Tất cả thời gian' },
  { id: '7d', label: '7 ngày' },
  { id: '30d', label: '30 ngày' },
  { id: '90d', label: '3 tháng' },
]
const HISTORY_RATING_OPTIONS: { id: HistoryRatingFilter; label: string }[] = [
  { id: 'all', label: 'Tất cả đánh giá' },
  { id: 'rated', label: 'Đã đánh giá' },
  { id: 'not_rated', label: 'Chưa đánh giá' },
]
const HISTORY_RESULT_OPTIONS: { id: HistoryResultFilter; label: string }[] = [
  { id: 'all', label: 'Tất cả kết quả' },
  { id: 'submitted', label: 'Đã nhập kết quả' },
  { id: 'not_submitted', label: 'Chưa nhập kết quả' },
]
type HistorySection = {
  monthKey: string
  monthLabel: string
  items: MySession[]
}

type HistoryRow =
  | { type: 'filters'; key: string }
  | { type: 'month'; key: string; monthKey: string; monthLabel: string; count: number }
  | { type: 'session'; key: string; session: MySession }

function sessionsFingerprint(items: MySession[]) {
  return JSON.stringify(
    items.map((item) => ({
      id: item.id,
      status: item.status,
      court_booking_status: item.court_booking_status,
      host_id: item.host_id,
      role: item.role,
      request_status: item.request_status,
      start_time: item.start_time,
      end_time: item.end_time,
      court_name: item.court_name,
      court_city: item.court_city,
      court_address: item.court_address,
      host_name: item.host_name,
      player_count: item.player_count,
      max_players: item.max_players,
      elo_min: item.elo_min,
      elo_max: item.elo_max,
      has_rated: item.has_rated,
      results_status: item.results_status ?? null,
    })),
  )
}

function formatDatePart(value: string) {
  const date = new Date(value)
  const weekday = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][date.getDay()]
  const day = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`
  return `${weekday} ${day}`
}

function formatDateBadgeLabel(value: string) {
  const date = new Date(value)
  const today = new Date()
  const tomorrow = new Date()
  tomorrow.setDate(today.getDate() + 1)

  const isSameDay =
    (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()

  if (isSameDay(date, today)) return 'Hôm nay'
  if (isSameDay(date, tomorrow)) return 'Ngày mai'

  const weekday = date.getDay() === 0 ? 'Chủ nhật' : `Thứ ${date.getDay() + 1}`
  const day = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`
  return `${weekday}, ${day}`
}

function formatTimeRange(start: string, end: string) {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const startHour = startDate.getHours().toString().padStart(2, '0')
  const startMinute = startDate.getMinutes().toString().padStart(2, '0')
  const endHour = endDate.getHours().toString().padStart(2, '0')
  const endMinute = endDate.getMinutes().toString().padStart(2, '0')
  return `${startHour}:${startMinute} - ${endHour}:${endMinute}`
}

function getDayBadgeBackground(value: string) {
  const startDate = new Date(value)
  const today = new Date()
  const tomorrow = new Date()
  tomorrow.setDate(today.getDate() + 1)

  if (
    startDate.getFullYear() === today.getFullYear() &&
    startDate.getMonth() === today.getMonth() &&
    startDate.getDate() === today.getDate()
  ) {
    return colors.primary
  }

  if (
    startDate.getFullYear() === tomorrow.getFullYear() &&
    startDate.getMonth() === tomorrow.getMonth() &&
    startDate.getDate() === tomorrow.getDate()
  ) {
    return colors.textSecondary
  }

  return colors.textMuted
}

function isSessionInPast(session: Pick<MySession, 'start_time' | 'end_time'>, nowMs = Date.now()) {
  const endAt = new Date(session.end_time).getTime()
  if (!Number.isNaN(endAt)) return endAt < nowMs

  const startAt = new Date(session.start_time).getTime()
  if (!Number.isNaN(startAt)) return startAt < nowMs

  return false
}

function getMonthKey(value: string) {
  const date = new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split('-')
  return `Tháng ${month}/${year}`
}

function MySessionsEmptyStateCard({ activeTab }: { activeTab: SessionTab }) {
  const config =
    activeTab === 'upcoming'
      ? {
          eyebrow: 'SẴN SÀNG RA SÂN',
          title: 'Bạn chưa có kèo sắp đánh',
          description: 'Tạo kèo mới hoặc tham gia một trận phù hợp để lịch chơi của bạn bắt đầu đầy lên.',
        }
      : activeTab === 'pending'
        ? {
            eyebrow: 'ĐANG CHỜ',
            title: 'Chưa có yêu cầu nào cần duyệt',
            description: 'Những kèo bạn đang chờ chủ kèo phản hồi sẽ xuất hiện tại đây.',
          }
        : {
            eyebrow: 'LỊCH SỬ THI ĐẤU',
            title: 'Bạn chưa có lịch sử trận đấu',
            description: 'Sau khi hoàn thành các trận đã chơi, phần lịch sử sẽ hiển thị tại đây.',
          }

  return (
    <View
      className="rounded-[24px] px-6 py-7"
      style={{
        backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest,
        borderLeftWidth: 3,
        borderLeftColor: PROFILE_THEME_COLORS.primary,
        shadowColor: PROFILE_THEME_COLORS.onBackground,
        shadowOpacity: 0.04,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
      }}
    >
      <Text
        style={{
          color: PROFILE_THEME_COLORS.outline,
          fontFamily: SCREEN_FONTS.cta,
          fontSize: 10,
          letterSpacing: 2,
          textTransform: 'uppercase',
        }}
      >
        {config.eyebrow}
      </Text>
      <Text
        className="mt-3"
        style={{
          color: PROFILE_THEME_COLORS.onBackground,
          fontFamily: SCREEN_FONTS.headline,
          fontSize: 22,
          lineHeight: 28,
        }}
      >
        {config.title}
      </Text>
      <Text
        className="mt-2"
        style={{
          color: PROFILE_THEME_COLORS.onSurfaceVariant,
          fontFamily: SCREEN_FONTS.body,
          fontSize: 14,
          lineHeight: 22,
        }}
      >
        {config.description}
      </Text>
    </View>
  )
}

function MySessionCard({
  item,
  tab,
  onOpenSessionDetail,
  onOpenHostProfile,
  onOpenRateSession,
  onShare,
  formatDatePart,
  formatTimeRange,
}: {
  item: MySession
  tab: SessionTab
  onOpenSessionDetail: (sessionId: string) => void
  onOpenHostProfile: (hostId?: string | null) => void
  onOpenRateSession: (sessionId: string) => void
  onShare: (session?: MySession) => void | Promise<void>
  formatDatePart: (value: string) => string
  formatTimeRange: (start: string, end: string) => string
}) {
  const isBooked = item.court_booking_status === 'confirmed'
  const isClosedRecruitment = item.status === 'closed_recruitment'
  const address = [item.court_address, item.court_city].filter(Boolean).join(', ')
  const compactAddress = address.split(',').map((p) => p.trim()).filter(Boolean).slice(0, 2).join(', ')
  const hostInitials = (item.host_name || '?').slice(0, 1).toUpperCase()
  const bookingStatusLabel = isClosedRecruitment ? 'Đã ngừng nhận người' : isBooked ? 'Đã đặt sân' : 'Chưa đặt sân'
  const bookingStatusColor = isClosedRecruitment ? colors.accentDark : isBooked ? colors.successText : colors.warningDark
  const dateBadgeLabel = formatDateBadgeLabel(item.start_time).toLocaleUpperCase('vi-VN')
  const dateBadgeBackground = getDayBadgeBackground(item.start_time)

  return (
    <Pressable
      onPress={() => onOpenSessionDetail(item.id)}
      className="mb-4 overflow-hidden rounded-[14px]"
      style={{
        backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest,
        borderWidth: BORDER.hairline,
        borderColor: PROFILE_THEME_COLORS.outlineVariant,
        shadowColor: PROFILE_THEME_COLORS.onBackground,
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
      }}
    >
      <View style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 }}>
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={{
            color: PROFILE_THEME_COLORS.onBackground,
            fontFamily: SCREEN_FONTS.headline,
            fontSize: 24,
            lineHeight: 26,
            letterSpacing: 0.4,
            textTransform: 'uppercase',
          }}
        >
          {item.court_name}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3, marginBottom: 8 }}>
          <Text
            numberOfLines={1}
            style={{
              flex: 1,
              color: PROFILE_THEME_COLORS.onSurfaceVariant,
              fontFamily: SCREEN_FONTS.body,
              fontSize: 13,
            }}
          >
            {compactAddress || 'Đang cập nhật địa chỉ'}
          </Text>
        </View>

        <View
          style={{
            backgroundColor: colors.surfaceAlt,
            borderRadius: RADIUS.sm,
            paddingHorizontal: 12,
            paddingVertical: 8,
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 8,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View
              style={{
                backgroundColor: dateBadgeBackground,
                borderRadius: 4,
                paddingHorizontal: 7,
                paddingVertical: 2,
                marginRight: 8,
              }}
            >
              <Text style={{ color: PROFILE_THEME_COLORS.onPrimary, fontFamily: SCREEN_FONTS.cta, fontSize: 10, lineHeight: 12 }}>
                {dateBadgeLabel}
              </Text>
            </View>
            <Text style={{ color: PROFILE_THEME_COLORS.onBackground, fontFamily: SCREEN_FONTS.headline, fontSize: 19, lineHeight: 22 }}>
              {formatTimeRange(item.start_time, item.end_time)}
            </Text>
          </View>
          <View style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 6, height: 6, borderRadius: RADIUS.full, backgroundColor: isBooked ? colors.success : colors.warning }} />
            <Text style={{ marginLeft: 6, color: bookingStatusColor, fontFamily: SCREEN_FONTS.label, fontSize: 12 }}>
              {bookingStatusLabel}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', paddingBottom: 2 }}>
          <Text style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: SCREEN_FONTS.body, fontSize: 12, lineHeight: 16 }}>
            Trình độ
          </Text>
          <View
            style={{
              marginLeft: 8,
              backgroundColor: colors.primaryLight,
              borderRadius: RADIUS.xs,
              paddingHorizontal: SPACING.sm,
              paddingVertical: 2,
            }}
          >
            <Text style={{ color: colors.primary, fontFamily: SCREEN_FONTS.label, fontSize: 12, lineHeight: 16 }}>
              {getSessionSkillLabel(item.elo_min ?? 0, item.elo_max ?? 0)}
            </Text>
          </View>
          <Text style={{ marginLeft: 'auto', color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: SCREEN_FONTS.body, fontSize: 11, lineHeight: 14 }}>
            {`${item.player_count}/${item.max_players} đã vào`}
          </Text>
        </View>
      </View>

      {tab === 'history' ? (() => {
        const canRate = item.status === 'done' && !item.has_rated
        const label = item.status === 'cancelled'
          ? 'Kèo đã bị hủy'
          : item.has_rated
            ? 'Bạn đã đánh giá kèo này'
            : 'Đánh giá trận đấu'
        return (
          <Pressable
            onPress={canRate ? () => onOpenRateSession(item.id) : undefined}
            className="mt-3 flex-row items-center justify-center rounded-[10px] px-4 py-3"
            style={{
              backgroundColor: canRate
                ? PROFILE_THEME_COLORS.primary
                : PROFILE_THEME_COLORS.surfaceContainerLowest,
              borderWidth: canRate ? 0 : 1,
              borderColor: PROFILE_THEME_COLORS.outlineVariant,
              opacity: item.status === 'cancelled' ? 0.5 : 1,
            }}
          >
            <Star
              size={15}
              color={canRate ? PROFILE_THEME_COLORS.onPrimary : PROFILE_THEME_COLORS.onSurfaceVariant}
              strokeWidth={2.3}
            />
            <Text
              className="ml-2 text-[14px]"
              style={{
                color: canRate ? PROFILE_THEME_COLORS.onPrimary : PROFILE_THEME_COLORS.onSurfaceVariant,
                fontFamily: SCREEN_FONTS.cta,
              }}
            >
              {label}
            </Text>
          </Pressable>
        )
      })() : (
      <View
        style={{
          borderTopWidth: 0.5,
          borderColor: PROFILE_THEME_COLORS.outlineVariant,
          paddingHorizontal: 16,
          paddingVertical: SPACING.sm,
        }}
      >
        <View className="flex-row items-center justify-between">
          <View className="mr-3 flex-1 flex-row items-center">
            <Pressable
              onPress={(event) => {
                event.stopPropagation()
                onOpenHostProfile(item.host_id)
              }}
              className="items-center justify-center rounded-full"
              style={{
                width: 32,
                height: 32,
                backgroundColor: PROFILE_THEME_COLORS.primaryContainer,
                borderWidth: BORDER.base,
                borderColor: withAlpha(PROFILE_THEME_COLORS.primary, 0.22),
                marginRight: 8,
              }}
            >
              <Text
                style={{
                  color: PROFILE_THEME_COLORS.onPrimaryContainer,
                  fontFamily: SCREEN_FONTS.cta,
                  fontSize: 16,
                  lineHeight: 16,
                }}
              >
                {hostInitials}
              </Text>
            </Pressable>

            <View className="flex-1">
              <Text
                numberOfLines={1}
                style={{
                  color: PROFILE_THEME_COLORS.onSurface,
                  fontFamily: SCREEN_FONTS.label,
                  fontSize: 13,
                  lineHeight: 18,
                }}
              >
                {item.host_name || 'Ẩn danh'}
              </Text>
            </View>
          </View>

          <View className="items-end">
            <Text
              style={{
                color: PROFILE_THEME_COLORS.onSurface,
                fontFamily: SCREEN_FONTS.cta,
                fontSize: 16,
              }}
            >
              {item.player_count}/{item.max_players}
            </Text>
          </View>
        </View>

        <View className="mt-3 flex-row gap-3">
            <Pressable
              onPress={() => onOpenSessionDetail(item.id)}
              className="flex-1 flex-row items-center justify-center rounded-[10px] px-4 py-3"
              style={{ backgroundColor: PROFILE_THEME_COLORS.primary }}
            >
              <Edit3 size={15} color={PROFILE_THEME_COLORS.onPrimary} strokeWidth={2.3} />
              <Text
                className="ml-2 text-[14px]"
                style={{
                  color: PROFILE_THEME_COLORS.onPrimary,
                  fontFamily: SCREEN_FONTS.cta,
                }}
              >
                Sửa kèo
              </Text>
            </Pressable>

            <Pressable
              onPress={() => void onShare(item)}
              className="flex-1 flex-row items-center justify-center rounded-[10px] px-4 py-3"
              style={{ backgroundColor: PROFILE_THEME_COLORS.secondaryContainer }}
            >
              <Share2 size={15} color={PROFILE_THEME_COLORS.onSecondaryContainer} strokeWidth={2.3} />
              <Text
                className="ml-2 text-[14px]"
                style={{ color: PROFILE_THEME_COLORS.onSecondaryContainer, fontFamily: SCREEN_FONTS.cta }}
              >
                Chia sẻ
              </Text>
            </Pressable>
          </View>

      </View>
      )}
    </Pressable>
  )
}

export default function MySessions() {
  const { userId, isLoading: isAuthLoading } = useAuth()
  const [sessions, setSessions] = useState<MySession[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<SessionTab>('upcoming')
  const [historyStatusFilter, setHistoryStatusFilter] = useState<HistoryStatusFilter>('all')
  const [historyRoleFilter, setHistoryRoleFilter] = useState<HistoryRoleFilter>('all')
  const [historyTimeFilter, setHistoryTimeFilter] = useState<HistoryTimeFilter>('all')
  const [historyRatingFilter, setHistoryRatingFilter] = useState<HistoryRatingFilter>('all')
  const [historyResultFilter, setHistoryResultFilter] = useState<HistoryResultFilter>('all')
  const [historyFilterModalVisible, setHistoryFilterModalVisible] = useState(false)
  const [historyVisibleCount, setHistoryVisibleCount] = useState(HISTORY_PAGE_SIZE)
  const [historyExpandedMonths, setHistoryExpandedMonths] = useState<Record<string, boolean>>({})
  const initInFlightRef = useRef(false)
  const fetchInFlightRef = useRef<Promise<void> | null>(null)
  const sessionsRef = useRef<MySession[]>([])

  useEffect(() => {
    sessionsRef.current = sessions
  }, [sessions])

  const hydrateCachedSessionsForLastUser = useCallback(async () => {
    const lastUserId = await AsyncStorage.getItem(MY_SESSIONS_LAST_USER_KEY)
    const memoryCache = lastUserId ? mySessionsCacheByUser.get(lastUserId) ?? null : null

    if (memoryCache?.sessions.length) {
      setSessions(memoryCache.sessions)
      setLoading(false)
      return
    }

    if (!lastUserId) return

    try {
      const raw = await AsyncStorage.getItem(getMySessionsCacheKey(lastUserId))
      if (!raw) return
      const parsed = JSON.parse(raw) as MySessionsCache
      if (parsed.userId !== lastUserId || !Array.isArray(parsed.sessions) || parsed.sessions.length === 0) return
      mySessionsCacheByUser.set(parsed.userId, parsed)
      setSessions(parsed.sessions)
      setLoading(false)
    } catch (error) {
      console.warn('[MySessions] bootstrap cache hydrate failed:', error)
    }
  }, [])

  const hydrateCachedSessions = useCallback(async (nextUserId: string) => {
    const memoryCache = mySessionsCacheByUser.get(nextUserId) ?? null
    if (memoryCache?.sessions.length) {
      setSessions(memoryCache.sessions)
      setLoading(false)
      return true
    }

    try {
      const raw = await AsyncStorage.getItem(getMySessionsCacheKey(nextUserId))
      if (!raw) return false
      const parsed = JSON.parse(raw) as MySessionsCache
      if (parsed.userId !== nextUserId || !Array.isArray(parsed.sessions) || parsed.sessions.length === 0) return false
      mySessionsCacheByUser.set(parsed.userId, parsed)
      setSessions(parsed.sessions)
      setLoading(false)
      return true
    } catch (error) {
      console.warn('[MySessions] cache hydrate failed:', error)
      return false
    }
  }, [])

  const fetchMySessions = useCallback(
    async (nextUserId: string, options?: { showLoader?: boolean; runMaintenance?: boolean }) => {
      if (fetchInFlightRef.current) {
        await fetchInFlightRef.current
        return
      }

      const run = async () => {
        const showLoader = options?.showLoader ?? false
        const runMaintenance = options?.runMaintenance ?? false

        if (showLoader) setLoading(true)

        if (runMaintenance) {
          await Promise.all([
            supabase.rpc('process_fill_deadline_session_closures'),
            supabase.rpc('process_pending_session_completions'),
            supabase.rpc('process_overdue_session_closures'),
          ])
        }

        const { data, error } = await supabase.rpc('get_my_sessions_overview')
        if (error) {
          console.warn('[MySessions] get_my_sessions_overview failed:', error.message)
        }

        let rpcSessions: MySession[] = (data ?? []).map((session: any) => ({
          id: session.id,
          status: session.status,
          court_booking_status: session.court_booking_status,
          host_id: session.host_id ?? null,
          role: session.role,
          request_status: session.request_status,
          results_status: session.results_status ?? null,
          start_time: session.start_time,
          end_time: session.end_time,
          court_name: session.court_name ?? 'Kèo Pickleball',
          court_city: session.court_city ?? '',
          court_address: session.court_address ?? '',
          host_name: session.host_name ?? (session.role === 'host' ? 'Bạn' : 'Ẩn danh'),
          player_count: session.player_count ?? 0,
          max_players: session.max_players ?? 0,
          elo_min: session.elo_min ?? null,
          elo_max: session.elo_max ?? null,
          has_rated: session.has_rated ?? false,
        }))

        const rpcSessionIds = Array.from(new Set(rpcSessions.map((session) => session.id).filter(Boolean)))
        if (rpcSessionIds.length > 0) {
          const { data: sessionMetaRows } = await supabase
            .from('sessions')
            .select('id, host_id, results_status')
            .in('id', rpcSessionIds)

          const hostIdBySessionId = new Map<string, string>(
            (sessionMetaRows ?? [])
              .filter((row: any) => row?.id && row?.host_id)
              .map((row: any) => [row.id as string, row.host_id as string]),
          )
          const resultsStatusBySessionId = new Map<string, MySession['results_status']>(
            (sessionMetaRows ?? [])
              .filter((row: any) => row?.id)
              .map((row: any) => [row.id as string, (row.results_status as MySession['results_status']) ?? null]),
          )

          const { data: myRatingsRows } = await supabase
            .from('ratings')
            .select('session_id')
            .eq('rater_id', nextUserId)
            .in('session_id', rpcSessionIds)

          const ratedSessionIds = new Set<string>(
            (myRatingsRows ?? [])
              .map((row: any) => row?.session_id as string | null)
              .filter((sessionId: string | null): sessionId is string => Boolean(sessionId)),
          )

          rpcSessions = rpcSessions.map((session) => ({
            ...session,
            host_id:
              session.host_id ??
              (session.role === 'host' ? nextUserId : null) ??
              hostIdBySessionId.get(session.id) ??
              null,
            results_status: session.results_status ?? resultsStatusBySessionId.get(session.id) ?? null,
            has_rated: session.has_rated || ratedSessionIds.has(session.id),
          }))
        }

        // Fallback for environments where `get_my_sessions_overview` may not yet
        // include host/player pending join-requests correctly.
        const { data: hostPendingRows } = await supabase
          .from('join_requests')
          .select('match_id, sessions!inner(host_id)')
          .eq('status', 'pending')
          .eq('sessions.host_id', nextUserId)

        const { data: playerPendingRows } = await supabase
          .from('join_requests')
          .select('match_id')
          .eq('status', 'pending')
          .eq('player_id', nextUserId)

        const hostPendingIds = new Set<string>((hostPendingRows ?? []).map((row: any) => row.match_id).filter(Boolean))
        const playerPendingIds = new Set<string>((playerPendingRows ?? []).map((row: any) => row.match_id).filter(Boolean))

        const byKey = new Map<string, MySession>()
        for (const session of rpcSessions) {
          const normalizedRequestStatus =
            session.role === 'host' && hostPendingIds.has(session.id)
              ? 'pending'
              : session.role === 'player' && playerPendingIds.has(session.id)
                ? 'pending'
                : session.request_status

          const normalized: MySession = {
            ...session,
            request_status: normalizedRequestStatus,
          }

          const key = `${normalized.role}:${normalized.id}`
          const current = byKey.get(key)
          if (!current) {
            byKey.set(key, normalized)
            continue
          }

          // Prefer pending request status when duplicate rows exist in older RPC versions.
          const shouldReplace = current.request_status !== 'pending' && normalized.request_status === 'pending'
          if (shouldReplace) {
            byKey.set(key, normalized)
          }
        }

        const existingPlayerPendingIds = new Set(
          Array.from(byKey.values())
            .filter((session) => session.role === 'player' && session.request_status === 'pending')
            .map((session) => session.id),
        )

        const missingPlayerPendingIds = Array.from(playerPendingIds).filter((id) => !existingPlayerPendingIds.has(id))

        if (missingPlayerPendingIds.length > 0) {
          const { data: missingPendingSessions } = await supabase
            .from('sessions')
            .select(`
              id,
              status,
              results_status,
              host_id,
              court_booking_status,
              max_players,
              elo_min,
              elo_max,
              host:host_id(id, name),
              slot:slot_id(
                start_time,
                end_time,
                court:court_id(name, city, address)
              ),
              session_players(status)
            `)
            .in('id', missingPlayerPendingIds)

          for (const rawSession of missingPendingSessions ?? []) {
            const session: any = rawSession
            const slot = session?.slot
            const court = slot?.court
            const host = session?.host
            const players = Array.isArray(session?.session_players) ? session.session_players : []
            const playerCount = players.filter((p: any) => (p?.status ?? 'confirmed') !== 'rejected').length

            const normalized: MySession = {
              id: session.id,
              status: session.status ?? 'open',
              court_booking_status: session.court_booking_status ?? 'unconfirmed',
              host_id: session.host_id ?? host?.id ?? null,
              role: 'player',
              request_status: 'pending',
              results_status: session.results_status ?? null,
              start_time: slot?.start_time ?? new Date().toISOString(),
              end_time: slot?.end_time ?? slot?.start_time ?? new Date().toISOString(),
              court_name: court?.name ?? 'Kèo Pickleball',
              court_city: court?.city ?? '',
              court_address: court?.address ?? '',
              host_name: host?.name ?? 'Ẩn danh',
              player_count: playerCount,
              max_players: session.max_players ?? 0,
              elo_min: session.elo_min ?? null,
              elo_max: session.elo_max ?? null,
              has_rated: false,
            }

            byKey.set(`player:${normalized.id}`, normalized)
          }
        }

        const nextSessions: MySession[] = Array.from(byKey.values())

        nextSessions.sort((a, b) => {
          const aTime = new Date(a.start_time).getTime()
          const bTime = new Date(b.start_time).getTime()
          const safeATime = Number.isNaN(aTime) ? Number.MAX_SAFE_INTEGER : aTime
          const safeBTime = Number.isNaN(bTime) ? Number.MAX_SAFE_INTEGER : bTime
          return safeATime - safeBTime
        })

        const nextCache = { userId: nextUserId, sessions: nextSessions, updatedAt: Date.now() }
        mySessionsCacheByUser.set(nextUserId, nextCache)

        try {
          await Promise.all([
            AsyncStorage.setItem(getMySessionsCacheKey(nextUserId), JSON.stringify(nextCache)),
            AsyncStorage.setItem(MY_SESSIONS_LAST_USER_KEY, nextUserId),
          ])
        } catch (error) {
          console.warn('[MySessions] cache persist failed:', error)
        }

        const nextFingerprint = sessionsFingerprint(nextSessions)
        const currentFingerprint = sessionsFingerprint(sessionsRef.current)
        if (nextFingerprint !== currentFingerprint) {
          setSessions(nextSessions)
        }

        if (showLoader) setLoading(false)
      }

      fetchInFlightRef.current = run()
      try {
        await fetchInFlightRef.current
      } finally {
        fetchInFlightRef.current = null
      }
    },
    [],
  )

  const init = useCallback(async () => {
    if (initInFlightRef.current) return
    initInFlightRef.current = true

    try {
      if (isAuthLoading) return

      if (!userId) {
        setSessions([])
        setLoading(false)
        return
      }

      const bootstrapCache = mySessionsCacheByUser.get(userId) ?? null
      if (bootstrapCache?.sessions.length) {
        void fetchMySessions(userId, { showLoader: false, runMaintenance: false })
        return
      }

      const hydrated = await hydrateCachedSessions(userId)
      if (hydrated) {
        void fetchMySessions(userId, { showLoader: false, runMaintenance: false })
        return
      }

      await fetchMySessions(userId, { showLoader: true, runMaintenance: true })
    } finally {
      initInFlightRef.current = false
    }
  }, [fetchMySessions, hydrateCachedSessions, isAuthLoading, userId])

  useEffect(() => {
    void hydrateCachedSessionsForLastUser()
  }, [hydrateCachedSessionsForLastUser])

  useEffect(() => {
    void init()
  }, [init])

  useFocusEffect(
    useCallback(() => {
      if (!userId) return
      void fetchMySessions(userId, { showLoader: false, runMaintenance: false })
    }, [fetchMySessions, userId]),
  )

  const onRefresh = useCallback(async () => {
    if (!userId) return
    setRefreshing(true)
    try {
      await fetchMySessions(userId, { showLoader: false, runMaintenance: true })
    } finally {
      setRefreshing(false)
    }
  }, [fetchMySessions, userId])


  function shareMessage(session?: MySession) {
    if (!session) return 'Lịch chơi PickleMatch của tôi đang được cập nhật.'
    return [
      'Cùng xem kèo pickleball này nhé:',
      session.court_name,
      `${formatDatePart(session.start_time)} · ${formatTimeRange(session.start_time, session.end_time)}`,
      session.court_address ? `${session.court_address}${session.court_city ? `, ${session.court_city}` : ''}` : '',
    ].filter(Boolean).join('\n')
  }

  async function handleShare(session?: MySession) {
    try {
      await Share.share({ message: shareMessage(session) })
    } catch (error) {
      console.warn('[MySessions] share failed:', error)
    }
  }

  function openSessionDetail(sessionId: string) {
    router.push({ pathname: '/session/[id]' as any, params: { id: sessionId } })
  }

  function openHostProfile(hostId?: string | null) {
    if (!hostId) return
    router.push({ pathname: '/player/[id]' as any, params: { id: hostId } })
  }

  function openRateSession(sessionId: string) {
    router.push({ pathname: '/rate-session/[id]' as any, params: { id: sessionId } })
  }

  const sessionsByTab = useMemo(
    () =>
      TAB_OPTIONS.reduce<Record<SessionTab, MySession[]>>(
        (acc, tab) => {
          const nowMs = Date.now()
          acc[tab.key] = sessions
            .filter((session) => {
              const mappedTab = resolveTab(session)
              const inPast = isSessionInPast(session, nowMs)

              if (tab.key === 'upcoming') return mappedTab === 'upcoming' && !inPast
              if (tab.key === 'history') return mappedTab === 'history' || (mappedTab === 'upcoming' && inPast)
              return mappedTab === 'pending'
            })
            .sort((a, b) => {
              const aTime = new Date(a.start_time).getTime()
              const bTime = new Date(b.start_time).getTime()
              const safeATime = Number.isNaN(aTime) ? Number.MAX_SAFE_INTEGER : aTime
              const safeBTime = Number.isNaN(bTime) ? Number.MAX_SAFE_INTEGER : bTime
              return safeATime - safeBTime
            })
          return acc
        },
        { upcoming: [], pending: [], history: [] },
      ),
    [sessions],
  )

  const activeSessions = sessionsByTab[activeTab]
  const historySessions = sessionsByTab.history

  const filteredHistorySessions = useMemo(() => {
    const now = Date.now()

    return historySessions.filter((session) => {
      if (historyStatusFilter !== 'all' && session.status !== historyStatusFilter) return false
      if (historyRoleFilter !== 'all' && session.role !== historyRoleFilter) return false
      if (historyRatingFilter === 'rated' && !session.has_rated) return false
      if (historyRatingFilter === 'not_rated' && session.has_rated) return false

      const hasSubmittedResult =
        session.results_status !== null &&
        session.results_status !== undefined &&
        session.results_status !== 'not_submitted'
      if (historyResultFilter === 'submitted' && !hasSubmittedResult) return false
      if (historyResultFilter === 'not_submitted' && hasSubmittedResult) return false

      if (historyTimeFilter !== 'all') {
        const startAt = new Date(session.start_time).getTime()
        if (Number.isNaN(startAt)) return false
        const ageDays = (now - startAt) / (1000 * 60 * 60 * 24)
        if (historyTimeFilter === '7d' && ageDays > 7) return false
        if (historyTimeFilter === '30d' && ageDays > 30) return false
        if (historyTimeFilter === '90d' && ageDays > 90) return false
      }

      return true
    })
  }, [
    historyRatingFilter,
    historyResultFilter,
    historyRoleFilter,
    historySessions,
    historyStatusFilter,
    historyTimeFilter,
  ])

  useEffect(() => {
    if (activeTab !== 'history') return
    setHistoryVisibleCount(HISTORY_PAGE_SIZE)
  }, [activeTab, historyRatingFilter, historyResultFilter, historyRoleFilter, historyStatusFilter, historyTimeFilter])

  const visibleHistorySessions = useMemo(
    () => filteredHistorySessions.slice(0, historyVisibleCount),
    [filteredHistorySessions, historyVisibleCount],
  )

  const historySections = useMemo<HistorySection[]>(() => {
    const map = new Map<string, HistorySection>()
    for (const session of visibleHistorySessions) {
      const monthKey = getMonthKey(session.start_time)
      const existing = map.get(monthKey)
      if (existing) {
        existing.items.push(session)
      } else {
        map.set(monthKey, {
          monthKey,
          monthLabel: formatMonthLabel(monthKey),
          items: [session],
        })
      }
    }
    return Array.from(map.values())
  }, [visibleHistorySessions])

  useEffect(() => {
    if (activeTab !== 'history') return
    setHistoryExpandedMonths((prev) => {
      const next: Record<string, boolean> = {}
      historySections.forEach((section, index) => {
        next[section.monthKey] = prev[section.monthKey] ?? index === 0
      })
      return next
    })
  }, [activeTab, historySections])

  const historyRows = useMemo<HistoryRow[]>(() => {
    const rows: HistoryRow[] = [{ type: 'filters', key: 'history-filters' }]
    historySections.forEach((section) => {
      rows.push({
        type: 'month',
        key: `month-${section.monthKey}`,
        monthKey: section.monthKey,
        monthLabel: section.monthLabel,
        count: section.items.length,
      })

      if (historyExpandedMonths[section.monthKey]) {
        section.items.forEach((session) => {
          rows.push({
            type: 'session',
            key: `session-${section.monthKey}-${session.id}`,
            session,
          })
        })
      }
    })
    return rows
  }, [historyExpandedMonths, historySections])

  const listData: (MySession | HistoryRow)[] = activeTab === 'history' ? historyRows : activeSessions
  const canLoadMoreHistory = historyVisibleCount < filteredHistorySessions.length
  const isHistoryTab = activeTab === 'history'
  const activeHistoryFiltersCount = useMemo(
    () =>
      [
        historyStatusFilter !== 'all',
        historyRoleFilter !== 'all',
        historyTimeFilter !== 'all',
        historyRatingFilter !== 'all',
        historyResultFilter !== 'all',
      ].filter(Boolean).length,
    [historyRatingFilter, historyResultFilter, historyRoleFilter, historyStatusFilter, historyTimeFilter],
  )
  const monthTotalsByKey = useMemo(() => {
    const totals: Record<string, number> = {}
    filteredHistorySessions.forEach((session) => {
      const monthKey = getMonthKey(session.start_time)
      totals[monthKey] = (totals[monthKey] ?? 0) + 1
    })
    return totals
  }, [filteredHistorySessions])
  const stickyHeaderIndices = isHistoryTab ? [1] : undefined
  const activeTabCount = isHistoryTab ? filteredHistorySessions.length : activeSessions.length

  const loadMoreHistory = useCallback(() => {
    if (!isHistoryTab || !canLoadMoreHistory) return
    setHistoryVisibleCount((prev) => Math.min(prev + HISTORY_PAGE_SIZE, filteredHistorySessions.length))
  }, [canLoadMoreHistory, filteredHistorySessions.length, isHistoryTab])

  const toggleMonthExpanded = useCallback((monthKey: string) => {
    setHistoryExpandedMonths((prev) => ({
      ...prev,
      [monthKey]: !prev[monthKey],
    }))
  }, [])

  const renderHistoryFilterChip = (
    id: string,
    label: string,
    isActive: boolean,
    onPress: () => void,
  ) => (
    <Pressable
      key={id}
      onPress={onPress}
      className="rounded-full px-4 py-2.5 mr-2 mb-2"
      style={{
        backgroundColor: isActive ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.surfaceContainerLow,
        borderWidth: BORDER.base,
        borderColor: isActive ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.outlineVariant,
      }}
    >
      <Text
        style={{
          color: isActive ? PROFILE_THEME_COLORS.onPrimary : PROFILE_THEME_COLORS.onSurfaceVariant,
          fontFamily: SCREEN_FONTS.cta,
          fontSize: 12,
        }}
      >
        {label}
      </Text>
    </Pressable>
  )

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: PROFILE_THEME_COLORS.background }} edges={['top']}>
      {loading ? (
        <View className="flex-1 items-center justify-center px-6">
          <ActivityIndicator size="large" color={PROFILE_THEME_COLORS.primary} />
          <Text
            className="mt-4 text-[14px]"
            style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: SCREEN_FONTS.label }}
          >
            Đang tải kèo của bạn...
          </Text>
        </View>
      ) : (
        <View className="flex-1">
          <FlatList
            data={listData}
            keyExtractor={(item) => ('type' in item ? `${activeTab}-${item.key}` : `${activeTab}-${item.id}`)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: SPACING.xl, paddingTop: 16, paddingBottom: 160 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PROFILE_THEME_COLORS.primary} />}
            stickyHeaderIndices={stickyHeaderIndices}
            onEndReached={loadMoreHistory}
            onEndReachedThreshold={0.25}
            ListHeaderComponent={
              <View>
                <View className="flex-row items-start justify-between py-1 mb-6">
                  <View className="flex-1 pr-4">
                    <Text
                      className="text-[28px] leading-[34px]"
                      style={{ color: PROFILE_THEME_COLORS.onBackground, fontFamily: SCREEN_FONTS.headline, letterSpacing: 1 }}
                    >
                      Kèo của tôi
                    </Text>
                    <Text
                      className="mt-1 text-[13px] leading-[18px]"
                      style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: SCREEN_FONTS.body }}
                    >
                      {`${activeTabCount} kèo`}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => router.push('/(tabs)/profile' as never)}
                    className="mt-1 h-16 w-16 items-center justify-center rounded-full p-1.5"
                    style={{ backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow }}
                  >
                    <View
                      className="flex-1 self-stretch items-center justify-center rounded-full"
                      style={{ backgroundColor: PROFILE_THEME_COLORS.primaryContainer }}
                    >
                      <UserRound size={30} color={PROFILE_THEME_COLORS.onPrimaryContainer} strokeWidth={2.4} />
                    </View>
                  </Pressable>
                </View>

                <View
                  className="rounded-[14px] p-1.5 flex-row gap-1.5"
                  style={{
                    backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow,
                    borderWidth: BORDER.base,
                    borderColor: PROFILE_THEME_COLORS.outlineVariant,
                  }}
                >
                  {TAB_OPTIONS.map((tab) => {
                    const active = tab.key === activeTab
                    return (
                      <Pressable
                        key={tab.key}
                        onPress={() => setActiveTab(tab.key)}
                        className="flex-1 rounded-[10px] px-3 py-3 items-center"
                        style={active ? {
                          backgroundColor: PROFILE_THEME_COLORS.primary,
                          shadowColor: withAlpha(PROFILE_THEME_COLORS.primary, 0.4),
                          shadowOpacity: 0.22,
                          shadowRadius: 10,
                          shadowOffset: { width: 0, height: 4 },
                          elevation: 3,
                        } : undefined}
                      >
                        <Text
                          style={{
                            color: active ? PROFILE_THEME_COLORS.onPrimary : PROFILE_THEME_COLORS.onSurfaceVariant,
                            fontFamily: SCREEN_FONTS.cta,
                            fontSize: 13,
                          }}
                        >
                          {tab.label}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>

                <View className={isHistoryTab ? 'pt-2' : 'pt-5'} />
              </View>
            }
            ListFooterComponent={
              isHistoryTab && canLoadMoreHistory ? (
                <View className="py-6 items-center">
                  <ActivityIndicator size="small" color={PROFILE_THEME_COLORS.primary} />
                </View>
              ) : null
            }
            ListEmptyComponent={<MySessionsEmptyStateCard activeTab={activeTab} />}
            renderItem={({ item }) => {
              if (isHistoryTab && 'type' in item) {
                if (item.type === 'filters') {
                  return (
                    <View
                      className="pt-1 pb-1"
                      style={{ backgroundColor: PROFILE_THEME_COLORS.background, marginHorizontal: -20, paddingHorizontal: SPACING.xl }}
                    >
                      <Pressable
                        onPress={() => setHistoryFilterModalVisible(true)}
                        className="flex-row items-center self-start rounded-full px-4 py-2.5"
                        style={{
                          backgroundColor: activeHistoryFiltersCount > 0 ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.surfaceContainerLow,
                          borderWidth: BORDER.base,
                          borderColor: activeHistoryFiltersCount > 0 ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.outlineVariant,
                        }}
                      >
                        <SlidersHorizontal
                          size={13}
                          color={activeHistoryFiltersCount > 0 ? PROFILE_THEME_COLORS.onPrimary : PROFILE_THEME_COLORS.onSurfaceVariant}
                          strokeWidth={2.5}
                        />
                        <Text
                          className="ml-1.5"
                          style={{
                            color: activeHistoryFiltersCount > 0 ? PROFILE_THEME_COLORS.onPrimary : PROFILE_THEME_COLORS.onSurfaceVariant,
                            fontFamily: SCREEN_FONTS.cta,
                            fontSize: 12,
                          }}
                        >
                          {activeHistoryFiltersCount > 0 ? `Bộ lọc lịch sử (${activeHistoryFiltersCount})` : 'Bộ lọc lịch sử'}
                        </Text>
                      </Pressable>
                    </View>
                  )
                }

                if (item.type === 'month') {
                  const isExpanded = historyExpandedMonths[item.monthKey]
                  const monthTotal = monthTotalsByKey[item.monthKey] ?? item.count
                  return (
                    <Pressable
                      onPress={() => toggleMonthExpanded(item.monthKey)}
                      className="mt-4 mb-3 flex-row items-center"
                    >
                      <View className="flex-row items-center pr-3">
                        {isExpanded ? (
                          <ChevronDown size={14} color={PROFILE_THEME_COLORS.onSurfaceVariant} strokeWidth={2.4} />
                        ) : (
                          <ChevronRight size={14} color={PROFILE_THEME_COLORS.onSurfaceVariant} strokeWidth={2.4} />
                        )}
                        <Text
                          className="ml-2 text-[11px] uppercase tracking-[2px]"
                          style={{
                            color: PROFILE_THEME_COLORS.outline,
                            fontFamily: SCREEN_FONTS.cta,
                          }}
                        >
                          {item.monthLabel}
                        </Text>
                      </View>
                      <View className="h-px flex-1" style={{ backgroundColor: PROFILE_THEME_COLORS.outlineVariant }} />
                      <Text
                        className="pl-3 text-[11px] uppercase tracking-[2px]"
                        style={{
                          color: PROFILE_THEME_COLORS.outline,
                          fontFamily: SCREEN_FONTS.cta,
                        }}
                      >
                        {monthTotal} trận
                      </Text>
                    </Pressable>
                  )
                }

                if (item.type === 'session') {
                  return (
                    <MySessionCard
                      item={item.session}
                      tab={activeTab}
                      onOpenSessionDetail={openSessionDetail}
                      onOpenHostProfile={openHostProfile}
                      onOpenRateSession={openRateSession}
                      onShare={handleShare}
                      formatDatePart={formatDatePart}
                      formatTimeRange={formatTimeRange}
                    />
                  )
                }
              }

              return (
                <MySessionCard
                  item={item as MySession}
                  tab={activeTab}
                  onOpenSessionDetail={openSessionDetail}
                  onOpenHostProfile={openHostProfile}
                  onOpenRateSession={openRateSession}
                  onShare={handleShare}
                  formatDatePart={formatDatePart}
                  formatTimeRange={formatTimeRange}
                />
              )
            }}
          />

          <Modal
            visible={historyFilterModalVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setHistoryFilterModalVisible(false)}
          >
            <View className="flex-1" style={{ backgroundColor: withAlpha(PROFILE_THEME_COLORS.onBackground, 0.36), justifyContent: 'flex-end' }}>
              <Pressable className="flex-1" onPress={() => setHistoryFilterModalVisible(false)} />
              <View
                className="rounded-t-[28px] px-5 pt-5 pb-8"
                style={{
                  backgroundColor: PROFILE_THEME_COLORS.background,
                  borderTopWidth: 1,
                  borderColor: PROFILE_THEME_COLORS.outlineVariant,
                }}
              >
                <View className="mb-4 flex-row items-center justify-between">
                  <Text
                    style={{
                      color: PROFILE_THEME_COLORS.onBackground,
                      fontFamily: SCREEN_FONTS.cta,
                      fontSize: 18,
                    }}
                  >
                    Bộ lọc lịch sử
                  </Text>
                  <Pressable
                    onPress={() => setHistoryFilterModalVisible(false)}
                    className="h-9 w-9 items-center justify-center rounded-full"
                    style={{ backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow }}
                  >
                    <X size={16} color={PROFILE_THEME_COLORS.onSurfaceVariant} strokeWidth={2.6} />
                  </Pressable>
                </View>

                <Text
                  className="mb-2"
                  style={{
                    color: PROFILE_THEME_COLORS.outline,
                    fontFamily: SCREEN_FONTS.cta,
                    fontSize: 10,
                    letterSpacing: 1.4,
                    textTransform: 'uppercase',
                  }}
                >
                  Trạng thái
                </Text>
                <View className="mb-3 flex-row flex-wrap">
                  {HISTORY_STATUS_OPTIONS.map((option) =>
                    renderHistoryFilterChip(
                      `status-${option.id}`,
                      option.label,
                      historyStatusFilter === option.id,
                      () => setHistoryStatusFilter(option.id),
                    ),
                  )}
                </View>

                <Text
                  className="mb-2"
                  style={{
                    color: PROFILE_THEME_COLORS.outline,
                    fontFamily: SCREEN_FONTS.cta,
                    fontSize: 10,
                    letterSpacing: 1.4,
                    textTransform: 'uppercase',
                  }}
                >
                  Vai trò
                </Text>
                <View className="mb-3 flex-row flex-wrap">
                  {HISTORY_ROLE_OPTIONS.map((option) =>
                    renderHistoryFilterChip(
                      `role-${option.id}`,
                      option.label,
                      historyRoleFilter === option.id,
                      () => setHistoryRoleFilter(option.id),
                    ),
                  )}
                </View>

                <Text
                  className="mb-2"
                  style={{
                    color: PROFILE_THEME_COLORS.outline,
                    fontFamily: SCREEN_FONTS.cta,
                    fontSize: 10,
                    letterSpacing: 1.4,
                    textTransform: 'uppercase',
                  }}
                >
                  Thời gian
                </Text>
                <View className="mb-3 flex-row flex-wrap">
                  {HISTORY_TIME_OPTIONS.map((option) =>
                    renderHistoryFilterChip(
                      `time-${option.id}`,
                      option.label,
                      historyTimeFilter === option.id,
                      () => setHistoryTimeFilter(option.id),
                    ),
                  )}
                </View>

                <Text
                  className="mb-2"
                  style={{
                    color: PROFILE_THEME_COLORS.outline,
                    fontFamily: SCREEN_FONTS.cta,
                    fontSize: 10,
                    letterSpacing: 1.4,
                    textTransform: 'uppercase',
                  }}
                >
                  Đánh giá
                </Text>
                <View className="mb-3 flex-row flex-wrap">
                  {HISTORY_RATING_OPTIONS.map((option) =>
                    renderHistoryFilterChip(
                      `rating-${option.id}`,
                      option.label,
                      historyRatingFilter === option.id,
                      () => setHistoryRatingFilter(option.id),
                    ),
                  )}
                </View>

                <Text
                  className="mb-2"
                  style={{
                    color: PROFILE_THEME_COLORS.outline,
                    fontFamily: SCREEN_FONTS.cta,
                    fontSize: 10,
                    letterSpacing: 1.4,
                    textTransform: 'uppercase',
                  }}
                >
                  Kết quả
                </Text>
                <View className="mb-4 flex-row flex-wrap">
                  {HISTORY_RESULT_OPTIONS.map((option) =>
                    renderHistoryFilterChip(
                      `result-${option.id}`,
                      option.label,
                      historyResultFilter === option.id,
                      () => setHistoryResultFilter(option.id),
                    ),
                  )}
                </View>

                <Pressable
                  onPress={() => setHistoryFilterModalVisible(false)}
                  className="h-12 items-center justify-center rounded-full"
                  style={{ backgroundColor: PROFILE_THEME_COLORS.primary }}
                >
                  <Text style={{ color: PROFILE_THEME_COLORS.onPrimary, fontFamily: SCREEN_FONTS.cta, fontSize: 13 }}>
                    Áp dụng
                  </Text>
                </Pressable>
              </View>
            </View>
          </Modal>

          <Pressable
            onPress={() => router.push('/create-session' as never)}
            className="absolute flex-row items-center rounded-full px-8 py-5"
            style={{
              bottom: 100,
              right: 24,
              zIndex: 100,
              backgroundColor: PROFILE_THEME_COLORS.primary,
              shadowColor: PROFILE_THEME_COLORS.primary,
              shadowOpacity: 0.28,
              shadowRadius: 24,
              shadowOffset: { width: 0, height: 16 },
            }}
          >
            <Plus size={20} color={PROFILE_THEME_COLORS.onPrimary} strokeWidth={2.7} />
            <Text
              className="ml-3 text-sm uppercase tracking-[2.6px]"
              style={{ color: PROFILE_THEME_COLORS.onPrimary, fontFamily: SCREEN_FONTS.cta }}
            >
              Tạo kèo mới
            </Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  )
}
