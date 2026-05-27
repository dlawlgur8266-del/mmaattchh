import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { buildEmail } from '@/lib/utils'

export async function POST(req: NextRequest) {
  try {
    const { username, password, fullName, nickname, studentId, department, skillLevel, contestCount } = await req.json()

    // Validate
    if (!username || !password || !fullName || !nickname || !studentId) {
      return NextResponse.json({ error: '모든 필드를 입력해주세요.' }, { status: 400 })
    }

    const email = buildEmail(username)

    // 학번 중복 확인 (동일 학번으로 가입 시도 차단)
    const { data: existingStudentId } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('student_id', studentId)
      .maybeSingle()
    if (existingStudentId) {
      return NextResponse.json({ error: '이미 가입한 학번입니다.' }, { status: 409 })
    }

    // Create auth user (auto-confirm email)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        return NextResponse.json({ error: '이미 사용 중인 아이디입니다.' }, { status: 409 })
      }
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // Create profile (contest_count/department 컬럼 캐시 누락 시 회원가입 자체가 실패하지 않도록 분리)
    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      id: authData.user.id,
      username,
      nickname,
      full_name: fullName,
      student_id: studentId,
      skill_level: skillLevel || '초급',
    })

    if (!profileError) {
      // contest_count, department는 별도 UPDATE — 컬럼 캐시 누락 시 회원가입 자체가 실패하지 않도록 분리
      const extra: Record<string, unknown> = {}
      if (typeof contestCount === 'number' && contestCount >= 0) {
        extra.contest_count = Math.min(Math.max(contestCount, 0), 10)
      }
      if (department && typeof department === 'string') {
        extra.department = department
      }
      if (Object.keys(extra).length > 0) {
        await supabaseAdmin
          .from('profiles')
          .update(extra)
          .eq('id', authData.user.id)
      }
    }

    if (profileError) {
      // Rollback auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      if (profileError.message.includes('profiles_nickname_key')) {
        return NextResponse.json({ error: '이미 사용 중인 닉네임입니다.' }, { status: 409 })
      }
      if (profileError.message.includes('profiles_username_key')) {
        return NextResponse.json({ error: '이미 사용 중인 아이디입니다.' }, { status: 409 })
      }
      return NextResponse.json({ error: profileError.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Signup error:', e)
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 })
  }
}
