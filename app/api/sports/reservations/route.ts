import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const BASE = 'https://sports.chungbuk.ac.kr'

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

// 사이트 실제 시설 코드 (cbnu_facilities3_2 페이지 기준)
const FACILITY_CODES: Record<string, string> = {
  main_field:   'F01',
  futsal_a:     'F02',
  futsal_b:     'F03',
  basketball_a: 'F04',
  basketball_b: 'F05',
  tennis_a:     'F06',
  tennis_b:     'F07',
  tennis_c:     'F08',
  tennis_d:     'F09',
  tennis_e:     'F10',
}

const RESERVED_KW = ['예약완료', '예약중', '사용중', '마감', '예약 완료', '예약 중', '불가']
const CLOSED_KW   = ['운영종료', '휴무', '점검', '사용불가', '운영 종료', '사용 불가', '폐장']

interface SlotRaw {
  id: string
  start_time: string
  end_time: string
  status: 'available' | 'reserved' | 'closed'
}

// ── HTML 파서 ──────────────────────────────────────────────────────────────
function parseHTML(html: string, date: string): SlotRaw[] {
  const slots: SlotRaw[] = []
  // <tr> 내부에서 HH:MM 패턴 + 상태 텍스트 추출
  const rowRe = /<tr[\s\S]*?>([\s\S]*?)<\/tr>/gi
  const timeRe = /(\d{1,2})[:\s시](\d{2})?/g

  let rowM: RegExpExecArray | null
  while ((rowM = rowRe.exec(html)) !== null) {
    const row = rowM[1]
    const hours: number[] = []
    let tm: RegExpExecArray | null
    timeRe.lastIndex = 0
    while ((tm = timeRe.exec(row)) !== null) {
      const h = parseInt(tm[1])
      if (h >= 6 && h <= 22) hours.push(h)
    }
    if (hours.length < 1) continue

    const startH = hours[0]
    const endH = hours.length >= 2 ? hours[1] : startH + 1
    if (endH <= startH || endH > 23) continue

    const stripped = row.replace(/<[^>]*>/g, ' ')
    let status: 'available' | 'reserved' | 'closed' = 'available'
    if (RESERVED_KW.some(k => stripped.includes(k))) status = 'reserved'
    else if (CLOSED_KW.some(k => stripped.includes(k))) status = 'closed'

    const pad = (n: number) => String(n).padStart(2, '0')
    slots.push({
      id: `live-${date}-${startH}`,
      start_time: `${pad(startH)}:00:00`,
      end_time:   `${pad(endH)}:00:00`,
      status,
    })
  }
  return slots
}

// ── 실시간 스크래핑 ───────────────────────────────────────────────────────
async function scrapeSlots(facilityId: string, date: string): Promise<SlotRaw[]> {
  const code = FACILITY_CODES[facilityId] ?? facilityId
  const dateCompact = date.replace(/-/g, '')
  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept-Language': 'ko-KR,ko;q=0.9',
    Referer: BASE,
  }

  const urls = [
    `${BASE}/cbnu_facilities3_2?facilityId=${code}&searchDate=${dateCompact}`,
    `${BASE}/cbnu_facilities3_2?fcltyId=${code}&date=${date}`,
    `${BASE}/reservation/schedule.do?facilityId=${code}&searchDate=${dateCompact}`,
    `${BASE}/cbnu_facilities3_2`,
  ]

  for (const url of urls) {
    try {
      const res = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(7_000),
      })
      if (!res.ok) continue
      const html = await res.text()
      if (html.length < 500) continue
      const slots = parseHTML(html, date)
      if (slots.length > 0) return slots
    } catch {
      // 다음 URL 시도
    }
  }
  return []
}

// ── 5분 인메모리 캐시 ─────────────────────────────────────────────────────
const cache = new Map<string, { slots: SlotRaw[]; ts: number }>()

async function getSlotsCached(facilityId: string, date: string): Promise<SlotRaw[]> {
  const key = `${facilityId}::${date}`
  const hit = cache.get(key)
  if (hit && Date.now() - hit.ts < 5 * 60 * 1000) return hit.slots
  const slots = await scrapeSlots(facilityId, date)
  if (slots.length > 0) cache.set(key, { slots, ts: Date.now() })
  return slots
}

// ── GET 핸들러 ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const facility = searchParams.get('facility') ?? ''
  const date = searchParams.get('date') ?? new Date().toISOString().split('T')[0]

  if (!FACILITY_NAMES[facility]) {
    return NextResponse.json({ error: '유효하지 않은 시설입니다.' }, { status: 400 })
  }

  // 1순위: 실시간 스크래핑
  const liveSlots = await getSlotsCached(facility, date)
  if (liveSlots.length > 0) {
    return NextResponse.json({
      facility,
      facility_name: FACILITY_NAMES[facility],
      date,
      slots: liveSlots,
      source: 'live',
      last_crawled_at: new Date().toISOString(),
    })
  }

  // 2순위: DB 캐시
  try {
    const supabase = await createClient()
    const { data } = await supabase
      .from('sports_reservations')
      .select('*')
      .eq('facility', facility)
      .eq('reservation_date', date)
      .order('start_time', { ascending: true })

    if (data && data.length > 0) {
      return NextResponse.json({
        facility,
        facility_name: FACILITY_NAMES[facility],
        date,
        slots: data,
        source: 'db',
        last_crawled_at: data[0]?.last_crawled_at ?? null,
      })
    }
  } catch {
    // DB 오류 무시
  }

  // 데이터 없음 — 가짜 슬롯 반환 안 함
  return NextResponse.json({
    facility,
    facility_name: FACILITY_NAMES[facility],
    date,
    slots: [],
    source: 'empty',
    last_crawled_at: null,
  })
}
