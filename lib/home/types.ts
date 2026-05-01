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

export type Court = {
  id: string
  name: string
  address: string
  city: string
  district?: string | null
  lat?: number | null
  lng?: number | null
  rating?: number | null
  rating_count?: number | null
  phone?: string | null
  google_maps_url?: string | null
  booking_url?: string | null
  place_id?: string | null
  thumbnail_url?: string | null
  images?: any | null
  opening_hours?: any | null
  reviews_data?: any | null
  popular_times?: any | null
  amenities?: any | null
  tags?: string[] | null
  highlight?: string | null
  hours_open?: string | null
  hours_close?: string | null
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
    price: number
    court: Court | null
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

export type FamiliarCourt = {
  id: string
  name: string
  area: string
  openMatches: number
  note: string
  image: string
  thumbnail_url?: string | null
  rating?: number | null
  rating_count?: number | null
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
  slotsLeft: number
  hostInitials: string
  hostRating: number
  isBooked: boolean
  isHot: boolean
  isHighlyRated: boolean
  players: Player[]
  host: Host
  court_thumbnail_url?: string | null
  court_rating?: number | null
}
