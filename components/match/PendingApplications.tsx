'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LevelBadge } from '@/components/ui/Badge'
import { User, Check, X, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

interface Application {
  id: string
  applicant_id: string
  applicant?: {
    nickname: string
    skill_level: string
  }
}

interface Props {
  matchId: string
  onAccepted: () => void   // 수락 시 부모 카드의 상태(마감) 업데이트
}

export function PendingApplications({ matchId, onAccepted }: Props) {
  const [applications, setApplications] = useState<Application[]>([])
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const supabase = createClient()

  // 대기 중인 신청 목록 가져오기
  const fetchApplications = useCallback(async () => {
    const { data } = await supabase
      .from('match_applications')
      .select(
        'id, applicant_id, applicant:profiles!match_applications_applicant_id_fkey(nickname, skill_level)'
      )
      .eq('match_id', matchId)
      .eq('status', 'pending')

    if (data) {
      setApplications(
        data.map((d) => ({
          id: d.id,
          applicant_id: d.applicant_id,
          applicant: Array.isArray(d.applicant) ? d.applicant[0] : (d.applicant ?? undefined),
        }))
      )
    }
  }, [matchId, supabase])

  useEffect(() => {
    fetchApplications()

    // Realtime 구독 — match_applications INSERT
    const channel = supabase
      .channel(`pending-apps:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'match_applications',
          filter: `match_id=eq.${matchId}`,
        },
        async (payload) => {
          const newApp = payload.new as { id: string; applicant_id: string; status: string }
          if (newApp.status !== 'pending') return

          // 신청자 프로필 조회
          const { data: applicant } = await supabase
            .from('profiles')
            .select('nickname, skill_level')
            .eq('id', newApp.applicant_id)
            .single()

          setApplications((prev) => {
            // 중복 방지
            if (prev.some((a) => a.id === newApp.id)) return prev
            return [
              ...prev,
              { id: newApp.id, applicant_id: newApp.applicant_id, applicant: applicant || undefined },
            ]
          })
        }
      )
      .subscribe()

    // 30초 폴링 폴백 (Realtime 미활성화 환경 대비)
    const polling = setInterval(fetchApplications, 30000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(polling)
    }
  }, [matchId, supabase, fetchApplications])

  const handleAccept = async (app: Application) => {
    setLoadingId(app.id)
    try {
      const res = await fetch(`/api/applications/${app.id}/accept`, { method: 'PATCH' })
      const data = await res.json()
      if (res.ok) {
        toast.success('✅ 매치를 수락했습니다! 채팅방이 생성되었어요.')
        setApplications([])   // 매치 마감 → 신청 목록 초기화
        onAccepted()           // 부모 카드에 마감 상태 반영
      } else {
        toast.error(data.error || '수락에 실패했습니다.')
      }
    } finally {
      setLoadingId(null)
    }
  }

  const handleReject = async (app: Application) => {
    setLoadingId(app.id)
    try {
      const res = await fetch(`/api/applications/${app.id}/reject`, { method: 'PATCH' })
      const data = await res.json()
      if (res.ok) {
        toast.success('신청을 거절했습니다.')
        setApplications((prev) => prev.filter((a) => a.id !== app.id))
      } else {
        toast.error(data.error || '거절에 실패했습니다.')
      }
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="mt-3 border-t border-slate-100 pt-3 space-y-2">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">
          신청 현황
          {applications.length > 0 && (
            <span className="ml-1.5 px-1.5 py-0.5 bg-accent text-white rounded-full text-[10px]">
              {applications.length}
            </span>
          )}
        </p>
        <button
          onClick={fetchApplications}
          className="p-1 text-slate-300 hover:text-slate-500 transition-colors"
          title="새로고침"
        >
          <RefreshCw size={12} />
        </button>
      </div>

      {/* 신청 목록 */}
      {applications.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-2">아직 신청이 없습니다</p>
      ) : (
        <div className="space-y-2">
          {applications.map((app) => (
            <div
              key={app.id}
              className="flex items-center justify-between bg-slate-50 rounded-xl p-2.5 gap-2"
            >
              {/* 신청자 정보 */}
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <User size={13} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-700 truncate">
                    {app.applicant?.nickname ?? '알 수 없음'}
                  </p>
                  <p className="text-xs text-slate-400">
                    실력: <span className="font-medium text-slate-600">{app.applicant?.skill_level ?? '-'}</span>
                  </p>
                </div>
              </div>

              {/* 수락 / 거절 버튼 */}
              <div className="flex gap-1.5 flex-shrink-0">
                <button
                  onClick={() => handleAccept(app)}
                  disabled={!!loadingId}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-green-500 text-white text-xs font-semibold rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  {loadingId === app.id ? (
                    <div className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><Check size={11} /> 신청 수락</>
                  )}
                </button>
                <button
                  onClick={() => handleReject(app)}
                  disabled={!!loadingId}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500 text-white text-xs font-semibold rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  <X size={11} /> 신청 거절
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
