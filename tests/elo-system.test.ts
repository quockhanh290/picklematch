import { 
  getEloBandForElo, 
  getEloBandForSessionRange, 
  getLevelIdForElo, 
  ELO_BANDS 
} from '../lib/eloSystem'

describe('ELO System Logic', () => {
  it('should map ELO to the correct level band', () => {
    // Beginner
    expect(getLevelIdForElo(850)).toBe('level_1')
    
    // Intermediate midpoint
    expect(getLevelIdForElo(1100)).toBe('level_3')
    
    // Boundary check
    expect(getLevelIdForElo(1049)).toBe('level_2')
    expect(getLevelIdForElo(1050)).toBe('level_3')
    
    // Advanced
    expect(getLevelIdForElo(1400)).toBe('level_5')
  })

  it('should handle out-of-bounds ELO values gracefully', () => {
    // Below minimum
    expect(getLevelIdForElo(100)).toBe('level_1')
    
    // Above maximum
    expect(getLevelIdForElo(3000)).toBe('level_5')
  })

  it('should calculate session range band correctly based on midpoint', () => {
    // 900 - 1100 midpoint is 1000 (Level 2)
    const band = getEloBandForSessionRange(900, 1100)
    expect(band.levelId).toBe('level_2')
    
    // 1100 - 1300 midpoint is 1200 (Level 4)
    const band2 = getEloBandForSessionRange(1100, 1300)
    expect(band2.levelId).toBe('level_4')
  })

  it('should return null for invalid ELO inputs if using getEloBandForElo', () => {
    // @ts-ignore
    expect(getEloBandForElo(null)).toBeNull()
    // @ts-ignore
    expect(getEloBandForElo(undefined)).toBeNull()
  })
})
