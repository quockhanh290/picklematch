import { router } from 'expo-router'
import { Clock, MapPin, Star, Users } from 'lucide-react-native'
import type { LucideIcon } from 'lucide-react-native'
import { Pressable, Text, View } from 'react-native'

import type { MatchSession } from '@/lib/homeFeed'
import { getSkillLevelUi } from '@/lib/skillLevelUi'

const iconStroke = 2.7
export const SMART_MATCH_CARD_HEIGHT = 520

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
        cardBg: 'rgba(255,255,255,0.10)',
        cardBorder: 'rgba(255,255,255,0.16)',
        actionBg: '#ffffff',
        actionText: '#0f172a',
      }
    : {
        primary: '#0f172a',
        secondary: 'rgba(15,23,42,0.84)',
        tertiary: 'rgba(15,23,42,0.62)',
        softChip: 'rgba(255,255,255,0.38)',
        contrastChip: 'rgba(15,23,42,0.10)',
        cardBg: 'rgba(255,255,255,0.42)',
        cardBorder: 'rgba(255,255,255,0.24)',
        actionBg: '#0f172a',
        actionText: '#ffffff',
      }
}

function MiniBadge({
  icon: Icon,
  label,
  tone = 'neutral',
}: {
  icon: LucideIcon
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

export function MatchSessionCard({
  item,
  variant,
  actionLabel,
}: {
  item: MatchSession
  variant: 'hero' | 'smart' | 'standard'
  actionLabel: string
}) {
  const levelUi = getSkillLevelUi(item.levelId)
  const Icon = levelUi.icon
  const palette = getHeroTextPalette(levelUi.heroFrom)
  const isHero = variant === 'hero'
  const isSmart = variant === 'smart'

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/session/[id]' as never, params: { id: item.id } })}
      className="overflow-hidden rounded-[36px] p-5"
      style={{
        minHeight: SMART_MATCH_CARD_HEIGHT,
        backgroundColor: levelUi.heroFrom,
        borderWidth: 1,
        borderColor: palette.cardBorder,
        shadowColor: levelUi.heroTo,
        shadowOpacity: isHero ? 0.28 : 0.18,
        shadowRadius: isHero ? 24 : 18,
        shadowOffset: { width: 0, height: isHero ? 16 : 12 },
        elevation: isHero ? 9 : 5,
      }}
    >
      <View className="absolute -right-10 -top-12 h-40 w-40 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.12)' }} />
      <View className="absolute -left-10 bottom-20 h-28 w-28 rounded-full" style={{ backgroundColor: 'rgba(15,23,42,0.08)' }} />

      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-4">
          <View className="flex-row items-center">
            <View className="rounded-full px-3 py-2" style={{ backgroundColor: palette.softChip }}>
              <Text className="text-[11px] font-black uppercase tracking-[1.8px]" style={{ color: palette.primary }}>
                {isHero ? 'Kèo kế tiếp' : isSmart ? 'Gợi ý hợp gu' : 'Đang ghép kèo'}
              </Text>
            </View>
            {item.countdownLabel ? (
              <View className="ml-2 rounded-full px-3 py-2" style={{ backgroundColor: palette.contrastChip }}>
                <Text className="text-[11px] font-black uppercase tracking-[1.4px]" style={{ color: palette.primary }}>
                  {item.countdownLabel}
                </Text>
              </View>
            ) : null}
          </View>

          <Text className="mt-4 text-[28px] font-black leading-[34px]" style={{ color: palette.primary }}>
            {item.title}
          </Text>
          <Text className="mt-2 text-[15px] font-semibold" style={{ color: palette.secondary }}>
            {item.courtName}
          </Text>
          <Text className="mt-2 text-sm leading-6" style={{ color: palette.tertiary }}>
            {item.address}
          </Text>
        </View>

        <View className="rounded-[24px] p-4" style={{ backgroundColor: palette.cardBg, borderWidth: 1, borderColor: palette.cardBorder }}>
          <Icon size={24} color={palette.primary} strokeWidth={2.5} />
          <Text className="mt-3 text-xs font-black uppercase tracking-[1.6px]" style={{ color: palette.secondary }}>
            Trình độ
          </Text>
          <Text className="mt-1 text-lg font-black" style={{ color: palette.primary }}>
            {item.skillLabel}
          </Text>
        </View>
      </View>

      <View className="mt-6 rounded-[28px] p-4" style={{ backgroundColor: palette.cardBg, borderWidth: 1, borderColor: palette.cardBorder }}>
        <View className="flex-row flex-wrap gap-2">
          <MiniBadge icon={Clock} label={item.timeLabel} tone="dark" />
          <MiniBadge icon={MapPin} label={item.statusLabel} tone={item.urgent ? 'urgent' : 'neutral'} />
          <MiniBadge icon={Users} label={item.openSlotsLabel} tone={item.urgent ? 'urgent' : 'success'} />
        </View>

        <View className="mt-5 flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-[12px] font-black uppercase tracking-[1.6px]" style={{ color: palette.secondary }}>
              Chủ kèo
            </Text>
            <Text className="mt-2 text-xl font-black" style={{ color: palette.primary }}>
              {item.host.name}
            </Text>
            <View className="mt-2 flex-row items-center">
              <Star size={14} color={palette.primary} strokeWidth={2.5} />
              <Text className="ml-1.5 text-sm font-bold" style={{ color: palette.secondary }}>
                {item.host.rating.toFixed(1)} • {item.host.vibe}
              </Text>
            </View>
          </View>

          <View className="items-end">
            <Text className="text-[12px] font-black uppercase tracking-[1.6px]" style={{ color: palette.secondary }}>
              Chi phí
            </Text>
            <Text className="mt-2 text-2xl font-black" style={{ color: palette.primary }}>
              {item.priceLabel}
            </Text>
          </View>
        </View>
      </View>

      <View className="mt-6 flex-row items-center justify-between">
        <View className="flex-row items-center">
          {item.players.slice(0, 3).map((player, index) => (
            <View
              key={player.id}
              className="h-11 w-11 items-center justify-center rounded-full border-2"
              style={{
                marginLeft: index === 0 ? 0 : -10,
                backgroundColor: 'rgba(255,255,255,0.18)',
                borderColor: 'rgba(255,255,255,0.9)',
              }}
            >
              <Text className="text-xs font-black" style={{ color: palette.primary }}>
                {player.initials}
              </Text>
            </View>
          ))}
          <Text className="ml-3 text-sm font-semibold" style={{ color: palette.secondary }}>
            {item.players.length > 0 ? `${item.players.length} người đã vào` : 'Đang mở ghép người'}
          </Text>
        </View>

        <View className="rounded-full px-5 py-3" style={{ backgroundColor: palette.actionBg }}>
          <Text className="text-[12px] font-black uppercase tracking-[1.6px]" style={{ color: palette.actionText }}>
            {actionLabel}
          </Text>
        </View>
      </View>
    </Pressable>
  )
}
