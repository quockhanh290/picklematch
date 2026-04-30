import { getEloBandForSessionRange } from '@/lib/eloSystem'
import type { SkillAssessmentLevel } from '@/lib/skillAssessment'
import { getSkillLevelUi } from '@/lib/skillLevelUi'

export type Player = {
  id: string
  name: string
  initials: string
  badge: 'trusted' | 'streak'
}
export type Host = {
  id: string
  name: string
  initials: string
  rating: number
  vibe: string
}

export type HomeSessionRecord = {
  id: string
  host_id: string
  is_ranked?: boolean | null
  elo_min: number
  elo_max: number
  max_players: number
  status: 'open' | 'closed_recruitment' | 'done' | 'cancelled' | 'pending_completion'
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
  favorite_court_ids?: string[] | null
  photo_url?: string | null
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
  status: 'pending_completion' | 'done' | 'open' | 'closed_recruitment' | 'cancelled'
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
  startTime?: string
  endTime: string
  resultsStatus?: 'not_submitted' | 'pending_confirmation' | 'disputed' | 'finalized' | 'void' | null
}

export type PostMatchAction = {
  id: string
  courtName: string
  timeLabel: string
  startTime?: string
  endTime?: string
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
  startTime?: string
  endTime?: string
  priceLabel: string
  openSlotsLabel: string
  statusLabel: string
  countdownLabel?: string
  isRanked?: boolean
  activePlayers: number
  maxPlayers: number
  levelId: SkillAssessmentLevel['id']
  host: Host
  players: Player[]
  urgent?: boolean
  joined?: boolean
  carouselIndex?: number
  carouselTotal?: number
  courtBookingConfirmed?: boolean
}

export type FamiliarCourt = {
  id: string
  name: string
  area: string
  openMatches: number
  note: string
  image: string
}

type FavoriteCourtMeta = {
  id: string
  name?: string | null
  address?: string | null
  city?: string | null
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
  if (pricePerPlayer <= 0) return 'Miễn phí'
  if (pricePerPlayer >= 1000) {
    const thousands = pricePerPlayer / 1000
    return `${thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1)}K`
  }
  return `${pricePerPlayer}đ`
}

export function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function getStatusLabel(
  bookingStatus: HomeSessionRecord['court_booking_status'],
  sessionStatus: HomeSessionRecord['status'],
) {
  return bookingStatus === 'confirmed' ? 'Đã đặt sân' : 'Chưa đặt sân'
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

export function isWithinNext12Hours(startTime: string) {
  const startMs = Date.parse(startTime)
  if (Number.isNaN(startMs)) {
    return false
  }

  const nowMs = Date.now()
  const diffMs = startMs - nowMs
  return diffMs > 0 && diffMs <= 12 * 60 * 60 * 1000
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
  if (Number.isFinite(session.elo_min) && Number.isFinite(session.elo_max)) {
    return getEloBandForSessionRange(session.elo_min, session.elo_max).levelId
  }

  const hostLevel = session.host?.self_assessed_level as SkillAssessmentLevel['id'] | undefined
  if (hostLevel) return hostLevel
  return 'level_3'
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
  if (session.court_booking_status === 'confirmed' && slotsLeft <= 1) return 'Host đã chốt sân, vào là ghép nhanh'
  if ((session.host?.reliability_score ?? 0) >= 95) return 'Host uy tín, phản hồi thường rất nhanh'
  if (slotsLeft <= 2) return 'Host đang ưu tiên chốt đội hình sớm'
  return 'Host mở kèo rõ ràng, dễ theo và dễ ghép'
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
    .slice(0, 4)
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
    startTime: session.slot?.start_time,
    endTime: session.slot?.end_time,
    priceLabel: formatPriceLabel(session.slot?.price ?? 0, session.max_players),
    openSlotsLabel: urgent ? `Thiếu ${Math.max(slotsLeft, 1)} người` : `${slotsLeft} chỗ trống`,
    statusLabel: getStatusLabel(session.court_booking_status, session.status),
    countdownLabel: isWithinNext24Hours(session.slot?.start_time ?? '') ? formatCountdownLabelFromStartTime(session.slot?.start_time ?? '') : undefined,
    isRanked: session.is_ranked ?? true,
    activePlayers,
    maxPlayers: session.max_players,
    levelId,
    host: {
      id: session.host?.id ?? session.host_id,
      name: session.host?.name ?? 'Ẩn danh',
      initials: getInitials(session.host?.name ?? 'Ẩn danh'),
      rating: getLiveHostRating(session, options?.hostAverageRating),
      vibe: buildLiveHostVibe(session, slotsLeft),
    },
    players,
    urgent,
    joined,
    courtBookingConfirmed: session.court_booking_status === 'confirmed',
  }
}

