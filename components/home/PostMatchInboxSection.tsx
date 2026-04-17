import { router } from 'expo-router'
import { AlertTriangle, BookmarkCheck, CheckCheck, Clock3, LayoutList } from 'lucide-react-native'
import { useMemo, useRef, useState } from 'react'
import { Dimensions, Pressable, ScrollView, Text, View } from 'react-native'

import { PROFILE_THEME_COLORS } from '@/components/profile/profileTheme'
import type { PendingMatch, PostMatchAction } from '@/lib/homeFeed'

type InboxItem = {
  key: string
  id: string
  courtName: string
  timeLabel: string
  kind: 'confirm' | 'submit' | 'report'
}

function buildInboxItems(pendingMatches: PendingMatch[], postMatchActions: PostMatchAction[]): InboxItem[] {
  const itemsFromPending: InboxItem[] = pendingMatches.map((item) => ({
    key: `submit-${item.id}`,
    id: item.id,
    courtName: item.courtName,
    timeLabel: item.timeLabel,
    kind: 'submit',
  }))

  const itemsFromActions: InboxItem[] = postMatchActions.map((item) => ({
    key: `${item.actionType}-${item.id}`,
    id: item.id,
    courtName: item.courtName,
    timeLabel: item.timeLabel,
    kind: item.actionType === 'confirm' ? 'confirm' : 'report',
  }))

  const priority: Record<InboxItem['kind'], number> = {
    confirm: 0,
    submit: 1,
    report: 2,
  }

  return [...itemsFromActions, ...itemsFromPending].sort((left, right) => priority[left.kind] - priority[right.kind])
}

function itemPresentation(kind: InboxItem['kind']) {
  if (kind === 'confirm') {
    return {
      Icon: CheckCheck,
      cta: 'Xác nhận ngay',
      onPress: (id: string) => router.push({ pathname: '/session/[id]/confirm-result' as never, params: { id } }),
    }
  }

  if (kind === 'submit') {
    return {
      Icon: LayoutList,
      cta: 'Nhập ngay',
      onPress: (id: string) => router.push({ pathname: '/match-result/[id]' as never, params: { id } }),
    }
  }

  return {
    Icon: AlertTriangle,
    cta: 'Báo ngay',
    onPress: (id: string) => router.push({ pathname: '/session/[id]/confirm-result' as never, params: { id } }),
  }
}

function kindUrgencyPalette(kind: InboxItem['kind']) {
  if (kind === 'report') {
    return {
      cardBg: '#fff3f1',
      borderColor: '#f2b8b2',
      accent: PROFILE_THEME_COLORS.error,
      iconBg: PROFILE_THEME_COLORS.errorContainer,
      iconColor: PROFILE_THEME_COLORS.error,
      courtNameColor: PROFILE_THEME_COLORS.onErrorContainer,
      metaColor: PROFILE_THEME_COLORS.onErrorContainer,
      chipBg: PROFILE_THEME_COLORS.errorContainer,
      chipText: PROFILE_THEME_COLORS.onErrorContainer,
      actionBg: PROFILE_THEME_COLORS.error,
      actionText: PROFILE_THEME_COLORS.onError,
    }
  }

  if (kind === 'submit') {
    return {
      cardBg: '#fff8ec',
      borderColor: '#f6cf99',
      accent: '#d97706',
      iconBg: '#ffe6bf',
      iconColor: '#d97706',
      courtNameColor: '#9a3412',
      metaColor: '#b45309',
      chipBg: '#ffe6bf',
      chipText: '#9a3412',
      actionBg: '#d97706',
      actionText: '#ffffff',
    }
  }

  return {
    cardBg: PROFILE_THEME_COLORS.surfaceContainerLow,
    borderColor: PROFILE_THEME_COLORS.outlineVariant,
    accent: PROFILE_THEME_COLORS.primary,
    iconBg: PROFILE_THEME_COLORS.secondaryContainer,
    iconColor: PROFILE_THEME_COLORS.primary,
    courtNameColor: PROFILE_THEME_COLORS.primary,
    metaColor: PROFILE_THEME_COLORS.onSurfaceVariant,
    chipBg: PROFILE_THEME_COLORS.secondaryContainer,
    chipText: PROFILE_THEME_COLORS.primary,
    actionBg: PROFILE_THEME_COLORS.primary,
    actionText: PROFILE_THEME_COLORS.onPrimary,
  }
}

function chipLabelForKind(kind: InboxItem['kind']) {
  if (kind === 'confirm') return 'Chờ xác nhận'
  if (kind === 'submit') return 'Cần nhập'
  return 'Có thể báo trận'
}

const screenWidth = Dimensions.get('window').width
// section width = screenWidth minus parent paddingHorizontal (20 each side)
const SECTION_WIDTH = screenWidth - 40

