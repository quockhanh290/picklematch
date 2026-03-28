import { router, useFocusEffect } from 'expo-router'
import {
  AlertCircle,
  Calendar,
  Clock,
  DollarSign,
  Heart,
  Hand,
  Home,
  MapPin,
  Plus,
  ShieldCheck,
  Star,
  Swords,
  TrendingUp,
  UserRound,
  Users,
  Zap,
} from 'lucide-react-native'
import { memo, useCallback, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { ActivityIndicator, Dimensions, ImageBackground, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useAnimatedRef,
  type SharedValue,
  useScrollOffset,
} from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'

import { getSkillLevelUi, getSkillTargetElo } from '@/lib/skillLevelUi'
import { getShadowStyle } from '@/lib/designSystem'
import type { SkillAssessmentLevel } from '@/lib/skillAssessment'
import { supabase } from '@/lib/supabase'
import { useAppTheme } from '@/lib/theme-context'
import { useAuth } from '@/lib/useAuth'

type StatItem = {
  id: string
  label: string
  value: string
  accent: string
  icon: typeof TrendingUp
}

type Player = {
  id: string
  name: string
  initials: string
  badge: 'trusted' | 'streak'
}

type Host = {
  name: string
  rating: number
  vibe: string
}

type HomeSessionRecord = {
  id: string
  host_id: string
  elo_min: number
  elo_max: number
  max_players: number
  status: 'open' | 'done' | 'cancelled' | 'pending_completion'
  court_booking_status: 'confirmed' | 'unconfirmed'
  created_at?: string | null
  host: {
    id: string
    name: string
    current_elo?: number | null
    elo?: number | null
    self_assessed_level?: string | null
    skill_label?: string | null
    reliability_score?: number | null
    host_reputation?: number | null
  } | null
  slot: {
    id: string
    start_time: string
    end_time: string
    price: number
    court: {
      id: string
      name: string
      address: string
      city: string
    } | null
  } | null
  session_players: {
    player_id: string
    status: string
    player: {
      id: string
      name: string
      reliability_score?: number | null
      current_elo?: number | null
      self_assessed_level?: string | null
      skill_label?: string | null
    } | null
  }[]
}

type HomeSessionRelation<T> = T | T[] | null

type HomeSessionSlotRaw = Omit<NonNullable<HomeSessionRecord['slot']>, 'court'> & {
  court: HomeSessionRelation<NonNullable<NonNullable<HomeSessionRecord['slot']>['court']>>
}

type HomeSessionRecordRaw = Omit<HomeSessionRecord, 'host' | 'slot' | 'session_players'> & {
  host: HomeSessionRelation<NonNullable<HomeSessionRecord['host']>>
  slot: HomeSessionRelation<HomeSessionSlotRaw>
  session_players:
    | (Omit<HomeSessionRecord['session_players'][number], 'player'> & {
        player: HomeSessionRelation<NonNullable<HomeSessionRecord['session_players'][number]['player']>>
      })[]
    | null
}

type HomeProfile = {
  id: string
  name: string
  current_elo?: number | null
  elo?: number | null
  reliability_score?: number | null
  host_reputation?: number | null
}

function normalizeRelation<T>(value: HomeSessionRelation<T>): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value ?? null
}

function normalizeHomeSessionRecord(session: HomeSessionRecordRaw): HomeSessionRecord {
  const slot = normalizeRelation(session.slot)

  return {
    ...session,
    host: normalizeRelation(session.host),
    slot: slot
      ? {
          ...slot,
          court: normalizeRelation(slot.court),
        }
      : null,
    session_players: (session.session_players ?? []).map((sessionPlayer) => ({
      ...sessionPlayer,
      player: normalizeRelation(sessionPlayer.player),
    })),
  }
}

type PlayerStatsRecord = {
  current_win_streak: number
  host_average_rating: number
}

type MySessionOverviewRow = {
  id: string
  status: string
  start_time: string
}

type MatchSession = {
  id: string
  title: string
  bookingId: string
  courtName: string
  address: string
  matchScore: number
  skillLabel: string
  timeLabel: string
  priceLabel: string
  openSlotsLabel: string
  statusLabel: string
  countdownLabel?: string
  levelId: SkillAssessmentLevel['id']
  host: Host
  players: Player[]
  urgent?: boolean
  joined?: boolean
}

type FamiliarCourt = {
  id: string
  name: string
  area: string
  openMatches: number
  note: string
  image: string
}

const iconStroke = 2.7
const screenWidth = Dimensions.get('window').width
const carouselCardWidth = screenWidth - 40
const carouselGap = 14
const SMART_MATCH_CARD_HEIGHT = 520
const COURT_CARD_HEIGHT = 256
const CAROUSEL_SECTION_HEIGHT = 536
const COURT_CAROUSEL_HEIGHT = 272

function getEloRangeForLevel(levelId: SkillAssessmentLevel['id']) {
  if (levelId === 'level_1') return { elo_min: 800, elo_max: 950 }
  if (levelId === 'level_2') return { elo_min: 950, elo_max: 1150 }
  if (levelId === 'level_3') return { elo_min: 1150, elo_max: 1300 }
  if (levelId === 'level_4') return { elo_min: 1300, elo_max: 1500 }
  return { elo_min: 1500, elo_max: 1700 }
}

function formatTimeLabel(startTime: string, endTime: string) {
  const startDate = new Date(startTime)
  const endDate = new Date(endTime)
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return 'Chưa rõ thời gian'
  }

  const weekdayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
  const pad = (value: number) => value.toString().padStart(2, '0')
  const dateLabel = `${weekdayLabels[startDate.getDay()]}, ${pad(startDate.getDate())}/${pad(startDate.getMonth() + 1)}`
  const startClock = `${pad(startDate.getHours())}:${pad(startDate.getMinutes())}`
  const endClock = `${pad(endDate.getHours())}:${pad(endDate.getMinutes())}`

  return `${dateLabel} · ${startClock} - ${endClock}`
}

function formatPriceLabel(totalPrice: number, maxPlayers: number) {
  const pricePerPerson = Math.round(totalPrice / Math.max(maxPlayers, 1))
  return `${pricePerPerson.toLocaleString('vi-VN')}d`
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function getStatusLabel(bookingStatus: HomeSessionRecord['court_booking_status']) {
  return bookingStatus === 'confirmed' ? 'Sân đã chốt' : 'Chưa chốt sân'
}

function isWithinNext24Hours(startTime: string) {
  const startMs = Date.parse(startTime)
  if (Number.isNaN(startMs)) {
    return false
  }

  const nowMs = Date.now()
  const diffMs = startMs - nowMs
  return diffMs > 0 && diffMs <= 24 * 60 * 60 * 1000
}

function formatCountdownLabelFromStartTime(startTime: string) {
  const diffMs = Math.max(Date.parse(startTime) - Date.now(), 0)
  const totalMinutes = Math.floor(diffMs / (60 * 1000))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  const pad = (value: number) => value.toString().padStart(2, '0')

  return `${pad(hours)}:${pad(minutes)}`
}

function getLevelIdFromSession(session: Pick<HomeSessionRecord, 'elo_min' | 'elo_max' | 'host'>): SkillAssessmentLevel['id'] {
  const hostLevel = session.host?.self_assessed_level as SkillAssessmentLevel['id'] | undefined
  if (hostLevel) return hostLevel
  if (session.elo_max <= 950) return 'level_1'
  if (session.elo_max <= 1150) return 'level_2'
  if (session.elo_max <= 1300) return 'level_3'
  if (session.elo_max <= 1500) return 'level_4'
  return 'level_5'
}
const COURT_FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1505250469679-203ad9ced0cb?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1518604666860-9ed391f76460?auto=format&fit=crop&w=1200&q=80',
]

function getLivePlayerBadge(player?: { reliability_score?: number | null }): Player['badge'] {
  return (player?.reliability_score ?? 0) >= 95 ? 'trusted' : 'streak'
}

function getLiveHostRating(session: HomeSessionRecord, hostAverageRating?: number | null) {
  if (hostAverageRating != null && hostAverageRating > 0) return Number(hostAverageRating.toFixed(1))

  const hostReputation = session.host?.host_reputation ?? 0
  const reliability = session.host?.reliability_score ?? 90
  const normalized = 4.2 + Math.min(hostReputation, 20) * 0.03 + Math.min(Math.max(reliability - 85, 0), 15) * 0.01
  return Math.min(5, Number(normalized.toFixed(1)))
}