export function buildLiveFamiliarCourts(
  sessions: HomeSessionRecord[],
  options?: {
    favoriteCourtIds?: string[] | null
    favoriteCourtsMeta?: FavoriteCourtMeta[]
  },
) {
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

  const buildCourtNote = (openMatches: number) =>
    openMatches >= 4
      ? 'Nhiều kèo đang mở, dễ vào sân nhanh'
      : openMatches >= 2
        ? 'Có kèo đều trong ngày, hợp để canh ghép trình'
        : openMatches >= 1
          ? 'Đang có tín hiệu mở kèo, đáng để theo dõi'
          : 'Tạm chưa có kèo mở, hệ thống sẽ cập nhật sớm'

  const favoriteCourtIds = options?.favoriteCourtIds?.filter(Boolean) ?? []
  const favoriteCourtsMeta = options?.favoriteCourtsMeta ?? []

  if (favoriteCourtIds.length > 0) {
    const favoriteMetaMap = new Map(favoriteCourtsMeta.map((court) => [court.id, court]))

    return favoriteCourtIds.map((courtId, index) => {
      const groupedCourt = grouped.get(courtId)
      const favoriteMeta = favoriteMetaMap.get(courtId)
      const openMatches = groupedCourt?.openMatches ?? 0
      const fallbackArea = [favoriteMeta?.city, favoriteMeta?.address].filter(Boolean).join(', ')
      const resolvedArea = groupedCourt?.area ?? fallbackArea

      return {
        id: courtId,
        name: groupedCourt?.name ?? favoriteMeta?.name ?? 'Sân quen',
        area: resolvedArea || 'Chưa rõ khu vực',
        openMatches,
        note: buildCourtNote(openMatches),
        image: COURT_FALLBACK_IMAGES[index % COURT_FALLBACK_IMAGES.length],
      }
    })
  }

  return Array.from(grouped.values())
    .sort((left, right) => right.openMatches - left.openMatches)
    .slice(0, 5)
    .map((court, index) => ({
      id: court.id,
      name: court.name,
      area: court.area,
      openMatches: court.openMatches,
      note: buildCourtNote(court.openMatches),
      image: COURT_FALLBACK_IMAGES[index % COURT_FALLBACK_IMAGES.length],
    }))
}

function buildMockPlayers(count: number): Player[] {
  const names = ['Nam Long', 'Quang Minh', 'Phuong Anh', 'Bao Tran', 'Khanh Linh', 'Hoang Vu', 'Gia Han', 'Huy Khoa']

  return Array.from({ length: count }).map((_, index) => {
    const name = names[index % names.length]
    return {
      id: `mock-player-${index + 1}`,
      name,
      initials: getInitials(name),
      badge: index % 2 === 0 ? 'trusted' : 'streak',
    }
  })
}

type SkillLevelPreviewCase = {
  id: string
  courtName: string
  address: string
  timeLabel: string
  priceLabel: string
  levelId: SkillAssessmentLevel['id']
  statusLabel: string
  isRanked: boolean
  urgent: boolean
  activePlayers: number
  maxPlayers: number
}

