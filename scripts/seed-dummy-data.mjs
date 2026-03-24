import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://mzqsxgfvtgmsscbqugni.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const DUMMY_PASSWORD = process.env.DUMMY_PASSWORD || 'Pickle123!'

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY')
  console.error('Usage: SUPABASE_SERVICE_ROLE_KEY=... node scripts/seed-dummy-data.mjs')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const IDS = {
  courts: {
    tanBinh: '11111111-1111-1111-1111-111111111111',
    vanPhuc: '22222222-2222-2222-2222-222222222222',
    thaoDien: '33333333-3333-3333-3333-333333333333',
  },
  slots: {
    openConfirmed: '44444444-4444-4444-4444-444444444441',
    openApproval: '44444444-4444-4444-4444-444444444442',
    fullConfirmed: '44444444-4444-4444-4444-444444444443',
    doneRecent: '44444444-4444-4444-4444-444444444444',
    cancelled: '44444444-4444-4444-4444-444444444445',
    provisionalHost: '44444444-4444-4444-4444-444444444446',
    doneHistorical: '44444444-4444-4444-4444-444444444447',
  },
  sessions: {
    openConfirmed: '55555555-5555-5555-5555-555555555551',
    openApproval: '55555555-5555-5555-5555-555555555552',
    fullConfirmed: '55555555-5555-5555-5555-555555555553',
    doneRecent: '55555555-5555-5555-5555-555555555554',
    cancelled: '55555555-5555-5555-5555-555555555555',
    provisionalHost: '55555555-5555-5555-5555-555555555556',
    doneHistorical: '55555555-5555-5555-5555-555555555557',
  },
  notifications: {
    joinRequest: '66666666-6666-6666-6666-666666666661',
    joinApproved: '66666666-6666-6666-6666-666666666662',
    joinRejected: '66666666-6666-6666-6666-666666666663',
    playerLeft: '66666666-6666-6666-6666-666666666664',
    sessionCancelled: '66666666-6666-6666-6666-666666666665',
    sessionUpdated: '66666666-6666-6666-6666-666666666666',
    joinRequestReply: '66666666-6666-6666-6666-666666666667',
  },
  ratings: {
    r1: '77777777-7777-7777-7777-777777777771',
    r2: '77777777-7777-7777-7777-777777777772',
    r3: '77777777-7777-7777-7777-777777777773',
    r4: '77777777-7777-7777-7777-777777777774',
  },
}

