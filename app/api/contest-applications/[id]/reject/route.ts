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

  const { data: app } = await supabase
    .from('contest_applications')
    .select(`
      id, contest_match_id, applicant_id, status,
      contest_match:contest_matches!contest_applications_contest_match_id_fkey(
        id, author_id, contest_name
      )
    `)
    .eq('id', applicationId)
    .single()

  if (!app) return NextResponse.json({ error: '신청을 찾을 수 없습니다.' }, { status: 404 })

  const cm = app.contest_match as any
  if (!cm) return NextResponse.json({ error: '게시글 정보를 찾을 수 없습니다.' }, { status: 404 })
  if (cm.author_id !== user.id) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  if (app.status !== 'pending') return NextResponse.json({ error: '이미 처리된 신청입니다.' }, { status: 400 })

  // 신청 거절
  await supabaseAdmin
    .from('contest_applications')
    .update({ status: 'rejected', updated_at: new Date().toISOString() })
    .eq('id', applicationId)

  // 신청자에게 거절 알림
  await supabaseAdmin.from('notifications').insert({
    user_id: app.applicant_id,
    type: 'contest_reject',
    message: `팀원 거절: ${cm.contest_name} 공모전 팀원 신청이 거절되었습니다.`,
    related_id: app.contest_match_id,
  })

  return NextResponse.json({ success: true })
}
