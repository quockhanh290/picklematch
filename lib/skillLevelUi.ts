import type { LucideIcon } from 'lucide-react-native'
import { Activity, Medal, Sparkles, Swords, Trophy } from 'lucide-react-native'
import { PROFILE_THEME_COLORS, PROFILE_THEME_SEMANTIC } from '@/constants/theme/profileTheme'

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
    iconColor: PROFILE_THEME_COLORS.onSurfaceVariant,
    heroFrom: PROFILE_THEME_COLORS.outline,
    heroTo: PROFILE_THEME_COLORS.onSurfaceVariant,
    duprValue: '2.5',
  },
  level_2: {
    shortLabel: 'Cơ bản',
    icon: Activity,
    tagClassName: 'bg-emerald-50',
    textClassName: 'text-emerald-700',
    borderClassName: 'border-emerald-200',
    iconColor: PROFILE_THEME_SEMANTIC.successText,
    heroFrom: PROFILE_THEME_COLORS.surfaceTint,
    heroTo: PROFILE_THEME_COLORS.primaryContainer,
    duprValue: '3.0',
  },
  level_3: {
    shortLabel: 'Trung cấp',
    icon: Swords,
    tagClassName: 'bg-indigo-50',
    textClassName: 'text-indigo-700',
    borderClassName: 'border-indigo-200',
    iconColor: PROFILE_THEME_COLORS.onSecondaryFixedVariant,
    heroFrom: PROFILE_THEME_COLORS.secondary,
    heroTo: PROFILE_THEME_COLORS.onSecondaryFixedVariant,
    duprValue: '3.5',
  },
  level_4: {
    shortLabel: 'Khá',
    icon: Medal,
    tagClassName: 'bg-amber-50',
    textClassName: 'text-amber-700',
    borderClassName: 'border-amber-200',
    iconColor: PROFILE_THEME_SEMANTIC.warningText,
    heroFrom: PROFILE_THEME_SEMANTIC.warningStrong,
    heroTo: PROFILE_THEME_SEMANTIC.warningText,
    duprValue: '4.0',
  },
  level_5: {
    shortLabel: 'Nâng cao',
    icon: Trophy,
    tagClassName: 'bg-sky-50',
    textClassName: 'text-sky-700',
    borderClassName: 'border-sky-200',
    iconColor: PROFILE_THEME_COLORS.onTertiaryFixedVariant,
    heroFrom: PROFILE_THEME_COLORS.tertiaryFixed,
    heroTo: PROFILE_THEME_COLORS.tertiaryContainer,
    duprValue: '4.5',
  },
}

export function getSkillLevelUi(levelId?: SkillAssessmentLevel['id'] | null) {
  if (!levelId) return SKILL_LEVEL_UI.level_1
  return SKILL_LEVEL_UI[levelId] ?? SKILL_LEVEL_UI.level_1
}

export function getSkillTargetElo(eloMin: number, eloMax: number) {
  return Math.round((eloMin + eloMax) / 2)
}
