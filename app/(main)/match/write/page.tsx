'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PenSquare, MapPin, Calendar, Clock, Trophy, Swords } from 'lucide-react'
import { SPORT_META, SPORT_ALLOWED_SIZES } from '@/types/database'
import type { Sport, SkillLevel, MatchSize } from '@/types/database'
import toast from 'react-hot-toast'

const sports: Sport[] = ['축구', '풋살', '농구', 'e스포츠']
const allSizes: MatchSize[] = ['1vs1', '3vs3', '5vs5', '11vs11']
const levels: SkillLevel[] = ['초급', '중급', '고수']

type WriteMode = '스포츠' | '공모전'

export default function WriteMatchPage() {
  const router = useRouter()
  const [mode, setMode] = useState<WriteMode>('스포츠')
  const [form, setForm] = useState({
    teamName: '',
    sport: '' as Sport | '',
    matchSize: '' as MatchSize | '',
    location: '',
    description: '',
    requiredLevel: '중급' as SkillLevel,
    matchDate: '',
    matchTime: '',
  })
  const [loading, setLoading] = useState(false)

  const allowedSizes = form.sport ? SPORT_ALLOWED_SIZES[form.sport as Sport] : allSizes
  const today = new Date().toISOString().split('T')[0]

  const handleSportChange = (s: Sport) => {
    const sizes = SPORT_ALLOWED_SIZES[s]
    setForm((prev) => ({
      ...prev,
      sport: s,
      matchSize: sizes.includes(prev.matchSize as MatchSize) ? prev.matchSize : '',
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.teamName.trim()) return toast.error('팀명을 입력해주세요.')
    if (!form.sport) return toast.error('종목을 선택해주세요.')
    if (!form.matchSize) return toast.error('매치 인원을 선택해주세요.')
    if (!form.location.trim()) return toast.error('장소를 입력해주세요.')
    if (form.description.trim().length < 10) return toast.error('소개글을 10자 이상 입력해주세요.')
    if (!form.matchDate) return toast.error('경기 날짜를 선택해주세요.')
    if (!form.matchTime) return toast.error('경기 시간을 선택해주세요.')

    const matchDatetime = new Date(`${form.matchDate}T${form.matchTime}:00`).toISOString()

    setLoading(true)
    try {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamName: form.teamName,
          sport: form.sport,
          matchSize: form.matchSize,
          location: form.location,
          description: form.description,
          requiredLevel: form.requiredLevel,
          matchDatetime,
        }),
      })
      const data = await res.json()
      if (!res.ok) return toast.error(data.error || '작성에 실패했습니다.')
      toast.success('매치글이 등록되었습니다!')
      router.push('/match')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">매치글 작성</h1>
        <p className="text-slate-500 text-sm mt-0.5">스포츠 매치 또는 공모전 팀원을 모집하세요</p>
      </div>

      {/* 모드 선택 */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          type="button"
          onClick={() => setMode('스포츠')}
          className={`flex items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all font-semibold ${
            mode === '스포츠'
              ? 'border-primary bg-primary/5 text-primary shadow-sm'
              : 'border-slate-200 text-slate-500 hover:border-slate-300'
          }`}
        >
          <Swords size={20} />
          스포츠 매치
        </button>
        <button
          type="button"
          onClick={() => router.push('/contest/write')}
          className="flex items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all font-semibold border-slate-200 text-slate-500 hover:border-yellow-400 hover:text-yellow-600"
        >
          <Trophy size={20} />
          공모전 팀원
        </button>
      </div>

      {mode === '공모전' && null}

      {/* 스포츠 매치 폼 */}
      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Swords size={18} className="text-primary" />
          <span className="font-semibold text-slate-700">스포츠 매치 작성</span>
        </div>

        {/* 팀명 */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">팀명</label>
          <input
            type="text"
            className="input-field"
            placeholder="우리 팀 이름을 입력하세요 (2~20자)"
            value={form.teamName}
            onChange={(e) => setForm({ ...form, teamName: e.target.value })}
            maxLength={20}
          />
        </div>

        {/* 종목 선택 */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">종목</label>
          <div className="grid grid-cols-2 gap-3">
            {sports.map((s) => {
              const meta = SPORT_META[s]
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleSportChange(s)}
                  className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                    form.sport === s
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="text-2xl">{meta.emoji}</span>
                  <span className="font-semibold text-slate-700">{s}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* 매치 인원 */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">매치 인원</label>
          <div className="flex gap-2 flex-wrap">
            {allSizes.map((size) => {
              const disabled = !allowedSizes.includes(size)
              return (
                <button
                  key={size}
                  type="button"
                  disabled={disabled}
                  onClick={() => !disabled && setForm({ ...form, matchSize: size })}
                  className={`px-4 py-2.5 rounded-xl border-2 font-semibold text-sm transition-all ${
                    form.matchSize === size
                      ? 'border-primary bg-primary text-white'
                      : disabled
                      ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                      : 'border-slate-200 text-slate-600 hover:border-primary/50'
                  }`}
                >
                  {size}
                </button>
              )
            })}
          </div>
          {form.sport && (
            <p className="text-xs text-slate-400 mt-1.5">
              {form.sport}: {SPORT_ALLOWED_SIZES[form.sport as Sport].join(', ')} 가능
            </p>
          )}
        </div>

        {/* 장소 */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            <span className="flex items-center gap-1.5">
              <MapPin size={15} className="text-slate-500" />
              경기 장소
            </span>
          </label>
          <input
            type="text"
            className="input-field"
            placeholder="경기 장소를 입력하세요 (예: 충북대학교 운동장)"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            maxLength={50}
          />
        </div>

        {/* 경기 날짜 & 시간 */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            <span className="flex items-center gap-1.5">
              <Calendar size={15} className="text-slate-500" />
              경기 날짜 &amp; 시간
            </span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-slate-400 mb-1.5 flex items-center gap-1">
                <Calendar size={11} /> 날짜
              </p>
              <input
                type="date"
                className="input-field"
                value={form.matchDate}
                min={today}
                onChange={(e) => setForm({ ...form, matchDate: e.target.value })}
              />
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1.5 flex items-center gap-1">
                <Clock size={11} /> 시간
              </p>
              <input
                type="time"
                className="input-field"
                value={form.matchTime}
                onChange={(e) => setForm({ ...form, matchTime: e.target.value })}
              />
            </div>
          </div>
          {form.matchDate && form.matchTime && (
            <p className="text-xs text-primary mt-2 font-medium">
              📅{' '}
              {new Date(`${form.matchDate}T${form.matchTime}:00`).toLocaleString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          )}
        </div>

        {/* 소개글 */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            소개글
            <span className="ml-2 text-xs font-normal text-slate-400">
              {form.description.length}/500
            </span>
          </label>
          <textarea
            className="input-field resize-none"
            rows={4}
            placeholder="팀 소개, 경기 스타일, 원하는 상대팀 조건 등을 적어주세요 (최소 10자)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            maxLength={500}
          />
        </div>

        {/* 원하는 수준 */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">원하는 상대 수준</label>
          <div className="flex gap-2">
            {levels.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setForm({ ...form, requiredLevel: l })}
                className={`flex-1 py-2.5 rounded-xl border-2 font-semibold text-sm transition-all ${
                  form.requiredLevel === l
                    ? 'border-accent bg-accent text-white'
                    : 'border-slate-200 text-slate-600 hover:border-accent/50'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3 flex items-center justify-center gap-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <PenSquare size={18} /> 매치글 등록하기
            </>
          )}
        </button>
      </form>
    </div>
  )
}