const USERS = [
  {
    key: 'hostConfirmed',
    email: 'host.confirmed@picklematch.vn',
    phone: '+84901111111',
    name: 'Minh Tú',
    city: 'Hồ Chí Minh',
    level: 'level_4',
    skill_label: 'intermediate',
    elo: 1300,
    current_elo: 1315,
    auto_accept: true,
    is_provisional: false,
    placement_matches_played: 5,
    sessions_joined: 18,
    no_show_count: 0,
    reliability_score: 98,
    host_reputation: 28,
    earned_badges: ['Friendly', 'On-time', 'Great Host'],
  },
  {
    key: 'hostApproval',
    email: 'host.approval@picklematch.vn',
    phone: '+84902222222',
    name: 'Thu Trang',
    city: 'Hồ Chí Minh',
    level: 'level_3',
    skill_label: 'intermediate',
    elo: 1150,
    current_elo: 1165,
    auto_accept: false,
    is_provisional: false,
    placement_matches_played: 5,
    sessions_joined: 12,
    no_show_count: 1,
    reliability_score: 92,
    host_reputation: 15,
    earned_badges: ['Friendly'],
  },
  {
    key: 'matchedPlayer',
    email: 'player.matched@picklematch.vn',
    phone: '+84903333333',
    name: 'Kevin',
    city: 'Hồ Chí Minh',
    level: 'level_4',
    skill_label: 'intermediate',
    elo: 1300,
    current_elo: 1285,
    auto_accept: false,
    is_provisional: false,
    placement_matches_played: 5,
    sessions_joined: 10,
    no_show_count: 0,
    reliability_score: 96,
    host_reputation: 0,
    earned_badges: ['Fair Play'],
  },
  {
    key: 'lowerSkillPlayer',
    email: 'player.lower@picklematch.vn',
    phone: '+84904444444',
    name: 'Bảo Ngọc',
    city: 'Hồ Chí Minh',
    level: 'level_2',
    skill_label: 'basic',
    elo: 1000,
    current_elo: 1020,
    auto_accept: false,
    is_provisional: false,
    placement_matches_played: 5,
    sessions_joined: 7,
    no_show_count: 1,
    reliability_score: 88,
    host_reputation: 0,
    earned_badges: [],
  },
  {
    key: 'waitlistPlayer',
    email: 'player.waitlist@picklematch.vn',
    phone: '+84905555555',
    name: 'Đức Anh',
    city: 'Hồ Chí Minh',
    level: 'level_5',
    skill_label: 'advanced',
    elo: 1500,
    current_elo: 1490,
    auto_accept: false,
    is_provisional: false,
    placement_matches_played: 5,
    sessions_joined: 15,
    no_show_count: 0,
    reliability_score: 97,
    host_reputation: 0,
    earned_badges: ['On-time'],
  },
  {
    key: 'provisionalHost',
    email: 'host.provisional@picklematch.vn',
    phone: '+84906666666',
    name: 'Phương Linh',
    city: 'Hồ Chí Minh',
    level: 'level_2',
    skill_label: 'basic',
    elo: 1000,
    current_elo: 1000,
    auto_accept: false,
    is_provisional: true,
    placement_matches_played: 2,
    sessions_joined: 4,
    no_show_count: 0,
    reliability_score: 100,
    host_reputation: 4,
    earned_badges: [],
  },
  {
    key: 'socialPlayer',
    email: 'player.social@picklematch.vn',
    phone: '+84907777777',
    name: 'Hoàng Nam',
    city: 'Hồ Chí Minh',
    level: 'level_3',
    skill_label: 'intermediate',
    elo: 1150,
    current_elo: 1175,
    auto_accept: false,
    is_provisional: false,
    placement_matches_played: 5,
    sessions_joined: 9,
    no_show_count: 0,
    reliability_score: 95,
    host_reputation: 0,
    earned_badges: ['Friendly'],
  },
]

function isoAt(dayOffset, hour, minute) {
  const date = new Date()
  date.setDate(date.getDate() + dayOffset)
  date.setHours(hour, minute, 0, 0)
  return date.toISOString()
}

function dateOnlyFromIso(iso) {
  return iso.slice(0, 10)
}

async function listAllUsers() {
  let page = 1
  const perPage = 200
  const all = []

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
    if (error) throw error
    const users = data?.users ?? []
    all.push(...users)
    if (users.length < perPage) break
    page += 1
  }

  return all
}

async function ensureAuthUsers() {
  const existingUsers = await listAllUsers()
  const result = {}

  for (const userDef of USERS) {
    const existing = existingUsers.find((user) => user.email === userDef.email)

    if (existing) {
      const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
        email: userDef.email,
        password: DUMMY_PASSWORD,
        phone: userDef.phone,
        email_confirm: true,
        phone_confirm: true,
        user_metadata: {
          name: userDef.name,
          seed: 'picklematch-dummy',
        },
      })
      if (error) throw error
      result[userDef.key] = data.user
    } else {
      const { data, error } = await supabase.auth.admin.createUser({
        email: userDef.email,
        password: DUMMY_PASSWORD,
        phone: userDef.phone,
        email_confirm: true,
        phone_confirm: true,
        user_metadata: {
          name: userDef.name,
          seed: 'picklematch-dummy',
        },
      })
      if (error) throw error
      result[userDef.key] = data.user
    }
  }

  return result
}

