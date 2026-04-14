import { getEloBandForSessionRange } from '@/lib/eloSystem'
import { getSkillLevelUi } from '@/lib/skillLevelUi'
import type { SkillAssessmentLevel } from '@/lib/skillAssessment'

export type Player = {
  id: string
  name: string
  initials: string
  badge: 'trusted' | 'streak'
}

export type Host = {
  name: string
  rating: number
  vibe: string
}

export type HomeSessionRecord = {
  id: string
  host_id: string
  elo_min: number
  elo_max: number
  max_players: number
  status: 'open' | 'done' | 'cancelled' | 'pending_completion'
  court_booking_status: 'confirmed' | 'unconfirmed'
  created_at?: string | null
  host: {
    id: string
    name: string
    current_elo?: number | null
    elo?: number | null
    self_assessed_level?: string | null
    skill_label?: string | null
    reliability_score?: number | null
    host_reputation?: number | null
  } | null
  slot: {
    id: string
    start_time: string
    end_time: string
    // `price` là tổng chi phí của cả kèo/sân; UI tự suy ra giá mỗi người từ max_players.
    price: number
    court: {
      id: string
      name: string
      address: string
      city: string
    } | null
  } | null
  session_players: {
    player_id: string
    status: string
    player: {
      id: string
      name: string
      reliability_score?: number | null
      current_elo?: number | null
      self_assessed_level?: string | null
      skill_label?: string | null
    } | null
  }[]
}

export type HomeSessionRelation<T> = T | T[] | null

export type HomeSessionSlotRaw = Omit<NonNullable<HomeSessionRecord['slot']>, 'court'> & {
  court: HomeSessionRelation<NonNullable<NonNullable<HomeSessionRecord['slot']>['court']>>
}

export type HomeSessionRecordRaw = Omit<HomeSessionRecord, 'host' | 'slot' | 'session_players'> & {
  host: HomeSessionRelation<NonNullable<HomeSessionRecord['host']>>
  slot: HomeSessionRelation<HomeSessionSlotRaw>
  session_players:
    | (Omit<HomeSessionRecord['session_players'][number], 'player'> & {
        player: HomeSessionRelation<NonNullable<HomeSessionRecord['session_players'][number]['player']>>
      })[]
    | null
}

export type HomeProfile = {
  id: string
  name: string
  current_elo?: number | null
  elo?: number | null
  reliability_score?: number | null
  host_reputation?: number | null
}

export type PlayerStatsRecord = {
  current_win_streak: number
  host_average_rating: number
}

export type MySessionOverviewRow = {
  id: string
  status: string
  start_time: string
}

export type PendingMatchRaw = {
  id: string
  status: 'pending_completion' | 'done' | 'open' | 'cancelled'
  results_status?: 'not_submitted' | 'pending_confirmation' | 'disputed' | 'finalized' | 'void' | null
  slot: HomeSessionRelation<{
    start_time: string
    end_time: string
    court: HomeSessionRelation<{
      name: string
    }>
  }>
}

export type PendingMatch = {
  id: string
  courtName: string
  timeLabel: string
  endTime: string
}

export type PostMatchAction = {
  id: string
  courtName: string
  timeLabel: string
  actionType: 'confirm' | 'report'
  resultsStatus: 'pending_confirmation' | 'disputed' | 'not_submitted'
}

export type MatchSession = {
  id: string
  title: string
  bookingId: string
  courtName: string
  address: string
  matchScore: number
  skillLabel: string
  timeLabel: string
  priceLabel: string
  openSlotsLabel: string
  statusLabel: string
  countdownLabel?: string
  levelId: SkillAssessmentLevel['id']
  host: Host
  players: Player[]
  urgent?: boolean
  joined?: boolean
}

export type FamiliarCourt = {
  id: string
  name: string
  area: string
  openMatches: number
  note: string
  image: string
}

export const COURT_FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1505250469679-203ad9ced0cb?auto=format&fit=crop&w=1200&q=80',
  'https://images.unsplash.com/photo-1518604666860-9ed391f76460?auto=format&fit=crop&w=1200&q=80',
]

export function normalizeRelation<T>(value: HomeSessionRelation<T>): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value ?? null
}

export function normalizeHomeSessionRecord(session: HomeSessionRecordRaw): HomeSessionRecord {
  const slot = normalizeRelation(session.slot)

  return {
    ...session,
    host: normalizeRelation(session.host),
    slot: slot
      ? {
          ...slot,
          court: normalizeRelation(slot.court),
        }
      : null,
    session_players: (session.session_players ?? []).map((sessionPlayer) => ({
      ...sessionPlayer,
      player: normalizeRelation(sessionPlayer.player),
    })),
  }
}

