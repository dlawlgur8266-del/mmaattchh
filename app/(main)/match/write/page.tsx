'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PenSquare, MapPin, Calendar, Clock, Trophy, Swords, Users } from 'lucide-react'
import { SPORT_META, SPORT_ALLOWED_SIZES } from '@/types/database'
import type { Sport, SkillLevel, MatchSize } from '@/types/database'
import { CONTEST_CATEGORIES, type ContestCategory } from '@/data/contests'
import toast from 'react-hot-toast'

const sports: Sport[] = ['축구', '풋살', '농구', 'e스포츠']
const allSizes: MatchSize[] = ['1vs1', '3vs3', '5vs5', '11vs11']
const levels: SkillLevel[] = ['초급', '중급', '고수']
const REGIONS = ['충청북도', '충청남도']
const TEAM_SIZES = [1, 2, 3, 4, 5]

type WriteMode = '스포츠' | '공모전'

export default function WriteMatchPage() {
  const router = useRouter()
  const [mode, setMode] = useState<WriteMode>('스포츠')

  /* ── 스포츠 폼 ── */
  const [sportForm, setSportForm] = useState({
    teamName: '',
    sport: '' as Sport | '',
    matchSize: '' as MatchSize | '',
    location: '',
    description: '',
    requiredLevel: '중급' as SkillLevel,
    matchDate: '',
    matchTime: '',
  })

  /* ── 공모전 폼 ── */
  const [contestForm, setContestForm] = useState({
    contestName: '',
    contestCategory: '' as ContestCategory | '',
    region: '',
    deadline: '',
    teamSize: 3,
    description: '',
  })

  const [loading, setLoading] = useState(false)

  const allowedSizes = sportForm.sport
    ? SPORT_ALLOWED_SIZES[sportForm.sport as Sport]
    : allSizes
  const today = new Date().toISOString().split('T')[0]

  /* ── 스포츠 제출 ── */
  const handleSportSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!sportForm.teamName.trim()) return toast.error('팀명을 입력해주세요.')
    if (!sportForm.sport) return toast.error('종목을 선택해주세요.')
    if (!sportForm.matchSize) return toast.error('매치 인원을 선택해주세요.')
    if (!sportForm.location.trim()) return toast.error('장소를 입력해주세요.')
    if (sportForm.description.trim().length < 10) return toast.error('소개글을 10자 이상 입력해주세요.')
    if (!sportForm.matchDate) return toast.error('경기 날짜를 선택해주세요.')
    if (!sportForm.matchTime) return toast.error('경기 시간을 선택해주세요.')

    const matchDatetime = new Date(
      `${sportForm.matchDate}T${sportForm.matchTime}:00`
    ).toISOString()

    setLoading(true)
    try {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamName: sportForm.teamName,
          sport: sportForm.sport,
          matchSize: sportForm.matchSize,
          location: sportForm.location,
          description: sportForm.description,
          requiredLevel: sportForm.requiredLevel,
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

  /* ── 공모전 제출 ── */
  const handleContestSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contestForm.contestName.trim()) return toast.error('공모전 이름을 입력해주세요.')
    if (!contestForm.contestCategory || contestForm.contestCategory === '전체')
      return toast.error('공모전 분야를 선택해주세요.')
    if (!contestForm.region) return toast.error('지역을 선택해주세요.')
    if (!contestForm.deadline) return toast.error('마감일을 선택해주세요.')
    if (contestForm.description.trim().length < 10)
      return toast.error('소개글을 10자 이상 입력해주세요.')

    setLoading(true)
    try {
      const res = await fetch('/api/contest-matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contestName: contestForm.contestName,
          contestCategory: contestForm.contestCategory,
          region: contestForm.region,
          deadline: contestForm.deadline,
          teamSize: contestForm.teamSize,
          description: contestForm.description,
        }),
      })
      const data = await res.json()
      if (!res.ok) return toast.error(data.error || '등록에 실패했습니다.')
      toast.success('공모전 팀원 모집 글이 등록되었습니다!')
      router.push('/contest/matches')
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

      {/* ── 모드 선택 탭 ── */}
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
          onClick={() => setMode('공모전')}
          className={`flex items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all font-semibold ${
            mode === '공모전'
              ? 'border-yellow-500 bg-yellow-50 text-yellow-700 shadow-sm'
              : 'border-slate-200 text-slate-500 hover:border-yellow-300 hover:text-yellow-600'
          }`}
        >
          <Trophy size={20} />
          공모전 팀원
        </button>
      </div>

      {/* ════════════════════════════════════
          스포츠 매치 폼
      ════════════════════════════════════ */}
      {mode === '스포츠' && (
        <form onSubmit={handleSportSubmit} className="card p-6 space-y-6">
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
              placeholder="우리 팀 이름 (2~20자)"
              value={sportForm.teamName}
              onChange={(e) => setSportForm({ ...sportForm, teamName: e.target.value })}
              maxLength={20}
            />
          </div>

          {/* 종목 */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">종목</label>
            <div className="grid grid-cols-2 gap-3">
              {sports.map((s) => {
                const meta = SPORT_META[s]
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      const sizes = SPORT_ALLOWED_SIZES[s]
                      setSportForm((prev) => ({
                        ...prev,
                        sport: s,
                        matchSize: sizes.includes(prev.matchSize as MatchSize) ? prev.matchSize : '',
                      }))
                    }}
                    className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      sportForm.sport === s
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
                    onClick={() => !disabled && setSportForm({ ...sportForm, matchSize: size })}
                    className={`px-4 py-2.5 rounded-xl border-2 font-semibold text-sm transition-all ${
                      sportForm.matchSize === size
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
          </div>

          {/* 장소 */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              <span className="flex items-center gap-1.5">
                <MapPin size={15} className="text-slate-500" /> 경기 장소
              </span>
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="경기 장소 (예: 충북대학교 운동장)"
              value={sportForm.location}
              onChange={(e) => setSportForm({ ...sportForm, location: e.target.value })}
              maxLength={50}
            />
          </div>

          {/* 날짜 & 시간 */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              <span className="flex items-center gap-1.5">
                <Calendar size={15} className="text-slate-500" /> 경기 날짜 &amp; 시간
              </span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-slate-400 mb-1.5">날짜</p>
                <input
                  type="date"
                  className="input-field"
                  value={sportForm.matchDate}
                  min={today}
                  onChange={(e) => setSportForm({ ...sportForm, matchDate: e.target.value })}
                />
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1.5">시간</p>
                <input
                  type="time"
                  className="input-field"
                  value={sportForm.matchTime}
                  onChange={(e) => setSportForm({ ...sportForm, matchTime: e.target.value })}
                />
              </div>
            </div>
            {sportForm.matchDate && sportForm.matchTime && (
              <p className="text-xs text-primary mt-2 font-medium">
                📅{' '}
                {new Date(`${sportForm.matchDate}T${sportForm.matchTime}:00`).toLocaleString('ko-KR', {
                  year: 'numeric', month: 'long', day: 'numeric',
                  weekday: 'short', hour: '2-digit', minute: '2-digit',
                })}
              </p>
            )}
          </div>

          {/* 소개글 */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              소개글
              <span className="ml-2 text-xs font-normal text-slate-400">{sportForm.description.length}/500</span>
            </label>
            <textarea
              className="input-field resize-none"
              rows={4}
              placeholder="팀 소개, 경기 스타일, 원하는 상대팀 조건 (최소 10자)"
              value={sportForm.description}
              onChange={(e) => setSportForm({ ...sportForm, description: e.target.value })}
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
                  onClick={() => setSportForm({ ...sportForm, requiredLevel: l })}
                  className={`flex-1 py-2.5 rounded-xl border-2 font-semibold text-sm transition-all ${
                    sportForm.requiredLevel === l
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
              <><PenSquare size={18} /> 매치글 등록하기</>
            )}
          </button>
        </form>
      )}

      {/* ════════════════════════════════════
          공모전 팀원 폼
      ════════════════════════════════════ */}
      {mode === '공모전' && (
        <form onSubmit={handleContestSubmit} className="card p-6 space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Trophy size={18} className="text-yellow-500" />
            <span className="font-semibold text-slate-700">공모전 팀원 모집 작성</span>
          </div>

          {/* 공모전 이름 */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">공모전 이름</label>
            <input
              type="text"
              className="input-field"
              placeholder="참가할 공모전 이름을 입력하세요"
              value={contestForm.contestName}
              onChange={(e) => setContestForm({ ...contestForm, contestName: e.target.value })}
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
                  onClick={() => setContestForm({ ...contestForm, contestCategory: cat })}
                  className={`py-2.5 rounded-xl text-sm font-medium transition-all border-2 ${
                    contestForm.contestCategory === cat
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
                <MapPin size={15} className="text-slate-500" /> 지역
              </span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              {REGIONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setContestForm({ ...contestForm, region: r })}
                  className={`py-3 rounded-xl text-sm font-semibold transition-all border-2 ${
                    contestForm.region === r
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
                <Calendar size={15} className="text-slate-500" /> 공모전 마감일
              </span>
            </label>
            <input
              type="date"
              className="input-field"
              value={contestForm.deadline}
              min={today}
              onChange={(e) => setContestForm({ ...contestForm, deadline: e.target.value })}
            />
          </div>

          {/* 팀원 모집 인원 */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              <span className="flex items-center gap-1.5">
                <Users size={15} className="text-slate-500" /> 모집 팀원 수 (본인 제외)
              </span>
            </label>
            <div className="flex gap-2">
              {TEAM_SIZES.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setContestForm({ ...contestForm, teamSize: n })}
                  className={`flex-1 py-2.5 rounded-xl border-2 font-bold text-sm transition-all ${
                    contestForm.teamSize === n
                      ? 'border-yellow-500 bg-yellow-500 text-white'
                      : 'border-slate-200 text-slate-600 hover:border-yellow-300'
                  }`}
                >
                  {n}명
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400 mt-1.5">총 {contestForm.teamSize + 1}명 팀 (본인 포함)</p>
          </div>

          {/* 소개글 */}
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              소개글
              <span className="ml-2 text-xs font-normal text-slate-400">{contestForm.description.length}/500</span>
            </label>
            <textarea
              className="input-field resize-none"
              rows={4}
              placeholder="공모전 소개, 원하는 팀원 조건 등 (최소 10자)"
              value={contestForm.description}
              onChange={(e) => setContestForm({ ...contestForm, description: e.target.value })}
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
              <><Trophy size={18} /> 팀원 모집 등록하기</>
            )}
          </button>
        </form>
      )}
    </div>
  )
}
