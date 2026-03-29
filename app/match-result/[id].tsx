import { router, useLocalSearchParams } from 'expo-router'
import {
  ArrowLeft,
  ArrowRight,
  MinusCircle,
  PlusCircle,
  Star,
  Timer3,
  Trophy,
} from 'lucide-react-native'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Alert,
  Animated,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  Text,
  UIManager,
  View,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'

const ICON_STROKE_WIDTH = 2.5

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

type TeamPlayer = {
  id: string
  name: string
  avatar: string
  accent: string
}

type TeamSummary = {
  id: 'A' | 'B'
  name: string
  theme: {
    border: string
    tint: string
    text: string
    button: string
    buttonSoft: string
    subtext: string
  }
  players: TeamPlayer[]
}

const MATCH_CONTEXT = {
  courtName: 'The Dinker Club - Court 03',
  dateLabel: 'Chủ nhật, 29/03/2026',
  timeLabel: '19:30 - 21:00',
}

const TEAMS: TeamSummary[] = [
  {
    id: 'A',
    name: 'Team Emerald',
    theme: {
      border: '#10b981',
      tint: '#ecfdf5',
      text: '#065f46',
      button: '#059669',
      buttonSoft: '#d1fae5',
      subtext: '#047857',
    },
    players: [
      { id: 'a1', name: 'Minh Anh', avatar: 'MA', accent: '#a7f3d0' },
      { id: 'a2', name: 'Hoàng Phúc', avatar: 'HP', accent: '#6ee7b7' },
    ],
  },
  {
    id: 'B',
    name: 'Team Indigo',
    theme: {
      border: '#6366f1',
      tint: '#eef2ff',
      text: '#312e81',
      button: '#4f46e5',
      buttonSoft: '#e0e7ff',
      subtext: '#4338ca',
    },
    players: [
      { id: 'b1', name: 'Khánh Vy', avatar: 'KV', accent: '#c7d2fe' },
      { id: 'b2', name: 'Gia Bảo', avatar: 'GB', accent: '#a5b4fc' },
    ],
  },
]

function clampScore(value: number) {
  return Math.max(0, Math.min(99, value))
}

function getEloSwing(diff: number) {
  return 12 + Math.min(diff * 2, 10)
}

function getStreakLabel(scoreA: number, scoreB: number) {
  if (scoreA === scoreB) return '0 STREAK'
  return '+1 STREAK'
}

function PlayerChip({ player }: { player: TeamPlayer }) {
  return (
    <View className="mr-3 flex-row items-center">
      <View
        className="h-11 w-11 items-center justify-center rounded-full border border-white/70"
        style={{ backgroundColor: player.accent }}
      >
        <Text className="text-[13px] font-black text-slate-950">{player.avatar}</Text>
      </View>
      <Text className="ml-3 text-[15px] font-black text-slate-900">{player.name}</Text>
    </View>
  )
}

function ScoreControl({
  icon: Icon,
  label,
  onPress,
  color,
  background,
}: {
  icon: typeof PlusCircle
  label: string
  onPress: () => void
  color: string
  background: string
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      className="flex-1 flex-row items-center justify-center rounded-[24px] px-4 py-4"
      style={{ backgroundColor: background }}
    >
      <Icon color={color} size={24} strokeWidth={ICON_STROKE_WIDTH} />
      <Text className="ml-2 text-[14px] font-black uppercase tracking-[1.1px]" style={{ color }}>
        {label}
      </Text>
    </Pressable>
  )
}

function ScorePanel({
  team,
  score,
  onIncrease,
  onDecrease,
}: {
  team: TeamSummary
  score: number
  onIncrease: () => void
  onDecrease: () => void
}) {
  return (
    <View className="flex-1">
      <View
        className="rounded-[40px] border-[3px] px-5 pb-6 pt-5"
        style={{
          backgroundColor: team.theme.tint,
          borderColor: team.theme.border,
          shadowColor: team.theme.border,
          shadowOpacity: 0.14,
          shadowRadius: 22,
          shadowOffset: { width: 0, height: 12 },
          elevation: 6,
        }}
      >
        <Text className="text-[13px] font-black uppercase tracking-[2.5px]" style={{ color: team.theme.subtext }}>
          {team.name}
        </Text>
        <Text className="mt-4 text-center text-[64px] font-black leading-none" style={{ color: team.theme.text }}>
          {score}
        </Text>
        <Text className="mt-3 text-center text-[13px] font-black uppercase tracking-[1.6px]" style={{ color: team.theme.subtext }}>
          Final Score
        </Text>
      </View>

      <View className="mt-4 flex-row gap-3">
        <ScoreControl
          icon={MinusCircle}
          label="Giảm"
          onPress={onDecrease}
          color={team.theme.text}
          background={team.theme.buttonSoft}
        />
        <ScoreControl
          icon={PlusCircle}
          label="Tăng"
          onPress={onIncrease}
          color="#ffffff"
          background={team.theme.button}
        />
      </View>
    </View>
  )
}

