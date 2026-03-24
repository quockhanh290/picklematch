import { Text, TouchableOpacity, View } from 'react-native'

type RequestItem = {
  id: string
  player_id: string
  intro_note?: string | null
  host_response_template?: string | null
  player: {
    name: string
    elo?: number | null
    current_elo?: number | null
    sessions_joined?: number | null
    no_show_count?: number | null
  }
}

const TEMPLATES = [
  'Trình hơi lệch, bạn chắc chứ?',
  'Đợi mình gom đủ người rồi báo nhé',
  'Ưu tiên nữ để cân team',
]

type Props = {
  requests: RequestItem[]
  matchTargetElo: number
  onOpenPlayer: (playerId: string) => void
  onAccept: (requestId: string, playerId: string) => void
  onReject: (requestId: string, playerId: string) => void
  onReplyTemplate: (requestId: string, playerId: string, template: string) => void
}

export function HostRequestReview({
  requests,
  matchTargetElo,
  onOpenPlayer,
  onAccept,
  onReject,
  onReplyTemplate,
}: Props) {
  if (requests.length === 0) return null

  return (
    <View className="mt-8">
      <Text className="mb-4 text-base font-black text-slate-900">Review Requests · {requests.length}</Text>

      {requests.map((request) => {
        const playerElo = request.player.current_elo ?? request.player.elo ?? 0
        const diff = playerElo - matchTargetElo
        const diffLabel = `${diff >= 0 ? '+' : ''}${diff} Elo`

        return (
          <View key={request.id} className="mb-4 rounded-[24px] bg-slate-50 p-4">
            <TouchableOpacity activeOpacity={0.85} onPress={() => onOpenPlayer(request.player_id)}>
              <View className="flex-row items-start justify-between">
                <View className="mr-4 flex-1">
                  <Text className="text-base font-bold text-slate-900">{request.player.name}</Text>
                  <Text className="mt-1 text-xs text-slate-500">
                    Elo {playerElo} · {request.player.sessions_joined ?? 0} kèo
                  </Text>
                </View>

                <View className={`rounded-full px-3 py-1.5 ${diff >= 0 ? 'bg-emerald-100' : 'bg-orange-100'}`}>
                  <Text className={`text-xs font-bold ${diff >= 0 ? 'text-emerald-700' : 'text-orange-700'}`}>
                    {diffLabel}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            <View className="mt-3 rounded-2xl bg-white px-4 py-3">
              <Text className="text-xs font-bold uppercase tracking-[1px] text-slate-400">Intro note</Text>
              <Text className="mt-2 text-sm leading-6 text-slate-700">
                {request.intro_note?.trim() ? request.intro_note : 'Người chơi chưa để lại lời nhắn.'}
              </Text>
            </View>

            {request.host_response_template ? (
              <View className="mt-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3">
                <Text className="text-xs font-bold uppercase tracking-[1px] text-sky-700">Template đã gửi</Text>
                <Text className="mt-2 text-sm leading-6 text-sky-800">{request.host_response_template}</Text>
              </View>
            ) : null}

            <View className="mt-3 flex-row gap-2">
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => onAccept(request.id, request.player_id)}
                className="flex-1 items-center justify-center rounded-2xl bg-emerald-600 py-3"
              >
                <Text className="text-sm font-bold text-white">Accept</Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => onReject(request.id, request.player_id)}
                className="flex-1 items-center justify-center rounded-2xl bg-rose-100 py-3"
              >
                <Text className="text-sm font-bold text-rose-700">Reject</Text>
              </TouchableOpacity>
            </View>

            <View className="mt-3 flex-row flex-wrap gap-2">
              {TEMPLATES.map((template) => (
                <TouchableOpacity
                  key={template}
                  activeOpacity={0.9}
                  onPress={() => onReplyTemplate(request.id, request.player_id, template)}
                  className="rounded-full bg-slate-200 px-3 py-2"
                >
                  <Text className="text-xs font-semibold text-slate-700">{template}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )
      })}
    </View>
  )
}
