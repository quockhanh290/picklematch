import type { HomeSessionRecord, FamiliarCourt } from './types'
import { COURT_FALLBACK_IMAGES } from './formatters'

type FavoriteCourtMeta = {
  id: string
  name?: string | null
  address?: string | null
  city?: string | null
}

function resolveCourtImage(thumbnailUrl: string | null | undefined, imagesJson: any[] | null | undefined): string | null {
  const images = imagesJson || []
  
  // If thumbnail exists and is not streetview, use it
  if (thumbnailUrl && !thumbnailUrl.includes('streetviewpixels')) {
    return thumbnailUrl
  }

  // Find first real photo in gallery
  const realPhoto = images.find((img: any) => img.image && !img.image.includes('streetviewpixels'))
  if (realPhoto) return realPhoto.image

  // Fallback to thumbnail if it's all we have (even if streetview)
  if (thumbnailUrl) return thumbnailUrl

  // Last resort: any image from gallery
  if (images.length > 0) return images[0].image

  return null
}

export function buildLiveFamiliarCourts(
  sessions: HomeSessionRecord[],
  options?: {
    favoriteCourtIds?: string[] | null
    favoriteCourtsMeta?: FavoriteCourtMeta[]
    courtsRaw?: any[]
  },
): FamiliarCourt[] {
  const grouped = new Map<string, { 
    id: string; 
    name: string; 
    area: string; 
    openMatches: number; 
    thumbnail_url?: string | null; 
    rating?: number | null; 
    rating_count?: number | null;
    image?: string | null;
  }>()

  sessions.forEach((session) => {
    const court = session.slot?.court
    if (!court) return

    const current = grouped.get(court.id)
    if (current) {
      current.openMatches += 1
      return
    }

    const image = resolveCourtImage(court.thumbnail_url, court.images)

    grouped.set(court.id, {
      id: court.id,
      name: court.name,
      area: court.address || court.city,
      openMatches: 1,
      thumbnail_url: court.thumbnail_url,
      rating: court.rating,
      rating_count: court.rating_count,
      image: image,
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

  const courtsRaw = options?.courtsRaw ?? []
  
  // Merge grouped courts (active matches) with raw courts from DB
  courtsRaw.forEach(court => {
    if (!grouped.has(court.id)) {
      const image = resolveCourtImage(court.thumbnail_url, court.images)
      
      grouped.set(court.id, {
        id: court.id,
        name: court.name,
        area: court.address || court.city,
        openMatches: 0,
        thumbnail_url: court.thumbnail_url,
        rating: court.rating,
        rating_count: court.rating_count,
        image: image
      })
    }
  })

  if (favoriteCourtIds.length > 0) {
    const favoriteMetaMap = new Map(favoriteCourtsMeta.map((court) => [court.id, court]))

    return favoriteCourtIds.map((courtId, index) => {
      const groupedCourt = grouped.get(courtId)
      const favoriteMeta = favoriteMetaMap.get(courtId)
      const openMatches = groupedCourt?.openMatches ?? 0
      const fallbackArea = [favoriteMeta?.address, favoriteMeta?.city].filter(Boolean).join(', ')
      const resolvedArea = groupedCourt?.area ?? fallbackArea

      return {
        id: courtId,
        name: groupedCourt?.name ?? favoriteMeta?.name ?? 'Sân quen',
        area: resolvedArea || 'Chưa rõ khu vực',
        openMatches,
        note: buildCourtNote(openMatches),
        image: groupedCourt?.image || COURT_FALLBACK_IMAGES[index % COURT_FALLBACK_IMAGES.length],
        thumbnail_url: groupedCourt?.thumbnail_url,
        rating: groupedCourt?.rating,
        rating_count: groupedCourt?.rating_count,
      }
    })
  }

  return Array.from(grouped.values())
    .sort((left, right) => right.openMatches - left.openMatches)
    .slice(0, 15)
    .map((court, index) => ({
      id: court.id,
      name: court.name,
      area: court.area,
      openMatches: court.openMatches,
      note: buildCourtNote(court.openMatches),
      image: court.image || COURT_FALLBACK_IMAGES[index % COURT_FALLBACK_IMAGES.length],
      thumbnail_url: court.thumbnail_url,
      rating: court.rating,
      rating_count: court.rating_count,
    }))
}
