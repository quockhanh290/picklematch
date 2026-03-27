import { router } from 'expo-router'
import {
  AlertCircle,
  Clock,
  Heart,
  Hand,
  Home,
  MapPin,
  Plus,
  ShieldCheck,
  Star,
  Swords,
  TrendingUp,
  UserRound,
  Users,
  Zap,
} from 'lucide-react-native'
import { memo, useCallback, useState } from 'react'
import type { ReactNode } from 'react'
import { Dimensions, ImageBackground, Pressable, ScrollView, Text, View } from 'react-native'
import Animated, {
  useAnimatedStyle,
  useAnimatedRef,
  type SharedValue,
  useScrollOffset,
} from 'react-native-reanimated'
import { SafeAreaView } from 'react-native-safe-area-context'

import { getSkillLevelUi, getSkillTargetElo } from '@/lib/skillLevelUi'
import type { SkillAssessmentLevel } from '@/lib/skillAssessment'

type StatItem = {
  id: string
  label: string
  value: string
  accent: string
  icon: typeof TrendingUp
}

type Player = {
  id: string
  name: string
  initials: string
  badge: 'trusted' | 'streak'
}

type Host = {
  name: string
  rating: number
  vibe: string
}

type HomeMockPlayer = {
  id: string
  name: string
  current_elo?: number | null
  self_assessed_level?: string | null
  skill_label?: string | null
}

type HomeMockSessionPlayer = {
  player_id: string
  status: 'confirmed' | 'pending'
  badge: 'trusted' | 'streak'
  player: HomeMockPlayer
}

type HomeMockCourt = {
  id: string
  name: string
  address: string
  city: string
  image?: string
}

type HomeMockCourtRecord = HomeMockCourt & {
  home_meta: {
    open_matches: number
    note: string
  }
}

type HomeMockSlot = {
  id: string
  start_time: string
  end_time: string
  price: number
  court: HomeMockCourt
}

type HomeMockSession = {
  id: string
  title: string
  booking_id: string
  elo_min: number
  elo_max: number
  max_players: number
  status: 'open' | 'done' | 'cancelled'
  court_booking_status: 'confirmed' | 'unconfirmed'
  host: Host & HomeMockPlayer
  slot: HomeMockSlot
  session_players: HomeMockSessionPlayer[]
  home_meta: {
    match_score: number
    skill_label: string
    open_slots_label: string
    urgent?: boolean
    joined?: boolean
    countdown_label?: string
  }
}

