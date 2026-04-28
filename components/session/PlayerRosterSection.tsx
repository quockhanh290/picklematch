import { PROFILE_THEME_COLORS } from '@/components/profile/profileTheme'
import { SCREEN_FONTS } from '@/constants/screenFonts'
import { Repeat2, Shuffle } from 'lucide-react-native'
import { Pressable, Text, View } from 'react-native'

import type { ArrangementPlayer } from '@/lib/sessionDetail'
import { RADIUS, SPACING, BORDER } from '@/constants/screenLayout'

type Props = {
  arrangedPlayers: ArrangementPlayer[]
  maxPlayers: number
  sessionStatus: string
  spotsLeft: number
  isHost: boolean
  isArranging: boolean
  setIsArranging: (value: boolean | ((prev: boolean) => boolean)) => void
  onAutoBalance: () => void
  teamA: ArrangementPlayer[]
  teamB: ArrangementPlayer[]
  averageTeamA: number
  averageTeamB: number
  renderPlayerRow: (player: ArrangementPlayer, mode: 'normal' | 'arranging') => React.ReactNode
}

function TeamHeader({ label, badge, avgElo }: { label: string; badge: string; avgElo: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Text
          style={{
            fontFamily: SCREEN_FONTS.bold,
            fontSize: 13,
            letterSpacing: 2.4,
            textTransform: 'uppercase',
            color: PROFILE_THEME_COLORS.onSurfaceVariant,
          }}
        >
          {label}
        </Text>
        {avgElo > 0 && (
          <View
            style={{
              borderRadius: RADIUS.full,
              paddingHorizontal: SPACING.sm,
              paddingVertical: 4,
              backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow,
              borderWidth: BORDER.base,
              borderColor: PROFILE_THEME_COLORS.outlineVariant,
            }}
          >
            <Text style={{ fontFamily: SCREEN_FONTS.label, fontSize: 11, color: PROFILE_THEME_COLORS.outline }}>
              TB {avgElo} ELO
            </Text>
          </View>
        )}
      </View>
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: RADIUS.full,
          backgroundColor: PROFILE_THEME_COLORS.primary,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text style={{ fontFamily: SCREEN_FONTS.bold, fontSize: 14, color: PROFILE_THEME_COLORS.onPrimary }}>
          {badge}
        </Text>
      </View>
    </View>
  )
}

function EmptySlot() {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: RADIUS.lg,
        borderWidth: BORDER.medium,
        borderStyle: 'dashed',
        borderColor: PROFILE_THEME_COLORS.outlineVariant,
        backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow,
        paddingHorizontal: 16,
        paddingVertical: SPACING.md,
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: RADIUS.full,
          borderWidth: BORDER.medium,
          borderStyle: 'dashed',
          borderColor: PROFILE_THEME_COLORS.outlineVariant,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 14,
        }}
      >
        <Text style={{ fontFamily: SCREEN_FONTS.bold, fontSize: 20, color: PROFILE_THEME_COLORS.outlineVariant }}>
          +
        </Text>
      </View>
      <View>
        <Text style={{ fontFamily: SCREEN_FONTS.label, fontSize: 14, color: PROFILE_THEME_COLORS.outline }}>
          Đang chờ...
        </Text>
        <Text style={{ fontFamily: SCREEN_FONTS.body, fontSize: 11, color: PROFILE_THEME_COLORS.outlineVariant, marginTop: 2 }}>
          Vị trí trống
        </Text>
      </View>
    </View>
  )
}

