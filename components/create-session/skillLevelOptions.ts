import type { LucideIcon } from 'lucide-react-native'
import { Activity, Diamond, Sparkles, Swords, Trophy } from 'lucide-react-native'
import { PROFILE_THEME_COLORS, PROFILE_THEME_SEMANTIC } from '@/components/profile/profileTheme'

export type CreateSessionSkillOption = {
  id: number
  label: string
  icon: LucideIcon
  activeClassName: string
  textClassName: string
  iconColor: string
  elo: number
  dupr: string
}

export const CREATE_SESSION_SKILL_OPTIONS: CreateSessionSkillOption[] = [
  {
    id: 1,
    label: '\u004d\u1edb\u0069\u0020\u0063\u0068\u01a1\u0069',
    icon: Sparkles,
    activeClassName: 'bg-slate-100 border-slate-300',
    textClassName: 'text-slate-800',
    iconColor: PROFILE_THEME_COLORS.onSurface,
    elo: 800,
    dupr: '2.5',
  },
  {
    id: 2,
    label: '\u0043\u01a1\u0020\u0062\u1ea3\u006e',
    icon: Activity,
    activeClassName: 'bg-emerald-50 border-emerald-300',
    textClassName: 'text-emerald-700',
    iconColor: PROFILE_THEME_SEMANTIC.successText,
    elo: 1000,
    dupr: '3.0',
  },
  {
    id: 3,
    label: '\u0043\u1ecd\u0020\u0078\u00e1\u0074',
    icon: Swords,
    activeClassName: 'bg-violet-50 border-violet-300',
    textClassName: 'text-violet-700',
    iconColor: PROFILE_THEME_COLORS.onSecondaryFixedVariant,
    elo: 1150,
    dupr: '3.5',
  },
  {
    id: 4,
    label: '\u0050\u0068\u006f\u006e\u0067\u0020\u0074\u0072\u00e0\u006f',
    icon: Trophy,
    activeClassName: 'bg-orange-50 border-orange-300',
    textClassName: 'text-orange-700',
    iconColor: PROFILE_THEME_SEMANTIC.warningText,
    elo: 1300,
    dupr: '4.0',
  },
  {
    id: 5,
    label: '\u0053\u0103\u006e\u0020\u0067\u0069\u1ea3\u0069',
    icon: Diamond,
    activeClassName: 'bg-sky-50 border-sky-300',
    textClassName: 'text-sky-700',
    iconColor: PROFILE_THEME_COLORS.onTertiaryFixedVariant,
    elo: 1500,
    dupr: '4.5',
  },
]

export const CREATE_SESSION_SKILL_INACTIVE_CLASSNAME =
  'bg-slate-50 border-slate-200 text-slate-500 opacity-80'

export function getCreateSessionSkillOption(level: number) {
  return CREATE_SESSION_SKILL_OPTIONS.find((option) => option.id === level) ?? CREATE_SESSION_SKILL_OPTIONS[2]
}

