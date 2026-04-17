import { Home, MapPin, Zap } from 'lucide-react-native'
import { ImageBackground, Text, View } from 'react-native'

import type { FamiliarCourt } from '@/lib/homeFeed'

const iconStroke = 2.7
export const COURT_CARD_HEIGHT = 256

export function FamiliarCourtCard({ item }: { item: FamiliarCourt }) {
  return (
    <ImageBackground
      source={{ uri: item.image }}
      imageStyle={{ borderRadius: 32 }}
      className="h-64 overflow-hidden rounded-[32px]"
      style={{ height: COURT_CARD_HEIGHT }}
    >
      <View className="flex-1 justify-between bg-black/15 p-5">
        <View className="flex-row items-start justify-between">
          <View className="rounded-full border border-white/20 bg-white/15 px-4 py-2">
            <View className="flex-row items-center">
              <Home size={14} color="#ffffff" strokeWidth={iconStroke} />
              <Text className="ml-2 text-xs font-bold uppercase tracking-[2.2px] text-white">Sân quen</Text>
            </View>
          </View>

          <View className="rounded-full border border-orange-200 bg-white px-4 py-2">
            <View className="flex-row items-center">
              <Zap size={14} color="#ea580c" strokeWidth={iconStroke} />
              <Text className="ml-2 text-xs font-black text-orange-700">{item.openMatches} kèo đang mở</Text>
            </View>
          </View>
        </View>

        <View
          className="rounded-[24px] border border-white/70 bg-white/90 p-4"
          style={{ shadowColor: '#0f172a', shadowOpacity: 0.12, shadowRadius: 18, shadowOffset: { width: 0, height: 10 } }}
        >
          <Text className="text-[22px] font-black text-slate-950" style={{ lineHeight: 30 }}>{item.name}</Text>
          <View className="mt-2 flex-row items-center">
            <MapPin size={14} color="#475569" strokeWidth={iconStroke} />
            <Text className="ml-2 text-sm font-semibold text-slate-600">{item.area}</Text>
          </View>
          <Text className="mt-3 text-sm leading-6 text-slate-500">{item.note}</Text>
        </View>
      </View>
    </ImageBackground>
  )
}
