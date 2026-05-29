import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const FACILITY_NAMES: Record<string, string> = {
  main_field:   '대운동장',
  futsal_a:     '풋살장A',
  futsal_b:     '풋살장B',
  basketball_a: '농구장A',
  basketball_b: '농구장B',
  tennis_a:     '테니스장A',
  tennis_b:     '테니스장B',
  tennis_c:     '테니스장C',
  tennis_d:     '테니스장D',
  tennis_e:     '테니스장E',
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()

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
