import { Hand } from 'lucide-react-native'
import Animated from 'react-native-reanimated'
import { View } from 'react-native'
import { PROFILE_THEME_COLORS } from '@/components/profile/profileTheme'

export function HelloWave() {
  return (
    <Animated.View
      style={{
        marginTop: -6,
        animationName: {
          '50%': { transform: [{ rotate: '25deg' }] },
        },
        animationIterationCount: 4,
        animationDuration: '300ms',
      }}
    >
      <View>
        <Hand size={28} color={PROFILE_THEME_COLORS.onBackground} />
      </View>
    </Animated.View>
  )
}


