import { getLegacySkillLabelForTier, getLevelIdForElo, getSimpleTierLabel, getTierForElo } from './eloSystem'

export type OnboardingQuestionId =
  | 'time_playing'
  | 'sport_background'
  | 'rally'
  | 'kitchen'
  | 'overhead'
  | 'win_rate'
  | 'play_preference'

export type OnboardingOption = {
  label: string
  score: number
}

export type OnboardingQuestion = {
  id: OnboardingQuestionId
  question: string
  subtitle?: string
  options: OnboardingOption[]
  noScore?: boolean
}

export const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
  {
    id: 'time_playing',
    question: 'Bạn đã chơi pickleball bao lâu?',
    options: [
      { label: 'Chưa lần nào', score: 0 },
      { label: 'Mới thử 1–2 lần', score: 10 },
      { label: 'Được vài tháng rồi', score: 25 },
      { label: 'Hơn 1 năm', score: 40 },
      { label: 'Chơi lâu, khá đều', score: 55 },
    ],
  },
  {
    id: 'sport_background',
    question: 'Bạn có nền tảng môn vợt nào không?',
    subtitle: 'Cầu lông, tennis, bóng bàn... giúp làm quen pickleball nhanh hơn',
    options: [
      { label: 'Không có', score: 0 },
      { label: 'Bóng bàn', score: 15 },
      { label: 'Cầu lông', score: 20 },
      { label: 'Tennis', score: 10 },
      { label: 'Môn khác', score: 5 },
    ],
  },
  {
    id: 'rally',
    question: 'Khi đánh bóng qua lưới, bạn thấy mình thế nào?',
    subtitle: 'Rally = đánh qua đánh lại nhiều lần mà không rớt bóng',
    options: [
      { label: 'Hay đánh hỏng, bóng vào lưới hoặc ra ngoài', score: 0 },
      { label: 'Qua lưới được nhưng chưa ổn định', score: 15 },
      { label: 'Rally ổn, kiểm soát được hướng bóng', score: 30 },
      { label: 'Chủ động chọn góc, ít mắc lỗi', score: 45 },
    ],
  },
  {
    id: 'kitchen',
    question: 'Bạn xử lý bóng ở kitchen như thế nào?',
    subtitle: 'Kitchen = vùng sát lưới 2 bên — nơi diễn ra hầu hết điểm quyết định. Dink = đánh nhẹ, thấp qua lưới',
    options: [
      { label: 'Chưa rõ luật vùng này', score: 0 },
      { label: 'Biết luật nhưng hay bị lỗi', score: 10 },
      { label: 'Dink tương đối ổn', score: 25 },
      { label: 'Kiểm soát tốt, tạo áp lực được', score: 40 },
    ],
  },
  {
    id: 'overhead',
    question: 'Khi bóng lob cao qua đầu, bạn xử lý sao?',
    subtitle: 'Lob = đối thủ đánh bóng vọt cao qua đầu bạn. Overhead smash = đập bóng từ trên xuống',
    options: [
      { label: 'Chạy không kịp hoặc đánh hỏng', score: 0 },
      { label: 'Chạy được nhưng trả bóng yếu', score: 10 },
      { label: 'Overhead smash được, đôi khi chưa ổn', score: 20 },
      { label: 'Smash chủ động, chọn góc tốt', score: 30 },
    ],
  },
  {
    id: 'win_rate',
    question: 'Bạn thường thắng hay thua khi chơi?',
    options: [
      { label: 'Chủ yếu thua, đang học', score: 0 },
      { label: 'Thua nhiều hơn thắng', score: 15 },
      { label: 'Thắng thua ngang nhau', score: 25 },
      { label: 'Thắng nhiều trong nhóm hay chơi', score: 35 },
      { label: 'Thường thắng, đã thử ở giải phong trào', score: 50 },
    ],
  },
  {
    id: 'play_preference',
    question: 'Bạn muốn ghép kèo với ai?',
    subtitle: 'Dùng để tìm kèo phù hợp hơn cho bạn',
    options: [
      { label: 'Người mới như mình để cùng học', score: 0 },
      { label: 'Người nhỉnh hơn để tiến bộ nhanh', score: 0 },
      { label: 'Ai cũng được, miễn vui', score: 0 },
      { label: 'Người cùng trình để đánh nghiêm túc', score: 0 },
    ],
    noScore: true,
  },
]

export type OnboardingAnswers = Partial<Record<OnboardingQuestionId, number>>
export type OnboardingLabels = Partial<Record<OnboardingQuestionId, string>>

export function calculateInitialElo(
  answers: OnboardingAnswers,
  timePlaying: string,
  preference: string
): {
  elo: number
  tier: string
  preference: string
} {
  const totalScore = Object.entries(answers)
    .filter(([key]) => key !== 'play_preference')
    .reduce((sum, [, score]) => sum + (score ?? 0), 0)

  let elo: number
  if (totalScore <= 35) elo = 800
  else if (totalScore <= 70) elo = 900
  else if (totalScore <= 105) elo = 1000
  else if (totalScore <= 140) elo = 1100
  else if (totalScore <= 180) elo = 1200
  else if (totalScore <= 215) elo = 1300
  else elo = 1375

  const ceilings: Record<string, number> = {
    'Chưa lần nào': 900,
    'Mới thử 1–2 lần': 1050,
    'Được vài tháng rồi': 1200,
    'Hơn 1 năm': 1350,
    'Chơi lâu, khá đều': 1425,
  }

  const ceiling = ceilings[timePlaying] ?? 1350
  elo = Math.min(elo, ceiling)

  return { elo, tier: getTierForElo(elo), preference }
}

export function getSelfAssessedLevelForElo(elo: number): 'level_1' | 'level_2' | 'level_3' | 'level_4' | 'level_5' {
  return getLevelIdForElo(elo)
}

export { getLegacySkillLabelForTier, getSimpleTierLabel }
