'use client'

import { useState, useEffect } from 'react'
import { Pencil, Check, X, User, Trash2, Edit2, MapPin, Users } from 'lucide-react'
import { StarRating } from '@/components/review/StarRating'
import { SportBadge, LevelBadge, StatusBadge } from '@/components/ui/Badge'
import { PageSpinner } from '@/components/ui/Spinner'
import { createClient } from '@/lib/supabase/client'
import { maskStudentId, formatDate } from '@/lib/utils'
import type { Profile, Review, SkillLevel, Match, Sport, MatchSize } from '@/types/database'
import { SPORT_META, SPORT_ALLOWED_SIZES } from '@/types/database'
import toast from 'react-hot-toast'

interface ReviewWithMatch extends Omit<Review, 'reviewer' | 'reviewee' | 'match'> {
  match?: { team_name: string; sport: string }
  reviewer?: { nickname: string }
}

interface EditMatchForm {
  teamName: string
  sport: Sport | ''
  matchSize: MatchSize | ''
  location: string
  description: string
  requiredLevel: SkillLevel
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

  // 내 매치글
  const [myMatches, setMyMatches] = useState<Match[]>([])
  const [editingMatch, setEditingMatch] = useState<Match | null>(null)
  const [editForm, setEditForm] = useState<EditMatchForm>({
    teamName: '',
    sport: '',
    matchSize: '',
    location: '',
    description: '',
    requiredLevel: '중급',
  })
  const [savingMatch, setSavingMatch] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

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

