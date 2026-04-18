// Tách type để dùng chung cho logic/test mà không import toàn bộ component
export type SessionRequestStatus = 'pending' | 'accepted' | 'rejected' | null
export type SessionRole = 'host' | 'player'
