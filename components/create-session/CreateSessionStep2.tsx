import { ArrowRight, Check, Clock3, ExternalLink, ShieldCheck, Wallet } from 'lucide-react-native'
import { KeyboardAvoidingView, Platform, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native'

import {
  CREATE_SESSION_SKILL_INACTIVE_CLASSNAME,
  CREATE_SESSION_SKILL_OPTIONS,
} from './skillLevelOptions'

type Props = {
  maxPlayers: number
  setMaxPlayers: (n: number) => void
  minSkill: number
  setMinSkill: (n: number) => void
  maxSkill: number
  setMaxSkill: (n: number) => void
  bookingStatus: 'confirmed' | 'unconfirmed'
  setBookingStatus: (s: 'confirmed' | 'unconfirmed') => void
  wantsBookingNow: boolean | null
  setWantsBookingNow: (value: boolean | null) => void
  bookingReference: string
  setBookingReference: (value: string) => void
  bookingName: string
  setBookingName: (value: string) => void
  bookingPhone: string
  setBookingPhone: (value: string) => void
  bookingNotes: string
  setBookingNotes: (value: string) => void
  canOpenBookingLink: boolean
  onOpenBookingLink: () => void
  deadlineHours: number
  setDeadlineHours: (hours: number) => void
  requireApproval: boolean
  setRequireApproval: (value: boolean) => void
  totalCostStr: string
  setTotalCostStr: (value: string) => void
  costPerPerson: number
  onContinue: () => void
}

const PLAYER_OPTIONS = [2, 4, 6, 8]
const DEADLINE_OPTIONS = [2, 4, 8, 24]

const BOOKING_THEME = {
  confirmed: {
    borderColor: '#10b981',
    backgroundColor: '#ecfdf5',
    titleColor: '#064e3b',
    bodyColor: '#047857',
    indicatorBorderColor: '#059669',
    indicatorBackgroundColor: '#10b981',
  },
  unconfirmed: {
    borderColor: '#f59e0b',
    backgroundColor: '#fffbeb',
    titleColor: '#78350f',
    bodyColor: '#b45309',
    indicatorBorderColor: '#d97706',
    indicatorBackgroundColor: '#f59e0b',
  },
  inactive: {
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    titleColor: '#0f172a',
    bodyColor: '#64748b',
    indicatorBorderColor: '#cbd5e1',
    indicatorBackgroundColor: '#ffffff',
  },
} as const

function SkillSelector({
  value,
  onChange,
  label,
}: {
  value: number
  onChange: (level: number) => void
  label: string
}) {
  return (
    <View className="mb-3 rounded-[16px] border border-slate-200 bg-white p-3">
      <Text className="mb-3 ml-1 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">{label}</Text>
      <View className="flex-row flex-wrap gap-2">
        {CREATE_SESSION_SKILL_OPTIONS.map((option) => {
          const Icon = option.icon
          const active = value === option.id

          return (
            <TouchableOpacity
              key={option.id}
              activeOpacity={0.92}
              onPress={() => onChange(option.id)}
              className={`flex-row items-center gap-1.5 rounded-[12px] border px-3 py-2.5 ${
                active
                  ? `${option.activeClassName} ${option.textClassName}`
                  : CREATE_SESSION_SKILL_INACTIVE_CLASSNAME
              }`}
            >
              <Icon size={15} color={active ? option.iconColor : '#64748b'} />
              <Text className={`text-[13px] font-medium ${active ? option.textClassName : 'text-slate-500'}`}>
                {option.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

function BookingStatusCard({
  active,
  title,
  description,
  tone,
  onPress,
}: {
  active: boolean
  title: string
  description: string
  tone: 'confirmed' | 'unconfirmed'
  onPress: () => void
}) {
  const theme = active ? BOOKING_THEME[tone] : BOOKING_THEME.inactive

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={onPress}
      className="flex-row items-start gap-3 rounded-[16px] border p-3.5"
      style={{
        borderColor: theme.borderColor,
        backgroundColor: theme.backgroundColor,
      }}
    >
      <View
        className="mt-0.5 h-5 w-5 items-center justify-center rounded-full border"
        style={{
          borderColor: theme.indicatorBorderColor,
          backgroundColor: theme.indicatorBackgroundColor,
        }}
      >
        {active ? <Check size={12} color="#ffffff" /> : null}
      </View>
      <View className="flex-1">
        <Text className="text-[14px] font-bold" style={{ color: theme.titleColor }}>
          {title}
        </Text>
        <Text className="mt-0.5 text-[12px] leading-snug" style={{ color: active ? theme.bodyColor : theme.bodyColor }}>
          {description}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

export function CreateSessionStep2({
  maxPlayers,
  setMaxPlayers,
  minSkill,
  setMinSkill,
  maxSkill,
  setMaxSkill,
  bookingStatus,
  setBookingStatus,
  wantsBookingNow,
  setWantsBookingNow,
  bookingReference,
  setBookingReference,
  bookingName,
  setBookingName,
  bookingPhone,
  setBookingPhone,
  bookingNotes,
  setBookingNotes,
  canOpenBookingLink,
  onOpenBookingLink,
  deadlineHours,
  setDeadlineHours,
  requireApproval,
  setRequireApproval,
  totalCostStr,
  setTotalCostStr,
  costPerPerson,
  onContinue,
}: Props) {
  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 132 }}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        className="flex-1"
      >
        <Text className="mb-3 text-[13px] font-bold text-slate-900">{'\u0053\u1ed1\u0020\u006e\u0067\u01b0\u1eddi\u0020\u0063\u0068\u01a1\u0069'}</Text>
        <View className="mb-6 flex-row gap-3">
          {PLAYER_OPTIONS.map((num) => (
            <TouchableOpacity
              key={num}
              activeOpacity={0.92}
              onPress={() => setMaxPlayers(num)}
              className={`flex-1 rounded-[14px] border py-3 ${
                maxPlayers === num
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <Text
                className={`text-center text-[14px] font-black ${
                  maxPlayers === num ? 'text-emerald-700' : 'text-slate-600'
                }`}
              >
                {num}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <SkillSelector
          value={minSkill}
          onChange={setMinSkill}
          label={'\u0054\u0072\u00ec\u006e\u0068\u0020\u0111\u1ed9\u0020\u0074\u1ed1\u0069\u0020\u0074\u0068\u0069\u1ec3\u0075'}
        />
        <SkillSelector
          value={maxSkill}
          onChange={setMaxSkill}
          label={'\u0054\u0072\u00ec\u006e\u0068\u0020\u0111\u1ed9\u0020\u0074\u1ed1\u0069\u0020\u0111\u0061'}
        />

        <Text className="mb-3 mt-3 text-[13px] font-bold text-slate-900">
          {'\u0054\u0072\u1ea1\u006e\u0067\u0020\u0074\u0068\u00e1\u0069\u0020\u0111\u1eb7\u0074\u0020\u0073\u00e2\u006e'}
        </Text>

        <BookingStatusCard
          active={bookingStatus === 'confirmed'}
          title={'\u0053\u00e2\u006e\u0020\u0111\u00e3\u0020\u0078\u00e1\u0063\u0020\u006e\u0068\u1ead\u006e'}
          description={'\u0053\u00e2\u006e\u0020\u0111\u00e3\u0020\u0111\u01b0\u1ee3\u0063\u0020\u0111\u1eb7\u0074\u0020\u0076\u00e0\u0020\u0073\u1eb5\u006e\u0020\u0073\u00e0\u006e\u0067\u0020\u0111\u0103\u006e\u0067\u0020\u006b\u00e8\u006f\u0020\u006e\u0067\u0061\u0079\u002e'}
          tone="confirmed"
          onPress={() => {
            setBookingStatus('confirmed')
            setWantsBookingNow(null)
          }}
        />

        <View className="h-3" />

        <BookingStatusCard
          active={bookingStatus === 'unconfirmed'}
          title={'\u0043\u0068\u01b0\u0061\u0020\u0078\u00e1\u0063\u0020\u006e\u0068\u1ead\u006e'}
          description={'\u0042\u1ea1\u006e\u0020\u0063\u00f3\u0020\u0074\u0068\u1ec3\u0020\u0111\u0103\u006e\u0067\u0020\u0074\u0072\u01b0\u1edb\u0063\u0020\u0072\u1ed3\u0069\u0020\u0063\u1ead\u0070\u0020\u006e\u0068\u1ead\u0074\u0020\u0062\u006f\u006f\u006b\u0069\u006e\u0067\u0020\u0073\u0061\u0075\u002e'}
          tone="unconfirmed"
          onPress={() => setBookingStatus('unconfirmed')}
        />

        {bookingStatus === 'unconfirmed' ? (
          <View className="mt-3 rounded-[16px] border border-slate-200 bg-white p-3.5">
            <Text className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
              {'\u0048\u1ed7\u0020\u0074\u0072\u1ee3\u0020\u0062\u006f\u006f\u006b\u0069\u006e\u0067'}
            </Text>
            <Text className="mt-3 text-[14px] font-bold text-slate-900">
              {'\u0042\u1ea1\u006e\u0020\u0063\u00f3\u0020\u006d\u0075\u1ed1\u006e\u0020\u0111\u1eb7\u0074\u0020\u0073\u00e2\u006e\u0020\u006e\u0067\u0061\u0079\u0020\u0062\u00e2\u0079\u0020\u0067\u0069\u1edd\u0020\u006b\u0068\u00f4\u006e\u0067\u003f'}
            </Text>
            <Text className="mt-1 text-[12px] leading-snug text-slate-500">
              {'\u004e\u1ebf\u0075\u0020\u0063\u00f3\u002c\u0020\u0062\u1ea1\u006e\u0020\u0063\u00f3\u0020\u0074\u0068\u1ec3\u0020\u006d\u1edf\u0020\u006c\u0069\u006e\u006b\u0020\u0062\u006f\u006f\u006b\u0069\u006e\u0067\u0020\u0076\u00e0\u0020\u006c\u01b0\u0075\u0020\u0074\u0068\u00f4\u006e\u0067\u0020\u0074\u0069\u006e\u0020\u006e\u0067\u0061\u0079\u0020\u0074\u1ea1\u0069\u0020\u0111\u00e2\u0079\u002e'}
            </Text>

            <View className="mt-3 flex-row gap-3">
              <TouchableOpacity
                activeOpacity={0.92}
                onPress={() => setWantsBookingNow(true)}
                className={`flex-1 items-center rounded-[14px] border py-3 ${
                  wantsBookingNow === true
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <Text className={`text-[13px] font-black ${wantsBookingNow === true ? 'text-emerald-700' : 'text-slate-600'}`}>
                  {'\u0043\u00f3'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.92}
                onPress={() => setWantsBookingNow(false)}
                className={`flex-1 items-center rounded-[14px] border py-3 ${
                  wantsBookingNow === false
                    ? 'border-slate-900 bg-slate-900'
                    : 'border-slate-200 bg-white'
                }`}
              >
                <Text className={`text-[13px] font-black ${wantsBookingNow === false ? 'text-white' : 'text-slate-600'}`}>
                  {'\u0043\u0068\u01b0\u0061'}
                </Text>
              </TouchableOpacity>
            </View>

            {wantsBookingNow ? (
              <View className="mt-3 rounded-[14px] border border-amber-200 bg-amber-50 p-3">
                <Text className="text-[12px] font-medium leading-snug text-amber-800">
                  {'\u004d\u1edf\u0020\u006c\u0069\u006e\u006b\u0020\u0111\u1eb7\u0074\u0020\u0073\u00e2\u006e\u0020\u0111\u1ec3\u0020\u0074\u0068\u1ef1\u0063\u0020\u0068\u0069\u1ec7\u006e\u0020\u0062\u006f\u006f\u006b\u0069\u006e\u0067\u002c\u0020\u0073\u0061\u0075\u0020\u0111\u00f3\u0020\u0062\u1ea1\u006e\u0020\u0063\u00f3\u0020\u0074\u0068\u1ec3\u0020\u006e\u0068\u1ead\u0070\u0020\u0074\u0068\u00f4\u006e\u0067\u0020\u0074\u0069\u006e\u0020\u0062\u00ea\u006e\u0020\u0064\u01b0\u1edb\u0069\u0020\u0111\u1ec3\u0020\u0064\u1ec5\u0020\u0074\u0068\u0065\u006f\u0020\u0064\u00f5\u0069\u002e'}
                </Text>

                <TouchableOpacity
                  activeOpacity={0.92}
                  onPress={onOpenBookingLink}
                  className={`mt-3 flex-row items-center justify-center rounded-[14px] py-3 ${
                    canOpenBookingLink ? 'bg-emerald-600' : 'bg-slate-400'
                  }`}
                >
                  <ExternalLink size={16} color="#ffffff" />
                  <Text className="ml-2 text-[13px] font-bold text-white">
                    {'\u004d\u1edf\u0020\u006c\u0069\u006e\u006b\u0020\u0062\u006f\u006f\u006b\u0069\u006e\u0067\u0020\u0063\u1ee7\u0061\u0020\u0073\u00e2\u006e'}
                  </Text>
                </TouchableOpacity>

                <View className="mt-3 gap-3">
                  <TextInput
                    value={bookingReference}
                    onChangeText={setBookingReference}
                    placeholder={'\u004d\u00e3\u0020\u0062\u006f\u006f\u006b\u0069\u006e\u0067\u0020\u002f\u0020\u006d\u00e3\u0020\u0111\u1eb7\u0074\u0020\u0073\u00e2\u006e'}
                    placeholderTextColor="#94a3b8"
                    className="rounded-[14px] border border-slate-200 bg-white px-3.5 py-3 text-[14px] text-slate-900"
                  />

                  <TextInput
                    value={bookingName}
                    onChangeText={setBookingName}
                    placeholder={'\u0054\u00ea\u006e\u0020\u006e\u0067\u01b0\u1eddi\u0020\u0111\u1eb7\u0074'}
                    placeholderTextColor="#94a3b8"
                    className="rounded-[14px] border border-slate-200 bg-white px-3.5 py-3 text-[14px] text-slate-900"
                  />

                  <TextInput
                    value={bookingPhone}
                    onChangeText={setBookingPhone}
                    keyboardType="phone-pad"
                    placeholder={'\u0053\u1ed1\u0020\u0111\u0069\u1ec7\u006e\u0020\u0074\u0068\u006f\u1ea1\u0069\u0020\u0062\u006f\u006f\u006b\u0069\u006e\u0067'}
                    placeholderTextColor="#94a3b8"
                    className="rounded-[14px] border border-slate-200 bg-white px-3.5 py-3 text-[14px] text-slate-900"
                  />

                  <TextInput
                    value={bookingNotes}
                    onChangeText={setBookingNotes}
                    multiline
                    placeholder={'\u0047\u0068\u0069\u0020\u0063\u0068\u00fa\u0020\u0062\u006f\u006f\u006b\u0069\u006e\u0067'}
                    placeholderTextColor="#94a3b8"
                    className="min-h-[96px] rounded-[14px] border border-slate-200 bg-white px-3.5 py-3 text-[14px] text-slate-900"
                    style={{ textAlignVertical: 'top' }}
                  />
                </View>
              </View>
            ) : null}
          </View>
        ) : null}

        <View className="mt-6 rounded-[16px] border border-slate-200 bg-white p-3">
          <Text className="mb-3 ml-1 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
            {'\u0044\u0065\u0061\u0064\u006c\u0069\u006e\u0065\u0020\u0074\u0068\u0061\u006d\u0020\u0067\u0069\u0061'}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {DEADLINE_OPTIONS.map((hours) => (
              <TouchableOpacity
                key={hours}
                activeOpacity={0.92}
                onPress={() => setDeadlineHours(hours)}
                className={`rounded-[12px] border px-3 py-2.5 ${
                  deadlineHours === hours
                    ? 'border-rose-300 bg-rose-50'
                    : 'border-slate-200 bg-slate-50'
                }`}
              >
                <Text className={`text-[13px] font-bold ${deadlineHours === hours ? 'text-rose-700' : 'text-slate-500'}`}>
                  {`${hours} \u0067\u0069\u1edd`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="mt-3 rounded-[16px] border border-slate-200 bg-white p-3.5">
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-1 flex-row items-start gap-3">
              <View className="mt-0.5 h-9 w-9 items-center justify-center rounded-[12px] bg-indigo-50">
                <ShieldCheck size={18} color="#4f46e5" />
              </View>
              <View className="flex-1">
                <Text className="text-[14px] font-bold text-slate-900">{'\u0054\u1ef1\u0020\u0111\u1ed9\u006e\u0067\u0020\u0064\u0075\u0079\u1ec7\u0074'}</Text>
                <Text className="mt-0.5 text-[12px] leading-snug text-slate-500">
                  {'\u0042\u1ead\u0074\u0020\u0111\u1ec3\u0020\u006e\u0067\u01b0\u1eddi\u0020\u0063\u0068\u01a1\u0069\u0020\u0076\u00e0\u006f\u0020\u006b\u00e8\u006f\u0020\u006e\u0067\u0061\u0079\u002c\u0020\u0074\u1eaft\u0020\u0111\u1ec3\u0020\u0068\u006f\u0073\u0074\u0020\u0064\u0075\u0079\u1ec7\u0074\u0020\u0074\u0068\u1ee7\u0020\u0063\u00f4\u006e\u0067\u002e'}
                </Text>
              </View>
            </View>
            <Switch
              value={!requireApproval}
              onValueChange={(value) => setRequireApproval(!value)}
              trackColor={{ false: '#cbd5e1', true: '#86efac' }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        <View className="mt-3 rounded-[16px] border border-slate-200 bg-white p-3.5">
          <Text className="mb-3 ml-1 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
            {'\u0043\u0068\u0069\u0020\u0070\u0068\u00ed'}
          </Text>
          <View className="flex-row items-center gap-3 rounded-[14px] border border-slate-200 bg-slate-50 px-3.5">
            <Wallet size={18} color="#64748b" />
            <TextInput
              value={totalCostStr}
              onChangeText={setTotalCostStr}
              keyboardType="number-pad"
              placeholder={'\u0056\u00ed\u0020\u0064\u1ee5\u003a\u0020\u0038\u0030\u0030\u0030\u0030\u0030'}
              placeholderTextColor="#94a3b8"
              className="flex-1 py-3 text-[14px] font-bold text-slate-900"
            />
          </View>
          <View className="mt-3 flex-row items-center gap-2">
            <Clock3 size={14} color="#64748b" />
            <Text className="text-[12px] font-medium text-slate-500">
              {costPerPerson > 0
                ? `${costPerPerson.toLocaleString('vi-VN')}\u0111/\u006e\u0067\u01b0\u1eddi`
                : '\u0110\u1ec3\u0020\u0074\u0072\u1ed1\u006e\u0067\u0020\u006e\u1ebf\u0075\u0020\u006d\u0075\u1ed1\u006e\u0020\u0074\u1ea1\u006f\u0020\u006b\u00e8\u006f\u0020\u006d\u0069\u1ec5\u006e\u0020\u0070\u0068\u00ed'}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 border-t border-slate-200 bg-white/95 px-4 pb-8 pt-3 backdrop-blur-md">
        <TouchableOpacity
          activeOpacity={0.92}
          onPress={onContinue}
          className="h-14 w-full flex-row items-center justify-center rounded-[14px] bg-emerald-600 active:scale-95"
        >
          <Text className="text-[16px] font-bold tracking-wide text-white">{'\u0054\u0069\u1ebf\u0070\u0020\u0074\u1ee5\u0063'}</Text>
          <ArrowRight size={18} color="white" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}
