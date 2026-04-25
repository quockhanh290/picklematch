const AVATAR_COLORS = [
  { bg: '#E1F5EE', fg: '#0F6E56' },
  { bg: '#FAECE7', fg: '#993C1D' },
  { bg: '#FAEEDA', fg: '#854F0B' },
  { bg: '#EDE4FE', fg: '#5B21B6' },
  { bg: '#DBF5EA', fg: '#0F6E56' },
] as const

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function pad2(value: number) {
  return String(value).padStart(2, '0')
}

export function formatTimeRange(startTime: Date, endTime: Date): string {
  const start = `${pad2(startTime.getHours())}:${pad2(startTime.getMinutes())}`
  const end = `${pad2(endTime.getHours())}:${pad2(endTime.getMinutes())}`
  return `${start}–${end}`
}

export function formatVND(value: number): string {
  return `${Math.round(value / 1000)}K`
}

export function formatDistance(distanceKm?: number): string {
  if (typeof distanceKm !== 'number' || !Number.isFinite(distanceKm)) {
    return ''
  }

  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m`
  }

  return `${distanceKm.toFixed(1)}km`
}

export function formatRelativeDate(startTime: Date, now: Date = new Date()): string {
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)

  if (isSameDay(startTime, now)) {
    return 'Hôm nay'
  }

  if (isSameDay(startTime, tomorrow)) {
    return 'Ngày mai'
  }

  const weekday = startTime.getDay() === 0 ? 'Chủ nhật' : `Thứ ${startTime.getDay() + 1}`
  return `${weekday}, ${pad2(startTime.getDate())}/${pad2(startTime.getMonth() + 1)}`
}

export function getCourtNameSize(name: string): number {
  const length = name.trim().length
  if (length <= 18) return 26
  if (length <= 28) return 22
  return 18
}

export function getAvatarColor(userId: string): { bg: string; fg: string } {
  const hash = userId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const color = AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
  return { bg: color.bg, fg: color.fg }
}
