import { ActivityIndicator, View, ViewStyle, StyleSheet, Text } from 'react-native'
import { PROFILE_THEME_COLORS } from '@/constants/theme/profileTheme'
import { SCREEN_FONTS } from '@/constants/typography'

interface AppLoadingProps {
  size?: 'small' | 'large'
  color?: string
  fullScreen?: boolean
  label?: string
  style?: ViewStyle
}

export function AppLoading({ 
  size = 'large', 
  color = PROFILE_THEME_COLORS.primary, 
  fullScreen = false,
  label,
  style 
}: AppLoadingProps) {
  const content = (
    <>
      <ActivityIndicator size={size} color={color} />
      {label ? (
        <Text 
          style={{ 
            marginTop: 12, 
            fontSize: 14, 
            color: PROFILE_THEME_COLORS.onSurfaceVariant, 
            fontFamily: SCREEN_FONTS.headline,
            textAlign: 'center'
          }}
        >
          {label}
        </Text>
      ) : null}
    </>
  )

  if (fullScreen) {
    return (
      <View style={[styles.fullScreen, { backgroundColor: PROFILE_THEME_COLORS.background }, style]}>
        {content}
      </View>
    )
  }

  return (
    <View style={[styles.container, style]}>
      {content}
    </View>
  )
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  }
})