async function resetDummyRows(authUsers) {
  const sessionIds = Object.values(IDS.sessions)
  const slotIds = Object.values(IDS.slots)
  const courtIds = Object.values(IDS.courts)
  const notificationIds = Object.values(IDS.notifications)
  const ratingIds = Object.values(IDS.ratings)
  const playerIds = Object.values(authUsers).map((user) => user.id)

  await supabase.from('ratings').delete().in('id', ratingIds)
  await supabase.from('ratings').delete().in('session_id', sessionIds)
  await supabase.from('notifications').delete().in('id', notificationIds)
  await supabase.from('join_requests').delete().in('match_id', sessionIds)
  await supabase.from('session_players').delete().in('session_id', sessionIds)
  await supabase.from('sessions').delete().in('id', sessionIds)
  await supabase.from('court_slots').delete().in('id', slotIds)
  await supabase.from('courts').delete().in('id', courtIds)
  await supabase.from('players').delete().in('id', playerIds)
}

async function seedPlayers(authUsers) {
  const rows = USERS.map((userDef) => ({
    id: authUsers[userDef.key].id,
    phone: userDef.phone,
    name: userDef.name,
    city: userDef.city,
    skill_label: userDef.skill_label,
    self_assessed_level: userDef.level,
    elo: userDef.elo,
    current_elo: userDef.current_elo,
    auto_accept: userDef.auto_accept,
    is_provisional: userDef.is_provisional,
    placement_matches_played: userDef.placement_matches_played,
    sessions_joined: userDef.sessions_joined,
    no_show_count: userDef.no_show_count,
    reliability_score: userDef.reliability_score,
    host_reputation: userDef.host_reputation,
    earned_badges: userDef.earned_badges,
    favorite_court_ids: [IDS.courts.tanBinh, IDS.courts.vanPhuc],
  }))

  const { error } = await supabase.from('players').upsert(rows)
  if (error) throw error
}

async function seedCourts() {
  const rows = [
    {
      id: IDS.courts.tanBinh,
      name: 'Sân Pickleball Tân Bình',
      name_en: 'Tan Binh Pickleball',
      address: '123 Hoàng Văn Thụ',
      city: 'Hồ Chí Minh',
      district: 'Tân Bình',
      lat: 10.801,
      lng: 106.658,
      price_per_hour: 240000,
      num_courts: 4,
      rating: 4.7,
      rating_count: 48,
      phone: '0901111111',
      hours_open: '06:00',
      hours_close: '22:00',
      hours_note: 'Mở cả tuần',
      court_type: 'indoor',
      surface: 'hard',
      price_min: 180000,
      price_max: 260000,
      price_note: 'Giờ cao điểm cuối tuần tăng giá',
      highlight: 'Sân sáng, có chỗ gửi xe',
      tags: ['indoor', 'central', 'busy'],
      google_maps_url: 'https://maps.google.com/?q=123+Hoang+Van+Thu',
      booking_url: 'https://example.com/booking/tan-binh',
      created_at: new Date().toISOString(),
    },
    {
      id: IDS.courts.vanPhuc,
      name: 'Sân Pickleball Vạn Phúc',
      name_en: 'Van Phuc Pickleball',
      address: 'Khu đô thị Vạn Phúc',
      city: 'Hồ Chí Minh',
      district: 'Thủ Đức',
      lat: 10.845,
      lng: 106.706,
      price_per_hour: 200000,
      num_courts: 6,
      rating: 4.5,
      rating_count: 31,
      phone: '0902222222',
      hours_open: '06:00',
      hours_close: '23:00',
      hours_note: 'Có khu cafe',
      court_type: 'outdoor',
      surface: 'hard',
      price_min: 150000,
      price_max: 220000,
      price_note: 'Giá ổn định',
      highlight: 'Nhiều sân, dễ ghép đội',
      tags: ['outdoor', 'social'],
      google_maps_url: 'https://maps.google.com/?q=Van+Phuc+City',
      booking_url: 'https://example.com/booking/van-phuc',
      created_at: new Date().toISOString(),
    },
    {
      id: IDS.courts.thaoDien,
      name: 'Sân Pickleball Thảo Điền',
      name_en: 'Thao Dien Pickleball',
      address: '88 Xuân Thuỷ',
      city: 'Hồ Chí Minh',
      district: 'Thảo Điền',
      lat: 10.806,
      lng: 106.736,
      price_per_hour: 280000,
      num_courts: 2,
      rating: 4.9,
      rating_count: 19,
      phone: '0903333333',
      hours_open: '07:00',
      hours_close: '22:00',
      hours_note: 'Sân đẹp, ít slot',
      court_type: 'indoor',
      surface: 'acrylic',
      price_min: 250000,
      price_max: 320000,
      price_note: 'Premium court',
      highlight: 'Phù hợp kèo trình cao',
      tags: ['premium', 'indoor'],
      google_maps_url: 'https://maps.google.com/?q=88+Xuan+Thuy',
      booking_url: 'https://example.com/booking/thao-dien',
      created_at: new Date().toISOString(),
    },
  ]

  const { error } = await supabase.from('courts').upsert(rows)
  if (error) throw error
}

