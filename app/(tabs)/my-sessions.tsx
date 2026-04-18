import { PROFILE_THEME_COLORS } from '@/components/profile/profileTheme'
import { getEloBandForSessionRange } from '@/lib/eloSystem'
import { getSessionSkillLabel } from '@/lib/sessionDetail'
import { getSkillLevelUi } from '@/lib/skillLevelUi'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/useAuth'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import {
  AlertCircle,
  CalendarDays,
  Pencil as Edit3,
  FileText,
  Hourglass,
  MapPin,
  Plus,
  Share2,
  ShieldCheck,
  Star,
  UserRound,
} from 'lucide-react-native'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Share,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

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

type SessionRequestStatus = 'pending' | 'accepted' | 'rejected' | null
type SessionRole = 'host' | 'player'
type SessionTab = 'upcoming' | 'pending' | 'history'

type MySession = {
  id: string
  status: string
  court_booking_status: 'confirmed' | 'unconfirmed'
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
}

type MySessionsCache = {
  userId: string
  sessions: MySession[]
  updatedAt: number
}

const mySessionsCacheByUser = new Map<string, MySessionsCache>()
const MY_SESSIONS_LAST_USER_KEY = 'my_sessions_last_user_id_v1'
const MY_SESSIONS_CACHE_FRESH_MS = 30_000

function getMySessionsCacheKey(userId: string) {
  return `my_sessions_overview_cache_v1:${userId}`
}

const TAB_OPTIONS: { key: SessionTab; label: string }[] = [
  { key: 'upcoming', label: 'Sắp đánh' },
  { key: 'pending', label: 'Chờ duyệt' },
  { key: 'history', label: 'Lịch sử' },
]

