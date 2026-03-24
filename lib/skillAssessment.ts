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
    title: 'Mới bóc tem',
    subtitle: 'Newbie',
    dupr: 'DUPR: Dưới 2.5',
    description:
      'Mới cầm vợt được vài buổi. Thường xuyên đánh hụt bóng hoặc đánh bóng bay ra ngoài sân. Chưa rành luật tính điểm và hay đứng sai vị trí.',
    starting_elo: 800,
    legacy_skill_label: 'beginner',
  },
  {
    id: 'level_2',
    title: 'Biết điều bóng',
    subtitle: 'Beginner',
    dupr: 'DUPR: 2.5 - 3.0',
    description:
      'Đã biết giao bóng qua lưới an toàn. Có thể đánh qua lại (rally) liên tục ở tốc độ chậm. Rất hay đánh hỏng khi đối thủ vung vợt đánh mạnh hoặc bóng đi chìm.',
    starting_elo: 1000,
    legacy_skill_label: 'basic',
  },
  {
    id: 'level_3',
    title: 'Chiến thần cọ xát',
    subtitle: 'Lower Intermediate',
    dupr: 'DUPR: 3.25 - 3.5',
    description:
      'Đánh bóng qua lại tự tin ở tốc độ khá. Rất thích đứng cuối sân đánh mạnh (Banger/Drive). Đang tập tành lên lưới gò bóng ngắn (Dink) nhưng tỷ lệ tự đánh hỏng vẫn còn cao. Hay luống cuống với quả thứ 3 (3rd shot drop).',
    starting_elo: 1150,
    legacy_skill_label: 'intermediate',
  },
  {
    id: 'level_4',
    title: 'Tay vợt phong trào',
    subtitle: 'Upper Intermediate',
    dupr: 'DUPR: 3.75 - 4.25',
    description:
      'Kỹ thuật toàn diện. Làm chủ được kỹ thuật Dink trên lưới, biết lốp bóng qua đầu và đập bóng (Smash) uy lực. Giao tiếp nhịp nhàng, biết cách lót bóng che lỗi cho đồng đội.',
    starting_elo: 1300,
    legacy_skill_label: 'intermediate',
  },
  {
    id: 'level_5',
    title: 'Thợ săn giải thưởng',
    subtitle: 'Advanced',
    dupr: 'DUPR: 4.5 trở lên',
    description:
      'Từng có giải phong trào hoặc bán chuyên. Kiểm soát nhịp độ trận đấu cực tốt, không mắc lỗi tự đánh hỏng vô duyên. Sở hữu các cú đánh mang tính sát thương và chiến thuật dồn ép đối thủ rõ ràng.',
    starting_elo: 1500,
    legacy_skill_label: 'advanced',
  },
]

export function getSkillLevelById(levelId?: string | null) {
  if (!levelId) return null
  return SKILL_ASSESSMENT_LEVELS.find((item) => item.id === levelId) ?? null
}

export function getSkillLevelFromLegacyLabel(skillLabel?: string | null) {
  switch (skillLabel) {
    case 'beginner':
      return SKILL_ASSESSMENT_LEVELS[0]
    case 'basic':
      return SKILL_ASSESSMENT_LEVELS[1]
    case 'advanced':
      return SKILL_ASSESSMENT_LEVELS[4]
    case 'intermediate':
    default:
      return SKILL_ASSESSMENT_LEVELS[2]
  }
}

export function getSkillLevelFromPlayer(
  player?: { self_assessed_level?: string | null; skill_label?: string | null } | null
) {
  return (
    getSkillLevelById(player?.self_assessed_level) ??
    getSkillLevelFromLegacyLabel(player?.skill_label)
  )
}

export function getSkillLevelFromElo(elo?: number | null) {
  if (elo == null) return null
  if (elo < 900) return SKILL_ASSESSMENT_LEVELS[0]
  if (elo < 1075) return SKILL_ASSESSMENT_LEVELS[1]
  if (elo < 1250) return SKILL_ASSESSMENT_LEVELS[2]
  if (elo < 1450) return SKILL_ASSESSMENT_LEVELS[3]
  return SKILL_ASSESSMENT_LEVELS[4]
}

export function getSkillLevelFromEloRange(eloMin: number, eloMax: number) {
  if (eloMax <= 850) return SKILL_ASSESSMENT_LEVELS[0]
  if (eloMax <= 1050) return SKILL_ASSESSMENT_LEVELS[1]
  if (eloMax <= 1200) return SKILL_ASSESSMENT_LEVELS[2]
  if (eloMax <= 1400) return SKILL_ASSESSMENT_LEVELS[3]
  return SKILL_ASSESSMENT_LEVELS[4]
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
  player?: { self_assessed_level?: string | null; skill_label?: string | null } | null
) {
  return (
    getSkillScoreFromLevelId(player?.self_assessed_level) ??
    getSkillScoreFromLegacyLabel(player?.skill_label)
  )
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
    elo: level.starting_elo,
  }

  const { error } = await supabase.from('players').update(updates).eq('id', user.id)

  if (error) {
    throw new Error(error.message)
  }
}
