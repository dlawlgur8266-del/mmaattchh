'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Trophy, Users, Calendar, MapPin, PenSquare, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { CATEGORY_COLORS } from '@/data/contests'
import { getDaysUntilDeadline } from '@/data/contests'
import type { ContestMatch } from '@/types/database'
import { PageSpinner } from '@/components/ui/Spinner'
import { ContestMatchCard } from '@/components/contest/ContestMatchCard'

export default function ContestMatchesPage() {
  const router = useRouter()
  const [matches, setMatches] = useState<ContestMatch[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUserId(user?.id || null)

    const { data } = await supabase
      .from('contest_matches')
      .select('*, author:profiles!contest_matches_author_id_fkey(id,nickname,skill_level,contest_count)')
      .eq('status', '모집중')
      .order('deadline', { ascending: true })

    setMatches(data || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    const channel = supabase
      .channel('contest-matches-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contest_matches' }, () => {
        fetchData()
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [supabase, fetchData])

  if (loading) return <PageSpinner />

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="text-yellow-500" size={22} />
            <h1 className="text-2xl font-bold text-slate-800">공모전 팀원 매치</h1>
          </div>
          <p className="text-slate-500 text-sm mt-0.5">공모전 팀원을 구하거나 팀에 합류하세요</p>
        </div>
        <button
          onClick={() => router.push('/contest/write')}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-xl font-medium text-sm hover:bg-yellow-600 transition-colors shadow-sm"
        >
          <PenSquare size={16} />
          <span className="hidden sm:inline">팀원 모집</span>
        </button>
      </div>

      {matches.length === 0 ? (
        <div className="text-center py-16">
          <Trophy size={48} className="mx-auto mb-4 text-yellow-400 opacity-50" />
          <p className="font-semibold text-slate-600">아직 팀원 모집 게시글이 없습니다</p>
          <p className="text-sm text-slate-400 mt-1">첫 번째로 팀원을 모집해보세요!</p>
          <button
            onClick={() => router.push('/contest/write')}
            className="mt-4 px-6 py-2.5 bg-yellow-500 text-white rounded-xl font-medium text-sm hover:bg-yellow-600 transition-colors"
          >
            팀원 모집 글 작성하기
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {matches.map((match) => (
            <ContestMatchCard
              key={match.id}
              match={match}
              currentUserId={currentUserId}
              onDeleted={(id) => setMatches((prev) => prev.filter((m) => m.id !== id))}
            />
          ))}
        </div>
      )}
    </div>
  )
}
