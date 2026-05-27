import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  try {
    // 인증 없이도 보여주기 위해 admin 클라이언트 사용 (RLS 우회)
    const { data, error } = await supabaseAdmin
      .from('external_contests')
      .select('id, title, url, category, organizer, deadline, source, description, created_at')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data || [])
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
