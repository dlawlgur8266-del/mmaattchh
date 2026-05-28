import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  const { my_profile, target_profile, type } = await req.json()
  if (!my_profile || !target_profile) {
    return NextResponse.json({ error: '프로필 정보가 필요합니다.' }, { status: 400 })
  }

  const typeLabel = type === 'contest' ? '공모전' : '스포츠'

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 100,
      messages: [{
        role: 'user',
        content: `두 사람의 ${typeLabel} 프로필을 보고, 왜 잘 맞는지 한 문장으로 설명해주세요. 긍정적이고 간결하게 작성하세요.\n\n내 프로필: ${JSON.stringify(my_profile)}\n상대 프로필: ${JSON.stringify(target_profile)}`,
      }],
    })

    const reason = message.content[0].type === 'text' ? message.content[0].text : ''
    return NextResponse.json({ reason })
  } catch (e) {
    console.error('[ai/match-reason]', e)
    return NextResponse.json({ error: 'AI 추천 생성에 실패했습니다.' }, { status: 500 })
  }
}
