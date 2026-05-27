import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  const { id } = await params
  const { teamName, sport, matchSize, location, description, requiredLevel, matchDatetime } = await req.json()

  if (!teamName || !sport || !matchSize || !location || !description || !requiredLevel) {
    return NextResponse.json({ error: '모든 필드를 입력해주세요.' }, { status: 400 })
  }

  // 소유자 확인
  const { data: match } = await supabase
    .from('matches')
    .select('author_id')
    .eq('id', id)
    .single()

  if (!match) return NextResponse.json({ error: '매치를 찾을 수 없습니다.' }, { status: 404 })
  if (match.author_id !== user.id) return NextResponse.json({ error: '수정 권한이 없습니다.' }, { status: 403 })

  const { data, error } = await supabase
    .from('matches')
    .update({
      team_name: teamName,
      sport,
      match_size: matchSize,
      location,
      description,
      required_level: requiredLevel,
      match_datetime: matchDatetime || null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  const { id } = await params

  // 소유자 확인
  const { data: match } = await supabase
    .from('matches')
    .select('author_id')
    .eq('id', id)
    .single()

  if (!match) return NextResponse.json({ error: '매치를 찾을 수 없습니다.' }, { status: 404 })
  if (match.author_id !== user.id) return NextResponse.json({ error: '삭제 권한이 없습니다.' }, { status: 403 })

  const { error } = await supabase.from('matches').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
