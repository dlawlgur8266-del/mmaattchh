'use client'

import { useState, useEffect } from 'react'
import { redirect, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { EmptyState } from '@/components/ui/EmptyState'
import { SPORT_META } from '@/types/database'
import { formatDateTime } from '@/lib/utils'
import { Trophy, MessageCircle, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { CATEGORY_COLORS } from '@/data/contests'
import { PageSpinner } from '@/components/ui/Spinner'
import { Suspense } from 'react'

function MessagesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') === 'contest' ? 'contest' : 'match'

  const [userId, setUserId] = useState<string | null>(null)
  const [matchRooms, setMatchRooms] = useState<any[]>([])
  const [contestRooms, setContestRooms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUserId(user.id)

      // 1:1 매치 채팅방
      const { data: rooms } = await supabase
        .from('message_rooms')
        .select(`
          id, participant_1, participant_2, created_at,
          participant_1_profile:profiles!message_rooms_participant_1_fkey(id,nickname),
          participant_2_profile:profiles!message_rooms_participant_2_fkey(id,nickname),
          match_application:match_applications!message_rooms_application_id_fkey(
            id,
            match:matches!match_applications_match_id_fkey(id,team_name,sport)
          )
        `)
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
        .order('created_at', { ascending: false })

      setMatchRooms(rooms || [])

      // 공모전 그룹 채팅방
      const { data: memberRows } = await supabase
        .from('contest_chat_members')
        .select('room_id')
        .eq('user_id', user.id)

      const roomIds = (memberRows || []).map((r: any) => r.room_id)

      if (roomIds.length > 0) {
        const { data: cRooms } = await supabase
          .from('contest_chat_rooms')
          .select(`
            id, name, created_at, contest_match_id,
            contest_match:contest_matches!contest_chat_rooms_contest_match_id_fkey(
              id, contest_name, contest_category, region, deadline, team_size, current_count,
              author:profiles!contest_matches_author_id_fkey(id, nickname)
            )
          `)
          .in('id', roomIds)
          .order('created_at', { ascending: false })

        setContestRooms(cRooms || [])
      }

      setLoading(false)
    }

    load()
  }, [supabase, router])

  if (loading) return <PageSpinner />

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">메시지</h1>
        <p className="text-slate-500 text-sm mt-0.5">1:1 채팅 및 팀 그룹 채팅</p>
      </div>

      {/* 탭 */}
      <div className="flex gap-2 border-b border-slate-100">
        <Link
          href="/messages"
          className={`pb-3 px-1 text-sm font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
            tab === 'match'
              ? 'border-primary text-primary'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <MessageCircle size={15} />
          매치 채팅
          {matchRooms.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-primary text-white rounded-full text-[10px]">
              {matchRooms.length}
            </span>
          )}
        </Link>
        <Link
          href="/messages?tab=contest"
          className={`pb-3 px-1 text-sm font-semibold flex items-center gap-1.5 border-b-2 transition-colors ${
            tab === 'contest'
              ? 'border-yellow-500 text-yellow-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Trophy size={15} />
          공모전 팀 채팅
          {contestRooms.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 bg-yellow-500 text-white rounded-full text-[10px]">
              {contestRooms.length}
            </span>
          )}
        </Link>
      </div>

      {/* 매치 채팅 탭 */}
      {tab === 'match' && (
        <>
          {matchRooms.length === 0 ? (
            <EmptyState
              emoji="💬"
              title="아직 매치 메시지가 없어요"
              description="매치가 수락되면 상대팀과 1:1 채팅할 수 있습니다."
            />
          ) : (
            <div className="space-y-2">
              {matchRooms.map((room: any) => {
                const isP1 = room.participant_1 === userId
                const opponent = isP1 ? room.participant_2_profile : room.participant_1_profile
                const match = room.match_application?.match
                const sport = match?.sport
                const meta = sport ? SPORT_META[sport as keyof typeof SPORT_META] : null

                return (
                  <Link
                    key={room.id}
                    href={`/messages/${room.id}`}
                    className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
                  >
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                      style={{ backgroundColor: meta?.bgColor || '#F1F5F9' }}
                    >
                      {meta?.emoji || '💬'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800">
                          {opponent?.nickname || '상대방'}
                        </span>
                        <span className="text-xs text-slate-400">{formatDateTime(room.created_at)}</span>
                      </div>
                      <p className="text-sm text-slate-500 truncate mt-0.5">
                        {match ? `${match.team_name} 매치 · 1:1 채팅` : '매치 채팅'}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* 공모전 그룹 채팅 탭 */}
      {tab === 'contest' && (
        <>
          {contestRooms.length === 0 ? (
            <EmptyState
              emoji="🏆"
              title="아직 공모전 팀 채팅이 없어요"
              description="공모전 팀원이 수락되면 그룹 채팅방이 자동으로 생성됩니다."
            />
          ) : (
            <div className="space-y-2">
              {contestRooms.map((room: any) => {
                const cm = room.contest_match
                const colors = cm
                  ? CATEGORY_COLORS[cm.contest_category as keyof typeof CATEGORY_COLORS]
                  : { color: '#D97706', bg: '#FEF3C7' }

                return (
                  <Link
                    key={room.id}
                    href={`/messages/contest/${room.id}`}
                    className="card p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
                  >
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: colors?.bg || '#FEF3C7' }}
                    >
                      <Trophy size={22} style={{ color: colors?.color || '#D97706' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-800 truncate">
                          {cm?.contest_name || room.name || '공모전 팀'}
                        </span>
                        <span className="text-xs text-slate-400">{formatDateTime(room.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-sm text-slate-500 truncate">
                          {cm?.contest_category} · {cm?.region}
                        </p>
                        <span className="flex items-center gap-0.5 text-xs text-slate-400">
                          <Users size={11} />
                          그룹채팅
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <MessagesContent />
    </Suspense>
  )
}
