import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import type { LucideIcon } from 'lucide-react-native'
import { AlertCircle, CalendarDays, DollarSign, MapPin, ShieldCheck, Star, Trophy } from 'lucide-react-native'
import type { GestureResponderEvent } from 'react-native'
import { useEffect, useMemo, useState } from 'react'
import { Pressable, Text, View } from 'react-native'

import { PROFILE_THEME_COLORS, PROFILE_THEME_SEMANTIC } from '@/components/profile/profileTheme'
import { colors } from '@/constants/colors'
import { AppFontSet } from '@/constants/typography'
import type { MatchSession } from '@/lib/homeFeed'
import { getSkillLevelUi } from '@/lib/skillLevelUi'
import { formatDistance, getAvatarColor } from '@/utils/formatters'
import { RADIUS, SHADOW, SPACING, BORDER, BUTTON } from '@/constants/screenLayout'
import { SCREEN_FONTS } from '@/constants/typography'

export const SMART_MATCH_CARD_HEIGHT = 380

function openPlayerProfile(playerId?: string, event?: GestureResponderEvent) {
  event?.stopPropagation()
  if (!playerId) return
  router.push({ pathname: '/player/[id]' as never, params: { id: playerId } })
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

function withAlpha(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function getBookingStatusVisual(statusLabel: string) {
  const normalized = statusLabel.toLowerCase()
  const isBooked = normalized.includes('\u0111\u00e3 \u0111\u1eb7t s\u00e2n')
  return {
    Icon: isBooked ? ShieldCheck : AlertCircle,
  }
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function pad2(value: number) {
  return value.toString().padStart(2, '0')
}

function splitMatchTimeLabel(timeLabel: string) {
  const parts = timeLabel.split(/\u2022|â€¢|Ã¢â‚¬Â¢/).map((part) => part.trim())
  return {
    datePart: parts.length > 1 ? parts[0] : '',
    timeRange: parts.length > 1 ? parts[1] : timeLabel.trim(),
  }
}

function parseUpcomingStartDate(timeLabel: string, now: Date) {
  const { datePart, timeRange } = splitMatchTimeLabel(timeLabel)
  const timeMatch = timeRange.match(/(\d{1,2}):(\d{2})/)
  if (!timeMatch) return null

  const start = new Date(now)
  start.setSeconds(0, 0)
  start.setHours(Number(timeMatch[1]), Number(timeMatch[2]), 0, 0)

  const normalizedDate = datePart.toLowerCase()
  if (normalizedDate.includes('h\u00f4m nay') || normalizedDate.includes('hÃ´m nay') || normalizedDate.includes('hÃƒÂ´m nay')) {
    return start
  }

  if (normalizedDate.includes('ng\u00e0y mai') || normalizedDate.includes('ngÃ y mai') || normalizedDate.includes('ngÃƒÂ y mai')) {
    start.setDate(now.getDate() + 1)
    return start
  }

  const dateMatch = datePart.match(/(\d{1,2})\/(\d{1,2})/)
  if (dateMatch) {
    start.setMonth(Number(dateMatch[2]) - 1, Number(dateMatch[1]))
    if (start.getTime() < now.getTime() - 30 * 24 * 60 * 60 * 1000) {
      start.setFullYear(start.getFullYear() + 1)
    }
    return start
  }

  return start
}

function getFullWeekdayLabel(date: Date) {
  return date.getDay() === 0 ? 'Ch\u1ee7 nh\u1eadt' : `Th\u1ee9 ${date.getDay() + 1}`
}

function getHeaderTimeLabel(startDate: Date | null, now: Date) {
  if (!startDate) return { label: '', pill: false }

  const diffMs = startDate.getTime() - now.getTime()
  const totalMinutes = Math.max(0, Math.ceil(diffMs / (60 * 1000)))

  if (diffMs > 24 * 60 * 60 * 1000) {
    return {
      label: `${getFullWeekdayLabel(startDate)}, ${pad2(startDate.getDate())}/${pad2(startDate.getMonth() + 1)}`.toLocaleUpperCase('vi-VN'),
      pill: false,
    }
  }

  if (totalMinutes < 30) {
    return { label: 'S\u1eafp b\u1eaft \u0111\u1ea7u', pill: true }
  }

  if (totalMinutes < 120) {
    return { label: `C\u00f2n ${totalMinutes}p`, pill: true }
  }

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return { label: `C\u00f2n ${hours}h ${minutes}m`, pill: true }
}

function getStartClock(timeRange: string) {
  return timeRange.match(/(\d{1,2}:\d{2})/)?.[1] ?? timeRange
}

function getStartClockFromDate(date: Date | null, fallback: string) {
  if (!date) return getStartClock(fallback)
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

function getStartSubLabel(startDate: Date | null, now: Date) {
  if (!startDate) return ''

  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)
  const diffMs = Math.max(startDate.getTime() - now.getTime(), 0)
  const hours = Math.floor(diffMs / (60 * 60 * 1000))
  const minutes = Math.max(1, Math.floor(diffMs / (60 * 1000)))

  if (isSameDay(startDate, now)) {
    return hours >= 1 ? `H\u00f4m nay \u00b7 ${hours}h` : `H\u00f4m nay \u00b7 ${minutes}p`
  }

  if (isSameDay(startDate, tomorrow)) {
    return `Ng\u00e0y mai \u00b7 ${Math.max(hours, 1)}h`
  }

  return `${getFullWeekdayLabel(startDate)}, ${pad2(startDate.getDate())}/${pad2(startDate.getMonth() + 1)}`
}

function parseDateOrFallback(value: string | undefined, fallback: Date) {
  if (!value) return fallback
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? fallback : parsed
}

function parseSessionStartDate(item: MatchSession) {
  return parseDateOrFallback(item.startTime, parseUpcomingStartDate(item.timeLabel, new Date()) ?? new Date())
}

function parseSessionEndDate(item: MatchSession, startDate: Date) {
  if (item.endTime) {
    const parsed = new Date(item.endTime)
    if (!Number.isNaN(parsed.getTime())) return parsed
  }

  const { timeRange } = splitMatchTimeLabel(item.timeLabel)
  const matches = [...timeRange.matchAll(/(\d{1,2}):(\d{2})/g)]
  const endMatch = matches[1]
  if (!endMatch) return startDate

  const endDate = new Date(startDate)
  endDate.setHours(Number(endMatch[1]), Number(endMatch[2]), 0, 0)
  return endDate
}

function formatClock(date: Date) {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

function getSuggestedDayInfo(startTime: Date) {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)
  const dd = pad2(startTime.getDate())
  const mm = pad2(startTime.getMonth() + 1)

  if (isSameDay(startTime, now)) {
    return {
      label: `H\u00f4m nay, ${dd}/${mm}`,
      badgeLabel: 'H\u00d4M NAY',
      badgeColor: colors.primary,
    }
  }

  if (isSameDay(startTime, tomorrow)) {
    return {
      label: `Ng\u00e0y mai, ${dd}/${mm}`,
      badgeLabel: 'NG\u00c0Y MAI',
      badgeColor: colors.textSecondary,
    }
  }

  const label = `${getFullWeekdayLabel(startTime)}, ${dd}/${mm}`
  return {
    label,
    badgeLabel: label.toLocaleUpperCase('vi-VN'),
    badgeColor: colors.textMuted,
  }
}

function MiniBadgeLight({
  icon: Icon,
  label,
  tone = 'neutral',
  size = 'md',
}: {
  icon: LucideIcon
  label: string
  tone?: 'neutral' | 'success' | 'urgent'
  size?: 'md' | 'lg'
}) {
  const isLarge = size === 'lg'
  const palette =
    tone === 'success'
      ? { bg: PROFILE_THEME_SEMANTIC.successBg, border: PROFILE_THEME_COLORS.primaryFixedDim, text: PROFILE_THEME_SEMANTIC.successText, icon: PROFILE_THEME_SEMANTIC.successText }
      : tone === 'urgent'
        ? { bg: PROFILE_THEME_SEMANTIC.warningBg, border: PROFILE_THEME_COLORS.secondaryFixedDim, text: PROFILE_THEME_SEMANTIC.warningText, icon: PROFILE_THEME_SEMANTIC.warningText }
        : {
            bg: PROFILE_THEME_COLORS.surfaceContainerLow,
            border: PROFILE_THEME_COLORS.outlineVariant,
            text: PROFILE_THEME_COLORS.onSurfaceVariant,
            icon: PROFILE_THEME_COLORS.onSurfaceVariant,
          }

  return (
    <View
      className={`flex-row items-center rounded-full ${isLarge ? 'px-3.5 py-2' : 'px-3 py-1.5'}`}
      style={{ backgroundColor: palette.bg, borderWidth: BORDER.base, borderColor: palette.border }}
    >
      <Icon size={isLarge ? 15 : 14} color={palette.icon} strokeWidth={2.5} />
      <Text
        className="ml-1.5"
        style={{
          color: palette.text,
          fontFamily: SCREEN_FONTS.label,
          fontSize: 12,
          lineHeight: 18,
        }}
      >
        {label}
      </Text>
    </View>
  )
}

export function MatchSessionCard({
  item,
  variant,
  actionLabel,
  accentMode = 'default',
  showFullAddress,
}: {
  item: MatchSession
  variant: 'hero' | 'smart' | 'standard'
  actionLabel: string
  accentMode?: 'default' | 'rescue'
  showFullAddress?: boolean
}) {
  if (variant === 'hero') {
    return <HeroMatchSessionCard item={item} actionLabel={actionLabel} />
  }

  if (accentMode === 'default') {
    return <SuggestedSessionCard item={item} showFullAddress={showFullAddress} />
  }

  if (accentMode === 'rescue') {
    return <UrgentFillCard item={item} />
  }

  return <SessionListCard item={item} actionLabel={actionLabel} accentMode={accentMode} />
}

function HeroMatchSessionCard({ item }: { item: MatchSession; actionLabel: string }) {
  const [now, setNow] = useState(() => new Date())
  const { timeRange } = splitMatchTimeLabel(item.timeLabel)
  const startDate = useMemo(() => {
    if (item.startTime) {
      const parsed = new Date(item.startTime)
      if (!Number.isNaN(parsed.getTime())) return parsed
    }

    return parseUpcomingStartDate(item.timeLabel, now)
  }, [item.startTime, item.timeLabel, now])
  const headerTimeLabel = getHeaderTimeLabel(startDate, now)
  const startClock = getStartClockFromDate(startDate, timeRange)
  const startSubLabel = getStartSubLabel(startDate, now)
  const distanceLabel = formatDistance((item as MatchSession & { distanceKm?: number }).distanceKm)
  const addressLine = [item.address, distanceLabel].filter(Boolean).join(' \u00b7 ')
  const compactAddress = addressLine
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(', ')
  const displayCap = Math.min(item.maxPlayers, 4)
  const visiblePlayers = item.players.slice(0, displayCap)
  const emptySlots = Math.min(Math.max(item.maxPlayers - item.activePlayers, 0), Math.max(displayCap - visiblePlayers.length, 0))
  const waitingPlayers = Math.max(item.maxPlayers - item.activePlayers, 0)
  const playersLabel =
    waitingPlayers === 0 ? '\u0110\u1ee7 ng\u01b0\u1eddi \u2713' : `${item.activePlayers}/${item.maxPlayers} \u00b7 ch\u1edd ${waitingPlayers} n\u1eefa`

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date())
    }, 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/session/[id]' as never, params: { id: item.id } })}
      className="overflow-hidden rounded-[16px]"
      style={{ backgroundColor: colors.primary }}
    >
      <LinearGradient
        colors={['#083D2B', '#0F6E56']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: 18, paddingHorizontal: SPACING.xl, paddingBottom: 16 }}
      >
        <View className="flex-row items-center justify-between" style={{ marginBottom: 16 }}>
          <View className="flex-row items-center">
            <View style={{ width: 5, height: 5, borderRadius: RADIUS.full, backgroundColor: '#5DCAA5', marginRight: 6 }} />
            <Text
              style={{
                color: '#A8D9C8',
                fontFamily: SCREEN_FONTS.label,
                fontSize: 13,
                letterSpacing: 0.8,
              }}
            >
              {'K\u00c8O S\u1eaeP T\u1edaI'}
            </Text>
          </View>

          {headerTimeLabel.label ? (
            <View
              style={{
                backgroundColor: headerTimeLabel.pill ? 'rgba(0,0,0,0.2)' : 'transparent',
                borderRadius: RADIUS.full,
                paddingHorizontal: headerTimeLabel.pill ? 9 : 0,
                paddingVertical: headerTimeLabel.pill ? 2 : 0,
              }}
            >
              <Text
                style={{
                  color: headerTimeLabel.pill ? '#FFD580' : '#A8D9C8',
                  fontFamily: SCREEN_FONTS.cta,
                  fontSize: 13,
                  lineHeight: 18,
                }}
              >
                {headerTimeLabel.label}
              </Text>
            </View>
          ) : null}

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 12 }}>
            <View 
              style={{ 
                width: 6, 
                height: 6, 
                borderRadius: 3, 
                backgroundColor: item.courtBookingConfirmed ? '#5DCAA5' : '#FFD580' 
              }} 
            />
            <Text 
              style={{ 
                fontFamily: SCREEN_FONTS.cta, 
                fontSize: 10, 
                color: item.courtBookingConfirmed ? '#A8D9C8' : '#FFD580',
                textTransform: 'uppercase',
                letterSpacing: 0.5
              }}
            >
              {item.courtBookingConfirmed ? 'Đã đặt sân' : 'Chờ đặt sân'}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'flex-end', columnGap: 16 }}>
          <View>
            <Text style={{ color: '#A8D9C8', fontFamily: SCREEN_FONTS.body, fontSize: 10, lineHeight: 14, marginBottom: 2 }}>
              {'B\u1eaft \u0111\u1ea7u l\u00fac'}
            </Text>
            <Text
              style={{
                color: '#FFFFFF',
                fontFamily: SCREEN_FONTS.headline,
                fontSize: 52,
                lineHeight: 54,
                letterSpacing: 0,
              }}
            >
              {startClock}
            </Text>
            <Text style={{ color: '#A8D9C8', fontFamily: SCREEN_FONTS.body, fontSize: 12, lineHeight: 16 }}>
              {startSubLabel}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text
              numberOfLines={2}
              ellipsizeMode="tail"
              style={{
                color: '#FFFFFF',
                fontFamily: AppFontSet.headline,
                fontSize: 19,
                lineHeight: 21,
                marginBottom: 6,
                textTransform: 'uppercase',
              }}
            >
              {item.courtName}
            </Text>
            <View
              style={{
                alignSelf: 'flex-start',
                backgroundColor: 'rgba(255,255,255,0.15)',
                borderRadius: 5,
                paddingHorizontal: SPACING.sm,
                paddingVertical: 3,
                marginBottom: 8,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontFamily: SCREEN_FONTS.label, fontSize: 12, lineHeight: 16 }}>
                {item.skillLabel}
              </Text>
            </View>
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{ color: '#A8D9C8', fontFamily: SCREEN_FONTS.body, fontSize: 12, lineHeight: 16 }}
            >
              {compactAddress || item.address}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <View
        style={{
          backgroundColor: 'rgba(0,0,0,0.22)',
          paddingHorizontal: SPACING.xl,
          paddingVertical: 12,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flexShrink: 0 }}>
          {visiblePlayers.map((player, index) => {
            const avatar = getAvatarColor(player.id)
            return (
              <Pressable
                key={player.id}
                onPress={(event) => openPlayerProfile(player.id, event)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: RADIUS.full,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: avatar.bg,
                  borderWidth: BORDER.thick,
                  borderColor: 'rgba(255,255,255,0.3)',
                  marginRight: index === visiblePlayers.length + emptySlots - 1 ? 0 : -8,
                  zIndex: 4 - index,
                }}
              >
                <Text style={{ color: avatar.fg, fontFamily: SCREEN_FONTS.cta, fontSize: 10, lineHeight: 13 }}>
                  {player.initials}
                </Text>
              </Pressable>
            )
          })}

          {Array.from({ length: emptySlots }).map((_, index) => (
            <View
              key={`hero-empty-${index}`}
              style={{
                width: 28,
                height: 28,
                borderRadius: RADIUS.full,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255,255,255,0.12)',
                borderWidth: BORDER.thick,
                borderColor: 'rgba(255,255,255,0.3)',
                marginRight: index === emptySlots - 1 ? 0 : -8,
                zIndex: 4 - visiblePlayers.length - index,
              }}
            >
              <Text style={{ color: 'rgba(255,255,255,0.4)', fontFamily: SCREEN_FONTS.cta, fontSize: 13, lineHeight: 16 }}>
                ?
              </Text>
            </View>
          ))}
        </View>

        <Text
          numberOfLines={1}
          style={{ color: '#A8D9C8', fontFamily: SCREEN_FONTS.body, fontSize: 11, lineHeight: 15, marginHorizontal: 12, flexShrink: 1 }}
        >
          {playersLabel}
        </Text>

        <Pressable
          onPress={(event) => {
            event.stopPropagation()
            router.push({ pathname: '/session/[id]' as never, params: { id: item.id } })
          }}
          style={{ backgroundColor: '#FFFFFF', ...BUTTON.pill, flexShrink: 0 }}
        >
          <Text style={{ color: '#0F6E56', fontFamily: SCREEN_FONTS.headline, fontSize: 15, lineHeight: 18, textTransform: 'uppercase' }}>
            {'Xem \u2192'}
          </Text>
        </Pressable>
      </View>
    </Pressable>
  )
}

