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
  onAccepted: () => void
}

export function PendingApplications({ matchId, onAccepted }: Props) {
  const [applications, setApplications] = useState<Application[]>([])
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const supabase = createClient()

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

    const channel = supabase
      .channel(`pending-apps:${matchId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'match_applications', filter: `match_id=eq.${matchId}` },
        async (payload) => {
          const newApp = payload.new as { id: string; applicant_id: string; status: string }
          if (newApp.status !== 'pending') return
          const { data: applicant } = await supabase
            .from('profiles')
            .select('nickname, skill_level')
            .eq('id', newApp.applicant_id)
            .single()
          setApplications((prev) => {
            if (prev.some((a) => a.id === newApp.id)) return prev
            return [...prev, { id: newApp.id, applicant_id: newApp.applicant_id, applicant: applicant || undefined }]
          })
        }
      )
      .subscribe()

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
        setApplications([])
        onAccepted()
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
    <div className="mt-3 border-t border-slate-100 pt-3 space-y-2.5">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
          신청 현황
          {applications.length > 0 && (
            <span className="px-1.5 py-0.5 bg-accent text-white rounded-full text-[10px]">
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
        <p className="text-xs text-slate-400 text-center py-3">아직 신청이 없습니다</p>
      ) : (
        <div className="space-y-3">
          {applications.map((app) => (
            <div
              key={app.id}
              className="bg-slate-50 rounded-2xl p-4 border border-slate-100"
            >
              {/* 신청자 정보 */}
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <User size={18} className="text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-slate-800 text-sm">
                    {app.applicant?.nickname ?? '알 수 없음'}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-xs text-slate-400">실력</span>
                    <LevelBadge level={(app.applicant?.skill_level ?? '중급') as any} />
                  </div>
                </div>
              </div>

              {/* 수락 / 거절 버튼 */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleAccept(app)}
                  disabled={!!loadingId}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-500 text-white text-sm font-semibold rounded-xl hover:bg-green-600 transition-colors disabled:opacity-50"
                >
                  {loadingId === app.id ? (
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><Check size={15} /> 신청 수락</>
                  )}
                </button>
                <button
                  onClick={() => handleReject(app)}
                  disabled={!!loadingId}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-red-500 text-white text-sm font-semibold rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  <X size={15} /> 신청 거절
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