export function formatTimeLabel(startTime: string, endTime: string) {
  const startDate = new Date(startTime)
  const endDate = new Date(endTime)
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return 'Chưa rõ thời gian'
  }

  const weekdayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
  const pad = (value: number) => value.toString().padStart(2, '0')
  const dateLabel = `${weekdayLabels[startDate.getDay()]}, ${pad(startDate.getDate())}/${pad(startDate.getMonth() + 1)}`
  const startClock = `${pad(startDate.getHours())}:${pad(startDate.getMinutes())}`
  const endClock = `${pad(endDate.getHours())}:${pad(endDate.getMinutes())}`

  return `${dateLabel} • ${startClock} - ${endClock}`
}

export function formatPendingResultTimeLabel(endTime: string) {
  const endDate = new Date(endTime)
  if (Number.isNaN(endDate.getTime())) {
    return 'Trận đấu đã kết thúc'
  }

  const weekdayLabels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
  const pad = (value: number) => value.toString().padStart(2, '0')
  return `Kết thúc ${weekdayLabels[endDate.getDay()]}, ${pad(endDate.getDate())}/${pad(endDate.getMonth() + 1)} • ${pad(endDate.getHours())}:${pad(endDate.getMinutes())}`
}

export function formatPriceLabel(totalPrice: number, maxPlayers: number) {
  const pricePerPlayer = Math.round(totalPrice / Math.max(maxPlayers, 1))
  return `${pricePerPlayer.toLocaleString('vi-VN')}d`
}

export function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function getStatusLabel(bookingStatus: HomeSessionRecord['court_booking_status']) {
  return bookingStatus === 'confirmed' ? 'Sân đã chốt' : 'Chưa chốt sân'
}

export function isWithinNext24Hours(startTime: string) {
  const startMs = Date.parse(startTime)
  if (Number.isNaN(startMs)) {
    return false
  }

  const nowMs = Date.now()
  const diffMs = startMs - nowMs
  return diffMs > 0 && diffMs <= 24 * 60 * 60 * 1000
}

export function formatCountdownLabelFromStartTime(startTime: string) {
  const diffMs = Math.max(Date.parse(startTime) - Date.now(), 0)
  const totalMinutes = Math.floor(diffMs / (60 * 1000))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  const pad = (value: number) => value.toString().padStart(2, '0')

  return `${pad(hours)}:${pad(minutes)}`
}

export function getLevelIdFromSession(session: Pick<HomeSessionRecord, 'elo_min' | 'elo_max' | 'host'>): SkillAssessmentLevel['id'] {
  const hostLevel = session.host?.self_assessed_level as SkillAssessmentLevel['id'] | undefined
  if (hostLevel) return hostLevel
  return getEloBandForSessionRange(session.elo_min, session.elo_max).levelId
}

export function getLivePlayerBadge(player?: { reliability_score?: number | null }): Player['badge'] {
  return (player?.reliability_score ?? 0) >= 95 ? 'trusted' : 'streak'
}

export function getLiveHostRating(session: HomeSessionRecord, hostAverageRating?: number | null) {
  if (hostAverageRating != null && hostAverageRating > 0) return Number(hostAverageRating.toFixed(1))

  const hostReputation = session.host?.host_reputation ?? 0
  const reliability = session.host?.reliability_score ?? 90
  const normalized = 4.2 + Math.min(hostReputation, 20) * 0.03 + Math.min(Math.max(reliability - 85, 0), 15) * 0.01
  return Math.min(5, Number(normalized.toFixed(1)))
}

export function buildLiveHostVibe(session: HomeSessionRecord, slotsLeft: number) {
  if (session.court_booking_status === 'confirmed' && slotsLeft <= 1) return 'Đã chốt sân, vào là chạy kèo'
  if (slotsLeft <= 2) return 'Đang chờ ghép nốt đội hình đẹp'
  if ((session.host?.reliability_score ?? 0) >= 95) return 'Host uy tín, phản hồi thường rất nhanh'
  return 'Kèo đang mở, dễ ghép người và vào sân'
}

