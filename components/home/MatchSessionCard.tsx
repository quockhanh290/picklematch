import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import type { LucideIcon } from 'lucide-react-native'
import { AlertCircle, CalendarDays, DollarSign, MapPin, ShieldCheck, Star, Trophy } from 'lucide-react-native'
import { Pressable, Text, View } from 'react-native'

import { PROFILE_THEME_COLORS } from '@/components/profile/profileTheme'
import type { MatchSession } from '@/lib/homeFeed'
import { getSkillLevelUi } from '@/lib/skillLevelUi'

export const SMART_MATCH_CARD_HEIGHT = 380

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
  const isBooked = normalized.includes('đã đặt sân')
  return {
    Icon: isBooked ? ShieldCheck : AlertCircle,
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
      ? { bg: '#ecfdf5', border: '#a7f3d0', text: '#047857', icon: '#047857' }
      : tone === 'urgent'
        ? { bg: '#fff7ed', border: '#fdba74', text: '#c2410c', icon: '#c2410c' }
        : {
            bg: PROFILE_THEME_COLORS.surfaceContainerLow,
            border: PROFILE_THEME_COLORS.outlineVariant,
            text: PROFILE_THEME_COLORS.onSurfaceVariant,
            icon: PROFILE_THEME_COLORS.onSurfaceVariant,
          }

  return (
    <View
      className={`flex-row items-center rounded-full ${isLarge ? 'px-3.5 py-2' : 'px-3 py-1.5'}`}
      style={{ backgroundColor: palette.bg, borderWidth: 1, borderColor: palette.border }}
    >
      <Icon size={isLarge ? 15 : 14} color={palette.icon} strokeWidth={2.5} />
      <Text
        className="ml-1.5"
        style={{
          color: palette.text,
          fontFamily: 'PlusJakartaSans-SemiBold',
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
}: {
  item: MatchSession
  variant: 'hero' | 'smart' | 'standard'
  actionLabel: string
  accentMode?: 'default' | 'rescue'
}) {
  if (variant === 'hero') {
    return <HeroMatchSessionCard item={item} actionLabel={actionLabel} />
  }

  return <SessionListCard item={item} actionLabel={actionLabel} accentMode={accentMode} />
}

function HeroMatchSessionCard({ item, actionLabel }: { item: MatchSession; actionLabel: string }) {
  const levelUi = getSkillLevelUi(item.levelId)
  const LevelIcon = levelUi.icon
  const [, clockPart] = item.timeLabel.split('•').map((part) => part.trim())
  const timeRangeLabel = clockPart ?? item.timeLabel
  const compactAddress = item.address
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(', ')
  const heroProgressPercent = Math.max(0, Math.min((item.activePlayers / Math.max(item.maxPlayers, 1)) * 100, 100))
  const heroVisiblePlayers = item.players.slice(0, 4)
  const heroRemainingPlayers = item.players.length - heroVisiblePlayers.length
  const heroDisplayCap = Math.min(item.maxPlayers, 4)
  const heroEmptySlots = Math.max(heroDisplayCap - heroVisiblePlayers.length, 0)
  const heroNameLength = item.courtName.length
  const heroTitleFontSize = heroNameLength > 52 ? 24 : heroNameLength > 40 ? 27 : heroNameLength > 30 ? 31 : 36
  const heroTitleLineHeight = heroTitleFontSize + 9
  const bookingStatusVisual = getBookingStatusVisual(item.statusLabel)
  const BookingStatusIcon = bookingStatusVisual.Icon

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/session/[id]' as never, params: { id: item.id } })}
      className="overflow-hidden rounded-[34px] px-6 pt-6 pb-4"
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
      {/* Skill icon watermark top-right editorial style */}
      <View style={{ position: 'absolute', top: 0, right: -24, zIndex: 0, opacity: 0.12 }} pointerEvents="none">
        <LevelIcon size={120} color={PROFILE_THEME_COLORS.primary} />
      </View>
      <View>
        <View className="flex-row items-start justify-between">
          <Text
            className="flex-1 pr-3"
            numberOfLines={2}
            ellipsizeMode="tail"
            adjustsFontSizeToFit
            minimumFontScale={0.68}
            style={{
              color: PROFILE_THEME_COLORS.primary,
              fontFamily: 'PlusJakartaSans-ExtraBold',
              fontSize: heroTitleFontSize,
              lineHeight: heroTitleLineHeight,
              letterSpacing: 0.8,
              textTransform: 'uppercase',
            }}
          >
            {item.courtName}
          </Text>
        </View>

        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
          style={{
            color: withAlpha(PROFILE_THEME_COLORS.onSurfaceVariant, 0.44),
            fontFamily: 'PlusJakartaSans-ExtraBoldItalic',
            fontSize: 44,
            lineHeight: 52,
          }}
        >
          {timeRangeLabel}
        </Text>

        <View className="mt-1.5">
          <View
            className="self-start flex-row items-center rounded-full px-3 py-1.5"
            style={{
              backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow,
              borderWidth: 1,
              borderColor: PROFILE_THEME_COLORS.outlineVariant,
              maxWidth: '100%',
            }}
          >
            <MapPin size={13} color={PROFILE_THEME_COLORS.onSurfaceVariant} strokeWidth={2.4} />
            <Text
              className="ml-1.5"
              numberOfLines={1}
              ellipsizeMode="tail"
              style={{
                color: PROFILE_THEME_COLORS.onSurfaceVariant,
                fontFamily: 'PlusJakartaSans-SemiBold',
                fontSize: 12,
                lineHeight: 17,
              }}
            >
              {compactAddress || item.address}
            </Text>
          </View>
        </View>

        <View className="mt-2 flex-row flex-wrap items-center gap-2">
          <View
            className="flex-row items-center rounded-full px-3 py-2"
            style={{
              backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow,
              borderWidth: 1,
              borderColor: PROFILE_THEME_COLORS.outlineVariant,
            }}
          >
            <BookingStatusIcon size={14} color={PROFILE_THEME_COLORS.onSurfaceVariant} strokeWidth={2.4} />
            <Text
              className="ml-1.5"
              style={{
                color: PROFILE_THEME_COLORS.onSurfaceVariant,
                fontFamily: 'PlusJakartaSans-SemiBold',
                fontSize: 12,
                lineHeight: 18,
              }}
            >
              {item.statusLabel}
            </Text>
          </View>

          <View
            className="flex-row items-center rounded-full px-3 py-2"
            style={{
              backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow,
              borderWidth: 1,
              borderColor: PROFILE_THEME_COLORS.outlineVariant,
            }}
          >
            <LevelIcon size={14} color={PROFILE_THEME_COLORS.onSurfaceVariant} strokeWidth={2.4} />
            <Text
              className="ml-1.5"
              style={{
                color: PROFILE_THEME_COLORS.onSurfaceVariant,
                fontFamily: 'PlusJakartaSans-SemiBold',
                fontSize: 12,
                lineHeight: 18,
              }}
            >
              {item.skillLabel}
            </Text>
          </View>

          <View
            className="flex-row items-center rounded-full px-4 py-2"
            style={{
              backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow,
              borderWidth: 1,
              borderColor: PROFILE_THEME_COLORS.outlineVariant,
            }}
          >
            <DollarSign size={15} color={PROFILE_THEME_COLORS.onSurfaceVariant} strokeWidth={2.5} />
            <Text
              className="ml-2"
              style={{
                color: PROFILE_THEME_COLORS.onSurfaceVariant,
                fontFamily: 'PlusJakartaSans-SemiBold',
                fontSize: 12,
                lineHeight: 18,
              }}
            >
              {item.priceLabel}/ng
            </Text>
          </View>
        </View>

        <View className="mt-4 rounded-[24px] p-3.5" style={{ backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow }}>
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
                  {item.host.initials}
                </Text>
              </View>

              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text
                    numberOfLines={1}
                    style={{
                      color: PROFILE_THEME_COLORS.onSurface,
                      fontFamily: 'PlusJakartaSans-SemiBold',
                      fontSize: 13,
                    }}
                  >
                    {item.host.name}
                  </Text>
                  <View className="flex-row items-center rounded-full px-2 py-2" style={{ backgroundColor: PROFILE_THEME_COLORS.surfaceContainerHighest }}>
                    <Star size={11} color={PROFILE_THEME_COLORS.primary} fill={PROFILE_THEME_COLORS.primary} strokeWidth={2.2} />
                    <Text
                      className="ml-1"
                      style={{
                        color: PROFILE_THEME_COLORS.onSurface,
                        fontFamily: 'PlusJakartaSans-SemiBold',
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
                    fontFamily: 'PlusJakartaSans-Regular',
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
                  fontFamily: 'PlusJakartaSans-ExtraBold',
                  fontSize: 16,
                }}
              >
                {item.activePlayers}/{item.maxPlayers}
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

          <View className="mt-3 h-2 rounded-full overflow-hidden" style={{ backgroundColor: PROFILE_THEME_COLORS.surfaceContainerHighest }}>
            <LinearGradient
              colors={[PROFILE_THEME_COLORS.primary, PROFILE_THEME_COLORS.tertiary]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={{ width: `${heroProgressPercent}%`, height: '100%', borderRadius: 999 }}
            />
          </View>

          <View className="mt-3 flex-row items-center justify-between gap-3">
            <View className="flex-1 flex-row items-center">
              {heroVisiblePlayers.map((player, index) => (
                <View
                  key={player.id}
                  className={`h-8 w-8 items-center justify-center rounded-full ${index === 0 ? '' : '-ml-2.5'}`}
                  style={{
                    position: 'relative',
                    zIndex: 20 - index,
                    backgroundColor: PROFILE_THEME_COLORS.primary,
                    borderWidth: 2,
                    borderColor: PROFILE_THEME_COLORS.surfaceContainerLowest,
                  }}
                >
                  <Text
                    style={{
                      color: PROFILE_THEME_COLORS.onPrimary,
                      fontFamily: 'PlusJakartaSans-Bold',
                      fontSize: 10,
                    }}
                  >
                    {player.initials}
                  </Text>
                </View>
              ))}

              {Array.from({ length: heroEmptySlots }).map((_, index) => (
                <View
                  key={`hero-empty-${index}`}
                  className={`h-8 w-8 items-center justify-center rounded-full ${heroVisiblePlayers.length === 0 && index === 0 ? '' : '-ml-2.5'}`}
                  style={{
                    position: 'relative',
                    zIndex: 1,
                    backgroundColor: 'transparent',
                    borderWidth: 1.5,
                    borderStyle: 'dashed',
                    borderColor: PROFILE_THEME_COLORS.outlineVariant,
                  }}
                >
                  <Text
                    style={{
                      color: PROFILE_THEME_COLORS.outlineVariant,
                      fontFamily: 'PlusJakartaSans-ExtraBold',
                      fontSize: 10,
                    }}
                  >
                    +
                  </Text>
                </View>
              ))}

              {heroRemainingPlayers > 0 ? (
                <View
                  className="-ml-2.5 h-8 w-8 items-center justify-center rounded-full"
                  style={{
                    position: 'relative',
                    zIndex: 2,
                    backgroundColor: PROFILE_THEME_COLORS.surfaceContainerHighest,
                    borderWidth: 2,
                    borderColor: PROFILE_THEME_COLORS.surfaceContainerLowest,
                  }}
                >
                  <Text
                    style={{
                      color: PROFILE_THEME_COLORS.onSurfaceVariant,
                      fontFamily: 'PlusJakartaSans-SemiBold',
                      fontSize: 10,
                    }}
                  >
                    +{heroRemainingPlayers}
                  </Text>
                </View>
              ) : null}
            </View>

            <View
              className="rounded-full px-4 py-2"
              style={{
                backgroundColor: PROFILE_THEME_COLORS.primary,
              }}
            >
              <Text
                style={{
                  color: PROFILE_THEME_COLORS.onPrimary,
                  fontFamily: 'PlusJakartaSans-ExtraBold',
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: 1.2,
                }}
              >
                {actionLabel}
              </Text>
            </View>
          </View>
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
  const [datePart, clockPart] = item.timeLabel.split('•').map((part) => part.trim())
  const timeRangeLabel = clockPart ?? item.timeLabel
  const compactDateLabel = clockPart ? datePart : item.timeLabel
  const localizedDateLabel = compactDateLabel
    .replace('CN', 'Chủ nhật')
    .replace('T2', 'Thứ 2')
    .replace('T3', 'Thứ 3')
    .replace('T4', 'Thứ 4')
    .replace('T5', 'Thứ 5')
    .replace('T6', 'Thứ 6')
    .replace('T7', 'Thứ 7')
  const fullDateLabel = localizedDateLabel.replace(/,\s*(\d{1,2})\/(\d{1,2})$/, (_, day, month) => {
    const dayNumber = Number.parseInt(day, 10)
    const monthNumber = Number.parseInt(month, 10)
    return `, ${dayNumber} Tháng ${monthNumber}`
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
      className="overflow-hidden rounded-[32px] p-5"
      style={{
        minHeight: 300,
        backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest,
        shadowColor: '#0f172a',
        shadowOpacity: 0.06,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
        elevation: 3,
      }}
    >
      <View
        className="relative -mx-5 -mt-5 overflow-hidden px-5 pt-5 pb-4"
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
              fontFamily: 'PlusJakartaSans-ExtraBold',
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
            fontFamily: 'PlusJakartaSans-ExtraBoldItalic',
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
                fontFamily: 'PlusJakartaSans-SemiBold',
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
                fontFamily: 'PlusJakartaSans-SemiBold',
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
                fontFamily: 'PlusJakartaSans-SemiBold',
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
        {item.isRanked ? <MiniBadgeLight icon={Trophy} label="Kèo tính điểm" tone="neutral" size="lg" /> : null}
        <MiniBadgeLight icon={BookingStatusIcon} label={item.statusLabel} tone="neutral" size="lg" />
        <View
          className="flex-row items-center rounded-full px-3 py-2"
          style={{ backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow, borderWidth: 1, borderColor: PROFILE_THEME_COLORS.outlineVariant }}
        >
          <DollarSign size={15} color={PROFILE_THEME_COLORS.onSurfaceVariant} strokeWidth={2.5} />
          <Text
            className="ml-1.5"
            style={{
              color: PROFILE_THEME_COLORS.onSurfaceVariant,
              fontFamily: 'PlusJakartaSans-SemiBold',
              fontSize: 12,
              lineHeight: 18,
            }}
          >
            {item.priceLabel}/ng
          </Text>
        </View>
      </View>

      <View
        className="mt-4 rounded-[24px] p-3.5"
        style={{
          backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow,
        }}
      >
<View className="flex-row items-center justify-between">
          <View className="mr-3 flex-1 flex-row items-center">
            <View
              className="mr-3 h-11 w-11 items-center justify-center rounded-full"
              style={{
                backgroundColor: accentColor,
                borderWidth: 1,
                borderColor: withAlpha(accentColor, 0.14),
              }}
            >
              <Text
                style={{
                  color: onAccentColor,
                  fontFamily: 'PlusJakartaSans-ExtraBold',
                  fontSize: 15,
                }}
              >
                {item.host.initials}
              </Text>
            </View>

            <View className="flex-1">
              <View className="flex-row items-center gap-2">
                <Text
                  numberOfLines={1}
                  style={{
                    color: PROFILE_THEME_COLORS.onSurface,
                    fontFamily: 'PlusJakartaSans-SemiBold',
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
                      fontFamily: 'PlusJakartaSans-SemiBold',
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
                  fontFamily: 'PlusJakartaSans-Regular',
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
                fontFamily: 'PlusJakartaSans-ExtraBold',
                fontSize: 16,
              }}
            >
              {item.activePlayers}/{item.maxPlayers}
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

        <View className="mt-3 h-2 rounded-full overflow-hidden" style={{ backgroundColor: PROFILE_THEME_COLORS.surfaceContainerHighest }}>
          <LinearGradient
            colors={[accentColor, isRescueAccent ? PROFILE_THEME_COLORS.onErrorContainer : PROFILE_THEME_COLORS.tertiary]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ width: `${progressPercent}%`, height: '100%', borderRadius: 999 }}
          />
        </View>

        <View className="mt-3 flex-row items-center justify-between gap-3">
          <View className="flex-1 flex-row items-center">
            {visiblePlayers.map((player, index) => (
              <View
                key={player.id}
                className={`h-8 w-8 items-center justify-center rounded-full ${index === 0 ? '' : '-ml-2.5'}`}
                style={{
                  position: 'relative',
                  zIndex: 20 - index,
                  backgroundColor: accentColor,
                  borderWidth: 2,
                  borderColor: PROFILE_THEME_COLORS.surfaceContainerLowest,
                }}
              >
                <Text
                  style={{
                    color: onAccentColor,
                    fontFamily: 'PlusJakartaSans-Bold',
                    fontSize: 10,
                  }}
                >
                  {player.initials}
                </Text>
              </View>
            ))}

            {Array.from({ length: emptySlots }).map((_, index) => (
              <View
                key={`list-empty-${index}`}
                className={`h-8 w-8 items-center justify-center rounded-full ${visiblePlayers.length === 0 && index === 0 ? '' : '-ml-2.5'}`}
                style={{
                  position: 'relative',
                  zIndex: 1,
                  backgroundColor: 'transparent',
                  borderWidth: 1.5,
                  borderStyle: 'dashed',
                  borderColor: PROFILE_THEME_COLORS.outlineVariant,
                }}
              >
                <Text
                  style={{
                    color: PROFILE_THEME_COLORS.outlineVariant,
                    fontFamily: 'PlusJakartaSans-ExtraBold',
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
                  borderWidth: 2,
                  borderColor: PROFILE_THEME_COLORS.surfaceContainerLowest,
                }}
              >
                <Text
                  style={{
                    color: PROFILE_THEME_COLORS.onSurfaceVariant,
                    fontFamily: 'PlusJakartaSans-SemiBold',
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
                fontFamily: 'PlusJakartaSans-ExtraBold',
                fontSize: 11,
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
