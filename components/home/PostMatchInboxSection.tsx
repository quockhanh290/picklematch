import { router } from 'expo-router'
import { useMemo } from 'react'
import { Pressable, Text, View } from 'react-native'

import { PROFILE_THEME_COLORS, PROFILE_THEME_SEMANTIC } from '@/components/profile/profileTheme'
import { RADIUS, SHADOW, SPACING, BORDER } from '@/constants/screenLayout'
import { SCREEN_FONTS } from '@/constants/screenFonts'
import type { PendingMatch, PostMatchAction } from '@/lib/homeFeed'
import { formatTimeRange } from '@/utils/formatters'

type InboxItem = {
  key: string
  id: string
  courtName: string
  timeLabel: string
  startTime?: string
  endTime?: string
  deadlineAt?: string
  kind: 'confirm' | 'submit' | 'report'
}

const DAY_LABELS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
const DAY_MS = 24 * 60 * 60 * 1000

function deadlineFromEndTime(endTime?: string) {
  const endMs = Date.parse(endTime ?? '')
  if (Number.isNaN(endMs)) return undefined
  return new Date(endMs + DAY_MS).toISOString()
}

function buildInboxItems(pendingMatches: PendingMatch[], postMatchActions: PostMatchAction[]): InboxItem[] {
  const itemsFromPending: InboxItem[] = pendingMatches.map((item) => ({
    key: `submit-${item.id}`,
    id: item.id,
    courtName: item.courtName,
    timeLabel: item.timeLabel,
    startTime: item.startTime,
    endTime: item.endTime,
    deadlineAt: deadlineFromEndTime(item.endTime),
    kind: 'submit',
  }))

  const itemsFromActions: InboxItem[] = postMatchActions.map((item) => ({
    key: `${item.actionType}-${item.id}`,
    id: item.id,
    courtName: item.courtName,
    timeLabel: item.timeLabel,
    startTime: item.startTime,
    endTime: item.endTime,
    deadlineAt: deadlineFromEndTime(item.endTime),
    kind: item.actionType === 'confirm' ? 'confirm' : 'report',
  }))

  const priority: Record<InboxItem['kind'], number> = {
    submit: 0,
    confirm: 1,
    report: 2,
  }

  return [...itemsFromActions, ...itemsFromPending].sort((left, right) => {
    const leftDeadline = Date.parse(left.deadlineAt ?? '')
    const rightDeadline = Date.parse(right.deadlineAt ?? '')

    if (!Number.isNaN(leftDeadline) && !Number.isNaN(rightDeadline) && leftDeadline !== rightDeadline) {
      return leftDeadline - rightDeadline
    }

    return priority[left.kind] - priority[right.kind]
  })
}

function itemPresentation(kind: InboxItem['kind']) {
  if (kind === 'confirm') {
    return {
      chip: 'CẦN XÁC NHẬN',
      cta: 'Xác nhận',
      onPress: (id: string) => router.push({ pathname: '/session/[id]/confirm-result' as never, params: { id } }),
    }
  }

  if (kind === 'submit') {
    return {
      chip: 'CẦN NHẬP KẾT QUẢ',
      cta: 'Nhập ngay',
      onPress: (id: string) => router.push({ pathname: '/match-result/[id]' as never, params: { id } }),
    }
  }

  return {
    chip: 'CẦN ĐÁNH GIÁ',
    cta: 'Đánh giá',
    onPress: (id: string) => router.push({ pathname: '/session/[id]/confirm-result' as never, params: { id } }),
  }
}

function formatMatchMeta(item: InboxItem) {
  const start = new Date(item.startTime ?? '')
  const end = new Date(item.endTime ?? '')

  if (!Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
    const dateLabel = `${DAY_LABELS[start.getDay()]}, ${String(start.getDate()).padStart(2, '0')}/${String(start.getMonth() + 1).padStart(2, '0')}`
    return `${dateLabel} · ${formatTimeRange(start, end).replace('–', ' – ')}`
  }

  return item.timeLabel.replace(/^Kết thúc\s+/i, '')
}

