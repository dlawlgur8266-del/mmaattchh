import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  const { data: pm } = await supabase
    .from('profile_matches')
    .select('requester_id,status')
    .eq('id', id)
    .single()

  if (!pm) return NextResponse.json({ error: '신청을 찾을 수 없습니다.' }, { status: 404 })
  if (pm.requester_id !== user.id) return NextResponse.json({ error: '권한이 없습니다.' }, { status: 403 })
  if (pm.status !== 'pending') return NextResponse.json({ error: '대기중인 신청만 취소할 수 있습니다.' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('profile_matches')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
