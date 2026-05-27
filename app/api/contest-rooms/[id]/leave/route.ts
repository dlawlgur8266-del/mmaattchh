import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: roomId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  // 멤버인지 확인
  const { data: member } = await supabase
    .from('contest_chat_members')
    .select('id')
    .eq('room_id', roomId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member) {
    return NextResponse.json({ error: '채팅방 멤버가 아닙니다.' }, { status: 403 })
  }

  // 그룹 채팅 멤버에서 제거 (채팅방과 메시지는 유지)
  const { error } = await supabaseAdmin
    .from('contest_chat_members')
    .delete()
    .eq('room_id', roomId)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