function getDeadlineInfo(deadlineAt?: string) {
  const deadlineMs = Date.parse(deadlineAt ?? '')
  if (Number.isNaN(deadlineMs)) {
    return {
      dotColor: PROFILE_THEME_SEMANTIC.warningStrong,
      textColor: PROFILE_THEME_SEMANTIC.warningText,
      label: 'Hạn nhập: đang chờ',
    }
  }

  const diffMs = deadlineMs - Date.now()
  const absMinutes = Math.max(1, Math.ceil(Math.abs(diffMs) / (60 * 1000)))
  const hours = Math.floor(absMinutes / 60)
  const minutes = absMinutes % 60

  if (diffMs < 0) {
    const overdue = hours >= 1 ? `${hours} tiếng` : `${absMinutes} phút`
    return {
      dotColor: PROFILE_THEME_SEMANTIC.dangerStrong,
      textColor: PROFILE_THEME_SEMANTIC.dangerText,
      label: `Quá hạn ${overdue}`,
    }
  }

  const remaining = hours >= 1 ? `${hours} tiếng` : `${minutes || absMinutes} phút`
  return {
    dotColor: PROFILE_THEME_SEMANTIC.warningStrong,
    textColor: PROFILE_THEME_SEMANTIC.warningText,
    label: `Hạn nhập: còn ${remaining}`,
  }
}

export function PostMatchInboxSection({
  pendingMatches,
  postMatchActions,
  marginTopClassName = 'mt-3',
}: {
  pendingMatches: PendingMatch[]
  postMatchActions: PostMatchAction[]
  marginTopClassName?: string
}) {
  const inboxItems = useMemo(() => buildInboxItems(pendingMatches, postMatchActions), [pendingMatches, postMatchActions])

  if (inboxItems.length === 0) return null

  const currentTask = inboxItems[0]
  const presentation = itemPresentation(currentTask.kind)
  const deadline = getDeadlineInfo(currentTask.deadlineAt)
  const countLabel = inboxItems.length === 1 ? '1 việc đang chờ' : `${inboxItems.length} việc đang chờ`

  return (
    <View className={marginTopClassName}>
      <View className="mb-2 flex-row items-baseline justify-between">
        <Text className="text-[15px]" style={{ color: PROFILE_THEME_COLORS.onSurface, fontFamily: SCREEN_FONTS.cta, lineHeight: 20 }}>
          Việc cần chốt
        </Text>
        <Text className="text-[11px]" style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: SCREEN_FONTS.body, lineHeight: 15 }}>
          {countLabel}
        </Text>
      </View>

      <View
        className="overflow-hidden"
        style={{
          backgroundColor: PROFILE_THEME_COLORS.surface,
          borderColor: PROFILE_THEME_COLORS.outlineVariant,
          borderWidth: BORDER.hairline,
          borderRadius: RADIUS.md,
          ...SHADOW.xs,
        }}
      >
        <View style={{ borderLeftColor: PROFILE_THEME_SEMANTIC.warningStrong, borderLeftWidth: 3, paddingHorizontal: SPACING.md, paddingVertical: 12 }}>
          <View className="mb-1.5 flex-row items-center">
            <View className="rounded-[4px] px-2 py-0.5" style={{ backgroundColor: PROFILE_THEME_SEMANTIC.warningBg }}>
              <Text className="text-[10px]" style={{ color: PROFILE_THEME_SEMANTIC.warningText, fontFamily: SCREEN_FONTS.label, lineHeight: 14 }}>
                {presentation.chip}
              </Text>
            </View>
          </View>

          <Text
            className="mb-0.5 text-[17px] uppercase"
            numberOfLines={1}
            ellipsizeMode="tail"
            style={{ color: PROFILE_THEME_COLORS.onSurface, fontFamily: SCREEN_FONTS.headline, lineHeight: 21 }}
          >
            {currentTask.courtName}
          </Text>
          <Text className="text-[11px]" numberOfLines={1} style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: SCREEN_FONTS.body, lineHeight: 15 }}>
            {formatMatchMeta(currentTask)}
          </Text>
        </View>

        <View
          className="flex-row items-center justify-between"
          style={{ borderTopColor: PROFILE_THEME_COLORS.surfaceVariant, borderTopWidth: BORDER.hairline, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm }}
        >
          <View className="min-w-0 flex-1 flex-row items-center pr-3" style={{ columnGap: 5 }}>
            <View className="h-[5px] w-[5px] rounded-full" style={{ backgroundColor: deadline.dotColor }} />
            <Text className="text-[11px]" numberOfLines={1} style={{ color: deadline.textColor, fontFamily: SCREEN_FONTS.label, lineHeight: 15 }}>
              {deadline.label}
            </Text>
          </View>

          <Pressable onPress={() => presentation.onPress(currentTask.id)} className="rounded-full px-4 py-[7px]" style={{ backgroundColor: PROFILE_THEME_SEMANTIC.warningStrong }}>
            <Text className="text-[15px] uppercase" style={{ color: PROFILE_THEME_COLORS.surface, fontFamily: SCREEN_FONTS.headline, lineHeight: 18 }}>
              {presentation.cta}
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  )
}