async function seedSlotsAndSessions(authUsers) {
  const times = {
    openConfirmedStart: isoAt(1, 18, 0),
    openConfirmedEnd: isoAt(1, 20, 0),
    openApprovalStart: isoAt(2, 19, 0),
    openApprovalEnd: isoAt(2, 21, 0),
    fullConfirmedStart: isoAt(1, 20, 30),
    fullConfirmedEnd: isoAt(1, 22, 0),
    doneRecentStart: isoAt(-1, 18, 30),
    doneRecentEnd: isoAt(-1, 20, 30),
    cancelledStart: isoAt(3, 18, 0),
    cancelledEnd: isoAt(3, 20, 0),
    provisionalHostStart: isoAt(2, 7, 0),
    provisionalHostEnd: isoAt(2, 9, 0),
    doneHistoricalStart: isoAt(-7, 19, 0),
    doneHistoricalEnd: isoAt(-7, 21, 0),
  }

  const slots = [
    { id: IDS.slots.openConfirmed, court_id: IDS.courts.tanBinh, start_time: times.openConfirmedStart, end_time: times.openConfirmedEnd, price: 120000, status: 'booked' },
    { id: IDS.slots.openApproval, court_id: IDS.courts.vanPhuc, start_time: times.openApprovalStart, end_time: times.openApprovalEnd, price: 100000, status: 'booked' },
    { id: IDS.slots.fullConfirmed, court_id: IDS.courts.thaoDien, start_time: times.fullConfirmedStart, end_time: times.fullConfirmedEnd, price: 180000, status: 'booked' },
    { id: IDS.slots.doneRecent, court_id: IDS.courts.vanPhuc, start_time: times.doneRecentStart, end_time: times.doneRecentEnd, price: 110000, status: 'booked' },
    { id: IDS.slots.cancelled, court_id: IDS.courts.tanBinh, start_time: times.cancelledStart, end_time: times.cancelledEnd, price: 125000, status: 'booked' },
    { id: IDS.slots.provisionalHost, court_id: IDS.courts.tanBinh, start_time: times.provisionalHostStart, end_time: times.provisionalHostEnd, price: 90000, status: 'booked' },
    { id: IDS.slots.doneHistorical, court_id: IDS.courts.thaoDien, start_time: times.doneHistoricalStart, end_time: times.doneHistoricalEnd, price: 150000, status: 'booked' },
  ]

  const { error: slotError } = await supabase.from('court_slots').upsert(slots)
  if (slotError) throw slotError

  const sessions = [
    {
      id: IDS.sessions.openConfirmed,
      host_id: authUsers.hostConfirmed.id,
      slot_id: IDS.slots.openConfirmed,
      elo_min: 1150,
      elo_max: 1400,
      max_players: 4,
      status: 'open',
      require_approval: false,
      fill_deadline: isoAt(1, 15, 0),
      total_cost: 480000,
      court_fee_total: 480000,
      cost_per_player: 120000,
      start_time: times.openConfirmedStart,
      end_time: times.openConfirmedEnd,
      court_id: IDS.courts.tanBinh,
      session_date: dateOnlyFromIso(times.openConfirmedStart),
      court_booking_status: 'confirmed',
      booking_reference: 'TB-BOOK-001',
      booking_name: 'Minh Tú',
      booking_phone: '+84901111111',
      booking_notes: 'Đã cọc sân',
      booking_confirmed_at: new Date().toISOString(),
      was_full_when_cancelled: false,
    },
    {
      id: IDS.sessions.openApproval,
      host_id: authUsers.hostApproval.id,
      slot_id: IDS.slots.openApproval,
      elo_min: 1150,
      elo_max: 1300,
      max_players: 4,
      status: 'open',
      require_approval: true,
      fill_deadline: isoAt(2, 13, 0),
      total_cost: 400000,
      court_fee_total: 400000,
      cost_per_player: 100000,
      start_time: times.openApprovalStart,
      end_time: times.openApprovalEnd,
      court_id: IDS.courts.vanPhuc,
      session_date: dateOnlyFromIso(times.openApprovalStart),
      court_booking_status: 'unconfirmed',
      booking_reference: null,
      booking_name: null,
      booking_phone: null,
      booking_notes: null,
      booking_confirmed_at: null,
      was_full_when_cancelled: false,
    },
    {
      id: IDS.sessions.fullConfirmed,
      host_id: authUsers.hostConfirmed.id,
      slot_id: IDS.slots.fullConfirmed,
      elo_min: 1300,
      elo_max: 1500,
      max_players: 4,
      status: 'open',
      require_approval: false,
      fill_deadline: isoAt(1, 18, 0),
      total_cost: 720000,
      court_fee_total: 720000,
      cost_per_player: 180000,
      start_time: times.fullConfirmedStart,
      end_time: times.fullConfirmedEnd,
      court_id: IDS.courts.thaoDien,
      session_date: dateOnlyFromIso(times.fullConfirmedStart),
      court_booking_status: 'confirmed',
      booking_reference: 'TD-BOOK-002',
      booking_name: 'Minh Tú',
      booking_phone: '+84901111111',
      booking_notes: 'Slot premium',
      booking_confirmed_at: new Date().toISOString(),
      was_full_when_cancelled: false,
    },
    {
      id: IDS.sessions.doneRecent,
      host_id: authUsers.hostApproval.id,
      slot_id: IDS.slots.doneRecent,
      elo_min: 1000,
      elo_max: 1300,
      max_players: 4,
      status: 'done',
      require_approval: false,
      fill_deadline: isoAt(-1, 16, 0),
      total_cost: 440000,
      court_fee_total: 440000,
      cost_per_player: 110000,
      start_time: times.doneRecentStart,
      end_time: times.doneRecentEnd,
      court_id: IDS.courts.vanPhuc,
      session_date: dateOnlyFromIso(times.doneRecentStart),
      court_booking_status: 'confirmed',
      booking_reference: 'VP-BOOK-003',
      booking_name: 'Thu Trang',
      booking_phone: '+84902222222',
      booking_notes: 'Vừa xong kèo để test rating',
      booking_confirmed_at: isoAt(-2, 12, 0),
      was_full_when_cancelled: false,
    },
    {
      id: IDS.sessions.cancelled,
      host_id: authUsers.hostConfirmed.id,
      slot_id: IDS.slots.cancelled,
      elo_min: 1000,
      elo_max: 1200,
      max_players: 4,
      status: 'cancelled',
      require_approval: false,
      fill_deadline: isoAt(3, 14, 0),
      total_cost: 500000,
      court_fee_total: 500000,
      cost_per_player: 125000,
      start_time: times.cancelledStart,
      end_time: times.cancelledEnd,
      court_id: IDS.courts.tanBinh,
      session_date: dateOnlyFromIso(times.cancelledStart),
      court_booking_status: 'confirmed',
      booking_reference: 'TB-BOOK-004',
      booking_name: 'Minh Tú',
      booking_phone: '+84901111111',
      booking_notes: 'Cancelled after full',
      booking_confirmed_at: new Date().toISOString(),
      was_full_when_cancelled: true,
    },
    {
      id: IDS.sessions.provisionalHost,
      host_id: authUsers.provisionalHost.id,
      slot_id: IDS.slots.provisionalHost,
      elo_min: 800,
      elo_max: 1050,
      max_players: 6,
      status: 'open',
      require_approval: false,
      fill_deadline: isoAt(2, 6, 0),
      total_cost: 540000,
      court_fee_total: 540000,
      cost_per_player: 90000,
      start_time: times.provisionalHostStart,
      end_time: times.provisionalHostEnd,
      court_id: IDS.courts.tanBinh,
      session_date: dateOnlyFromIso(times.provisionalHostStart),
      court_booking_status: 'confirmed',
      booking_reference: 'TB-BOOK-005',
      booking_name: 'Phương Linh',
      booking_phone: '+84906666666',
      booking_notes: 'Host provisional để test badge',
      booking_confirmed_at: new Date().toISOString(),
      was_full_when_cancelled: false,
    },
    {
      id: IDS.sessions.doneHistorical,
      host_id: authUsers.hostConfirmed.id,
      slot_id: IDS.slots.doneHistorical,
      elo_min: 1200,
      elo_max: 1500,
      max_players: 4,
      status: 'done',
      require_approval: false,
      fill_deadline: isoAt(-7, 14, 0),
      total_cost: 600000,
      court_fee_total: 600000,
      cost_per_player: 150000,
      start_time: times.doneHistoricalStart,
      end_time: times.doneHistoricalEnd,
      court_id: IDS.courts.thaoDien,
      session_date: dateOnlyFromIso(times.doneHistoricalStart),
      court_booking_status: 'confirmed',
      booking_reference: 'TD-BOOK-006',
      booking_name: 'Minh Tú',
      booking_phone: '+84901111111',
      booking_notes: 'Kèo cũ để seed review profile',
      booking_confirmed_at: isoAt(-8, 10, 0),
      was_full_when_cancelled: false,
    },
  ]

  const { error: sessionError } = await supabase.from('sessions').upsert(sessions)
  if (sessionError) throw sessionError
}

