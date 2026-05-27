'use client'

import { useState } from 'react'
import { Users, Zap, MapPin } from 'lucide-react'
import { SportBadge, LevelBadge, StatusBadge } from '@/components/ui/Badge'
import { PendingApplications } from './PendingApplications'
import { SPORT_META } from '@/types/database'
import { formatDateTime } from '@/lib/utils'
import type { Match, MatchStatus } from '@/types/database'
import toast from 'react-hot-toast'

interface MatchCardProps {
  match: Match
  currentUserId: string | null
  alreadyApplied?: boolean
  onApplied?: () => void
}

export function MatchCard({ match, currentUserId, alreadyApplied = false, onApplied }: MatchCardProps) {
  const [applied, setApplied] = useState(alreadyApplied)
  const [loading, setLoading] = useState(false)
  // 수락 시 카드 상태를 즉시 "매치확정"으로 반영
  const [status, setStatus] = useState<MatchStatus>(match.status)

  const isOwn = currentUserId === match.author_id
  const meta = SPORT_META[match.sport]

  const handleApply = async () => {
    if (!currentUserId) {
      toast.error('로그인이 필요합니다.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/matches/${match.id}/apply`, { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || '신청에 실패했습니다.')
        return
      }
      setApplied(true)
      toast.success('매치 신청이 완료되었습니다!')
      onApplied?.()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card p-5 hover:shadow-md transition-shadow flex flex-col gap-3">
      {/* 헤더 */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          <SportBadge sport={match.sport} />
          <LevelBadge level={match.required_level} />
          <StatusBadge status={status} />
        </div>
        <span className="text-xs text-slate-400 whitespace-nowrap">{formatDateTime(match.created_at)}</span>
      </div>

      {/* 팀명 */}
      <div>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{meta.emoji}</span>
          <h3 className="font-bold text-slate-800 text-lg">{match.team_name}</h3>
        </div>
        <div className="flex items-center gap-1 mt-1 text-slate-500 text-sm">
          <Users size={14} />
          <span>{match.match_size}</span>
          {match.author && (
            <span className="ml-2 text-slate-400">by {match.author.nickname}</span>
          )}
        </div>
        {match.location && (
          <div className="flex items-center gap-1 mt-0.5 text-slate-400 text-xs">
            <MapPin size={12} />
            <span>{match.location}</span>
          </div>
        )}
      </div>

      {/* 소개글 */}
      <p className="text-slate-600 text-sm line-clamp-2">{match.description}</p>

      {/* 하단 액션 */}
      <div className="mt-auto pt-1">
        {isOwn ? (
          /* ── 작성자 뷰 ── */
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-slate-500">내 게시글</span>
              <StatusBadge status={status} />
            </div>

            {/* 마감 전에만 신청 현황 표시 */}
            {status === '모집중' ? (
              <PendingApplications
                matchId={match.id}
                onAccepted={() => setStatus('매치확정')}
              />
            ) : (
              <p className="text-xs text-center text-slate-400 py-2">매치가 확정되었습니다</p>
            )}
          </div>
        ) : status === '매치확정' ? (
          <button disabled className="w-full py-2.5 rounded-xl text-sm font-medium bg-slate-100 text-slate-400 cursor-not-allowed">
            매치 확정됨
          </button>
        ) : applied ? (
          <button disabled className="w-full py-2.5 rounded-xl text-sm font-medium bg-green-100 text-green-700 cursor-not-allowed flex items-center justify-center gap-1.5">
            <Zap size={14} /> 신청 완료
          </button>
        ) : (
          <button
            onClick={handleApply}
            disabled={loading}
            className="w-full py-2.5 rounded-xl text-sm font-semibold bg-accent text-white hover:bg-accent-600 transition-colors disabled:opacity-70 flex items-center justify-center gap-1.5"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><Zap size={14} /> 매치 신청</>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