type MatchSession = {
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

type FamiliarCourt = {
  id: string
  name: string
  area: string
  openMatches: number
  note: string
  image: string
}

const iconStroke = 2.7
const screenWidth = Dimensions.get('window').width
const carouselCardWidth = screenWidth - 40
const carouselGap = 14
const SMART_MATCH_CARD_HEIGHT = 520
const COURT_CARD_HEIGHT = 256
const CAROUSEL_SECTION_HEIGHT = 536
const COURT_CAROUSEL_HEIGHT = 272
const userProfile = {
  name: 'Quốc Khánh',
}

const dashboardStats: StatItem[] = [
  { id: 'elo', label: 'ELO', value: '1.286', accent: 'text-indigo-700', icon: TrendingUp },
  { id: 'streak', label: 'STREAK', value: '09', accent: 'text-orange-600', icon: Zap },
  { id: 'reputation', label: 'UY TÍN', value: '98%', accent: 'text-emerald-600', icon: ShieldCheck },
]

const nextMatch: MatchSession | null = {
  id: 'next-match',
  title: 'Thu Duc Prime Night',
  bookingId: 'BK-2048',
  courtName: 'Pickle Dome Sala Court 03',
  address: '10 Mai Chí Thọ, Thủ Đức',
  matchScore: 94,
  skillLabel: 'Cọ xát',
  timeLabel: '20:30 - 22:00',
  priceLabel: '145.000đ',
  openSlotsLabel: 'Còn 1 chỗ',
  statusLabel: 'Sân đã chốt',
  countdownLabel: '01:24',
  levelId: 'level_3',
  host: { name: 'Minh Anh', rating: 4.9, vibe: 'Host giữ nhịp kèo rất chắc' },
  players: [
    { id: 'p1', name: 'Tuấn', initials: 'TA', badge: 'trusted' },
    { id: 'p2', name: 'Bảo', initials: 'BL', badge: 'streak' },
    { id: 'p3', name: 'Linh', initials: 'LN', badge: 'trusted' },
  ],
  joined: true,
}

const personalizedSessions: MatchSession[] = [
  {
    id: 'smart-1',
    title: 'Kèo đôi nhiệt cao',
    bookingId: 'BK-1931',
    courtName: 'The Vista Pickle Club',
    address: 'An Phú, Thủ Đức',
    matchScore: 96,
    skillLabel: 'Cọ xát',
    timeLabel: '19:00 - 21:00',
    priceLabel: '160.000đ',
    openSlotsLabel: 'Còn 2 chỗ',
    statusLabel: 'Sân đã chốt',
    levelId: 'level_3',
    host: { name: 'Hoàng Nam', rating: 4.8, vibe: 'Đánh nhiệt nhưng rất văn minh' },
    players: [
      { id: 'p4', name: 'Khánh', initials: 'QK', badge: 'trusted' },
      { id: 'p5', name: 'My', initials: 'MT', badge: 'streak' },
      { id: 'p6', name: 'Đạt', initials: 'DT', badge: 'trusted' },
    ],
  },
  {
    id: 'smart-2',
    title: 'Kèo tối có đèn',
    bookingId: 'BK-1948',
    courtName: 'Riverside Rally Club',
    address: 'Bình Thạnh, TP. HCM',
    matchScore: 91,
    skillLabel: 'Cân đối',
    timeLabel: '18:30 - 20:00',
    priceLabel: '135.000đ',
    openSlotsLabel: 'Còn 1 chỗ',
    statusLabel: 'Sân đã chốt',
    levelId: 'level_2',
    host: { name: 'Anh Thư', rating: 5, vibe: 'Host phản hồi cực nhanh' },
    players: [
      { id: 'p7', name: 'Vy', initials: 'VY', badge: 'streak' },
      { id: 'p8', name: 'Long', initials: 'LG', badge: 'trusted' },
      { id: 'p9', name: 'Hiếu', initials: 'HU', badge: 'trusted' },
    ],
  },
  {
    id: 'smart-3',
    title: 'Kèo xoay đôi để vào form',
    bookingId: 'BK-1992',
    courtName: 'Saigon South Pickle Hall',
    address: 'Quận 7, TP. HCM',
    matchScore: 88,
    skillLabel: 'Lên tay',
    timeLabel: '21:00 - 22:30',
    priceLabel: '120.000đ',
    openSlotsLabel: 'Còn 2 chỗ',
    statusLabel: 'Sân đã chốt',
    levelId: 'level_4',
    host: { name: 'Gia Hân', rating: 4.7, vibe: 'Kèo vui và đúng giờ' },
    players: [
      { id: 'p10', name: 'Phúc', initials: 'PC', badge: 'streak' },
      { id: 'p11', name: 'Nhi', initials: 'NH', badge: 'trusted' },
      { id: 'p12', name: 'Bảo', initials: 'BO', badge: 'trusted' },
    ],
  },
  {
    id: 'smart-4',
    title: 'Kèo cân trình sau giờ làm',
    bookingId: 'BK-2004',
    courtName: 'Landmark Pickle Studio',
    address: 'Bình Thạnh, TP. HCM',
    matchScore: 92,
    skillLabel: 'Cân đối',
    timeLabel: '19:30 - 21:00',
    priceLabel: '140.000đ',
    openSlotsLabel: 'Còn 1 chỗ',
    statusLabel: 'Sân đã chốt',
    levelId: 'level_2',
    host: { name: 'Hải Nam', rating: 4.9, vibe: 'Nhịp trận ổn và ghép người rất mượt' },
    players: [
      { id: 'p19', name: 'Ngân', initials: 'NN', badge: 'trusted' },
      { id: 'p20', name: 'Trí', initials: 'TR', badge: 'streak' },
      { id: 'p21', name: 'Lâm', initials: 'LM', badge: 'trusted' },
    ],
  },
  {
    id: 'smart-5',
    title: 'Kèo lên tay cuối tuần',
    bookingId: 'BK-2010',
    courtName: 'Eastside Pickle Arena',
    address: 'Thủ Đức, TP. HCM',
    matchScore: 90,
    skillLabel: 'Lên tay',
    timeLabel: '08:00 - 09:30',
    priceLabel: '125.000đ',
    openSlotsLabel: 'Còn 2 chỗ',
    statusLabel: 'Sân đã chốt',
    levelId: 'level_4',
    host: { name: 'Mai Trâm', rating: 4.8, vibe: 'Kèo sáng đúng giờ và nhiều rally đẹp' },
    players: [
      { id: 'p22', name: 'Phong', initials: 'PH', badge: 'streak' },
      { id: 'p23', name: 'Khôi', initials: 'KH', badge: 'trusted' },
      { id: 'p24', name: 'Uyên', initials: 'UY', badge: 'trusted' },
    ],
  },
]

const rescueSessions: MatchSession[] = [
  {
    id: 'rescue-1',
    title: 'Cần người vào sân gấp',
    bookingId: 'BK-2027',
    courtName: 'District 2 Open Court',
    address: 'Thảo Điền, Thủ Đức',
    matchScore: 93,
    skillLabel: 'Cứu net',
    timeLabel: '17:45 - 19:15',
    priceLabel: '110.000đ',
    openSlotsLabel: 'Thiếu 1 người',
    statusLabel: 'Sân đã chốt',
    levelId: 'level_4',
    host: { name: 'Thành Đạt', rating: 4.9, vibe: 'Đang chờ đủ người để giữ sân' },
    players: [
      { id: 'p13', name: 'An', initials: 'AN', badge: 'streak' },
      { id: 'p14', name: 'Tùng', initials: 'TG', badge: 'trusted' },
      { id: 'p15', name: 'Tâm', initials: 'TM', badge: 'trusted' },
    ],
    urgent: true,
  },
  {
    id: 'rescue-2',
    title: 'Sân đã giữ, vào là đánh',
    bookingId: 'BK-2031',
    courtName: 'Premier Paddle Hub',
    address: 'Phú Nhuận, TP. HCM',
    matchScore: 89,
    skillLabel: 'Gấp',
    timeLabel: '20:00 - 21:30',
    priceLabel: '150.000đ',
    openSlotsLabel: 'Còn 1 người',
    statusLabel: 'Sân đã chốt',
    levelId: 'level_4',
    host: { name: 'Yến Nhi', rating: 4.8, vibe: 'Team có gu đánh nhanh' },
    players: [
      { id: 'p16', name: 'Kim', initials: 'KM', badge: 'streak' },
      { id: 'p17', name: 'Vũ', initials: 'VU', badge: 'trusted' },
      { id: 'p18', name: 'Trang', initials: 'TR', badge: 'trusted' },
    ],
    urgent: true,
  },
  {
    id: 'rescue-3',
    title: 'Thiếu 1 là chạy kèo ngay',
    bookingId: 'BK-2038',
    courtName: 'Urban Rally Deck',
    address: 'Quận 2, TP. HCM',
    matchScore: 90,
    skillLabel: 'Gấp',
    timeLabel: '18:15 - 19:45',
    priceLabel: '130.000đ',
    openSlotsLabel: 'Thiếu 1 người',
    statusLabel: 'Sân đã chốt',
    levelId: 'level_4',
    host: { name: 'Bảo Châu', rating: 4.9, vibe: 'Nhóm đã có mặt gần đủ, vào là đánh' },
    players: [
      { id: 'p25', name: 'Kha', initials: 'KA', badge: 'streak' },
      { id: 'p26', name: 'Duy', initials: 'DY', badge: 'trusted' },
      { id: 'p27', name: 'Nhã', initials: 'NA', badge: 'trusted' },
    ],
    urgent: true,
  },
  {
    id: 'rescue-4',
    title: 'Cứu net phút cuối',
    bookingId: 'BK-2041',
    courtName: 'Racket Social Hub',
    address: 'Gò Vấp, TP. HCM',
    matchScore: 87,
    skillLabel: 'Cứu net',
    timeLabel: '21:15 - 22:45',
    priceLabel: '118.000đ',
    openSlotsLabel: 'Còn 1 người',
    statusLabel: 'Sân đã chốt',
    levelId: 'level_4',
    host: { name: 'Tuệ Minh', rating: 4.7, vibe: 'Kèo vui, đội hình đang chờ slot cuối' },
    players: [
      { id: 'p28', name: 'Lộc', initials: 'LC', badge: 'streak' },
      { id: 'p29', name: 'Vi', initials: 'VI', badge: 'trusted' },
      { id: 'p30', name: 'Sơn', initials: 'SN', badge: 'trusted' },
    ],
    urgent: true,
  },
]

const familiarCourts: FamiliarCourt[] = [
  {
    id: 'court-1',
    name: 'Sala Signature Court',
    area: 'Thủ Đức',
    openMatches: 3,
    note: 'Sân êm, đèn đẹp, booking nhanh',
    image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'court-2',
    name: 'Sunrise Pickle Loft',
    area: 'Quận 7',
    openMatches: 2,
    note: 'Nhiều kèo tối, dễ ghép trình',
    image: 'https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'court-3',
    name: 'Thao Dien Social Club',
    area: 'Thủ Đức',
    openMatches: 4,
    note: 'Cộng đồng thân thiện, vào là có người',
    image: 'https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'court-4',
    name: 'Grand Park Pickle House',
    area: 'Thủ Đức',
    openMatches: 5,
    note: 'Buổi tối nhiều kèo, dễ vào sân nhanh',
    image: 'https://images.unsplash.com/photo-1505250469679-203ad9ced0cb?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: 'court-5',
    name: 'Canal Side Court Club',
    area: 'Quận 7',
    openMatches: 2,
    note: 'Không gian thoáng, hợp kèo social lẫn cọ xát',
    image: 'https://images.unsplash.com/photo-1518604666860-9ed391f76460?auto=format&fit=crop&w=1200&q=80',
  },
]

function getEloRangeForLevel(levelId: SkillAssessmentLevel['id']) {
  if (levelId === 'level_1') return { elo_min: 800, elo_max: 950 }
  if (levelId === 'level_2') return { elo_min: 950, elo_max: 1150 }
  if (levelId === 'level_3') return { elo_min: 1150, elo_max: 1300 }
  if (levelId === 'level_4') return { elo_min: 1300, elo_max: 1500 }
  return { elo_min: 1500, elo_max: 1700 }
}

function buildHomeMockSession(session: MatchSession, index: number): HomeMockSession {
  const timeParts = session.timeLabel.split(' - ')
  const start = timeParts[0] ?? '19:00'
  const end = timeParts[1] ?? '21:00'
  const { elo_min, elo_max } = getEloRangeForLevel(session.levelId)

  return {
    id: session.id,
    title: session.title,
    booking_id: session.bookingId,
    elo_min,
    elo_max,
    max_players: 4,
    status: 'open',
    court_booking_status: 'confirmed',
    host: {
      id: `host-${index + 1}`,
      name: session.host.name,
      rating: session.host.rating,
      vibe: session.host.vibe,
      current_elo: Math.round((elo_min + elo_max) / 2),
      self_assessed_level: session.levelId,
      skill_label: session.skillLabel,
    },
    slot: {
      id: `slot-${index + 1}`,
      start_time: `2026-03-27T${start}:00+07:00`,
      end_time: `2026-03-27T${end}:00+07:00`,
      price: Number(session.priceLabel.replace(/[^\d]/g, '')) * 4,
      court: {
        id: `court-${session.id}`,
        name: session.courtName,
        address: session.address,
        city: session.address.includes('TP. HCM') ? 'TP. HCM' : 'TP. HCM',
      },
    },
    session_players: session.players.map((player) => ({
      player_id: player.id,
      status: 'confirmed',
      badge: player.badge,
      player: {
        id: player.id,
        name: player.name,
        current_elo: Math.round((elo_min + elo_max) / 2),
        self_assessed_level: session.levelId,
      },
    })),
    home_meta: {
      match_score: session.matchScore,
      skill_label: session.skillLabel,
      open_slots_label: session.openSlotsLabel,
      urgent: session.urgent,
      joined: session.joined,
      countdown_label: session.countdownLabel,
    },
  }
}

const HOME_SESSION_RECORDS: {
  next: HomeMockSession | null
  personalized: HomeMockSession[]
  rescue: HomeMockSession[]
} = {
  next: nextMatch ? buildHomeMockSession(nextMatch, 0) : null,
  personalized: personalizedSessions.map(buildHomeMockSession),
  rescue: rescueSessions.map((session, index) => buildHomeMockSession(session, index + personalizedSessions.length + 1)),
}

const HOME_COURT_RECORDS: HomeMockCourtRecord[] = familiarCourts.map((court) => ({
  id: court.id,
  name: court.name,
  address: court.area,
  city: 'TP. HCM',
  image: court.image,
  home_meta: {
    open_matches: court.openMatches,
    note: court.note,
  },
}))

function getLevelIdFromSession(session: Pick<HomeMockSession, 'elo_min' | 'elo_max' | 'host'>): SkillAssessmentLevel['id'] {
  const hostLevel = session.host.self_assessed_level as SkillAssessmentLevel['id'] | undefined
  if (hostLevel) return hostLevel
  if (session.elo_max <= 950) return 'level_1'
  if (session.elo_max <= 1150) return 'level_2'
  if (session.elo_max <= 1300) return 'level_3'
  if (session.elo_max <= 1500) return 'level_4'
  return 'level_5'
}

function formatTimeLabel(startTime: string, endTime: string) {
  const startDate = new Date(startTime)
  const endDate = new Date(endTime)
  const pad = (value: number) => value.toString().padStart(2, '0')

  return `${pad(startDate.getDate())}/${pad(startDate.getMonth() + 1)} · ${pad(startDate.getHours())}:${pad(
    startDate.getMinutes(),
  )} - ${pad(endDate.getHours())}:${pad(endDate.getMinutes())}`
}

function formatPriceLabel(totalPrice: number, maxPlayers: number) {
  const pricePerPerson = Math.round(totalPrice / Math.max(maxPlayers, 1))
  return `${pricePerPerson.toLocaleString('vi-VN')}đ`
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function getStatusLabel(bookingStatus: HomeMockSession['court_booking_status']) {
  return bookingStatus === 'confirmed' ? 'Sân đã chốt' : 'Chờ chốt sân'
}

function mapHomeMockSessionToMatchSession(session: HomeMockSession): MatchSession {
  const levelId = getLevelIdFromSession(session)

  return {
    id: session.id,
    title: session.title,
    bookingId: session.booking_id,
    courtName: session.slot.court.name,
    address: session.slot.court.address,
    matchScore: session.home_meta.match_score,
    skillLabel: getSkillLevelUi(levelId).shortLabel,
    timeLabel: formatTimeLabel(session.slot.start_time, session.slot.end_time),
    priceLabel: formatPriceLabel(session.slot.price, session.max_players),
    openSlotsLabel:
      session.home_meta.open_slots_label ||
      `${Math.max(session.max_players - session.session_players.length, 0)} chỗ trống`,
    statusLabel: getStatusLabel(session.court_booking_status),
    countdownLabel: session.home_meta.countdown_label,
    levelId,
    host: {
      name: session.host.name,
      rating: session.host.rating,
      vibe: session.host.vibe,
    },
    players: session.session_players.map((sessionPlayer) => ({
      id: sessionPlayer.player.id,
      name: sessionPlayer.player.name,
      initials: getInitials(sessionPlayer.player.name),
      badge: sessionPlayer.badge,
    })),
    urgent: session.home_meta.urgent,
    joined: session.home_meta.joined,
  }
}

function mapHomeMockCourtToFamiliarCourt(court: HomeMockCourtRecord): FamiliarCourt {
  return {
    id: court.id,
    name: court.name,
    area: court.address,
    openMatches: court.home_meta.open_matches,
    note: court.home_meta.note,
    image: court.image ?? '',
  }
}

const HOME_NEXT_MATCH = HOME_SESSION_RECORDS.next ? mapHomeMockSessionToMatchSession(HOME_SESSION_RECORDS.next) : null
const HOME_PERSONALIZED_SESSIONS = HOME_SESSION_RECORDS.personalized.map(mapHomeMockSessionToMatchSession)
const HOME_RESCUE_SESSIONS = HOME_SESSION_RECORDS.rescue.map(mapHomeMockSessionToMatchSession)
const HOME_FAMILIAR_COURTS = HOME_COURT_RECORDS.map(mapHomeMockCourtToFamiliarCourt)

function hexToRgb(hex: string) {
  const clean = hex.replace('#', '')
  const value = clean.length === 3 ? clean.split('').map((char) => char + char).join('') : clean
  const numeric = Number.parseInt(value, 16)
  return {
    r: (numeric >> 16) & 255,
    g: (numeric >> 8) & 255,
    b: numeric & 255,
  }
}

function relativeLuminance(hex: string) {
  const { r, g, b } = hexToRgb(hex)
  const channels = [r, g, b].map((value) => {
    const srgb = value / 255
    return srgb <= 0.03928 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

function getHeroTextPalette(baseColor: string) {
  const isDark = relativeLuminance(baseColor) < 0.3
  return isDark
    ? {
        primary: '#ffffff',
        secondary: 'rgba(255,255,255,0.84)',
        tertiary: 'rgba(255,255,255,0.68)',
        softChip: 'rgba(255,255,255,0.18)',
        contrastChip: 'rgba(15,23,42,0.18)',
        smartCardBg: 'rgba(255,255,255,0.10)',
        smartCardBorder: 'rgba(255,255,255,0.16)',
      }
    : {
        primary: '#0f172a',
        secondary: 'rgba(15,23,42,0.84)',
        tertiary: 'rgba(15,23,42,0.62)',
        softChip: 'rgba(255,255,255,0.38)',
        contrastChip: 'rgba(15,23,42,0.10)',
        smartCardBg: 'rgba(255,255,255,0.42)',
        smartCardBorder: 'rgba(255,255,255,0.24)',
      }
}

function MiniBadge({
  icon: Icon,
  label,
  tone = 'neutral',
}: {
  icon: typeof Clock
  label: string
  tone?: 'neutral' | 'success' | 'urgent' | 'dark'
}) {
  const palette =
    tone === 'success'
      ? { bg: '#ecfdf5', border: '#a7f3d0', text: '#047857', icon: '#047857' }
      : tone === 'urgent'
        ? { bg: '#fff7ed', border: '#fdba74', text: '#c2410c', icon: '#c2410c' }
        : tone === 'dark'
          ? { bg: 'rgba(15,23,42,0.8)', border: 'rgba(15,23,42,0.08)', text: '#ffffff', icon: '#ffffff' }
          : { bg: '#f8fafc', border: '#e2e8f0', text: '#334155', icon: '#334155' }

  return (
    <View
      className="flex-row items-center rounded-full px-3 py-2"
      style={{ backgroundColor: palette.bg, borderWidth: 1, borderColor: palette.border }}
    >
      <Icon size={14} color={palette.icon} strokeWidth={iconStroke} />
      <Text className="ml-2 text-xs font-bold" style={{ color: palette.text }}>
        {label}
      </Text>
    </View>
  )
}

function HomeGreetingHeader({
  name,
  statusPrompt,
}: {
  name: string
  statusPrompt: string
}) {
  return (
    <View className="flex-row items-start justify-between">
      <View className="flex-1 pr-4">
        <Text className="text-[11px] font-bold uppercase tracking-[2.8px] text-slate-400">Command Center</Text>
        <View className="mt-2 flex-row items-center">
          <Text className="text-[28px] font-black leading-[34px] text-slate-950">{name}</Text>
          <View className="ml-2 rounded-full bg-amber-100 p-2">
            <Hand size={18} color="#f59e0b" strokeWidth={iconStroke} />
          </View>
        </View>
        <Text className="mt-2 text-[15px] font-semibold text-slate-400">{statusPrompt}</Text>
      </View>

      <Pressable
        onPress={() => router.push('/(tabs)/profile' as never)}
        className="h-20 w-20 items-center justify-center rounded-[26px] border border-white/80 bg-white"
        style={{ shadowColor: '#0f172a', shadowOpacity: 0.08, shadowRadius: 20, shadowOffset: { width: 0, height: 10 } }}
      >
        <View className="h-[68px] w-[68px] items-center justify-center rounded-[22px] bg-amber-50">
          <UserRound size={30} color="#b45309" strokeWidth={2.4} />
        </View>
      </Pressable>
    </View>
  )
}

function DashboardStatsStrip({ items }: { items: StatItem[] }) {
  return (
    <View
      className="mt-6 flex-row rounded-[30px] border border-slate-100 bg-white px-4 py-5"
      style={{ shadowColor: '#0f172a', shadowOpacity: 0.06, shadowRadius: 18, shadowOffset: { width: 0, height: 10 } }}
    >
      {items.map((item, index) => {
        const Icon = item.icon

        return (
          <View key={item.id} className="flex-1 flex-row items-stretch">
            <View className="flex-1 items-center justify-center px-2">
              <View className="flex-row items-center">
                <Icon
                  size={15}
                  color={item.id === 'elo' ? '#6366f1' : item.id === 'streak' ? '#f97316' : '#10b981'}
                  strokeWidth={iconStroke}
                />
                <Text className="ml-2 text-[11px] font-bold uppercase tracking-[1px] text-slate-500">{item.label}</Text>
              </View>
              <Text className={`mt-3 text-[24px] font-black ${item.accent}`}>{item.value}</Text>
            </View>
            {index < items.length - 1 ? <View className="my-2 w-px self-stretch bg-slate-200" /> : null}
          </View>
        )
      })}
    </View>
  )
}

function SectionHeader({
  eyebrow,
  title,
  trailing,
}: {
  eyebrow: string
  title: string
  trailing?: string
}) {
  return (
    <View className="mb-5 flex-row items-end justify-between">
      <View className="flex-1 pr-4">
        <Text className="text-[11px] font-bold uppercase tracking-[2.8px] text-slate-400">{eyebrow}</Text>
        <Text className="mt-2 text-[28px] font-black text-slate-950">{title}</Text>
      </View>
      {trailing ? <Text className="text-sm font-bold text-slate-500">{trailing}</Text> : null}
    </View>
  )
}

function CarouselDots({
  count,
  activeIndex,
}: {
  count: number
  activeIndex: number
}) {
  const visibleCount = Math.min(count, 5)

  return (
    <View className="mt-1.5 flex-row items-center justify-center gap-2">
      {Array.from({ length: visibleCount }).map((_, index) => (
        <View
          key={index}
          className={`rounded-full ${
            index === activeIndex % visibleCount ? 'h-2 w-4 bg-slate-700' : 'h-2 w-2 bg-slate-300'
          }`}
        />
      ))}
    </View>
  )
}

function AvatarStack({
  players,
}: {
  players: Player[]
}) {
  return (
    <View className="flex-row items-center pb-1">
      {players.map((player, index) => (
        <View
          key={player.id}
          className="relative pb-1"
          style={{
            marginLeft: index === 0 ? 0 : 6,
            zIndex: players.length - index,
          }}
        >
          <View className="h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-slate-200">
            <Text className="text-xs font-black text-slate-700">{player.initials}</Text>
          </View>
          <View
            className={`absolute -bottom-1 -right-1 h-5 w-5 items-center justify-center rounded-full border border-white ${
              player.badge === 'trusted' ? 'bg-emerald-500' : 'bg-orange-500'
            }`}
          >
            {player.badge === 'trusted' ? (
              <ShieldCheck size={10} color="#ffffff" strokeWidth={iconStroke} />
            ) : (
              <Zap size={10} color="#ffffff" strokeWidth={iconStroke} />
            )}
          </View>
        </View>
      ))}
    </View>
  )
}

function HeroChip({
  icon: Icon,
  label,
  palette,
  emphasis = 'soft',
}: {
  icon: typeof Clock
  label: string
  palette: ReturnType<typeof getHeroTextPalette>
  emphasis?: 'soft' | 'contrast'
}) {
  return (
    <View
      className="flex-row items-center rounded-full px-3 py-2"
      style={{ backgroundColor: emphasis === 'soft' ? palette.softChip : palette.contrastChip }}
    >
      <Icon size={14} color={palette.primary} strokeWidth={iconStroke} />
      <Text className="ml-2 text-xs font-bold" style={{ color: palette.primary }}>
        {label}
      </Text>
    </View>
  )
}

function MatchScoreBadge({
  score,
  palette,
}: {
  score: number
  palette: ReturnType<typeof getHeroTextPalette>
}) {
  return <HeroChip icon={TrendingUp} label={`${score}% Match`} palette={palette} />
}

function HeroThemeCard({ item }: { item: MatchSession }) {
  const skillUi = getSkillLevelUi(item.levelId)
  const WatermarkIcon = skillUi.icon
  const textPalette = getHeroTextPalette(skillUi.heroFrom)

  return (
    <View
      className="overflow-hidden rounded-[48px] p-7"
      style={{
        backgroundColor: skillUi.heroFrom,
        shadowColor: skillUi.heroTo,
        shadowOpacity: 0.26,
        shadowRadius: 28,
        shadowOffset: { width: 0, height: 20 },
      }}
    >
      <View
        style={{
          position: 'absolute',
          right: -80,
          top: -42,
          width: 220,
          height: 220,
          borderRadius: 999,
          backgroundColor: skillUi.heroTo,
          opacity: 0.68,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: -58,
          bottom: -60,
          width: 200,
          height: 200,
          borderRadius: 999,
          backgroundColor: '#ffffff',
          opacity: 0.1,
        }}
      />
      <WatermarkIcon size={140} color="rgba(255,255,255,0.14)" style={{ position: 'absolute', right: -24, bottom: -24 }} />

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center rounded-full px-4 py-2" style={{ backgroundColor: textPalette.softChip }}>
          <View className="mr-2 h-2.5 w-2.5 rounded-full bg-white" />
          <Text className="text-xs font-bold uppercase tracking-[2.4px]" style={{ color: textPalette.primary }}>
            Sắp diễn ra
          </Text>
        </View>
        <Text className="text-xs font-bold uppercase tracking-[2.4px]" style={{ color: textPalette.secondary }}>
          #{item.bookingId}
        </Text>
      </View>

      <View className="mt-8 flex-row items-start justify-between">
        <View className="mr-4 flex-1">
          <Text className="text-[11px] font-bold uppercase tracking-[2.8px]" style={{ color: textPalette.secondary }}>
            BẮT ĐẦU SAU
          </Text>
          <Text className="mt-2 text-[64px] font-black leading-none" style={{ color: textPalette.primary }}>
            {item.countdownLabel ?? '01:24'}
          </Text>
        </View>

        <View className="items-end gap-2">
          <HeroChip icon={Swords} label={skillUi.shortLabel} palette={textPalette} emphasis="contrast" />
          <MatchScoreBadge score={item.matchScore} palette={textPalette} />
        </View>
      </View>

      <View className="mt-7">
        <View className="flex-row items-start justify-between">
          <View className="flex-1">
            <Text className="text-[22px] font-black" style={{ color: textPalette.primary }}>
              {item.courtName}
            </Text>
            <View className="mt-2 flex-row items-center">
              <MapPin size={14} color={textPalette.secondary} strokeWidth={iconStroke} />
              <Text className="ml-2 text-sm font-semibold" style={{ color: textPalette.secondary }}>
                {item.address}
              </Text>
            </View>
          </View>
        </View>

        <View className="mt-5 flex-row flex-wrap gap-3">
          <HeroChip icon={Clock} label={item.timeLabel} palette={textPalette} />
          <HeroChip icon={Users} label={item.openSlotsLabel} palette={textPalette} />
          <HeroChip icon={ShieldCheck} label={item.statusLabel} palette={textPalette} />
        </View>

        <View
          className="mt-6 rounded-[28px] p-5"
          style={{ backgroundColor: textPalette.smartCardBg, borderWidth: 1, borderColor: textPalette.smartCardBorder }}
        >
          <Text className="text-[9px] font-bold uppercase tracking-[2.8px]" style={{ color: textPalette.tertiary }}>
            HOST
          </Text>
          <View className="mt-3 flex-row items-center justify-between">
            <View className="flex-row items-center">
              <View className="h-12 w-12 items-center justify-center rounded-full border-2 border-white" style={{ backgroundColor: textPalette.contrastChip }}>
                <Text className="text-sm font-black" style={{ color: textPalette.primary }}>
                  {item.host.name.slice(0, 1).toUpperCase()}
                </Text>
              </View>
              <View className="ml-3">
                <View className="flex-row items-center">
                  <Text className="text-base font-black" style={{ color: textPalette.primary }}>
                    {item.host.name}
                  </Text>
                  <View className="ml-2 flex-row items-center">
                    <Star size={14} color={textPalette.primary} strokeWidth={iconStroke} />
                    <Text className="ml-1 text-sm font-black" style={{ color: textPalette.primary }}>
                      {item.host.rating.toFixed(1)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View
              className="flex-row items-center rounded-full px-3 py-1.5"
              style={{ backgroundColor: textPalette.softChip, borderWidth: 1, borderColor: textPalette.smartCardBorder }}
            >
              <Swords size={12} color={textPalette.primary} strokeWidth={iconStroke} />
              <Text className="ml-1.5 text-[10px] font-bold uppercase tracking-[0.8px]" style={{ color: textPalette.primary }}>
                {item.skillLabel}
              </Text>
            </View>
          </View>
          <View className="mt-4 h-px" style={{ backgroundColor: textPalette.smartCardBorder }} />
          <View className="mt-4">
            <Text className="text-[9px] font-bold uppercase tracking-[2.8px]" style={{ color: textPalette.tertiary }}>
              Players
            </Text>
            <View className="mt-2 flex-row items-center">
              <View className="min-w-0 flex-1 overflow-hidden pr-3">
                <AvatarStack players={item.players} />
              </View>

              <View
                className="shrink-0 flex-row items-center rounded-full px-4 py-3.5"
                style={{ backgroundColor: textPalette.softChip, borderWidth: 1, borderColor: textPalette.smartCardBorder }}
              >
                <Users size={13} color={textPalette.primary} strokeWidth={iconStroke} />
                <Text className="ml-2 text-[11px] font-black uppercase tracking-[1.8px]" style={{ color: textPalette.primary }}>
                  Sẵn sàng
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}
const _SmartMatchCard = memo(function SmartMatchCard({ item }: { item: MatchSession }) {
  const skillUi = getSkillLevelUi(item.levelId)
  const SkillIcon = skillUi.icon
  const eloRange = getEloRangeForLevel(item.levelId)
  const eloValue = getSkillTargetElo(eloRange.elo_min, eloRange.elo_max)
  const isConfirmed = item.statusLabel.toLowerCase().includes('chốt')

  return (
    <View
      className={`relative min-h-[438px] overflow-hidden rounded-[36px] border bg-white p-6 ${
        item.urgent ? 'border-orange-300' : skillUi.borderClassName
      }`}
      style={{
        minHeight: SMART_MATCH_CARD_HEIGHT,
        shadowColor: item.urgent ? '#fb923c' : '#0f172a',
        shadowOpacity: item.urgent ? 0.12 : 0.08,
        shadowRadius: item.urgent ? 12 : 18,
        shadowOffset: { width: 0, height: item.urgent ? 10 : 12 },
      }}
    >
      <SkillIcon
        size={132}
        color={skillUi.iconColor}
        strokeWidth={2.35}
        style={{
          position: 'absolute',
          right: -18,
          bottom: 18,
          opacity: 0.16,
        }}
      />

      <View className="flex-row items-start justify-between">
        <View className="flex-row flex-wrap items-center gap-2">
          <View className={`flex-row items-center rounded-full px-3 py-1.5 ${isConfirmed ? 'bg-emerald-50' : 'bg-orange-50'}`}>
            {isConfirmed ? (
              <ShieldCheck size={12} color="#047857" strokeWidth={iconStroke} />
            ) : (
              <AlertCircle size={12} color="#c2410c" strokeWidth={iconStroke} />
            )}
            <Text className={`ml-1.5 text-[11px] font-bold uppercase tracking-[1px] ${isConfirmed ? 'text-emerald-700' : 'text-orange-700'}`}>
              {item.statusLabel}
            </Text>
          </View>
          <View className="flex-row items-center rounded-full bg-indigo-50 px-3 py-2">
            <Clock size={14} color="#4338ca" strokeWidth={iconStroke} />
            <Text className="ml-2 text-xs font-bold text-indigo-700">{item.timeLabel}</Text>
          </View>
        </View>
      </View>

      <Text className="mt-5 text-[9px] font-bold uppercase tracking-[2.8px] text-slate-400">Court</Text>
      <Text className="mt-2 text-[24px] font-black text-slate-950">{item.courtName}</Text>
      <View className="mt-2 flex-row items-center">
        <MapPin size={14} color="#64748b" strokeWidth={iconStroke} />
        <Text className="ml-2 text-sm font-medium text-slate-500">{item.address}</Text>
      </View>

      <Text className="mt-5 text-[9px] font-bold uppercase tracking-[2.8px] text-slate-400">Điều kiện trận</Text>
      <View className="mt-2 flex-row flex-wrap items-center gap-3">
        <View className="rounded-[22px] border border-emerald-200 bg-emerald-50 px-4 py-3">
          <View className="flex-row items-center">
            <TrendingUp size={16} color="#047857" strokeWidth={iconStroke} />
            <Text className="ml-2 text-[18px] font-black text-emerald-700">{item.matchScore}% Match</Text>
          </View>
        </View>
        <View className="rounded-full border border-amber-200 bg-amber-50 px-4 py-3">
          <View className="flex-row items-center">
            <Heart size={16} color="#b45309" strokeWidth={iconStroke} />
            <Text className="ml-2 text-[16px] font-black text-amber-700">{item.priceLabel}</Text>
          </View>
        </View>
      </View>

      <Text className="mt-5 text-[9px] font-bold uppercase tracking-[2.8px] text-slate-400">Thông số</Text>
      <View className="mt-2 flex-row flex-wrap gap-3">
        <View className={`flex-row items-center rounded-full border px-3 py-2 ${skillUi.tagClassName} ${skillUi.borderClassName}`}>
          <SkillIcon size={13} color={skillUi.iconColor} strokeWidth={iconStroke} />
          <Text className={`ml-2 text-xs font-semibold uppercase tracking-[0.8px] ${skillUi.textClassName}`}>
            {item.skillLabel}
          </Text>
        </View>
        <View className="flex-row items-center rounded-full border border-slate-200 bg-slate-100 px-3 py-2">
          <TrendingUp size={12} color="#64748b" strokeWidth={iconStroke} />
          <Text className="ml-1.5 text-xs font-semibold uppercase tracking-[0.8px] text-slate-500">{eloValue} ELO</Text>
        </View>
        <View className="flex-row items-center rounded-full border border-slate-200 bg-slate-100 px-3 py-2">
          <Zap size={12} color="#64748b" strokeWidth={iconStroke} />
          <Text className="ml-1.5 text-xs font-semibold uppercase tracking-[0.8px] text-slate-500">
            {skillUi.duprValue} DUPR
          </Text>
        </View>
      </View>

      <View className="mt-6 rounded-[28px] bg-slate-50 p-5">
        <Text className="text-[9px] font-bold uppercase tracking-[2.8px] text-slate-400">HOST</Text>
        <View className="mt-3 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="relative">
              <View className="h-12 w-12 items-center justify-center rounded-full border-2 border-white bg-slate-900">
                <Text className="text-sm font-black text-white">{item.host.name.slice(0, 1).toUpperCase()}</Text>
              </View>
            </View>
            <View className="ml-3">
              <View className="flex-row items-center">
                <Text className="text-base font-black text-slate-950">{item.host.name}</Text>
                <View className="ml-2 flex-row items-center">
                  <Star size={14} color="#b45309" strokeWidth={iconStroke} />
                  <Text className="ml-1 text-sm font-black text-amber-700">{item.host.rating.toFixed(1)}</Text>
                </View>
              </View>
            </View>
          </View>
          <View className="items-end">
            <View className={`flex-row items-center rounded-full border px-3 py-1.5 ${skillUi.tagClassName} ${skillUi.borderClassName}`}>
              <SkillIcon size={12} color={skillUi.iconColor} strokeWidth={iconStroke} />
              <Text className={`ml-1.5 text-[10px] font-bold uppercase tracking-[0.8px] ${skillUi.textClassName}`}>{item.skillLabel}</Text>
            </View>
          </View>
        </View>
        <View className="mt-4 h-px bg-slate-200" />
        <View className="mt-4">
          <Text className="text-[9px] font-bold uppercase tracking-[2.8px] text-slate-400">Players</Text>
          <View className="mt-2 flex-row items-center">
            <View className="min-w-0 flex-1 overflow-hidden pr-3">
              <AvatarStack players={item.players} />
            </View>

            <Pressable className="shrink-0 flex-row items-center rounded-full bg-emerald-600 px-4 py-3.5">
              <Users size={13} color="#ffffff" strokeWidth={iconStroke} />
              <Text className="ml-2 text-[11px] font-black uppercase tracking-[1.8px] text-white">Tham gia</Text>
            </Pressable>
          </View>
        </View>
      </View>

    </View>
  )
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SmartQueueHeroCard = memo(function SmartQueueHeroCard({ item }: { item: MatchSession }) {
  const skillUi = getSkillLevelUi(item.levelId)
  const textPalette = getHeroTextPalette(skillUi.heroFrom)
  const WatermarkIcon = skillUi.icon

  return (
    <View
      className={`overflow-hidden rounded-[32px] border p-5 ${
        item.urgent ? 'border-orange-300' : 'border-white/10'
      }`}
      style={{
        backgroundColor: skillUi.heroFrom,
        shadowColor: item.urgent ? '#fb923c' : skillUi.heroTo,
        shadowOpacity: item.urgent ? 0.12 : 0.18,
        shadowRadius: item.urgent ? 12 : 20,
        shadowOffset: { width: 0, height: item.urgent ? 10 : 14 },
      }}
    >
      <View
        style={{
          position: 'absolute',
          right: -70,
          top: -36,
          width: 200,
          height: 200,
          borderRadius: 999,
          backgroundColor: skillUi.heroTo,
          opacity: 0.66,
        }}
      />
      <View
        style={{
          position: 'absolute',
          left: -54,
          bottom: -54,
          width: 180,
          height: 180,
          borderRadius: 999,
          backgroundColor: '#ffffff',
          opacity: 0.1,
        }}
      />
      <WatermarkIcon
        size={120}
        color="rgba(255,255,255,0.14)"
        style={{ position: 'absolute', right: -20, bottom: -18 }}
      />

      <View className="flex-row items-start justify-between">
        <View className="flex-row flex-wrap items-center gap-2">
          <HeroChip icon={ShieldCheck} label={item.statusLabel} palette={textPalette} />
          {item.urgent ? <MiniBadge icon={Zap} label="Cứu net" tone="urgent" /> : null}
        </View>
        <View className="rounded-full px-3 py-2" style={{ backgroundColor: textPalette.softChip }}>
          <Text className="text-sm font-black" style={{ color: textPalette.primary }}>
            {item.matchScore}%
          </Text>
        </View>
      </View>

      <Text className="mt-5 text-[24px] font-black" style={{ color: textPalette.primary }}>
        {item.courtName}
      </Text>
      <View className="mt-2 flex-row items-center">
        <MapPin size={14} color={textPalette.secondary} strokeWidth={iconStroke} />
        <Text className="ml-2 text-sm font-medium" style={{ color: textPalette.secondary }}>
          {item.address}
        </Text>
      </View>

      <View className="mt-5 flex-row flex-wrap gap-3">
        <HeroChip icon={Swords} label={item.skillLabel} palette={textPalette} />
        <HeroChip icon={Clock} label={item.timeLabel} palette={textPalette} />
        <HeroChip icon={Users} label={item.openSlotsLabel} palette={textPalette} />
        <HeroChip icon={Heart} label={item.priceLabel} palette={textPalette} emphasis="contrast" />
      </View>

      <View
        className="mt-6 rounded-[26px] p-4"
        style={{ backgroundColor: textPalette.smartCardBg, borderWidth: 1, borderColor: textPalette.smartCardBorder }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: textPalette.softChip }}>
              <Star size={16} color={textPalette.primary} strokeWidth={iconStroke} />
            </View>
            <View className="ml-3">
              <Text className="text-[11px] font-bold uppercase tracking-[2.4px]" style={{ color: textPalette.tertiary }}>
                Host rating
              </Text>
              <Text className="mt-1 text-base font-black" style={{ color: textPalette.primary }}>
                {item.host.name} · {item.host.rating.toFixed(1)}
              </Text>
              <Text className="mt-1 text-sm" style={{ color: textPalette.secondary }}>
                {item.host.vibe}
              </Text>
            </View>
          </View>
          <Heart size={16} color={textPalette.primary} strokeWidth={iconStroke} />
        </View>
      </View>

      <View className="mt-6 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <AvatarStack players={item.players} />
          <View className="ml-4 rounded-full border px-4 py-2" style={{ borderColor: textPalette.smartCardBorder, backgroundColor: textPalette.softChip }}>
            <Text className="text-xs font-bold uppercase tracking-[2.2px]" style={{ color: textPalette.primary }}>
              Bạn?
            </Text>
          </View>
        </View>

        <Pressable className="rounded-full px-5 py-4" style={{ backgroundColor: item.urgent ? '#fb923c' : '#ffffff' }}>
          <Text className="text-xs font-black uppercase tracking-[2.4px]" style={{ color: item.urgent ? '#ffffff' : skillUi.heroFrom }}>
            Tham gia
          </Text>
        </Pressable>
      </View>
    </View>
  )
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SmartQueueStructuredCard = memo(function SmartQueueStructuredCard({ item }: { item: MatchSession }) {
  const skillUi = getSkillLevelUi(item.levelId)
  const SkillIcon = skillUi.icon

  return (
    <View
      className={`relative overflow-hidden rounded-[32px] border bg-white p-5 ${
        item.urgent ? 'border-orange-300' : 'border-slate-100'
      }`}
      style={{
        shadowColor: item.urgent ? '#fb923c' : '#0f172a',
        shadowOpacity: item.urgent ? 0.12 : 0.08,
        shadowRadius: item.urgent ? 12 : 18,
        shadowOffset: { width: 0, height: item.urgent ? 10 : 12 },
      }}
    >
      <SkillIcon
        size={132}
        color={skillUi.iconColor}
        strokeWidth={2.35}
        style={{
          position: 'absolute',
          right: -18,
          bottom: 18,
          opacity: 0.16,
        }}
      />

      <View className="flex-row items-center justify-between">
        <View className="flex-row flex-wrap items-center gap-2">
          <MiniBadge icon={ShieldCheck} label={item.statusLabel} tone="neutral" />
          {item.urgent ? <MiniBadge icon={Zap} label="Cứu net" tone="urgent" /> : null}
        </View>
        <Text className="text-xs font-bold uppercase tracking-[2.4px] text-slate-400">#{item.bookingId}</Text>
      </View>

      <View className="mt-6">
        <Text className="text-[11px] font-bold uppercase tracking-[2.8px] text-slate-400">Smart Queue</Text>
        <Text className="mt-3 text-[28px] font-black leading-tight text-slate-950">{item.courtName}</Text>
        <Text className="mt-2 text-base font-semibold text-slate-500">{item.title}</Text>
      </View>

      <View className="mt-6 rounded-[30px] border border-slate-200 bg-slate-50 p-5">
        <View className="flex-row items-start justify-between">
          <View className="mr-4 flex-1">
            <View className="mt-1 flex-row items-center">
              <MapPin size={14} color="#64748b" strokeWidth={iconStroke} />
              <Text className="ml-2 text-sm font-medium text-slate-500">{item.address}</Text>
            </View>
          </View>
          <View className="rounded-full bg-emerald-50 px-4 py-2">
            <Text className="text-sm font-black text-emerald-700">{item.matchScore}%</Text>
          </View>
        </View>

        <View className="mt-5 flex-row flex-wrap gap-3">
          <MiniBadge icon={Swords} label={item.skillLabel} />
          <MiniBadge icon={Clock} label={item.timeLabel} />
          <MiniBadge icon={Users} label={item.openSlotsLabel} tone={item.urgent ? 'urgent' : 'neutral'} />
          <MiniBadge icon={Heart} label={item.priceLabel} tone="success" />
        </View>

        <View className="mt-6 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <AvatarStack players={item.players} />
            <View className="ml-4">
              <Text className="text-[11px] font-bold uppercase tracking-[2.6px] text-slate-400">Host</Text>
              <Text className="mt-1 text-base font-black text-slate-950">
                {item.host.name} · {item.host.rating.toFixed(1)}
              </Text>
            </View>
          </View>
          <View className="items-end">
            <Text className="text-[11px] font-bold uppercase tracking-[2.4px] text-slate-400">Nhịp kèo</Text>
            <Text className="mt-1 text-base font-black text-slate-950">{item.host.vibe}</Text>
          </View>
        </View>
      </View>

      <View className="mt-6 flex-row items-center justify-between">
        <View className="rounded-full border border-dashed border-slate-300 px-4 py-2">
          <Text className="text-xs font-bold uppercase tracking-[2.2px] text-slate-500">Bạn?</Text>
        </View>

        <Pressable className="rounded-full bg-emerald-600 px-5 py-4">
          <Text className="text-xs font-black uppercase tracking-[2.4px] text-white">Tham gia</Text>
        </Pressable>
      </View>
    </View>
  )
})

const FamiliarCourtCard = memo(function FamiliarCourtCard({ item }: { item: FamiliarCourt }) {
  return (
    <ImageBackground
      source={{ uri: item.image }}
      imageStyle={{ borderRadius: 40 }}
      className="h-64 overflow-hidden rounded-[40px]"
      style={{ height: COURT_CARD_HEIGHT }}
    >
      <View className="flex-1 justify-between bg-black/15 p-5">
        <View className="flex-row items-start justify-between">
          <View className="rounded-full border border-white/20 bg-white/15 px-4 py-2">
            <View className="flex-row items-center">
              <Home size={14} color="#ffffff" strokeWidth={iconStroke} />
              <Text className="ml-2 text-xs font-bold uppercase tracking-[2.2px] text-white">Sân quen</Text>
            </View>
          </View>

          <View className="rounded-full border border-orange-200 bg-white px-4 py-2">
            <View className="flex-row items-center">
              <Zap size={14} color="#ea580c" strokeWidth={iconStroke} />
              <Text className="ml-2 text-xs font-black text-orange-700">{item.openMatches} kèo đang mở</Text>
            </View>
          </View>
        </View>

        <View
          className="rounded-[28px] border border-white/70 bg-white/90 p-4"
          style={{ shadowColor: '#0f172a', shadowOpacity: 0.12, shadowRadius: 18, shadowOffset: { width: 0, height: 10 } }}
        >
          <Text className="text-[22px] font-black text-slate-950">{item.name}</Text>
          <View className="mt-2 flex-row items-center">
            <MapPin size={14} color="#475569" strokeWidth={iconStroke} />
            <Text className="ml-2 text-sm font-semibold text-slate-600">{item.area}</Text>
          </View>
          <Text className="mt-3 text-sm leading-6 text-slate-500">{item.note}</Text>
        </View>
      </View>
    </ImageBackground>
  )
})

const CarouselCard = memo(function CarouselCard({
  index,
  itemCount,
  scrollOffset,
  children,
}: {
  index: number
  itemCount: number
  scrollOffset: SharedValue<number>
  children: ReactNode
}) {
  const cardStyle = useAnimatedStyle(() => {
    const itemOffset = index * (carouselCardWidth + carouselGap)
    const distance = Math.abs(scrollOffset.value - itemOffset)
    const progress = Math.min(distance / (carouselCardWidth + carouselGap), 1)

    return {
      opacity: 1 - progress * 0.2,
      transform: [
        { translateY: progress * 8 },
        { scale: 1 - progress * 0.04 },
      ],
    }
  })

  return (
    <Animated.View
      style={[
        {
          width: carouselCardWidth,
          marginRight: index === itemCount - 1 ? 0 : carouselGap,
        },
        cardStyle,
      ]}
    >
      {children}
    </Animated.View>
  )
})

function SwipeStack<T>({
  items,
  containerHeight,
  renderCard,
  onIndexChange,
}: {
  items: T[]
  containerHeight: number
  renderCard: (item: T) => ReactNode
  onIndexChange?: (index: number) => void
}) {
  const scrollRef = useAnimatedRef<Animated.ScrollView>()
  const scrollOffset = useScrollOffset(scrollRef)

  return (
    <Animated.ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      scrollEventThrottle={16}
      decelerationRate="fast"
      snapToInterval={carouselCardWidth + carouselGap}
      snapToAlignment="start"
      disableIntervalMomentum
      contentContainerStyle={{ paddingRight: 0 }}
      style={{ height: containerHeight }}
      onScroll={(event) => {
        const offsetX = event.nativeEvent.contentOffset.x
        const nextIndex = Math.round(offsetX / (carouselCardWidth + carouselGap))
        onIndexChange?.(nextIndex)
      }}
    >
      {items.map((item, index) => {
        return (
          <CarouselCard
            key={String((item as { id?: string }).id ?? index)}
            index={index}
            itemCount={items.length}
            scrollOffset={scrollOffset}
          >
            {renderCard(item)}
          </CarouselCard>
        )
      })}
    </Animated.ScrollView>
  )
}

export default function HomeScreen() {
  const [personalizedIndex, setPersonalizedIndex] = useState(0)
  const [rescueIndex, setRescueIndex] = useState(0)
  const [courtIndex, setCourtIndex] = useState(0)
  const hasUpcomingMatch = Boolean(HOME_NEXT_MATCH?.joined)
  const statusPrompt = hasUpcomingMatch ? 'Đã sẵn sàng ra sân chưa?' : 'Hôm nay ra sân chứ'
  const renderPersonalizedCard = useCallback((item: MatchSession) => <_SmartMatchCard item={item} />, [])
  const renderRescueCard = useCallback((item: MatchSession) => <_SmartMatchCard item={item} />, [])
  const renderCourtCard = useCallback((item: FamiliarCourt) => <FamiliarCourtCard item={item} />, [])

  return (
    <SafeAreaView className="flex-1 bg-[#F8FAFC]" edges={['top']}>
      <View className="flex-1">
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 10, paddingBottom: 160 }}
        >
          <HomeGreetingHeader name={userProfile.name} statusPrompt={statusPrompt} />

          <DashboardStatsStrip items={dashboardStats} />

          {HOME_NEXT_MATCH ? (
            <View className="mt-8">
              <HeroThemeCard item={HOME_NEXT_MATCH} />
            </View>
          ) : null}

          <View className="mt-10">
            <SectionHeader eyebrow="Smart Queue" title="Dành riêng cho bạn" />
            <SwipeStack
              items={HOME_PERSONALIZED_SESSIONS}
              containerHeight={CAROUSEL_SECTION_HEIGHT}
              renderCard={renderPersonalizedCard}
              onIndexChange={setPersonalizedIndex}
            />
            <CarouselDots count={HOME_PERSONALIZED_SESSIONS.length} activeIndex={personalizedIndex} />
          </View>

          <View className="mt-10">
            <SectionHeader eyebrow="Urgent Fill" title="Cứu net khẩn cấp" />
            <SwipeStack
              items={HOME_RESCUE_SESSIONS}
              containerHeight={CAROUSEL_SECTION_HEIGHT}
              renderCard={renderRescueCard}
              onIndexChange={setRescueIndex}
            />
            <CarouselDots count={HOME_RESCUE_SESSIONS.length} activeIndex={rescueIndex} />
          </View>

          <View className="mt-10">
            <SectionHeader eyebrow="Go-To Courts" title="Sân quen của bạn" />
            <SwipeStack
              items={HOME_FAMILIAR_COURTS}
              containerHeight={COURT_CAROUSEL_HEIGHT}
              renderCard={renderCourtCard}
              onIndexChange={setCourtIndex}
            />
            <CarouselDots count={HOME_FAMILIAR_COURTS.length} activeIndex={courtIndex} />
          </View>
        </ScrollView>

        <Pressable
          onPress={() => router.push('/create-session' as never)}
          className="absolute bottom-8 right-5 flex-row items-center rounded-full bg-[#BEF264] px-8 py-5"
          style={{ shadowColor: '#84cc16', shadowOpacity: 0.34, shadowRadius: 24, shadowOffset: { width: 0, height: 16 } }}
        >
          <Plus size={20} color="#000000" strokeWidth={iconStroke} />
          <Text className="ml-3 text-sm font-black uppercase tracking-[2.6px] text-black">Tạo kèo mới</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}