async function seedSessionPlayersAndRequests(authUsers) {
  const sessionPlayers = [
    { session_id: IDS.sessions.openConfirmed, player_id: authUsers.hostConfirmed.id, status: 'confirmed' },
    { session_id: IDS.sessions.openConfirmed, player_id: authUsers.matchedPlayer.id, status: 'confirmed' },

    { session_id: IDS.sessions.openApproval, player_id: authUsers.hostApproval.id, status: 'confirmed' },
    { session_id: IDS.sessions.openApproval, player_id: authUsers.socialPlayer.id, status: 'confirmed' },

    { session_id: IDS.sessions.fullConfirmed, player_id: authUsers.hostConfirmed.id, status: 'confirmed' },
    { session_id: IDS.sessions.fullConfirmed, player_id: authUsers.matchedPlayer.id, status: 'confirmed' },
    { session_id: IDS.sessions.fullConfirmed, player_id: authUsers.lowerSkillPlayer.id, status: 'confirmed' },
    { session_id: IDS.sessions.fullConfirmed, player_id: authUsers.waitlistPlayer.id, status: 'confirmed' },

    { session_id: IDS.sessions.doneRecent, player_id: authUsers.hostApproval.id, status: 'confirmed' },
    { session_id: IDS.sessions.doneRecent, player_id: authUsers.matchedPlayer.id, status: 'confirmed' },
    { session_id: IDS.sessions.doneRecent, player_id: authUsers.lowerSkillPlayer.id, status: 'confirmed' },
    { session_id: IDS.sessions.doneRecent, player_id: authUsers.provisionalHost.id, status: 'confirmed' },

    { session_id: IDS.sessions.cancelled, player_id: authUsers.hostConfirmed.id, status: 'confirmed' },
    { session_id: IDS.sessions.cancelled, player_id: authUsers.matchedPlayer.id, status: 'confirmed' },
    { session_id: IDS.sessions.cancelled, player_id: authUsers.lowerSkillPlayer.id, status: 'confirmed' },
    { session_id: IDS.sessions.cancelled, player_id: authUsers.socialPlayer.id, status: 'confirmed' },

    { session_id: IDS.sessions.provisionalHost, player_id: authUsers.provisionalHost.id, status: 'confirmed' },
    { session_id: IDS.sessions.provisionalHost, player_id: authUsers.lowerSkillPlayer.id, status: 'confirmed' },

    { session_id: IDS.sessions.doneHistorical, player_id: authUsers.hostConfirmed.id, status: 'confirmed' },
    { session_id: IDS.sessions.doneHistorical, player_id: authUsers.matchedPlayer.id, status: 'confirmed' },
    { session_id: IDS.sessions.doneHistorical, player_id: authUsers.lowerSkillPlayer.id, status: 'confirmed' },
  ]

  const { error: playersError } = await supabase.from('session_players').insert(sessionPlayers)
  if (playersError) throw playersError

  const joinRequests = [
    {
      match_id: IDS.sessions.openApproval,
      player_id: authUsers.waitlistPlayer.id,
      status: 'pending',
      intro_note: 'Mình đánh ổn và có thể cân kèo, host xem giúp nhé.',
      host_response_template: null,
    },
    {
      match_id: IDS.sessions.openApproval,
      player_id: authUsers.provisionalHost.id,
      status: 'pending',
      intro_note: 'Mình mới qua placement nhưng giữ bóng khá ổn.',
      host_response_template: 'Đợi mình gom đủ người rồi báo nhé',
    },
    {
      match_id: IDS.sessions.openConfirmed,
      player_id: authUsers.socialPlayer.id,
      status: 'accepted',
      intro_note: 'Mình vào giao lưu nhẹ nhàng.',
      host_response_template: null,
    },
  ]

  const { error: requestError } = await supabase.from('join_requests').upsert(joinRequests, {
    onConflict: 'match_id,player_id',
  })
  if (requestError) throw requestError
}

