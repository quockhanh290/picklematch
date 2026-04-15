import {
  ELO_BANDS,
  getEloBandByLegacySkillLabel,
  getEloBandByTier,
  getEloBandForElo,
  getEloBandForSessionRange,
  getShortLabelForLevelId,
} from './eloSystem'
import { supabase } from './supabase'

export type SkillAssessmentLevel = {
  id: 'level_1' | 'level_2' | 'level_3' | 'level_4' | 'level_5'
  title: string
  subtitle: string
  dupr: string
  description: string
  starting_elo: number
  legacy_skill_label: 'beginner' | 'basic' | 'intermediate' | 'advanced'
}

export const SKILL_ASSESSMENT_LEVELS: SkillAssessmentLevel[] = [
  {
    id: 'level_1',
    title: 'Mới chơi',
    subtitle: 'Bắt đầu làm quen',
    dupr: 'DUPR: Dưới 2.5',
    description: 'Mới làm quen pickleball, còn đang học luật, giữ bóng và vào nhịp.',
    starting_elo: ELO_BANDS[0].seedElo,
    legacy_skill_label: 'beginner',
  },
  {
    id: 'level_2',
    title: 'Cơ bản',
    subtitle: 'Đã chơi những pha cơ bản',
    dupr: 'DUPR: 2.5 - 3.0',
    description: 'Đã chơi được các pha bóng cơ bản, nhưng độ ổn định chưa cao.',
    starting_elo: ELO_BANDS[1].seedElo,
    legacy_skill_label: 'basic',
  },
  {
    id: 'level_3',
    title: 'Trung cấp',
    subtitle: 'Đã vào nhịp thi đấu',
    dupr: 'DUPR: 3.25 - 3.5',
    description: 'Đã chơi khá đều, giữ rally tốt và bắt đầu quen nhịp thi đấu.',
    starting_elo: ELO_BANDS[2].seedElo,
    legacy_skill_label: 'intermediate',
  },
  {
    id: 'level_4',
    title: 'Khá',
    subtitle: 'Kiểm soát được nhiều tình huống',
    dupr: 'DUPR: 3.75 - 4.25',
    description: 'Chơi chắc tay, biết kiểm soát nhiều tình huống và có nhịp trận ổn định.',
    starting_elo: ELO_BANDS[3].seedElo,
    legacy_skill_label: 'intermediate',
  },
  {
    id: 'level_5',
    title: 'Nâng cao',
    subtitle: 'Chơi nghiêm túc, chịu áp lực tốt',
    dupr: 'DUPR: 4.5 trở lên',
    description: 'Đánh nghiêm túc, xử lý ổn định dưới áp lực và phù hợp các kèo khó hoặc nhịp nhanh.',
    starting_elo: ELO_BANDS[4].seedElo,
    legacy_skill_label: 'advanced',
  },
]

export function getSkillLevelById(levelId?: string | null) {
  if (!levelId) return null
  return SKILL_ASSESSMENT_LEVELS.find((item) => item.id === levelId) ?? null
}

export function getSkillLevelFromLegacyLabel(skillLabel?: string | null) {
  const band = getEloBandByLegacySkillLabel(skillLabel)
  return getSkillLevelById(band.levelId) ?? SKILL_ASSESSMENT_LEVELS[2]
}

export function getSkillLevelFromTier(skillTier?: string | null) {
  const band = getEloBandByTier(skillTier)
  return getSkillLevelById(band?.levelId) ?? null
}

export function getSkillLevelFromPlayer(
  player?: {
    self_assessed_level?: string | null
    skill_tier?: string | null
    current_elo?: number | null
    elo?: number | null
    skill_label?: string | null
  } | null,
) {
  return (
    getSkillLevelById(player?.self_assessed_level) ??
    getSkillLevelFromTier(player?.skill_tier) ??
    getSkillLevelFromElo(player?.current_elo ?? player?.elo) ??
    getSkillLevelFromLegacyLabel(player?.skill_label)
  )
}

export function getSkillLevelFromElo(elo?: number | null) {
  if (elo == null) return null
  const band = getEloBandForElo(elo)
  return getSkillLevelById(band?.levelId) ?? SKILL_ASSESSMENT_LEVELS[2]
}

export function getSkillLevelFromEloRange(eloMin: number, eloMax: number) {
  const band = getEloBandForSessionRange(eloMin, eloMax)
  return getSkillLevelById(band?.levelId) ?? SKILL_ASSESSMENT_LEVELS[2]
}

export function getShortSkillLabel(level?: SkillAssessmentLevel | null) {
  return getShortLabelForLevelId(level?.id)
}

export function getSkillScoreFromLevelId(levelId?: string | null) {
  const level = getSkillLevelById(levelId)
  if (!level) return null
  return SKILL_ASSESSMENT_LEVELS.findIndex((item) => item.id === level.id) + 1
}

export function getSkillScoreFromLegacyLabel(skillLabel?: string | null) {
  const level = getSkillLevelFromLegacyLabel(skillLabel)
  return SKILL_ASSESSMENT_LEVELS.findIndex((item) => item.id === level.id) + 1
}

export function getSkillScoreFromPlayer(
  player?: {
    self_assessed_level?: string | null
    skill_tier?: string | null
    current_elo?: number | null
    elo?: number | null
    skill_label?: string | null
  } | null,
) {
  const level = getSkillLevelFromPlayer(player)
  return level ? SKILL_ASSESSMENT_LEVELS.findIndex((item) => item.id === level.id) + 1 : null
}

export async function fetchFavoriteCourts(ids?: string[] | null) {
  const courtIds = (ids ?? []).filter(Boolean)
  if (!courtIds.length) return []

  const { data, error } = await supabase.from('courts').select('id, name, district, city').in('id', courtIds)
  if (error) throw error

  const order = new Map(courtIds.map((id, index) => [id, index]))
  return [...(data ?? [])].sort((left, right) => (order.get(left.id) ?? 0) - (order.get(right.id) ?? 0))
}
