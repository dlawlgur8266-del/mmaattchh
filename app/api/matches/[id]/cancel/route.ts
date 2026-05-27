import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: matchId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  // ── 매치 정보 조회 ──
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .select('id, author_id, team_name, sport, status')
    .eq('id', matchId)
    .single()

  if (matchError || !match) {
    return NextResponse.json({ error: '매치를 찾을 수 없습니다.' }, { status: 404 })
  }
  if (match.status !== '매치확정') {
    return NextResponse.json({ error: '확정된 매치만 취소할 수 있습니다.' }, { status: 400 })
  }

  // ── 수락된 신청 조회 (상대방 식별) ──
  const { data: application } = await supabase
    .from('match_applications')
    .select('id, applicant_id')
    .eq('match_id', matchId)
    .eq('status', 'accepted')
    .maybeSingle()

  // ── 권한 확인: 작성자 또는 신청자만 취소 가능 ──
  const isAuthor = match.author_id === user.id
  const isApplicant = application?.applicant_id === user.id

  if (!isAuthor && !isApplicant) {
    return NextResponse.json({ error: '매치 취소 권한이 없습니다.' }, { status: 403 })
  }

  // ── 신청 상태를 rejected로 변경 (DB 제약 없음) ──
  if (application) {
    const { error: appError } = await supabaseAdmin
      .from('match_applications')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', application.id)

    if (appError) {
      return NextResponse.json({ error: '취소 처리 중 오류가 발생했습니다.' }, { status: 500 })
    }
  }

  // ── 매치 상태를 '모집중'으로 되돌림 (DB 기존 상태 호환) ──
  const { error: matchUpdateError } = await supabaseAdmin
    .from('matches')
    .update({ status: '모집중', updated_at: new Date().toISOString() })
    .eq('id', matchId)

  if (matchUpdateError) {
    return NextResponse.json({ error: '매치 상태 업데이트 중 오류가 발생했습니다.' }, { status: 500 })
  }

  // ── 상대방에게 실시간 알림 전송 ──
  const { data: myProfile } = await supabase
    .from('profiles')
    .select('nickname')
    .eq('id', user.id)
    .single()

  const myNickname = myProfile?.nickname || '상대방'
  const recipientId = isAuthor ? application?.applicant_id : match.author_id

  if (recipientId) {
    await supabaseAdmin.from('notifications').insert({
      user_id: recipientId,
      type: 'match_cancel',
      message: `⚠️ ${myNickname}님이 ${match.sport} 매치(${match.team_name})를 취소했습니다.`,
      related_id: matchId,
    })
  }

  return NextResponse.json({ success: true })
}
