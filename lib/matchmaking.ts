export type MatchStatus = 'WAITLIST' | 'MATCHED' | 'LOWER_SKILL'

export function getMatchStatus(
  userElo: number,
  matchElo: number,
  currentSlots: number,
  maxSlots: number
): MatchStatus {
  if (currentSlots >= maxSlots) return 'WAITLIST'
  if (userElo >= matchElo) return 'MATCHED'
  return 'LOWER_SKILL'
}
