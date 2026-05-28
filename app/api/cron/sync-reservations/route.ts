import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// Vercel Cron Job: 매 1시간마다 충북대 체육시설 예약 현황 동기화
// vercel.json: { "path": "/api/cron/sync-reservations", "schedule": "0 * * * *" }

const BASE_URL = 'https://sports.chungbuk.ac.kr'
const STATUS_URL = `${BASE_URL}/cbnu_facilities3_2`

// DB facility ID → 사이트 시설 파라미터 (실제 사이트 파라미터로 교체 필요)
const FACILITY_PARAMS: Record<string, string> = {
  main_field:    'MAIN_FIELD',
  futsal_a:      'FUTSAL_A',
  futsal_b:      'FUTSAL_B',
  basketball_a:  'BASKET_A',
  basketball_b:  'BASKET_B',
  tennis_a:      'TENNIS_A',
  tennis_b:      'TENNIS_B',
  tennis_c:      'TENNIS_C',
  tennis_d:      'TENNIS_D',
  tennis_e:      'TENNIS_E',
}

// 운영 기본 시간대 (스크래핑 실패 시 fallback)
const DEFAULT_HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]
const RESERVED_KEYWORDS = ['예약완료', '예약중', '사용중', '마감', '예약 완료', '예약 중']
const CLOSED_KEYWORDS   = ['운영종료', '휴무', '점검', '사용불가', '운영 종료', '사용 불가']

function pad2(n: number) { return String(n).padStart(2, '0') }
function toTime(h: number) { return `${pad2(h)}:00:00` }

function makeDefaultSlots(facilityId: string, date: string) {
  const now = new Date().toISOString()
  return DEFAULT_HOURS.map(h => ({
    facility: facilityId,
    reservation_date: date,
    start_time: toTime(h),
    end_time: toTime(h + 1),
    status: 'available',
    last_crawled_at: now,
  }))
}

function parseSlots(html: string, facilityId: string, date: string) {
  const now = new Date().toISOString()
  const slots: ReturnType<typeof makeDefaultSlots> = []

  // <tr> 기반으로 시간대·상태 추출
  const rowRe = /<tr[\s\S]*?>([\s\S]*?)<\/tr>/gi
  const timeRe = /(\d{1,2}):00/g

  let rowMatch: RegExpExecArray | null
  while ((rowMatch = rowRe.exec(html)) !== null) {
    const row = rowMatch[1]
    const times: number[] = []
    let t: RegExpExecArray | null
    timeRe.lastIndex = 0
    while ((t = timeRe.exec(row)) !== null) {
      times.push(parseInt(t[1]))
    }
    if (times.length < 2) continue

    const startH = times[0]
    const endH   = times[1]
    if (startH < 6 || startH > 22 || endH <= startH) continue

    let status: 'available' | 'reserved' | 'closed' = 'available'
    if (RESERVED_KEYWORDS.some(k => row.includes(k))) status = 'reserved'
    else if (CLOSED_KEYWORDS.some(k => row.includes(k))) status = 'closed'

    slots.push({
      facility: facilityId,
      reservation_date: date,
      start_time: toTime(startH),
      end_time: toTime(endH),
      status,
      last_crawled_at: now,
    })
  }

  return slots
}

async function fetchSlots(facilityId: string, facilityParam: string, date: string) {
  const dateCompact = date.replace(/-/g, '')
  const tryUrls = [
    `${STATUS_URL}?facilityId=${facilityParam}&searchDate=${dateCompact}`,
    `${STATUS_URL}?facility=${facilityParam}&date=${date}`,
    `${BASE_URL}/reservation/schedule.do?facilityId=${facilityParam}&searchDate=${dateCompact}`,
  ]

  for (const url of tryUrls) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'ko-KR,ko;q=0.9',
          'Referer': BASE_URL,
        },
        signal: AbortSignal.timeout(10_000),
      })
      if (!res.ok) continue

      const html = await res.text()
      const slots = parseSlots(html, facilityId, date)
      if (slots.length > 0) return slots
    } catch {
      // 다음 URL 시도
    }
  }

  // 모든 URL 실패 → fallback (전 시간대 예약 가능으로 표시)
  return makeDefaultSlots(facilityId, date)
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const today = new Date()
  const dates: string[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    dates.push(d.toISOString().split('T')[0])
  }

  let totalUpserted = 0
  const errors: string[] = []

  for (const [facilityId, facilityParam] of Object.entries(FACILITY_PARAMS)) {
    for (const date of dates) {
      try {
        const slots = await fetchSlots(facilityId, facilityParam, date)

        const { error } = await supabaseAdmin
          .from('sports_reservations')
          .upsert(slots, { onConflict: 'facility,reservation_date,start_time' })

        if (error) {
          errors.push(`${facilityId}/${date}: ${error.message}`)
        } else {
          totalUpserted += slots.length
        }
      } catch (e) {
        errors.push(`${facilityId}/${date}: ${String(e)}`)
      }
    }
  }

  console.log(`[sync-reservations] ${totalUpserted}개 슬롯 동기화 완료`)
  if (errors.length) console.error('[sync-reservations] 오류:', errors)

  return NextResponse.json({
    success: true,
    totalUpserted,
    errors: errors.length ? errors : undefined,
  })
}
