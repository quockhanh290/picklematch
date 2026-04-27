/**
 * Shared spatial design tokens — single source of truth for layout, shape, and shadow.
 * Standard reference: MatchSessionCard (home feed hero card).
 *
 * Usage:
 *   import { RADIUS, SHADOW, SPACING, BORDER, BUTTON } from '@/constants/screenLayout'
 */

// ─── Border Radius ────────────────────────────────────────────────────────────

export const RADIUS = {
  /** 6 — inline tag, score badge, tiny chip */
  xs: 6,
  /** 10 — small info card, streak badge */
  sm: 10,
  /** 14 — input field, dialog, time block, SessionCard outline */
  md: 14,
  /** 20 — inner info block, PlayerRoster section box, JoinRequestModal fields */
  lg: 20,
  /** 24 — inner card block (MatchSessionCard bottom panel, FamiliarCourtCard info) */
  xl: 24,
  /** 32 — card container standard (MatchSessionCard, FamiliarCourtCard, JoinRequestModal modal) */
  hero: 32,
  /** 999 — pill chip, avatar, dot, progress bar */
  full: 999,
} as const

// ─── Shadow ───────────────────────────────────────────────────────────────────

export const SHADOW = {
  /** Header, divider — no visual lift */
  none: {
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  /** Ambient lift — ScreenHeader, profile history rows */
  xs: {
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  /** Standard card — MatchSessionCard, BookingDetailsCard, SessionCard */
  sm: {
    shadowOpacity: 0.06,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  /** Elevated card — FamiliarCourtCard info, Modal, PendingRequestsWidget */
  md: {
    shadowOpacity: 0.08,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  /** Feature highlight — FamiliarCourtCard outer card */
  lg: {
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 5,
  },
  /** FAB / floating action button — prominent glow */
  fab: {
    shadowOpacity: 0.28,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
    elevation: 8,
  },
} as const

// ─── Spacing ──────────────────────────────────────────────────────────────────

export const SPACING = {
  /** 6 — gap between icon and text, tiny chip padding */
  xs: 6,
  /** 10 — inner chip/badge padding, compact row gap */
  sm: 10,
  /** 14 — default inner card padding, compact section spacing */
  md: 14,
  /** 18 — section card padding (Create Session blocks) */
  lg: 18,
  /** 20 — screen horizontal padding, card outer padding */
  xl: 20,
  /** 28 — bottom bar safe area padding */
  xxl: 28,
} as const

// ─── Border ───────────────────────────────────────────────────────────────────

export const BORDER = {
  /** 0.5 — row divider, progress track */
  hairline: 0.5,
  /** 1 — default chip/card border */
  base: 1,
  /** 1.5 — CTA secondary button, dashed empty slot */
  medium: 1.5,
  /** 2 — avatar stack separator, active slot ring */
  thick: 2,
  /** 3 — strong active state highlight */
  heavy: 3,
} as const

// ─── Button ───────────────────────────────────────────────────────────────────

export const BUTTON = {
  /** Full-width primary CTA (Tạo kèo, Tiếp tục, Vào kèo) */
  primary: {
    borderRadius: RADIUS.full,
    paddingVertical: 13,
    paddingHorizontal: SPACING.xl,
  },
  /** Full-width secondary outline (Quay lại) */
  secondary: {
    borderRadius: RADIUS.full,
    paddingVertical: 13,
    paddingHorizontal: SPACING.xl,
    borderWidth: BORDER.medium,
  },
  /** Inline pill button (Vào kèo label on card) */
  pill: {
    borderRadius: RADIUS.full,
    paddingVertical: 8,
    paddingHorizontal: SPACING.md,
  },
  /** Compact pill chip (filter, skill selector, deadline option) */
  pillSm: {
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
} as const

export type RadiusKey = keyof typeof RADIUS
export type ShadowKey = keyof typeof SHADOW
export type SpacingKey = keyof typeof SPACING
export type BorderKey = keyof typeof BORDER
export type ButtonKey = keyof typeof BUTTON
