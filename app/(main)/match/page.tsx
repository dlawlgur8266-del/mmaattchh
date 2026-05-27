'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { PenSquare } from 'lucide-react'
import { FilterBar } from '@/components/match/FilterBar'
import { MatchCard } from '@/components/match/MatchCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageSpinner } from '@/components/ui/Spinner'
import { createClient } from '@/lib/supabase/client'
import type { Match, Sport, SkillLevel } from '@/types/database'

export default function MatchPage() {
  const router = useRouter()
  const [matches, setMatches] = useState<Match[]>([])
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set())
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [sport, setSport] = useState<Sport | 'all'>('all')
  const [level, setLevel] = useState<SkillLevel | 'all'>('all')

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUserId(user?.id || null)

    // ── '모집중' 상태만 표시 ──
    // 매치 확정(매치확정) 게시물은 목록에서 제외하여 내 정보에만 남게 함
    let query = supabase
      .from('matches')
      .select('*, author:profiles!matches_author_id_fkey(id,nickname,skill_level)')
      .eq('status', '모집중')   // ← 핵심 필터
      .order('created_at', { ascending: false })

    if (sport !== 'all') query = query.eq('sport', sport)
    if (level !== 'all') query = query.eq('required_level', level)

    const { data } = await query
    setMatches(data || [])

    if (user) {
      const { data: apps } = await supabase
        .from('match_applications')
        .select('match_id')
        .eq('applicant_id', user.id)
      setAppliedIds(new Set(apps?.map((a) => a.match_id) || []))
    }
    setLoading(false)
  }, [sport, level, supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // 실시간 구독 — 매치 상태 변경 시 목록 자동 갱신
  // (확정 → 목록에서 사라짐 / 취소 → 모집중으로 복원되어 자동 재등록)
  useEffect(() => {
    const channel = supabase
      .channel('matches-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => {
        fetchData()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase, fetchData])

  if (loading) return <PageSpinner />

  return (
    <div className="space-y-5">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">매치</h1>
          <p className="text-slate-500 text-sm mt-0.5">원하는 상대를 찾아 매치를 신청하세요</p>
        </div>
        <button
          onClick={() => router.push('/match/write')}
          className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl font-medium text-sm hover:bg-accent-600 transition-colors shadow-sm"
        >
          <PenSquare size={16} />
          <span className="hidden sm:inline">매치글 작성</span>
        </button>
      </div>

      {/* Filters */}
      <FilterBar
        selectedSport={sport}
        selectedLevel={level}
        onSportChange={setSport}
        onLevelChange={setLevel}
      />

      {/* Match grid */}
      {matches.length === 0 ? (
        <EmptyState
          emoji="🏟️"
          title="매치가 없습니다"
          description="아직 모집 중인 매치가 없어요. 첫 번째로 매치글을 작성해보세요!"
          action={
            <button
              onClick={() => router.push('/match/write')}
              className="btn-accent px-6 py-2.5"
            >
              매치글 작성하기
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {matches.map((match) => (
            <MatchCard
              key={match.id}
              match={match}
              currentUserId={currentUserId}
              alreadyApplied={appliedIds.has(match.id)}
              onApplied={() => setAppliedIds((prev) => new Set([...prev, match.id]))}
              // 매치 확정 시 목록에서 즉시 제거 (내 정보에만 남음)
              onConfirmed={(id) => setMatches((prev) => prev.filter((m) => m.id !== id))}
            />
          ))}
        </div>
      )}
    </div>
  )
}