function SuggestedSessionCard({ item, showFullAddress }: { item: MatchSession; showFullAddress?: boolean }) {
  const startDate = parseSessionStartDate(item)
  const endDate = parseSessionEndDate(item, startDate)
  const dayInfo = getSuggestedDayInfo(startDate)
  const distanceLabel = formatDistance((item as MatchSession & { distanceKm?: number }).distanceKm)
  const addressParts = item.address
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
  const addressBase = showFullAddress
    ? item.address
    : addressParts.length >= 2 ? addressParts[addressParts.length - 2] : addressParts[0] ?? item.address
  const addressLabel = [addressBase, distanceLabel].filter(Boolean).join(' \u00b7 ')
  const levelMatchesUser = (item as MatchSession & { levelMatchesUser?: boolean }).levelMatchesUser !== false
  const pagination = `${(item.carouselIndex ?? 0) + 1} / ${item.carouselTotal ?? 1}`

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/session/[id]' as never, params: { id: item.id } })}
      className="overflow-hidden rounded-[16px]"
      style={{
        backgroundColor: colors.surface,
        borderWidth: BORDER.hairline,
        borderColor: colors.border,
      }}
    >
      <View
        style={{
          backgroundColor: '#1D9E75',
          paddingHorizontal: 16,
          paddingVertical: SPACING.xs,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 6 }}>
          <View style={{ width: 5, height: 5, borderRadius: RADIUS.full, backgroundColor: '#FFFFFF' }} />
          <Text
            style={{
              color: '#FFFFFF',
              fontFamily: SCREEN_FONTS.cta,
              fontSize: 11,
              lineHeight: 15,
              letterSpacing: 0.5,
            }}
          >
            {'G\u1ee2I \u00dd H\u1ee2P GU'}
          </Text>
        </View>

        <Text
          style={{
            color: 'rgba(255,255,255,0.6)',
            fontFamily: SCREEN_FONTS.label,
            fontSize: 11,
            lineHeight: 15,
          }}
        >
          {pagination}
        </Text>
      </View>

      <View style={{ paddingTop: 12, paddingHorizontal: 16, paddingBottom: 8 }}>
        <Text
          numberOfLines={2}
          ellipsizeMode="tail"
          style={{
            color: '#1A2E2A',
            fontFamily: AppFontSet.headline,
            fontSize: 31,
            lineHeight: 36,
            letterSpacing: 0,
            marginBottom: 4,
            paddingTop: 2,
            textTransform: 'uppercase',
          }}
        >
          {item.courtName}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 6 }}>
          <Text numberOfLines={1} ellipsizeMode="tail" style={{ color: '#7A8884', fontFamily: SCREEN_FONTS.body, fontSize: 12, lineHeight: 16, flexShrink: 1 }}>
            {addressLabel}
          </Text>
          {levelMatchesUser ? (
            <>
              <View style={{ width: 3, height: 3, borderRadius: RADIUS.full, backgroundColor: '#B4B2A9' }} />
              <Text style={{ color: '#0F6E56', fontFamily: SCREEN_FONTS.label, fontSize: 11, lineHeight: 15 }}>
                {'\u2713 kh\u1edbp v\u1edbi b\u1ea1n'}
              </Text>
            </>
          ) : null}
        </View>
      </View>

      <View style={{ backgroundColor: '#F5F1E8', paddingTop: 10, paddingHorizontal: 16, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 8 }}>
            <View style={{ backgroundColor: dayInfo.badgeColor, borderRadius: 3, paddingHorizontal: 7, paddingVertical: 2 }}>
              <Text style={{ color: '#FFFFFF', fontFamily: SCREEN_FONTS.cta, fontSize: 12, lineHeight: 16 }}>
                {dayInfo.badgeLabel}
              </Text>
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 6 }}>
            <View 
              style={{ 
                width: 7, 
                height: 7, 
                borderRadius: 4, 
                backgroundColor: item.courtBookingConfirmed ? '#1D9E75' : '#EAB308' 
              }} 
            />
            <Text 
              style={{ 
                fontFamily: SCREEN_FONTS.cta, 
                fontSize: 10, 
                color: item.courtBookingConfirmed ? '#1D9E75' : '#854D0E',
                textTransform: 'uppercase',
                letterSpacing: 0.5
              }}
            >
              {item.courtBookingConfirmed ? 'Đã đặt sân' : 'Chờ đặt sân'}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <View>
            <Text style={{ color: '#7A8884', fontFamily: SCREEN_FONTS.label, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>
              {'THỜI GIAN'}
            </Text>
            <Text
              style={{
                color: '#1A2E2A',
                fontFamily: AppFontSet.headline,
                fontSize: 33,
                lineHeight: 33,
                letterSpacing: 0,
              }}
            >
              {formatClock(startDate)}
            </Text>
            <Text style={{ color: '#7A8884', fontFamily: SCREEN_FONTS.body, fontSize: 12, lineHeight: 16, marginTop: 4 }}>
              {`đến ${formatClock(endDate)}`}
            </Text>
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: '#7A8884', fontFamily: SCREEN_FONTS.label, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>
              {'CHI PHÍ'}
            </Text>
            <Text style={{ color: '#1A2E2A', fontFamily: AppFontSet.headline, fontSize: 25, lineHeight: 25 }}>
              {item.priceLabel}
            </Text>
            <Text style={{ color: '#7A8884', fontFamily: SCREEN_FONTS.body, fontSize: 11, lineHeight: 15, marginTop: 2 }}>
              {item.priceLabel === 'Miễn phí' ? '' : '/người'}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 4, paddingHorizontal: 9, paddingVertical: 3 }}>
            <Text style={{ color: '#2C2C2A', fontFamily: SCREEN_FONTS.label, fontSize: 12, lineHeight: 16 }}>
              {item.skillLabel}
            </Text>
          </View>

          <Text style={{ color: '#7A8884', fontFamily: SCREEN_FONTS.body, fontSize: 12, lineHeight: 16 }}>
            {`${item.activePlayers}/${item.maxPlayers} ng\u01b0\u1eddi`}
          </Text>

          <Pressable
            onPress={(event) => {
              event.stopPropagation()
              router.push({ pathname: '/session/[id]' as never, params: { id: item.id } })
            }}
            style={{ backgroundColor: '#0F6E56', ...BUTTON.pill }}
          >
            <Text style={{ color: '#FFFFFF', fontFamily: SCREEN_FONTS.headline, fontSize: 15, lineHeight: 18, textTransform: 'uppercase' }}>
              Vào kèo
            </Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  )
}