async function seedNotifications(authUsers) {
  const rows = [
    {
      id: IDS.notifications.joinRequest,
      player_id: authUsers.hostApproval.id,
      type: 'join_request',
      title: 'Có yêu cầu tham gia mới',
      body: `${authUsers.waitlistPlayer.user_metadata?.name ?? 'Đức Anh'} muốn vào kèo chờ duyệt của bạn.`,
      deep_link: `/session/${IDS.sessions.openApproval}`,
      is_read: false,
      created_at: new Date().toISOString(),
    },
    {
      id: IDS.notifications.joinApproved,
      player_id: authUsers.matchedPlayer.id,
      type: 'join_approved',
      title: 'Yêu cầu đã được chấp nhận',
      body: 'Host đã đồng ý cho bạn vào kèo.',
      deep_link: `/session/${IDS.sessions.openConfirmed}`,
      is_read: false,
      created_at: new Date().toISOString(),
    },
    {
      id: IDS.notifications.joinRejected,
      player_id: authUsers.waitlistPlayer.id,
      type: 'join_rejected',
      title: 'Yêu cầu chưa được chấp nhận',
      body: 'Host đã từ chối yêu cầu trước đó của bạn.',
      deep_link: `/session/${IDS.sessions.openApproval}`,
      is_read: true,
      created_at: new Date().toISOString(),
    },
    {
      id: IDS.notifications.playerLeft,
      player_id: authUsers.hostConfirmed.id,
      type: 'player_left',
      title: 'Có người rời kèo',
      body: 'Một người chơi vừa rời khỏi kèo của bạn.',
      deep_link: `/session/${IDS.sessions.openConfirmed}`,
      is_read: false,
      created_at: new Date().toISOString(),
    },
    {
      id: IDS.notifications.sessionCancelled,
      player_id: authUsers.lowerSkillPlayer.id,
      type: 'session_cancelled',
      title: 'Kèo đã bị huỷ',
      body: 'Host đã huỷ kèo trước giờ chơi.',
      deep_link: `/session/${IDS.sessions.cancelled}`,
      is_read: false,
      created_at: new Date().toISOString(),
    },
    {
      id: IDS.notifications.sessionUpdated,
      player_id: authUsers.matchedPlayer.id,
      type: 'session_updated',
      title: 'Kèo vừa được cập nhật',
      body: 'Host vừa thay đổi thời gian và giá của kèo.',
      deep_link: `/session/${IDS.sessions.openConfirmed}`,
      is_read: false,
      created_at: new Date().toISOString(),
    },
    {
      id: IDS.notifications.joinRequestReply,
      player_id: authUsers.provisionalHost.id,
      type: 'join_request_reply',
      title: 'Host đã phản hồi',
      body: 'Đợi mình gom đủ người rồi báo nhé.',
      deep_link: `/session/${IDS.sessions.openApproval}`,
      is_read: true,
      created_at: new Date().toISOString(),
    },
  ]

  const { error } = await supabase.from('notifications').upsert(rows)
  if (error) throw error
}

