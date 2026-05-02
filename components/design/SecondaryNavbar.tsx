import { PROFILE_THEME_COLORS } from '@/constants/profileTheme'
import { RADIUS, SPACING } from '@/constants/screenLayout'
import { SCREEN_FONTS } from '@/constants/typography'
import { router } from 'expo-router'
import { ChevronLeft, Upload } from 'lucide-react-native'
import type { ReactNode } from 'react'
import { Image, Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'

type SecondaryNavbarProps = {
  title?: string
  rightSlot?: ReactNode
  progress?: number // 0 to 1
  showProgress?: boolean
  onBackPress?: () => void
  style?: any
}

const NAVBAR_HEIGHT = 58

/**
 * Standard Navbar for 2nd level+ screens (Detail, Flow, Edit, etc.)
 * Background: surfaceAlt, Height: 58px, Brand centered.
 */
export function SecondaryNavbar({
  title,
  rightSlot,
  progress,
  showProgress = false,
  onBackPress,
  style,
}: SecondaryNavbarProps) {
  const insets = useSafeAreaInsets()
  const handleBack = onBackPress || (() => router.back())

  return (
    <View style={[{ backgroundColor: PROFILE_THEME_COLORS.surfaceAlt, zIndex: 100, paddingTop: insets.top }, style]}>
      <View
        className="flex-row items-center justify-between"
        style={{
          height: NAVBAR_HEIGHT,
          paddingTop: SPACING.sm,
          paddingHorizontal: SPACING.xl,
          paddingBottom: SPACING.sm,
          borderBottomWidth: 0.5,
          borderBottomColor: PROFILE_THEME_COLORS.outlineVariant,
        }}
      >
        {/* Left Slot: Back Button */}
        <Pressable
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            handleBack()
          }}
          className="h-9 w-9 items-center justify-center rounded-full border"
          style={{ backgroundColor: PROFILE_THEME_COLORS.surface, borderColor: PROFILE_THEME_COLORS.outlineVariant }}
        >
          <ChevronLeft size={16} color={PROFILE_THEME_COLORS.onBackground} strokeWidth={3} />
        </Pressable>

        {/* Center Slot: Brand Name or Title */}
        <View 
          className="absolute left-0 right-0 items-center justify-center" 
          pointerEvents="none"
          style={{ height: NAVBAR_HEIGHT, zIndex: -1 }}
        >
          <Text
            style={{
              fontFamily: SCREEN_FONTS.headlineBlack,
              fontSize: 24,
              color: PROFILE_THEME_COLORS.primary,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
            }}
          >
            {title || 'PICKLEMATCH'}
          </Text>
        </View>

        {/* Right Slot: Contextual Action */}
        <View className="h-9 items-center justify-center">
          {rightSlot || <View className="w-9" />}
        </View>
      </View>

      {/* Progress Bar (Optional) */}
      {showProgress && progress !== undefined && (
        <View style={{ height: 3, backgroundColor: PROFILE_THEME_COLORS.outlineVariant, width: '100%' }}>
          <View
            style={{
              height: '100%',
              backgroundColor: PROFILE_THEME_COLORS.primary,
              width: `${Math.max(0, Math.min(1, progress)) * 100}%`,
            }}
          />
        </View>
      )}
    </View>
  )
}

/**
 * Common Right Slot Components
 */

export const NavbarShareButton = ({ onPress }: { onPress: () => void }) => (
  <Pressable
    onPress={() => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      onPress()
    }}
    className="h-9 w-9 items-center justify-center rounded-full border"
    style={{ backgroundColor: PROFILE_THEME_COLORS.surface, borderColor: PROFILE_THEME_COLORS.outlineVariant }}
  >
    <Upload size={16} color={PROFILE_THEME_COLORS.onBackground} strokeWidth={2.5} />
  </Pressable>
)

export const NavbarUserAvatar = ({ url, name }: { url?: string | null; name?: string | null }) => {
  const initial = name?.trim().charAt(0).toUpperCase() || '?'
  
  return (
    <View
      className="h-9 w-9 overflow-hidden rounded-full"
      style={{ backgroundColor: PROFILE_THEME_COLORS.primary }}
    >
      {url ? (
        <Image source={{ uri: url }} className="h-full w-full" resizeMode="cover" />
      ) : (
        <View className="h-full w-full items-center justify-center">
          <Text 
            style={{ 
              color: PROFILE_THEME_COLORS.surface, 
              fontFamily: SCREEN_FONTS.headline, 
              fontSize: 14,
              lineHeight: 18
            }}
          >
            {initial}
          </Text>
        </View>
      )}
    </View>
  )
}

export const NavbarDoneButton = ({ onPress, disabled = false }: { onPress: () => void; disabled?: boolean }) => (
  <Pressable
    onPress={() => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      onPress()
    }}
    disabled={disabled}
    className="rounded-full px-3.5 py-1.5"
    style={{ backgroundColor: PROFILE_THEME_COLORS.secondaryContainer, opacity: disabled ? 0.6 : 1 }}
  >
    <Text
      style={{
        color: PROFILE_THEME_COLORS.primary,
        fontFamily: SCREEN_FONTS.label,
        fontSize: 11,
        textTransform: 'uppercase',
      }}
    >
      Hoàn tất
    </Text>
  </Pressable>
)

export const NavbarStepCounter = ({ current, total }: { current: number; total: number }) => (
  <View className="h-9 items-center justify-center">
    <Text
      style={{
        color: PROFILE_THEME_COLORS.outline,
        fontFamily: SCREEN_FONTS.label,
        fontSize: 11,
      }}
    >
      {current} / {total}
    </Text>
  </View>
)
