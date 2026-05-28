import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  const sport = req.nextUrl.searchParams.get('sport')
  const level = req.nextUrl.searchParams.get('level')

  // '모집중' 상태만 공개 목록에 노출 (확정된 매치는 내 정보에만 남음)
  // 매치 날짜가 지난 게시물은 즉시 제외
  const nowISO = new Date().toISOString()
  let query = supabase
    .from('matches')
    .select('*, author:profiles!matches_author_id_fkey(id,nickname,skill_level)')
    .eq('status', '모집중')
    .or(`match_datetime.is.null,match_datetime.gte.${nowISO}`)
    .order('created_at', { ascending: false })

  if (sport) query = query.eq('sport', sport)
  if (level) query = query.eq('required_level', level)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  const { teamName, sport, matchSize, location, description, requiredLevel, matchDatetime } = await req.json()

  if (!teamName || !sport || !matchSize || !location || !description || !requiredLevel) {
    return NextResponse.json({ error: '모든 필드를 입력해주세요.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('matches')
    .insert({
      author_id: user.id,
      team_name: teamName,
      sport,
      match_size: matchSize,
      location,
      description,
      required_level: requiredLevel,
      status: '모집중',
      match_datetime: matchDatetime || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
