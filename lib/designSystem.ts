export const appColors = {
  bg: 'bg-stone-100',
  surface: 'bg-white',
  surfaceMuted: 'bg-slate-50',
  ink: 'text-slate-900',
  inkSoft: 'text-slate-600',
  line: 'border-slate-200',
  brand: 'bg-emerald-600',
  brandSoft: 'bg-emerald-50',
  brandText: 'text-emerald-700',
}

export const badgeToneClasses = {
  success: {
    wrap: 'bg-emerald-100',
    text: 'text-emerald-700',
  },
  warning: {
    wrap: 'bg-amber-100',
    text: 'text-amber-700',
  },
  danger: {
    wrap: 'bg-rose-100',
    text: 'text-rose-700',
  },
  info: {
    wrap: 'bg-sky-100',
    text: 'text-sky-700',
  },
  neutral: {
    wrap: 'bg-slate-100',
    text: 'text-slate-700',
  },
} as const

export type BadgeTone = keyof typeof badgeToneClasses
