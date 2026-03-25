import {
  AlertCircle,
  CalendarDays,
  Check,
  ChevronRight,
  Crown,
  LogOut,
  MapPin,
  PencilLine,
  ShieldCheck,
  ShieldQuestion,
  Swords,
  Trophy,
  Users,
} from 'lucide-react-native'
import { router } from 'expo-router'
import { Text, TouchableOpacity, View } from 'react-native'

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
  if (!value) return 'Chưa có dữ liệu'
  return new Date(value).toLocaleDateString('vi-VN')
}

function duprEquivalent(elo: number) {
  if (elo < 900) return '2.5'
  if (elo < 1075) return '3.0'
  if (elo < 1250) return '3.5'
  if (elo < 1450) return '4.0'
  return '4.5'
}

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
    <View className="rounded-[24px] border border-slate-200 bg-white p-5">
      <View className="flex-row items-start">
        <View className="mr-4 h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
          <Text className="text-3xl font-black text-emerald-700">{name?.[0]?.toUpperCase() ?? '?'}</Text>
        </View>

        <View className="flex-1">
          <View className="flex-row flex-wrap items-center gap-2">
            <Text className="text-[28px] font-black text-slate-900">{name}</Text>
            <View className={`flex-row items-center rounded-full px-3 py-1.5 ${isProvisional ? 'bg-amber-50' : 'bg-emerald-50'}`}>
              {isProvisional ? <ShieldQuestion size={14} color="#b45309" /> : <ShieldCheck size={14} color="#047857" />}
              <Text className={`ml-1.5 text-[10px] font-extrabold uppercase tracking-widest ${isProvisional ? 'text-amber-700' : 'text-emerald-700'}`}>
                {isProvisional ? `${placementPlayed}/5 trận` : 'Stable'}
              </Text>
            </View>
          </View>

          <View className="mt-2 flex-row flex-wrap items-center">
            <MapPin size={14} color="#64748b" />
            <Text className="ml-2 text-sm font-semibold text-slate-500">{city || 'Chưa cập nhật thành phố'}</Text>
            <CalendarDays size={14} color="#94a3b8" style={{ marginLeft: 12 }} />
            <Text className="ml-2 text-sm font-semibold text-slate-400">{formatJoinedDate(joinedAt)}</Text>
          </View>

          {actions.length > 0 ? (
            <View className="mt-4 flex-row gap-2">
              {actions.map((action) => (
                <TouchableOpacity
                  key={action.label}
                  activeOpacity={0.9}
                  onPress={action.onPress}
                  className="flex-row items-center rounded-full bg-slate-100 px-4 py-2"
                >
                  {action.icon === 'logout' ? <LogOut size={14} color="#0f172a" /> : <PencilLine size={14} color="#0f172a" />}
                  <Text className="ml-2 text-xs font-extrabold uppercase tracking-[1px] text-slate-700">{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </View>
      </View>
    </View>
  )
}

export function ProfileSkillHero({
  elo,
  title,
  subtitle,
  description,
}: {
  elo: number
  title: string
  subtitle: string
  description: string
}) {
  return (
    <View className="relative mt-4 overflow-hidden rounded-[24px] bg-indigo-500 p-5">
      <View className="absolute -right-5 -top-6 h-28 w-28 rounded-full bg-white/10" />
      <View className="absolute -left-10 bottom-0 h-24 w-24 rounded-full bg-violet-400/30" />
      <Trophy size={120} color="rgba(255,255,255,0.14)" style={{ position: 'absolute', right: -10, bottom: -10 }} />

      <View className="flex-row flex-wrap items-center gap-2">
        <View className="rounded-full bg-white/15 px-3 py-2">
          <Text className="text-[10px] font-extrabold uppercase tracking-widest text-white">DUPR Style</Text>
        </View>
        <View className="flex-row items-center rounded-full bg-white/15 px-3 py-2">
          <Trophy size={14} color="#ffffff" />
          <Text className="ml-2 text-[10px] font-extrabold uppercase tracking-widest text-white">
            {elo} ELO • {duprEquivalent(elo)} DUPR
          </Text>
        </View>
      </View>

      <View className="mt-10 pr-16">
        <Text className="text-[30px] font-black text-white">{title}</Text>
        <Text className="mt-2 text-sm font-semibold text-white/80">{subtitle}</Text>
        <Text className="mt-4 text-sm leading-6 text-white/90">{description}</Text>
      </View>
    </View>
  )
}

export function ProfileWinStreak({ current, active = true }: { current: number; active?: boolean }) {
  return (
    <View className={`mt-4 flex-row items-center rounded-[24px] border p-4 ${active ? 'border-orange-200 bg-orange-50' : 'border-slate-200 bg-white'}`}>
      <View className="flex-row items-center">
        <View className={`mr-4 h-12 w-12 items-center justify-center rounded-full ${active ? 'bg-orange-100' : 'bg-slate-100'}`}>
          <Trophy size={22} color={active ? '#ea580c' : '#64748b'} />
        </View>
        <View>
          <Text className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Win Streak</Text>
          <Text className="mt-1 text-xl font-black text-slate-900">{current} trận liên tiếp</Text>
        </View>
      </View>
    </View>
  )
}

export function ProfileStatsGrid({
  reliability,
  reliabilityToneClass,
  reliabilityDescription,
  played,
  hosted,
}: {
  reliability: string
  reliabilityToneClass: string
  reliabilityDescription: string
  played: number
  hosted: number
}) {
  return (
    <View className="mt-4 flex-row gap-3">
      <View className="flex-[2] overflow-hidden rounded-[24px] border border-slate-200 bg-white p-5">
        <ShieldCheck size={82} color="rgba(15,23,42,0.06)" style={{ position: 'absolute', right: -8, bottom: -10 }} />
        <Text className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Reliability</Text>
        <Text className={`mt-4 text-[42px] font-black ${reliabilityToneClass}`}>{reliability}</Text>
        <Text className="mt-2 max-w-[85%] text-sm leading-6 text-slate-500">{reliabilityDescription}</Text>
      </View>

      <View className="flex-1 gap-3">
        <View className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-white p-4">
          <Swords size={62} color="rgba(15,23,42,0.06)" style={{ position: 'absolute', right: -8, bottom: -8 }} />
          <Text className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Played</Text>
          <Text className="mt-3 text-3xl font-black text-slate-900">{played}</Text>
        </View>
        <View className="relative overflow-hidden rounded-[24px] border border-slate-200 bg-white p-4">
          <Crown size={58} color="rgba(15,23,42,0.06)" style={{ position: 'absolute', right: -6, bottom: -10 }} />
          <Text className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Hosted</Text>
          <Text className="mt-3 text-3xl font-black text-slate-900">{hosted}</Text>
        </View>
      </View>
    </View>
  )
}

function historyState(status: string) {
  if (status === 'cancelled') {
    return {
      icon: AlertCircle,
      iconColor: '#e11d48',
      iconBg: 'bg-rose-50',
      needsRating: false,
    }
  }

  return {
    icon: Check,
    iconColor: '#059669',
    iconBg: 'bg-emerald-50',
    needsRating: status === 'done',
  }
}

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
    <>
      <View className="mt-6 px-1">
        <Text className="text-[10px] font-extrabold uppercase tracking-widest text-slate-500">Recent Sessions</Text>
        <Text className="mt-2 text-2xl font-black text-slate-900">{title}</Text>
        <Text className="mt-2 text-sm leading-6 text-slate-500">{subtitle}</Text>
      </View>

      <View className="mt-4 overflow-hidden rounded-[24px] border border-slate-200 bg-white">
        {items.map((item, index) => {
          const state = historyState(item.status)
          const ItemIcon = state.icon

          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.9}
              onPress={() => router.push({ pathname: '/session/[id]', params: { id: item.id } })}
              className={`flex-row items-center px-4 py-4 ${index < items.length - 1 ? 'border-b border-slate-100' : ''}`}
            >
              <View className={`mr-3 h-11 w-11 items-center justify-center rounded-full ${state.iconBg}`}>
                <ItemIcon size={18} color={state.iconColor} />
              </View>

              <View className="flex-1">
                <Text className="text-sm font-extrabold text-slate-900">{item.slot.court.name}</Text>
                <View className="mt-1 flex-row items-center">
                  <MapPin size={12} color="#94a3b8" />
                  <Text className="ml-1 text-xs font-semibold text-slate-500">{item.slot.court.city}</Text>
                  {item.is_host ? (
                    <>
                      <Users size={12} color="#94a3b8" style={{ marginLeft: 10 }} />
                      <Text className="ml-1 text-xs font-semibold text-slate-500">Host</Text>
                    </>
                  ) : null}
                </View>
                <Text className="mt-2 text-xs font-bold text-slate-400">{formatTime(item.slot.start_time)}</Text>
              </View>

              {showRateAction && state.needsRating ? (
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => router.push({ pathname: '/rate-session/[id]', params: { id: item.id } })}
                  className="rounded-full bg-emerald-600 px-4 py-2"
                >
                  <Text className="text-xs font-extrabold uppercase tracking-[1px] text-white">Đánh giá</Text>
                </TouchableOpacity>
              ) : (
                <ChevronRight size={18} color="#94a3b8" />
              )}
            </TouchableOpacity>
          )
        })}
      </View>
    </>
  )
}