export default function MatchResultEntryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const [scoreA, setScoreA] = useState(9)
  const [scoreB, setScoreB] = useState(7)

  const entryFade = useRef(new Animated.Value(0)).current
  const entryTranslate = useRef(new Animated.Value(18)).current
  const previewFade = useRef(new Animated.Value(1)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(entryFade, {
        toValue: 1,
        duration: 420,
        useNativeDriver: true,
      }),
      Animated.timing(entryTranslate, {
        toValue: 0,
        duration: 420,
        useNativeDriver: true,
      }),
    ]).start()
  }, [entryFade, entryTranslate])

  const winner = useMemo(() => {
    if (scoreA === scoreB) {
      return null
    }

    return scoreA > scoreB ? TEAMS[0] : TEAMS[1]
  }, [scoreA, scoreB])

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    previewFade.setValue(0.72)
    Animated.timing(previewFade, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start()
  }, [previewFade, winner, scoreA, scoreB])

  const scoreDiff = Math.abs(scoreA - scoreB)
  const winningElo = getEloSwing(scoreDiff)
  const losingElo = -Math.max(8, winningElo - 6)
  const eloLabel = winner ? `+${winningElo} ELO` : '0 ELO'
  const streakLabel = getStreakLabel(scoreA, scoreB)
  const resultHeadline = winner ? `${winner.name.toUpperCase()} THẮNG` : 'ĐANG HÒA'
  const eloDetail = winner ? `Đội còn lại ${losingElo} ELO` : 'Chưa xác định thay đổi'

  function adjustScore(teamId: 'A' | 'B', delta: number) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    if (teamId === 'A') {
      setScoreA((current) => clampScore(current + delta))
      return
    }

    setScoreB((current) => clampScore(current + delta))
  }

  function onConfirm() {
    Alert.alert(
      'Xác nhận kết quả',
      `Đã ghi nhận tạm thời ${TEAMS[0].name} ${scoreA} - ${scoreB} ${TEAMS[1].name} cho trận ${id ?? 'match-demo'}.`,
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-[#f6f7fb]" edges={['top']}>
      <View
        className="absolute left-0 right-0 top-0 z-20 border-b border-white/70 bg-white/70 px-5 pb-4"
        style={{ paddingTop: insets.top > 0 ? 6 : 18 }}
      >
        <View className="flex-row items-center justify-between">
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            className="h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white/90"
          >
            <ArrowLeft color="#0f172a" size={22} strokeWidth={ICON_STROKE_WIDTH} />
          </Pressable>

          <Text className="text-[20px] font-black text-slate-950">Nhập kết quả</Text>

          <View className="h-12 w-12 items-center justify-center rounded-full bg-white/50">
            <Text className="text-[11px] font-black uppercase tracking-[1.4px] text-slate-400">
              #{String(id ?? '01').slice(0, 2)}
            </Text>
          </View>
        </View>
      </View>

      <Animated.View
        className="flex-1"
        style={{
          opacity: entryFade,
          transform: [{ translateY: entryTranslate }],
        }}
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingTop: 104,
            paddingHorizontal: 20,
            paddingBottom: insets.bottom + 160,
          }}
          showsVerticalScrollIndicator={false}
        >
          <View className="items-center rounded-[36px] border border-white/80 bg-white px-6 py-6">
            <View className="flex-row items-center rounded-full bg-emerald-50 px-4 py-2">
              <Trophy color="#059669" size={16} strokeWidth={ICON_STROKE_WIDTH} />
              <Text className="ml-2 text-[11px] font-black uppercase tracking-[1.8px] text-emerald-700">
                Ended
              </Text>
            </View>
            <Text className="mt-5 text-center text-[28px] font-black leading-[32px] text-slate-950">
              {MATCH_CONTEXT.courtName}
            </Text>
            <Text className="mt-3 text-center text-[15px] font-black text-slate-500">
              {MATCH_CONTEXT.dateLabel}
            </Text>
            <View className="mt-2 flex-row items-center">
              <Timer3 color="#64748b" size={16} strokeWidth={ICON_STROKE_WIDTH} />
              <Text className="ml-2 text-[15px] font-black text-slate-600">{MATCH_CONTEXT.timeLabel}</Text>
            </View>
          </View>

          <View className="mt-6 rounded-[40px] bg-white px-5 py-5">
            <View className="flex-row gap-4">
              <ScorePanel
                team={TEAMS[0]}
                score={scoreA}
                onIncrease={() => adjustScore('A', 1)}
                onDecrease={() => adjustScore('A', -1)}
              />
              <ScorePanel
                team={TEAMS[1]}
                score={scoreB}
                onIncrease={() => adjustScore('B', 1)}
                onDecrease={() => adjustScore('B', -1)}
              />
            </View>
          </View>

          <Animated.View
            className="mt-6 overflow-hidden rounded-[36px] bg-slate-900 px-5 py-5"
            style={{ opacity: previewFade }}
          >
            <Text className="text-[12px] font-black uppercase tracking-[2.4px] text-slate-400">
              DỰ BÁO XẾP HẠNG
            </Text>
            <Text className="mt-4 text-[30px] font-black leading-[34px]" style={{ color: '#BEF264' }}>
              {resultHeadline}
            </Text>
            <Text className="mt-2 text-[15px] font-black text-slate-400">
              Cập nhật tức thì theo điểm số hiện tại để Host kiểm tra trước khi gửi.
            </Text>

            <View className="mt-5 flex-row gap-3">
              <View className="flex-1 rounded-[28px] bg-white/6 px-4 py-4">
                <Text className="text-[11px] font-black uppercase tracking-[1.4px] text-slate-400">
                  Estimated ELO Change
                </Text>
                <Text className="mt-3 text-[26px] font-black text-emerald-400">{eloLabel}</Text>
                <Text className="mt-1 text-[12px] font-black text-slate-500">{eloDetail}</Text>
              </View>

              <View className="flex-1 rounded-[28px] bg-white/6 px-4 py-4">
                <Text className="text-[11px] font-black uppercase tracking-[1.4px] text-slate-400">
                  Streak Impact
                </Text>
                <Text className="mt-3 text-[26px] font-black text-orange-300">{`${streakLabel} 🔥`}</Text>
              </View>
            </View>
          </Animated.View>

          <View className="mt-6 rounded-[36px] bg-white px-5 py-5">
            <Text className="text-[12px] font-black uppercase tracking-[2px] text-slate-500">
              Team Rosters
            </Text>

            <View className="mt-5 rounded-[30px] bg-emerald-50 px-4 py-4">
              <View className="flex-row items-center justify-between">
                <Text className="text-[18px] font-black text-emerald-900">{TEAMS[0].name}</Text>
                <View className="flex-row items-center rounded-full bg-white/80 px-3 py-1.5">
                  <Star color="#047857" size={15} strokeWidth={ICON_STROKE_WIDTH} />
                  <Text className="ml-1.5 text-[11px] font-black uppercase tracking-[1.3px] text-emerald-700">
                    Avg Host Sync
                  </Text>
                </View>
              </View>
              <View className="mt-4">
                {TEAMS[0].players.map((player) => (
                  <View key={player.id} className="mb-3 last:mb-0">
                    <PlayerChip player={player} />
                  </View>
                ))}
              </View>
            </View>

            <View className="mt-4 rounded-[30px] bg-indigo-50 px-4 py-4">
              <Text className="text-[18px] font-black text-indigo-950">{TEAMS[1].name}</Text>
              <View className="mt-4">
                {TEAMS[1].players.map((player) => (
                  <View key={player.id} className="mb-3 last:mb-0">
                    <PlayerChip player={player} />
                  </View>
                ))}
              </View>
            </View>
          </View>
        </ScrollView>

        <View
          className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white/95 px-5 pt-4"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          <Pressable
            accessibilityRole="button"
            onPress={onConfirm}
            className="flex-row items-center justify-center rounded-2xl bg-[#059669] px-5 py-4"
          >
            <Text className="text-[15px] font-black uppercase tracking-[1.2px] text-white">
              Confirm &amp; Update ELO
            </Text>
            <View className="ml-2">
              <ArrowRight color="#ffffff" size={18} strokeWidth={ICON_STROKE_WIDTH} />
            </View>
          </Pressable>
          <Text className="mt-3 text-center text-[12px] font-black leading-[18px] text-slate-500">
            Kết quả sẽ được gửi đến tất cả thành viên để xác nhận tính công bằng.
          </Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  )
}
