import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react-native'
import { Text, TouchableOpacity, View } from 'react-native'
import type { StyleProp, ViewStyle } from 'react-native'

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
  style,
}: Props) {
  if (compact) {
    const hasLeading = Boolean(leftSlot || onBackPress)
    const hasTrailing = Boolean(rightSlot)
    const useLeftAlignedCompact = compactTitleAlign === 'left' || (!hasLeading && !hasTrailing)

    if (useLeftAlignedCompact) {
      return (
        <View
          className="px-5 pb-4 pt-3"
          style={[
            {
              zIndex: 20,
              backgroundColor: '#f7f9fb',
              borderBottomWidth: 1,
              borderBottomColor: '#e2e8f0',
              shadowColor: '#0f172a',
              shadowOpacity: 0.04,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
            },
            style,
          ]}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="h-6 w-1.5 rounded-full bg-[#059669]" />
              <Text
                className="ml-3 text-[20px] font-black text-[#006948]"
                style={{ fontFamily: 'PlusJakartaSans-Bold', textTransform: compactTitleUppercase ? 'uppercase' : 'none' }}
              >
                {title}
              </Text>
            </View>
            {hasTrailing ? rightSlot : null}
          </View>
        </View>
      )
    }

    return (
      <View
        className="px-5 pb-4 pt-3"
        style={[
          {
            zIndex: 20,
            backgroundColor: '#f7f9fb',
            borderBottomWidth: 1,
            borderBottomColor: '#e2e8f0',
            shadowColor: '#0f172a',
            shadowOpacity: 0.04,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 2 },
            elevation: 2,
          },
          style,
        ]}
      >
        <View className="flex-row items-center justify-between">
          {leftSlot ? (
            leftSlot
          ) : onBackPress ? (
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={onBackPress}
              className="h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white"
            >
              <ChevronLeft size={18} color="#006948" strokeWidth={2.5} />
            </TouchableOpacity>
          ) : (
            <View className="h-11 w-11" />
          )}

          <Text
            className="text-[18px] font-black text-[#006948]"
            style={{ fontFamily: 'PlusJakartaSans-Bold', textTransform: compactTitleUppercase ? 'uppercase' : 'none' }}
          >
            {title}
          </Text>

          {rightSlot ?? <View className="h-11 w-11" />}
        </View>
      </View>
    )
  }

  return (
    <View
      className="px-5 pb-4 pt-4"
      style={[
        {
          zIndex: 20,
          backgroundColor: '#f7f9fb',
          borderBottomWidth: 1,
          borderBottomColor: '#e2e8f0',
          shadowColor: '#0f172a',
          shadowOpacity: 0.04,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: 2,
        },
        style,
      ]}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          {eyebrow ? (
            <Text className="text-sm font-medium text-slate-500" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
              {eyebrow}
            </Text>
          ) : null}
          <Text className="mt-1 text-3xl font-black text-slate-950" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
            {title}
          </Text>
          {subtitle ? (
            <Text className="mt-2 text-sm leading-6 text-slate-500" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {rightSlot}
      </View>
    </View>
  )
}
