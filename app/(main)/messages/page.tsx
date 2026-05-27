'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { EmptyState } from '@/components/ui/EmptyState'
import { SPORT_META } from '@/types/database'
import { formatDateTime } from '@/lib/utils'
import { Trophy, MessageCircle, Users, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { CATEGORY_COLORS } from '@/data/contests'
import { PageSpinner } from '@/components/ui/Spinner'
import { Suspense } from 'react'
import toast from 'react-hot-toast'

function MessagesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tab = searchParams.get('tab') === 'contest' ? 'contest' : 'match'

  const [userId, setUserId] = useState<string | null>(null)
  const [matchRooms, setMatchRooms] = useState<any[]>([])
  const [contestRooms, setContestRooms] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [leavingId, setLeavingId] = useState<string | null>(null)

  const supabase = createClient()

  const load = useCallback(async () => {
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
    } else {
      setContestRooms([])
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  // ── 1:1 매치 채팅 나가기 ───────────────────────────────────
  const leaveMatchRoom = async (roomId: string) => {
    if (!window.confirm('채팅방을 나가시겠습니까?\n채팅 내역이 모두 삭제됩니다.')) return
    setLeavingId(roomId)
    try {
      const res = await fetch(`/api/messages/${roomId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || '나가기에 실패했습니다.')
        return
      }
      setMatchRooms((prev) => prev.filter((r) => r.id !== roomId))
      toast.success('채팅방을 나갔습니다.')
    } finally {
      setLeavingId(null)
    }
  }

  // ── 공모전 그룹 채팅 나가기 ───────────────────────────────
  const leaveContestRoom = async (roomId: string) => {
    if (!window.confirm('팀 채팅방을 나가시겠습니까?\n나가도 채팅 내역은 팀원에게 유지됩니다.')) return
    setLeavingId(roomId)
    try {
      const res = await fetch(`/api/contest-rooms/${roomId}/leave`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || '나가기에 실패했습니다.')
        return
      }
      setContestRooms((prev) => prev.filter((r) => r.id !== roomId))
      toast.success('팀 채팅방을 나갔습니다.')
    } finally {
      setLeavingId(null)
    }
  }

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
                  <div key={room.id} className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
                    {/* 아이콘 */}
                    <Link href={`/messages/${room.id}`} className="flex items-center gap-3 flex-1 min-w-0">
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
                    {/* 나가기 버튼 */}
                    <button
                      onClick={() => leaveMatchRoom(room.id)}
                      disabled={leavingId === room.id}
                      className="flex-shrink-0 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-40"
                      title="채팅방 나가기"
                    >
                      {leavingId === room.id ? (
                        <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                      ) : (
                        <LogOut size={16} />
                      )}
                    </button>
                  </div>
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
                  <div key={room.id} className="card p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
                    <Link href={`/messages/contest/${room.id}`} className="flex items-center gap-3 flex-1 min-w-0">
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
                    {/* 나가기 버튼 */}
                    <button
                      onClick={() => leaveContestRoom(room.id)}
                      disabled={leavingId === room.id}
                      className="flex-shrink-0 p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors disabled:opacity-40"
                      title="채팅방 나가기"
                    >
                      {leavingId === room.id ? (
                        <div className="w-4 h-4 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
                      ) : (
                        <LogOut size={16} />
                      )}
                    </button>
                  </div>
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
