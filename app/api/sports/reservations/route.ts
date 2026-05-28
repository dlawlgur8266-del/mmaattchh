import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const FACILITY_NAMES: Record<string, string> = {
  futsal_a: '풋살장 A',
  futsal_b: '풋살장 B',
  basketball_a: '농구장 A',
  basketball_b: '농구장 B',
  tennis_a: '테니스장 A',
  tennis_b: '테니스장 B',
  tennis_c: '테니스장 C',
  tennis_d: '테니스장 D',
  tennis_e: '테니스장 E',
  small_field: '소운동장',
  main_field: '종합운동장',
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const facility = searchParams.get('facility')
  const date = searchParams.get('date') // YYYY-MM-DD

  if (!facility || !FACILITY_NAMES[facility]) {
    return NextResponse.json({ error: '유효하지 않은 시설입니다.' }, { status: 400 })
  }

  const targetDate = date ?? new Date().toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('sports_reservations')
    .select('*')
    .eq('facility', facility)
    .eq('reservation_date', targetDate)
    .order('start_time', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({
    facility,
    facility_name: FACILITY_NAMES[facility],
    date: targetDate,
    slots: data ?? [],
    last_crawled_at: data?.[0]?.last_crawled_at ?? null,
  })
}
