import React from 'react'
import { Pressable, Text, View } from 'react-native'
import { router } from 'expo-router'
import { LinearGradient } from 'expo-linear-gradient'
import { MapPin, CalendarDays, DollarSign, Star, Trophy } from 'lucide-react-native'
import { PROFILE_THEME_COLORS } from '@/constants/profileTheme'
import { RADIUS, SHADOW, SPACING, BORDER } from '@/constants/screenLayout'
import { SCREEN_FONTS, AppFontSet } from '@/constants/typography'
import { MatchSession } from '@/lib/homeFeed'
import { getSkillLevelUi } from '@/lib/skillLevelUi'
import { getBookingStatusVisual, withAlpha } from '@/lib/home/matchCardHelpers'
import { MiniBadgeLight } from './MiniBadgeLight'

interface SessionListCardProps {
  item: MatchSession
  actionLabel: string
  accentMode: 'default' | 'rescue'
}

function openPlayerProfile(playerId?: string, event?: any) {
  event?.stopPropagation()
  if (!playerId) return
  router.push({ pathname: '/player/[id]' as never, params: { id: playerId } })
}

export function SessionListCard({
  item,
  actionLabel,
  accentMode,
}: SessionListCardProps) {
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
        {item.isRanked ? <MiniBadgeLight icon={Trophy} label="Kèo tính điểm" tone="neutral" size="lg" /> : null}
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
              người chơi
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
