import { Text, View } from 'react-native'

type Props = {
  courtBookingStatus: 'confirmed' | 'unconfirmed'
  bookingReference?: string | null
  bookingName?: string | null
  bookingPhone?: string | null
  bookingNotes?: string | null
}

export function BookingDetailsCard({
  courtBookingStatus,
  bookingReference,
  bookingName,
  bookingPhone,
  bookingNotes,
}: Props) {
  return (
    <View className="mt-5 rounded-[32px] border border-slate-200 bg-slate-50 p-5">
      <View className="flex-row items-center justify-between gap-3">
        <View>
          <Text className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">
            Thông tin đặt sân
          </Text>
          <Text className="mt-1 text-[15px] font-bold text-slate-900">
            Chỉ host nhìn thấy phần này để tiện check sân.
          </Text>
        </View>

        <View
          className={`rounded-full px-3 py-2 ${
            courtBookingStatus === 'confirmed' ? 'bg-emerald-100' : 'bg-amber-100'
          }`}
        >
          <Text
            className={`text-[11px] font-black uppercase tracking-[0.08em] ${
              courtBookingStatus === 'confirmed' ? 'text-emerald-700' : 'text-amber-700'
            }`}
          >
            {courtBookingStatus === 'confirmed' ? 'Đã chốt sân' : 'Chờ xác nhận'}
          </Text>
        </View>
      </View>

      <View className="mt-4 gap-3">
        {bookingReference ? (
          <View className="rounded-[22px] bg-white px-4 py-3">
            <Text className="text-[11px] font-black uppercase tracking-[0.08em] text-slate-400">Mã đặt sân</Text>
            <Text className="mt-1 text-[14px] font-bold text-slate-900">{bookingReference}</Text>
          </View>
        ) : null}

        {bookingName ? (
          <View className="rounded-[22px] bg-white px-4 py-3">
            <Text className="text-[11px] font-black uppercase tracking-[0.08em] text-slate-400">Tên đặt sân</Text>
            <Text className="mt-1 text-[14px] font-bold text-slate-900">{bookingName}</Text>
          </View>
        ) : null}

        {bookingPhone ? (
          <View className="rounded-[22px] bg-white px-4 py-3">
            <Text className="text-[11px] font-black uppercase tracking-[0.08em] text-slate-400">Số điện thoại</Text>
            <Text className="mt-1 text-[14px] font-bold text-slate-900">{bookingPhone}</Text>
          </View>
        ) : null}

        {bookingNotes ? (
          <View className="rounded-[22px] bg-white px-4 py-3">
            <Text className="text-[11px] font-black uppercase tracking-[0.08em] text-slate-400">Ghi chú</Text>
            <Text className="mt-1 text-[14px] leading-6 text-slate-700">{bookingNotes}</Text>
          </View>
        ) : null}
      </View>
    </View>
  )
}
