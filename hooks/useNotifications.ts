'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Notification } from '@/types/database'
import toast from 'react-hot-toast'

export function useNotifications(
  userId: string | null,
  onMatchApply?: (notif: Notification) => void
) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set())
  // 싱글턴 클라이언트 — 안정된 참조
  const supabase = createClient()
  // onMatchApply를 ref로 유지해 useEffect deps에서 제거
  const onMatchApplyRef = useRef(onMatchApply)
  onMatchApplyRef.current = onMatchApply

  const fetchNotifications = useCallback(async () => {
    if (!userId) return
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
    if (data) {
      setNotifications(data)
      setUnreadCount(data.filter((n) => !n.is_read).length)
    }
  }, [userId]) // supabase 싱글턴이므로 제거 가능

  useEffect(() => {
    if (!userId) return
    fetchNotifications()

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload) => {
          const newNotif = payload.new as Notification
          setNotifications((prev) => {
            if (prev.some((n) => n.id === newNotif.id)) return prev
            return [newNotif, ...prev]
          })
          setUnreadCount((prev) => prev + 1)

          if (newNotif.type === 'match_apply' && onMatchApplyRef.current) {
            onMatchApplyRef.current(newNotif)
          } else {
            const icons: Record<string, string> = {
              match_accept: '✅',
              match_reject: '❌',
              new_message: '💬',
              contest_apply: '🏆',
              contest_accept: '✅',
              contest_reject: '❌',
              contest_message: '💬',
            }
            toast(newNotif.message, {
              icon: icons[newNotif.type] || '🔔',
              duration: 5000,
            })
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn(`[useNotifications] Realtime ${status} — polling every 10s`)
        }
      })

    // 폴링 폴백: 10초마다 읽지 않은 알림 개수 갱신
    const poll = setInterval(fetchNotifications, 10000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(poll)
    }
  }, [userId, fetchNotifications]) // onMatchApply는 ref로 처리

  const markAsRead = useCallback(async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }, []) // supabase 싱글턴

  const markAllAsRead = useCallback(async () => {
    if (!userId) return
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false)
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }, [userId])

  const markProcessed = useCallback((notifId: string) => {
    setProcessedIds((prev) => new Set([...prev, notifId]))
  }, [])

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
    processedIds,
    markProcessed,
  }
}
