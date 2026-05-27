import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  const { data: room } = await supabase
    .from('message_rooms')
    .select('participant_1,participant_2')
    .eq('id', roomId)
    .single()

  if (!room || (room.participant_1 !== user.id && room.participant_2 !== user.id)) {
    return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 })
  }

  const { data, error } = await supabase
    .from('messages')
    .select('*, sender:profiles!messages_sender_id_fkey(id,nickname)')
    .eq('room_id', roomId)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  const { data: room } = await supabase
    .from('message_rooms')
    .select('participant_1,participant_2')
    .eq('id', roomId)
    .single()

  if (!room || (room.participant_1 !== user.id && room.participant_2 !== user.id)) {
    return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 })
  }

  // 채팅방 삭제 (messages는 CASCADE 삭제)
  const { error } = await supabaseAdmin.from('message_rooms').delete().eq('id', roomId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> }
) {
  const { roomId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  const { content } = await req.json()
  if (!content?.trim()) return NextResponse.json({ error: '메시지를 입력해주세요.' }, { status: 400 })

  const { data: room } = await supabase
    .from('message_rooms')
    .select('participant_1,participant_2')
    .eq('id', roomId)
    .single()

  if (!room || (room.participant_1 !== user.id && room.participant_2 !== user.id)) {
    return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 })
  }

  const { data: msg, error } = await supabaseAdmin
    .from('messages')
    .insert({ room_id: roomId, sender_id: user.id, content: content.trim() })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify recipient
  const recipientId = room.participant_1 === user.id ? room.participant_2 : room.participant_1
  const { data: sender } = await supabase.from('profiles').select('nickname').eq('id', user.id).single()
  const preview = content.length > 30 ? content.substring(0, 30) + '...' : content

  await supabaseAdmin.from('notifications').insert({
    user_id: recipientId,
    type: 'new_message',
    message: `${sender?.nickname || '상대방'}: ${preview}`,
    related_id: roomId,
  })

  return NextResponse.json(msg, { status: 201 })
}
