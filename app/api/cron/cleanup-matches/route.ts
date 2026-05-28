import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

// Vercel Cron Job: 매일 00:00 KST (15:00 UTC)에 매치 날짜가 지난 게시물 자동 삭제
// vercel.json: { "crons": [{ "path": "/api/cron/cleanup-matches", "schedule": "0 15 * * *" }] }

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const nowISO = new Date().toISOString()

    const { count, error } = await supabaseAdmin
      .from('matches')
      .delete({ count: 'exact' })
      .lt('match_datetime', nowISO)
      .not('match_datetime', 'is', null)

    if (error) {
      console.error('[cleanup-matches] DB delete error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log(`[cleanup-matches] 만료된 매치 ${count ?? 0}개 삭제 완료`)
    return NextResponse.json({ success: true, deleted: count ?? 0 })
  } catch (e) {
    console.error('[cleanup-matches] 오류:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
