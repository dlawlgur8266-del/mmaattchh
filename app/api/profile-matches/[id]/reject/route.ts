import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  const { data: pm } = await supabase
    .from('profile_matches')
    .select('*')
    .eq('id', id)
    .single()

  if (!pm) return NextResponse.json({ error: '신청을 찾을 수 없습니다.' }, { status: 404 })
  if (pm.receiver_id !== user.id) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  if (pm.status !== 'pending') return NextResponse.json({ error: '처리할 수 없는 상태입니다.' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('profile_matches')
    .update({ status: 'rejected', updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabaseAdmin.from('notifications').insert({
    user_id: pm.requester_id,
    type: 'match_reject',
    message: '매칭 신청이 거절되었습니다.',
    related_id: id,
  })

  return NextResponse.json({ success: true, match: data })
}
