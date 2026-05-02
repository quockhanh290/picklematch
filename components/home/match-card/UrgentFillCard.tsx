import React, { useEffect, useState, useMemo } from 'react'
import { Pressable, Text, View } from 'react-native'
import { router } from 'expo-router'
import { PROFILE_THEME_COLORS, PROFILE_THEME_SEMANTIC } from '@/constants/profileTheme'
import { RADIUS, SPACING, BORDER, BUTTON } from '@/constants/screenLayout'
import { SCREEN_FONTS, AppFontSet } from '@/constants/typography'
import { MatchSession } from '@/lib/homeFeed'
import { formatDistance } from '@/utils/formatters'
import { 
  parseSessionStartDate, 
  parseSessionEndDate,
  getHeaderTimeLabel,
  getSuggestedDayInfo,
  formatClock
} from '@/lib/home/matchCardHelpers'

interface UrgentFillCardProps {
  item: MatchSession
}

export function UrgentFillCard({ item }: UrgentFillCardProps) {
  const [now, setNow] = useState(() => new Date())
  const startDate = useMemo(() => parseSessionStartDate(item), [item])
  const endDate = parseSessionEndDate(item, startDate)
  const timeInfo = getHeaderTimeLabel(startDate, now)
  const dayInfo = getSuggestedDayInfo(startDate)
  const distanceLabel = formatDistance((item as any).distanceKm)
  const addressParts = item.address
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
  const addressLabel = [item.address, distanceLabel].filter(Boolean).join(' \u00b7 ')
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
        backgroundColor: PROFILE_THEME_COLORS.surface,
        borderWidth: BORDER.base,
        borderColor: PROFILE_THEME_SEMANTIC.rescueBorder,
      }}
    >
      <View
        style={{
          backgroundColor: PROFILE_THEME_SEMANTIC.rescueStrong,
          paddingHorizontal: 16,
          paddingVertical: SPACING.xs,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 6, flexShrink: 1 }}>
          <View style={{ width: 5, height: 5, borderRadius: RADIUS.full, backgroundColor: PROFILE_THEME_COLORS.onPrimary }} />
          <Text
            numberOfLines={1}
            style={{
              color: PROFILE_THEME_COLORS.onPrimary,
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

        {timeInfo.label ? (
          <Text
            numberOfLines={1}
            style={{
              color: PROFILE_THEME_COLORS.onPrimary,
              opacity: 0.9,
              fontFamily: SCREEN_FONTS.cta,
              fontSize: 11,
              lineHeight: 15,
              marginLeft: 10,
            }}
          >
            {timeInfo.label}
          </Text>
        ) : null}
      </View>

      <View style={{ paddingTop: 12, paddingHorizontal: 16, paddingBottom: 8 }}>
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={{
            color: PROFILE_THEME_COLORS.onSurface,
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
          <Text numberOfLines={1} ellipsizeMode="tail" style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: SCREEN_FONTS.body, fontSize: 12, lineHeight: 16, flexShrink: 1 }}>
            {addressLabel}
          </Text>
          {waitingPlayers > 0 ? (
            <>
              <View style={{ width: 3, height: 3, borderRadius: RADIUS.full, backgroundColor: PROFILE_THEME_COLORS.outlineVariant }} />
              <Text style={{ color: PROFILE_THEME_SEMANTIC.rescueStrong, fontFamily: SCREEN_FONTS.label, fontSize: 11, lineHeight: 15 }}>
                {urgentText}
              </Text>
            </>
          ) : null}
        </View>
      </View>

      <View style={{ backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow, paddingTop: 10, paddingHorizontal: 16, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 8, marginBottom: 4 }}>
          <View style={{ backgroundColor: PROFILE_THEME_SEMANTIC.rescueStrong, borderRadius: 3, paddingHorizontal: 7, paddingVertical: 2 }}>
            <Text style={{ color: PROFILE_THEME_COLORS.onPrimary, fontFamily: SCREEN_FONTS.cta, fontSize: 9, lineHeight: 12 }}>
              {dayInfo.badgeLabel}
            </Text>
          </View>
          <Text style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: SCREEN_FONTS.body, fontSize: 11, lineHeight: 15 }}>
            {dayInfo.label}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <View>
            <Text style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: SCREEN_FONTS.label, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>
              {'THỜI GIAN'}
            </Text>
            <Text
              style={{
                color: PROFILE_THEME_COLORS.onSurface,
                fontFamily: AppFontSet.headline,
                fontSize: 33,
                lineHeight: 33,
                letterSpacing: 0,
              }}
            >
              {formatClock(startDate)}
            </Text>
            <Text style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: SCREEN_FONTS.body, fontSize: 11, lineHeight: 15, marginTop: 4 }}>
              {`đến ${formatClock(endDate)}`}
            </Text>
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: SCREEN_FONTS.label, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>
              {'CHI PHÍ'}
            </Text>
            <Text style={{ color: item.priceLabel === 'Miễn phí' ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.onSurface, fontFamily: AppFontSet.headline, fontSize: 25, lineHeight: 25 }}>
              {item.priceLabel}
            </Text>
            <Text style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: SCREEN_FONTS.body, fontSize: 11, lineHeight: 15, marginTop: 2 }}>
              {item.priceLabel === 'Miễn phí' ? '' : '/người'}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ backgroundColor: PROFILE_THEME_COLORS.surface, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2 }}>
            <Text style={{ color: PROFILE_THEME_COLORS.onSurface, fontFamily: SCREEN_FONTS.label, fontSize: 12, lineHeight: 16 }}>
              {item.skillLabel}
            </Text>
          </View>

          <Text style={{ color: PROFILE_THEME_SEMANTIC.rescueStrong, fontFamily: SCREEN_FONTS.label, fontSize: 12, lineHeight: 16 }}>
            {`${item.activePlayers}/${item.maxPlayers} ng\u01b0\u1eddi`}
          </Text>

          <Pressable
            onPress={(event) => {
              event.stopPropagation()
              router.push({ pathname: '/session/[id]' as never, params: { id: item.id } })
            }}
            style={{ backgroundColor: PROFILE_THEME_SEMANTIC.rescueStrong, ...BUTTON.pill }}
          >
            <Text style={{ color: PROFILE_THEME_COLORS.onPrimary, fontFamily: SCREEN_FONTS.headline, fontSize: 15, lineHeight: 18, textTransform: 'uppercase' }}>
              Vào ngay
            </Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  )
}
