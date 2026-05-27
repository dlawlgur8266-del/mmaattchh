'use client'

import { useState, useEffect, useCallback } from 'react'
import { Trophy, Users, Calendar, MapPin, Check, X, RefreshCw, User, MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { CATEGORY_COLORS, getDaysUntilDeadline } from '@/data/contests'
import type { ContestMatch } from '@/types/database'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

interface Props {
  match: ContestMatch
  currentUserId: string | null
  onDeleted?: (id: string) => void
}

interface Applicant {
  id: string
  applicant_id: string
  applicant?: { nickname: string; contest_count?: number }
}

export function ContestMatchCard({ match, currentUserId, onDeleted }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [applying, setApplying] = useState(false)
  const [alreadyApplied, setAlreadyApplied] = useState(false)
  const [applications, setApplications] = useState<Applicant[]>([])
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [currentCount, setCurrentCount] = useState(match.current_count)
  const [status, setStatus] = useState(match.status)

  const isOwn = currentUserId === match.author_id
  const daysLeft = getDaysUntilDeadline(match.deadline)
  const isUrgent = daysLeft >= 0 && daysLeft <= 7
  const remaining = match.team_size - currentCount

  const categoryColors = CATEGORY_COLORS[match.contest_category as keyof typeof CATEGORY_COLORS] ||
    { color: '#475569', bg: '#F1F5F9' }

  // ── supabase 싱글턴: const 변수 재선언 불필요, 상위에서 한 번만 ──

  // 이미 신청했는지 확인
  const checkApplied = useCallback(async () => {
    if (!currentUserId || isOwn) return
    const { data } = await supabase
      .from('contest_applications')
      .select('id')
      .eq('contest_match_id', match.id)
      .eq('applicant_id', currentUserId)
      .maybeSingle()
    setAlreadyApplied(!!data)
  }, [currentUserId, isOwn, match.id, supabase])

  // 작성자용: 신청 목록 조회
  const fetchApplications = useCallback(async () => {
    if (!isOwn) return
    const { data } = await supabase
      .from('contest_applications')
      .select('id, applicant_id, applicant:profiles!contest_applications_applicant_id_fkey(nickname, contest_count)')
      .eq('contest_match_id', match.id)
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
  }, [isOwn, match.id, supabase])

  useEffect(() => {
    checkApplied()
    fetchApplications()

    if (isOwn) {
      const channel = supabase
        .channel(`contest-apps:${match.id}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'contest_applications',
          filter: `contest_match_id=eq.${match.id}`,
        }, () => {
          fetchApplications()
        })
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.warn(`[ContestMatchCard] Realtime ${status}`)
          }
        })
      // 싱글턴 덕분에 deps에서 supabase 제거 가능 — 10초 폴링
      const polling = setInterval(fetchApplications, 10000)
      return () => {
        supabase.removeChannel(channel)
        clearInterval(polling)
      }
    }
  }, [isOwn, checkApplied, fetchApplications, match.id])

  const handleApply = async () => {
    if (!currentUserId) return toast.error('로그인이 필요합니다.')
    setApplying(true)
    try {
      const res = await fetch(`/api/contest-matches/${match.id}/apply`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) return toast.error(data.error || '신청에 실패했습니다.')
      setAlreadyApplied(true)
      toast.success('팀원 신청이 완료되었습니다!')
    } finally {
      setApplying(false)
    }
  }

  const handleAccept = async (app: Applicant) => {
    setLoadingId(app.id)
    try {
      const res = await fetch(`/api/contest-applications/${app.id}/accept`, { method: 'PATCH' })
      const data = await res.json()
      if (!res.ok) return toast.error(data.error || '수락에 실패했습니다.')
      toast.success('✅ 팀원을 수락했습니다! 그룹 채팅방이 생성되었어요.')
      setApplications((prev) => prev.filter((a) => a.id !== app.id))
      const newCount = currentCount + 1
      setCurrentCount(newCount)
      if (newCount >= match.team_size) {
        setStatus('마감')
        setTimeout(() => onDeleted?.(match.id), 1500)
      }
      if (data.roomId) {
        // 채팅방으로 이동 제안
      }
    } finally {
      setLoadingId(null)
    }
  }

  const handleReject = async (app: Applicant) => {
    setLoadingId(app.id)
    try {
      const res = await fetch(`/api/contest-applications/${app.id}/reject`, { method: 'PATCH' })
      const data = await res.json()
      if (!res.ok) return toast.error(data.error || '거절에 실패했습니다.')
      toast.success('신청을 거절했습니다.')
      setApplications((prev) => prev.filter((a) => a.id !== app.id))
    } finally {
      setLoadingId(null)
    }
  }

  if (status === '마감') return null

  return (
    <div className="card p-5 hover:shadow-md transition-shadow flex flex-col gap-3">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          <span
            className="px-2.5 py-1 rounded-full text-xs font-semibold"
            style={{ backgroundColor: categoryColors.bg, color: categoryColors.color }}
          >
            {match.contest_category}
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
            {match.region}
          </span>
        </div>
        <span
          className={`text-xs font-bold whitespace-nowrap px-2 py-1 rounded-full ${
            daysLeft < 0
              ? 'bg-slate-100 text-slate-400'
              : isUrgent
              ? 'bg-red-100 text-red-600'
              : 'bg-green-100 text-green-700'
          }`}
        >
          {daysLeft < 0 ? '마감' : `D-${daysLeft}`}
        </span>
      </div>

      {/* 공모전명 */}
      <div>
        <div className="flex items-center gap-1.5">
          <Trophy size={15} className="text-yellow-500 flex-shrink-0" />
          <h3 className="font-bold text-slate-800 text-sm leading-snug">{match.contest_name}</h3>
        </div>
        {match.author && (
          <p className="text-xs text-slate-400 mt-0.5">by {match.author.nickname}</p>
        )}
      </div>

      {/* 상세 정보 */}
      <div className="grid grid-cols-2 gap-1.5 text-xs text-slate-500">
        <div className="flex items-center gap-1">
          <Calendar size={11} className="text-slate-400" />
          <span>마감: <strong className="text-slate-700">{match.deadline}</strong></span>
        </div>
        <div className="flex items-center gap-1">
          <MapPin size={11} className="text-slate-400" />
          <span>{match.region}</span>
        </div>
        <div className="flex items-center gap-1 col-span-2">
          <Users size={11} className="text-yellow-500" />
          <span>
            팀원 모집:{' '}
            <strong className={remaining === 0 ? 'text-red-500' : 'text-yellow-600'}>
              {remaining}명
            </strong>
            <span className="text-slate-400"> / {match.team_size}명</span>
          </span>
        </div>
      </div>

      {/* 소개글 */}
      <p className="text-slate-600 text-xs line-clamp-2">{match.description}</p>

      {/* 하단 액션 */}
      <div className="mt-auto pt-1">
        {isOwn ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">내 게시글</span>
              <button
                onClick={fetchApplications}
                className="p-1 text-slate-300 hover:text-slate-500 transition-colors"
                title="새로고침"
              >
                <RefreshCw size={11} />
              </button>
            </div>

            {applications.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-2">아직 신청이 없습니다</p>
            ) : (
              <div className="border-t border-slate-100 pt-2 space-y-2">
                <p className="text-xs font-bold text-slate-500 flex items-center gap-1">
                  신청 현황
                  <span className="ml-1 px-1.5 py-0.5 bg-yellow-500 text-white rounded-full text-[10px]">
                    {applications.length}
                  </span>
                </p>
                {applications.map((app) => (
                  <div key={app.id} className="flex items-center justify-between bg-slate-50 rounded-xl p-2.5 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User size={13} className="text-yellow-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-700 truncate">
                          {app.applicant?.nickname ?? '알 수 없음'}
                        </p>
                        <p className="text-xs text-slate-400">
                          출전: {app.applicant?.contest_count ?? 0}회
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => handleAccept(app)}
                        disabled={!!loadingId}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-green-500 text-white text-xs font-semibold rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
                      >
                        {loadingId === app.id ? (
                          <div className="w-3 h-3 border border-white/40 border-t-white rounded-full animate-spin" />
                        ) : (
                          <><Check size={11} /> 수락</>
                        )}
                      </button>
                      <button
                        onClick={() => handleReject(app)}
                        disabled={!!loadingId}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-red-500 text-white text-xs font-semibold rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                      >
                        <X size={11} /> 거절
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 그룹 채팅 이동 */}
            <button
              onClick={() => router.push('/messages?tab=contest')}
              className="w-full py-2 flex items-center justify-center gap-1.5 text-xs text-slate-500 hover:text-primary border border-slate-200 rounded-xl hover:border-primary/30 transition-colors"
            >
              <MessageCircle size={13} />
              팀 채팅방
            </button>
          </div>
        ) : alreadyApplied ? (
          <button
            disabled
            className="w-full py-2.5 rounded-xl text-sm font-medium bg-green-100 text-green-700 cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            <Check size={14} /> 신청 완료
          </button>
        ) : (
          <button
            onClick={handleApply}
            disabled={applying || daysLeft < 0}
            className="w-full py-2.5 rounded-xl text-sm font-semibold bg-yellow-500 text-white hover:bg-yellow-600 transition-colors disabled:opacity-70 flex items-center justify-center gap-1.5"
          >
            {applying ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><Users size={14} /> 팀원 신청</>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
