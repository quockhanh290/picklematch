import React, { useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { Plus } from 'lucide-react-native'
import { useRouter } from 'expo-router'
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated'
import { colors } from '@/constants/colors'
import { SCREEN_FONTS } from '@/constants/typography'

export function ExpandingCreateButton() {
  const router = useRouter()
  const [expanded, setExpanded] = useState(false)
  const width = useSharedValue(44)
  const opacity = useSharedValue(0)

  const animatedStyle = useAnimatedStyle(() => ({
    width: width.value,
  }))

  const textStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  const handlePress = async () => {
    if (!expanded) {
      setExpanded(true)
      width.value = withSpring(160, { damping: 15 })
      opacity.value = withTiming(1, { duration: 300 })

      // Auto-collapse if not tapped again within 3 seconds
      setTimeout(() => {
        setExpanded((curr) => {
          if (curr) {
            width.value = withSpring(44)
            opacity.value = withTiming(0)
            return false
          }
          return curr
        })
      }, 3000)
    } else {
      try {
        const { notificationAsync, NotificationFeedbackType } = require('expo-haptics')
        await notificationAsync(NotificationFeedbackType.Success)
      } catch {}

      router.push('/create-session' as never)
      
      setTimeout(() => {
        width.value = 44
        opacity.value = 0
        setExpanded(false)
      }, 500)
    }
  }

  return (
    <Pressable onPress={handlePress}>
      <Animated.View
        className="flex-row items-center justify-center overflow-hidden rounded-full"
        style={[
          {
            height: 44,
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOpacity: 0.25,
            shadowRadius: 10,
            shadowOffset: { width: 0, height: 4 },
            elevation: 4,
          },
          animatedStyle,
        ]}
      >
        <View className="absolute left-[12px]">
          <Plus size={20} color="#FFFFFF" strokeWidth={2.5} />
        </View>
        <Animated.View style={[{ marginLeft: 40 }, textStyle]}>
          <Text
            className="text-[14px] uppercase tracking-[0.5px]"
            numberOfLines={1}
            style={{ color: '#FFFFFF', fontFamily: SCREEN_FONTS.headline, top: 1 }}
          >
            Tạo kèo mới
          </Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  )
}