function sessionsFingerprint(items: MySession[]) {
  return JSON.stringify(
    items.map((item) => ({
      id: item.id,
      status: item.status,
      court_booking_status: item.court_booking_status,
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
    })),
  )
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
      className="rounded-[28px] px-6 py-7"
      style={{
        backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest,
        borderLeftWidth: 3,
        borderLeftColor: PROFILE_THEME_COLORS.primary,
        shadowColor: '#0f172a',
        shadowOpacity: 0.04,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 2,
      }}
    >
      <Text
        style={{
          color: PROFILE_THEME_COLORS.outline,
          fontFamily: 'PlusJakartaSans-ExtraBold',
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
          fontFamily: 'PlusJakartaSans-ExtraBold',
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
          fontFamily: 'PlusJakartaSans-Regular',
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
  onOpenRateSession,
  onShare,
  formatDatePart,
  formatTimeRange,
}: {
  item: MySession
  tab: SessionTab
  onOpenSessionDetail: (sessionId: string) => void
  onOpenRateSession: (sessionId: string) => void
  onShare: (session?: MySession) => void | Promise<void>
  formatDatePart: (value: string) => string
  formatTimeRange: (start: string, end: string) => string
}) {
  const skillBand = getEloBandForSessionRange(item.elo_min ?? 0, item.elo_max ?? 0)
  const skillUi = getSkillLevelUi(skillBand.levelId)
  const SkillIcon = skillUi.icon
  const isHost = item.role === 'host'
  const isBooked = item.court_booking_status === 'confirmed'
  const progress = item.max_players > 0 ? Math.min(item.player_count / item.max_players, 1) : 0
  const progressPercent = Math.max(progress * 100, 0)
  const address = [item.court_address, item.court_city].filter(Boolean).join(', ')
  const compactAddress = address.split(',').map((p) => p.trim()).filter(Boolean).slice(0, 2).join(', ')
  const hostInitials = (item.host_name || '?').slice(0, 1).toUpperCase()

  const BADGE = {
    backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow,
    borderWidth: 1,
    borderColor: PROFILE_THEME_COLORS.outlineVariant,
  } as const

  return (
    <Pressable
      onPress={() => onOpenSessionDetail(item.id)}
      className="mb-4 overflow-hidden rounded-[34px] px-6 pt-6 pb-4"
      style={{
        backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest,
        borderLeftWidth: 3,
        borderLeftColor: PROFILE_THEME_COLORS.primary,
        shadowColor: '#0f172a',
        shadowOpacity: 0.06,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
        elevation: 3,
      }}
    >
      <View style={{ position: 'absolute', top: -6, right: -16, zIndex: 0, opacity: 0.07 }} pointerEvents="none">
        <SkillIcon size={96} color={PROFILE_THEME_COLORS.primary} strokeWidth={1.4} />
      </View>

      <Text
        numberOfLines={2}
        ellipsizeMode="tail"
        style={{
          color: PROFILE_THEME_COLORS.primary,
          fontFamily: 'PlusJakartaSans-ExtraBold',
          fontSize: 20,
          lineHeight: 24,
          letterSpacing: 0.8,
          textTransform: 'uppercase',
        }}
      >
        {item.court_name}
      </Text>

      {compactAddress ? (
        <View className="mt-1">
          <View
            className="self-start flex-row items-center rounded-full px-3 py-1.5"
            style={{ backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow, maxWidth: '100%' }}
          >
            <MapPin size={13} color={PROFILE_THEME_COLORS.onSurfaceVariant} strokeWidth={2.4} />
            <Text
              className="ml-1.5"
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{
                color: PROFILE_THEME_COLORS.onSurfaceVariant,
                fontFamily: 'PlusJakartaSans-SemiBold',
                fontSize: 13,
                lineHeight: 18,
              }}
            >
              {compactAddress}
            </Text>
          </View>
        </View>
      ) : null}

      <View className="mt-1 flex-row flex-wrap gap-2">
        <View className="flex-row items-center rounded-full px-3 py-1.5" style={BADGE}>
          <CalendarDays size={13} color={PROFILE_THEME_COLORS.onSurfaceVariant} strokeWidth={2.4} />
          <Text
            className="ml-1.5"
            numberOfLines={1}
            ellipsizeMode="tail"
            style={{
              color: PROFILE_THEME_COLORS.onSurfaceVariant,
              fontFamily: 'PlusJakartaSans-SemiBold',
              fontSize: 13,
              lineHeight: 18,
            }}
          >
            {`${formatDatePart(item.start_time)} • ${formatTimeRange(item.start_time, item.end_time)}`}
          </Text>
        </View>

        <View className="flex-row items-center rounded-full px-3 py-1.5" style={BADGE}>
          <SkillIcon size={13} color={PROFILE_THEME_COLORS.onSurfaceVariant} strokeWidth={2.4} />
          <Text
            className="ml-1.5"
            style={{
              color: PROFILE_THEME_COLORS.onSurfaceVariant,
              fontFamily: 'PlusJakartaSans-SemiBold',
              fontSize: 13,
              lineHeight: 18,
            }}
          >
            {getSessionSkillLabel(item.elo_min ?? 0, item.elo_max ?? 0)}
          </Text>
        </View>

        <View
          className="flex-row items-center rounded-full px-3 py-1.5"
          style={isHost ? { backgroundColor: PROFILE_THEME_COLORS.primary } : BADGE}
        >
          <UserRound
            size={13}
            color={isHost ? PROFILE_THEME_COLORS.onPrimary : PROFILE_THEME_COLORS.onSurfaceVariant}
            strokeWidth={2.4}
          />
          <Text
            className="ml-1.5"
            style={{
              color: isHost ? PROFILE_THEME_COLORS.onPrimary : PROFILE_THEME_COLORS.onSurfaceVariant,
              fontFamily: 'PlusJakartaSans-SemiBold',
              fontSize: 13,
              lineHeight: 18,
            }}
          >
            {isHost ? 'Chủ kèo' : 'Người chơi'}
          </Text>
        </View>

        <View className="flex-row items-center rounded-full px-3 py-1.5" style={BADGE}>
          {isBooked
            ? <ShieldCheck size={13} color={PROFILE_THEME_COLORS.onSurfaceVariant} strokeWidth={2.4} />
            : <AlertCircle size={13} color={PROFILE_THEME_COLORS.onSurfaceVariant} strokeWidth={2.4} />}
          <Text
            className="ml-1.5"
            style={{
              color: PROFILE_THEME_COLORS.onSurfaceVariant,
              fontFamily: 'PlusJakartaSans-SemiBold',
              fontSize: 13,
              lineHeight: 18,
            }}
          >
            {isBooked ? 'Sân đã chốt' : 'Chờ xác nhận'}
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
            className="mt-4 flex-row items-center justify-center rounded-[20px] px-4 py-3.5"
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
              className="ml-2 text-[13px]"
              style={{
                color: canRate ? PROFILE_THEME_COLORS.onPrimary : PROFILE_THEME_COLORS.onSurfaceVariant,
                fontFamily: 'PlusJakartaSans-ExtraBold',
              }}
            >
              {label}
            </Text>
          </Pressable>
        )
      })() : (
      <View
        className="mt-4 rounded-[24px] p-3.5"
        style={{ backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow }}
      >
        <View className="flex-row items-center justify-between">
          <View className="mr-3 flex-1 flex-row items-center">
            <View
              className="mr-3 h-11 w-11 items-center justify-center rounded-full"
              style={{
                backgroundColor: PROFILE_THEME_COLORS.primary,
                borderWidth: 1,
                borderColor: withAlpha(PROFILE_THEME_COLORS.primary, 0.14),
              }}
            >
              <Text
                style={{
                  color: PROFILE_THEME_COLORS.onPrimary,
                  fontFamily: 'PlusJakartaSans-ExtraBold',
                  fontSize: 15,
                }}
              >
                {hostInitials}
              </Text>
            </View>

            <View className="flex-1">
              <Text
                numberOfLines={1}
                style={{
                  color: PROFILE_THEME_COLORS.onSurface,
                  fontFamily: 'PlusJakartaSans-SemiBold',
                  fontSize: 13,
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
                fontFamily: 'PlusJakartaSans-ExtraBold',
                fontSize: 16,
              }}
            >
              {item.player_count}/{item.max_players}
            </Text>
            <Text
              style={{
                color: PROFILE_THEME_COLORS.onSurfaceVariant,
                fontFamily: 'PlusJakartaSans-Regular',
                fontSize: 10,
              }}
            >
              người chơi
            </Text>
          </View>
        </View>

        <View
          className="mt-3 h-2 overflow-hidden rounded-full"
          style={{ backgroundColor: PROFILE_THEME_COLORS.surfaceContainerHighest }}
        >
          <LinearGradient
            colors={[PROFILE_THEME_COLORS.primary, PROFILE_THEME_COLORS.tertiary]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ width: `${Math.max(progressPercent, 8)}%`, height: '100%', borderRadius: 999 }}
          />
        </View>

        <View className="mt-3 flex-row items-center">
          {Array.from({ length: Math.min(item.player_count, 4) }).map((_, index) => (
            <View
              key={index}
              className={`h-8 w-8 items-center justify-center rounded-full ${index === 0 ? '' : '-ml-2.5'}`}
              style={{
                backgroundColor: PROFILE_THEME_COLORS.primary,
                borderWidth: 2,
                borderColor: PROFILE_THEME_COLORS.surfaceContainerLow,
              }}
            >
              <UserRound size={14} color={PROFILE_THEME_COLORS.onPrimary} strokeWidth={2.2} />
            </View>
          ))}
          {item.player_count > 4 ? (
            <View
              className="-ml-2.5 h-8 w-8 items-center justify-center rounded-full"
              style={{
                backgroundColor: PROFILE_THEME_COLORS.surfaceContainerHighest,
                borderWidth: 2,
                borderColor: PROFILE_THEME_COLORS.surfaceContainerLow,
              }}
            >
              <Text style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 10 }}>
                +{item.player_count - 4}
              </Text>
            </View>
          ) : null}
        </View>

        {tab === 'pending' ? (
          <View className="mt-3 gap-2">
            <View
              className="flex-row items-center rounded-[16px] px-4 py-3"
              style={{
                backgroundColor: isHost
                  ? PROFILE_THEME_COLORS.secondaryContainer
                  : PROFILE_THEME_COLORS.surfaceContainerHighest,
              }}
            >
              <Hourglass
                size={14}
                color={isHost ? PROFILE_THEME_COLORS.onSecondaryContainer : PROFILE_THEME_COLORS.onSurfaceVariant}
                strokeWidth={2.3}
              />
              <Text
                className="ml-2 flex-1 text-[12px] leading-5"
                style={{
                  color: isHost ? PROFILE_THEME_COLORS.onSecondaryContainer : PROFILE_THEME_COLORS.onSurfaceVariant,
                  fontFamily: 'PlusJakartaSans-SemiBold',
                }}
              >
                {isHost
                  ? 'Có người đang chờ bạn duyệt yêu cầu tham gia.'
                  : 'Đang chờ chủ kèo phản hồi yêu cầu tham gia của bạn.'}
              </Text>
            </View>

            <View className="flex-row gap-3">
              <Pressable
                onPress={() => onOpenSessionDetail(item.id)}
                className="flex-1 flex-row items-center justify-center rounded-[20px] px-4 py-3.5"
                style={{
                  backgroundColor: isHost ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.surfaceContainerLowest,
                  borderWidth: isHost ? 0 : 1,
                  borderColor: PROFILE_THEME_COLORS.outlineVariant,
                }}
              >
                <FileText
                  size={15}
                  color={isHost ? PROFILE_THEME_COLORS.onPrimary : PROFILE_THEME_COLORS.onSurface}
                  strokeWidth={2.3}
                />
                <Text
                  className="ml-2 text-[13px]"
                  style={{
                    color: isHost ? PROFILE_THEME_COLORS.onPrimary : PROFILE_THEME_COLORS.onSurface,
                    fontFamily: 'PlusJakartaSans-ExtraBold',
                  }}
                >
                  {isHost ? 'Duyệt yêu cầu' : 'Xem chi tiết'}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => void onShare(item)}
                className="flex-1 flex-row items-center justify-center rounded-[20px] px-4 py-3.5"
                style={{ backgroundColor: PROFILE_THEME_COLORS.secondaryContainer }}
              >
                <Share2 size={15} color={PROFILE_THEME_COLORS.onSecondaryContainer} strokeWidth={2.3} />
                <Text
                  className="ml-2 text-[13px]"
                  style={{ color: PROFILE_THEME_COLORS.onSecondaryContainer, fontFamily: 'PlusJakartaSans-ExtraBold' }}
                >
                  Chia sẻ
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {tab === 'upcoming' ? (
          <View className="mt-3 flex-row gap-3">
            <Pressable
              onPress={() => onOpenSessionDetail(item.id)}
              className="flex-1 flex-row items-center justify-center rounded-[20px] px-4 py-3.5"
              style={{
                backgroundColor: isHost ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.surfaceContainerLowest,
                borderWidth: isHost ? 0 : 1,
                borderColor: PROFILE_THEME_COLORS.outlineVariant,
              }}
            >
              {isHost
                ? <Edit3 size={15} color={PROFILE_THEME_COLORS.onPrimary} strokeWidth={2.3} />
                : <FileText size={15} color={PROFILE_THEME_COLORS.onSurface} strokeWidth={2.3} />}
              <Text
                className="ml-2 text-[13px]"
                style={{
                  color: isHost ? PROFILE_THEME_COLORS.onPrimary : PROFILE_THEME_COLORS.onSurface,
                  fontFamily: 'PlusJakartaSans-ExtraBold',
                }}
              >
                {isHost ? 'Sửa kèo' : 'Chi tiết'}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => void onShare(item)}
              className="flex-1 flex-row items-center justify-center rounded-[20px] px-4 py-3.5"
              style={{ backgroundColor: PROFILE_THEME_COLORS.secondaryContainer }}
            >
              <Share2 size={15} color={PROFILE_THEME_COLORS.onSecondaryContainer} strokeWidth={2.3} />
              <Text
                className="ml-2 text-[13px]"
                style={{ color: PROFILE_THEME_COLORS.onSecondaryContainer, fontFamily: 'PlusJakartaSans-ExtraBold' }}
              >
                Chia sẻ
              </Text>
            </Pressable>
          </View>
        ) : null}

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
            supabase.rpc('process_pending_session_completions'),
            supabase.rpc('process_overdue_session_closures'),
          ])
        }

        const { data, error } = await supabase.rpc('get_my_sessions_overview')
        if (error) {
          console.warn('[MySessions] get_my_sessions_overview failed:', error.message)
        }

        const nextSessions: MySession[] = (data ?? []).map((session: any) => ({
          id: session.id,
          status: session.status,
          court_booking_status: session.court_booking_status,
          role: session.role,
          request_status: session.request_status,
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
        const cacheAgeMs = Date.now() - bootstrapCache.updatedAt
        if (cacheAgeMs < MY_SESSIONS_CACHE_FRESH_MS) return
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

  const onRefresh = useCallback(async () => {
    if (!userId) return
    setRefreshing(true)
    try {
      await fetchMySessions(userId, { showLoader: false, runMaintenance: true })
    } finally {
      setRefreshing(false)
    }
  }, [fetchMySessions, userId])

  function formatDatePart(value: string) {
    const date = new Date(value)
    const weekday = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][date.getDay()]
    const day = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`
    return `${weekday} ${day}`
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

  const resolveTabForSession = useCallback((session: MySession): SessionTab => {
    if (session.request_status === 'pending') return 'pending'
    if (session.status === 'done' || session.status === 'cancelled') return 'history'
    return 'upcoming'
  }, [])

  function shareMessage(session?: MySession) {
    if (!session) return 'Lịch chơi PickleMatch của tôi đang được cập nhật.'
    return [
      'Cùng xem kèo pickleball này nhé:',
      session.court_name,
      `${formatDatePart(session.start_time)} • ${formatTimeRange(session.start_time, session.end_time)}`,
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

  function openRateSession(sessionId: string) {
    router.push({ pathname: '/rate-session/[id]' as any, params: { id: sessionId } })
  }

  const sessionsByTab = useMemo(
    () =>
      TAB_OPTIONS.reduce<Record<SessionTab, MySession[]>>(
        (acc, tab) => {
          acc[tab.key] = sessions
            .filter((session) => resolveTabForSession(session) === tab.key)
            .sort((a, b) => {
              const aTime = new Date(a.start_time).getTime()
              const bTime = new Date(b.start_time).getTime()
              const safeATime = Number.isNaN(aTime) ? (tab.key === 'history' ? 0 : Number.MAX_SAFE_INTEGER) : aTime
              const safeBTime = Number.isNaN(bTime) ? (tab.key === 'history' ? 0 : Number.MAX_SAFE_INTEGER) : bTime
              if (tab.key === 'history') return safeBTime - safeATime
              const bookingWeight =
                Number(b.court_booking_status === 'confirmed') - Number(a.court_booking_status === 'confirmed')
              if (bookingWeight !== 0) return bookingWeight
              return safeATime - safeBTime
            })
          return acc
        },
        { upcoming: [], pending: [], history: [] },
      ),
    [sessions, resolveTabForSession],
  )

  const activeSessions = sessionsByTab[activeTab]

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: PROFILE_THEME_COLORS.background }} edges={['top']}>
      {loading ? (
        <View className="flex-1 items-center justify-center px-6">
          <ActivityIndicator size="large" color={PROFILE_THEME_COLORS.primary} />
          <Text
            className="mt-4 text-[14px]"
            style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: 'PlusJakartaSans-SemiBold' }}
          >
            Đang tải kèo của bạn...
          </Text>
        </View>
      ) : (
        <View className="flex-1">
          <FlatList
            data={activeSessions}
            keyExtractor={(item) => `${activeTab}-${item.id}`}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 160 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PROFILE_THEME_COLORS.primary} />}
            ListHeaderComponent={
              <View>
                <View className="flex-row items-start justify-between py-1 mb-6">
                  <View className="flex-1 pr-4">
                    <Text
                      className="text-[11px] uppercase tracking-[0.16em]"
                      style={{ color: PROFILE_THEME_COLORS.outline, fontFamily: 'PlusJakartaSans-ExtraBold' }}
                    >
                      LỊCH CỦA TÔI
                    </Text>
                    <Text
                      className="mt-2 text-[28px] leading-[34px]"
                      style={{ color: PROFILE_THEME_COLORS.onBackground, fontFamily: 'PlusJakartaSans-ExtraBold' }}
                    >
                      Kèo của tôi
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
                  className="rounded-[24px] p-1.5 flex-row gap-1.5"
                  style={{
                    backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow,
                    borderWidth: 1,
                    borderColor: PROFILE_THEME_COLORS.outlineVariant,
                  }}
                >
                  {TAB_OPTIONS.map((tab) => {
                    const active = tab.key === activeTab
                    return (
                      <Pressable
                        key={tab.key}
                        onPress={() => setActiveTab(tab.key)}
                        className="flex-1 rounded-[18px] px-3 py-3 items-center"
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
                            fontFamily: 'PlusJakartaSans-ExtraBold',
                            fontSize: 13,
                          }}
                        >
                          {tab.label}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>

                <View className="pt-5" />
              </View>
            }
            ListEmptyComponent={<MySessionsEmptyStateCard activeTab={activeTab} />}
            renderItem={({ item }) => (
              <MySessionCard
                item={item}
                tab={activeTab}
                onOpenSessionDetail={openSessionDetail}
                onOpenRateSession={openRateSession}
                onShare={handleShare}
                formatDatePart={formatDatePart}
                formatTimeRange={formatTimeRange}
              />
            )}
          />

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
              style={{ color: PROFILE_THEME_COLORS.onPrimary, fontFamily: 'PlusJakartaSans-ExtraBold' }}
            >
              Tạo kèo mới
            </Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  )
}
