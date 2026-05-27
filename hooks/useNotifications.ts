'use client'

import { useEffect, useState, useCallback } from 'react'
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
  const supabase = createClient()

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
  }, [userId, supabase])

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
          setNotifications((prev) => [newNotif, ...prev])
          setUnreadCount((prev) => prev + 1)

          if (newNotif.type === 'match_apply' && onMatchApply) {
            // match_apply는 커스텀 토스트(수락/거절 버튼 포함)로 처리
            onMatchApply(newNotif)
          } else {
            // 그 외 알림은 일반 토스트
            const icons: Record<string, string> = {
              match_accept: '✅',
              match_reject: '❌',
              new_message: '💬',
            }
            toast(newNotif.message, {
              icon: icons[newNotif.type] || '🔔',
              duration: 5000,
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, fetchNotifications, supabase, onMatchApply])

  const markAsRead = useCallback(async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }, [supabase])

  const markAllAsRead = useCallback(async () => {
    if (!userId) return
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false)
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }, [userId, supabase])

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
