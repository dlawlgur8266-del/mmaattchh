'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Check, MapPin, Calendar, Swords } from 'lucide-react'
import { SPORT_META, SPORT_ALLOWED_SIZES } from '@/types/database'
import type { Sport, SkillLevel, MatchSize } from '@/types/database'
import { createClient } from '@/lib/supabase/client'
import { PageSpinner } from '@/components/ui/Spinner'
import toast from 'react-hot-toast'

const sports: Sport[] = ['축구', '풋살', '농구', 'e스포츠', '테니스']
const allSizes: MatchSize[] = ['1vs1', '3vs3', '5vs5', '11vs11']
const levels: SkillLevel[] = ['초급', '중급', '고수']

export default function EditMatchPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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

  const today = new Date().toISOString().split('T')[0]
  const allowedSizes = form.sport ? SPORT_ALLOWED_SIZES[form.sport as Sport] : allSizes

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: match } = await supabase
        .from('matches')
        .select('*')
        .eq('id', id)
        .single()

      if (!match) { toast.error('매치를 찾을 수 없습니다.'); router.push('/match'); return }
      if (match.author_id !== user.id) { toast.error('수정 권한이 없습니다.'); router.push('/match'); return }

      let matchDate = ''
      let matchTime = ''
      if (match.match_datetime) {
        const d = new Date(match.match_datetime)
        matchDate = d.toISOString().split('T')[0]
        matchTime = d.toTimeString().slice(0, 5)
      }

      setForm({
        teamName: match.team_name,
        sport: match.sport,
        matchSize: match.match_size,
        location: match.location || '',
        description: match.description,
        requiredLevel: match.required_level,
        matchDate,
        matchTime,
      })
      setLoading(false)
    }
    load()
  }, [id])

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

    setSaving(true)
    try {
      const res = await fetch(`/api/matches/${id}`, {
        method: 'PUT',
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
      if (!res.ok) { toast.error(data.error || '수정에 실패했습니다.'); return }
      toast.success('매치글이 수정되었습니다!')
      router.push('/match')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <PageSpinner />

  return (
    <div className="max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">매치글 수정</h1>
        <p className="text-slate-500 text-sm mt-0.5">매치글 정보를 수정하세요</p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-6">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
          <Swords size={18} className="text-primary" />
          <span className="font-semibold text-slate-700">스포츠 매치 수정</span>
        </div>

        {/* 팀명 */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">팀명</label>
          <input
            type="text"
            className="input-field"
            placeholder="우리 팀 이름 (2~20자)"
            value={form.teamName}
            onChange={(e) => setForm({ ...form, teamName: e.target.value })}
            maxLength={20}
          />
        </div>

        {/* 종목 */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">종목</label>
          <div className="grid grid-cols-2 gap-3">
            {sports.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  const sizes = SPORT_ALLOWED_SIZES[s]
                  setForm((prev) => ({
                    ...prev,
                    sport: s,
                    matchSize: sizes.includes(prev.matchSize as MatchSize) ? prev.matchSize : '',
                  }))
                }}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                  form.sport === s
                    ? 'border-primary bg-primary/5 shadow-sm'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <span className="text-2xl">{SPORT_META[s].emoji}</span>
                <span className="font-semibold text-slate-700">{s}</span>
              </button>
            ))}
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
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
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
                value={form.matchDate}
                min={today}
                onChange={(e) => setForm({ ...form, matchDate: e.target.value })}
              />
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1.5">시간</p>
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
            <span className="ml-2 text-xs font-normal text-slate-400">{form.description.length}/500</span>
          </label>
          <textarea
            className="input-field resize-none"
            rows={4}
            placeholder="팀 소개, 경기 스타일, 원하는 상대팀 조건 (최소 10자)"
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

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 btn-primary py-3 flex items-center justify-center gap-2"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <><Check size={18} /> 수정 완료</>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
