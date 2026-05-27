import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: roomId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  // 멤버 확인
  const { data: member } = await supabase
    .from('contest_chat_members')
    .select('room_id')
    .eq('room_id', roomId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member) return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 })

  const { data, error } = await supabase
    .from('contest_chat_messages')
    .select('*, sender:profiles!contest_chat_messages_sender_id_fkey(id, nickname)')
    .eq('room_id', roomId)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: roomId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  const { content } = await req.json()
  if (!content?.trim()) return NextResponse.json({ error: '메시지를 입력해주세요.' }, { status: 400 })

  // 멤버 확인
  const { data: member } = await supabase
    .from('contest_chat_members')
    .select('room_id')
    .eq('room_id', roomId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (!member) return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 })

  const { data, error } = await supabaseAdmin
    .from('contest_chat_messages')
    .insert({ room_id: roomId, sender_id: user.id, content: content.trim() })
    .select('*, sender:profiles!contest_chat_messages_sender_id_fkey(id, nickname)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
