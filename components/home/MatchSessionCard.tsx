import React from 'react'
import type { MatchSession } from '@/lib/homeFeed'
import { HeroMatchSessionCard } from './match-card/HeroMatchSessionCard'
import { SuggestedSessionCard } from './match-card/SuggestedSessionCard'
import { UrgentFillCard } from './match-card/UrgentFillCard'
import { SessionListCard } from './match-card/SessionListCard'

export const SMART_MATCH_CARD_HEIGHT = 380

export function MatchSessionCard({
  item,
  variant,
  actionLabel,
  accentMode = 'default',
  showFullAddress,
}: {
  item: MatchSession
  variant: 'hero' | 'smart' | 'standard'
  actionLabel: string
  accentMode?: 'default' | 'rescue'
  showFullAddress?: boolean
}) {
  if (variant === 'hero') {
    return <HeroMatchSessionCard item={item} actionLabel={actionLabel} />
  }

  if (accentMode === 'default') {
    return <SuggestedSessionCard item={item} showFullAddress={showFullAddress} />
  }

  if (accentMode === 'rescue') {
    return <UrgentFillCard item={item} />
  }

  return <SessionListCard item={item} actionLabel={actionLabel} accentMode={accentMode} />
}