export function PostMatchInboxSection({ pendingMatches, postMatchActions }: { pendingMatches: PendingMatch[]; postMatchActions: PostMatchAction[] }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const scrollRef = useRef<ScrollView>(null)

  const inboxItems = useMemo(() => buildInboxItems(pendingMatches, postMatchActions), [pendingMatches, postMatchActions])

  if (inboxItems.length === 0) return null

  return (
    <View className="mt-6">
      {/* Header — outside card, matching carousel section style */}
      <View className="mb-5 flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="mb-3 text-[11px] uppercase tracking-[0.16em]" style={{ color: PROFILE_THEME_COLORS.outline, fontFamily: 'PlusJakartaSans-Bold' }}>
            Sau trận
          </Text>
          <Text
            className="text-[24px]"
            style={{ color: PROFILE_THEME_COLORS.onBackground, fontFamily: 'PlusJakartaSans-ExtraBold', lineHeight: 32 }}
          >
            Việc cần chốt
          </Text>
        </View>
        <View className="mt-1 rounded-full px-3 py-1.5" style={{ backgroundColor: PROFILE_THEME_COLORS.surfaceContainer }}>
          <Text className="text-[11px] uppercase" style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: 'PlusJakartaSans-Bold' }}>
            {activeIndex + 1} / {inboxItems.length}
          </Text>
        </View>
      </View>

      {/* Carousel */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        disableIntervalMomentum
        contentContainerStyle={{ paddingTop: 0, paddingBottom: 0 }}
        onScroll={(event) => {
          const offsetX = event.nativeEvent.contentOffset.x
          const next = Math.round(offsetX / SECTION_WIDTH)
          setActiveIndex(Math.max(0, Math.min(next, inboxItems.length - 1)))
        }}
        scrollEventThrottle={16}
      >
        {inboxItems.map((item) => {
          const presentation = itemPresentation(item.kind)
          const { Icon, cta, onPress } = presentation
          const urgency = kindUrgencyPalette(item.kind)

          return (
            // page wrapper = section width so pagingEnabled snaps correctly
            <View key={item.key} style={{ width: SECTION_WIDTH }}>
              <View
                className="relative overflow-hidden rounded-[24px] border px-4 py-3.5"
                style={{ backgroundColor: urgency.cardBg, borderColor: urgency.borderColor }}
            >
              <View className="absolute bottom-0 left-0 top-0 w-1.5" style={{ backgroundColor: urgency.accent }} />

              <View className="mb-2 flex-row flex-wrap items-center justify-between gap-x-3 gap-y-2">
                <View className="min-w-0 flex-1 flex-row items-center pr-2">
                  <View className="h-8 w-8 items-center justify-center rounded-full" style={{ backgroundColor: urgency.iconBg }}>
                    <Icon size={15} color={urgency.iconColor} strokeWidth={2.4} />
                  </View>
                  <View className="ml-2.5 rounded-full px-2.5 py-1" style={{ backgroundColor: urgency.chipBg }}>
                    <Text className="text-[10px] uppercase tracking-[0.1em]" numberOfLines={1} style={{ color: urgency.chipText, fontFamily: 'PlusJakartaSans-Bold' }}>
                      {chipLabelForKind(item.kind)}
                    </Text>
                  </View>
                </View>

                <Pressable onPress={() => onPress(item.id)} className="shrink-0 self-start rounded-full px-3 py-1.5" style={{ backgroundColor: urgency.actionBg }}>
                  <Text className="text-[10px] uppercase tracking-[0.08em]" style={{ color: urgency.actionText, fontFamily: 'PlusJakartaSans-ExtraBold' }}>
                    {cta}
                  </Text>
                </Pressable>
              </View>

              <View className="mt-1.5 flex-row flex-wrap items-center justify-between gap-x-3 gap-y-2">
                <Text
                  className="flex-1 text-[15px]"
                  numberOfLines={1}
                  style={{ color: urgency.courtNameColor, fontFamily: 'PlusJakartaSans-Bold' }}
                >
                  {item.courtName}
                </Text>
                <View className="min-w-0 flex-row items-center">
                  {item.timeLabel.startsWith('Kết thúc') ? (
                    <BookmarkCheck size={13} color={urgency.metaColor} strokeWidth={2.4} />
                  ) : (
                    <Clock3 size={13} color={urgency.metaColor} strokeWidth={2.4} />
                  )}
                  <Text className="ml-1 text-[11px]" numberOfLines={1} style={{ color: urgency.metaColor, fontFamily: 'PlusJakartaSans-SemiBold' }}>
                    {item.timeLabel.startsWith('Kết thúc')
                      ? item.timeLabel.replace('Kết thúc ', '')
                      : item.timeLabel}
                  </Text>
                </View>
              </View>
            </View>
            </View>
          )
        })}
      </ScrollView>

      {/* Dots */}
      {inboxItems.length > 1 ? (
        <View className="mt-5 flex-row items-center justify-center gap-2 px-5">
          {inboxItems.map((_, index) => (
            <View
              key={index}
              className="h-2 rounded-full"
              style={{
                width: index === activeIndex ? 24 : 8,
                backgroundColor: index === activeIndex ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.outlineVariant,
              }}
            />
          ))}
        </View>
      ) : null}
    </View>
  )
}