function UrgentFillCard({ item }: { item: MatchSession }) {
  const [now, setNow] = useState(() => new Date())
  const startDate = useMemo(() => parseSessionStartDate(item), [item])
  const endDate = parseSessionEndDate(item, startDate)
  const headerTimeLabel = getHeaderTimeLabel(startDate, now)
  const dayInfo = getSuggestedDayInfo(startDate)
  const distanceLabel = formatDistance((item as MatchSession & { distanceKm?: number }).distanceKm)
  const addressParts = item.address
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
  const addressBase = addressParts.length >= 2 ? addressParts[addressParts.length - 2] : addressParts[0] ?? item.address
  const addressLabel = [addressBase, distanceLabel].filter(Boolean).join(' \u00b7 ')
  const waitingPlayers = Math.max(item.maxPlayers - item.activePlayers, 0)
  const urgentText = waitingPlayers === 1 ? 'c\u00f2n 1 ch\u1ed7 duy nh\u1ea5t' : `c\u00f2n ${waitingPlayers} ch\u1ed7`
  const stripLabel = `${waitingPlayers > 0 ? `C\u00d2N ${waitingPlayers} CH\u1ed6` : '\u0110\u1ee6 NG\u01af\u1edcI'} \u00b7 C\u1ea6N NG\u01af\u1edcI G\u1ea4P`

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date())
    }, 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/session/[id]' as never, params: { id: item.id } })}
      className="overflow-hidden rounded-[16px]"
      style={{
        backgroundColor: colors.surface,
        borderWidth: BORDER.base,
        borderColor: '#F5D5CB',
      }}
    >
      <View
        style={{
          backgroundColor: '#D85A30',
          paddingHorizontal: 16,
          paddingVertical: SPACING.xs,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 6, flexShrink: 1 }}>
          <View style={{ width: 5, height: 5, borderRadius: RADIUS.full, backgroundColor: '#FFD580' }} />
          <Text
            numberOfLines={1}
            style={{
              color: '#FFFFFF',
              fontFamily: SCREEN_FONTS.cta,
              fontSize: 11,
              lineHeight: 15,
              letterSpacing: 0.5,
              flexShrink: 1,
            }}
          >
            {stripLabel}
          </Text>
        </View>

        {headerTimeLabel.label ? (
          <Text
            numberOfLines={1}
            style={{
              color: '#FFD580',
              fontFamily: SCREEN_FONTS.cta,
              fontSize: 11,
              lineHeight: 15,
              marginLeft: 10,
            }}
          >
            {headerTimeLabel.label}
          </Text>
        ) : null}
      </View>

      <View style={{ paddingTop: 12, paddingHorizontal: 16, paddingBottom: 8 }}>
        <Text
          numberOfLines={2}
          ellipsizeMode="tail"
          style={{
            color: '#1A2E2A',
            fontFamily: AppFontSet.headline,
            fontSize: 31,
            lineHeight: 34,
            letterSpacing: 0,
            marginBottom: 3,
            textTransform: 'uppercase',
          }}
        >
          {item.courtName}
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 6 }}>
          <Text numberOfLines={1} ellipsizeMode="tail" style={{ color: '#7A8884', fontFamily: SCREEN_FONTS.body, fontSize: 12, lineHeight: 16, flexShrink: 1 }}>
            {addressLabel}
          </Text>
          {waitingPlayers > 0 ? (
            <>
              <View style={{ width: 3, height: 3, borderRadius: RADIUS.full, backgroundColor: '#B4B2A9' }} />
              <Text style={{ color: '#D85A30', fontFamily: SCREEN_FONTS.label, fontSize: 11, lineHeight: 15 }}>
                {urgentText}
              </Text>
            </>
          ) : null}
        </View>
      </View>

      <View style={{ backgroundColor: '#F5F1E8', paddingTop: 10, paddingHorizontal: 16, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 8, marginBottom: 4 }}>
          <View style={{ backgroundColor: '#D85A30', borderRadius: 3, paddingHorizontal: 7, paddingVertical: 2 }}>
            <Text style={{ color: '#FFFFFF', fontFamily: SCREEN_FONTS.cta, fontSize: 9, lineHeight: 12 }}>
              {dayInfo.badgeLabel}
            </Text>
          </View>
          <Text style={{ color: '#7A8884', fontFamily: SCREEN_FONTS.body, fontSize: 11, lineHeight: 15 }}>
            {dayInfo.label}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <View>
            <Text style={{ color: '#7A8884', fontFamily: SCREEN_FONTS.label, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>
              {'THỜI GIAN'}
            </Text>
            <Text
              style={{
                color: '#1A2E2A',
                fontFamily: AppFontSet.headline,
                fontSize: 33,
                lineHeight: 33,
                letterSpacing: 0,
              }}
            >
              {formatClock(startDate)}
            </Text>
            <Text style={{ color: '#7A8884', fontFamily: SCREEN_FONTS.body, fontSize: 11, lineHeight: 15, marginTop: 4 }}>
              {`đến ${formatClock(endDate)}`}
            </Text>
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: '#7A8884', fontFamily: SCREEN_FONTS.label, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>
              {'CHI PHÍ'}
            </Text>
            <Text style={{ color: '#1A2E2A', fontFamily: AppFontSet.headline, fontSize: 25, lineHeight: 25 }}>
              {item.priceLabel}
            </Text>
            <Text style={{ color: '#7A8884', fontFamily: SCREEN_FONTS.body, fontSize: 11, lineHeight: 15, marginTop: 2 }}>
              {item.priceLabel === 'Miễn phí' ? '' : '/người'}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2 }}>
            <Text style={{ color: '#2C2C2A', fontFamily: SCREEN_FONTS.label, fontSize: 12, lineHeight: 16 }}>
              {item.skillLabel}
            </Text>
          </View>

          <Text style={{ color: '#993C1D', fontFamily: SCREEN_FONTS.label, fontSize: 12, lineHeight: 16 }}>
            {`${item.activePlayers}/${item.maxPlayers} ng\u01b0\u1eddi`}
          </Text>

          <Pressable
            onPress={(event) => {
              event.stopPropagation()
              router.push({ pathname: '/session/[id]' as never, params: { id: item.id } })
            }}
            style={{ backgroundColor: '#D85A30', ...BUTTON.pill }}
          >
            <Text style={{ color: '#FFFFFF', fontFamily: SCREEN_FONTS.headline, fontSize: 15, lineHeight: 18, textTransform: 'uppercase' }}>
              Vào ngay
            </Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  )
}

