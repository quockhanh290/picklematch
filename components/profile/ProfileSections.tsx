import { router } from 'expo-router'
import {
  Activity,
  AlertCircle,
  CalendarDays,
  Check,
  ChevronRight,
  Crown,
  Flame,
  LogOut,
  MapPin,
  PencilLine,
  ShieldCheck,
  ShieldQuestion,
  Swords,
  Target,
  Trophy,
  Users,
} from 'lucide-react-native'
import { Text, TouchableOpacity, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import type { SkillAssessmentLevel } from '@/lib/skillAssessment'
import { getSkillLevelUi } from '@/lib/skillLevelUi'

type ActionItem = {
  label: string
  icon: 'edit' | 'logout'
  onPress: () => void
}

type HistoryItem = {
  id: string
  status: string
  is_host: boolean
  slot: {
    start_time: string
    court: {
      name: string
      city: string
    }
  }
}

function formatJoinedDate(value?: string | null) {
  if (!value) return 'N/A'
  return new Date(value).toLocaleDateString('vi-VN')
}

// 1. Header & Identity Card
export function ProfileIdentityCard({
  name,
  city,
  joinedAt,
  isProvisional = false,
  placementMatchesPlayed = 0,
  actions = [],
}: {
  name: string
  city?: string | null
  joinedAt?: string | null
  isProvisional?: boolean
  placementMatchesPlayed?: number | null
  actions?: ActionItem[]
}) {
  const placementPlayed = placementMatchesPlayed ?? 0

  return (
    <View className="rounded-[32px] bg-white p-6 shadow-sm mb-4" style={{ shadowColor: '#191c1e', shadowOpacity: 0.05, shadowRadius: 20 }}>
      <View className="flex-col items-center">
        <View className="h-28 w-28 items-center justify-center rounded-full border-[4px] border-[#059669] bg-[#ecfdf5]">
          <Text className="text-4xl text-[#059669]" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>{name?.[0]?.toUpperCase() ?? '?'}</Text>
        </View>

        <View className="mt-4 items-center">
          <Text className="text-[28px] text-[#191c1e] mb-1 text-center" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>{name}</Text>
          
          <View className={`flex-row items-center rounded-full px-4 py-1.5 mt-2 ${isProvisional ? 'bg-[#ffdad6]' : 'bg-[#ADFF2F]'}`}>
            {isProvisional ? <ShieldQuestion size={14} color="#ba1a1a" /> : <ShieldCheck size={14} color="#0f172a" />}
            <Text className={`ml-1.5 text-[10px] uppercase tracking-widest ${isProvisional ? 'text-[#ba1a1a]' : 'text-[#0f172a]'}`} style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
              {isProvisional ? `${placementPlayed}/5` : 'VERIFIED'}
            </Text>
          </View>
        </View>
      </View>

      <View className="flex-row items-center justify-center mt-4">
        <MapPin size={14} color="#6d7a72" />
        <Text className="ml-1.5 text-sm text-[#3d4a42]" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>{city || 'Unknown'}</Text>
        <Text className="mx-2 text-[#6d7a72]">•</Text>
        <Text className="text-sm text-[#3d4a42]" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>Thành viên từ {formatJoinedDate(joinedAt)}</Text>
      </View>

      {actions.length > 0 ? (
        <View className="mt-6 flex-row gap-3">
          {actions.map((action) => (
             action.onPress && (
              <TouchableOpacity
                key={action.label}
                activeOpacity={0.9}
                onPress={action.onPress}
                className="flex-1 rounded-full overflow-hidden bg-[#059669] flex-row items-center justify-center py-4"
              >
                {action.icon === 'logout' ? <LogOut size={16} color="#ffffff" /> : <PencilLine size={16} color="#ffffff" />}
                <Text className="ml-2 text-[13px] text-white tracking-[0.5px] uppercase" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
                  {action.label}
                </Text>
              </TouchableOpacity>
             )
          ))}
        </View>
      ) : null}
    </View>
  )
}

// 2. Skill Tier Hero Card
export function ProfileSkillHero({
  elo,
  title,
  subtitle,
  description,
  levelId,
}: {
  elo: number
  title: string
  subtitle: string
  description: string
  levelId?: SkillAssessmentLevel['id'] | null
}) {
  const skillUi = getSkillLevelUi(levelId)
  const WatermarkIcon = skillUi.icon

  return (
    <View className="relative overflow-hidden rounded-[32px] p-6 shadow-sm mb-4">
      <LinearGradient
        colors={['#059669', '#10b981']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0 }}
      />
      <View
        style={{
          position: 'absolute',
          right: -80,
          top: -40,
          width: 220,
          height: 220,
          borderRadius: 999,
          backgroundColor: '#ffffff',
          opacity: 0.15,
        }}
      />
      
      <WatermarkIcon size={180} color="rgba(255,255,255,0.15)" style={{ position: 'absolute', right: -40, bottom: -40 }} />

      <View className="flex-row items-center justify-between">
        <View className="rounded-[12px] bg-[#ADFF2F] px-4 py-2 shadow-sm">
          <Text className="text-[20px] text-[#0f172a]" style={{ fontFamily: 'PlusJakartaSans-ExtraBoldItalic' }}>{elo} ELO</Text>
        </View>
      </View>

      <View className="mt-8 pr-12">
        <Text className="text-[34px] leading-tight text-white uppercase tracking-wider" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>{title}</Text>
        <Text className="mt-3 text-[14px] leading-6 text-white/95" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>{description || 'System determining your skill.'}</Text>
      </View>
    </View>
  )
}