function buildLiveHostVibe(session: HomeSessionRecord, slotsLeft: number) {
  if (session.court_booking_status === 'confirmed' && slotsLeft <= 1) return 'Đã chốt sân, vào là chạy kèo'
  if (slotsLeft <= 2) return 'Đang chờ ghép nốt đội hình đẹp'
  if ((session.host?.reliability_score ?? 0) >= 95) return 'Host uy tín, phản hồi thường rất nhanh'
  return 'Kèo đang mở, dễ ghép người và vào sân'
}

function computeLiveMatchScore(session: HomeSessionRecord, viewerElo?: number | null, joined?: boolean) {
  const activePlayers = session.session_players.filter((player) => player.status !== 'rejected').length
  const slotsLeft = Math.max(session.max_players - activePlayers, 0)
  const midpoint = Math.round((session.elo_min + session.elo_max) / 2)
  const eloGap = viewerElo == null ? 80 : Math.abs(viewerElo - midpoint)

  let score = 72
  if (session.court_booking_status === 'confirmed') score += 10
  if (isWithinNext24Hours(session.slot?.start_time ?? '')) score += 7
  if (slotsLeft > 0 && slotsLeft <= 2) score += 8
  if (joined) score += 6
  if (eloGap <= 60) score += 10
  else if (eloGap <= 140) score += 6
  else if (eloGap <= 220) score += 3

  return Math.max(78, Math.min(score, 99))
}

function mapLiveSessionToMatchSession(
  session: HomeSessionRecord,
  options?: { viewerId?: string | null; viewerElo?: number | null; hostAverageRating?: number | null; urgent?: boolean },
): MatchSession {
  const levelId = getLevelIdFromSession(session as any)
  const joined =
    (options?.viewerId != null && session.host_id === options.viewerId) ||
    session.session_players.some((player) => player.player_id === options?.viewerId)
  const players = session.session_players
    .filter((player) => player.status !== 'rejected' && player.player)
    .slice(0, 3)
    .map((sessionPlayer) => ({
      id: sessionPlayer.player?.id ?? sessionPlayer.player_id,
      name: sessionPlayer.player?.name ?? 'Người chơi',
      initials: getInitials(sessionPlayer.player?.name ?? 'Người chơi'),
      badge: getLivePlayerBadge(sessionPlayer.player ?? undefined),
    }))
  const activePlayers = session.session_players.filter((player) => player.status !== 'rejected').length
  const slotsLeft = Math.max(session.max_players - activePlayers, 0)
  const urgent = options?.urgent ?? slotsLeft <= 2
  const court = session.slot?.court

  return {
    id: session.id,
    title: urgent ? 'Cần chốt đội hình' : `Kèo ${getSkillLevelUi(levelId).shortLabel.toLowerCase()}`,
    bookingId: `BK-${session.id.slice(0, 6).toUpperCase()}`,
    courtName: court?.name ?? 'Kèo Pickleball',
    address: [court?.address, court?.city].filter(Boolean).join(', '),
    matchScore: computeLiveMatchScore(session, options?.viewerElo, joined),
    skillLabel: getSkillLevelUi(levelId).shortLabel,
    timeLabel: formatTimeLabel(session.slot?.start_time ?? new Date().toISOString(), session.slot?.end_time ?? new Date().toISOString()),
    priceLabel: formatPriceLabel(session.slot?.price ?? 0, session.max_players),
    openSlotsLabel: urgent ? `Thiếu ${Math.max(slotsLeft, 1)} người` : `${slotsLeft} chỗ trống`,
    statusLabel: getStatusLabel(session.court_booking_status as any),
    countdownLabel: isWithinNext24Hours(session.slot?.start_time ?? '') ? formatCountdownLabelFromStartTime(session.slot?.start_time ?? '') : undefined,
    levelId,
    host: {
      name: session.host?.name ?? 'Ẩn danh',
      rating: getLiveHostRating(session, options?.hostAverageRating),
      vibe: buildLiveHostVibe(session, slotsLeft),
    },
    players,
    urgent,
    joined,
  }
}

function buildLiveFamiliarCourts(sessions: HomeSessionRecord[]) {
  const grouped = new Map<string, { id: string; name: string; area: string; openMatches: number }>()

  sessions.forEach((session) => {
    const court = session.slot?.court
    if (!court) return

    const current = grouped.get(court.id)
    if (current) {
      current.openMatches += 1
      return
    }

    grouped.set(court.id, {
      id: court.id,
      name: court.name,
      area: court.city || court.address,
      openMatches: 1,
    })
  })

  return Array.from(grouped.values())
    .sort((left, right) => right.openMatches - left.openMatches)
    .slice(0, 5)
    .map((court, index) => ({
      id: court.id,
      name: court.name,
      area: court.area,
      openMatches: court.openMatches,
      note:
        court.openMatches >= 4
          ? 'Nhiều kèo đang mở, dễ vào sân nhanh'
          : court.openMatches >= 2
            ? 'Có kèo đều trong ngày, hợp để canh ghép trình'
            : 'Đang có tín hiệu mở kèo, đáng để theo dõi',
      image: COURT_FALLBACK_IMAGES[index % COURT_FALLBACK_IMAGES.length],
    }))
}

function buildDashboardStats(profile: HomeProfile | null, playerStats: PlayerStatsRecord | null): StatItem[] {
  const eloValue = profile?.current_elo ?? profile?.elo ?? 0
  const reliabilityValue = profile?.reliability_score ?? 100

  return [
    { id: 'elo', label: 'ELO', value: eloValue ? eloValue.toLocaleString('vi-VN') : '--', accent: 'text-indigo-700', icon: TrendingUp },
    {
      id: 'streak',
      label: 'STREAK',
      value: String(playerStats?.current_win_streak ?? 0).padStart(2, '0'),
      accent: 'text-orange-600',
      icon: Zap,
    },
    { id: 'reputation', label: 'UY TÍN', value: `${reliabilityValue}%`, accent: 'text-emerald-600', icon: ShieldCheck },
  ]
}

function hexToRgb(hex: string) {
  const clean = hex.replace('#', '')
  const value = clean.length === 3 ? clean.split('').map((char) => char + char).join('') : clean
  const numeric = Number.parseInt(value, 16)
  return {
    r: (numeric >> 16) & 255,
    g: (numeric >> 8) & 255,
    b: numeric & 255,
  }
}

