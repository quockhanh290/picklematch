import { router } from 'expo-router'
import { Hand, LayoutList } from 'lucide-react-native'
import { Dimensions, Pressable, ScrollView, Text, View } from 'react-native'

import { PROFILE_THEME_COLORS, PROFILE_THEME_SEMANTIC } from '@/components/profile/profileTheme'
import type { PendingMatch } from '@/lib/homeFeed'

const screenWidth = Dimensions.get('window').width
const pendingCardWidth = screenWidth - 88
const pendingCardGap = 14

function withAlpha(hex: string, alpha: number) {
  const clean = hex.replace('#', '')
  const normalized = clean.length === 3 ? clean.split('').map((char) => char + char).join('') : clean
  const n = Number.parseInt(normalized, 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
}

function CarouselDots({ count, activeIndex }: { count: number; activeIndex: number }) {
  if (count <= 1) return null

  return (
    <View className="flex-row items-center gap-2">
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          className="h-2 rounded-full"
          style={{
            width: index === activeIndex ? 24 : 8,
            backgroundColor: index === activeIndex ? PROFILE_THEME_COLORS.primaryContainer : PROFILE_THEME_COLORS.outlineVariant,
          }}
        />
      ))}
    </View>
  )
}

function PendingMatchResultCard({ item }: { item: PendingMatch }) {
  return (
    <View
      className="mb-8 flex-row items-center gap-4 overflow-hidden rounded-[32px] border p-5"
      style={{
        borderColor: PROFILE_THEME_COLORS.secondaryFixedDim,
        backgroundColor: PROFILE_THEME_COLORS.primaryFixed,
        width: pendingCardWidth,
        shadowColor: PROFILE_THEME_SEMANTIC.warningStrong,
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 8 },
        elevation: 3,
      }}
    >
      <View
        className="absolute -right-8 -top-10 h-28 w-28 rounded-full"
        style={{ backgroundColor: withAlpha(PROFILE_THEME_SEMANTIC.warningStrong, 0.1) }}
      />

      <View
        className="h-12 w-12 items-center justify-center rounded-full"
        style={{
          backgroundColor: PROFILE_THEME_SEMANTIC.warningStrong,
          shadowColor: PROFILE_THEME_SEMANTIC.warningStrong,
          shadowOpacity: 0.18,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 6 },
          elevation: 4,
        }}
      >
        <LayoutList size={22} color={PROFILE_THEME_COLORS.onPrimary} strokeWidth={2.5} />
      </View>

      <View className="min-w-0 flex-1">
        <Text className="text-[14px] font-black" style={{ color: PROFILE_THEME_COLORS.onPrimaryFixedVariant }}>Cần nhập kết quả</Text>
        <Text className="mt-2 truncate text-[11px] font-bold uppercase tracking-tight" style={{ color: withAlpha(PROFILE_THEME_COLORS.onPrimaryFixedVariant, 0.6) }}>
          {item.courtName}
        </Text>
        <Text className="mt-1 text-[13px] font-semibold" style={{ color: PROFILE_THEME_COLORS.onPrimaryFixedVariant }}>{item.timeLabel}</Text>
      </View>

      <Pressable
        onPress={() => router.push({ pathname: '/match-result/[id]' as any, params: { id: item.id } })}
        className="rounded-full px-4 py-2.5"
        style={{ backgroundColor: PROFILE_THEME_COLORS.primaryContainer }}
      >
        <Text className="text-[11px] font-black uppercase" style={{ color: PROFILE_THEME_COLORS.onPrimary }}>NHẬP NGAY</Text>
      </Pressable>
    </View>
  )
}

type Props = {
  items: PendingMatch[]
  activeIndex: number
  onIndexChange: (index: number) => void
}

export function PendingMatchResultCarousel({ items, activeIndex, onIndexChange }: Props) {
  if (items.length === 0) return null

  if (items.length === 1) {
    return (
      <View className="mt-6">
        <PendingMatchResultCard item={items[0]} />
      </View>
    )
  }

  return (
    <View className="mt-6">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={pendingCardWidth + pendingCardGap}
        snapToAlignment="start"
        disableIntervalMomentum
        contentContainerStyle={{ paddingRight: 28 }}
        onScroll={(event) => {
          const offsetX = event.nativeEvent.contentOffset.x
          const nextIndex = Math.round(offsetX / (pendingCardWidth + pendingCardGap))
          onIndexChange(nextIndex)
        }}
        scrollEventThrottle={16}
      >
        {items.map((item, index) => (
          <View key={item.id} style={{ marginRight: index === items.length - 1 ? 0 : pendingCardGap }}>
            <PendingMatchResultCard item={item} />
          </View>
        ))}
      </ScrollView>

      <View className="-mt-3 flex-row items-center justify-between px-1">
        <CarouselDots count={items.length} activeIndex={activeIndex} />
        <View className="flex-row items-center rounded-full px-3 py-1.5" style={{ backgroundColor: PROFILE_THEME_COLORS.primaryFixed }}>
          <Hand size={14} color={PROFILE_THEME_COLORS.onPrimaryFixedVariant} strokeWidth={2.5} />
          <Text className="ml-1.5 text-[10px] font-black uppercase tracking-[1.4px]" style={{ color: PROFILE_THEME_COLORS.onPrimaryFixedVariant }}>
            Vuốt để xem thêm
          </Text>
        </View>
      </View>
    </View>
  )
}
