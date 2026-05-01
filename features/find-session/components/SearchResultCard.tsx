import React from 'react'
import * as Location from 'expo-location'
import { router } from 'expo-router'
import SessionCard from '@/components/sessions/SessionCard'
import { getSkillLevelFromEloRange, getSkillScoreFromLevelId } from '@/lib/skillAssessment'
import { haversineKm } from '@/lib/useNearbyCourts'
import { Session } from '../types'
import { getCardStatus, extractDistrict } from '../utils'

type SearchResultCardProps = {
  session: Session
  userLocation: Location.LocationObject | null
}

export function SearchResultCard({ session, userLocation }: SearchResultCardProps) {
  const court = session.slot?.court
  const district = extractDistrict(court?.address) ?? court?.city ?? 'Khu vuc chua ro'
  const fullAddress = court?.address?.trim() || district
  const skill = getSkillLevelFromEloRange(session.elo_min, session.elo_max)
  const hostName = session.host?.name ?? 'An danh'
  const hostInitial = hostName.slice(0, 1).toUpperCase()
  const startTime = new Date(session.slot?.start_time ?? new Date().toISOString())
  const endTime = new Date(session.slot?.end_time ?? new Date().toISOString())
  const pricePerPlayer = session.max_players > 0 ? Math.round((session.slot?.price ?? 0) / session.max_players) : 0
  const status = getCardStatus(session)
  const distance = session.lat != null && session.lng != null && userLocation 
    ? haversineKm(userLocation.coords.latitude, userLocation.coords.longitude, session.lat, session.lng)
    : undefined

  const openSessionDetail = () =>
    router.push({
      pathname: '/session/[id]',
      params: { id: session.id, navStartedAt: String(Date.now()), navSource: 'find-session' },
    })

  return (
    <SessionCard
      session={{
        id: session.id,
        courtName: court?.name ?? 'Keo Pickleball',
        courtAddress: fullAddress,
        distanceKm: distance,
        courtBookingConfirmed: session.court_booking_status === 'confirmed',
        startTime,
        endTime,
        level: String(getSkillScoreFromLevelId(skill.id) ?? 3),
        levelDescription: skill.title,
        levelMatchesUser: true,
        host: {
          id: session.host?.id ?? `host-${session.id}`,
          name: hostName,
          initial: hostInitial || '?',
        },
        enrolledCount: session.player_count,
        capacity: session.max_players,
        pricePerPerson: pricePerPlayer,
        status,
      }}
      onPress={openSessionDetail}
      onJoinPress={openSessionDetail}
    />
  )
}
