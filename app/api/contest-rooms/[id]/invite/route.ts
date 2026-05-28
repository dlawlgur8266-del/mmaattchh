import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// GET: 초대 가능한 멤버 목록 (수락된 신청자 중 아직 채팅방에 없는 사람)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: roomId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  // 채팅방의 contest_match_id 조회
  const { data: room } = await supabase
    .from('contest_chat_rooms')
    .select('contest_match_id, contest_match:contest_matches!contest_chat_rooms_contest_match_id_fkey(author_id)')
    .eq('id', roomId)
    .single()

  if (!room) return NextResponse.json({ error: '채팅방을 찾을 수 없습니다.' }, { status: 404 })

  const contestMatchId = room.contest_match_id
  const authorId = (room.contest_match as any)?.author_id

  // 게시글 작성자만 초대 가능
  if (authorId !== user.id) {
    return NextResponse.json({ error: '팀원 초대는 팀장만 가능합니다.' }, { status: 403 })
  }

  // 이미 채팅방에 있는 멤버 목록
  const { data: existingMembers } = await supabase
    .from('contest_chat_members')
    .select('user_id')
    .eq('room_id', roomId)

  const existingIds = (existingMembers || []).map((m: any) => m.user_id)

  // 수락된 신청자 중 아직 채팅방에 없는 사람 (보안: accepted 상태만)
  const { data: accepted } = await supabaseAdmin
    .from('contest_applications')
    .select('applicant_id, applicant:profiles!contest_applications_applicant_id_fkey(id, nickname)')
    .eq('contest_match_id', contestMatchId)
    .eq('status', 'accepted')

  const invitable = (accepted || [])
    .filter((a: any) => !existingIds.includes(a.applicant_id))
    .map((a: any) => ({
      userId: a.applicant_id,
      nickname: (Array.isArray(a.applicant) ? a.applicant[0] : a.applicant)?.nickname || '알 수 없음',
    }))

  return NextResponse.json(invitable)
}

// POST: 특정 유저를 채팅방에 초대
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: roomId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  const { userId: targetUserId } = await req.json()
  if (!targetUserId) return NextResponse.json({ error: '초대할 유저 ID가 필요합니다.' }, { status: 400 })

  // 채팅방과 팀장 확인
  const { data: room } = await supabase
    .from('contest_chat_rooms')
    .select('contest_match_id, contest_match:contest_matches!contest_chat_rooms_contest_match_id_fkey(author_id)')
    .eq('id', roomId)
    .single()

  if (!room) return NextResponse.json({ error: '채팅방을 찾을 수 없습니다.' }, { status: 404 })

  const authorId = (room.contest_match as any)?.author_id
  if (authorId !== user.id) {
    return NextResponse.json({ error: '팀원 초대는 팀장만 가능합니다.' }, { status: 403 })
  }

  // 보안: 해당 공모전에 신청하고 수락된 사람만 초대 가능
  const { data: application } = await supabaseAdmin
    .from('contest_applications')
    .select('id')
    .eq('contest_match_id', room.contest_match_id)
    .eq('applicant_id', targetUserId)
    .eq('status', 'accepted')
    .maybeSingle()

  if (!application) {
    return NextResponse.json(
      { error: '공모전 팀원 신청을 수락한 사람만 초대할 수 있습니다.' },
      { status: 403 }
    )
  }

  // 이미 멤버인지 확인
  const { data: alreadyMember } = await supabaseAdmin
    .from('contest_chat_members')
    .select('id')
    .eq('room_id', roomId)
    .eq('user_id', targetUserId)
    .maybeSingle()

  if (alreadyMember) {
    return NextResponse.json({ error: '이미 채팅방에 참여 중인 멤버입니다.' }, { status: 409 })
  }

  // 채팅방 멤버에 추가
  const { error } = await supabaseAdmin
    .from('contest_chat_members')
    .insert({ room_id: roomId, user_id: targetUserId })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