export function computeLiveMatchScore(session: HomeSessionRecord, viewerElo?: number | null, joined?: boolean) {
  const activePlayers = session.session_players.filter((player) => player.status !== 'rejected').length
  const slotsLeft = Math.max(session.max_players - activePlayers, 0)
  const midpoint = Math.round((session.elo_min + session.elo_max) / 2)
  const eloGap = viewerElo == null ? 80 : Math.abs(viewerElo - midpoint)

  let score = 72
  if (session.court_booking_status === 'confirmed') score += 10
  if (isWithinNext24Hours(session.slot?.start_time ?? '')) score += 7
  if (slotsLeft > 0 && slotsLeft <= 2) score += 8
  if (joined) score += 6
  if (eloGap <= 60) score += 10
  else if (eloGap <= 140) score += 6
  else if (eloGap <= 220) score += 3

  return Math.max(78, Math.min(score, 99))
}

export function mapLiveSessionToMatchSession(
  session: HomeSessionRecord,
  options?: { viewerId?: string | null; viewerElo?: number | null; hostAverageRating?: number | null; urgent?: boolean },
): MatchSession {
  const levelId = getLevelIdFromSession(session)
  const joined =
    (options?.viewerId != null && session.host_id === options.viewerId) ||
    session.session_players.some((player) => player.player_id === options?.viewerId)
  const players = session.session_players
    .filter((player) => player.status !== 'rejected' && player.player)
    .slice(0, 3)
    .map((sessionPlayer) => ({
      id: sessionPlayer.player?.id ?? sessionPlayer.player_id,
      name: sessionPlayer.player?.name ?? 'Người chơi',
      initials: getInitials(sessionPlayer.player?.name ?? 'Người chơi'),
      badge: getLivePlayerBadge(sessionPlayer.player ?? undefined),
    }))
  const activePlayers = session.session_players.filter((player) => player.status !== 'rejected').length
  const slotsLeft = Math.max(session.max_players - activePlayers, 0)
  const urgent = options?.urgent ?? slotsLeft <= 2
  const court = session.slot?.court

  return {
    id: session.id,
    title: urgent ? 'Cần chốt đội hình' : `Kèo ${getSkillLevelUi(levelId).shortLabel.toLowerCase()}`,
    bookingId: `BK-${session.id.slice(0, 6).toUpperCase()}`,
    courtName: court?.name ?? 'Kèo Pickleball',
    address: [court?.address, court?.city].filter(Boolean).join(', '),
    matchScore: computeLiveMatchScore(session, options?.viewerElo, joined),
    skillLabel: getSkillLevelUi(levelId).shortLabel,
    timeLabel: formatTimeLabel(session.slot?.start_time ?? new Date().toISOString(), session.slot?.end_time ?? new Date().toISOString()),
    priceLabel: formatPriceLabel(session.slot?.price ?? 0, session.max_players),
    openSlotsLabel: urgent ? `Thiếu ${Math.max(slotsLeft, 1)} người` : `${slotsLeft} chỗ trống`,
    statusLabel: getStatusLabel(session.court_booking_status),
    countdownLabel: isWithinNext24Hours(session.slot?.start_time ?? '') ? formatCountdownLabelFromStartTime(session.slot?.start_time ?? '') : undefined,
    levelId,
    host: {
      name: session.host?.name ?? 'Ẩn danh',
      rating: getLiveHostRating(session, options?.hostAverageRating),
      vibe: buildLiveHostVibe(session, slotsLeft),
    },
    players,
    urgent,
    joined,
  }
}

export function buildLiveFamiliarCourts(sessions: HomeSessionRecord[]) {
  const grouped = new Map<string, { id: string; name: string; area: string; openMatches: number }>()

  sessions.forEach((session) => {
    const court = session.slot?.court
    if (!court) return

    const current = grouped.get(court.id)
    if (current) {
      current.openMatches += 1
      return
    }

    grouped.set(court.id, {
      id: court.id,
      name: court.name,
      area: court.city || court.address,
      openMatches: 1,
    })
  })

  return Array.from(grouped.values())
    .sort((left, right) => right.openMatches - left.openMatches)
    .slice(0, 5)
    .map((court, index) => ({
      id: court.id,
      name: court.name,
      area: court.area,
      openMatches: court.openMatches,
      note:
        court.openMatches >= 4
          ? 'Nhiều kèo đang mở, dễ vào sân nhanh'
          : court.openMatches >= 2
            ? 'Có kèo đều trong ngày, hợp để canh ghép trình'
            : 'Đang có tín hiệu mở kèo, đáng để theo dõi',
      image: COURT_FALLBACK_IMAGES[index % COURT_FALLBACK_IMAGES.length],
    }))
}
