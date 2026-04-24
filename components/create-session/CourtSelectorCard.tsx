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
  const statusTone = isOpen
    ? {
        border: PROFILE_THEME_COLORS.secondaryFixedDim,
        bg: PROFILE_THEME_COLORS.primaryFixed,
        text: PROFILE_THEME_COLORS.onPrimaryFixedVariant,
      }
    : {
        border: PROFILE_THEME_COLORS.error,
        bg: PROFILE_THEME_COLORS.errorContainer,
        text: PROFILE_THEME_COLORS.onErrorContainer,
      }

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      className="rounded-[18px] border p-3.5"
      style={{ borderColor: PROFILE_THEME_COLORS.outlineVariant, backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest }}
      onPress={() => onPress(court)}
    >
      <View className="flex-row items-start gap-3">
        <View
          className="h-11 w-11 items-center justify-center rounded-[14px]"
          style={{ backgroundColor: PROFILE_THEME_COLORS.primaryFixed }}
        >
          <MapPin size={18} color={PROFILE_THEME_COLORS.surfaceTint} />
        </View>
        <View className="flex-1">
          <View className="flex-row items-start justify-between gap-3">
            <Text className="flex-1 text-[15px] font-black" style={{ color: PROFILE_THEME_COLORS.onSurface }} numberOfLines={1}>
              {court.name}
            </Text>
            {distanceLabel ? <Text className="text-[11px] font-bold" style={{ color: PROFILE_THEME_COLORS.outline }}>{distanceLabel}</Text> : null}
          </View>
          <Text className="mt-1 text-[12px] leading-[18px]" style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant }} numberOfLines={2}>
            {court.address}
            {court.city ? ` - ${court.city}` : ''}
          </Text>
          <View className="mt-2 flex-row items-center gap-2">
            <View
              className="rounded-full border px-2.5 py-1"
              style={{ borderColor: statusTone.border, backgroundColor: statusTone.bg }}
            >
              <Text className="text-[10px] font-bold uppercase tracking-[0.8px]" style={{ color: statusTone.text }}>
                {isOpen ? 'Đang mở' : 'Đã đóng'}
              </Text>
            </View>
            {(court.hours_open || court.hours_close) ? (
              <Text className="text-[11px] font-medium" style={{ color: PROFILE_THEME_COLORS.outline }}>
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
    <View
      className="rounded-[20px] border p-4"
      style={{ borderColor: PROFILE_THEME_COLORS.outlineVariant, backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest }}
    >
      <View className="flex-row items-center justify-between">
        <Text className="text-[14px] font-extrabold" style={{ color: PROFILE_THEME_COLORS.onSurface }}>{title}</Text>
        {selectedCourt ? (
          <TouchableOpacity onPress={onChangeCourt}>
            <Text className="text-[12px] font-bold" style={{ color: PROFILE_THEME_COLORS.primary }}>
              {showPicker ? 'Đóng chọn sân' : 'Đổi sân'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {selectedCourt ? (
        <View
          className="mt-3.5 flex-row items-center gap-3.5 rounded-[14px] border p-3.5"
          style={{ borderColor: PROFILE_THEME_COLORS.outlineVariant, backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow }}
        >
          <View className="h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: PROFILE_THEME_COLORS.primaryFixed }}>
            <MapPin size={18} color={PROFILE_THEME_COLORS.surfaceTint} />
          </View>
          <View className="flex-1">
            <Text className="text-[15px] font-black" style={{ color: PROFILE_THEME_COLORS.onSurface }} numberOfLines={1}>
              {selectedCourt.name}
            </Text>
            <Text className="mt-0.5 text-[12px] leading-[18px]" style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant }} numberOfLines={2}>
              {selectedCourt.address}
              {selectedCourt.city ? ` - ${selectedCourt.city}` : ''}
            </Text>
          </View>
        </View>
      ) : null}

      {showPicker ? (
        <>
          <View
            className="mt-3.5 flex-row items-center gap-3 rounded-[14px] border px-3.5 py-3"
            style={{ borderColor: PROFILE_THEME_COLORS.outlineVariant, backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow }}
          >
            <Search size={16} color={PROFILE_THEME_COLORS.outline} />
            <TextInput
              value={keyword}
              onChangeText={setKeyword}
              placeholder="Tìm tên sân hoặc địa chỉ"
              placeholderTextColor={PROFILE_THEME_COLORS.outline}
              className="flex-1 py-0 text-[14px]"
              style={{ color: PROFILE_THEME_COLORS.onSurface }}
              returnKeyType="search"
            />
          </View>

          <View className="mt-3 gap-3">
            {loadingCourts ? (
              <View
                className="items-center justify-center rounded-[18px] border px-4 py-8"
                style={{ borderColor: PROFILE_THEME_COLORS.outlineVariant, backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow }}
              >
                <ActivityIndicator color={PROFILE_THEME_COLORS.primary} />
                <Text className="mt-3 text-[13px] font-medium" style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant }}>
                  {'Đang tìm sân gần bạn...'}
                </Text>
              </View>
            ) : searching ? (
              <View
                className="items-center justify-center rounded-[18px] border px-4 py-8"
                style={{ borderColor: PROFILE_THEME_COLORS.outlineVariant, backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow }}
              >
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
              <View
                className="items-center justify-center rounded-[18px] border border-dashed px-4 py-8"
                style={{ borderColor: PROFILE_THEME_COLORS.outlineVariant, backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow }}
              >
                <Text className="text-center text-[13px] leading-[20px]" style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant }}>
                  Không tìm thấy sân nào
                </Text>
              </View>
            )}
          </View>
        </>
      ) : null}
    </View>
  )
}


