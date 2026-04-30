import React, { useCallback, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  Text,
  View,
} from 'react-native'
import {
  ChevronDown,
  ChevronRight,
  SlidersHorizontal,
  X,
} from 'lucide-react-native'
import { router } from 'expo-router'
import { MainHeader } from '@/components/design'
import { PROFILE_THEME_COLORS } from '@/constants/theme/profileTheme'
import { SCREEN_FONTS } from '@/constants/typography'
import { RADIUS, SPACING, BORDER } from '@/constants/screenLayout'
import { MySessionCard, type MySession, type SessionTab } from '@/components/sessions/MySessionCard'
import { MySessionsEmptyState } from '@/components/sessions/MySessionsEmptyState'
import { ExpandingCreateButton } from '@/components/sessions/ExpandingCreateButton'
import { useMySessions, HISTORY_PAGE_SIZE } from '@/hooks/useMySessions'

const TAB_OPTIONS: { key: SessionTab; label: string }[] = [
  { key: 'upcoming', label: 'Sắp đánh' },
  { key: 'pending', label: 'Chờ duyệt' },
  { key: 'history', label: 'Lịch sử' },
]

const HISTORY_STATUS_OPTIONS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'done', label: 'Đã chơi' },
  { id: 'pending_completion', label: 'Chờ chốt' },
  { id: 'cancelled', label: 'Đã hủy' },
]
const HISTORY_ROLE_OPTIONS = [
  { id: 'all', label: 'Mọi vai trò' },
  { id: 'host', label: 'Host' },
  { id: 'player', label: 'Người chơi' },
]
const HISTORY_TIME_OPTIONS = [
  { id: 'all', label: 'Tất cả thời gian' },
  { id: '7d', label: '7 ngày' },
  { id: '30d', label: '30 ngày' },
  { id: '90d', label: '3 tháng' },
]
const HISTORY_RATING_OPTIONS = [
  { id: 'all', label: 'Tất cả đánh giá' },
  { id: 'rated', label: 'Đã đánh giá' },
  { id: 'not_rated', label: 'Chưa đánh giá' },
]
const HISTORY_RESULT_OPTIONS = [
  { id: 'all', label: 'Tất cả kết quả' },
  { id: 'submitted', label: 'Đã nhập kết quả' },
  { id: 'not_submitted', label: 'Chưa nhập kết quả' },
]

type HistorySection = {
  monthKey: string
  monthLabel: string
  items: MySession[]
}

type HistoryRow =
  | { type: 'filters'; key: string }
  | { type: 'month'; key: string; monthKey: string; monthLabel: string; count: number }
  | { type: 'session'; key: string; session: MySession }

