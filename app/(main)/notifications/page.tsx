'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, CheckCheck } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import { createClient } from '@/lib/supabase/client'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDateTime } from '@/lib/utils'
import toast from 'react-hot-toast'

const TYPE_ICON: Record<string, string> = {
  match_apply: '🏃',
  match_accept: '✅',
  match_reject: '❌',
  new_message: '💬',
}

export default function NotificationsPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => setUserId(user?.id || null))
  }, [])

  const { notifications, markAsRead, markAllAsRead, processedIds, markProcessed } =
    useNotifications(userId)

  const handleAccept = async (relatedId: string | null, notifId: string) => {
    if (!relatedId) return
    const res = await fetch(`/api/applications/${relatedId}/accept`, { method: 'PATCH' })
    if (res.ok) {
      toast.success('매치를 수락했습니다! 채팅방이 열렸어요.')
      markAsRead(notifId)
      markProcessed(notifId)
    } else {
      const d = await res.json()
      toast.error(d.error || '처리 실패')
    }
  }

  const handleReject = async (relatedId: string | null, notifId: string) => {
    if (!relatedId) return
    const res = await fetch(`/api/applications/${relatedId}/reject`, { method: 'PATCH' })
    if (res.ok) {
      toast.success('신청을 거절했습니다.')
      markAsRead(notifId)
      markProcessed(notifId)
    } else {
      const d = await res.json()
      toast.error(d.error || '처리 실패')
    }
  }

  const handleClick = (notif: { id: string; type: string; related_id: string | null; is_read: boolean }) => {
    if (!notif.is_read) markAsRead(notif.id)
    if (notif.type === 'new_message' && notif.related_id) {
      router.push(`/messages/${notif.related_id}`)
    }
  }

  // 날짜별 그룹
  const grouped: Record<string, typeof notifications> = {}
  notifications.forEach((n) => {
    const date = new Date(n.created_at).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    if (!grouped[date]) grouped[date] = []
    grouped[date].push(n)
  })

  return (
    <div className="space-y-5 max-w-xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">알림</h1>
          <p className="text-slate-500 text-sm mt-0.5">모든 알림 내역을 확인하세요</p>
        </div>
        <button
          onClick={markAllAsRead}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary transition-colors px-3 py-2 rounded-xl hover:bg-slate-100"
        >
          <CheckCheck size={16} />
          전체 읽음
        </button>
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          emoji="🔔"
          title="알림이 없습니다"
          description="매치 신청, 수락, 메시지 알림이 여기에 표시됩니다."
        />
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date}>
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">{date}</h3>
              <div className="card divide-y divide-slate-50">
                {items.map((notif) => {
                  const isProcessed = processedIds.has(notif.id)

                  return (
                    <div
                      key={notif.id}
                      className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors ${
                        !notif.is_read ? 'bg-primary/5' : ''
                      }`}
                      onClick={() => handleClick(notif)}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xl flex-shrink-0 mt-0.5">
                          {TYPE_ICON[notif.type] || '🔔'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm leading-snug ${
                              notif.is_read ? 'text-slate-600' : 'text-slate-800 font-medium'
                            }`}
                          >
                            {notif.message}
                          </p>
                          <p className="text-xs text-slate-400 mt-1">{formatDateTime(notif.created_at)}</p>

                          {/* match_apply: 수락/거절 버튼 (처리 전에만) */}
                          {notif.type === 'match_apply' && notif.related_id && !isProcessed && (
                            <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => handleAccept(notif.related_id, notif.id)}
                                className="px-4 py-1.5 bg-green-500 text-white text-xs rounded-lg font-semibold hover:bg-green-600 transition-colors"
                              >
                                신청 수락
                              </button>
                              <button
                                onClick={() => handleReject(notif.related_id, notif.id)}
                                className="px-4 py-1.5 bg-red-500 text-white text-xs rounded-lg font-semibold hover:bg-red-600 transition-colors"
                              >
                                신청 거절
                              </button>
                            </div>
                          )}

                          {/* match_apply: 처리 완료 */}
                          {notif.type === 'match_apply' && isProcessed && (
                            <p className="text-xs text-green-600 mt-2 font-medium">✓ 처리 완료</p>
                          )}

                          {/* match_accept: 채팅 시작 */}
                          {notif.type === 'match_accept' && notif.related_id && (
                            <div className="mt-2" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => router.push('/messages')}
                                className="px-3 py-1.5 bg-primary text-white text-xs rounded-lg font-semibold hover:bg-primary/90 transition-colors"
                              >
                                채팅 시작
                              </button>
                            </div>
                          )}
                        </div>
                        {!notif.is_read && (
                          <div className="w-2 h-2 bg-accent rounded-full flex-shrink-0 mt-2" />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
