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
    .from('match_applications')
    .select('id,match_id,applicant_id,status,match:matches!match_applications_match_id_fkey(author_id,team_name,sport)')
    .eq('id', applicationId)
    .single()

  if (!app) return NextResponse.json({ error: '신청을 찾을 수 없습니다.' }, { status: 404 })

  const match = app.match as any
  if (!match) return NextResponse.json({ error: '매치 정보 없음.' }, { status: 404 })
  if (match.author_id !== user.id) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  if (app.status !== 'pending') return NextResponse.json({ error: '이미 처리된 신청입니다.' }, { status: 400 })

  await supabaseAdmin
    .from('match_applications')
    .update({ status: 'rejected', updated_at: new Date().toISOString() })
    .eq('id', applicationId)

  // 신청자에게 거절 알림 — "거절당했습니다" 문구
  await supabaseAdmin.from('notifications').insert({
    user_id: app.applicant_id,
    type: 'match_reject',
    message: `거절당했습니다 — ${match.team_name} (${match.sport}) 매치 신청이 거절되었습니다.`,
    related_id: app.match_id,
  })

  return NextResponse.json({ success: true })
}
