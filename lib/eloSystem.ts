export type EloLevelId = 'level_1' | 'level_2' | 'level_3' | 'level_4' | 'level_5'
export type EloTier = 'beginner' | 'basic' | 'intermediate' | 'upper_intermediate' | 'advanced' | 'elite'
export type LegacySkillLabel = 'beginner' | 'basic' | 'intermediate' | 'advanced'

export type EloBand = {
  levelId: EloLevelId
  shortLabel: string
  simpleLabel: string
  userDescription: string
  tier: EloTier
  legacySkillLabel: LegacySkillLabel
  eloMin: number
  eloMax: number
  seedElo: number
}

export const ELO_BANDS: EloBand[] = [
  {
    levelId: 'level_1',
    shortLabel: 'Mới chơi',
    simpleLabel: 'Mới chơi',
    userDescription: 'Mới làm quen pickleball, còn đang học luật, giữ bóng và vào nhịp.',
    tier: 'beginner',
    legacySkillLabel: 'beginner',
    eloMin: 800,
    eloMax: 899,
    seedElo: 850,
  },
  {
    levelId: 'level_2',
    shortLabel: 'Cơ bản',
    simpleLabel: 'Cơ bản',
    userDescription: 'Đã chơi được các pha bóng cơ bản, nhưng độ ổn định chưa cao.',
    tier: 'basic',
    legacySkillLabel: 'basic',
    eloMin: 900,
    eloMax: 1049,
    seedElo: 975,
  },
  {
    levelId: 'level_3',
    shortLabel: 'Trung cấp',
    simpleLabel: 'Trung cấp',
    userDescription: 'Đã chơi khá đều, giữ rally tốt và bắt đầu quen nhịp thi đấu.',
    tier: 'intermediate',
    legacySkillLabel: 'intermediate',
    eloMin: 1050,
    eloMax: 1149,
    seedElo: 1100,
  },
  {
    levelId: 'level_4',
    shortLabel: 'Khá',
    simpleLabel: 'Khá',
    userDescription: 'Chơi chắc tay, biết kiểm soát nhiều tình huống và có nhịp trận ổn định.',
    tier: 'upper_intermediate',
    legacySkillLabel: 'intermediate',
    eloMin: 1150,
    eloMax: 1299,
    seedElo: 1225,
  },
  {
    levelId: 'level_5',
    shortLabel: 'Nâng cao',
    simpleLabel: 'Nâng cao',
    userDescription: 'Đánh nghiêm túc, xử lý ổn định dưới áp lực và phù hợp các kèo khó hoặc nhịp nhanh.',
    tier: 'advanced',
    legacySkillLabel: 'advanced',
    eloMin: 1300,
    eloMax: 1449,
    seedElo: 1375,
  },
]

export const CREATE_SESSION_ELO_LEVELS = ELO_BANDS.map((band) => ({ elo: band.seedElo }))

export function getEloBandByLevelId(levelId?: string | null) {
  if (!levelId) return null
  return ELO_BANDS.find((band) => band.levelId === levelId) ?? null
}

export function getEloBandByTier(tier?: string | null) {
  if (!tier) return null
  if (tier === 'elite') return ELO_BANDS[ELO_BANDS.length - 1]
  return ELO_BANDS.find((band) => band.tier === tier) ?? null
}

export function getEloBandByLegacySkillLabel(skillLabel?: string | null) {
  switch (skillLabel) {
    case 'beginner':
      return ELO_BANDS[0]
    case 'basic':
      return ELO_BANDS[1]
    case 'advanced':
      return ELO_BANDS[4]
    case 'intermediate':
    default:
      return ELO_BANDS[2]
  }
}

export function getEloBandForElo(elo?: number | null) {
  if (elo == null) return null
  if (elo <= ELO_BANDS[0].eloMin) return ELO_BANDS[0]
  if (elo >= ELO_BANDS[ELO_BANDS.length - 1].eloMax) return ELO_BANDS[ELO_BANDS.length - 1]
  return ELO_BANDS.find((band) => elo >= band.eloMin && elo <= band.eloMax) ?? ELO_BANDS[0]
}

export function getEloBandForSessionRange(eloMin: number, eloMax: number) {
  const midpoint = Math.round((eloMin + eloMax) / 2)
  return getEloBandForElo(midpoint) ?? ELO_BANDS[2]
}

export function getLevelIdForElo(elo: number): EloLevelId {
  return (getEloBandForElo(elo) ?? ELO_BANDS[2]).levelId
}

export function getTierForElo(elo: number): EloTier {
  return (getEloBandForElo(elo) ?? ELO_BANDS[2]).tier
}

export function getLegacySkillLabelForTier(tier: string): LegacySkillLabel {
  return (getEloBandByTier(tier) ?? ELO_BANDS[2]).legacySkillLabel
}

export function getSimpleTierLabel(tier: string) {
  if (tier === 'elite') return 'Nâng cao'
  return (getEloBandByTier(tier) ?? ELO_BANDS[2]).simpleLabel
}

export function getShortLabelForLevelId(levelId?: string | null) {
  return (getEloBandByLevelId(levelId) ?? ELO_BANDS[2]).shortLabel
}

export function getUserDescriptionForLevelId(levelId?: string | null) {
  return (getEloBandByLevelId(levelId) ?? ELO_BANDS[2]).userDescription
}

export function getUserDescriptionForTier(tier?: string | null) {
  return (getEloBandByTier(tier) ?? ELO_BANDS[2]).userDescription
}

export function getEloRangeForLevel(levelId: EloLevelId) {
  const band = getEloBandByLevelId(levelId) ?? ELO_BANDS[2]
  return { elo_min: band.eloMin, elo_max: band.eloMax }
}
