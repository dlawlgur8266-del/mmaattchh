import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// Vercel Cron Job: 매일 00:00 KST (15:00 UTC)에 외부 공모전 사이트에서 데이터 동기화
// vercel.json: { "crons": [{ "path": "/api/cron/sync-contests", "schedule": "0 15 * * *" }] }

interface ExternalContest {
  title: string
  url: string
  category: string | null
  organizer: string | null
  deadline: string | null
  source: string
  description: string | null
}

// ── 올콘(all-con.co.kr) 스크래핑 ─────────────────────────
async function fetchAllCon(): Promise<ExternalContest[]> {
  const results: ExternalContest[] = []
  try {
    // 올콘 공모전 목록 페이지 HTML 파싱
    const res = await fetch('https://www.all-con.co.kr/bbs/board.php?bo_table=con0', {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CBNU-Match-Bot/1.0)' },
      next: { revalidate: 0 },
    })
    if (!res.ok) return results

    const html = await res.text()

    // 공모전 목록 항목 파싱 (tr.bo_notice, tr.even, tr.odd)
    const rowRegex = /<tr[^>]*class="[^"]*(?:even|odd)[^"]*"[^>]*>([\s\S]*?)<\/tr>/gi
    const linkRegex = /<a[^>]*href="([^"]*bo_table=con0[^"]*wr_id=(\d+)[^"]*)"[^>]*>([\s\S]*?)<\/a>/i
    const titleCleanRegex = /<[^>]+>/g

    let match
    while ((match = rowRegex.exec(html)) !== null) {
      const row = match[1]
      const linkMatch = linkRegex.exec(row)
      if (!linkMatch) continue

      const relUrl = linkMatch[1]
      const rawTitle = linkMatch[3].replace(titleCleanRegex, '').trim()
      if (!rawTitle || rawTitle.length < 2) continue

      const fullUrl = relUrl.startsWith('http')
        ? relUrl
        : `https://www.all-con.co.kr${relUrl.startsWith('/') ? '' : '/'}${relUrl}`

      // 마감일 추출 시도 (yyyy-mm-dd 또는 yyyy.mm.dd 형식)
      const deadlineMatch = row.match(/(\d{4})[.\-](\d{2})[.\-](\d{2})/)
      const deadline = deadlineMatch
        ? `${deadlineMatch[1]}-${deadlineMatch[2]}-${deadlineMatch[3]}`
        : null

      results.push({
        title: rawTitle,
        url: fullUrl,
        category: null,
        organizer: null,
        deadline,
        source: 'all-con',
        description: null,
      })
    }
  } catch (e) {
    console.error('[sync-contests] all-con fetch error:', e)
  }
  return results
}

// ── 링커리어(linkareer.com) 스크래핑 ──────────────────────
async function fetchLinkareer(): Promise<ExternalContest[]> {
  const results: ExternalContest[] = []
  try {
    // 링커리어 공모전 목록 API (Next.js 내부 API 또는 HTML)
    const res = await fetch(
      'https://linkareer.com/list/contest?orderBy=CREATED_AT&page=1&pageSize=30',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CBNU-Match-Bot/1.0)',
          Accept: 'text/html,application/xhtml+xml',
        },
        next: { revalidate: 0 },
      }
    )
    if (!res.ok) return results

    const html = await res.text()

    // __NEXT_DATA__ JSON 추출 (Next.js SSR 페이지)
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/)
    if (!nextDataMatch) return results

    const nextData = JSON.parse(nextDataMatch[1])
    // 데이터 경로 탐색
    const activities =
      nextData?.props?.pageProps?.initialData?.activities ||
      nextData?.props?.pageProps?.data?.activities ||
      nextData?.props?.pageProps?.listData?.list ||
      []

    for (const item of activities) {
      if (!item?.title) continue
      const id = item.id || item.activityId || ''
      const url = id ? `https://linkareer.com/activity/${id}` : 'https://linkareer.com/list/contest'
      const deadline = item.applicationEndDate
        ? item.applicationEndDate.split('T')[0]
        : item.endDate
        ? item.endDate.split('T')[0]
        : null

      results.push({
        title: item.title,
        url,
        category: item.categories?.[0]?.name || item.category || null,
        organizer: item.organization?.name || item.organizer || null,
        deadline,
        source: 'linkareer',
        description: item.description || null,
      })
    }
  } catch (e) {
    console.error('[sync-contests] linkareer fetch error:', e)
  }
  return results
}

export async function GET(req: NextRequest) {
  // Vercel Cron 인증 확인
  const authHeader = req.headers.get('authorization')
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [allConData, linkareerData] = await Promise.all([
      fetchAllCon(),
      fetchLinkareer(),
    ])

    const allContests = [...allConData, ...linkareerData]

    if (allContests.length === 0) {
      return NextResponse.json({ success: true, synced: 0, message: '가져온 공모전 없음' })
    }

    // Upsert: URL이 같으면 업데이트, 없으면 삽입
    const { error, count } = await supabaseAdmin
      .from('external_contests')
      .upsert(allContests, { onConflict: 'url', ignoreDuplicates: false })
      .select('id', { count: 'exact', head: true })

    if (error) {
      console.error('[sync-contests] DB upsert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`[sync-contests] 동기화 완료: 올콘 ${allConData.length}개, 링커리어 ${linkareerData.length}개`)
    return NextResponse.json({
      success: true,
      synced: allContests.length,
      allCon: allConData.length,
      linkareer: linkareerData.length,
    })
  } catch (e) {
    console.error('[sync-contests] 오류:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
