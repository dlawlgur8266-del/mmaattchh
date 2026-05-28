import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 })

  const { type, info } = await req.json()
  if (!type || !info) return NextResponse.json({ error: '프로필 정보가 필요합니다.' }, { status: 400 })

  const typeLabel = type === 'contest' ? '공모전 팀원 모집' : '스포츠 파트너 찾기'

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `${typeLabel}용 자기소개를 300자 이내로 작성해주세요. 자연스럽고 친근한 톤으로, 주어진 정보를 바탕으로 매력적인 소개글을 만들어주세요.\n\n정보: ${JSON.stringify(info)}`,
      }],
    })

    const draft = message.content[0].type === 'text' ? message.content[0].text : ''
    return NextResponse.json({ draft })
  } catch (e) {
    console.error('[ai/profile-draft]', e)
    return NextResponse.json({ error: 'AI 초안 생성에 실패했습니다.' }, { status: 500 })
  }
}
