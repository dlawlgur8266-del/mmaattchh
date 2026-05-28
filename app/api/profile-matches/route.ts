import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  const { data, error } = await supabase
    .from('profile_matches')
    .select(`
      *,
      requester:profiles!profile_matches_requester_id_fkey(id, nickname, avatar_url),
      receiver:profiles!profile_matches_receiver_id_fkey(id, nickname, avatar_url)
    `)
    .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  const { receiver_id, type, message } = await req.json()
  if (!receiver_id || !type) {
    return NextResponse.json({ error: '필수 값이 누락되었습니다.' }, { status: 400 })
  }
  if (receiver_id === user.id) {
    return NextResponse.json({ error: '본인에게는 신청할 수 없습니다.' }, { status: 400 })
  }

  const { data: existing } = await supabase
    .from('profile_matches')
    .select('id,status')
    .eq('requester_id', user.id)
    .eq('receiver_id', receiver_id)
    .eq('type', type)
    .maybeSingle()

  if (existing && existing.status === 'pending') {
    return NextResponse.json({ error: '이미 신청한 상대입니다.' }, { status: 409 })
  }

  const { data: requesterProfile } = await supabase
    .from('profiles')
    .select('nickname')
    .eq('id', user.id)
    .single()

  const { data, error } = await supabaseAdmin
    .from('profile_matches')
    .insert({ requester_id: user.id, receiver_id, type, message, status: 'pending' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const typeLabel = type === 'contest' ? '공모전' : '스포츠'
  await supabaseAdmin.from('notifications').insert({
    user_id: receiver_id,
    type: 'match_apply',
    message: `${requesterProfile?.nickname || '누군가'} 님이 ${typeLabel} 매칭을 신청했습니다.`,
    related_id: data.id,
  })

  return NextResponse.json({ success: true, match: data })
}
