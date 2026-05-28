import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// DELETE: 본인이 신청한 대기중(pending) 매치 지원 취소
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: applicationId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  // 신청 조회
  const { data: app } = await supabase
    .from('match_applications')
    .select('id, applicant_id, match_id, status')
    .eq('id', applicationId)
    .single()

  if (!app) return NextResponse.json({ error: '신청을 찾을 수 없습니다.' }, { status: 404 })
  if (app.applicant_id !== user.id) return NextResponse.json({ error: '본인 신청만 취소할 수 있습니다.' }, { status: 403 })
  if (app.status !== 'pending') return NextResponse.json({ error: '대기 중인 신청만 취소할 수 있습니다.' }, { status: 400 })

  // 신청 삭제 (pending 취소는 레코드 삭제로 처리)
  const { error } = await supabaseAdmin
    .from('match_applications')
    .delete()
    .eq('id', applicationId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 매치는 이미 '모집중' 상태이므로 별도 처리 불필요
  return NextResponse.json({ success: true })
}
