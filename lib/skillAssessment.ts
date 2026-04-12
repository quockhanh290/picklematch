import { supabase } from './supabase'
import {
  ELO_BANDS,
  getEloBandByLevelId,
  getEloBandByLegacySkillLabel,
  getEloBandByTier,
  getEloBandForElo,
  getEloBandForSessionRange,
  getShortLabelForLevelId,
} from './eloSystem'

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
    title: 'Mới bóc tem',
    subtitle: 'Newbie',
    dupr: 'DUPR: Dưới 2.5',
    description:
      'Mới làm quen pickleball, còn đang học luật, giữ bóng và vào nhịp.',
    starting_elo: ELO_BANDS[0].seedElo,
    legacy_skill_label: 'beginner',
  },
  {
    id: 'level_2',
    title: 'Biết điều bóng',
    subtitle: 'Beginner',
    dupr: 'DUPR: 2.5 - 3.0',
    description:
      'Đã chơi được các pha bóng cơ bản, nhưng độ ổn định chưa cao.',
    starting_elo: ELO_BANDS[1].seedElo,
    legacy_skill_label: 'basic',
  },
  {
    id: 'level_3',
    title: 'Chiến thần cọ xát',
    subtitle: 'Lower Intermediate',
    dupr: 'DUPR: 3.25 - 3.5',
    description:
      'Đã đánh khá đều, giữ rally tốt và bắt đầu quen nhịp thi đấu.',
    starting_elo: ELO_BANDS[2].seedElo,
    legacy_skill_label: 'intermediate',
  },
  {
    id: 'level_4',
    title: 'Tay vợt phong trào',
    subtitle: 'Upper Intermediate',
    dupr: 'DUPR: 3.75 - 4.25',
    description:
      'Chơi chắc tay, biết kiểm soát nhiều tình huống và đánh cân với nhóm phong trào mạnh.',
    starting_elo: ELO_BANDS[3].seedElo,
    legacy_skill_label: 'intermediate',
  },
  {
    id: 'level_5',
    title: 'Thợ săn giải thưởng',
    subtitle: 'Advanced',
    dupr: 'DUPR: 4.5 trở lên',
    description:
      'Đánh nghiêm túc, xử lý ổn định dưới áp lực và có thể chơi ở mặt bằng giải phong trào.',
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
  } | null
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
  } | null
) {
  const level = getSkillLevelFromPlayer(player)
  return level ? SKILL_ASSESSMENT_LEVELS.findIndex((item) => item.id === level.id) + 1 : null
}

export function getSkillScoreFromEloRange(eloMin: number, eloMax: number) {
  const level = getSkillLevelFromEloRange(eloMin, eloMax)
  return SKILL_ASSESSMENT_LEVELS.findIndex((item) => item.id === level.id) + 1
}

export async function saveSkillAssessment(levelId: SkillAssessmentLevel['id']) {
  const level = SKILL_ASSESSMENT_LEVELS.find((item) => item.id === levelId)

  if (!level) {
    throw new Error('Mức trình độ không hợp lệ.')
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    throw new Error(userError?.message ?? 'Không tìm thấy tài khoản hiện tại.')
  }

  const updates = {
    self_assessed_level: level.id,
    current_elo: level.starting_elo,
    is_provisional: true,
    placement_matches_played: 0,
    skill_label: level.legacy_skill_label,
    skill_tier: getEloBandByLevelId(level.id)?.tier ?? 'intermediate',
    elo: level.starting_elo,
  }

  const { error } = await supabase.from('players').update(updates).eq('id', user.id)

  if (error) {
    throw new Error(error.message)
  }
}
