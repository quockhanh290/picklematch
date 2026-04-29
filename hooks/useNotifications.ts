import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export type Notification = {
  id: string
  player_id: string
  type: string
  title: string
  body: string
  deep_link: string | null
  is_read: boolean
  created_at: string
}

function translateNotification(n: any): Notification {
  if (!n) return n;
  const item = { ...n } as Notification;

  if (item.type === 'join_request') {
    if (item.title === 'Yeu cau tham gia moi') {
      item.title = 'Yêu cầu tham gia mới';
    }
    item.body = item.body
      .replace('Mot nguoi choi', 'Một người chơi')
      .replace(' vua gui yeu cau tham gia keo cua ban.', ' vừa gửi yêu cầu tham gia kèo của bạn.');
  } else if (item.type === 'host_unprofessional_reported') {
    if (item.title === 'Host bi bao van hanh kem') {
      item.title = 'Chủ kèo bị báo cáo vận hành kém';
    }
    item.body = item.body
      .replace('Mot nguoi choi da bao cao rang ban khong xac nhan ket qua dung han.', 'Một người chơi đã báo cáo rằng bạn không xác nhận kết quả đúng hạn.');
  } else if (item.type === 'join_approved') {
    if (item.title === 'Yeu cau duoc chap thuan') {
      item.title = 'Yêu cầu đã được chấp thuận';
    }
    item.body = item.body
      .replace('Ban da duoc chap thuan tham gia keo', 'Bạn đã được chấp thuận tham gia kèo')
      .replace('vao keo luc', 'vào kèo lúc');
  } else if (item.type === 'join_rejected') {
    if (item.title === 'Yeu cau bi tu choi') {
      item.title = 'Yêu cầu đã bị từ chối';
    }
    item.body = item.body
      .replace('Yeu cau tham gia keo', 'Yêu cầu tham gia kèo')
      .replace('cua ban da bi tu choi', 'của bạn đã bị từ chối');
  } else if (item.type === 'player_left') {
    if (item.title === 'Nguoi choi da roi keo') {
      item.title = 'Người chơi đã rời kèo';
    }
    item.body = item.body
      .replace('da roi khoi keo', 'đã rời khỏi kèo');
  } else if (item.type === 'session_cancelled') {
    if (item.title === 'Host da huy keo') {
      item.title = 'Chủ kèo đã hủy kèo';
    }
    item.body = item.body
      .replace('Keo luc', 'Kèo lúc')
      .replace('da bi host huy', 'đã bị chủ kèo hủy');
  } else if (item.type === 'session_updated') {
    if (item.title === 'Thong tin keo thay doi') {
      item.title = 'Thông tin kèo thay đổi';
    }
    item.body = item.body
      .replace('Thong tin keo', 'Thông tin kèo')
      .replace('da duoc cap nhat', 'đã được cập nhật');
  }

  return item;
}

export function useNotifications(userId: string | null | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    if (!userId) {
      setNotifications([])
      return
    }

    // Initial fetch
    fetchNotifications()

    // Realtime subscription
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `player_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((prev) => [translateNotification(payload.new), ...prev])
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `player_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((prev) =>
            prev.map((n) => (n.id === payload.new.id ? translateNotification(payload.new) : n)),
          )
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  async function fetchNotifications() {
    if (!userId) return
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('player_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
    console.log('[useNotifications] fetch result:', { count: data?.length, error: error?.message })
    if (data) setNotifications((data as Notification[]).map(translateNotification))
  }

  async function markAsRead(notificationId: string) {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n)),
    )
  }

  async function markAllAsRead() {
    if (!userId) return
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('player_id', userId)
      .eq('is_read', false)
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return { notifications, unreadCount, markAsRead, markAllAsRead }
}