      // 내 매치글 불러오기
      const { data: m } = await supabase
        .from('matches')
        .select('*')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false })

      if (m) setMyMatches(m)

      setLoading(false)
    }
    load()
  }, [supabase])

  const saveNickname = async () => {
    if (!profile || nicknameInput === profile.nickname || nicknameInput.length < 2) return
    setSavingNickname(true)

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

  const openEdit = (match: Match) => {
    setEditingMatch(match)
    setEditForm({
      teamName: match.team_name,
      sport: match.sport,
      matchSize: match.match_size,
      location: match.location,
      description: match.description,
      requiredLevel: match.required_level,
    })
  }

  const handleEditSave = async () => {
    if (!editingMatch) return
    if (!editForm.teamName.trim()) { toast.error('팀명을 입력해주세요.'); return }
    if (!editForm.sport) { toast.error('종목을 선택해주세요.'); return }
    if (!editForm.matchSize) { toast.error('매치 인원을 선택해주세요.'); return }
    if (!editForm.location.trim()) { toast.error('장소를 입력해주세요.'); return }
    if (editForm.description.trim().length < 10) { toast.error('소개글을 10자 이상 입력해주세요.'); return }

    setSavingMatch(true)
    try {
      const res = await fetch(`/api/matches/${editingMatch.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamName: editForm.teamName,
          sport: editForm.sport,
          matchSize: editForm.matchSize,
          location: editForm.location,
          description: editForm.description,
          requiredLevel: editForm.requiredLevel,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || '수정에 실패했습니다.')
        return
      }
      setMyMatches((prev) => prev.map((m) => m.id === editingMatch.id ? { ...m, ...data } : m))
      setEditingMatch(null)
      toast.success('매치글이 수정되었습니다!')
    } finally {
      setSavingMatch(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/matches/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || '삭제에 실패했습니다.')
        return
      }
      setMyMatches((prev) => prev.filter((m) => m.id !== id))
      toast.success('매치글이 삭제되었습니다.')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading || !profile) return <PageSpinner />

  const levels: SkillLevel[] = ['초급', '중급', '고수']
  const sports: Sport[] = ['축구', '풋살', '농구', 'e스포츠']
  const allSizes: MatchSize[] = ['1vs1', '3vs3', '5vs5', '11vs11']
  const allowedSizes = editForm.sport ? SPORT_ALLOWED_SIZES[editForm.sport as Sport] : allSizes

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

      {/* 내 매치글 */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-slate-800">내 매치글</h2>
          <span className="text-sm text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">{myMatches.length}개</span>
        </div>

        {myMatches.length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-6">작성한 매치글이 없습니다</p>
        ) : (
          <div className="space-y-2.5">
            {myMatches.map((m) => (
              <div key={m.id} className="flex items-center justify-between bg-slate-50 rounded-xl p-3.5 gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <SportBadge sport={m.sport} />
                    <StatusBadge status={m.status} />
                    <span className="font-semibold text-slate-700 text-sm">{m.team_name}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                    <span className="flex items-center gap-0.5">
                      <Users size={11} /> {m.match_size}
                    </span>
                    {m.location && (
                      <span className="flex items-center gap-0.5 truncate">
                        <MapPin size={11} /> {m.location}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => openEdit(m)}
                    className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    title="수정"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(m.id)}
                    disabled={deletingId === m.id}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                    title="삭제"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
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
                    {r.match && <SportBadge sport={r.match.sport as Sport} />}
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

      {/* 매치글 수정 모달 */}
      {editingMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
              <h3 className="text-lg font-bold text-slate-800">매치글 수정</h3>
              <button
                onClick={() => setEditingMatch(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* 팀명 */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">팀명</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="팀 이름을 입력하세요"
                  value={editForm.teamName}
                  onChange={(e) => setEditForm({ ...editForm, teamName: e.target.value })}
                  maxLength={20}
                />
              </div>

              {/* 종목 */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">종목</label>
                <div className="grid grid-cols-2 gap-2">
                  {sports.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        const sizes = SPORT_ALLOWED_SIZES[s]
                        setEditForm((prev) => ({
                          ...prev,
                          sport: s,
                          matchSize: sizes.includes(prev.matchSize as MatchSize) ? prev.matchSize : '',
                        }))
                      }}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                        editForm.sport === s
                          ? 'border-primary bg-primary/5'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span className="text-xl">{SPORT_META[s].emoji}</span>
                      <span className="text-slate-700">{s}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 매치 인원 */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">매치 인원</label>
                <div className="flex gap-2 flex-wrap">
                  {allSizes.map((size) => {
                    const disabled = editForm.sport ? !allowedSizes.includes(size) : false
                    return (
                      <button
                        key={size}
                        type="button"
                        disabled={disabled}
                        onClick={() => !disabled && setEditForm({ ...editForm, matchSize: size })}
                        className={`px-4 py-2 rounded-xl border-2 font-semibold text-sm transition-all ${
                          editForm.matchSize === size
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
                {editForm.sport && (
                  <p className="text-xs text-slate-400 mt-1.5">
                    {editForm.sport}: {SPORT_ALLOWED_SIZES[editForm.sport as Sport].join(', ')} 가능
                  </p>
                )}
              </div>

              {/* 장소 */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <span className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-slate-500" /> 장소
                  </span>
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="경기 장소를 입력하세요"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                  maxLength={50}
                />
              </div>

              {/* 소개글 */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  소개글
                  <span className="ml-2 text-xs font-normal text-slate-400">{editForm.description.length}/500</span>
                </label>
                <textarea
                  className="input-field resize-none"
                  rows={4}
                  placeholder="팀 소개, 경기 스타일, 원하는 상대팀 조건 등 (최소 10자)"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
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
                      onClick={() => setEditForm({ ...editForm, requiredLevel: l })}
                      className={`flex-1 py-2.5 rounded-xl border-2 font-semibold text-sm transition-all ${
                        editForm.requiredLevel === l
                          ? 'border-accent bg-accent text-white'
                          : 'border-slate-200 text-slate-600 hover:border-accent/50'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 모달 하단 버튼 */}
            <div className="flex gap-3 p-5 border-t border-slate-100">
              <button
                onClick={() => setEditingMatch(null)}
                className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleEditSave}
                disabled={savingMatch}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {savingMatch ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><Check size={16} /> 저장하기</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
