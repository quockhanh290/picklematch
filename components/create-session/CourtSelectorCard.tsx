import { MapPin, Search } from 'lucide-react-native'
import { ActivityIndicator, Text, TextInput, TouchableOpacity, View } from 'react-native'

import { PROFILE_THEME_COLORS } from '@/components/profile/profileTheme'
import type { NearByCourt } from '@/lib/useNearbyCourts'

type Props = {
  courts: NearByCourt[]
  loadingCourts: boolean
  fallbackMode: boolean
  keyword: string
  setKeyword: (value: string) => void
  searching: boolean
  selectedCourt: NearByCourt | null
  isChoosingCourt: boolean
  onCourtSelect: (court: NearByCourt) => void
  onChangeCourt: () => void
  title?: string
}

function formatDistance(distance?: number) {
  if (distance == null) return null
  return distance < 1 ? `${Math.round(distance * 1000)}m` : `${distance.toFixed(1)}km`
}

function CourtRow({ court, onPress }: { court: NearByCourt; onPress: (court: NearByCourt) => void }) {
  const distanceLabel = formatDistance(court.distance)
  const isOpen = !!court.hasSlots

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      className="rounded-[18px] border border-slate-200 bg-white p-3.5"
      onPress={() => onPress(court)}
    >
      <View className="flex-row items-start gap-3">
        <View className="h-11 w-11 items-center justify-center rounded-[14px] bg-emerald-100">
          <MapPin size={18} color="#059669" />
        </View>
        <View className="flex-1">
          <View className="flex-row items-start justify-between gap-3">
            <Text className="flex-1 text-[15px] font-black text-slate-900" numberOfLines={1}>
              {court.name}
            </Text>
            {distanceLabel ? <Text className="text-[11px] font-bold text-slate-400">{distanceLabel}</Text> : null}
          </View>
          <Text className="mt-1 text-[12px] leading-[18px] text-slate-500" numberOfLines={2}>
            {court.address}
            {court.city ? ` - ${court.city}` : ''}
          </Text>
          <View className="mt-2 flex-row items-center gap-2">
            <View className={`rounded-full border px-2.5 py-1 ${isOpen ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'}`}>
              <Text className={`text-[10px] font-bold uppercase tracking-[0.8px] ${isOpen ? 'text-emerald-700' : 'text-rose-700'}`}>
                {isOpen ? 'Đang mở' : 'Đã đóng'}
              </Text>
            </View>
            {(court.hours_open || court.hours_close) ? (
              <Text className="text-[11px] font-medium text-slate-400">
                {court.hours_open ?? '06:00'} - {court.hours_close ?? '22:00'}
              </Text>
            ) : null}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
}

export function CourtSelectorCard({
  courts,
  loadingCourts,
  fallbackMode,
  keyword,
  setKeyword,
  searching,
  selectedCourt,
  isChoosingCourt,
  onCourtSelect,
  onChangeCourt,
  title = 'Địa điểm',
}: Props) {
  const showPicker = !selectedCourt || isChoosingCourt

  return (
    <View className="rounded-[20px] border border-slate-200 bg-white p-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-[14px] font-extrabold text-slate-900">{title}</Text>
        {selectedCourt ? (
          <TouchableOpacity onPress={onChangeCourt}>
            <Text className="text-[12px] font-bold text-emerald-600">
              {showPicker ? 'Đóng chọn sân' : 'Đổi sân'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {selectedCourt ? (
        <View className="mt-3.5 flex-row items-center gap-3.5 rounded-[14px] border border-slate-100 bg-slate-50 p-3.5">
          <View className="h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
            <MapPin size={18} color="#059669" />
          </View>
          <View className="flex-1">
            <Text className="text-[15px] font-black text-slate-900" numberOfLines={1}>
              {selectedCourt.name}
            </Text>
            <Text className="mt-0.5 text-[12px] leading-[18px] text-slate-500" numberOfLines={2}>
              {selectedCourt.address}
              {selectedCourt.city ? ` - ${selectedCourt.city}` : ''}
            </Text>
          </View>
        </View>
      ) : null}

      {showPicker ? (
        <>
          <View className="mt-3.5 flex-row items-center gap-3 rounded-[14px] border border-slate-200 bg-slate-50 px-3.5 py-3">
            <Search size={16} color="#94a3b8" />
            <TextInput
              value={keyword}
              onChangeText={setKeyword}
              placeholder="Tìm tên sân hoặc địa chỉ"
              placeholderTextColor="#94a3b8"
              className="flex-1 py-0 text-[14px] text-slate-700"
              returnKeyType="search"
            />
          </View>

          <View className="mt-3 gap-3">
            {loadingCourts ? (
              <View className="items-center justify-center rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-8">
                <ActivityIndicator color={PROFILE_THEME_COLORS.primary} />
                <Text className="mt-3 text-[13px] font-medium text-slate-500">
                  {'Đang tìm sân gần bạn...'}
                </Text>
              </View>
            ) : searching ? (
              <View className="items-center justify-center rounded-[18px] border border-slate-200 bg-slate-50 px-4 py-8">
                <ActivityIndicator color={PROFILE_THEME_COLORS.primary} />
              </View>
            ) : courts.length > 0 ? (
              courts.map((court) => (
                <CourtRow
                  key={court.id}
                  court={court}
                  onPress={(nextCourt) => {
                    onCourtSelect(nextCourt)
                  }}
                />
              ))
            ) : fallbackMode ? null : (
              <View className="items-center justify-center rounded-[18px] border border-dashed border-slate-200 bg-slate-50 px-4 py-8">
                <Text className="text-center text-[13px] leading-[20px] text-slate-500">Không tìm thấy sân nào</Text>
              </View>
            )}
          </View>
        </>
      ) : null}
    </View>
  )
}
