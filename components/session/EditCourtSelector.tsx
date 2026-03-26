import { useEffect, useState } from 'react'

import { CourtSelectorCard } from '@/components/create-session/CourtSelectorCard'
import type { NearByCourt } from '@/lib/useNearbyCourts'
import { useNearbyCourts } from '@/lib/useNearbyCourts'

type Props = {
  selectedCourt: NearByCourt | null
  onCourtSelect: (court: NearByCourt) => void
}

export function EditCourtSelector({ selectedCourt, onCourtSelect }: Props) {
  const { courts, loading, fallbackMode, keyword, setKeyword, searching } = useNearbyCourts()
  const [isChoosingCourt, setIsChoosingCourt] = useState(!selectedCourt)

  useEffect(() => {
    if (!selectedCourt) {
      setIsChoosingCourt(true)
    }
  }, [selectedCourt])

  return (
    <CourtSelectorCard
      courts={courts}
      loadingCourts={loading}
      fallbackMode={fallbackMode}
      keyword={keyword}
      setKeyword={setKeyword}
      searching={searching}
      selectedCourt={selectedCourt}
      isChoosingCourt={isChoosingCourt}
      onCourtSelect={(court) => {
        onCourtSelect(court)
        setIsChoosingCourt(false)
      }}
      onChangeCourt={() => setIsChoosingCourt((prev) => !prev)}
      title={'\u0110\u1ecba \u0111i\u1ec3m'}
    />
  )
}
