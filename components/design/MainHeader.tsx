import { PROFILE_THEME_COLORS } from '@/constants/profileTheme'
import { SCREEN_FONTS } from '@/constants/typography'
import { ReactNode } from 'react'
import { Text, View, ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SPACING } from '@/constants/screenLayout'

interface MainHeaderProps {
  title: string
  subtitle?: string
  rightElement?: ReactNode
  style?: ViewStyle
}

export function MainHeader({ title, subtitle, rightElement, style }: MainHeaderProps) {
  const insets = useSafeAreaInsets()

  return (
    <View
      style={[
        {
          paddingTop: insets.top + 20,
          paddingHorizontal: SPACING.xl,
          paddingBottom: 16,
          backgroundColor: PROFILE_THEME_COLORS.background,
        },
        style,
      ]}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-4">
          <Text
            style={{
              color: PROFILE_THEME_COLORS.onBackground,
              fontFamily: SCREEN_FONTS.headlineBlack,
              fontSize: 40,
              lineHeight: 54,
              letterSpacing: -1,
              textTransform: 'uppercase',
            }}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={{
                color: PROFILE_THEME_COLORS.onSurfaceVariant,
                fontFamily: SCREEN_FONTS.body,
                fontSize: 13,
                marginTop: -2,
              }}
            >
              {subtitle}
            </Text>
          ) : null}
        </View>
        {rightElement ? (
          <View>
            {rightElement}
          </View>
        ) : null}
      </View>
    </View>
  )
}

