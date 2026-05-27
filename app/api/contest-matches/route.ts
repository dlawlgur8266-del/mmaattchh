import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  const { data, error } = await supabase
    .from('contest_matches')
    .select('*, author:profiles!contest_matches_author_id_fkey(id,nickname,skill_level,contest_count)')
    .eq('status', '모집중')
    .order('deadline', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  const { contestName, contestCategory, region, deadline, teamSize, description } = await req.json()

  if (!contestName?.trim()) return NextResponse.json({ error: '공모전 이름을 입력해주세요.' }, { status: 400 })
  if (!contestCategory || contestCategory === '전체') return NextResponse.json({ error: '공모전 분야를 선택해주세요.' }, { status: 400 })
  if (!region) return NextResponse.json({ error: '지역을 선택해주세요.' }, { status: 400 })
  if (!deadline) return NextResponse.json({ error: '마감일을 선택해주세요.' }, { status: 400 })
  if (!teamSize || teamSize < 1 || teamSize > 5) return NextResponse.json({ error: '팀원 수는 1~5명이어야 합니다.' }, { status: 400 })
  if (!description?.trim() || description.trim().length < 10) return NextResponse.json({ error: '소개글을 10자 이상 입력해주세요.' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('contest_matches')
    .insert({
      author_id: user.id,
      contest_name: contestName.trim(),
      contest_category: contestCategory,
      region,
      deadline,
      team_size: teamSize,
      description: description.trim(),
      current_count: 0,
      status: '모집중',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 작성자를 포함한 그룹 채팅방 생성
  const { data: room } = await supabaseAdmin
    .from('contest_chat_rooms')
    .insert({
      contest_match_id: data.id,
      name: contestName.trim(),
    })
    .select()
    .single()

  if (room) {
    await supabaseAdmin
      .from('contest_chat_members')
      .insert({ room_id: room.id, user_id: user.id })
  }

  return NextResponse.json({ success: true, id: data.id })
}
