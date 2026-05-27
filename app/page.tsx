import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CbnuMarkWhite, CbnuMark } from '@/components/ui/CbnuLogo'

export const dynamic = 'force-dynamic'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/match')

  const sports = [
    { emoji: '⚽', name: '축구', desc: '팀을 구성하여 축구 매치를 즐겨보세요' },
    { emoji: '🥅', name: '풋살', desc: '실내에서 즐기는 박진감 넘치는 풋살' },
    { emoji: '🏀', name: '농구', desc: '농구 코트에서 실력을 겨루세요' },
    { emoji: '🎮', name: 'e스포츠', desc: '온라인 게임 매치를 찾아보세요' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary-700 flex flex-col">

      {/* ── Header ── */}
      <header className="px-6 py-4 flex justify-between items-center max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2.5">
          <CbnuMarkWhite size={38} />
          <span className="text-white font-bold text-xl tracking-tight">
            충북대<span className="text-accent">Match</span>
          </span>
        </div>
        <div className="flex gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-white border border-white/30 rounded-xl hover:bg-white/10 transition-colors text-sm font-medium"
          >
            로그인
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 bg-accent text-white rounded-xl hover:bg-accent-600 transition-colors text-sm font-medium"
          >
            회원가입
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center max-w-4xl mx-auto w-full">

        {/* 대학 마크 + 배지 */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="relative">
            <CbnuMarkWhite size={88} />
            {/* 반짝이는 효과 */}
            <div className="absolute -inset-2 rounded-full bg-white/5 animate-pulse" />
          </div>
          <div className="inline-block bg-accent/20 text-accent-200 text-sm font-medium px-5 py-1.5 rounded-full border border-accent/30">
            🏫 충북대학교(CBNU) 전용 스포츠 매칭 플랫폼
          </div>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
          충북대생만을 위한<br />
          <span className="text-accent">스포츠 팀 매칭</span>
        </h1>
        <p className="text-slate-300 text-lg mb-10 max-w-xl">
          충북대 학번으로 가입하고, 원하는 종목과 수준에 맞는 팀을 찾아 매치를 신청하세요.
          실시간으로 수락 여부를 확인하고 바로 경기를 잡아보세요!
        </p>

        <div className="flex gap-4 flex-wrap justify-center">
          <Link
            href="/signup"
            className="px-8 py-4 bg-accent text-white rounded-2xl font-bold text-lg hover:bg-accent-600 transition-all shadow-lg shadow-accent/30"
          >
            지금 시작하기 →
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 bg-white/10 text-white rounded-2xl font-bold text-lg hover:bg-white/20 transition-all border border-white/20"
          >
            로그인
          </Link>
        </div>
      </main>

      {/* ── 기능 소개 ── */}
      <section className="pb-6 px-6 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { icon: '🔍', title: '팀 탐색', desc: '종목·수준별 매치글 필터링' },
            { icon: '⚡', title: '실시간 신청', desc: '즉시 수락/거절 알림' },
            { icon: '💬', title: '팀 채팅', desc: '매치 확정 후 대화방 자동 개설' },
          ].map((f) => (
            <div key={f.title} className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-4 text-center">
              <div className="text-3xl mb-2">{f.icon}</div>
              <div className="text-white font-bold text-sm mb-1">{f.title}</div>
              <div className="text-slate-300 text-xs">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 종목 그리드 ── */}
      <section className="pb-16 px-6 max-w-5xl mx-auto w-full">
        <p className="text-center text-slate-300 text-sm mb-4 font-medium">지원 종목</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {sports.map((sport) => (
            <div
              key={sport.name}
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-5 text-center hover:bg-white/20 transition-colors"
            >
              <div className="text-4xl mb-3">{sport.emoji}</div>
              <div className="text-white font-bold text-lg mb-1">{sport.name}</div>
              <div className="text-slate-300 text-sm">{sport.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-6 border-t border-white/10">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CbnuMarkWhite size={24} />
            <span className="text-slate-300 text-sm font-medium">충북대 Match</span>
          </div>
          <p className="text-slate-400 text-xs text-center">
            충북대학교(Chungbuk National University) 학생 스포츠 매칭 플랫폼
          </p>
        </div>
      </footer>
    </div>
  )
}