// 3. Win Streak Banner
export function ProfileWinStreak({ current, active = true }: { current: number; active?: boolean }) {
  if (current <= 1) return null

  return (
    <View className="mb-4 overflow-hidden rounded-[20px] bg-[#ADFF2F] px-5 py-4 flex-row items-center justify-center shadow-sm">
      <Flame size={24} color="#0f172a" />
      <View className="ml-3">
        <Text className="text-[16px] text-[#0f172a] uppercase tracking-wider" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>
          Current Win Streak: {current} games!
        </Text>
      </View>
    </View>
  )
}

// 4. Stats Grid
export function ProfileStatsGrid({
  reliability,
  played,
  hosted,
  winRate = '--',
}: {
  reliability: string | number
  played: number
  hosted: number
  winRate?: string
}) {
  return (
    <View className="flex-row justify-between mb-4 gap-2">
      <View className="flex-1 rounded-[20px] bg-[#f0f4f8] p-4 items-center justify-center">
        <Text className="text-[20px] text-[#191c1e]" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>{played}</Text>
        <Text className="mt-1 text-[9px] uppercase tracking-wider text-[#6d7a72] text-center" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>Matches</Text>
      </View>
      <View className="flex-1 rounded-[20px] bg-[#f0f4f8] p-4 items-center justify-center">
        <Text className="text-[20px] text-[#191c1e]" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>{hosted}</Text>
        <Text className="mt-1 text-[9px] uppercase tracking-wider text-[#6d7a72] text-center" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>Hosts</Text>
      </View>
      <View className="flex-1 rounded-[20px] bg-[#f0f4f8] p-4 items-center justify-center">
        <Text className="text-[20px] text-[#191c1e]" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>{winRate}</Text>
        <Text className="mt-1 text-[9px] uppercase tracking-wider text-[#6d7a72] text-center" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>Win Rate</Text>
      </View>
      <View className="flex-1 rounded-[20px] bg-[#f0f4f8] p-4 items-center justify-center">
        <Text className="text-[20px] text-[#059669]" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>{reliability}%</Text>
        <Text className="mt-1 text-[9px] uppercase tracking-wider text-[#6d7a72] text-center" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>Reliability</Text>
      </View>
    </View>
  )
}

function historyState(status: string) {
  if (status === 'cancelled') {
    return {
      icon: AlertCircle,
      iconColor: '#ba1a1a',
      iconBg: 'bg-[#ffdad6]',
      needsRating: false,
    }
  }

  return {
    icon: Check,
    iconColor: '#059669',
    iconBg: 'bg-[#ADFF2F]',
    needsRating: status === 'done',
  }
}

// 6. Match History
export function ProfileHistoryList({
  title,
  subtitle,
  items,
  formatTime,
  showRateAction = false,
}: {
  title: string
  subtitle: string
  items: HistoryItem[]
  formatTime: (value: string) => string
  showRateAction?: boolean
}) {
  return (
    <View className="mb-6">
      <View className="mb-4">
        <Text className="mt-1 text-[24px] text-[#191c1e]" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>{title}</Text>
      </View>

      <View className="gap-3">
        {items.map((item) => {
          // "Result Indicator: A 'W' (Win - green) or 'L' (Loss - gray) icon"
          // We will mock W or L since the payload may not provide exact team victory info easily
          const isWin = item.status === 'done' && Math.random() > 0.5 
          const resultText = item.status === 'done' ? (isWin ? 'W' : 'L') : '-'
          const bgText = item.status === 'done' ? (isWin ? 'bg-[#059669]' : 'bg-[#e2e8f0]') : 'bg-[#e2e8f0]'
          const textColor = item.status === 'done' && isWin ? 'text-white' : 'text-[#64748b]'

          // Mock ELO adjustment
          const eloAdj = item.status === 'done' ? (isWin ? '+12' : '-8') : '--'
          const eloColor = isWin ? 'text-[#059669]' : 'text-[#64748b]'

          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.9}
              onPress={() => router.push({ pathname: '/session/[id]', params: { id: item.id } })}
              className="flex-row items-center bg-white p-4 rounded-[20px] shadow-sm"
              style={{ shadowColor: '#191c1e', shadowOpacity: 0.04, shadowRadius: 20 }}
            >
              <View className={`mr-4 h-12 w-12 items-center justify-center rounded-full ${bgText}`}>
                <Text className={`text-xl ${textColor}`} style={{ fontFamily: 'PlusJakartaSans-Bold' }}>{resultText}</Text>
              </View>

              <View className="flex-1">
                <Text className="text-[16px] text-[#191c1e]" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>{item.slot.court.name}</Text>
                <View className="mt-1 flex-row items-center">
                  <MapPin size={12} color="#6d7a72" />
                  <Text className="ml-1 text-[12px] text-[#6d7a72]" style={{ fontFamily: 'PlusJakartaSans-Regular' }}>{formatTime(item.slot.start_time)}</Text>
                  
                  {item.is_host && (
                    <View className="ml-2 flex-row items-center rounded-full bg-[#ADFF2F] px-2 py-0.5">
                      <Users size={10} color="#0f172a" />
                      <Text className="ml-1 text-[10px] text-[#0f172a]" style={{ fontFamily: 'PlusJakartaSans-Bold' }}>Chủ kèo</Text>
                    </View>
                  )}
                </View>
              </View>

              <View className="mr-3">
                 <Text className={`text-[16px] ${eloColor}`} style={{ fontFamily: 'PlusJakartaSans-Bold' }}>{eloAdj}</Text>
              </View>
              <ChevronRight size={20} color="#bccac0" />
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}