async function seedRatings(authUsers) {
  const oldDate = isoAt(-6, 12, 0)
  const rows = [
    {
      id: IDS.ratings.r1,
      session_id: IDS.sessions.doneHistorical,
      rater_id: authUsers.matchedPlayer.id,
      rated_id: authUsers.hostConfirmed.id,
      tags: ['friendly', 'fair_play', 'good_description', 'well_organized'],
      no_show: false,
      skill_validation: 'matched',
      is_hidden: false,
      reveal_at: oldDate,
      processed_at: oldDate,
      created_at: oldDate,
    },
    {
      id: IDS.ratings.r2,
      session_id: IDS.sessions.doneHistorical,
      rater_id: authUsers.lowerSkillPlayer.id,
      rated_id: authUsers.hostConfirmed.id,
      tags: ['on_time', 'good_description', 'fair_pairing'],
      no_show: false,
      skill_validation: 'outclass',
      is_hidden: false,
      reveal_at: oldDate,
      processed_at: oldDate,
      created_at: oldDate,
    },
    {
      id: IDS.ratings.r3,
      session_id: IDS.sessions.doneHistorical,
      rater_id: authUsers.hostConfirmed.id,
      rated_id: authUsers.matchedPlayer.id,
      tags: ['friendly', 'skilled', 'on_time'],
      no_show: false,
      skill_validation: 'matched',
      is_hidden: false,
      reveal_at: oldDate,
      processed_at: oldDate,
      created_at: oldDate,
    },
    {
      id: IDS.ratings.r4,
      session_id: IDS.sessions.doneHistorical,
      rater_id: authUsers.hostConfirmed.id,
      rated_id: authUsers.lowerSkillPlayer.id,
      tags: ['fair_play', 'friendly'],
      no_show: false,
      skill_validation: 'weaker',
      is_hidden: false,
      reveal_at: oldDate,
      processed_at: oldDate,
      created_at: oldDate,
    },
  ]

  const { error } = await supabase.from('ratings').upsert(rows)
  if (error) throw error
}

