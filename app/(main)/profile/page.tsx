'use client'

import { useState, useEffect } from 'react'
import { Pencil, Check, X, User } from 'lucide-react'
import { StarRating } from '@/components/review/StarRating'
import { SportBadge } from '@/components/ui/Badge'
import { PageSpinner } from '@/components/ui/Spinner'
import { createClient } from '@/lib/supabase/client'
import { maskStudentId, formatDate } from '@/lib/utils'
import type { Profile, Review, SkillLevel } from '@/types/database'
import toast from 'react-hot-toast'

interface ReviewWithMatch extends Omit<Review, 'reviewer' | 'reviewee' | 'match'> {
  match?: { team_name: string; sport: string }
  reviewer?: { nickname: string }
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [reviews, setReviews] = useState<ReviewWithMatch[]>([])
  const [avgRating, setAvgRating] = useState(0)
  const [loading, setLoading] = useState(true)
  const [editNickname, setEditNickname] = useState(false)
  const [nicknameInput, setNicknameInput] = useState('')
  const [savingNickname, setSavingNickname] = useState(false)
  const [savingLevel, setSavingLevel] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      if (p) {
        setProfile(p)
        setNicknameInput(p.nickname)
      }

      const { data: r } = await supabase
        .from('reviews')
        .select('*, match:matches(team_name,sport), reviewer:profiles!reviews_reviewer_id_fkey(nickname)')
        .eq('reviewee_id', user.id)
        .order('created_at', { ascending: false })

      if (r) {
        setReviews(r)
        if (r.length > 0) {
          setAvgRating(r.reduce((sum, rv) => sum + rv.rating, 0) / r.length)
        }
      }
      setLoading(false)
    }
    load()
  }, [supabase])

  const saveNickname = async () => {
    if (!profile || nicknameInput === profile.nickname || nicknameInput.length < 2) return
    setSavingNickname(true)

    // Check duplicate
    const { data: exist } = await supabase
      .from('profiles')
      .select('id')
      .eq('nickname', nicknameInput)
      .neq('id', profile.id)
      .single()

    if (exist) {
      toast.error('이미 사용 중인 닉네임입니다.')
      setSavingNickname(false)
      return
    }

    const { error } = await supabase.from('profiles').update({ nickname: nicknameInput }).eq('id', profile.id)
    if (error) {
      toast.error('수정에 실패했습니다.')
    } else {
      setProfile((prev) => prev ? { ...prev, nickname: nicknameInput } : prev)
      toast.success('닉네임이 변경되었습니다!')
    }
    setEditNickname(false)
    setSavingNickname(false)
  }

  const saveLevel = async (level: SkillLevel) => {
    if (!profile) return
    setSavingLevel(true)
    const { error } = await supabase.from('profiles').update({ skill_level: level }).eq('id', profile.id)
    if (error) {
      toast.error('수정에 실패했습니다.')
    } else {
      setProfile((prev) => prev ? { ...prev, skill_level: level } : prev)
      toast.success('실력 수준이 변경되었습니다!')
    }
    setSavingLevel(false)
  }

  if (loading || !profile) return <PageSpinner />

  const levels: SkillLevel[] = ['초급', '중급', '고수']

  return (
    <div className="space-y-5 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">내 정보</h1>
        <p className="text-slate-500 text-sm mt-0.5">프로필 정보를 확인하고 수정하세요</p>
      </div>

      {/* Profile Card */}
      <div className="card p-6 space-y-5">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center">
            <User size={32} className="text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              {editNickname ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={nicknameInput}
                    onChange={(e) => setNicknameInput(e.target.value)}
                    className="input-field py-1.5 px-3 text-base w-36"
                    maxLength={10}
                    autoFocus
                  />
                  <button onClick={saveNickname} disabled={savingNickname}
                    className="p-1.5 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                    <Check size={14} />
                  </button>
                  <button onClick={() => { setEditNickname(false); setNicknameInput(profile.nickname) }}
                    className="p-1.5 bg-slate-300 text-white rounded-lg hover:bg-slate-400 transition-colors">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-xl font-bold text-slate-800">{profile.nickname}</span>
                  <button onClick={() => setEditNickname(true)}
                    className="p-1 text-slate-400 hover:text-primary rounded-lg transition-colors">
                    <Pencil size={14} />
                  </button>
                </>
              )}
            </div>
            <p className="text-sm text-slate-500">{profile.username}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs text-slate-400 mb-1">이름</p>
            <p className="font-semibold text-slate-700">{profile.full_name}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs text-slate-400 mb-1">학번</p>
            <p className="font-semibold text-slate-700 font-mono">{maskStudentId(profile.student_id)}</p>
          </div>
        </div>

        {/* Skill level */}
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-2">실력 수준</p>
          <div className="flex gap-2">
            {levels.map((l) => (
              <button
                key={l}
                onClick={() => saveLevel(l)}
                disabled={savingLevel}
                className={`flex-1 py-2.5 rounded-xl border-2 font-semibold text-sm transition-all ${
                  profile.skill_level === l
                    ? 'border-primary bg-primary text-white'
                    : 'border-slate-200 text-slate-600 hover:border-primary/50'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reviews */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-800">매너 평가</h2>
          <div className="flex items-center gap-1.5">
            <StarRating value={Math.round(avgRating)} readonly size={18} />
            <span className="font-bold text-slate-700">{avgRating.toFixed(1)}</span>
            <span className="text-slate-400 text-sm">({reviews.length}건)</span>
          </div>
        </div>

        {reviews.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-6">아직 받은 평가가 없습니다</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                <div>
                  <div className="flex items-center gap-2">
                    {r.match && <SportBadge sport={r.match.sport as any} />}
                    <span className="text-sm font-medium text-slate-700">{r.match?.team_name}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{formatDate(r.created_at)} · {r.reviewer?.nickname}</p>
                </div>
                <StarRating value={r.rating} readonly size={16} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
