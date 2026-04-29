import { SCREEN_FONTS } from '@/constants/typography'
import { router } from 'expo-router'
import { ChevronLeft, Upload } from 'lucide-react-native'
import type { ReactNode } from 'react'
import { Image, Pressable, Text, View } from 'react-native'

type SecondaryNavbarProps = {
  rightSlot?: ReactNode
  progress?: number // 0 to 1
  showProgress?: boolean
  onBackPress?: () => void
}

/**
 * Standard Navbar for 2nd level+ screens (Detail, Flow, Edit, etc.)
 * Background: #F2F0E8, Height: 58px, Brand centered.
 */
export function SecondaryNavbar({
  rightSlot,
  progress,
  showProgress = false,
  onBackPress,
}: SecondaryNavbarProps) {
  const handleBack = onBackPress || (() => router.back())

  return (
    <View style={{ backgroundColor: '#F2F0E8', zIndex: 100 }}>
      <View
        className="flex-row items-center justify-between"
        style={{
          height: 58,
          paddingTop: 12,
          paddingHorizontal: 16,
          paddingBottom: 10,
          borderBottomWidth: 0.5,
          borderBottomColor: '#E5E3DC',
        }}
      >
        {/* Left Slot: Back Button */}
        <Pressable
          onPress={handleBack}
          className="h-9 w-9 items-center justify-center rounded-full border"
          style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E3DC' }}
        >
          <ChevronLeft size={16} color="#1A2E2A" strokeWidth={3} />
        </Pressable>

        {/* Center Slot: Brand Name */}
        <View 
          className="absolute left-0 right-0 items-center justify-center" 
          pointerEvents="none"
          style={{ height: 58, zIndex: -1 }}
        >
          <Text
            style={{
              fontFamily: SCREEN_FONTS.headlineBlack,
              fontSize: 15,
              color: '#0F6E56',
              letterSpacing: 1,
              textTransform: 'uppercase',
            }}
          >
            PICKLEMATCH
          </Text>
        </View>

        {/* Right Slot: Contextual Action */}
        <View className="h-9 items-center justify-center">
          {rightSlot || <View className="w-9" />}
        </View>
      </View>

      {/* Progress Bar (Optional) */}
      {showProgress && progress !== undefined && (
        <View style={{ height: 3, backgroundColor: '#E5E3DC', width: '100%' }}>
          <View
            style={{
              height: '100%',
              backgroundColor: '#0F6E56',
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
    onPress={onPress}
    className="h-9 w-9 items-center justify-center rounded-full border"
    style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E3DC' }}
  >
    <Upload size={16} color="#1A2E2A" strokeWidth={2.5} />
  </Pressable>
)

export const NavbarUserAvatar = ({ url }: { url?: string | null }) => (
  <View
    className="h-9 w-9 overflow-hidden rounded-full"
    style={{ backgroundColor: '#0F6E56' }}
  >
    {url ? (
      <Image source={{ uri: url }} className="h-full w-full" resizeMode="cover" />
    ) : (
      <View className="h-full w-full items-center justify-center">
         {/* Placeholder or nothing as per spec */}
      </View>
    )}
  </View>
)

export const NavbarDoneButton = ({ onPress, disabled = false }: { onPress: () => void; disabled?: boolean }) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    className="rounded-full px-3.5 py-1.5"
    style={{ backgroundColor: '#E1F5EE', opacity: disabled ? 0.6 : 1 }}
  >
    <Text
      style={{
        color: '#0F6E56',
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
        color: '#B4B2A9',
        fontFamily: SCREEN_FONTS.label,
        fontSize: 11,
      }}
    >
      {current} / {total}
    </Text>
  </View>
)
