import { PROFILE_THEME_COLORS } from '@/components/profile/profileTheme'
import { ChevronLeft } from 'lucide-react-native'
import type { ReactNode } from 'react'
import type { StyleProp, ViewStyle } from 'react-native'
import { Text, TouchableOpacity, View } from 'react-native'

const BASE_HEADER_STYLE = {
  zIndex: 20,
  backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow,
  borderBottomWidth: 1,
  borderBottomColor: PROFILE_THEME_COLORS.outlineVariant,
  shadowColor: PROFILE_THEME_COLORS.onBackground,
  shadowOpacity: 0.04,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
} as const

type Props = {
  eyebrow?: string
  title: string
  subtitle?: string
  rightSlot?: ReactNode
  onBackPress?: () => void
  leftSlot?: ReactNode
  compact?: boolean
  compactTitleAlign?: 'auto' | 'left' | 'center'
  compactTitleUppercase?: boolean
  variant?: 'default' | 'brand'
  style?: StyleProp<ViewStyle>
}

export function ScreenHeader({
  eyebrow,
  title,
  subtitle,
  rightSlot,
  onBackPress,
  leftSlot,
  compact = false,
  compactTitleAlign = 'auto',
  compactTitleUppercase = false,
  variant = 'default',
  style,
}: Props) {
  if (variant === 'brand') {
    const brandLeading = leftSlot
      ? leftSlot
      : onBackPress
        ? (
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={onBackPress}
            className="h-10 w-10 items-center justify-center rounded-2xl border"
            style={{ borderColor: PROFILE_THEME_COLORS.outlineVariant, backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest }}
          >
            <ChevronLeft size={18} color={PROFILE_THEME_COLORS.primary} strokeWidth={2.5} />
          </TouchableOpacity>
        )
        : <View className="h-[18px] w-[18px]" />

    return (
      <View className="px-6 py-4" style={[BASE_HEADER_STYLE, style]}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-4">
            {brandLeading}
            <Text className="text-3xl" style={{ color: PROFILE_THEME_COLORS.primary, fontFamily: 'PlusJakartaSans-ExtraBoldItalic' }}>
              {title}
            </Text>
          </View>

          {rightSlot ?? <View className="h-10 w-10 rounded-full" />}
        </View>
      </View>
    )
  }

  if (compact) {
    const hasLeading = Boolean(leftSlot || onBackPress)
    const hasTrailing = Boolean(rightSlot)
    const useLeftAlignedCompact = compactTitleAlign === 'left' || (!hasLeading && !hasTrailing)

    return (
      <View className="px-5 pb-4 pt-3" style={[BASE_HEADER_STYLE, style]}>
        <View className="flex-row items-center justify-between gap-3">
          {leftSlot ? (
            leftSlot
          ) : onBackPress ? (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={onBackPress}
              className="h-11 w-11 items-center justify-center rounded-2xl border"
              style={{ borderColor: PROFILE_THEME_COLORS.outlineVariant, backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest }}
            >
              <ChevronLeft size={18} color={PROFILE_THEME_COLORS.primary} strokeWidth={2.5} />
            </TouchableOpacity>
          ) : (
            <View className="h-11 w-11" />
          )}

          <Text
            className="flex-1 text-[18px] font-black"
            numberOfLines={1}
            style={{
              color: PROFILE_THEME_COLORS.primary,
              fontFamily: 'PlusJakartaSans-Bold',
              textTransform: compactTitleUppercase ? 'uppercase' : 'none',
              textAlign: useLeftAlignedCompact ? 'left' : 'center',
            }}
          >
            {title}
          </Text>

          {rightSlot ?? <View className="h-11 w-11" />}
        </View>
      </View>
    )
  }

  return (
    <View className="px-5 pb-4 pt-4" style={[BASE_HEADER_STYLE, style]}>
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          {eyebrow ? (
            <Text className="text-sm font-medium" style={{ color: PROFILE_THEME_COLORS.primary, fontFamily: 'PlusJakartaSans-Regular' }}>
              {eyebrow}
            </Text>
          ) : null}
          <Text className="mt-1 text-3xl font-black" style={{ color: PROFILE_THEME_COLORS.onSurface, fontFamily: 'PlusJakartaSans-Bold' }}>
            {title}
          </Text>
          {subtitle ? (
            <Text className="mt-2 text-sm leading-6" style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: 'PlusJakartaSans-Regular' }}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {rightSlot}
      </View>
    </View>
  )
}