function SessionListCard({
  item,
  actionLabel,
  accentMode,
}: {
  item: MatchSession
  actionLabel: string
  accentMode: 'default' | 'rescue'
}) {
  const levelUi = getSkillLevelUi(item.levelId)
  const Icon = levelUi.icon
  const [datePart, clockPart] = item.timeLabel.split('â€¢').map((part) => part.trim())
  const timeRangeLabel = clockPart ?? item.timeLabel
  const compactDateLabel = clockPart ? datePart : item.timeLabel
  const localizedDateLabel = compactDateLabel
    .replace('CN', 'Chá»§ nháº­t')
    .replace('T2', 'Thá»© 2')
    .replace('T3', 'Thá»© 3')
    .replace('T4', 'Thá»© 4')
    .replace('T5', 'Thá»© 5')
    .replace('T6', 'Thá»© 6')
    .replace('T7', 'Thá»© 7')
  const fullDateLabel = localizedDateLabel.replace(/,\s*(\d{1,2})\/(\d{1,2})$/, (_, day, month) => {
    const dayNumber = Number.parseInt(day, 10)
    const monthNumber = Number.parseInt(month, 10)
    return `, ${dayNumber} ThÃ¡ng ${monthNumber}`
  })
  const addressParts = item.address
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
  const compactAddress =
    addressParts.length >= 3
      ? `${addressParts[0]}, ${addressParts[addressParts.length - 2]}, ${addressParts[addressParts.length - 1]}`
      : item.address
  const progressPercent = Math.max(0, Math.min((item.activePlayers / Math.max(item.maxPlayers, 1)) * 100, 100))
  const visiblePlayers = item.players.slice(0, 4)
  const remainingPlayers = item.players.length - visiblePlayers.length
  const displayCap = Math.min(item.maxPlayers, 4)
  const emptySlots = Math.max(displayCap - visiblePlayers.length, 0)
  const isRescueAccent = accentMode === 'rescue'
  const accentColor = isRescueAccent ? PROFILE_THEME_COLORS.error : PROFILE_THEME_COLORS.primary
  const onAccentColor = isRescueAccent ? PROFILE_THEME_COLORS.onError : PROFILE_THEME_COLORS.onPrimary
  const accentSurfaceColor = isRescueAccent ? PROFILE_THEME_COLORS.onErrorContainer : PROFILE_THEME_COLORS.surfaceTint
  const bookingStatusVisual = getBookingStatusVisual(item.statusLabel)
  const BookingStatusIcon = bookingStatusVisual.Icon

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/session/[id]' as never, params: { id: item.id } })}
      className="overflow-hidden"
      style={{
        padding: SPACING.xl,
        minHeight: 300,
        borderRadius: RADIUS.lg,
        backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest,
        ...SHADOW.sm,
      }}
    >
      <View
        className="relative overflow-hidden"
        style={{ marginHorizontal: -SPACING.xl, marginTop: -SPACING.xl, paddingHorizontal: SPACING.xl, paddingTop: SPACING.xl, paddingBottom: SPACING.lg, borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
      >
        <LinearGradient
          colors={[accentColor, accentSurfaceColor]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
        />
        <Icon
          size={98}
          color="rgba(255,255,255,0.12)"
          style={{ position: 'absolute', right: -4, bottom: -10 }}
        />

        <View className="flex-row items-start">
          <Text
            className="flex-1"
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.72}
            ellipsizeMode="tail"
            style={{
              color: onAccentColor,
              fontFamily: AppFontSet.headline,
              fontSize: 32,
              lineHeight: 38,
              letterSpacing: 0.8,
              textTransform: 'uppercase',
            }}
          >
            {item.courtName}
          </Text>
        </View>

        <Text
          className="mt-1"
          style={{
            color: withAlpha(onAccentColor, 0.68),
            fontFamily: AppFontSet.display,
            fontSize: 36,
            lineHeight: 42,
          }}
        >
          {timeRangeLabel}
        </Text>

        <View className="mt-2">
          <View
            className="self-start flex-row items-center rounded-full px-3.5 py-2"
            style={{ backgroundColor: withAlpha(onAccentColor, 0.14), maxWidth: '100%' }}
          >
            <MapPin size={13} color={withAlpha(onAccentColor, 0.78)} strokeWidth={2.5} />
            <Text
              className="ml-1.5"
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{
                color: withAlpha(onAccentColor, 0.86),
                fontFamily: SCREEN_FONTS.label,
                fontSize: 13,
                lineHeight: 18,
              }}
            >
              {compactAddress}
            </Text>
          </View>
        </View>

        <View className="mt-3 flex-row flex-wrap items-center gap-2">
          <View
            className="flex-row items-center rounded-full px-3.5 py-2"
            style={{ backgroundColor: withAlpha(onAccentColor, 0.14) }}
          >
            <CalendarDays size={13} color={withAlpha(onAccentColor, 0.78)} strokeWidth={2.5} />
            <Text
              className="ml-1.5"
              style={{
                color: withAlpha(onAccentColor, 0.86),
                fontFamily: SCREEN_FONTS.label,
                fontSize: 13,
                lineHeight: 18,
              }}
            >
              {fullDateLabel}
            </Text>
          </View>

          <View
            className="flex-row items-center rounded-full px-3.5 py-2"
            style={{ backgroundColor: withAlpha(onAccentColor, 0.14) }}
          >
            <Icon size={13} color={withAlpha(onAccentColor, 0.78)} strokeWidth={2.5} />
            <Text
              className="ml-1.5"
              style={{
                color: withAlpha(onAccentColor, 0.86),
                fontFamily: SCREEN_FONTS.label,
                fontSize: 13,
                lineHeight: 18,
              }}
            >
              {item.skillLabel}
            </Text>
          </View>
        </View>
      </View>

      <View className="mt-3 flex-row items-center gap-2">
        {item.isRanked ? <MiniBadgeLight icon={Trophy} label="KÃ¨o tÃ­nh Ä‘iá»ƒm" tone="neutral" size="lg" /> : null}
        <MiniBadgeLight icon={BookingStatusIcon} label={item.statusLabel} tone="neutral" size="lg" />
        <View
          className="flex-row items-center rounded-full px-3 py-2"
          style={{ backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow, borderWidth: BORDER.base, borderColor: PROFILE_THEME_COLORS.outlineVariant }}
        >
          <DollarSign size={15} color={PROFILE_THEME_COLORS.onSurfaceVariant} strokeWidth={2.5} />
          <Text
            className="ml-1.5"
            style={{
              color: PROFILE_THEME_COLORS.onSurfaceVariant,
              fontFamily: SCREEN_FONTS.label,
              fontSize: 12,
              lineHeight: 18,
            }}
          >
            {item.priceLabel}{item.priceLabel === 'Miễn phí' ? '' : '/ng'}
          </Text>
        </View>
      </View>

      <View
        className="mt-4"
        style={{
          padding: SPACING.md,
          borderRadius: RADIUS.lg,
          backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow,
        }}
      >
<View className="flex-row items-center justify-between">
          <View className="mr-3 flex-1 flex-row items-center">
            <Pressable
              onPress={(event) => openPlayerProfile(item.host.id, event)}
              className="mr-3 h-11 w-11 items-center justify-center rounded-full"
              style={{
                backgroundColor: accentColor,
                borderWidth: BORDER.base,
                borderColor: withAlpha(accentColor, 0.14),
              }}
            >
              <Text
                style={{
                  color: onAccentColor,
                  fontFamily: AppFontSet.headline,
                  fontSize: 15,
                }}
              >
                {item.host.initials}
              </Text>
            </Pressable>

            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text
                  numberOfLines={1}
                  style={{
                    color: PROFILE_THEME_COLORS.onSurface,
                    fontFamily: SCREEN_FONTS.label,
                    fontSize: 13,
                  }}
                >
                  {item.host.name}
                </Text>
                <View className="flex-row items-center rounded-full px-2 py-2" style={{ backgroundColor: PROFILE_THEME_COLORS.surfaceContainerHighest }}>
                  <Star size={11} color={accentColor} fill={accentColor} strokeWidth={2.2} />
                  <Text
                    className="ml-1"
                    style={{
                      color: PROFILE_THEME_COLORS.onSurface,
                      fontFamily: SCREEN_FONTS.label,
                      fontSize: 11,
                    }}
                  >
                    {item.host.rating.toFixed(1)}
                  </Text>
                </View>
              </View>

              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={{
                  color: PROFILE_THEME_COLORS.onSurfaceVariant,
                  fontFamily: SCREEN_FONTS.body,
                  fontSize: 11,
                  lineHeight: 16,
                }}
              >
                {item.host.vibe}
              </Text>
            </View>
          </View>

          <View className="items-end">
            <Text
              style={{
                color: PROFILE_THEME_COLORS.onSurface,
                fontFamily: AppFontSet.headline,
                fontSize: 16,
              }}
            >
              {item.activePlayers}/{item.maxPlayers}
            </Text>
            <Text
              style={{
                color: PROFILE_THEME_COLORS.onSurfaceVariant,
                fontFamily: SCREEN_FONTS.body,
                fontSize: 10,
              }}
            >
              ngÆ°á»i chÆ¡i
            </Text>
          </View>
        </View>

        <View className="mt-3 h-2 rounded-full overflow-hidden" style={{ backgroundColor: PROFILE_THEME_COLORS.surfaceContainerHighest }}>
          <LinearGradient
            colors={[accentColor, isRescueAccent ? PROFILE_THEME_COLORS.onErrorContainer : PROFILE_THEME_COLORS.tertiary]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ width: `${progressPercent}%`, height: '100%', borderRadius: RADIUS.full }}
          />
        </View>

        <View className="mt-3 flex-row items-center justify-between gap-3">
          <View className="flex-1 flex-row items-center">
            {visiblePlayers.map((player, index) => (
              <Pressable
                key={player.id}
                onPress={(event) => openPlayerProfile(player.id, event)}
                className={`h-8 w-8 items-center justify-center rounded-full ${index === 0 ? '' : '-ml-2.5'}`}
                style={{
                  position: 'relative',
                  zIndex: 20 - index,
                  backgroundColor: accentColor,
                  borderWidth: BORDER.thick,
                  borderColor: PROFILE_THEME_COLORS.surfaceContainerLowest,
                }}
              >
                <Text
                  style={{
                    color: onAccentColor,
                    fontFamily: SCREEN_FONTS.cta,
                    fontSize: 10,
                  }}
                >
                  {player.initials}
                </Text>
              </Pressable>
            ))}

            {Array.from({ length: emptySlots }).map((_, index) => (
              <View
                key={`list-empty-${index}`}
                className={`h-8 w-8 items-center justify-center rounded-full ${visiblePlayers.length === 0 && index === 0 ? '' : '-ml-2.5'}`}
                style={{
                  position: 'relative',
                  zIndex: 1,
                  backgroundColor: 'transparent',
                  borderWidth: BORDER.medium,
                  borderStyle: 'dashed',
                  borderColor: PROFILE_THEME_COLORS.outlineVariant,
                }}
              >
                <Text
                  style={{
                    color: PROFILE_THEME_COLORS.outlineVariant,
                    fontFamily: AppFontSet.headline,
                    fontSize: 10,
                  }}
                >
                  +
                </Text>
              </View>
            ))}

            {remainingPlayers > 0 ? (
              <View
                className="-ml-2.5 h-8 w-8 items-center justify-center rounded-full"
                style={{
                  position: 'relative',
                  zIndex: 2,
                  backgroundColor: PROFILE_THEME_COLORS.surfaceContainerHighest,
                  borderWidth: BORDER.thick,
                  borderColor: PROFILE_THEME_COLORS.surfaceContainerLowest,
                }}
              >
                <Text
                  style={{
                    color: PROFILE_THEME_COLORS.onSurfaceVariant,
                    fontFamily: SCREEN_FONTS.label,
                    fontSize: 10,
                  }}
                >
                  +{remainingPlayers}
                </Text>
              </View>
            ) : null}
          </View>

          <View
            className="rounded-full px-4 py-2"
            style={{
              backgroundColor: accentColor,
            }}
          >
            <Text
              style={{
                color: onAccentColor,
                fontFamily: SCREEN_FONTS.headline,
                fontSize: 15,
                textTransform: 'uppercase',
                letterSpacing: 1.3,
              }}
            >
              {actionLabel}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  )
}
