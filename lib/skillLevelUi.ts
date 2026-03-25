import type { LucideIcon } from 'lucide-react-native'
import { Activity, Medal, Sparkles, Swords, Trophy } from 'lucide-react-native'

import type { SkillAssessmentLevel } from './skillAssessment'

type SkillTierUi = {
  shortLabel: string
  icon: LucideIcon
  tagClassName: string
  textClassName: string
  borderClassName: string
  iconColor: string
  heroFrom: string
  heroTo: string
  duprValue: string
}

export const SKILL_LEVEL_UI: Record<SkillAssessmentLevel['id'], SkillTierUi> = {
  level_1: {
    shortLabel: 'Mới chơi',
    icon: Sparkles,
    tagClassName: 'bg-slate-50',
    textClassName: 'text-slate-700',
    borderClassName: 'border-slate-200',
    iconColor: '#334155',
    heroFrom: '#64748b',
    heroTo: '#334155',
    duprValue: '2.5',
  },
  level_2: {
    shortLabel: 'Cơ bản',
    icon: Activity,
    tagClassName: 'bg-emerald-50',
    textClassName: 'text-emerald-700',
    borderClassName: 'border-emerald-200',
    iconColor: '#047857',
    heroFrom: '#10b981',
    heroTo: '#0d9488',
    duprValue: '3.0',
  },
  level_3: {
    shortLabel: 'Cọ xát',
    icon: Swords,
    tagClassName: 'bg-indigo-50',
    textClassName: 'text-indigo-700',
    borderClassName: 'border-indigo-200',
    iconColor: '#4338ca',
    heroFrom: '#6366f1',
    heroTo: '#7c3aed',
    duprValue: '3.5',
  },
  level_4: {
    shortLabel: 'Phong trào',
    icon: Medal,
    tagClassName: 'bg-amber-50',
    textClassName: 'text-amber-700',
    borderClassName: 'border-amber-200',
    iconColor: '#b45309',
    heroFrom: '#f59e0b',
    heroTo: '#ea580c',
    duprValue: '4.0',
  },
  level_5: {
    shortLabel: 'Săn giải',
    icon: Trophy,
    tagClassName: 'bg-sky-50',
    textClassName: 'text-sky-700',
    borderClassName: 'border-sky-200',
    iconColor: '#0369a1',
    heroFrom: '#0ea5e9',
    heroTo: '#2563eb',
    duprValue: '4.5',
  },
}

export function getSkillLevelUi(levelId?: SkillAssessmentLevel['id'] | null) {
  if (!levelId) return SKILL_LEVEL_UI.level_3
  return SKILL_LEVEL_UI[levelId] ?? SKILL_LEVEL_UI.level_3
}

export function getSkillTargetElo(eloMin: number, eloMax: number) {
  return Math.round((eloMin + eloMax) / 2)
}
