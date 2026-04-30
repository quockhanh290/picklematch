import { timeAgo } from '@/lib/format'
import { useState, useMemo } from 'react'
import { colors } from '@/constants/colors'
import { EmptyState, ScreenHeader } from '@/components/design'
import { PROFILE_THEME_COLORS } from '@/constants/theme/profileTheme'
import type { Notification } from '@/hooks/useNotifications'
import { useNotificationsContext } from '@/lib/NotificationsContext'
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs'
import { router } from 'expo-router'
import type { LucideIcon } from 'lucide-react-native'
import {
    AlertTriangle,
    Bell,
    CheckCircle2,
    DoorOpen,
    Info,
    Megaphone,
    Menu,
    MessageCircleMore,
    Sparkles,
    Trophy,
    UserPlus,
    XCircle,
} from 'lucide-react-native'
import { ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { SCREEN_FONTS } from '@/constants/typography'
 
function withAlpha(hex: string, alpha: number) {
  const clean = hex.replace('#', '')
  const n = Number.parseInt(clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean, 16)
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`
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
      iconColor: PROFILE_THEME_COLORS.onPrimary,
      iconBackground: PROFILE_THEME_COLORS.primary,
      indicator: PROFILE_THEME_COLORS.primary,
    }
  }
  if (type === 'join_approved') {
    return {
      icon: CheckCircle2,
      iconColor: PROFILE_THEME_COLORS.onPrimary,
      iconBackground: PROFILE_THEME_COLORS.primary,
      indicator: PROFILE_THEME_COLORS.primary,
    }
  }
  if (type === 'join_rejected') {
    return {
      icon: XCircle,
      iconColor: PROFILE_THEME_COLORS.onPrimary,
      iconBackground: PROFILE_THEME_COLORS.primary,
      indicator: PROFILE_THEME_COLORS.error,
    }
  }
  if (type === 'player_left') {
    return {
      icon: DoorOpen,
      iconColor: PROFILE_THEME_COLORS.onPrimary,
      iconBackground: PROFILE_THEME_COLORS.primary,
      indicator: PROFILE_THEME_COLORS.surfaceTint,
    }
  }
  if (type === 'session_cancelled') {
    return {
      icon: Megaphone,
      iconColor: PROFILE_THEME_COLORS.onPrimary,
      iconBackground: PROFILE_THEME_COLORS.primary,
      indicator: PROFILE_THEME_COLORS.error,
    }
  }
  if (type === 'session_updated') {
    return {
      icon: Sparkles,
      iconColor: PROFILE_THEME_COLORS.onPrimary,
      iconBackground: PROFILE_THEME_COLORS.primary,
      indicator: PROFILE_THEME_COLORS.surfaceTint,
    }
  }
  if (type === 'join_request_reply') {
    return {
      icon: MessageCircleMore,
      iconColor: PROFILE_THEME_COLORS.onPrimary,
      iconBackground: PROFILE_THEME_COLORS.primary,
      indicator: PROFILE_THEME_COLORS.primary,
    }
  }
  if (type === 'achievement_unlocked') {
    return {
      icon: Trophy,
      iconColor: PROFILE_THEME_COLORS.onPrimary,
      iconBackground: PROFILE_THEME_COLORS.primary,
      indicator: PROFILE_THEME_COLORS.tertiary,
    }
  }
  if (type === 'host_unprofessional_reported') {
    return {
      icon: AlertTriangle,
      iconColor: PROFILE_THEME_COLORS.onPrimary,
      iconBackground: PROFILE_THEME_COLORS.primary,
      indicator: PROFILE_THEME_COLORS.error,
    }
  }
  if (type === 'result_confirmation_request') {
    return {
      icon: CheckCircle2,
      iconColor: PROFILE_THEME_COLORS.onPrimary,
      iconBackground: PROFILE_THEME_COLORS.primary,
      indicator: PROFILE_THEME_COLORS.primary,
    }
  }

  if (type === 'session_pending_completion' || type === 'session_results_submitted' || type === 'session_results_disputed' || type === 'session_auto_closed' || type === 'ghost_session_voided') {
    return {
      icon: Bell,
      iconColor: PROFILE_THEME_COLORS.onPrimary,
      iconBackground: PROFILE_THEME_COLORS.primary,
      indicator: PROFILE_THEME_COLORS.primary,
    }
  }
  
  return {
    icon: Info,
    iconColor: PROFILE_THEME_COLORS.onPrimary,
    iconBackground: PROFILE_THEME_COLORS.primary,
    indicator: PROFILE_THEME_COLORS.outline,
  }
}

function isActionable(notification: Notification) {
  return notification.type === 'join_request'
}

type NotificationCategory = 'all' | 'my_sessions' | 'achievements'

export default function NotificationsScreen() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotificationsContext()
  const tabBarHeight = useBottomTabBarHeight()
  const insets = useSafeAreaInsets()
  const [activeCategory, setActiveCategory] = useState<NotificationCategory>('all')

  const categories: { key: NotificationCategory; label: string }[] = [
    { key: 'all', label: 'Tất cả' },
    { key: 'my_sessions', label: 'Kèo của tôi' },
    { key: 'achievements', label: 'Danh hiệu' },
  ]

  const filteredNotifications = useMemo(() => {
    if (activeCategory === 'all') return notifications
    return notifications.filter((n) => {
      if (activeCategory === 'my_sessions') {
        return [
          'join_request',
          'join_approved',
          'join_rejected',
          'player_left',
          'session_cancelled',
          'session_updated',
          'result_confirmation_request',
          'session_ready_for_rating',
          'join_request_reply',
          'host_unprofessional_reported',
          'session_pending_completion',
          'session_results_submitted',
          'session_results_disputed',
          'session_auto_closed',
          'ghost_session_voided'
        ].includes(n.type)
      }
      if (activeCategory === 'achievements') {
        return n.type === 'achievement_unlocked'
      }
      return true
    })
  }, [notifications, activeCategory])

  async function handleTap(notification: Notification) {
    if (!notification.is_read) await markAsRead(notification.id)
    if (notification.deep_link) router.push(notification.deep_link as any)
  }

  return (
    <View className="flex-1" style={{ backgroundColor: PROFILE_THEME_COLORS.background }}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 56 }}
      >
        <View style={{ backgroundColor: PROFILE_THEME_COLORS.background }}>
          {/* Main Title Row */}
          <View 
            className="flex-row items-center justify-between px-6 pb-4"
            style={{ paddingTop: insets.top + 20 }}
          >
            <Text
              style={{
                color: PROFILE_THEME_COLORS.onBackground,
                fontFamily: SCREEN_FONTS.headlineBlack,
                fontSize: 36,
                lineHeight: 50,
                letterSpacing: -1,
              }}
            >
              THÔNG BÁO
            </Text>

            <TouchableOpacity
              onPress={markAllAsRead}
              activeOpacity={0.84}
              className="rounded-full px-4 py-2.5"
              style={{
                backgroundColor: unreadCount > 0 ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.outline,
                shadowColor: unreadCount > 0 ? PROFILE_THEME_COLORS.primary : '#000',
                shadowOpacity: unreadCount > 0 ? 0.2 : 0,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 4 },
              }}
            >
              <Text
                style={{
                  color: PROFILE_THEME_COLORS.onPrimary,
                  fontFamily: SCREEN_FONTS.cta,
                  fontSize: 12,
                  letterSpacing: 0.8,
                  textTransform: 'uppercase',
                }}
              >
                {unreadCount} MỚI
              </Text>
            </TouchableOpacity>
          </View>

          {/* Filter Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 16 }}
          >
            {categories.map((cat) => {
              const active = activeCategory === cat.key
              return (
                <TouchableOpacity
                  key={cat.key}
                  onPress={() => setActiveCategory(cat.key)}
                  className="mr-3 rounded-full px-5 py-2.5 border"
                  style={{
                    backgroundColor: active ? PROFILE_THEME_COLORS.primary : 'transparent',
                    borderColor: active ? PROFILE_THEME_COLORS.primary : PROFILE_THEME_COLORS.outlineVariant,
                  }}
                >
                  <Text
                    style={{
                      color: active ? PROFILE_THEME_COLORS.onPrimary : PROFILE_THEME_COLORS.onSurfaceVariant,
                      fontFamily: SCREEN_FONTS.cta,
                      fontSize: 13,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        </View>

        {filteredNotifications.length === 0 ? (
          <View className="px-6 pt-10 pb-8">
            <EmptyState
              icon={<Bell size={28} color={PROFILE_THEME_COLORS.outline} />}
              title="Chưa có thông báo nào"
              description="Khi có yêu cầu tham gia, thay đổi kèo hoặc phản hồi mới, bạn sẽ thấy chúng ở đây."
            />
          </View>
        ) : (
          <View className="px-6 pt-4">
            <View className="gap-4">
              {filteredNotifications.map((item) => {
                const meta = typeMeta(item.type)
                const Icon = meta.icon

                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => handleTap(item)}
                    activeOpacity={0.9}
                    className="relative overflow-hidden rounded-[16px] p-4"
                    style={{
                      backgroundColor: item.is_read ? PROFILE_THEME_COLORS.surfaceContainerLow : PROFILE_THEME_COLORS.surfaceContainerLowest,
                      borderWidth: 1,
                      borderColor: item.is_read ? 'transparent' : PROFILE_THEME_COLORS.primary + '15',
                      shadowColor: PROFILE_THEME_COLORS.onBackground,
                      shadowOpacity: item.is_read ? 0 : 0.03,
                      shadowRadius: 10,
                      shadowOffset: { width: 0, height: 4 },
                      elevation: item.is_read ? 0 : 1.5,
                    }}
                  >
                    {!item.is_read ? (
                      <View
                        className="absolute left-0 top-0 bottom-0 w-1"
                        style={{ backgroundColor: PROFILE_THEME_COLORS.primary }}
                      />
                    ) : null}

                    <View className="flex-row gap-3">
                      <View
                        className="h-10 w-10 items-center justify-center rounded-full"
                        style={{ backgroundColor: meta.iconBackground }}
                      >
                        <Icon size={18} color={meta.iconColor} />
                      </View>

                      <View className="flex-1" style={{ opacity: item.is_read ? 0.72 : 1 }}>
                        <View className="mb-0.5 flex-row items-start justify-between gap-3">
                          <Text
                            className="flex-1 text-[15px] leading-5"
                            style={{
                              color: PROFILE_THEME_COLORS.onSurface,
                              fontFamily: SCREEN_FONTS.headline,
                              textTransform: 'uppercase',
                              letterSpacing: 0.2,
                              opacity: item.is_read ? 0.7 : 1,
                            }}
                          >
                            {item.title}
                          </Text>
                          <Text
                            className="text-[9px] uppercase tracking-[0.5px]"
                            style={{ color: PROFILE_THEME_COLORS.outline, fontFamily: SCREEN_FONTS.cta, marginTop: 3 }}
                          >
                            {timeAgo(item.created_at)}
                          </Text>
                        </View>

                        <Text
                          className="text-[13px] leading-5"
                          style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: SCREEN_FONTS.body }}
                          numberOfLines={2}
                        >
                          {item.body}
                        </Text>

                        {isActionable(item) && !item.is_read ? (
                          <View className="mt-3 flex-row gap-2.5">
                            <TouchableOpacity
                              activeOpacity={0.84}
                              onPress={() => handleTap(item)}
                              className="flex-1 rounded-[10px] px-3 py-2 items-center justify-center"
                              style={{ backgroundColor: PROFILE_THEME_COLORS.primary }}
                            >
                              <Text
                                className="text-[12px] uppercase tracking-[0.5px]"
                                style={{ color: PROFILE_THEME_COLORS.onPrimary, fontFamily: SCREEN_FONTS.cta }}
                              >
                                CHẤP NHẬN
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              activeOpacity={0.84}
                              onPress={() => handleTap(item)}
                              className="flex-1 rounded-[10px] px-3 py-2 items-center justify-center border"
                              style={{ 
                                backgroundColor: 'transparent',
                                borderColor: PROFILE_THEME_COLORS.outlineVariant 
                              }}
                            >
                              <Text
                                className="text-[12px] uppercase tracking-[0.5px]"
                                style={{ color: PROFILE_THEME_COLORS.onSurfaceVariant, fontFamily: SCREEN_FONTS.cta }}
                              >
                                TỪ CHỐI
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
    </View>
  )
}
