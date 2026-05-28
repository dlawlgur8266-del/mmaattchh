import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const sport = searchParams.get('sport')

  let query = supabase
    .from('sports_profiles')
    .select(`
      *,
      profiles!inner(id, nickname, avatar_url)
    `)
    .eq('is_visible', true)
    .neq('user_id', user.id)

  if (sport) {
    query = query.contains('sports', [sport])
  }

  const { data, error } = await query.order('career_years', { ascending: false }).limit(50)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
