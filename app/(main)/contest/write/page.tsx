'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Trophy, Users, Calendar, MapPin, PenSquare } from 'lucide-react'
import { CONTEST_CATEGORIES, type ContestCategory } from '@/data/contests'
import toast from 'react-hot-toast'
import { Suspense } from 'react'

const REGIONS = ['충청북도', '충청남도', '세종특별자치시', '대전광역시']
const TEAM_SIZES = [1, 2, 3, 4, 5]

function ContestWriteInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [form, setForm] = useState({
    contestName: searchParams.get('name') || '',
    contestCategory: (searchParams.get('category') as ContestCategory) || '전체',
    region: searchParams.get('region') || '',
    deadline: searchParams.get('deadline') || '',
    teamSize: 3,
    description: '',
  })
  const [loading, setLoading] = useState(false)

  const today = new Date().toISOString().split('T')[0]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.contestName.trim()) return toast.error('공모전 이름을 입력해주세요.')
    if (!form.region) return toast.error('지역을 선택해주세요.')
    if (!form.deadline) return toast.error('마감일을 선택해주세요.')
    if (!form.contestCategory || form.contestCategory === '전체')
      return toast.error('공모전 분야를 선택해주세요.')
    if (form.description.trim().length < 10)
      return toast.error('소개글을 10자 이상 입력해주세요.')

    setLoading(true)
    try {
      const res = await fetch('/api/contest-matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contestName: form.contestName,
          contestCategory: form.contestCategory,
          region: form.region,
          deadline: form.deadline,
          teamSize: form.teamSize,
          description: form.description,
        }),
      })
      const data = await res.json()
      if (!res.ok) return toast.error(data.error || '등록에 실패했습니다.')
      toast.success('팀원 모집 게시글이 등록되었습니다!')
      router.push('/contest/matches')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Trophy className="text-yellow-500" size={22} />
          <h1 className="text-2xl font-bold text-slate-800">공모전 팀원 모집</h1>
        </div>
        <p className="text-slate-500 text-sm mt-0.5">함께할 팀원을 모집하는 글을 작성하세요</p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        {/* 공모전 이름 */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">공모전 이름</label>
          <input
            type="text"
            className="input-field"
            placeholder="참가할 공모전 이름을 입력하세요"
            value={form.contestName}
            onChange={(e) => setForm({ ...form, contestName: e.target.value })}
            maxLength={100}
          />
        </div>

        {/* 공모전 분야 */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">공모전 분야</label>
          <div className="grid grid-cols-2 gap-2">
            {CONTEST_CATEGORIES.filter((c) => c !== '전체').map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setForm({ ...form, contestCategory: cat })}
                className={`py-2.5 rounded-xl text-sm font-medium transition-all border-2 ${
                  form.contestCategory === cat
                    ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* 지역 */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            <span className="flex items-center gap-1.5">
              <MapPin size={15} className="text-slate-500" />
              지역
            </span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {REGIONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setForm({ ...form, region: r })}
                className={`py-3 rounded-xl text-sm font-semibold transition-all border-2 ${
                  form.region === r
                    ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {/* 마감일 */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            <span className="flex items-center gap-1.5">
              <Calendar size={15} className="text-slate-500" />
              공모전 마감일
            </span>
          </label>
          <input
            type="date"
            className="input-field"
            value={form.deadline}
            min={today}
            onChange={(e) => setForm({ ...form, deadline: e.target.value })}
          />
        </div>

        {/* 팀원 모집 인원 */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            <span className="flex items-center gap-1.5">
              <Users size={15} className="text-slate-500" />
              모집 팀원 수 (본인 제외)
            </span>
          </label>
          <div className="flex gap-2">
            {TEAM_SIZES.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setForm({ ...form, teamSize: n })}
                className={`flex-1 py-2.5 rounded-xl border-2 font-bold text-sm transition-all ${
                  form.teamSize === n
                    ? 'border-yellow-500 bg-yellow-500 text-white'
                    : 'border-slate-200 text-slate-600 hover:border-yellow-300'
                }`}
              >
                {n}명
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-1.5">
            총 {form.teamSize + 1}명 팀 (본인 포함)
          </p>
        </div>

        {/* 소개글 */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            소개글
            <span className="ml-2 text-xs font-normal text-slate-400">{form.description.length}/500</span>
          </label>
          <textarea
            className="input-field resize-none"
            rows={4}
            placeholder="공모전 소개, 원하는 팀원 조건 등을 적어주세요 (최소 10자)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            maxLength={500}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-yellow-500 text-white rounded-xl font-semibold hover:bg-yellow-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <><PenSquare size={18} /> 팀원 모집 등록하기</>
          )}
        </button>
      </form>
    </div>
  )
}

export default function ContestWritePage() {
  return (
    <Suspense fallback={<div className="text-center py-12 text-slate-400">불러오는 중...</div>}>
      <ContestWriteInner />
    </Suspense>
  )
}
