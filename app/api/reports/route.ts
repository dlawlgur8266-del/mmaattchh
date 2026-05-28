import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

const VALID_REASONS = ['불쾌한 언행', '허위 정보', '스팸', '기타'] as const

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  const { reported_id, reason, detail } = await req.json()
  if (!reported_id || !reason) {
    return NextResponse.json({ error: '필수 값이 누락되었습니다.' }, { status: 400 })
  }
  if (reported_id === user.id) {
    return NextResponse.json({ error: '본인을 신고할 수 없습니다.' }, { status: 400 })
  }
  if (!VALID_REASONS.includes(reason)) {
    return NextResponse.json({ error: '유효하지 않은 신고 사유입니다.' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin.from('reports').insert({
    reporter_id: user.id,
    reported_id,
    reason,
    detail: detail ?? null,
    status: 'pending',
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 누적 신고 3회 이상이면 자동 비공개
  const { count } = await supabaseAdmin
    .from('reports')
    .select('id', { count: 'exact', head: true })
    .eq('reported_id', reported_id)
    .eq('status', 'pending')

  if ((count ?? 0) >= 3) {
    await supabaseAdmin
      .from('profiles')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', reported_id)
  }

  return NextResponse.json({ success: true, report: data })
}
