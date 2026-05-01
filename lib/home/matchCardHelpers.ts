import { LucideIcon, ShieldCheck, AlertCircle } from 'lucide-react-native'
import { PROFILE_THEME_COLORS, PROFILE_THEME_SEMANTIC } from '@/constants/profileTheme'
import { MatchSession } from '@/lib/homeFeed'

export function hexToRgb(hex: string) {
  const clean = hex.replace('#', '')
  const value = clean.length === 3 ? clean.split('').map((char) => char + char).join('') : clean
  const numeric = Number.parseInt(value, 16)

  return {
    r: (numeric >> 16) & 255,
    g: (numeric >> 8) & 255,
    b: numeric & 255,
  }
}

export function withAlpha(hex: string, alpha: number) {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export function getBookingStatusVisual(statusLabel: string) {
  const normalized = statusLabel.toLowerCase()
  const isBooked = normalized.includes('\u0111\u00e3 \u0111\u1eb7t s\u00e2n')
  return {
    Icon: isBooked ? ShieldCheck : AlertCircle,
  }
}

export function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function pad2(value: number) {
  return value.toString().padStart(2, '0')
}

export function splitMatchTimeLabel(timeLabel: string) {
  const parts = timeLabel.split(/\u2022/).map((part) => part.trim())
  return {
    datePart: parts.length > 1 ? parts[0] : '',
    timeRange: parts.length > 1 ? parts[1] : timeLabel.trim(),
  }
}

export function parseUpcomingStartDate(timeLabel: string, now: Date) {
  const { datePart, timeRange } = splitMatchTimeLabel(timeLabel)
  const timeMatch = timeRange.match(/(\d{1,2}):(\d{2})/)
  if (!timeMatch) return null

  const start = new Date(now)
  start.setSeconds(0, 0)
  start.setHours(Number(timeMatch[1]), Number(timeMatch[2]), 0, 0)

  const normalizedDate = datePart.toLowerCase()
  if (normalizedDate.includes('hôm nay')) {
    return start
  }

  if (normalizedDate.includes('ngày mai')) {
    start.setDate(now.getDate() + 1)
    return start
  }

  const dateMatch = datePart.match(/(\d{1,2})\/(\d{1,2})/)
  if (dateMatch) {
    start.setMonth(Number(dateMatch[2]) - 1, Number(dateMatch[1]))
    if (start.getTime() < now.getTime() - 30 * 24 * 60 * 60 * 1000) {
      start.setFullYear(start.getFullYear() + 1)
    }
    return start
  }

  return start
}

export function getFullWeekdayLabel(date: Date) {
  return date.getDay() === 0 ? 'Chủ nhật' : `Thứ ${date.getDay() + 1}`
}

export function getHeaderTimeLabel(startDate: Date | null, now: Date) {
  if (!startDate) return { date: '', countdown: '', isUrgent: false, label: '' }

  const diffMs = startDate.getTime() - now.getTime()
  const totalMinutes = Math.max(0, Math.ceil(diffMs / (60 * 1000)))
  
  const dateLabel = `${getFullWeekdayLabel(startDate)}, ${pad2(startDate.getDate())}/${pad2(startDate.getMonth() + 1)}`.toLocaleUpperCase('vi-VN')

  if (diffMs > 24 * 60 * 60 * 1000) {
    return {
      date: dateLabel,
      countdown: '',
      isUrgent: false,
      label: dateLabel,
    }
  }

  let countdown = ''
  if (totalMinutes < 30) {
    countdown = 'Sắp bắt đầu'
  } else if (totalMinutes < 120) {
    countdown = `Còn ${totalMinutes}p`
  } else {
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    countdown = `Còn ${hours}h ${minutes}p`
  }

  return {
    date: dateLabel,
    countdown,
    isUrgent: totalMinutes < 120,
    label: countdown,
  }
}

export function getStartClock(timeRange: string) {
  return timeRange.match(/(\d{1,2}:\d{2})/)?.[1] ?? timeRange
}

export function getStartClockFromDate(date: Date | null, fallback: string) {
  if (!date) return getStartClock(fallback)
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

export function getStartSubLabel(startDate: Date | null, now: Date) {
  if (!startDate) return ''

  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)
  const diffMs = Math.max(startDate.getTime() - now.getTime(), 0)
  const hours = Math.floor(diffMs / (60 * 60 * 1000))
  const minutes = Math.max(1, Math.floor(diffMs / (60 * 1000)))

  if (isSameDay(startDate, now)) {
    return hours >= 1 ? `H\u00f4m nay \u00b7 ${hours}h` : `H\u00f4m nay \u00b7 ${minutes}p`
  }

  if (isSameDay(startDate, tomorrow)) {
    return `Ng\u00e0y mai \u00b7 ${Math.max(hours, 1)}h`
  }

  return `${getFullWeekdayLabel(startDate)}, ${pad2(startDate.getDate())}/${pad2(startDate.getMonth() + 1)}`
}

export function parseDateOrFallback(value: string | undefined, fallback: Date) {
  if (!value) return fallback
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? fallback : parsed
}

export function parseSessionStartDate(item: MatchSession) {
  return parseDateOrFallback(item.startTime, parseUpcomingStartDate(item.timeLabel, new Date()) ?? new Date())
}

export function parseSessionEndDate(item: MatchSession, startDate: Date) {
  if (item.endTime) {
    const parsed = new Date(item.endTime)
    if (!Number.isNaN(parsed.getTime())) return parsed
  }

  const { timeRange } = splitMatchTimeLabel(item.timeLabel)
  const matches = [...timeRange.matchAll(/(\d{1,2}):(\d{2})/g)]
  const endMatch = matches[1]
  if (!endMatch) return startDate

  const endDate = new Date(startDate)
  endDate.setHours(Number(endMatch[1]), Number(endMatch[2]), 0, 0)
  return endDate
}

export function formatClock(date: Date) {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`
}

export function getSuggestedDayInfo(startTime: Date) {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)
  const dd = pad2(startTime.getDate())
  const mm = pad2(startTime.getMonth() + 1)

  if (isSameDay(startTime, now)) {
    return {
      label: `H\u00f4m nay, ${dd}/${mm}`,
      badgeLabel: 'H\u00d4M NAY',
      badgeColor: PROFILE_THEME_COLORS.primary,
    }
  }

  if (isSameDay(startTime, tomorrow)) {
    return {
      label: `Ng\u00e0y mai, ${dd}/${mm}`,
      badgeLabel: 'NG\u00c0Y MAI',
      badgeColor: PROFILE_THEME_COLORS.onSurfaceVariant,
    }
  }

  const label = `${getFullWeekdayLabel(startTime)}, ${dd}/${mm}`
  return {
    label,
    badgeLabel: label.toLocaleUpperCase('vi-VN'),
    badgeColor: PROFILE_THEME_COLORS.outline,
  }
}