export function PlayerRosterSection({
  arrangedPlayers,
  maxPlayers,
  sessionStatus,
  spotsLeft,
  isHost,
  isArranging,
  setIsArranging,
  onAutoBalance,
  teamA,
  teamB,
  averageTeamA,
  averageTeamB,
  renderPlayerRow,
}: Props) {
  return (
    <View style={{ marginTop: 24 }}>
      {/* Section header */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16 }}>
        <View>
          <Text style={{ fontFamily: SCREEN_FONTS.bold, fontSize: 20, color: PROFILE_THEME_COLORS.onBackground }}>
            Danh sách thi đấu
          </Text>
          <Text
            style={{
              fontFamily: SCREEN_FONTS.label,
              fontSize: 13,
              color: sessionStatus === 'open' && spotsLeft > 0
                ? PROFILE_THEME_COLORS.surfaceTint
                : PROFILE_THEME_COLORS.onSurfaceVariant,
              marginTop: 4,
            }}
          >
            {arrangedPlayers.length}/{maxPlayers} người chơi
            {sessionStatus === 'open' && spotsLeft > 0 ? ` • Còn ${spotsLeft} chỗ` : ''}
          </Text>
        </View>

        {isHost && (
          <Pressable
            onPress={() => setIsArranging((prev) => !prev)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              borderRadius: RADIUS.lg,
              paddingHorizontal: 16,
              paddingVertical: SPACING.sm,
              backgroundColor: isArranging ? PROFILE_THEME_COLORS.inverseSurface : PROFILE_THEME_COLORS.surfaceContainerHighest,
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Repeat2
              size={14}
              color={isArranging ? PROFILE_THEME_COLORS.surfaceContainerLowest : PROFILE_THEME_COLORS.onSurface}
              strokeWidth={2.5}
            />
            <Text
              style={{
                fontFamily: SCREEN_FONTS.bold,
                fontSize: 12,
                letterSpacing: 0.5,
                color: isArranging ? PROFILE_THEME_COLORS.surfaceContainerLowest : PROFILE_THEME_COLORS.onSurface,
              }}
            >
              {isArranging ? 'Xong' : 'Chỉnh đội'}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Edit mode hint + auto balance */}
      {isHost && isArranging && (
        <View style={{ marginBottom: 14, gap: 10 }}>
          <View
            style={{
              borderRadius: RADIUS.lg,
              paddingHorizontal: 16,
              paddingVertical: 12,
              backgroundColor: PROFILE_THEME_COLORS.secondaryContainer,
              borderWidth: BORDER.base,
              borderStyle: 'dashed',
              borderColor: PROFILE_THEME_COLORS.outlineVariant,
            }}
          >
            <Text style={{ fontFamily: SCREEN_FONTS.label, fontSize: 13, lineHeight: 20, color: PROFILE_THEME_COLORS.surfaceTint }}>
              Nhấn icon đổi đội để chuyển người chơi giữa Đội A và Đội B.
            </Text>
          </View>
          <Pressable
            onPress={onAutoBalance}
            style={({ pressed }) => ({
              alignSelf: 'flex-start',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              borderRadius: RADIUS.lg,
              paddingHorizontal: 16,
              paddingVertical: SPACING.sm,
              backgroundColor: PROFILE_THEME_COLORS.primary,
              opacity: pressed ? 0.88 : 1,
            })}
          >
            <Shuffle size={14} color={PROFILE_THEME_COLORS.onPrimary} strokeWidth={2.5} />
            <Text style={{ fontFamily: SCREEN_FONTS.bold, fontSize: 12, letterSpacing: 0.5, color: PROFILE_THEME_COLORS.onPrimary }}>
              Chia đội tự động
            </Text>
          </Pressable>
        </View>
      )}

      {/* Team A */}
      <View style={{ marginBottom: 20 }}>
        <TeamHeader label="Đội A" badge="A" avgElo={averageTeamA} />
        <View style={{ gap: 10 }}>
          {teamA.length > 0
            ? teamA.map((player) => renderPlayerRow(player, isArranging ? 'arranging' : 'normal'))
            : <EmptySlot />}
        </View>
      </View>

      {/* Team B */}
      <View>
        <TeamHeader label="Đội B" badge="B" avgElo={averageTeamB} />
        <View style={{ gap: 10 }}>
          {teamB.map((player) => renderPlayerRow(player, isArranging ? 'arranging' : 'normal'))}
          {Array.from({ length: spotsLeft }).map((_, i) => (
            <EmptySlot key={`empty-${i}`} />
          ))}
          {teamB.length === 0 && spotsLeft === 0 && <EmptySlot />}
        </View>
      </View>
    </View>
  )
}
