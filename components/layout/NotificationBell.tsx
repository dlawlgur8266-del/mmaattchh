'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Bell } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import { NotificationDropdown } from './NotificationDropdown'
import type { Notification } from '@/types/database'
import toast from 'react-hot-toast'

interface Props {
  userId: string
}

export function NotificationBell({ userId }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // refs: useNotifications 반환값을 커스텀 토스트에서 참조하기 위해 사용
  const markAsReadRef = useRef<((id: string) => Promise<void>) | null>(null)
  const markProcessedRef = useRef<((id: string) => void) | null>(null)

  // 매치 신청 수락 처리
  const acceptApplication = useCallback(async (notif: Notification) => {
    if (!notif.related_id) return
    const res = await fetch(`/api/applications/${notif.related_id}/accept`, { method: 'PATCH' })
    const data = await res.json()
    if (res.ok) {
      markAsReadRef.current?.(notif.id)
      markProcessedRef.current?.(notif.id)
      toast.success('매치를 수락했습니다! 채팅방이 열렸어요.')
    } else {
      toast.error(data.error || '처리에 실패했습니다.')
    }
  }, [])

  // 매치 신청 거절 처리
  const rejectApplication = useCallback(async (notif: Notification) => {
    if (!notif.related_id) return
    const res = await fetch(`/api/applications/${notif.related_id}/reject`, { method: 'PATCH' })
    const data = await res.json()
    if (res.ok) {
      markAsReadRef.current?.(notif.id)
      markProcessedRef.current?.(notif.id)
      toast.success('신청을 거절했습니다.')
    } else {
      toast.error(data.error || '처리에 실패했습니다.')
    }
  }, [])

  // match_apply 알림 수신 시 — 수락/거절 버튼이 있는 커스텀 토스트
  const handleMatchApply = useCallback((notif: Notification) => {
    toast.custom(
      (t) => (
        <div
          className={`max-w-sm w-full bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 transition-all duration-300 ${
            t.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0 mt-0.5">🏃</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-800">매치 신청이 왔어요!</p>
              <p className="text-sm text-slate-600 mt-1 leading-snug">{notif.message}</p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={async () => {
                    toast.dismiss(t.id)
                    await acceptApplication(notif)
                  }}
                  className="flex-1 py-1.5 bg-green-500 text-white text-xs font-semibold rounded-lg hover:bg-green-600 transition-colors"
                >
                  신청 수락
                </button>
                <button
                  onClick={async () => {
                    toast.dismiss(t.id)
                    await rejectApplication(notif)
                  }}
                  className="flex-1 py-1.5 bg-red-500 text-white text-xs font-semibold rounded-lg hover:bg-red-600 transition-colors"
                >
                  신청 거절
                </button>
              </div>
              <button
                onClick={() => toast.dismiss(t.id)}
                className="w-full mt-2 py-1 text-xs text-slate-400 hover:text-slate-600 transition-colors text-center"
              >
                나중에 알림에서 처리
              </button>
            </div>
          </div>
        </div>
      ),
      { duration: 15000, position: 'top-right' }
    )
  }, [acceptApplication, rejectApplication])

  const { notifications, unreadCount, markAsRead, markAllAsRead, processedIds, markProcessed } =
    useNotifications(userId, handleMatchApply)

  // refs에 최신 함수 동기화
  markAsReadRef.current = markAsRead
  markProcessedRef.current = markProcessed

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-slate-600 hover:text-primary hover:bg-slate-100 rounded-xl transition-colors"
        aria-label="알림"
      >
        <Bell size={22} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <NotificationDropdown
          notifications={notifications}
          processedIds={processedIds}
          onMarkRead={markAsRead}
          onMarkAllRead={markAllAsRead}
          onAccept={(notif) => { acceptApplication(notif); markProcessed(notif.id) }}
          onReject={(notif) => { rejectApplication(notif); markProcessed(notif.id) }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  )
}
