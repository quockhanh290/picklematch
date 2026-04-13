import {
  getEloBandByLegacySkillLabel,
  getEloBandForElo,
  getEloBandForSessionRange,
  getShortLabelForLevelId,
} from '@/lib/eloSystem'

export type EloPlayer = {
  elo?: number | null
  current_elo?: number | null
}

export type ReliablePlayer = EloPlayer & {
  reliability_score?: number | null
  sessions_joined?: number | null
  no_show_count?: number | null
}

export type SkillPlayer = EloPlayer & {
  self_assessed_level?: string | null
  skill_label?: string | null
}

export type ArrangementSourcePlayer = ReliablePlayer &
  SkillPlayer & {
    name?: string | null
  }

export type ArrangementSessionPlayer = {
  player_id: string
  team_no?: 1 | 2 | null
  player?: ArrangementSourcePlayer | null
}

export type ArrangementHost = ArrangementSourcePlayer & {
  id: string
  name: string
}

export type ArrangementPlayer = {
  id: string
  name: string
  elo: number
  team: 1 | 2
  reliability: number | null
  skillTag: string
}

export type ArrangementSession = {
  host: ArrangementHost
  session_players: ArrangementSessionPlayer[]
}

export function safeNumber(value?: number | null) {
  return Math.round(value ?? 0)
}

export function getComparableElo(player?: EloPlayer | null) {
  return safeNumber(player?.current_elo ?? player?.elo ?? 0)
}

export function getInitials(name?: string | null) {
  return (name ?? '?')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

export function getReliability(player?: ReliablePlayer | null) {
  if (player?.reliability_score != null) return Math.round(player.reliability_score)
  const joined = player?.sessions_joined ?? 0
  if (!joined) return null
  const noShow = player?.no_show_count ?? 0
  return Math.max(0, Math.min(100, Math.round(((joined - noShow) / joined) * 100)))
}

export function getSkillTag(player?: SkillPlayer | null) {
  const levelId = player?.self_assessed_level
  if (levelId) return getShortLabelForLevelId(levelId)

  const legacy = player?.skill_label
  if (legacy) return getEloBandByLegacySkillLabel(legacy).shortLabel

  const elo = getComparableElo(player)
  return getEloBandForElo(elo)?.shortLabel ?? 'Cọ xát'
}

export function getSessionSkillLabel(eloMin: number, eloMax: number) {
  return getEloBandForSessionRange(eloMin, eloMax).shortLabel
}

export function formatTimeRange(start: string, end: string) {
  const startDate = new Date(start)
  const endDate = new Date(end)
  const weekdays = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7']
  const dateLabel = `${String(startDate.getDate()).padStart(2, '0')}/${String(startDate.getMonth() + 1).padStart(2, '0')}`
  const timeLabel = `${String(startDate.getHours()).padStart(2, '0')}:${String(startDate.getMinutes()).padStart(2, '0')} - ${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`
  return `${weekdays[startDate.getDay()]}, ${dateLabel} • ${timeLabel}`
}

export function formatPricePerPerson(totalPrice: number, maxPlayers: number) {
  if (!totalPrice || !maxPlayers) return 'Miễn phí'
  return `${Math.ceil(totalPrice / maxPlayers).toLocaleString('vi-VN')}đ/người`
}

export function buildArrangementPlayers(session: ArrangementSession) {
  const playersById = new Map<string, ArrangementPlayer>()

  playersById.set(session.host.id, {
    id: session.host.id,
    name: session.host.name,
    elo: getComparableElo(session.host),
    reliability: getReliability(session.host),
    skillTag: getSkillTag(session.host),
    team: 1,
  })

  for (const entry of session.session_players ?? []) {
    playersById.set(entry.player_id, {
      id: entry.player_id,
      name: entry.player?.name ?? 'Người chơi',
      elo: getComparableElo(entry.player),
      reliability: getReliability(entry.player),
      skillTag: getSkillTag(entry.player),
      team: entry.team_no === 2 ? 2 : 1,
    })
  }

  const everyone = Array.from(playersById.values())
  const hasPersistedTeams = (session.session_players ?? []).some((entry) => entry.team_no === 1 || entry.team_no === 2)

  if (hasPersistedTeams) {
    return everyone
  }

  const sorted = [...everyone].sort((a, b) => b.elo - a.elo || a.name.localeCompare(b.name, 'vi'))
  const teamMap = new Map<string, 1 | 2>()

  sorted.forEach((player, index) => {
    teamMap.set(player.id, index % 2 === 0 ? 1 : 2)
  })

  return everyone.map((player) => ({
    ...player,
    team: teamMap.get(player.id) ?? 1,
  }))
}

export function autoBalance(players: ArrangementPlayer[]) {
  const sorted = [...players].sort((a, b) => b.elo - a.elo || a.name.localeCompare(b.name, 'vi'))
  let totalA = 0
  let totalB = 0

  return sorted
    .map((player) => {
      const team: 1 | 2 = totalA <= totalB ? 1 : 2
      if (team === 1) totalA += player.elo
      else totalB += player.elo
      return { ...player, team }
    })
    .sort((a, b) => a.name.localeCompare(b.name, 'vi'))
}
