import { router, useLocalSearchParams } from 'expo-router'
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { AlertTriangle, ArrowLeft, CheckCheck, Clock3, ShieldAlert, Trophy } from 'lucide-react-native'
import { useEffect, useMemo, useState } from 'react'

import { supabase } from '@/lib/supabase'

type SessionPlayerRecord = {
  player_id: string
  status?: string | null
  team_no?: 1 | 2 | null
  proposed_result?: string | null
  result_confirmation_status?: string | null
  result_dispute_note?: string | null
  player?: {
    name?: string | null
  } | null
}

type ConfirmableSession = {
  id: string
  status: string
  results_status?: string | null
  results_confirmation_deadline?: string | null
  host: {
    id: string
    name?: string | null
  }
  slot: {
    start_time: string
    end_time: string
    court: {
      name: string
      address?: string | null
      city?: string | null
    }
  }
  session_players: SessionPlayerRecord[]
}

function formatDateTime(value?: string | null) {
  if (!value) return 'Chưa có hạn xác nhận'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Chưa có hạn xác nhận'
  return date.toLocaleString('vi-VN', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getResultCopy(result?: string | null) {
  switch (result) {
    case 'win':
      return {
        title: 'Chủ kèo đang ghi nhận bạn thắng trận',
        badge: 'Thắng',
        tone: 'emerald' as const,
        description: 'Nếu kết quả này đúng, bạn có thể xác nhận để hệ thống chốt trận nhanh hơn.',
      }
    case 'loss':
      return {
        title: 'Chủ kèo đang ghi nhận bạn thua trận',
        badge: 'Thua',
        tone: 'slate' as const,
        description: 'Nếu kết quả này đúng, bạn có thể xác nhận để hệ thống chốt trận nhanh hơn.',
      }
    case 'draw':
      return {
        title: 'Chủ kèo đang ghi nhận trận này hòa',
        badge: 'Hòa',
        tone: 'amber' as const,
        description: 'Nếu kết quả này đúng, bạn có thể xác nhận để hệ thống hoàn tất trận.',
      }
    default:
      return {
        title: 'Chủ kèo đã gửi kết quả trận để bạn xác nhận',
        badge: 'Chờ xác nhận',
        tone: 'indigo' as const,
        description: 'Bạn có thể xác nhận hoặc tranh chấp nếu thấy kết quả không đúng.',
      }
  }
}

function getToneStyles(tone: 'emerald' | 'slate' | 'amber' | 'indigo') {
  if (tone === 'emerald') return { bg: '#ecfdf5', border: '#a7f3d0', text: '#047857' }
  if (tone === 'amber') return { bg: '#fffbeb', border: '#fcd34d', text: '#b45309' }
  if (tone === 'slate') return { bg: '#f8fafc', border: '#cbd5e1', text: '#334155' }
  return { bg: '#eef2ff', border: '#c7d2fe', text: '#4338ca' }
}

export default function ConfirmSessionResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState<'confirmed' | 'disputed' | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [session, setSession] = useState<ConfirmableSession | null>(null)
  const [disputeNote, setDisputeNote] = useState('')

  useEffect(() => {
    let mounted = true

    async function load() {
      if (!id) {
        if (mounted) setLoading(false)
        return
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.replace('/login' as any)
        return
      }

      if (mounted) setUserId(user.id)

      const { data, error } = await supabase.rpc('get_session_detail_overview', {
        p_session_id: id,
      })

      if (error) {
        Alert.alert('Không tải được kết quả trận', error.message)
        if (mounted) {
          setSession(null)
          setLoading(false)
        }
        return
      }

      const nextSession = (data?.session ?? null) as ConfirmableSession | null

      if (nextSession?.host?.id === user.id) {
        Alert.alert('Chủ kèo không dùng màn này', 'Chủ kèo gửi kết quả ở bước nhập kết quả trận, không dùng luồng xác nhận của người chơi.')
        router.back()
        return
      }

      if (mounted) {
        setSession(nextSession)
        setLoading(false)
      }
    }

    void load()

    return () => {
      mounted = false
    }
  }, [id])

  const myEntry = useMemo(
    () => session?.session_players.find((player) => player.player_id === userId) ?? null,
    [session, userId],
  )

  const confirmedPlayers = useMemo(
    () => session?.session_players.filter((player) => player.status === 'confirmed') ?? [],
    [session],
  )

  const teamA = confirmedPlayers.filter((player) => player.team_no === 1)
  const teamB = confirmedPlayers.filter((player) => player.team_no === 2)
  const resultCopy = getResultCopy(myEntry?.proposed_result)
  const resultTone = getToneStyles(resultCopy.tone)
  const isMemberFallbackFlow =
    session?.results_status === 'not_submitted' && (session.status === 'pending_completion' || session.status === 'done')

  async function submitResponse(response: 'confirmed' | 'disputed') {
    if (!id || !myEntry) return

    if (response === 'disputed' && !disputeNote.trim()) {
      Alert.alert('Thêm ghi chú giúp host', 'Nếu bạn tranh chấp kết quả, hãy nói ngắn gọn điều gì đang không đúng.')
      return
    }

    setSubmitting(response)

    const { data, error } = await supabase.rpc('respond_to_session_result', {
      p_session_id: id,
      p_response: response,
      p_note: response === 'disputed' ? disputeNote.trim() : null,
    })

    setSubmitting(null)

    if (error) {
      Alert.alert('Chưa thể ghi nhận phản hồi', error.message)
      return
    }

    const message =
      data === 'finalized'
        ? 'Kết quả trận đã được chốt sau phản hồi của bạn.'
        : data === 'disputed'
          ? 'Trận đã được chuyển sang trạng thái tranh chấp để host và hệ thống xem lại.'
          : 'Phản hồi của bạn đã được ghi nhận.'

    Alert.alert('Đã cập nhật', message, [
      {
        text: 'OK',
        onPress: () => router.replace({ pathname: '/session/[id]' as any, params: { id } }),
      },
    ])
  }

  async function submitMemberReport() {
    if (!id) return

    setSubmitting('confirmed')

    const { data, error } = await supabase.rpc('report_host_unprofessional', {
      p_session_id: id,
      p_note: disputeNote.trim() || null,
    })

    setSubmitting(null)

    if (error) {
      Alert.alert('Chưa thể gửi báo cáo', error.message)
      return
    }

    const message =
      data === 'already_reported'
        ? 'Bạn đã gửi báo cáo về host ở kèo này trước đó.'
        : 'Báo cáo của bạn đã được ghi nhận. Hệ thống sẽ dùng tín hiệu này để xem xét việc host không xử lý kết quả đúng hạn.'

    Alert.alert('Đã ghi nhận', message, [
      {
        text: 'OK',
        onPress: () => router.replace({ pathname: '/session/[id]' as any, params: { id } }),
      },
    ])
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-slate-50" edges={['top']}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </SafeAreaView>
    )
  }

  if (!session || !myEntry) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-slate-50 px-6" edges={['top']}>
        <Text className="text-center text-lg font-black text-slate-950">Không tìm thấy dữ liệu xác nhận</Text>
        <Text className="mt-3 text-center text-sm font-semibold leading-6 text-slate-500">
          Kèo này có thể chưa có kết quả cần xác nhận hoặc bạn không thuộc danh sách người chơi.
        </Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <View className="flex-1">
        <View
          className="border-b border-slate-200 bg-white px-5 pb-4"
          style={{ paddingTop: Math.max(insets.top, 12) }}
        >
          <View className="flex-row items-center justify-between">
            <Pressable
              onPress={() => router.back()}
              className="h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white"
            >
              <ArrowLeft size={20} color="#0f172a" strokeWidth={2.5} />
            </Pressable>
            <Text className="text-[18px] font-black text-slate-950">Xác nhận kết quả</Text>
            <View className="h-11 w-11" />
          </View>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 160 + insets.bottom }}
        >
          <View className="rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
            <Text className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Trạng thái trận</Text>
            <Text className="mt-3 text-[28px] font-black leading-9 text-slate-950">{session.slot.court.name}</Text>
            <Text className="mt-2 text-sm font-semibold text-slate-500">
              {isMemberFallbackFlow
                ? `${session.host.name ?? 'Chủ kèo'} chưa gửi kết quả đúng hạn.`
                : `${session.host.name ?? 'Chủ kèo'} đã gửi kết quả cho bạn xác nhận`}
            </Text>
            <Text className="mt-2 text-sm font-semibold text-slate-500">
              {isMemberFallbackFlow
                ? 'Bạn có thể báo kết quả mình ghi nhận hoặc cho biết trận không diễn ra.'
                : `${session.host.name ?? 'Chủ kèo'} đã gửi kết quả cho bạn xác nhận`}
            </Text>

            <View
              className="mt-5 rounded-[24px] border px-4 py-4"
              style={{ backgroundColor: resultTone.bg, borderColor: resultTone.border }}
            >
              {isMemberFallbackFlow ? (
                <>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[15px] font-black text-amber-700">Chủ kèo chưa gửi kết quả</Text>
                    <View className="rounded-full bg-white/80 px-3 py-1.5">
                      <Text className="text-[11px] font-black uppercase tracking-[0.12em] text-amber-700">Báo trận</Text>
                    </View>
                  </View>
                  <Text className="mt-3 text-sm leading-6 text-amber-700">
                    Hãy chọn kết quả bạn ghi nhận. Nếu trận không diễn ra, chọn `Trận không diễn ra`.
                  </Text>
                </>
              ) : (
                <>
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[15px] font-black" style={{ color: resultTone.text }}>
                      {resultCopy.title}
                    </Text>
                    <View className="rounded-full bg-white/80 px-3 py-1.5">
                      <Text className="text-[11px] font-black uppercase tracking-[0.12em]" style={{ color: resultTone.text }}>
                        {resultCopy.badge}
                      </Text>
                    </View>
                  </View>
                  <Text className="mt-3 text-sm leading-6" style={{ color: resultTone.text }}>
                    {resultCopy.description}
                  </Text>
                </>
              )}
            </View>

            <View className="mt-5 flex-row items-center rounded-[24px] bg-slate-50 px-4 py-4">
              <Clock3 size={18} color="#4f46e5" strokeWidth={2.5} />
              <View className="ml-3 flex-1">
                <Text className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Hạn xác nhận</Text>
                <Text className="mt-1 text-sm font-bold text-slate-900">
                  {formatDateTime(session.results_confirmation_deadline)}
                </Text>
              </View>
            </View>
          </View>

          <View className="mt-5 rounded-[32px] border border-slate-200 bg-white p-5 shadow-sm">
            <Text className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Đội hình trận</Text>

            <View className="mt-4 rounded-[24px] bg-emerald-50 p-4">
              <Text className="text-[13px] font-black uppercase tracking-[0.12em] text-emerald-700">Đội 1</Text>
              {teamA.length > 0 ? teamA.map((player) => (
                <Text key={player.player_id} className="mt-2 text-[15px] font-bold text-slate-900">
                  {player.player?.name ?? 'Người chơi'}
                </Text>
              )) : <Text className="mt-2 text-sm text-slate-500">Chưa có dữ liệu đội.</Text>}
            </View>

            <View className="mt-4 rounded-[24px] bg-indigo-50 p-4">
              <Text className="text-[13px] font-black uppercase tracking-[0.12em] text-indigo-700">Đội 2</Text>
              {teamB.length > 0 ? teamB.map((player) => (
                <Text key={player.player_id} className="mt-2 text-[15px] font-bold text-slate-900">
                  {player.player?.name ?? 'Người chơi'}
                </Text>
              )) : <Text className="mt-2 text-sm text-slate-500">Chưa có dữ liệu đội.</Text>}
            </View>
          </View>

          <View className="mt-5 rounded-[32px] border border-rose-200 bg-rose-50 p-5">
            <View className="flex-row items-center">
              <ShieldAlert size={18} color="#be123c" strokeWidth={2.5} />
              <Text className="ml-2 text-[15px] font-black text-rose-700">Nếu kết quả chưa đúng</Text>
            </View>
            <Text className="mt-3 text-sm leading-6 text-rose-700">
              {isMemberFallbackFlow
                ? 'Chủ kèo chưa gửi kết quả đúng hạn. Bạn có thể báo cáo việc vận hành kèo chưa tốt để hệ thống ghi nhận.'
                : 'Chỉ tranh chấp khi bạn thấy host ghi sai đội thắng/thua hoặc trận không diễn ra như báo cáo.'}
            </Text>

            <TextInput
              value={disputeNote}
              onChangeText={setDisputeNote}
              multiline
              textAlignVertical="top"
              placeholder={
                isMemberFallbackFlow
                  ? 'Ví dụ: host không có mặt, không chốt đội hình hoặc không xác nhận kết quả đúng hẹn.'
                  : 'Ví dụ: đội mình thực tế thắng 11-8, hoặc trận chưa diễn ra.'
              }
              placeholderTextColor="#9f1239"
              className="mt-4 min-h-[112px] rounded-[24px] border border-rose-200 bg-white px-4 py-4 text-[15px] text-slate-900"
            />
          </View>

          {myEntry.result_confirmation_status === 'disputed' && myEntry.result_dispute_note ? (
            <View className="mt-5 rounded-[28px] border border-amber-200 bg-amber-50 p-4">
              <View className="flex-row items-center">
                <AlertTriangle size={16} color="#b45309" strokeWidth={2.5} />
                <Text className="ml-2 text-sm font-black text-amber-700">Bạn đã gửi tranh chấp trước đó</Text>
              </View>
              <Text className="mt-3 text-sm leading-6 text-amber-700">{myEntry.result_dispute_note}</Text>
            </View>
          ) : null}
        </ScrollView>

        <View
          className="border-t border-slate-200 bg-white px-5 pb-4 pt-4"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          {isMemberFallbackFlow ? (
            <Pressable
              onPress={() => void submitMemberReport()}
              disabled={submitting != null}
              className="h-14 flex-row items-center justify-center rounded-full bg-amber-500"
            >
              {submitting === 'confirmed' ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <ShieldAlert size={18} color="#ffffff" strokeWidth={2.5} />
                  <Text className="ml-2 text-[15px] font-black uppercase tracking-[0.08em] text-white">Báo chủ kèo xử lý kém</Text>
                </>
              )}
            </Pressable>
          ) : (
            <>
              <Pressable
                onPress={() => void submitResponse('confirmed')}
                disabled={submitting != null}
                className="h-14 flex-row items-center justify-center rounded-full bg-emerald-600"
              >
                {submitting === 'confirmed' ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <CheckCheck size={18} color="#ffffff" strokeWidth={2.5} />
                    <Text className="ml-2 text-[15px] font-black uppercase tracking-[0.08em] text-white">Kết quả đúng</Text>
                  </>
                )}
              </Pressable>

              <Pressable
                onPress={() => void submitResponse('disputed')}
                disabled={submitting != null}
                className="mt-3 h-14 flex-row items-center justify-center rounded-full border border-rose-200 bg-rose-50"
              >
                {submitting === 'disputed' ? (
                  <ActivityIndicator color="#be123c" />
                ) : (
                  <>
                    <Trophy size={18} color="#be123c" strokeWidth={2.5} />
                    <Text className="ml-2 text-[15px] font-black uppercase tracking-[0.08em] text-rose-600">Tranh chấp kết quả</Text>
                  </>
                )}
              </Pressable>
            </>
          )}
        </View>
      </View>
    </SafeAreaView>
  )
}