async function main() {
  console.log('Seeding dummy data...')
  const authUsers = await ensureAuthUsers()
  await resetDummyRows(authUsers)
  await seedPlayers(authUsers)
  await seedCourts()
  await seedSlotsAndSessions(authUsers)
  await seedSessionPlayersAndRequests(authUsers)
  await seedNotifications(authUsers)
  await seedRatings(authUsers)

  console.log('\nDummy data seeded successfully.\n')
  console.log('Dev login accounts:')
  for (const userDef of USERS) {
    console.log(`- ${userDef.email} / ${DUMMY_PASSWORD} (${userDef.name})`)
  }

  console.log('\nSuggested test flows:')
  console.log(`- Home open confirmed: ${IDS.sessions.openConfirmed}`)
  console.log(`- Approval flow: ${IDS.sessions.openApproval}`)
  console.log(`- Full session / waitlist: ${IDS.sessions.fullConfirmed}`)
  console.log(`- Rating session: ${IDS.sessions.doneRecent}`)
  console.log(`- Cancelled session history: ${IDS.sessions.cancelled}`)
  console.log(`- Historical visible ratings: ${IDS.sessions.doneHistorical}`)
}

main().catch((error) => {
  console.error('\nSeed failed:')
  console.error(error)
  process.exit(1)
})
