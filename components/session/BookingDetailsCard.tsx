import { PROFILE_THEME_COLORS } from '@/components/profile/profileTheme'
import { FileText, Hash, Phone, ShieldAlert, ShieldCheck, User } from 'lucide-react-native'
import type { ComponentType } from 'react'
import { Text, View } from 'react-native'
import { SCREEN_FONTS } from '@/constants/screenFonts'

type Props = {
  courtBookingStatus: 'confirmed' | 'unconfirmed'
  bookingReference?: string | null
  bookingName?: string | null
  bookingPhone?: string | null
  bookingNotes?: string | null
}

function InfoRow({
  icon: Icon,
  label,
  value,
  showDivider = true,
}: {
  icon: ComponentType<any>
  label: string
  value: string
  showDivider?: boolean
}) {
  return (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 999,
            backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon size={18} color={PROFILE_THEME_COLORS.primary} strokeWidth={2.4} />
        </View>
        <View style={{ marginLeft: 14, flex: 1 }}>
          <Text
            style={{
              fontSize: 10,
              fontFamily: SCREEN_FONTS.bold,
              textTransform: 'uppercase',
              letterSpacing: 1.8,
              color: PROFILE_THEME_COLORS.outline,
            }}
          >
            {label}
          </Text>
          <Text
            style={{
              marginTop: 3,
              fontSize: 14,
              fontFamily: SCREEN_FONTS.label,
              color: PROFILE_THEME_COLORS.onSurface,
              lineHeight: 20,
            }}
          >
            {value}
          </Text>
        </View>
      </View>
      {showDivider && (
        <View style={{ height: 1, backgroundColor: PROFILE_THEME_COLORS.outlineVariant, marginVertical: 14 }} />
      )}
    </>
  )
}

export function BookingDetailsCard({
  courtBookingStatus,
  bookingReference,
  bookingName,
  bookingPhone,
  bookingNotes,
}: Props) {
  const isConfirmed = courtBookingStatus === 'confirmed'
  const rows = (
    [
      bookingReference ? { icon: Hash, label: 'Mã đặt sân', value: bookingReference } : null,
      bookingName ? { icon: User, label: 'Tên đặt sân', value: bookingName } : null,
      bookingPhone ? { icon: Phone, label: 'Số điện thoại', value: bookingPhone } : null,
      bookingNotes ? { icon: FileText, label: 'Ghi chú', value: bookingNotes } : null,
    ] as ({ icon: ComponentType<any>; label: string; value: string } | null)[]
  ).filter((r): r is { icon: ComponentType<any>; label: string; value: string } => r !== null)

  if (rows.length === 0) return null

  return (
    <View
      style={{
        marginTop: 16,
        borderRadius: 28,
        backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLowest,
        shadowColor: PROFILE_THEME_COLORS.onBackground,
        shadowOpacity: 0.06,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
        elevation: 3,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingTop: 18,
          paddingBottom: 14,
          borderBottomWidth: 1,
          borderBottomColor: PROFILE_THEME_COLORS.outlineVariant,
        }}
      >
        <View>
          <Text
            style={{
              fontSize: 10,
              fontFamily: SCREEN_FONTS.bold,
              textTransform: 'uppercase',
              letterSpacing: 1.8,
              color: PROFILE_THEME_COLORS.outline,
            }}
          >
            Thông tin đặt sân
          </Text>
          <Text
            style={{
              marginTop: 3,
              fontSize: 13,
              fontFamily: SCREEN_FONTS.label,
              color: PROFILE_THEME_COLORS.onSurfaceVariant,
            }}
          >
            Chỉ bạn (host) nhìn thấy phần này
          </Text>
        </View>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            borderRadius: 999,
            paddingHorizontal: 12,
            paddingVertical: 7,
            backgroundColor: isConfirmed
              ? PROFILE_THEME_COLORS.secondaryContainer
              : PROFILE_THEME_COLORS.surfaceContainerHighest,
          }}
        >
          {isConfirmed
            ? <ShieldCheck size={13} color={PROFILE_THEME_COLORS.surfaceTint} strokeWidth={2.5} />
            : <ShieldAlert size={13} color={PROFILE_THEME_COLORS.outline} strokeWidth={2.5} />}
          <Text
            style={{
              marginLeft: 6,
              fontSize: 12,
              fontFamily: SCREEN_FONTS.bold,
              color: isConfirmed ? PROFILE_THEME_COLORS.surfaceTint : PROFILE_THEME_COLORS.outline,
            }}
          >
            {isConfirmed ? 'Đã đặt sân' : 'Chưa đặt sân'}
          </Text>
        </View>
      </View>

      {/* Info rows */}
      <View style={{ paddingHorizontal: 20, paddingTop: 18, paddingBottom: 20 }}>
        {rows.map((row, index) => (
          <InfoRow
            key={row.label}
            icon={row.icon}
            label={row.label}
            value={row.value}
            showDivider={index < rows.length - 1}
          />
        ))}
      </View>
    </View>
  )
}