export function buildSkillLevelPreviewSessions(): MatchSession[] {
  const mockHost: Host = {
    id: 'mock-host-minh-quan',
    name: 'Host Minh Quan',
    initials: 'MQ',
    rating: 4.8,
    vibe: 'Host mở kèo rõ ràng, dễ theo và dễ ghép',
  }

  const scenarios: SkillLevelPreviewCase[] = [
    {
      id: 'mock-level-1-open',
      courtName: 'Tao Dan Rookie Court',
      address: '55C Nguyen Thi Minh Khai, Ben Thanh, Q1, TP.HCM',
      timeLabel: '18:00 - 20:00',
      priceLabel: '70K',
      levelId: 'level_1',
      statusLabel: 'Chưa đặt sân',
      isRanked: false,
      urgent: false,
      activePlayers: 2,
      maxPlayers: 6,
    },
    {
      id: 'mock-level-2-open',
      courtName: 'Phu Tho Basics Arena',
      address: '219 Ly Thuong Kiet, Ward 15, Q11, TP.HCM',
      timeLabel: '07:00 - 09:00',
      priceLabel: '85K',
      levelId: 'level_2',
      statusLabel: 'Đã đặt sân',
      isRanked: true,
      urgent: false,
      activePlayers: 4,
      maxPlayers: 6,
    },
    {
      id: 'mock-level-3-urgent',
      courtName: 'Rach Mieu Match Point',
      address: '1 Hoa Su, Ward 7, Phu Nhuan, TP.HCM',
      timeLabel: '20:30 - 22:00',
      priceLabel: '95K',
      levelId: 'level_3',
      statusLabel: 'Đã đặt sân',
      isRanked: false,
      urgent: true,
      activePlayers: 5,
      maxPlayers: 6,
    },
    {
      id: 'mock-level-4-ranked',
      courtName: 'Celadon Medal Hub',
      address: '88 N1, Son Ky, Tan Phu, TP.HCM',
      timeLabel: '06:00 - 08:00',
      priceLabel: '115K',
      levelId: 'level_4',
      statusLabel: 'Đã đặt sân',
      isRanked: true,
      urgent: false,
      activePlayers: 6,
      maxPlayers: 8,
    },
    {
      id: 'mock-level-5-ranked-urgent',
      courtName: 'Global Elite Championship Court',
      address: 'Do Xuan Hop, An Phu, Thu Duc, TP.HCM',
      timeLabel: '19:00 - 21:00',
      priceLabel: '140K',
      levelId: 'level_5',
      statusLabel: 'Đã đặt sân',
      isRanked: true,
      urgent: true,
      activePlayers: 5,
      maxPlayers: 6,
    },
  ]

  return scenarios.map((session) => ({
    id: session.id,
    title: session.urgent ? 'Cần chốt đội hình' : 'Kèo phù hợp',
    bookingId: `BK-${session.id.slice(0, 6).toUpperCase()}`,
    courtName: session.courtName,
    address: session.address,
    matchScore: session.urgent ? 94 : session.isRanked ? 91 : 88,
    skillLabel: getSkillLevelUi(session.levelId).shortLabel,
    timeLabel: session.timeLabel,
    priceLabel: session.priceLabel,
    openSlotsLabel: `${Math.max(session.maxPlayers - session.activePlayers, 0)} chỗ trống`,
    statusLabel: session.statusLabel,
    isRanked: session.isRanked,
    activePlayers: session.activePlayers,
    maxPlayers: session.maxPlayers,
    levelId: session.levelId,
    host: mockHost,
    players: buildMockPlayers(session.activePlayers),
    urgent: session.urgent,
    joined: false,
  }))
}

export function buildUpcomingMatchPreviewSession(): MatchSession {
  const host: Host = {
    id: 'mock-host-gia-huy',
    name: 'Host Gia Huy',
    initials: 'GH',
    rating: 4.9,
    vibe: 'Host đúng giờ, tổ chức kèo nhanh và rõ ràng',
  }

  const levelId: SkillAssessmentLevel['id'] = 'level_3'

  return {
    id: 'mock-upcoming-hero',
    title: 'Kèo sắp diễn ra',
    bookingId: 'BK-HERO01',
    courtName: 'Văn Thánh Riverside Court',
    address: '561A Dien Bien Phu, Binh Thanh, TP.HCM',
    matchScore: 93,
    skillLabel: getSkillLevelUi(levelId).shortLabel,
    timeLabel: 'Hôm nay • 19:30 - 21:00',
    priceLabel: '95K',
    openSlotsLabel: '2 chỗ trống',
    statusLabel: 'Đã đặt sân',
    countdownLabel: 'Bắt đầu sau 2 giờ 15 phút',
    isRanked: true,
    activePlayers: 4,
    maxPlayers: 6,
    levelId,
    host,
    players: buildMockPlayers(4),
    urgent: false,
    joined: true,
  }
}
