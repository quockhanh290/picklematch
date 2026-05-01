import React from 'react'
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
  getSuggestedDayInfo, 
  formatClock 
} from '@/lib/home/matchCardHelpers'

interface SuggestedSessionCardProps {
  item: MatchSession
  showFullAddress?: boolean
}

export function SuggestedSessionCard({ item, showFullAddress }: SuggestedSessionCardProps) {
  const startDate = parseSessionStartDate(item)
  const endDate = parseSessionEndDate(item, startDate)
  const dayInfo = getSuggestedDayInfo(startDate)
  const distanceLabel = formatDistance((item as any).distanceKm)
  const addressParts = item.address
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
  const addressLabel = [item.address, distanceLabel].filter(Boolean).join(' \u00b7 ')
  const levelMatchesUser = (item as any).levelMatchesUser !== false
  const pagination = `${(item.carouselIndex ?? 0) + 1} / ${item.carouselTotal ?? 1}`

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/session/[id]' as never, params: { id: item.id } })}
      className="overflow-hidden rounded-[16px]"
      style={{
        backgroundColor: PROFILE_THEME_COLORS.surface,
        borderWidth: BORDER.hairline,
        borderColor: PROFILE_THEME_COLORS.outlineVariant,
      }}
    >
      <View
        style={{
          backgroundColor: PROFILE_THEME_COLORS.primary,
          paddingHorizontal: 16,
          paddingVertical: SPACING.xs,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 6 }}>
          <View style={{ width: 5, height: 5, borderRadius: RADIUS.full, backgroundColor: PROFILE_THEME_COLORS.onPrimary }} />
          <Text
            style={{
              color: PROFILE_THEME_COLORS.onPrimary,
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
            color: PROFILE_THEME_COLORS.onPrimary,
            opacity: 0.6,
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
          numberOfLines={1}
          ellipsizeMode="tail"
          style={{
            color: PROFILE_THEME_COLORS.onSurface,
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
          <Text numberOfLines={1} ellipsizeMode="tail" style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: SCREEN_FONTS.body, fontSize: 12, lineHeight: 16, flexShrink: 1 }}>
            {addressLabel}
          </Text>
          {levelMatchesUser ? (
            <>
              <View style={{ width: 3, height: 3, borderRadius: RADIUS.full, backgroundColor: PROFILE_THEME_COLORS.outline }} />
              <Text style={{ color: PROFILE_THEME_COLORS.primary, fontFamily: SCREEN_FONTS.label, fontSize: 11, lineHeight: 15 }}>
                {'\u2713 kh\u1edbp v\u1edbi b\u1ea1n'}
              </Text>
            </>
          ) : null}
        </View>
      </View>

      <View style={{ backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow, paddingTop: 10, paddingHorizontal: 16, paddingBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 8 }}>
            <View style={{ backgroundColor: dayInfo.badgeColor, borderRadius: 3, paddingHorizontal: 7, paddingVertical: 2 }}>
              <Text style={{ color: PROFILE_THEME_COLORS.onPrimary, fontFamily: SCREEN_FONTS.cta, fontSize: 12, lineHeight: 16 }}>
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
                backgroundColor: item.courtBookingConfirmed ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_SEMANTIC.warningStrong 
              }} 
            />
            <Text 
              style={{ 
                fontFamily: SCREEN_FONTS.cta, 
                fontSize: 10, 
                color: item.courtBookingConfirmed ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_SEMANTIC.warningText,
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
            <Text style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: SCREEN_FONTS.body, fontSize: 12, lineHeight: 16, marginTop: 4 }}>
              {`đến ${formatClock(endDate)}`}
            </Text>
          </View>
 
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: SCREEN_FONTS.label, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>
              {'CHI PHÍ'}
            </Text>
            <Text style={{ color: PROFILE_THEME_COLORS.onSurface, fontFamily: AppFontSet.headline, fontSize: 25, lineHeight: 25 }}>
              {item.priceLabel}
            </Text>
            <Text style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: SCREEN_FONTS.body, fontSize: 11, lineHeight: 15, marginTop: 2 }}>
              {item.priceLabel === 'Miễn phí' ? '' : '/người'}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ backgroundColor: PROFILE_THEME_COLORS.surface, borderRadius: 4, paddingHorizontal: 9, paddingVertical: 3 }}>
            <Text style={{ color: PROFILE_THEME_COLORS.onSurface, fontFamily: SCREEN_FONTS.label, fontSize: 12, lineHeight: 16 }}>
              {item.skillLabel}
            </Text>
          </View>

          <Text style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: SCREEN_FONTS.body, fontSize: 12, lineHeight: 16 }}>
            {`${item.activePlayers}/${item.maxPlayers} ng\u01b0\u1eddi`}
          </Text>

          <Pressable
            onPress={(event) => {
              event.stopPropagation()
              router.push({ pathname: '/session/[id]' as never, params: { id: item.id } })
            }}
            style={{ backgroundColor: PROFILE_THEME_COLORS.primary, ...BUTTON.pill }}
          >
            <Text style={{ color: PROFILE_THEME_COLORS.onPrimary, fontFamily: SCREEN_FONTS.headline, fontSize: 15, lineHeight: 18, textTransform: 'uppercase' }}>
              Vào kèo
            </Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  )
}
