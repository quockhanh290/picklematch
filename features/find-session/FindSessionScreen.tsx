import React, { useMemo } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  View,
} from 'react-native'
import {
  Navigation,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react-native'
import { 
  AppDialog, 
  AppLoading, 
  MainHeader 
} from '@/components/design'
import { AdvancedSessionFilterModal, ADVANCED_FILTER_INITIAL } from '@/components/find-session/AdvancedSessionFilterModal'
import { PROFILE_THEME_COLORS } from '@/constants/profileTheme'
import { SCREEN_FONTS } from '@/constants/typography'
import { RADIUS, SPACING, BORDER } from '@/constants/screenLayout'
import { STRINGS } from '@/constants/strings'

import { useFindSessionController } from './hooks/useFindSessionController'
import { SearchResultCard } from './components/SearchResultCard'
import { SmartQueueBanner } from './components/SmartQueueBanner'
import { withAlpha } from './utils'

export function FindSessionScreen() {
  const {
    loading,
    dialogConfig,
    setDialogConfig,
    refreshing,
    onRefresh,
    query,
    setQuery,
    sortMode,
    setSortMode,
    preferredCourtFilter,
    setPreferredCourtFilter,
    filterModalVisible,
    setFilterModalVisible,
    advancedFilter,
    setAdvancedFilter,
    activeAdvancedFiltersCount,
    playerProfile,
    smartQueueEnabled,
    smartQueueHydrated,
    applySmartQueueFilters,
    handleNearbyFilter,
    filteredSessions,
  } = useFindSessionController()

  const listHeader = useMemo(() => (
    <View>
      <MainHeader
        title={STRINGS.find_session.title}
        subtitle={loading ? STRINGS.common.loading : `${filteredSessions.length} kèo phù hợp`}
        rightElement={
          <Pressable
            onPress={() => void handleNearbyFilter()}
            className="h-14 w-14 items-center justify-center rounded-full"
            style={{
              backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow,
              borderWidth: 1,
              borderColor: PROFILE_THEME_COLORS.outlineVariant,
            }}
          >
            <Navigation size={24} color={PROFILE_THEME_COLORS.primary} strokeWidth={2.4} />
          </Pressable>
        }
      />

      {/* Search bar */}
      {/* Thanh tìm kiếm + Bộ lọc */}
      <View className="flex-row items-center px-5 pt-2 pb-4 gap-3">
        <View
          className="flex-1 flex-row items-center h-14 px-4"
          style={{
            backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow,
            borderRadius: RADIUS.lg,
            borderWidth: 1,
            borderColor: PROFILE_THEME_COLORS.outlineVariant,
          }}
        >
          <Search size={20} color={PROFILE_THEME_COLORS.onSurfaceVariant} strokeWidth={2.4} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={STRINGS.find_session.search_placeholder}
            placeholderTextColor={PROFILE_THEME_COLORS.outline}
            className="flex-1 ml-3"
            style={{
              fontSize: 15,
              fontFamily: SCREEN_FONTS.body,
              color: PROFILE_THEME_COLORS.onSurface,
            }}
          />
          {query.length > 0 ? (
            <Pressable onPress={() => setQuery('')} className="ml-2 p-1">
              <X size={16} color={PROFILE_THEME_COLORS.onSurfaceVariant} strokeWidth={2.4} />
            </Pressable>
          ) : null}
        </View>

        {/* Nút lọc dạng icon */}
        <Pressable
          onPress={() => setFilterModalVisible(true)}
          className="w-14 h-14 items-center justify-center"
          style={{
            backgroundColor: activeAdvancedFiltersCount > 0 ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.surfaceContainerLow,
            borderRadius: RADIUS.lg,
            borderWidth: 1,
            borderColor: activeAdvancedFiltersCount > 0 ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.outlineVariant,
          }}
        >
          <SlidersHorizontal
            size={20}
            color={activeAdvancedFiltersCount > 0 ? PROFILE_THEME_COLORS.onPrimary : PROFILE_THEME_COLORS.onSurfaceVariant}
            strokeWidth={2}
          />
          {activeAdvancedFiltersCount > 0 && (
            <View 
              style={{
                position: 'absolute',
                top: -2,
                right: -2,
                backgroundColor: PROFILE_THEME_COLORS.primary,
                borderRadius: 10,
                minWidth: 18,
                height: 18,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 2,
                borderColor: PROFILE_THEME_COLORS.background,
              }}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 9, fontFamily: SCREEN_FONTS.cta, top: -0.5 }}>
                {activeAdvancedFiltersCount}
              </Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Sắp xếp - Full Width Tab Strip */}
      <View style={{ paddingHorizontal: SPACING.xl, paddingBottom: 16 }}>
        <View
          style={{
            flexDirection: 'row',
            gap: 4,
            padding: 4,
            backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow,
            borderRadius: RADIUS.lg,
            borderWidth: 1,
            borderColor: PROFILE_THEME_COLORS.outlineVariant,
            overflow: 'hidden',
          }}
        >
          <Pressable
            onPress={() => setSortMode('match')}
            className="flex-1 items-center justify-center py-2.5"
            style={{
              backgroundColor: sortMode === 'match' ? PROFILE_THEME_COLORS.primary : 'transparent',
              borderRadius: RADIUS.md,
            }}
          >
            <Text
              style={{
                color: sortMode === 'match' ? PROFILE_THEME_COLORS.onPrimary : PROFILE_THEME_COLORS.onSurfaceVariant,
                fontFamily: SCREEN_FONTS.cta,
                fontSize: 13,
                textTransform: 'uppercase',
                letterSpacing: 0.8,
              }}
            >
              Độ phù hợp
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setSortMode('time')}
            className="flex-1 items-center justify-center py-2.5"
            style={{
              backgroundColor: sortMode === 'time' ? PROFILE_THEME_COLORS.primary : 'transparent',
              borderRadius: RADIUS.md,
            }}
          >
            <Text
              style={{
                color: sortMode === 'time' ? PROFILE_THEME_COLORS.onPrimary : PROFILE_THEME_COLORS.onSurfaceVariant,
                fontFamily: SCREEN_FONTS.cta,
                fontSize: 13,
                textTransform: 'uppercase',
                letterSpacing: 0.8,
              }}
            >
              Giờ chơi
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Preferred court filter banner */}
      {preferredCourtFilter ? (
        <View
          className="mx-5 mb-4 flex-row items-center px-4 py-3"
          style={{
            backgroundColor: PROFILE_THEME_COLORS.secondaryContainer,
            borderRadius: RADIUS.xl,
          }}
        >
          <View className="flex-1 pr-3">
            <Text
              style={{ color: PROFILE_THEME_COLORS.onSecondaryContainer, fontFamily: SCREEN_FONTS.headline, fontSize: 10, letterSpacing: 2.2, textTransform: 'uppercase' }}
            >
              Đang lọc theo sân quen
            </Text>
            <Text
              numberOfLines={1}
              className="mt-1"
              style={{ color: PROFILE_THEME_COLORS.onSecondaryContainer, fontFamily: SCREEN_FONTS.label, fontSize: 13 }}
            >
              {preferredCourtFilter.name ?? 'Sân đã chọn'}
            </Text>
          </View>
          <Pressable
            onPress={() => setPreferredCourtFilter(null)}
            className="flex-row items-center rounded-full px-3 py-2"
            style={{ backgroundColor: withAlpha(PROFILE_THEME_COLORS.onSecondaryContainer, 0.12) }}
          >
            <X size={13} color={PROFILE_THEME_COLORS.onSecondaryContainer} strokeWidth={2.5} />
            <Text
              className="ml-1"
              style={{ color: PROFILE_THEME_COLORS.onSecondaryContainer, fontFamily: SCREEN_FONTS.label, fontSize: 12 }}
            >
              Bỏ lọc
            </Text>
          </Pressable>
        </View>
      ) : null}

      <View style={{ height: 4 }} />
    </View>
  ), [loading, filteredSessions.length, query, activeAdvancedFiltersCount, preferredCourtFilter, sortMode, handleNearbyFilter, setPreferredCourtFilter, setQuery, setSortMode])

  const listFooter = useMemo(() => (
    <SmartQueueBanner 
      smartQueueEnabled={smartQueueEnabled}
      smartQueueHydrated={smartQueueHydrated}
      playerProfile={playerProfile}
      onToggle={applySmartQueueFilters}
      filteredSessionsCount={filteredSessions.length}
      loading={loading}
    />
  ), [loading, filteredSessions.length, smartQueueEnabled, smartQueueHydrated, playerProfile, applySmartQueueFilters])

  return (
    <View className="flex-1" style={{ backgroundColor: PROFILE_THEME_COLORS.background }}>
      {loading ? (
        <View className="flex-1">
          {listHeader}
          <View className="flex-1 items-center justify-center pt-10">
            <ActivityIndicator size="large" color={PROFILE_THEME_COLORS.primary} />
            <Text
              className="mt-4 text-[14px]"
              style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: SCREEN_FONTS.label }}
            >
              Đang săn kèo...
            </Text>
          </View>
        </View>
      ) : (
        <FlatList
          data={filteredSessions}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh} 
              tintColor={PROFILE_THEME_COLORS.primary} 
            />
          }
          ListHeaderComponent={listHeader}
          ListFooterComponent={listFooter}
          renderItem={({ item }) => (
            <View className="px-5 pb-4">
              <SearchResultCard 
                session={item} 
                userLocation={null} // We could pass userLocation from state if needed
              />
            </View>
          )}
        />
      )}

      <AdvancedSessionFilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        filter={advancedFilter}
        setFilter={setAdvancedFilter}
        onApply={() => setFilterModalVisible(false)}
        onReset={() => setAdvancedFilter(ADVANCED_FILTER_INITIAL)}
        districts={['Quận 1', 'Quận 2', 'Quận 3', 'Quận 7', 'Bình Thạnh', 'Thủ Đức']} // Temporary fallback or fetch from API
        skillLevels={[
          { id: 'level_1', label: 'Cơ bản (0 - 1.5)' },
          { id: 'level_2', label: 'Trung bình (1.5 - 3.5)' },
          { id: 'level_3', label: 'Khá/Giỏi (3.5+)' },
        ]}
      />

      <AppDialog config={dialogConfig} onClose={() => setDialogConfig(null)} />
    </View>
  )
}
