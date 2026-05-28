import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

type Action = 'warn' | 'suspend_30' | 'ban' | 'dismiss'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: '관리자 권한이 필요합니다.' }, { status: 403 })
  }

  const { action }: { action: Action } = await req.json()
  if (!['warn', 'suspend_30', 'ban', 'dismiss'].includes(action)) {
    return NextResponse.json({ error: '유효하지 않은 처리입니다.' }, { status: 400 })
  }

  const { data: report } = await supabaseAdmin
    .from('reports')
    .select('reported_id')
    .eq('id', id)
    .single()

  if (!report) return NextResponse.json({ error: '신고를 찾을 수 없습니다.' }, { status: 404 })

  // Update report status
  await supabaseAdmin
    .from('reports')
    .update({ status: action === 'dismiss' ? 'dismissed' : 'resolved' })
    .eq('id', id)

  // Apply action to reported user
  if (action === 'warn') {
    await supabaseAdmin.from('notifications').insert({
      user_id: report.reported_id,
      type: 'match_reject',
      message: '신고 검토 결과 경고 처리되었습니다. 커뮤니티 가이드라인을 준수해 주세요.',
      related_id: id,
    })
  } else if (action === 'suspend_30') {
    await supabaseAdmin
      .from('profiles')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', report.reported_id)
  } else if (action === 'ban') {
    await supabaseAdmin
      .from('profiles')
      .update({ is_active: false, role: 'banned', updated_at: new Date().toISOString() })
      .eq('id', report.reported_id)
  }

  return NextResponse.json({ success: true, action })
}
