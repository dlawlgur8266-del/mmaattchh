import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: applicationId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  // 신청 정보 조회
  const { data: app } = await supabase
    .from('contest_applications')
    .select(`
      id, contest_match_id, applicant_id, status,
      contest_match:contest_matches!contest_applications_contest_match_id_fkey(
        id, author_id, contest_name, team_size, current_count, status
      )
    `)
    .eq('id', applicationId)
    .single()

  if (!app) return NextResponse.json({ error: '신청을 찾을 수 없습니다.' }, { status: 404 })

  const cm = app.contest_match as any
  if (!cm) return NextResponse.json({ error: '게시글 정보를 찾을 수 없습니다.' }, { status: 404 })
  if (cm.author_id !== user.id) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  if (app.status !== 'pending') return NextResponse.json({ error: '이미 처리된 신청입니다.' }, { status: 400 })

  // 신청 수락
  await supabaseAdmin
    .from('contest_applications')
    .update({ status: 'accepted', updated_at: new Date().toISOString() })
    .eq('id', applicationId)

  const newCount = (cm.current_count || 0) + 1
  const isTeamFull = newCount >= cm.team_size

  // 카운트 업데이트
  await supabaseAdmin
    .from('contest_matches')
    .update({
      current_count: newCount,
      status: isTeamFull ? '마감' : '모집중',
      updated_at: new Date().toISOString(),
    })
    .eq('id', app.contest_match_id)

  // 그룹 채팅방에 새 멤버 추가
  const { data: room } = await supabaseAdmin
    .from('contest_chat_rooms')
    .select('id')
    .eq('contest_match_id', app.contest_match_id)
    .single()

  let roomId = room?.id

  if (roomId) {
    // 멤버 추가 (이미 있으면 무시)
    await supabaseAdmin
      .from('contest_chat_members')
      .upsert(
        { room_id: roomId, user_id: app.applicant_id },
        { onConflict: 'room_id,user_id', ignoreDuplicates: true }
      )
  } else {
    // 채팅방이 없으면 새로 생성
    const { data: newRoom } = await supabaseAdmin
      .from('contest_chat_rooms')
      .insert({ contest_match_id: app.contest_match_id, name: cm.contest_name })
      .select()
      .single()

    if (newRoom) {
      roomId = newRoom.id
      await supabaseAdmin
        .from('contest_chat_members')
        .insert([
          { room_id: roomId, user_id: user.id },
          { room_id: roomId, user_id: app.applicant_id },
        ])
    }
  }

  // 신청자에게 수락 알림
  await supabaseAdmin.from('notifications').insert({
    user_id: app.applicant_id,
    type: 'contest_accept',
    message: `${cm.contest_name} 공모전 팀원 신청이 수락되었습니다! 팀 채팅방에서 대화하세요.`,
    related_id: roomId || app.contest_match_id,
  })

  // 팀이 가득 찼을 때 나머지 신청자 자동 거절
  if (isTeamFull) {
    const { data: pendingApps } = await supabaseAdmin
      .from('contest_applications')
      .select('id, applicant_id')
      .eq('contest_match_id', app.contest_match_id)
      .eq('status', 'pending')

    if (pendingApps && pendingApps.length > 0) {
      await supabaseAdmin
        .from('contest_applications')
        .update({ status: 'rejected', updated_at: new Date().toISOString() })
        .eq('contest_match_id', app.contest_match_id)
        .eq('status', 'pending')

      // 각 신청자에게 거절 알림
      const notifications = pendingApps.map((pa) => ({
        user_id: pa.applicant_id,
        type: 'contest_reject' as const,
        message: `${cm.contest_name} 공모전 팀원 신청이 거절되었습니다. (팀 정원 마감)`,
        related_id: app.contest_match_id,
      }))
      await supabaseAdmin.from('notifications').insert(notifications)
    }
  }

  return NextResponse.json({ success: true, roomId, teamFull: isTeamFull })
}
