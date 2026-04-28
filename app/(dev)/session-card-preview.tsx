import SessionCard from '@/components/sessions/SessionCard'
import { colors } from '@/constants/colors'
import { ScrollView, Text, View } from 'react-native'
import { SCREEN_FONTS } from '@/constants/typography'

function atTime(base: Date, hour: number, minute: number): Date {
  const d = new Date(base)
  d.setHours(hour, minute, 0, 0)
  return d
}

export default function SessionCardPreviewScreen() {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)

  const fiveDaysOut = new Date(now)
  fiveDaysOut.setDate(now.getDate() + 5)

  const sessions = [
    {
      id: '1',
      courtName: 'Sân M? Ðình',
      courtAddress: 'Q. Nam T? Liêm',
      distanceKm: 1.2,
      courtBookingConfirmed: true,
      startTime: atTime(now, 7, 0),
      endTime: atTime(now, 9, 0),
      level: '3.5',
      levelMatchesUser: true,
      host: { id: 'host-a', name: 'Nguy?n Anh', initial: 'A' },
      enrolledCount: 3,
      capacity: 4,
      pricePerPerson: 80000,
      status: 'open' as const,
    },
    {
      id: '2',
      courtName: 'Sân Pickleball B?c T? Liêm',
      courtAddress: 'Q. B?c T? Liêm',
      distanceKm: 0.4,
      courtBookingConfirmed: true,
      startTime: atTime(tomorrow, 18, 30),
      endTime: atTime(tomorrow, 20, 30),
      level: '4.0',
      levelMatchesUser: true,
      host: { id: 'host-b', name: 'Tr?n Minh Hoàng', initial: 'H' },
      enrolledCount: 2,
      capacity: 4,
      pricePerPerson: 120000,
      status: 'starting_soon' as const,
    },
    {
      id: '3',
      courtName: 'Sân Trung Tâm Th? Thao Và Gi?i Trí Phú M? Hung',
      courtAddress: 'Q. 7',
      courtBookingConfirmed: false,
      startTime: atTime(fiveDaysOut, 6, 0),
      endTime: atTime(fiveDaysOut, 8, 0),
      level: '3.0',
      levelMatchesUser: false,
      host: { id: 'host-c', name: 'Lê Qu?c B?o', initial: 'B' },
      enrolledCount: 4,
      capacity: 4,
      pricePerPerson: 90000,
      status: 'full' as const,
    },
    {
      id: '4',
      courtName: 'Sân Hoàn Ki?m',
      courtAddress: 'Q. Hoàn Ki?m',
      distanceKm: 2.8,
      courtBookingConfirmed: true,
      startTime: atTime(fiveDaysOut, 20, 0),
      endTime: atTime(fiveDaysOut, 22, 0),
      level: '3.5',
      levelMatchesUser: true,
      host: { id: 'host-d', name: 'Ph?m Thu Hà', initial: 'H' },
      enrolledCount: 4,
      capacity: 4,
      pricePerPerson: 100000,
      status: 'past' as const,
    },
  ]

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 16, rowGap: 14 }}>
      <View style={{ marginBottom: 4 }}>
        <Text style={{ fontFamily: SCREEN_FONTS.headline, fontSize: 28, color: colors.text }}>Session Card Preview</Text>
        <Text style={{ fontFamily: SCREEN_FONTS.body, fontSize: 13, color: colors.textSecondary }}>
          4 variants: open, starting soon, full, past
        </Text>
      </View>

      {sessions.map((session) => (
        <SessionCard key={session.id} session={session} onPress={() => undefined} onJoinPress={() => undefined} />
      ))}
    </ScrollView>
  )
}
