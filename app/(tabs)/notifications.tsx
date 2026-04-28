import { EmptyState, ScreenHeader } from '@/components/design'
import { PROFILE_THEME_COLORS } from '@/components/profile/profileTheme'
import type { Notification } from '@/hooks/useNotifications'
import { useNotificationsContext } from '@/lib/NotificationsContext'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import { router } from 'expo-router'
import type { LucideIcon } from 'lucide-react-native'
import {
    Bell,
    CheckCircle2,
    DoorOpen,
    Info,
    Megaphone,
    Menu,
    MessageCircleMore,
    Sparkles,
    UserPlus,
    XCircle,
} from 'lucide-react-native'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { SCREEN_FONTS } from '@/constants/typography'

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'vừa xong'
  if (mins < 60) return `${mins} phút trước`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} giờ trước`
  const days = Math.floor(hrs / 24)
  return `${days} ngày trước`
}

function typeMeta(type: string): {
  icon: LucideIcon
  iconColor: string
  iconBackground: string
  indicator: string
} {
  if (type === 'join_request') {
    return {
      icon: UserPlus,
      iconColor: PROFILE_THEME_COLORS.primary,
      iconBackground: PROFILE_THEME_COLORS.primaryFixed,
      indicator: PROFILE_THEME_COLORS.primary,
    }
  }
  if (type === 'join_approved') {
    return {
      icon: CheckCircle2,
      iconColor: PROFILE_THEME_COLORS.primary,
      iconBackground: PROFILE_THEME_COLORS.secondaryContainer,
      indicator: PROFILE_THEME_COLORS.primary,
    }
  }
  if (type === 'join_rejected') {
    return {
      icon: XCircle,
      iconColor: PROFILE_THEME_COLORS.error,
      iconBackground: PROFILE_THEME_COLORS.errorContainer,
      indicator: PROFILE_THEME_COLORS.error,
    }
  }
  if (type === 'player_left') {
    return {
      icon: DoorOpen,
      iconColor: PROFILE_THEME_COLORS.onPrimaryFixedVariant,
      iconBackground: PROFILE_THEME_COLORS.primaryFixed,
      indicator: PROFILE_THEME_COLORS.surfaceTint,
    }
  }
  if (type === 'session_cancelled') {
    return {
      icon: Megaphone,
      iconColor: PROFILE_THEME_COLORS.error,
      iconBackground: PROFILE_THEME_COLORS.errorContainer,
      indicator: PROFILE_THEME_COLORS.error,
    }
  }
  if (type === 'session_updated') {
    return {
      icon: Sparkles,
      iconColor: PROFILE_THEME_COLORS.onTertiaryFixedVariant,
      iconBackground: PROFILE_THEME_COLORS.tertiaryFixed,
      indicator: PROFILE_THEME_COLORS.surfaceTint,
    }
  }
  if (type === 'join_request_reply') {
    return {
      icon: MessageCircleMore,
      iconColor: PROFILE_THEME_COLORS.onSecondaryFixed,
      iconBackground: PROFILE_THEME_COLORS.secondaryFixed,
      indicator: PROFILE_THEME_COLORS.primary,
    }
  }
  if (type === 'result_confirmation_request') {
    return {
      icon: CheckCircle2,
      iconColor: PROFILE_THEME_COLORS.primary,
      iconBackground: PROFILE_THEME_COLORS.secondaryContainer,
      indicator: PROFILE_THEME_COLORS.primary,
    }
  }

  return {
    icon: Info,
    iconColor: PROFILE_THEME_COLORS.onSurfaceVariant,
    iconBackground: PROFILE_THEME_COLORS.surfaceVariant,
    indicator: PROFILE_THEME_COLORS.outline,
  }
}

function isActionable(notification: Notification) {
  return notification.type === 'join_request'
}

export default function NotificationsScreen() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationsContext()
  const tabBarHeight = useBottomTabBarHeight()

  async function handleTap(notification: Notification) {
    if (!notification.is_read) await markAsRead(notification.id)
    if (notification.deep_link) router.push(notification.deep_link as any)
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: PROFILE_THEME_COLORS.background }} edges={['top']}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 56 }}
      >
        <ScreenHeader
          variant="brand"
          title="KINETIC"
          leftSlot={<Menu size={18} color={PROFILE_THEME_COLORS.primary} />}
          rightSlot={
            <View
              className="h-10 w-10 items-center justify-center rounded-full border-2"
              style={{ borderColor: PROFILE_THEME_COLORS.primaryFixed, backgroundColor: PROFILE_THEME_COLORS.primary }}
            >
              <Text style={{ color: PROFILE_THEME_COLORS.onPrimary, fontFamily: SCREEN_FONTS.cta }}>U</Text>
            </View>
          }
          style={{ backgroundColor: PROFILE_THEME_COLORS.surfaceContainerLow }}
        />

        {notifications.length === 0 ? (
          <View className="px-6 pt-8 pb-8">
            <View className="mb-10">
              <Text
                className="mb-2 text-[12px] uppercase tracking-[4px]"
                style={{ color: PROFILE_THEME_COLORS.primary, fontFamily: SCREEN_FONTS.cta }}
              >
                Hộp Thư Đến
              </Text>
              <Text
                className="text-[44px] leading-[48px]"
                style={{ color: PROFILE_THEME_COLORS.onSurface, fontFamily: SCREEN_FONTS.bold }}
              >
                Thông báo.
              </Text>
            </View>

            <EmptyState
              icon={<Bell size={28} color={PROFILE_THEME_COLORS.outline} />}
              title="Chưa có thông báo nào"
              description="Khi có yêu cầu tham gia, thay đổi kèo hoặc phản hồi mới, bạn sẽ thấy chúng ở đây."
            />
          </View>
        ) : (
          <View className="px-6 pt-8">
            <View className="relative mb-10">
              <View
                className="absolute -right-6 -top-6 h-40 w-40 rounded-full"
                style={{ backgroundColor: 'rgba(176,240,214,0.22)' }}
              />
              <Text
                className="mb-2 text-[12px] uppercase tracking-[4px]"
                style={{ color: PROFILE_THEME_COLORS.primary, fontFamily: SCREEN_FONTS.cta }}
              >
                Hộp Thư Đến
              </Text>
              <View className="flex-row items-end justify-between gap-4">
                <Text
                  className="flex-1 text-[44px] leading-[48px]"
                  style={{ color: PROFILE_THEME_COLORS.onSurface, fontFamily: SCREEN_FONTS.bold }}
                >
                  Thông báo
                  <Text style={{ color: PROFILE_THEME_COLORS.primaryFixedDim }}>.</Text>
                </Text>
                <TouchableOpacity
                  onPress={markAllAsRead}
                  activeOpacity={0.9}
                  disabled={unreadCount === 0}
                  className="rounded-full px-4 py-2"
                  style={{
                    backgroundColor: PROFILE_THEME_COLORS.surfaceContainerHigh,
                    opacity: unreadCount > 0 ? 1 : 0.5,
                  }}
                >
                  <Text style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: SCREEN_FONTS.headline, fontSize: 15 }}>
                    {unreadCount} Mới
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View className="gap-4">
              {notifications.map((item) => {
                const meta = typeMeta(item.type)
                const Icon = meta.icon

                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => handleTap(item)}
                    activeOpacity={0.9}
                    className="relative overflow-hidden rounded-[24px] p-6"
                    style={{
                      backgroundColor: item.is_read ? PROFILE_THEME_COLORS.surfaceContainerLow : PROFILE_THEME_COLORS.surfaceContainerLowest,
                      shadowColor: PROFILE_THEME_COLORS.onBackground,
                      shadowOpacity: item.is_read ? 0 : 0.05,
                      shadowRadius: 18,
                      shadowOffset: { width: 0, height: 10 },
                      elevation: item.is_read ? 0 : 3,
                    }}
                  >
                    {!item.is_read ? (
                      <View
                        className="absolute left-0 top-1/2 h-12 w-1.5 -translate-y-1/2 rounded-r-full"
                        style={{ backgroundColor: meta.indicator }}
                      />
                    ) : null}

                    <View className="flex-row gap-4">
                      <View
                        className="h-12 w-12 items-center justify-center rounded-full"
                        style={{ backgroundColor: meta.iconBackground }}
                      >
                        <Icon size={22} color={meta.iconColor} />
                      </View>

                      <View className="flex-1" style={{ opacity: item.is_read ? 0.72 : 1 }}>
                        <View className="mb-1 flex-row items-start justify-between gap-3">
                          <Text
                            className="flex-1 text-lg leading-6"
                            style={{
                              color: PROFILE_THEME_COLORS.onSurface,
                              fontFamily: item.is_read ? SCREEN_FONTS.cta : SCREEN_FONTS.bold,
                            }}
                          >
                            {item.title}
                          </Text>
                          <Text
                            className="text-[10px] uppercase tracking-[1.6px]"
                            style={{ color: PROFILE_THEME_COLORS.outline, fontFamily: SCREEN_FONTS.cta }}
                          >
                            {timeAgo(item.created_at)}
                          </Text>
                        </View>

                        <Text
                          className="text-sm leading-6"
                          style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: SCREEN_FONTS.body }}
                          numberOfLines={3}
                        >
                          {item.body}
                        </Text>

                        {isActionable(item) ? (
                          <View className="mt-4 flex-row gap-3">
                            <TouchableOpacity
                              activeOpacity={0.9}
                              onPress={() => handleTap(item)}
                              className="rounded-full px-6 py-2"
                              style={{ backgroundColor: PROFILE_THEME_COLORS.primary }}
                            >
                              <Text
                                className="text-[15px] uppercase tracking-[1.3px]"
                                style={{ color: PROFILE_THEME_COLORS.onPrimary, fontFamily: SCREEN_FONTS.headline }}
                              >
                                Chấp nhận
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              activeOpacity={0.9}
                              onPress={() => handleTap(item)}
                              className="rounded-full px-6 py-2"
                              style={{ backgroundColor: PROFILE_THEME_COLORS.surfaceContainerHigh }}
                            >
                              <Text
                                className="text-[15px] uppercase tracking-[1.3px]"
                                style={{ color: PROFILE_THEME_COLORS.primary, fontFamily: SCREEN_FONTS.headline }}
                              >
                                Từ chối
                              </Text>
                            </TouchableOpacity>
                          </View>
                        ) : null}
                      </View>
                    </View>
                  </TouchableOpacity>
                )
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}
