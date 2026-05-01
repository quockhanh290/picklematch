import React, { useEffect, useMemo, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { PROFILE_THEME_COLORS } from '@/constants/profileTheme'
import { RADIUS, SPACING, BORDER, BUTTON } from '@/constants/screenLayout'
import { SCREEN_FONTS, AppFontSet } from '@/constants/typography'
import { MatchSession } from '@/lib/homeFeed'
import { formatDistance, getAvatarColor } from '@/utils/formatters'
import { 
  splitMatchTimeLabel, 
  parseUpcomingStartDate, 
  getHeaderTimeLabel, 
  getStartClockFromDate, 
  getStartSubLabel 
} from '@/lib/home/matchCardHelpers'

interface HeroMatchSessionCardProps {
  item: MatchSession
  actionLabel?: string
}

function openPlayerProfile(playerId?: string, event?: any) {
  event?.stopPropagation()
  if (!playerId) return
  router.push({ pathname: '/player/[id]' as never, params: { id: playerId } })
}

export function HeroMatchSessionCard({ item }: HeroMatchSessionCardProps) {
  const [now, setNow] = useState(() => new Date())
  const { timeRange } = splitMatchTimeLabel(item.timeLabel)
  const startDate = useMemo(() => {
    if (item.startTime) {
      const parsed = new Date(item.startTime)
      if (!Number.isNaN(parsed.getTime())) return parsed
    }

    return parseUpcomingStartDate(item.timeLabel, now)
  }, [item.startTime, item.timeLabel, now])
  const timeInfo = getHeaderTimeLabel(startDate, now)
  const startClock = getStartClockFromDate(startDate, timeRange)
  const startSubLabel = getStartSubLabel(startDate, now)
  const distanceLabel = formatDistance((item as any).distanceKm)
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
    waitingPlayers === 0 ? 'Đủ người ✓' : `${item.activePlayers}/${item.maxPlayers} · chờ ${waitingPlayers} nữa`

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
      style={{ backgroundColor: PROFILE_THEME_COLORS.primary }}
    >
      <LinearGradient
        colors={[PROFILE_THEME_COLORS.heroGradientStart, PROFILE_THEME_COLORS.primary]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: 18, paddingHorizontal: SPACING.xl, paddingBottom: 16 }}
      >
        <View className="flex-row items-center justify-between" style={{ marginBottom: 16 }}>
          <View className="flex-row items-center">
            <View style={{ width: 5, height: 5, borderRadius: RADIUS.full, backgroundColor: PROFILE_THEME_COLORS.heroLiveDot, marginRight: 6 }} />
            <Text
              style={{
                color: PROFILE_THEME_COLORS.heroBodyMuted,
                fontFamily: SCREEN_FONTS.label,
                fontSize: 13,
                letterSpacing: 0.8,
              }}
            >
              {'KÈO SẮP TỚI'}
            </Text>
          </View>

          {timeInfo.countdown ? (
            <View
              style={{
                backgroundColor: PROFILE_THEME_COLORS.heroPillBg,
                borderRadius: RADIUS.full,
                paddingHorizontal: 9,
                paddingVertical: 2,
              }}
            >
              <Text
                style={{
                  color: PROFILE_THEME_COLORS.heroCountdownText,
                  fontFamily: SCREEN_FONTS.cta,
                  fontSize: 13,
                  lineHeight: 18,
                }}
              >
                {timeInfo.countdown}
              </Text>
            </View>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'flex-end', columnGap: 16 }}>
          <View>
            <Text style={{ color: PROFILE_THEME_COLORS.heroBodyMuted, fontFamily: SCREEN_FONTS.body, fontSize: 10, lineHeight: 14, marginBottom: 2 }}>
              {'Bắt đầu lúc'}
            </Text>
            <Text
              style={{
                color: PROFILE_THEME_COLORS.onPrimary,
                fontFamily: SCREEN_FONTS.headline,
                fontSize: 52,
                lineHeight: 54,
                letterSpacing: 0,
              }}
            >
              {startClock}
            </Text>
            <Text style={{ color: PROFILE_THEME_COLORS.heroBodyMuted, fontFamily: SCREEN_FONTS.body, fontSize: 12, lineHeight: 16 }}>
              {startSubLabel}
            </Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text
              numberOfLines={2}
              ellipsizeMode="tail"
              style={{
                color: PROFILE_THEME_COLORS.onPrimary,
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
                backgroundColor: PROFILE_THEME_COLORS.heroChipBg,
                borderRadius: 5,
                paddingHorizontal: SPACING.sm,
                paddingVertical: 3,
                marginBottom: 8,
              }}
            >
              <Text style={{ color: PROFILE_THEME_COLORS.onPrimary, fontFamily: SCREEN_FONTS.label, fontSize: 12, lineHeight: 16 }}>
                {item.skillLabel}
              </Text>
            </View>
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{ color: PROFILE_THEME_COLORS.heroBodyMuted, fontFamily: SCREEN_FONTS.body, fontSize: 12, lineHeight: 16 }}
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
          style={{ backgroundColor: PROFILE_THEME_COLORS.surface, ...BUTTON.pill, flexShrink: 0 }}
        >
          <Text style={{ color: PROFILE_THEME_COLORS.primary, fontFamily: SCREEN_FONTS.headline, fontSize: 15, lineHeight: 18, textTransform: 'uppercase' }}>
            {'Xem \u2192'}
          </Text>
        </Pressable>
      </View>
    </Pressable>
  )
}
