import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  // 내가 멤버인 그룹 채팅방 목록
  const { data: memberRows } = await supabase
    .from('contest_chat_members')
    .select('room_id')
    .eq('user_id', user.id)

  const roomIds = (memberRows || []).map((r) => r.room_id)

  if (roomIds.length === 0) return NextResponse.json([])

  const { data: rooms, error } = await supabase
    .from('contest_chat_rooms')
    .select(`
      id, name, created_at, contest_match_id,
      contest_match:contest_matches!contest_chat_rooms_contest_match_id_fkey(
        id, contest_name, contest_category, region, deadline, team_size, current_count, status,
        author:profiles!contest_matches_author_id_fkey(id, nickname)
      )
    `)
    .in('id', roomIds)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(rooms || [])
}
