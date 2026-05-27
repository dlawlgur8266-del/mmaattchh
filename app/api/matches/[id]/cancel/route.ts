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

  // 매치 정보 조회
  const { data: match } = await supabase
    .from('matches')
    .select('id, author_id, team_name, sport, status')
    .eq('id', matchId)
    .single()

  if (!match) return NextResponse.json({ error: '매치를 찾을 수 없습니다.' }, { status: 404 })
  if (match.status !== '매치확정') return NextResponse.json({ error: '확정된 매치만 취소할 수 있습니다.' }, { status: 400 })

  // 수락된 신청 조회 (상대방 식별용)
  const { data: application } = await supabase
    .from('match_applications')
    .select('id, applicant_id')
    .eq('match_id', matchId)
    .eq('status', 'accepted')
    .single()

  // 작성자 또는 신청자만 취소 가능
  const isAuthor = match.author_id === user.id
  const isApplicant = application?.applicant_id === user.id

  if (!isAuthor && !isApplicant) {
    return NextResponse.json({ error: '매치 취소 권한이 없습니다.' }, { status: 403 })
  }

  // 매치 상태를 '취소됨'으로 변경
  const { error: updateError } = await supabaseAdmin
    .from('matches')
    .update({ status: '취소됨', updated_at: new Date().toISOString() })
    .eq('id', matchId)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  // 신청 상태도 변경 (선택적)
  if (application) {
    await supabaseAdmin
      .from('match_applications')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', application.id)
  }

  // 상대방에게 취소 알림 전송
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
