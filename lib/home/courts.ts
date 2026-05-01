import type { HomeSessionRecord, FamiliarCourt } from './types'
import { COURT_FALLBACK_IMAGES } from './formatters'

type FavoriteCourtMeta = {
  id: string
  name?: string | null
  address?: string | null
  city?: string | null
}

export function buildLiveFamiliarCourts(
  sessions: HomeSessionRecord[],
  options?: {
    favoriteCourtIds?: string[] | null
    favoriteCourtsMeta?: FavoriteCourtMeta[]
  },
): FamiliarCourt[] {
  const grouped = new Map<string, { id: string; name: string; area: string; openMatches: number; thumbnail_url?: string | null; rating?: number | null; rating_count?: number | null }>()

  sessions.forEach((session) => {
    const court = session.slot?.court
    if (!court) return

    const current = grouped.get(court.id)
    if (current) {
      current.openMatches += 1
      return
    }

    grouped.set(court.id, {
      id: court.id,
      name: court.name,
      area: court.city || court.address,
      openMatches: 1,
      thumbnail_url: court.thumbnail_url,
      rating: court.rating,
      rating_count: court.rating_count,
    })
  })

  const buildCourtNote = (openMatches: number) =>
    openMatches >= 4
      ? 'Nhiều kèo đang mở, dễ vào sân nhanh'
      : openMatches >= 2
        ? 'Có kèo đều trong ngày, hợp để canh ghép trình'
        : openMatches >= 1
          ? 'Đang có tín hiệu mở kèo, đáng để theo dõi'
          : 'Tạm chưa có kèo mở, hệ thống sẽ cập nhật sớm'

  const favoriteCourtIds = options?.favoriteCourtIds?.filter(Boolean) ?? []
  const favoriteCourtsMeta = options?.favoriteCourtsMeta ?? []

  if (favoriteCourtIds.length > 0) {
    const favoriteMetaMap = new Map(favoriteCourtsMeta.map((court) => [court.id, court]))

    return favoriteCourtIds.map((courtId, index) => {
      const groupedCourt = grouped.get(courtId)
      const favoriteMeta = favoriteMetaMap.get(courtId)
      const openMatches = groupedCourt?.openMatches ?? 0
      const fallbackArea = [favoriteMeta?.city, favoriteMeta?.address].filter(Boolean).join(', ')
      const resolvedArea = groupedCourt?.area ?? fallbackArea

      return {
        id: courtId,
        name: groupedCourt?.name ?? favoriteMeta?.name ?? 'Sân quen',
        area: resolvedArea || 'Chưa rõ khu vực',
        openMatches,
        note: buildCourtNote(openMatches),
        image: groupedCourt?.thumbnail_url || COURT_FALLBACK_IMAGES[index % COURT_FALLBACK_IMAGES.length],
        thumbnail_url: groupedCourt?.thumbnail_url,
        rating: groupedCourt?.rating,
        rating_count: groupedCourt?.rating_count,
      }
    })
  }

  return Array.from(grouped.values())
    .sort((left, right) => right.openMatches - left.openMatches)
    .slice(0, 5)
    .map((court, index) => ({
      id: court.id,
      name: court.name,
      area: court.area,
      openMatches: court.openMatches,
      note: buildCourtNote(court.openMatches),
      image: court.thumbnail_url || COURT_FALLBACK_IMAGES[index % COURT_FALLBACK_IMAGES.length],
      thumbnail_url: court.thumbnail_url,
      rating: court.rating,
      rating_count: court.rating_count,
    }))
}