function formatDatePart(value: string) {
  const date = new Date(value)
  const weekday = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][date.getDay()]
  const day = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`
  return `${weekday} ${day}`
}

function formatTimeRange(start: string, end: string) {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const startHour = startDate.getHours().toString().padStart(2, '0')
  const startMinute = startDate.getMinutes().toString().padStart(2, '0')
  const endHour = endDate.getHours().toString().padStart(2, '0')
  const endMinute = endDate.getMinutes().toString().padStart(2, '0')
  return `${startHour}:${startMinute} - ${endHour}:${endMinute}`
}

function getMonthKey(value: string) {
  const date = new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

function formatMonthLabel(monthKey: string) {
  const [year, month] = monthKey.split('-')
  return `Tháng ${month}/${year}`
}

export default function MySessions() {
  const {
    userId,
    loading,
    refreshing,
    onRefresh,
    activeTab,
    setActiveTab,
    sessionsByTab,
    filteredHistorySessions,
    historyStatusFilter,
    setHistoryStatusFilter,
    historyRoleFilter,
    setHistoryRoleFilter,
    historyTimeFilter,
    setHistoryTimeFilter,
    historyRatingFilter,
    setHistoryRatingFilter,
    historyResultFilter,
    setHistoryResultFilter,
    historyVisibleCount,
    setHistoryVisibleCount,
    historyExpandedMonths,
    setHistoryExpandedMonths,
  } = useMySessions()

  const [historyFilterModalVisible, setHistoryFilterModalVisible] = useState(false)

  const visibleHistorySessions = useMemo(
    () => filteredHistorySessions.slice(0, historyVisibleCount),
    [filteredHistorySessions, historyVisibleCount],
  )

  const historySections = useMemo<HistorySection[]>(() => {
    const map = new Map<string, HistorySection>()
    for (const session of visibleHistorySessions) {
      const monthKey = getMonthKey(session.start_time)
      const existing = map.get(monthKey)
      if (existing) {
        existing.items.push(session)
      } else {
        map.set(monthKey, {
          monthKey,
          monthLabel: formatMonthLabel(monthKey),
          items: [session],
        })
      }
    }
    return Array.from(map.values())
  }, [visibleHistorySessions])

  const historyRows = useMemo<HistoryRow[]>(() => {
    const rows: HistoryRow[] = [{ type: 'filters', key: 'history-filters' }]
    historySections.forEach((section) => {
      rows.push({
        type: 'month',
        key: `month-${section.monthKey}`,
        monthKey: section.monthKey,
        monthLabel: section.monthLabel,
        count: section.items.length,
      })

      if (historyExpandedMonths[section.monthKey]) {
        section.items.forEach((session) => {
          rows.push({
            type: 'session',
            key: `session-${section.monthKey}-${session.id}`,
            session,
          })
        })
      }
    })
    return rows
  }, [historyExpandedMonths, historySections])

  const listData = activeTab === 'history' ? historyRows : sessionsByTab[activeTab]
  const canLoadMoreHistory = historyVisibleCount < filteredHistorySessions.length
  const isHistoryTab = activeTab === 'history'
  
  const activeHistoryFiltersCount = useMemo(
    () =>
      [
        historyStatusFilter !== 'all',
        historyRoleFilter !== 'all',
        historyTimeFilter !== 'all',
        historyRatingFilter !== 'all',
        historyResultFilter !== 'all',
      ].filter(Boolean).length,
    [historyRatingFilter, historyResultFilter, historyRoleFilter, historyStatusFilter, historyTimeFilter],
  )

  const monthTotalsByKey = useMemo(() => {
    const totals: Record<string, number> = {}
    filteredHistorySessions.forEach((session) => {
      const monthKey = getMonthKey(session.start_time)
      totals[monthKey] = (totals[monthKey] ?? 0) + 1
    })
    return totals
  }, [filteredHistorySessions])

  const loadMoreHistory = useCallback(() => {
    if (!isHistoryTab || !canLoadMoreHistory) return
    setHistoryVisibleCount((prev) => Math.min(prev + HISTORY_PAGE_SIZE, filteredHistorySessions.length))
  }, [canLoadMoreHistory, filteredHistorySessions.length, isHistoryTab, setHistoryVisibleCount])

  const toggleMonthExpanded = useCallback((monthKey: string) => {
    setHistoryExpandedMonths((prev) => ({
      ...prev,
      [monthKey]: !prev[monthKey],
    }))
  }, [setHistoryExpandedMonths])

  async function handleShare(session?: MySession) {
    const message = session 
      ? [
          'Cùng xem kèo pickleball này nhé:',
          session.court_name,
          `${formatDatePart(session.start_time)} · ${formatTimeRange(session.start_time, session.end_time)}`,
          session.court_address ? `${session.court_address}${session.court_city ? `, ${session.court_city}` : ''}` : '',
        ].filter(Boolean).join('\n')
      : 'Lịch chơi PickleMatch của tôi đang được cập nhật.'

    try {
      await Share.share({ message })
    } catch (error) {
      console.warn('[MySessions] share failed:', error)
    }
  }

  const renderHistoryFilterChip = (
    id: string,
    label: string,
    isActive: boolean,
    onPress: () => void,
  ) => (
    <Pressable
      key={id}
      onPress={onPress}
      className="rounded-full px-4 py-2.5 mr-2 mb-2"
      style={{
        backgroundColor: isActive ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.surfaceContainerLow,
        borderWidth: BORDER.base,
        borderColor: isActive ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.outlineVariant,
      }}
    >
      <Text
        style={{
          color: isActive ? PROFILE_THEME_COLORS.onPrimary : PROFILE_THEME_COLORS.onSurfaceVariant,
          fontFamily: SCREEN_FONTS.label,
          fontSize: 12,
        }}
      >
        {label}
      </Text>
    </Pressable>
  )

  const activeTabCount = isHistoryTab ? filteredHistorySessions.length : sessionsByTab[activeTab].length

  return (
    <View className="flex-1" style={{ backgroundColor: PROFILE_THEME_COLORS.background }}>
      {loading ? (
        <View className="flex-1 items-center justify-center px-6">
          <ActivityIndicator size="large" color={PROFILE_THEME_COLORS.primary} />
          <Text
            className="mt-4 text-[14px]"
            style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: SCREEN_FONTS.label }}
          >
            Đang tải kèo của bạn...
          </Text>
        </View>
      ) : (
        <View className="flex-1">
          <FlatList
            data={listData}
            keyExtractor={(item) => ('type' in item ? `${activeTab}-${item.key}` : `${activeTab}-${item.id}`)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: SPACING.xl, paddingTop: 0, paddingBottom: 160 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={PROFILE_THEME_COLORS.primary} />}
            stickyHeaderIndices={isHistoryTab ? [1] : undefined}
            onEndReached={loadMoreHistory}
            onEndReachedThreshold={0.25}
            ListHeaderComponent={
              <View className="mb-2">
                <MainHeader
                  title="Kèo của tôi"
                  subtitle={activeTab === 'history' ? `${activeTabCount} trận đã lưu` : `${activeTabCount} kèo đang xử lý`}
                  rightElement={<ExpandingCreateButton />}
                  style={{ paddingHorizontal: 0 }}
                />

                <View
                  className="p-1 flex-row gap-1"
                  style={{
                    backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow,
                    borderRadius: RADIUS.lg,
                    borderWidth: 1,
                    borderColor: PROFILE_THEME_COLORS.outlineVariant,
                  }}
                >
                  {TAB_OPTIONS.map((tab) => {
                    const active = tab.key === activeTab
                    return (
                      <Pressable
                        key={tab.key}
                        onPress={() => setActiveTab(tab.key)}
                        className="flex-1 rounded-[12px] py-2.5 items-center justify-center"
                        style={active ? {
                          backgroundColor: PROFILE_THEME_COLORS.primary,
                        } : undefined}
                      >
                        <Text
                          style={{
                            color: active ? PROFILE_THEME_COLORS.onPrimary : PROFILE_THEME_COLORS.onSurfaceVariant,
                            fontFamily: SCREEN_FONTS.cta,
                            fontSize: 13,
                            textTransform: 'uppercase',
                            letterSpacing: 0.8,
                          }}
                        >
                          {tab.label}
                        </Text>
                      </Pressable>
                    )
                  })}
                </View>
                <View className={isHistoryTab ? 'pt-2' : 'pt-3'} />
              </View>
            }
            ListFooterComponent={
              isHistoryTab && canLoadMoreHistory ? (
                <View className="py-6 items-center">
                  <ActivityIndicator size="small" color={PROFILE_THEME_COLORS.primary} />
                </View>
              ) : null
            }
            ListEmptyComponent={<MySessionsEmptyState activeTab={activeTab} />}
            renderItem={({ item }) => {
              if (isHistoryTab && 'type' in item) {
                if (item.type === 'filters') {
                  return (
                    <View
                      className="pt-1 pb-1"
                      style={{ backgroundColor: PROFILE_THEME_COLORS.background, marginHorizontal: -20, paddingHorizontal: SPACING.xl }}
                    >
                      <Pressable
                        onPress={() => setHistoryFilterModalVisible(true)}
                        className="flex-row items-center self-start rounded-full px-4 py-2.5"
                        style={{
                          backgroundColor: activeHistoryFiltersCount > 0 ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.surfaceContainerLow,
                          borderWidth: BORDER.base,
                          borderColor: activeHistoryFiltersCount > 0 ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.outlineVariant,
                        }}
                      >
                        <SlidersHorizontal
                          size={13}
                          color={activeHistoryFiltersCount > 0 ? PROFILE_THEME_COLORS.onPrimary : PROFILE_THEME_COLORS.onSurfaceVariant}
                          strokeWidth={2.5}
                        />
                        <Text
                          className="ml-1.5"
                          style={{
                            color: activeHistoryFiltersCount > 0 ? PROFILE_THEME_COLORS.onPrimary : PROFILE_THEME_COLORS.onSurfaceVariant,
                            fontFamily: SCREEN_FONTS.cta,
                            fontSize: 12,
                          }}
                        >
                          {activeHistoryFiltersCount > 0 ? `Bộ lọc lịch sử (${activeHistoryFiltersCount})` : 'Bộ lọc lịch sử'}
                        </Text>
                      </Pressable>
                    </View>
                  )
                }

                if (item.type === 'month') {
                  const isExpanded = historyExpandedMonths[item.monthKey]
                  const monthTotal = monthTotalsByKey[item.monthKey] ?? item.count
                  return (
                    <Pressable
                      onPress={() => toggleMonthExpanded(item.monthKey)}
                      className="mt-4 mb-3 flex-row items-center"
                    >
                      <View className="flex-row items-center pr-3">
                        {isExpanded ? (
                          <ChevronDown size={14} color={PROFILE_THEME_COLORS.onSurfaceVariant} strokeWidth={2.4} />
                        ) : (
                          <ChevronRight size={14} color={PROFILE_THEME_COLORS.onSurfaceVariant} strokeWidth={2.4} />
                        )}
                        <Text
                          className="ml-2 text-[11px] uppercase tracking-[2px]"
                          style={{
                            color: PROFILE_THEME_COLORS.outline,
                            fontFamily: SCREEN_FONTS.cta,
                          }}
                        >
                          {item.monthLabel}
                        </Text>
                      </View>
                      <View className="h-px flex-1" style={{ backgroundColor: PROFILE_THEME_COLORS.outlineVariant }} />
                      <Text
                        className="pl-3 text-[11px] uppercase tracking-[2px]"
                        style={{
                          color: PROFILE_THEME_COLORS.outline,
                          fontFamily: SCREEN_FONTS.cta,
                        }}
                      >
                        {monthTotal} trận
                      </Text>
                    </Pressable>
                  )
                }

                if (item.type === 'session') {
                  return (
                    <MySessionCard
                      item={item.session}
                      tab={activeTab}
                      onOpenSessionDetail={(id) => router.push({ pathname: '/session/[id]', params: { id } } as any)}
                      onOpenRateSession={(id) => router.push({ pathname: '/rate-session/[id]', params: { id } } as any)}
                      onShare={handleShare}
                      formatTimeRange={formatTimeRange}
                    />
                  )
                }
              }

              return (
                <MySessionCard
                  item={item as MySession}
                  tab={activeTab}
                  onOpenSessionDetail={(id) => router.push({ pathname: '/session/[id]', params: { id } } as any)}
                  onOpenRateSession={(id) => router.push({ pathname: '/rate-session/[id]', params: { id } } as any)}
                  onShare={handleShare}
                  formatTimeRange={formatTimeRange}
                />
              )
            }}
          />

          <Modal
            visible={historyFilterModalVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setHistoryFilterModalVisible(false)}
          >
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
              <Pressable style={{ flex: 1 }} onPress={() => setHistoryFilterModalVisible(false)} />
              <View
                style={{
                  backgroundColor: PROFILE_THEME_COLORS.background,
                  borderTopLeftRadius: 28,
                  borderTopRightRadius: 28,
                  borderTopWidth: 1,
                  borderColor: PROFILE_THEME_COLORS.outlineVariant,
                  paddingHorizontal: 20,
                  paddingTop: 20,
                  paddingBottom: 32,
                  maxHeight: '90%',
                  shadowColor: '#000',
                  shadowOpacity: 0.15,
                  shadowRadius: 24,
                  shadowOffset: { width: 0, height: -8 },
                  elevation: 12,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <Text
                    style={{
                      color: PROFILE_THEME_COLORS.primary,
                      fontFamily: SCREEN_FONTS.headline,
                      fontSize: 24,
                      textTransform: 'uppercase',
                    }}
                  >
                    Bộ lọc lịch sử
                  </Text>
                  <Pressable
                    onPress={() => setHistoryFilterModalVisible(false)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <X size={16} color={PROFILE_THEME_COLORS.onSurfaceVariant} strokeWidth={2.6} />
                  </Pressable>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                  <Text
                    style={{
                      color: PROFILE_THEME_COLORS.primary,
                      fontFamily: SCREEN_FONTS.headline,
                      fontSize: 14,
                      textTransform: 'uppercase',
                      marginBottom: 10,
                    }}
                  >
                    Trạng thái
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 2, marginBottom: 16 }}>
                    {HISTORY_STATUS_OPTIONS.map((option) =>
                      renderHistoryFilterChip(
                        `status-${option.id}`,
                        option.label,
                        historyStatusFilter === option.id,
                        () => setHistoryStatusFilter(option.id as any),
                      ),
                    )}
                  </View>

                  <Text
                    style={{
                      color: PROFILE_THEME_COLORS.primary,
                      fontFamily: SCREEN_FONTS.headline,
                      fontSize: 14,
                      textTransform: 'uppercase',
                      marginBottom: 10,
                    }}
                  >
                    Vai trò
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 2, marginBottom: 16 }}>
                    {HISTORY_ROLE_OPTIONS.map((option) =>
                      renderHistoryFilterChip(
                        `role-${option.id}`,
                        option.label,
                        historyRoleFilter === option.id,
                        () => setHistoryRoleFilter(option.id as any),
                      ),
                    )}
                  </View>

                  <Text
                    style={{
                      color: PROFILE_THEME_COLORS.primary,
                      fontFamily: SCREEN_FONTS.headline,
                      fontSize: 14,
                      textTransform: 'uppercase',
                      marginBottom: 10,
                    }}
                  >
                    Thời gian
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 2, marginBottom: 16 }}>
                    {HISTORY_TIME_OPTIONS.map((option) =>
                      renderHistoryFilterChip(
                        `time-${option.id}`,
                        option.label,
                        historyTimeFilter === option.id,
                        () => setHistoryTimeFilter(option.id as any),
                      ),
                    )}
                  </View>

                  <Text
                    style={{
                      color: PROFILE_THEME_COLORS.primary,
                      fontFamily: SCREEN_FONTS.headline,
                      fontSize: 14,
                      textTransform: 'uppercase',
                      marginBottom: 10,
                    }}
                  >
                    Đánh giá
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 2, marginBottom: 16 }}>
                    {HISTORY_RATING_OPTIONS.map((option) =>
                      renderHistoryFilterChip(
                        `rating-${option.id}`,
                        option.label,
                        historyRatingFilter === option.id,
                        () => setHistoryRatingFilter(option.id as any),
                      ),
                    )}
                  </View>

                  <Text
                    style={{
                      color: PROFILE_THEME_COLORS.primary,
                      fontFamily: SCREEN_FONTS.headline,
                      fontSize: 14,
                      textTransform: 'uppercase',
                      marginBottom: 10,
                    }}
                  >
                    Kết quả
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 2, marginBottom: 24 }}>
                    {HISTORY_RESULT_OPTIONS.map((option) =>
                      renderHistoryFilterChip(
                        `result-${option.id}`,
                        option.label,
                        historyResultFilter === option.id,
                        () => setHistoryResultFilter(option.id as any),
                      ),
                    )}
                  </View>
                </ScrollView>

                <Pressable
                  onPress={() => setHistoryFilterModalVisible(false)}
                  style={({ pressed }) => ({
                    height: 52,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: RADIUS.full,
                    backgroundColor: PROFILE_THEME_COLORS.primary,
                    opacity: pressed ? 0.9 : 1,
                  })}
                >
                  <Text style={{ color: PROFILE_THEME_COLORS.onPrimary, fontFamily: SCREEN_FONTS.headline, fontSize: 16, textTransform: 'uppercase' }}>
                    Áp dụng bộ lọc
                  </Text>
                </Pressable>
              </View>
            </View>
          </Modal>
        </View>
      )}
    </View>
  )
}
