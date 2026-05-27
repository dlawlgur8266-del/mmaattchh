import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: contestMatchId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  // 게시글 조회
  const { data: contestMatch } = await supabase
    .from('contest_matches')
    .select('id, author_id, status, team_size, current_count, contest_name')
    .eq('id', contestMatchId)
    .single()

  if (!contestMatch) return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 })
  if (contestMatch.author_id === user.id) return NextResponse.json({ error: '본인 게시글에는 신청할 수 없습니다.' }, { status: 400 })
  if (contestMatch.status === '마감') return NextResponse.json({ error: '이미 마감된 게시글입니다.' }, { status: 400 })

  // 중복 신청 확인
  const { data: existing } = await supabase
    .from('contest_applications')
    .select('id')
    .eq('contest_match_id', contestMatchId)
    .eq('applicant_id', user.id)
    .maybeSingle()

  if (existing) return NextResponse.json({ error: '이미 신청한 게시글입니다.' }, { status: 400 })

  // 신청 생성
  const { error } = await supabaseAdmin
    .from('contest_applications')
    .insert({
      contest_match_id: contestMatchId,
      applicant_id: user.id,
      status: 'pending',
    })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 작성자에게 알림 전송
  await supabaseAdmin.from('notifications').insert({
    user_id: contestMatch.author_id,
    type: 'contest_apply',
    message: `${contestMatch.contest_name} 공모전 팀원 신청이 도착했습니다.`,
    related_id: contestMatchId,
  })

  return NextResponse.json({ success: true })
}