function relativeLuminance(hex: string) {
  const { r, g, b } = hexToRgb(hex)
  const channels = [r, g, b].map((value) => {
    const srgb = value / 255
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

function getHeroTextPalette(baseColor: string) {
  const isDark = relativeLuminance(baseColor) < 0.3
  return isDark
    ? {
        primary: '#ffffff',
        secondary: 'rgba(255,255,255,0.84)',
        tertiary: 'rgba(255,255,255,0.68)',
        softChip: 'rgba(255,255,255,0.18)',
        contrastChip: 'rgba(15,23,42,0.18)',
        smartCardBg: 'rgba(255,255,255,0.10)',
        smartCardBorder: 'rgba(255,255,255,0.16)',
      }
    : {
        primary: '#0f172a',
        secondary: 'rgba(15,23,42,0.84)',
        tertiary: 'rgba(15,23,42,0.62)',
        softChip: 'rgba(255,255,255,0.38)',
        contrastChip: 'rgba(15,23,42,0.10)',
        smartCardBg: 'rgba(255,255,255,0.42)',
        smartCardBorder: 'rgba(255,255,255,0.24)',
      }
}

function MiniBadge({
  icon: Icon,
  label,
  tone = 'neutral',
}: {
  icon: typeof Clock
  label: string
  tone?: 'neutral' | 'success' | 'urgent' | 'dark'
}) {
  const palette =
    tone === 'success'
      ? { bg: '#ecfdf5', border: '#a7f3d0', text: '#047857', icon: '#047857' }
      : tone === 'urgent'
        ? { bg: '#fff7ed', border: '#fdba74', text: '#c2410c', icon: '#c2410c' }
        : tone === 'dark'
          ? { bg: 'rgba(15,23,42,0.8)', border: 'rgba(15,23,42,0.08)', text: '#ffffff', icon: '#ffffff' }
          : { bg: '#f8fafc', border: '#e2e8f0', text: '#334155', icon: '#334155' }

  return (
    <View
      className="flex-row items-center rounded-full px-3 py-2"
      style={{ backgroundColor: palette.bg, borderWidth: 1, borderColor: palette.border }}
    >
      <Icon size={14} color={palette.icon} strokeWidth={iconStroke} />
      <Text className="ml-2 text-xs font-bold" style={{ color: palette.text }}>
        {label}
      </Text>
    </View>
  )
}

function HomeGreetingHeader({
  name,
  statusPrompt,
}: {
  name: string
  statusPrompt: string
}) {
  const theme = useAppTheme()

  return (
    <View
      className="flex-row items-start justify-between rounded-[32px] px-5 py-5"
      style={{
        backgroundColor: theme.surface,
        borderWidth: 1,
        borderColor: theme.border,
        ...getShadowStyle(theme),
      }}
    >
      <View className="flex-1 pr-4">
        <Text className="text-[11px] font-bold uppercase tracking-[2.8px]" style={{ color: theme.textSoft }}>Command Center</Text>
        <View className="mt-2 flex-row items-center">
          <Text className="text-[28px] font-black leading-[34px]" style={{ color: theme.text }}>{name}</Text>
          <View className="ml-2 rounded-full p-2" style={{ backgroundColor: theme.warningSoft }}>
            <Hand size={18} color={theme.warning} strokeWidth={iconStroke} />
          </View>
        </View>
        <Text className="mt-2 text-[15px] font-semibold" style={{ color: theme.textMuted }}>{statusPrompt}</Text>
      </View>

      <Pressable
        onPress={() => router.push('/(tabs)/profile' as never)}
        className="h-20 w-20 items-center justify-center rounded-[26px]"
        style={{
          borderWidth: 1,
          borderColor: theme.border,
          backgroundColor: theme.surfaceAlt,
          ...getShadowStyle(theme),
        }}
      >
        <View className="h-[68px] w-[68px] items-center justify-center rounded-[22px]" style={{ backgroundColor: theme.primarySoft }}>
          <UserRound size={30} color={theme.primary} strokeWidth={2.4} />
        </View>
      </Pressable>
    </View>
  )
}

function DashboardStatsStrip({ items }: { items: StatItem[] }) {
  const theme = useAppTheme()

  return (
    <View
      className="mt-6 flex-row rounded-[30px] px-4 py-6"
      style={{
        backgroundColor: theme.surfaceAlt,
        borderWidth: 1,
        borderColor: theme.borderStrong,
        ...getShadowStyle(theme),
      }}
    >
      {items.map((item, index) => {
        const Icon = item.icon
        const valueColorClass =
          item.id === 'elo' ? 'text-indigo-700' : item.id === 'streak' ? 'text-amber-600' : 'text-emerald-700'
        const iconColor = item.id === 'elo' ? '#6366f1' : item.id === 'streak' ? '#f97316' : '#10b981'

        return (
          <View key={item.id} className="flex-1 flex-row items-stretch">
            <View className="flex-1 px-3">
              <View className="flex-row items-center justify-center">
                <Icon size={15} color={iconColor} strokeWidth={iconStroke} />
                <Text className="ml-2 text-[11px] font-bold uppercase tracking-[1px]" style={{ color: theme.textMuted }}>
                  {item.label}
                </Text>
              </View>
              <Text className={`mt-4 text-center text-[28px] font-black ${valueColorClass}`}>{item.value}</Text>
            </View>
            {index < items.length - 1 ? <View className="my-1 w-px self-stretch" style={{ backgroundColor: theme.border }} /> : null}
          </View>
        )
      })}
    </View>
  )
}

function SectionHeader({
  eyebrow,
  title,
  trailing,
}: {
  eyebrow: string
  title: string
  trailing?: string
}) {
  const theme = useAppTheme()

  return (
    <View className="mb-5 flex-row items-end justify-between">
      <View className="flex-1 pr-4">
        <Text className="text-[11px] font-bold uppercase tracking-[2.8px]" style={{ color: theme.textSoft }}>{eyebrow}</Text>
        <Text className="mt-2 text-[28px] font-black" style={{ color: theme.text }}>{title}</Text>
      </View>
      {trailing ? <Text className="text-sm font-bold" style={{ color: theme.textMuted }}>{trailing}</Text> : null}
    </View>
  )
}

function CarouselDots({
  count,
  activeIndex,
}: {
  count: number
  activeIndex: number
}) {
  const theme = useAppTheme()
  const visibleCount = Math.min(count, 5)

  return (
    <View className="flex-row items-center justify-center gap-2">
      {Array.from({ length: visibleCount }).map((_, index) => (
        <View
          key={index}
          className={`rounded-full ${index === activeIndex % visibleCount ? 'h-2 w-4' : 'h-2 w-2'}`}
          style={{ backgroundColor: index === activeIndex % visibleCount ? theme.primary : theme.borderStrong }}
        />
      ))}
    </View>
  )
}

function AvatarStack({
  players,
}: {
  players: Player[]
}) {
  return (
    <View className="flex-row items-center pb-1">
      {players.map((player, index) => (
        <View
          key={player.id}
          className="relative pb-1"
          style={{
            marginLeft: index === 0 ? 0 : 6,
            zIndex: players.length - index,
          }}
        >
          <View className="h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-slate-200">
            <Text className="text-xs font-black text-slate-700">{player.initials}</Text>
          </View>
          <View
            className={`absolute -bottom-1 -right-1 h-5 w-5 items-center justify-center rounded-full border border-white ${
              player.badge === 'trusted' ? 'bg-emerald-500' : 'bg-orange-500'
            }`}
          >
            {player.badge === 'trusted' ? (
              <ShieldCheck size={10} color="#ffffff" strokeWidth={iconStroke} />
            ) : (
              <Zap size={10} color="#ffffff" strokeWidth={iconStroke} />
            )}
          </View>
        </View>
      ))}
    </View>
  )
}

function HeroChip({
  icon: Icon,
  label,
  palette,
  emphasis = 'soft',
}: {
  icon: typeof Clock
  label: string
  palette: ReturnType<typeof getHeroTextPalette>
  emphasis?: 'soft' | 'contrast'
}) {
  return (
    <View
      className="flex-row items-center rounded-full px-3 py-2"
      style={{ backgroundColor: emphasis === 'soft' ? palette.softChip : palette.contrastChip }}
    >
      <Icon size={14} color={palette.primary} strokeWidth={iconStroke} />
      <Text className="ml-2 text-xs font-bold" style={{ color: palette.primary }}>
        {label}
      </Text>
    </View>
  )
}

function MatchScoreBadge({
  score,
  palette,
}: {
  score: number
  palette: ReturnType<typeof getHeroTextPalette>
}) {
  return <HeroChip icon={TrendingUp} label={`${score}% Match`} palette={palette} />
}

function HeroThemeCard({
  item,
  actionLabel = 'Sẵn sàng',
}: {
  item: MatchSession
  actionLabel?: string
}) {
  const skillUi = getSkillLevelUi(item.levelId)
  const WatermarkIcon = skillUi.icon
  const textPalette = getHeroTextPalette(skillUi.heroFrom)
  const openSession = () => router.push({ pathname: '/session/[id]', params: { id: item.id } })

  return (
    <View
      className="overflow-hidden rounded-[48px] p-7"
      style={{
        backgroundColor: skillUi.heroFrom,
        shadowColor: skillUi.heroTo,
        shadowOpacity: 0.26,
        shadowRadius: 28,
        shadowOffset: { width: 0, height: 20 },
      }}
    >
      <View
        style={{
          position: 'absolute',
          right: -80,
          top: -42,
          width: 220,
          height: 220,
          borderRadius: 999,
          backgroundColor: skillUi.heroTo,
          opacity: 0.68,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: -58,
          bottom: -60,
          width: 200,
          height: 200,
          borderRadius: 999,
          backgroundColor: '#ffffff',
          opacity: 0.1,
        }}
      />
      <WatermarkIcon size={140} color="rgba(255,255,255,0.14)" style={{ position: 'absolute', right: -24, bottom: -24 }} />

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center rounded-full px-4 py-2" style={{ backgroundColor: textPalette.softChip }}>
          <View className="mr-2 h-2.5 w-2.5 rounded-full bg-white" />
          <Text className="text-xs font-bold uppercase tracking-[2.4px]" style={{ color: textPalette.primary }}>
            Sắp diễn ra
          </Text>
        </View>
        <Text className="text-xs font-bold uppercase tracking-[2.4px]" style={{ color: textPalette.secondary }}>
          #{item.bookingId}
        </Text>
      </View>

      <View className="mt-8 flex-row items-start justify-between">
        <View className="mr-4 flex-1">
          <Text className="text-[11px] font-bold uppercase tracking-[2.8px]" style={{ color: textPalette.secondary }}>
            BẮT ĐẦU SAU
          </Text>
          <Text className="mt-2 text-[64px] font-black leading-none" style={{ color: textPalette.primary }}>
            {item.countdownLabel ?? '01:24'}
          </Text>
        </View>

        <View className="items-end gap-2">
          <HeroChip icon={Swords} label={skillUi.shortLabel} palette={textPalette} emphasis="contrast" />
          <MatchScoreBadge score={item.matchScore} palette={textPalette} />
        </View>
      </View>

      <View className="mt-7">
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <Text className="text-[22px] font-black" style={{ color: textPalette.primary }}>
              {item.courtName}
            </Text>
            <View className="mt-2 flex-row items-center">
              <MapPin size={14} color={textPalette.secondary} strokeWidth={iconStroke} />
              <Text className="ml-2 text-sm font-semibold" style={{ color: textPalette.secondary }}>
                {item.address}
              </Text>
            </View>
          </View>
        </View>

        <View className="mt-5 flex-row flex-wrap gap-3">
          <HeroChip icon={Clock} label={item.timeLabel} palette={textPalette} />
          <HeroChip icon={Users} label={item.openSlotsLabel} palette={textPalette} />
          <HeroChip icon={ShieldCheck} label={item.statusLabel} palette={textPalette} />
        </View>

        <View
          className="mt-6 rounded-[28px] p-5"
          style={{ backgroundColor: textPalette.smartCardBg, borderWidth: 1, borderColor: textPalette.smartCardBorder }}
        >
          <Text className="text-[9px] font-bold uppercase tracking-[2.8px]" style={{ color: textPalette.tertiary }}>
            HOST
          </Text>
          <View className="mt-3 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="h-12 w-12 items-center justify-center rounded-full border-2 border-white" style={{ backgroundColor: textPalette.contrastChip }}>
                <Text className="text-sm font-black" style={{ color: textPalette.primary }}>
                  {item.host.name.slice(0, 1).toUpperCase()}
                </Text>
              </View>
              <View className="ml-3">
                <View className="flex-row items-center">
                  <Text className="text-base font-black" style={{ color: textPalette.primary }}>
                    {item.host.name}
                  </Text>
                  <View className="ml-2 flex-row items-center">
                    <Star size={14} color={textPalette.primary} strokeWidth={iconStroke} />
                    <Text className="ml-1 text-sm font-black" style={{ color: textPalette.primary }}>
                      {item.host.rating.toFixed(1)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View
              className="flex-row items-center rounded-full px-3 py-1.5"
              style={{ backgroundColor: textPalette.softChip, borderWidth: 1, borderColor: textPalette.smartCardBorder }}
            >
              <Swords size={12} color={textPalette.primary} strokeWidth={iconStroke} />
              <Text className="ml-1.5 text-[10px] font-bold uppercase tracking-[0.8px]" style={{ color: textPalette.primary }}>
                {item.skillLabel}
              </Text>
            </View>
          </View>
          <View className="mt-4 h-px" style={{ backgroundColor: textPalette.smartCardBorder }} />
          <View className="mt-4">
            <Text className="text-[9px] font-bold uppercase tracking-[2.8px]" style={{ color: textPalette.tertiary }}>
              Players
            </Text>
            <View className="mt-2 flex-row items-center">
              <View className="min-w-0 flex-1 overflow-hidden pr-3">
                <AvatarStack players={item.players} />
              </View>

              <Pressable
                onPress={openSession}
                className="shrink-0 flex-row items-center rounded-full px-4 py-3.5"
                style={{ backgroundColor: textPalette.softChip, borderWidth: 1, borderColor: textPalette.smartCardBorder }}
              >
                <Users size={13} color={textPalette.primary} strokeWidth={iconStroke} />
                <Text className="ml-2 text-[11px] font-black uppercase tracking-[1.8px]" style={{ color: textPalette.primary }}>
                  {actionLabel}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}
const _SmartMatchCard = memo(function SmartMatchCard({ item }: { item: MatchSession }) {
  const skillUi = getSkillLevelUi(item.levelId)
  const SkillIcon = skillUi.icon
  const eloRange = getEloRangeForLevel(item.levelId)
  const eloValue = getSkillTargetElo(eloRange.elo_min, eloRange.elo_max)
  const isConfirmed = item.statusLabel.toLowerCase().includes('chốt')
  const openSession = () => router.push({ pathname: '/session/[id]', params: { id: item.id } })

  return (
    <View
      className={`relative min-h-[438px] overflow-hidden rounded-[36px] border bg-white p-6 ${
        item.urgent ? 'border-orange-300' : skillUi.borderClassName
      }`}
      style={{
        minHeight: SMART_MATCH_CARD_HEIGHT,
        shadowColor: item.urgent ? '#fb923c' : '#0f172a',
        shadowOpacity: item.urgent ? 0.12 : 0.08,
        shadowRadius: item.urgent ? 12 : 18,
        shadowOffset: { width: 0, height: item.urgent ? 10 : 12 },
      }}
    >
      <SkillIcon
        size={132}
        color={skillUi.iconColor}
        strokeWidth={2.35}
        style={{
          position: 'absolute',
          right: -18,
          bottom: 18,
          opacity: 0.16,
        }}
      />

      <Text className="text-[24px] font-black text-slate-950">{item.courtName}</Text>
      <View className="mt-2 flex-row items-center">
        <MapPin size={14} color="#64748b" strokeWidth={iconStroke} />
        <Text className="ml-2 text-sm font-medium text-slate-500">{item.address}</Text>
      </View>
      <View className="mt-3 self-start">
        <View className={`flex-row items-center rounded-full px-3 py-1.5 ${isConfirmed ? 'bg-emerald-50' : 'bg-orange-50'}`}>
          {isConfirmed ? (
            <ShieldCheck size={12} color="#047857" strokeWidth={iconStroke} />
          ) : (
            <AlertCircle size={12} color="#c2410c" strokeWidth={iconStroke} />
          )}
          <Text className={`ml-1.5 text-[11px] font-bold uppercase tracking-[1px] ${isConfirmed ? 'text-emerald-700' : 'text-orange-700'}`}>
            {item.statusLabel}
          </Text>
        </View>
      </View>
      <View className="mt-4 flex-row items-center">
        <Calendar size={18} color="#4338ca" strokeWidth={iconStroke} />
        <Text className="ml-2 text-[20px] font-black leading-[24px] text-slate-950">{item.timeLabel}</Text>
      </View>

      <Text className="mt-5 text-[9px] font-bold uppercase tracking-[2.8px] text-slate-400">Điều kiện trận</Text>
      <View className="mt-2 flex-row flex-wrap items-center gap-3">
        <View className="rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-3">
          <View className="flex-row items-center">
            <TrendingUp size={16} color="#047857" strokeWidth={iconStroke} />
            <Text className="ml-2 text-[18px] font-black text-emerald-700">{item.matchScore}% Match</Text>
          </View>
        </View>
        <View className="rounded-full border border-amber-200 bg-amber-50 px-4 py-3">
          <View className="flex-row items-center">
            <Heart size={16} color="#b45309" strokeWidth={iconStroke} />
            <Text className="ml-2 text-[16px] font-black text-amber-700">{item.priceLabel}</Text>
          </View>
        </View>
      </View>

      <Text className="mt-5 text-[9px] font-bold uppercase tracking-[2.8px] text-slate-400">Thông số</Text>
      <View className="mt-2 flex-row flex-wrap gap-3">
        <View className={`flex-row items-center rounded-full border px-3 py-2 ${skillUi.tagClassName} ${skillUi.borderClassName}`}>
          <SkillIcon size={13} color={skillUi.iconColor} strokeWidth={iconStroke} />
          <Text className={`ml-2 text-xs font-semibold uppercase tracking-[0.8px] ${skillUi.textClassName}`}>
            {item.skillLabel}
          </Text>
        </View>
        <View className="flex-row items-center rounded-full border border-slate-200 bg-slate-100 px-3 py-2">
          <TrendingUp size={12} color="#64748b" strokeWidth={iconStroke} />
          <Text className="ml-1.5 text-xs font-semibold uppercase tracking-[0.8px] text-slate-500">{eloValue} ELO</Text>
        </View>
        <View className="flex-row items-center rounded-full border border-slate-200 bg-slate-100 px-3 py-2">
          <Zap size={12} color="#64748b" strokeWidth={iconStroke} />
          <Text className="ml-1.5 text-xs font-semibold uppercase tracking-[0.8px] text-slate-500">
            {skillUi.duprValue} DUPR
          </Text>
        </View>
      </View>

      <View className="mt-6 rounded-[28px] bg-slate-50 p-5">
        <Text className="text-[9px] font-bold uppercase tracking-[2.8px] text-slate-400">HOST</Text>
        <View className="mt-3 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="relative">
              <View className="h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-slate-900">
                <Text className="text-sm font-black text-white">{item.host.name.slice(0, 1).toUpperCase()}</Text>
              </View>
            </View>
            <View className="ml-3">
              <View className="flex-row items-center">
                <Text className="text-base font-black text-slate-950">{item.host.name}</Text>
                <View className="ml-2 flex-row items-center">
                  <Star size={14} color="#b45309" strokeWidth={iconStroke} />
                  <Text className="ml-1 text-sm font-black text-amber-700">{item.host.rating.toFixed(1)}</Text>
                </View>
              </View>
            </View>
          </View>
          <View className="items-end">
            <View className={`flex-row items-center rounded-full border px-3 py-1.5 ${skillUi.tagClassName} ${skillUi.borderClassName}`}>
              <SkillIcon size={12} color={skillUi.iconColor} strokeWidth={iconStroke} />
              <Text className={`ml-1.5 text-[10px] font-bold uppercase tracking-[0.8px] ${skillUi.textClassName}`}>{item.skillLabel}</Text>
            </View>
          </View>
        </View>
        <View className="mt-4 h-px bg-slate-200" />
        <View className="mt-4">
          <Text className="text-[9px] font-bold uppercase tracking-[2.8px] text-slate-400">Players</Text>
          <View className="mt-2 flex-row items-center">
            <View className="min-w-0 flex-1 overflow-hidden pr-3">
              <AvatarStack players={item.players} />
            </View>

            <Pressable onPress={openSession} className="shrink-0 flex-row items-center rounded-full bg-emerald-600 px-4 py-3.5">
              <Users size={13} color="#ffffff" strokeWidth={iconStroke} />
              <Text className="ml-2 text-[11px] font-black uppercase tracking-[1.8px] text-white">Tham gia</Text>
            </Pressable>
          </View>
        </View>
      </View>

    </View>
  )
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SmartQueueHeroCard = memo(function SmartQueueHeroCard({ item }: { item: MatchSession }) {
  const skillUi = getSkillLevelUi(item.levelId)
  const textPalette = getHeroTextPalette(skillUi.heroFrom)
  const WatermarkIcon = skillUi.icon
  const openSession = () => router.push({ pathname: '/session/[id]', params: { id: item.id } })

  return (
    <View
      className={`overflow-hidden rounded-[32px] border p-5 ${
        item.urgent ? 'border-orange-300' : 'border-white/10'
      }`}
      style={{
        backgroundColor: skillUi.heroFrom,
        shadowColor: item.urgent ? '#fb923c' : skillUi.heroTo,
        shadowOpacity: item.urgent ? 0.12 : 0.18,
        shadowRadius: item.urgent ? 12 : 20,
        shadowOffset: { width: 0, height: item.urgent ? 10 : 14 },
      }}
    >
      <View
        style={{
          position: 'absolute',
          right: -70,
          top: -36,
          width: 200,
          height: 200,
          borderRadius: 999,
          backgroundColor: skillUi.heroTo,
          opacity: 0.66,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: -54,
          bottom: -54,
          width: 180,
          height: 180,
          borderRadius: 999,
          backgroundColor: '#ffffff',
          opacity: 0.1,
        }}
      />
      <WatermarkIcon
        size={120}
        color="rgba(255,255,255,0.14)"
        style={{ position: 'absolute', right: -20, bottom: -18 }}
      />

      <View className="flex-row items-start justify-between">
        <View className="flex-row flex-wrap items-center gap-2">
          <HeroChip icon={ShieldCheck} label={item.statusLabel} palette={textPalette} />
          {item.urgent ? <MiniBadge icon={Zap} label="Cứu nét" tone="urgent" /> : null}
        </View>
        <View className="rounded-full px-3 py-2" style={{ backgroundColor: textPalette.softChip }}>
          <Text className="text-sm font-black" style={{ color: textPalette.primary }}>
            {item.matchScore}%
          </Text>
        </View>
      </View>

      <Text className="mt-5 text-[24px] font-black" style={{ color: textPalette.primary }}>
        {item.courtName}
      </Text>
      <View className="mt-2 flex-row items-center">
        <MapPin size={14} color={textPalette.secondary} strokeWidth={iconStroke} />
        <Text className="ml-2 text-sm font-medium" style={{ color: textPalette.secondary }}>
          {item.address}
        </Text>
      </View>

      <View className="mt-5 flex-row flex-wrap gap-3">
        <HeroChip icon={Swords} label={item.skillLabel} palette={textPalette} />
        <HeroChip icon={Clock} label={item.timeLabel} palette={textPalette} />
        <HeroChip icon={Users} label={item.openSlotsLabel} palette={textPalette} />
        <HeroChip icon={Heart} label={item.priceLabel} palette={textPalette} emphasis="contrast" />
      </View>

      <View
        className="mt-6 rounded-[26px] p-4"
        style={{ backgroundColor: textPalette.smartCardBg, borderWidth: 1, borderColor: textPalette.smartCardBorder }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: textPalette.softChip }}>
              <Star size={16} color={textPalette.primary} strokeWidth={iconStroke} />
            </View>
            <View className="ml-3">
              <Text className="text-[11px] font-bold uppercase tracking-[2.4px]" style={{ color: textPalette.tertiary }}>
                Host rating
              </Text>
              <Text className="mt-1 text-base font-black" style={{ color: textPalette.primary }}>
                {item.host.name} · {item.host.rating.toFixed(1)}
              </Text>
              <Text className="mt-1 text-sm" style={{ color: textPalette.secondary }}>
                {item.host.vibe}
              </Text>
            </View>
          </View>
          <Heart size={16} color={textPalette.primary} strokeWidth={iconStroke} />
        </View>
      </View>

      <View className="mt-6 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <AvatarStack players={item.players} />
          <View className="ml-4 rounded-full border px-4 py-2" style={{ borderColor: textPalette.smartCardBorder, backgroundColor: textPalette.softChip }}>
            <Text className="text-xs font-bold uppercase tracking-[2.2px]" style={{ color: textPalette.primary }}>
              Bạn?
            </Text>
          </View>
        </View>

        <Pressable onPress={openSession} className="rounded-full px-5 py-4" style={{ backgroundColor: item.urgent ? '#fb923c' : '#ffffff' }}>
          <Text className="text-xs font-black uppercase tracking-[2.4px]" style={{ color: item.urgent ? '#ffffff' : skillUi.heroFrom }}>
            Tham gia
          </Text>
        </Pressable>
      </View>
    </View>
  )
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SmartQueueStructuredCard = memo(function SmartQueueStructuredCard({ item }: { item: MatchSession }) {
  const skillUi = getSkillLevelUi(item.levelId)
  const SkillIcon = skillUi.icon
  const openSession = () => router.push({ pathname: '/session/[id]', params: { id: item.id } })

  return (
    <View
      className={`relative overflow-hidden rounded-[32px] border bg-white p-5 ${
        item.urgent ? 'border-orange-300' : 'border-slate-100'
      }`}
      style={{
        shadowColor: item.urgent ? '#fb923c' : '#0f172a',
        shadowOpacity: item.urgent ? 0.12 : 0.08,
        shadowRadius: item.urgent ? 12 : 18,
        shadowOffset: { width: 0, height: item.urgent ? 10 : 12 },
      }}
    >
      <SkillIcon
        size={132}
        color={skillUi.iconColor}
        strokeWidth={2.35}
        style={{
          position: 'absolute',
          right: -18,
          bottom: 18,
          opacity: 0.16,
        }}
      />

        <View className="flex-row items-center justify-between">
        <View className="flex-row flex-wrap items-center gap-2">
          <MiniBadge icon={ShieldCheck} label={item.statusLabel} tone="neutral" />
          {item.urgent ? <MiniBadge icon={Zap} label="Cứu nét" tone="urgent" /> : null}
        </View>
        <Text className="text-xs font-bold uppercase tracking-[2.4px] text-slate-400">#{item.bookingId}</Text>
      </View>

      <View className="mt-6">
        <Text className="text-[11px] font-bold uppercase tracking-[2.8px] text-slate-400">Smart Queue</Text>
        <Text className="mt-3 text-[28px] font-black leading-tight text-slate-950">{item.courtName}</Text>
        <Text className="mt-2 text-base font-semibold text-slate-500">{item.title}</Text>
      </View>

      <View className="mt-6 rounded-[30px] border border-slate-200 bg-slate-50 p-5">
        <View className="flex-row items-start justify-between">
          <View className="mr-4 flex-1">
            <View className="mt-1 flex-row items-center">
              <MapPin size={14} color="#64748b" strokeWidth={iconStroke} />
              <Text className="ml-2 text-sm font-medium text-slate-500">{item.address}</Text>
            </View>
          </View>
          <View className="rounded-full bg-emerald-50 px-4 py-2">
            <Text className="text-sm font-black text-emerald-700">{item.matchScore}%</Text>
          </View>
        </View>

        <View className="mt-5 flex-row flex-wrap gap-3">
          <MiniBadge icon={Swords} label={item.skillLabel} />
          <MiniBadge icon={Clock} label={item.timeLabel} />
          <MiniBadge icon={Users} label={item.openSlotsLabel} tone={item.urgent ? 'urgent' : 'neutral'} />
          <MiniBadge icon={Heart} label={item.priceLabel} tone="success" />
        </View>

        <View className="mt-6 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <AvatarStack players={item.players} />
            <View className="ml-4">
              <Text className="text-[11px] font-bold uppercase tracking-[2.6px] text-slate-400">Host</Text>
              <Text className="mt-1 text-base font-black text-slate-950">
                {item.host.name} · {item.host.rating.toFixed(1)}
              </Text>
            </View>
          </View>
          <View className="items-end">
            <Text className="text-[11px] font-bold uppercase tracking-[2.4px] text-slate-400">Nhịp kèo</Text>
            <Text className="mt-1 text-base font-black text-slate-950">{item.host.vibe}</Text>
          </View>
        </View>
      </View>

      <View className="mt-6 flex-row items-center justify-between">
        <View className="rounded-full border border-dashed border-slate-300 px-4 py-2">
          <Text className="text-xs font-bold uppercase tracking-[2.2px] text-slate-500">Bạn?</Text>
        </View>

        <Pressable onPress={openSession} className="rounded-full bg-emerald-600 px-5 py-4">
          <Text className="text-xs font-black uppercase tracking-[2.4px] text-white">Tham gia</Text>
        </Pressable>
      </View>
    </View>
  )
})

const SmartQueueHeroStyledCard = memo(function SmartQueueHeroStyledCard({ item }: { item: MatchSession }) {
  const skillUi = getSkillLevelUi(item.levelId)
  const textPalette = getHeroTextPalette(skillUi.heroFrom)
  const WatermarkIcon = skillUi.icon
  const eloRange = getEloRangeForLevel(item.levelId)
  const eloValue = getSkillTargetElo(eloRange.elo_min, eloRange.elo_max)
  const isConfirmed = item.statusLabel.toLowerCase().includes('chốt')
  const openSession = () => router.push({ pathname: '/session/[id]', params: { id: item.id } })

  return (
    <View
      className={`relative overflow-hidden rounded-[48px] border p-7 ${item.urgent ? 'border-orange-300' : 'border-white/10'}`}
      style={{
        backgroundColor: skillUi.heroFrom,
        shadowColor: item.urgent ? '#fb923c' : skillUi.heroTo,
        shadowOpacity: item.urgent ? 0.16 : 0.26,
        shadowRadius: item.urgent ? 16 : 28,
        shadowOffset: { width: 0, height: item.urgent ? 12 : 20 },
      }}
    >
      <View
        style={{
          position: 'absolute',
          right: -80,
          top: -42,
          width: 220,
          height: 220,
          borderRadius: 999,
          backgroundColor: skillUi.heroTo,
          opacity: 0.68,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: -58,
          bottom: -60,
          width: 200,
          height: 200,
          borderRadius: 999,
          backgroundColor: '#ffffff',
          opacity: 0.1,
        }}
      />
      <WatermarkIcon size={140} color="rgba(255,255,255,0.14)" style={{ position: 'absolute', right: -24, bottom: -24 }} />

      <View>
        <Text
          className="text-[28px] font-black"
          style={{ color: textPalette.primary }}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.72}
        >
          {item.courtName}
        </Text>
        <View className="mt-2 flex-row flex-wrap items-center gap-3">
          <View className="flex-row items-center">
            <MapPin size={14} color={textPalette.secondary} strokeWidth={iconStroke} />
            <Text className="ml-2 text-sm font-medium" style={{ color: textPalette.secondary }}>
              {item.address}
            </Text>
          </View>
        </View>
        <View className="mt-3 self-start">
          <HeroChip icon={ShieldCheck} label={item.statusLabel} palette={textPalette} emphasis={isConfirmed ? 'soft' : 'contrast'} />
        </View>
        <View className="mt-4 flex-row items-center">
          <Calendar size={18} color={textPalette.primary} strokeWidth={iconStroke} />
          <Text className="ml-2 text-[20px] font-black leading-[24px]" style={{ color: textPalette.primary }}>
            {item.timeLabel}
          </Text>
        </View>
      </View>

      <View className="mt-5 flex-row flex-wrap items-center gap-3">
        <View className="rounded-[22px] border px-4 py-3" style={{ backgroundColor: textPalette.softChip, borderColor: textPalette.smartCardBorder }}>
          <View className="flex-row items-center">
            <TrendingUp size={16} color={textPalette.primary} strokeWidth={iconStroke} />
            <Text className="ml-2 text-[15px] font-black" style={{ color: textPalette.primary }}>
              {item.matchScore}% Match
            </Text>
          </View>
        </View>
        <View className="rounded-full border px-4 py-3" style={{ backgroundColor: textPalette.softChip, borderColor: textPalette.smartCardBorder }}>
          <View className="flex-row items-center">
            <DollarSign size={16} color={textPalette.primary} strokeWidth={iconStroke} />
            <Text className="ml-2 text-[14px] font-black" style={{ color: textPalette.primary }}>
              {item.priceLabel}
            </Text>
          </View>
        </View>
      </View>

      <Text className="mt-5 text-[9px] font-bold uppercase tracking-[2.8px]" style={{ color: textPalette.tertiary }}>
        Thông số
      </Text>
      <View className="mt-2 flex-row items-center gap-2">
        <View className="min-w-0 flex-1 flex-row items-center justify-center rounded-full px-3 py-2" style={{ backgroundColor: textPalette.softChip }}>
          <Swords size={13} color={textPalette.primary} strokeWidth={iconStroke} />
          <Text
            className="ml-2 text-xs font-semibold uppercase tracking-[0.8px]"
            style={{ color: textPalette.primary }}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            {item.skillLabel}
          </Text>
        </View>
        <View className="min-w-0 flex-1 flex-row items-center justify-center rounded-full px-3 py-2" style={{ backgroundColor: textPalette.softChip }}>
          <Users size={12} color={textPalette.primary} strokeWidth={iconStroke} />
          <Text
            className="ml-1.5 text-xs font-semibold uppercase tracking-[0.8px]"
            style={{ color: textPalette.primary }}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
          >
            {item.openSlotsLabel}
          </Text>
        </View>
        <View className="min-w-0 flex-1 flex-row items-center justify-center rounded-full px-3 py-2" style={{ backgroundColor: textPalette.softChip }}>
          <TrendingUp size={12} color={textPalette.primary} strokeWidth={iconStroke} />
          <Text
            className="ml-1.5 text-xs font-semibold uppercase tracking-[0.8px]"
            style={{ color: textPalette.primary }}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
          >
            {`${eloValue} ELO`}
          </Text>
        </View>
      </View>

      <View
        className="mt-6 rounded-[28px] p-5"
        style={{ backgroundColor: textPalette.smartCardBg, borderWidth: 1, borderColor: textPalette.smartCardBorder }}
      >
        <Text className="text-[9px] font-bold uppercase tracking-[2.8px]" style={{ color: textPalette.tertiary }}>
          HOST
        </Text>
        <View className="mt-3 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="h-12 w-12 items-center justify-center rounded-full border-2 border-white" style={{ backgroundColor: textPalette.contrastChip }}>
              <Text className="text-sm font-black" style={{ color: textPalette.primary }}>
                {item.host.name.slice(0, 1).toUpperCase()}
              </Text>
            </View>
            <View className="ml-3">
              <View className="flex-row items-center">
                <Text className="text-base font-black" style={{ color: textPalette.primary }}>
                  {item.host.name}
                </Text>
                <View className="ml-2 flex-row items-center">
                  <Star size={14} color={textPalette.primary} strokeWidth={iconStroke} />
                  <Text className="ml-1 text-sm font-black" style={{ color: textPalette.primary }}>
                    {item.host.rating.toFixed(1)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View
            className="flex-row items-center rounded-full px-3 py-1.5"
            style={{ backgroundColor: textPalette.softChip, borderWidth: 1, borderColor: textPalette.smartCardBorder }}
          >
            <Swords size={12} color={textPalette.primary} strokeWidth={iconStroke} />
            <Text className="ml-1.5 text-[10px] font-bold uppercase tracking-[0.8px]" style={{ color: textPalette.primary }}>
              {item.skillLabel}
            </Text>
          </View>
        </View>
        <View className="mt-4 h-px" style={{ backgroundColor: textPalette.smartCardBorder }} />
        <View className="mt-4">
          <Text className="text-[9px] font-bold uppercase tracking-[2.8px]" style={{ color: textPalette.tertiary }}>
            Players
          </Text>
          <View className="mt-2 flex-row items-center">
            <View className="min-w-0 flex-1 overflow-hidden pr-3">
              <AvatarStack players={item.players} />
            </View>

            <Pressable onPress={openSession} className="shrink-0 flex-row items-center rounded-full px-4 py-3.5" style={{ backgroundColor: textPalette.primary }}>
              <Users size={13} color={skillUi.heroFrom} strokeWidth={iconStroke} />
              <Text className="ml-2 text-[11px] font-black uppercase tracking-[1.8px]" style={{ color: skillUi.heroFrom }}>
                Tham gia
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  )
})

const FamiliarCourtCard = memo(function FamiliarCourtCard({ item }: { item: FamiliarCourt }) {
  return (
    <ImageBackground
      source={{ uri: item.image }}
      imageStyle={{ borderRadius: 40 }}
      className="h-64 overflow-hidden rounded-[40px]"
      style={{ height: COURT_CARD_HEIGHT }}
    >
      <View className="flex-1 justify-between bg-black/15 p-5">
        <View className="flex-row items-start justify-between">
          <View className="rounded-full border border-white/20 bg-white/15 px-4 py-2">
            <View className="flex-row items-center">
              <Home size={14} color="#ffffff" strokeWidth={iconStroke} />
              <Text className="ml-2 text-xs font-bold uppercase tracking-[2.2px] text-white">Sân quen</Text>
            </View>
          </View>

          <View className="rounded-full border border-orange-200 bg-white px-4 py-2">
            <View className="flex-row items-center">
              <Zap size={14} color="#ea580c" strokeWidth={iconStroke} />
              <Text className="ml-2 text-xs font-black text-orange-700">{item.openMatches} kèo đang mở</Text>
            </View>
          </View>
        </View>

        <View
          className="rounded-[28px] border border-white/70 bg-white/90 p-4"
          style={{ shadowColor: '#0f172a', shadowOpacity: 0.12, shadowRadius: 18, shadowOffset: { width: 0, height: 10 } }}
        >
          <Text className="text-[22px] font-black text-slate-950">{item.name}</Text>
          <View className="mt-2 flex-row items-center">
            <MapPin size={14} color="#475569" strokeWidth={iconStroke} />
            <Text className="ml-2 text-sm font-semibold text-slate-600">{item.area}</Text>
          </View>
          <Text className="mt-3 text-sm leading-6 text-slate-500">{item.note}</Text>
        </View>
      </View>
    </ImageBackground>
  )
})

const CarouselCard = memo(function CarouselCard({
  index,
  itemCount,
  scrollOffset,
  children,
}: {
  index: number
  itemCount: number
  scrollOffset: SharedValue<number>
  children: ReactNode
}) {
  const cardStyle = useAnimatedStyle(() => {
    const itemOffset = index * (carouselCardWidth + carouselGap)
    const distance = Math.abs(scrollOffset.value - itemOffset)
    const progress = Math.min(distance / (carouselCardWidth + carouselGap), 1)

    return {
      opacity: 1 - progress * 0.2,
      transform: [
        { translateY: progress * 8 },
        { scale: 1 - progress * 0.04 },
      ],
    }
  })

  return (
    <Animated.View
      style={[
        {
          width: carouselCardWidth,
          marginRight: index === itemCount - 1 ? 0 : carouselGap,
        },
        cardStyle,
      ]}
    >
      {children}
    </Animated.View>
  )
})

function SwipeStack<T>({
  items,
  containerHeight,
  renderCard,
  onIndexChange,
}: {
  items: T[]
  containerHeight: number
  renderCard: (item: T) => ReactNode
  onIndexChange?: (index: number) => void
}) {
  const scrollRef = useAnimatedRef<Animated.ScrollView>()
  const scrollOffset = useScrollOffset(scrollRef)
  const [measuredHeight, setMeasuredHeight] = useState(0)

  return (
    <Animated.ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      scrollEventThrottle={16}
      decelerationRate="fast"
      snapToInterval={carouselCardWidth + carouselGap}
      snapToAlignment="start"
      disableIntervalMomentum
      contentContainerStyle={{ paddingRight: 0 }}
      style={{ height: measuredHeight || containerHeight }}
      onScroll={(event) => {
        const offsetX = event.nativeEvent.contentOffset.x
        const nextIndex = Math.round(offsetX / (carouselCardWidth + carouselGap))
        onIndexChange?.(nextIndex)
      }}
    >
      {items.map((item, index) => {
        return (
          <CarouselCard
            key={String((item as { id?: string }).id ?? index)}
            index={index}
            itemCount={items.length}
            scrollOffset={scrollOffset}
          >
            <View
              onLayout={(event) => {
                const nextHeight = Math.ceil(event.nativeEvent.layout.height)
                if (nextHeight !== measuredHeight) {
                  setMeasuredHeight(nextHeight)
                }
              }}
            >
              {renderCard(item)}
            </View>
          </CarouselCard>
        )
      })}
    </Animated.ScrollView>
  )
}

export default function HomeScreen() {
  const theme = useAppTheme()
  const { userId, isLoading: isAuthLoading } = useAuth()
  const [personalizedIndex, setPersonalizedIndex] = useState(0)
  const [rescueIndex, setRescueIndex] = useState(0)
  const [courtIndex, setCourtIndex] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<HomeProfile | null>(null)
  const [playerStats, setPlayerStats] = useState<PlayerStatsRecord | null>(null)
  const [nextMatch, setNextMatch] = useState<MatchSession | null>(null)
  const [personalizedSessions, setPersonalizedSessions] = useState<MatchSession[]>([])
  const [rescueSessions, setRescueSessions] = useState<MatchSession[]>([])
  const [familiarCourts, setFamiliarCourts] = useState<FamiliarCourt[]>([])
  const hasUpcomingMatch = Boolean(nextMatch)
  const fetchHomeData = useCallback(async () => {
    if (isAuthLoading) return

    setLoading(true)

    try {
      const openSessionsPromise = supabase
        .from('sessions')
        .select(
          `
          id, host_id, elo_min, elo_max, max_players, status, court_booking_status, created_at,
          host:host_id ( id, name, current_elo, elo, self_assessed_level, skill_label, reliability_score, host_reputation ),
          slot:slot_id (
            id, start_time, end_time, price,
            court:court_id ( id, name, address, city )
          ),
          session_players (
            player_id, status,
            player:player_id ( id, name, reliability_score, current_elo, self_assessed_level, skill_label )
          )
        `,
        )
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(30)

      const profilePromise = userId
        ? supabase
            .from('players')
            .select('id, name, current_elo, elo, reliability_score, host_reputation')
            .eq('id', userId)
            .maybeSingle()
        : Promise.resolve({ data: null })

      const playerStatsPromise = userId
        ? supabase
            .from('player_stats')
            .select('current_win_streak, host_average_rating')
            .eq('player_id', userId)
            .maybeSingle()
        : Promise.resolve({ data: null })

      const overviewPromise = userId ? supabase.rpc('get_my_sessions_overview') : Promise.resolve({ data: [] })

      const [openSessionsResult, profileResult, playerStatsResult, overviewResult] = await Promise.all([
        openSessionsPromise,
        profilePromise,
        playerStatsPromise,
        overviewPromise,
      ])

      const openSessions = ((openSessionsResult.data ?? []) as unknown as HomeSessionRecordRaw[]).map(normalizeHomeSessionRecord)
      const nextProfile = (profileResult.data ?? null) as HomeProfile | null
      const nextPlayerStats = (playerStatsResult.data ?? null) as PlayerStatsRecord | null
      const overviewRows = (overviewResult.data ?? []) as MySessionOverviewRow[]
      const viewerElo = nextProfile?.current_elo ?? nextProfile?.elo ?? null

      const sortedOpenSessions = [...openSessions].sort(
        (left, right) => Date.parse(left.slot?.start_time ?? '') - Date.parse(right.slot?.start_time ?? ''),
      )

      const upcomingOverview = overviewRows
        .filter((item) => item.status === 'open' && isWithinNext24Hours(item.start_time))
        .sort((left, right) => Date.parse(left.start_time) - Date.parse(right.start_time))[0]

      const liveNextSession =
        sortedOpenSessions.find((session) => session.id === upcomingOverview?.id) ??
        sortedOpenSessions.find(
          (session) =>
            isWithinNext24Hours(session.slot?.start_time ?? '') &&
            (session.host_id === userId || session.session_players.some((player) => player.player_id === userId)),
        ) ??
        null

      setProfile(nextProfile)
      setPlayerStats(nextPlayerStats)
      setNextMatch(
        liveNextSession
          ? mapLiveSessionToMatchSession(liveNextSession, {
              viewerId: userId,
              viewerElo,
              hostAverageRating: nextPlayerStats?.host_average_rating,
            })
          : null,
      )
      setPersonalizedSessions(
        sortedOpenSessions
          .filter((session) => session.id !== liveNextSession?.id)
          .map((session) => mapLiveSessionToMatchSession(session, { viewerId: userId, viewerElo }))
          .sort((left, right) => right.matchScore - left.matchScore)
          .slice(0, 5),
      )
      setRescueSessions(
        sortedOpenSessions
          .filter((session) => {
            const activePlayers = session.session_players.filter((player) => player.status !== 'rejected').length
            const slotsLeft = Math.max(session.max_players - activePlayers, 0)
            return slotsLeft > 0 && slotsLeft <= 2
          })
          .map((session) => mapLiveSessionToMatchSession(session, { viewerId: userId, viewerElo, urgent: true }))
          .sort((left, right) => right.matchScore - left.matchScore)
          .slice(0, 5),
      )
      setFamiliarCourts(buildLiveFamiliarCourts(sortedOpenSessions))
    } catch (error) {
      console.warn('[HomeScreen] fetchHomeData failed:', error)
      setProfile(null)
      setPlayerStats(null)
      setNextMatch(null)
      setPersonalizedSessions([])
      setRescueSessions([])
      setFamiliarCourts([])
    } finally {
      setLoading(false)
    }
  }, [isAuthLoading, userId])

  useEffect(() => {
    void fetchHomeData()
  }, [fetchHomeData])

  useFocusEffect(
    useCallback(() => {
      void fetchHomeData()
    }, [fetchHomeData]),
  )

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await fetchHomeData()
    setRefreshing(false)
  }, [fetchHomeData])

  const dashboardStats = buildDashboardStats(profile, playerStats)
  const statusPrompt = hasUpcomingMatch ? 'Đã sẵn sàng ra sân chưa?' : 'Hôm nay ra sân chứ'
  const renderPersonalizedCard = useCallback(
    (item: MatchSession) => (hasUpcomingMatch ? <_SmartMatchCard item={item} /> : <SmartQueueHeroStyledCard item={item} />),
    [hasUpcomingMatch]
  )
  const renderRescueCard = useCallback((item: MatchSession) => <_SmartMatchCard item={item} />, [])
  const renderCourtCard = useCallback((item: FamiliarCourt) => <FamiliarCourtCard item={item} />, [])

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: theme.backgroundMuted }} edges={['top']}>
      <View className="flex-1" style={{ backgroundColor: theme.backgroundMuted }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 160 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
        >
          <HomeGreetingHeader name={profile?.name ?? 'Bạn'} statusPrompt={statusPrompt} />

          <DashboardStatsStrip items={dashboardStats} />

          {nextMatch ? (
            <View className="mt-8">
              <HeroThemeCard item={nextMatch} actionLabel="Sẵn sàng" />
            </View>
          ) : null}

          {loading ? (
            <View className="mt-8 items-center rounded-[28px] border border-slate-200 bg-white py-12">
              <ActivityIndicator color={theme.primary} />
              <Text className="mt-4 text-sm font-semibold text-slate-500">Đang tải dữ liệu thật từ hệ thống...</Text>
            </View>
          ) : null}

          {personalizedSessions.length > 0 ? <View className="mt-6">
            <SectionHeader eyebrow="Smart Queue" title="Dành riêng cho bạn" />
            <SwipeStack
              items={personalizedSessions}
              containerHeight={CAROUSEL_SECTION_HEIGHT}
              renderCard={renderPersonalizedCard}
              onIndexChange={setPersonalizedIndex}
            />
            <View className="mt-4">
              <CarouselDots count={personalizedSessions.length} activeIndex={personalizedIndex} />
            </View>
          </View> : null}

          {rescueSessions.length > 0 ? <View className="mt-10">
            <SectionHeader eyebrow="Urgent Fill" title="Cứu nét khẩn cấp" />
            <SwipeStack
              items={rescueSessions}
              containerHeight={CAROUSEL_SECTION_HEIGHT}
              renderCard={renderRescueCard}
              onIndexChange={setRescueIndex}
            />
            <View className="mt-4">
              <CarouselDots count={rescueSessions.length} activeIndex={rescueIndex} />
            </View>
          </View> : null}

          {familiarCourts.length > 0 ? <View className="mt-10">
            <SectionHeader eyebrow="Go-To Courts" title="Sân quen của bạn" />
            <SwipeStack
              items={familiarCourts}
              containerHeight={COURT_CAROUSEL_HEIGHT}
              renderCard={renderCourtCard}
              onIndexChange={setCourtIndex}
            />
            <View className="mt-4">
              <CarouselDots count={familiarCourts.length} activeIndex={courtIndex} />
            </View>
          </View> : null}
        </ScrollView>

        <Pressable
          onPress={() => router.push('/create-session' as never)}
          className="absolute bottom-8 right-5 flex-row items-center rounded-full px-8 py-5"
          style={{ backgroundColor: theme.primary, shadowColor: theme.primaryStrong, shadowOpacity: 0.34, shadowRadius: 24, shadowOffset: { width: 0, height: 16 } }}
        >
          <Plus size={20} color={theme.primaryContrast} strokeWidth={iconStroke} />
          <Text className="ml-3 text-sm font-black uppercase tracking-[2.6px]" style={{ color: theme.primaryContrast }}>Tạo kèo mới</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}
