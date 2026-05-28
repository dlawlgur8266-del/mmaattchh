import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  const { contest_id, title, description } = await req.json()
  if (!title) return NextResponse.json({ error: '공모전 제목이 필요합니다.' }, { status: 400 })

  // DB 캐시 확인
  if (contest_id) {
    const { data: cached } = await supabase
      .from('contests')
      .select('summary')
      .eq('id', contest_id)
      .maybeSingle()
    if (cached?.summary) return NextResponse.json({ summary: cached.summary, cached: true })
  }

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `다음 공모전 정보를 2~3문장으로 간결하게 요약해주세요. 핵심 내용(주제, 대상, 특징)만 포함하세요.\n\n제목: ${title}\n${description ? `내용: ${description}` : ''}`,
      }],
    })

    const summary = message.content[0].type === 'text' ? message.content[0].text : ''

    // DB에 캐시 저장
    if (contest_id && summary) {
      await supabaseAdmin
        .from('contests')
        .update({ summary })
        .eq('id', contest_id)
    }

    return NextResponse.json({ summary, cached: false })
  } catch (e) {
    console.error('[ai/summarize]', e)
    return NextResponse.json({ error: 'AI 요약에 실패했습니다.' }, { status: 500 })
  }
}
