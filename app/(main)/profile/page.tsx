'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Pencil, Check, X, User, Trash2, Edit2, MapPin, Users,
  CalendarDays, Trophy, XCircle, Clock,
} from 'lucide-react'
import { StarRating } from '@/components/review/StarRating'
import { SportBadge, LevelBadge, StatusBadge } from '@/components/ui/Badge'
import { MatchCalendar, type ContestEvent } from '@/components/ui/Calendar'
import { PageSpinner } from '@/components/ui/Spinner'
import { createClient } from '@/lib/supabase/client'
import { maskStudentId, formatDate } from '@/lib/utils'
import { CATEGORY_COLORS } from '@/data/contests'
import type { Profile, Review, SkillLevel, Match, Sport, MatchSize, MyMatch } from '@/types/database'
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
  matchDate: string
  matchTime: string
}

type TabType = '내 매치글' | '내 경기' | '내 공모전' | '캘린더' | '매너 평가'

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [reviews, setReviews] = useState<ReviewWithMatch[]>([])
  const [avgRating, setAvgRating] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('내 매치글')

  // 닉네임 편집
  const [editNickname, setEditNickname] = useState(false)
  const [nicknameInput, setNicknameInput] = useState('')
  const [savingNickname, setSavingNickname] = useState(false)
  const [savingLevel, setSavingLevel] = useState(false)

  // 내 매치글
  const [myMatches, setMyMatches] = useState<Match[]>([])
  const [editingMatch, setEditingMatch] = useState<Match | null>(null)
  const [editForm, setEditForm] = useState<EditMatchForm>({
    teamName: '', sport: '', matchSize: '', location: '', description: '',
    requiredLevel: '중급', matchDate: '', matchTime: '',
  })
  const [savingMatch, setSavingMatch] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // 내 경기 (확정된 매치)
  const [myConfirmedMatches, setMyConfirmedMatches] = useState<MyMatch[]>([])
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  // 내 공모전
  const [myContestEvents, setMyContestEvents] = useState<ContestEvent[]>([])

  const supabase = createClient()
  const today = new Date().toISOString().split('T')[0]

  // ────────────── 내 확정 경기 로드 ──────────────
  const loadMyConfirmedMatches = useCallback(async (userId: string) => {
    const results: MyMatch[] = []

    // ── 1) 내가 작성자인 확정 매치 ──
    // Step1: 내가 작성한 '매치확정' 매치 목록
    const { data: confirmedMatches } = await supabase
      .from('matches')
      .select('id, team_name, sport, match_size, location, status')
      .eq('author_id', userId)
      .eq('status', '매치확정')

    if (confirmedMatches) {
      for (const m of confirmedMatches as any[]) {
        // Step2: 해당 매치의 수락된 신청 조회
        const { data: app } = await supabase
          .from('match_applications')
          .select('id, applicant_id, applicant:profiles!match_applications_applicant_id_fkey(nickname)')
          .eq('match_id', m.id)
          .eq('status', 'accepted')
          .maybeSingle()

        if (!app) continue
        const opponent = Array.isArray(app.applicant) ? app.applicant[0] : app.applicant

        // match_datetime은 없을 수 있으므로 별도 조회
        const { data: matchFull } = await supabase
          .from('matches')
          .select('match_datetime')
          .eq('id', m.id)
          .maybeSingle()

        results.push({
          matchId: m.id,
          applicationId: app.id,
          teamName: m.team_name,
          opponentNickname: opponent?.nickname || '상대방',
          sport: m.sport,
          matchSize: m.match_size,
          location: m.location || '',
          matchDatetime: (matchFull as any)?.match_datetime ?? null,
          status: m.status,
          isAuthor: true,
        })
      }
    }

    // ── 2) 내가 신청자이고 수락된 매치 ──
    const { data: myApps } = await supabase
      .from('match_applications')
      .select('id, match_id')
      .eq('applicant_id', userId)
      .eq('status', 'accepted')

    if (myApps) {
      for (const app of myApps as any[]) {
        // 해당 매치가 '매치확정' 상태인지 확인
        const { data: m } = await supabase
          .from('matches')
          .select('id, team_name, sport, match_size, location, status, author_id')
          .eq('id', app.match_id)
          .eq('status', '매치확정')
          .maybeSingle()

        if (!m) continue

        // 작성자 닉네임 조회
        const { data: author } = await supabase
          .from('profiles')
          .select('nickname')
          .eq('id', (m as any).author_id)
          .maybeSingle()

        // match_datetime 별도 조회
        const { data: matchFull } = await supabase
          .from('matches')
          .select('match_datetime')
          .eq('id', m.id)
          .maybeSingle()

        results.push({
          matchId: (m as any).id,
          applicationId: app.id,
          teamName: (m as any).team_name,
          opponentNickname: (author as any)?.nickname || '상대방',
          sport: (m as any).sport,
          matchSize: (m as any).match_size,
          location: (m as any).location || '',
          matchDatetime: (matchFull as any)?.match_datetime ?? null,
          status: (m as any).status,
          isAuthor: false,
        })
      }
    }

    // 중복 제거 (matchId 기준)
    const unique = results.filter(
      (m, idx, arr) => arr.findIndex((x) => x.matchId === m.matchId) === idx
    )
    setMyConfirmedMatches(unique)
  }, [supabase])

  // ────────────── 내 공모전 로드 ──────────────
  const loadMyContests = useCallback(async (userId: string) => {
    const events: ContestEvent[] = []

    // 1) 내가 작성한 공모전 팀원 모집 게시글
    const { data: authored } = await supabase
      .from('contest_matches')
      .select('id, contest_name, contest_category, region, deadline, team_size, current_count, status')
      .eq('author_id', userId)
      .order('deadline', { ascending: true })

    if (authored) {
      for (const c of authored as any[]) {
        events.push({
          id: c.id,
          contestName: c.contest_name,
          deadline: c.deadline,
          category: c.contest_category,
          region: c.region,
          teamSize: c.team_size,
          isAuthor: true,
        })
      }
    }

    // 2) 내가 수락된 신청자로 참여 중인 공모전
    const { data: apps } = await supabase
      .from('contest_applications')
      .select(`
        id,
        contest_match:contest_matches!contest_applications_contest_match_id_fkey(
          id, contest_name, contest_category, region, deadline, team_size
        )
      `)
      .eq('applicant_id', userId)
      .eq('status', 'accepted')

    if (apps) {
      for (const a of apps as any[]) {
        const cm = Array.isArray(a.contest_match) ? a.contest_match[0] : a.contest_match
        if (!cm) continue
        // 중복 방지
        if (events.some((e) => e.id === cm.id)) continue
        events.push({
          id: cm.id,
          contestName: cm.contest_name,
          deadline: cm.deadline,
          category: cm.contest_category,
          region: cm.region,
          teamSize: cm.team_size,
          isAuthor: false,
        })
      }
    }

    setMyContestEvents(events)
  }, [supabase])

  // ────────────── 초기 데이터 로드 ──────────────
  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const [{ data: p }, { data: r }, { data: m }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase
          .from('reviews')
          .select('*, match:matches(team_name,sport), reviewer:profiles!reviews_reviewer_id_fkey(nickname)')
          .eq('reviewee_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('matches')
          .select('*')
          .eq('author_id', user.id)
          .order('created_at', { ascending: false }),
      ])

      if (p) { setProfile(p); setNicknameInput(p.nickname) }
      if (r) {
        setReviews(r)
        if (r.length > 0) setAvgRating(r.reduce((s, rv) => s + rv.rating, 0) / r.length)
      }
      if (m) setMyMatches(m)

      await Promise.all([
        loadMyConfirmedMatches(user.id),
        loadMyContests(user.id),
      ])
      setLoading(false)
    }
    load()
  }, [supabase, loadMyConfirmedMatches, loadMyContests])

  // ────────────── 닉네임 저장 ──────────────
  const saveNickname = async () => {
    if (!profile || nicknameInput === profile.nickname || nicknameInput.length < 2) return
    setSavingNickname(true)
    const { data: exist } = await supabase
      .from('profiles').select('id').eq('nickname', nicknameInput).neq('id', profile.id).single()
    if (exist) { toast.error('이미 사용 중인 닉네임입니다.'); setSavingNickname(false); return }
    const { error } = await supabase.from('profiles').update({ nickname: nicknameInput }).eq('id', profile.id)
    if (error) { toast.error('수정에 실패했습니다.') }
    else { setProfile((prev) => prev ? { ...prev, nickname: nicknameInput } : prev); toast.success('닉네임이 변경되었습니다!') }
    setEditNickname(false)
    setSavingNickname(false)
  }

  // ────────────── 실력 저장 ──────────────
  const saveLevel = async (level: SkillLevel) => {
    if (!profile) return
    setSavingLevel(true)
    const { error } = await supabase.from('profiles').update({ skill_level: level }).eq('id', profile.id)
    if (error) toast.error('수정에 실패했습니다.')
    else { setProfile((prev) => prev ? { ...prev, skill_level: level } : prev); toast.success('실력 수준이 변경되었습니다!') }
    setSavingLevel(false)
  }

  // ────────────── 매치글 수정 ──────────────
  const openEdit = (match: Match) => {
    setEditingMatch(match)
    let matchDate = ''
    let matchTime = ''
    if (match.match_datetime) {
      const d = new Date(match.match_datetime)
      matchDate = d.toISOString().split('T')[0]
      matchTime = d.toTimeString().slice(0, 5)
    }
    setEditForm({
      teamName: match.team_name,
      sport: match.sport,
      matchSize: match.match_size,
      location: match.location,
      description: match.description,
      requiredLevel: match.required_level,
      matchDate,
      matchTime,
    })
  }

  const handleEditSave = async () => {
    if (!editingMatch) return
    if (!editForm.teamName.trim()) { toast.error('팀명을 입력해주세요.'); return }
    if (!editForm.sport) { toast.error('종목을 선택해주세요.'); return }
    if (!editForm.matchSize) { toast.error('매치 인원을 선택해주세요.'); return }
    if (!editForm.location.trim()) { toast.error('장소를 입력해주세요.'); return }
    if (editForm.description.trim().length < 10) { toast.error('소개글을 10자 이상 입력해주세요.'); return }

    const matchDatetime =
      editForm.matchDate && editForm.matchTime
        ? new Date(`${editForm.matchDate}T${editForm.matchTime}:00`).toISOString()
        : null

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
          matchDatetime,
        }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || '수정에 실패했습니다.'); return }
      setMyMatches((prev) => prev.map((m) => m.id === editingMatch.id ? { ...m, ...data } : m))
      setEditingMatch(null)
      toast.success('매치글이 수정되었습니다!')
    } finally {
      setSavingMatch(false)
    }
  }

  // ────────────── 매치글 삭제 ──────────────
  const handleDelete = async (id: string) => {
    if (!window.confirm('정말 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/matches/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || '삭제에 실패했습니다.'); return }
      setMyMatches((prev) => prev.filter((m) => m.id !== id))
      toast.success('매치글이 삭제되었습니다.')
    } finally {
      setDeletingId(null)
    }
  }

  // ────────────── 매치 취소 ──────────────
  const handleCancelMatch = async (matchId: string) => {
    if (!window.confirm('매치를 취소하시겠습니까? 상대방에게 알림이 전송됩니다.')) return
    setCancellingId(matchId)
    try {
      const res = await fetch(`/api/matches/${matchId}/cancel`, { method: 'PATCH' })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error || '취소에 실패했습니다.'); return }
      // 취소 성공 → 내 경기 목록에서 즉시 삭제
      setMyConfirmedMatches((prev) => prev.filter((m) => m.matchId !== matchId))
      toast.success('매치가 취소되었습니다. 상대방에게 알림이 전송됐어요.')
    } finally {
      setCancellingId(null)
    }
  }

  if (loading || !profile) return <PageSpinner />

  const levels: SkillLevel[] = ['초급', '중급', '고수']
  const sports: Sport[] = ['축구', '풋살', '농구', 'e스포츠']
  const allSizes: MatchSize[] = ['1vs1', '3vs3', '5vs5', '11vs11']
  const allowedSizes = editForm.sport ? SPORT_ALLOWED_SIZES[editForm.sport as Sport] : allSizes

  const tabs: TabType[] = ['내 매치글', '내 경기', '내 공모전', '캘린더', '매너 평가']

  return (
    <div className="space-y-5 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">내 정보</h1>
        <p className="text-slate-500 text-sm mt-0.5">프로필 정보를 확인하고 수정하세요</p>
      </div>

      {/* ── 프로필 카드 ── */}
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

      {/* ── 탭 네비게이션 ── */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === tab
                ? 'bg-white text-primary shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── 탭 콘텐츠 ── */}

      {/* 내 매치글 */}
      {activeTab === '내 매치글' && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-slate-800">내 매치글</h2>
            <span className="text-sm text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">{myMatches.length}개</span>
          </div>
          {myMatches.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-6">작성한 매치글이 없습니다</p>
          ) : (
            <div className="space-y-2.5">
              {myMatches.map((m) => {
                const dtStr = m.match_datetime
                  ? new Date(m.match_datetime).toLocaleString('ko-KR', {
                      month: 'short', day: 'numeric', weekday: 'short',
                      hour: '2-digit', minute: '2-digit',
                    })
                  : null
                return (
                  <div key={m.id} className="flex items-center justify-between bg-slate-50 rounded-xl p-3.5 gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <SportBadge sport={m.sport} />
                        <StatusBadge status={m.status} />
                        <span className="font-semibold text-slate-700 text-sm">{m.team_name}</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-400">
                        <span className="flex items-center gap-0.5"><Users size={11} /> {m.match_size}</span>
                        {m.location && (
                          <span className="flex items-center gap-0.5 truncate"><MapPin size={11} /> {m.location}</span>
                        )}
                        {dtStr && (
                          <span className="flex items-center gap-0.5 text-primary font-medium">
                            <Clock size={11} /> {dtStr}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => openEdit(m)}
                        className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="수정">
                        <Edit2 size={15} />
                      </button>
                      <button onClick={() => handleDelete(m.id)} disabled={deletingId === m.id}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40" title="삭제">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* 내 경기 */}
      {activeTab === '내 경기' && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy size={18} className="text-accent" />
              <h2 className="font-bold text-slate-800">내 경기</h2>
            </div>
            <span className="text-sm text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
              {myConfirmedMatches.length}개
            </span>
          </div>

          {myConfirmedMatches.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <Trophy size={32} className="text-slate-200 mx-auto" />
              <p className="text-slate-400 text-sm">확정된 경기가 없습니다</p>
              <p className="text-slate-300 text-xs">매치가 수락되면 여기에 표시됩니다</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myConfirmedMatches.map((m) => {
                const meta = SPORT_META[m.sport]
                const dt = m.matchDatetime ? new Date(m.matchDatetime) : null
                const dtStr = dt
                  ? dt.toLocaleString('ko-KR', {
                      year: 'numeric', month: 'long', day: 'numeric',
                      weekday: 'short', hour: '2-digit', minute: '2-digit',
                    })
                  : null

                return (
                  <div
                    key={m.matchId}
                    className="rounded-xl p-4 bg-slate-50 border-l-4"
                    style={{ borderLeftColor: meta.color }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {/* 매치 제목 */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xl">{meta.emoji}</span>
                          <div>
                            <p className="font-bold text-slate-800 text-sm leading-tight">
                              {m.teamName}
                              <span className="mx-1.5 text-slate-300 font-normal">vs</span>
                              <span className="text-primary">{m.opponentNickname}</span>
                            </p>
                            <p className="text-xs text-slate-400">{m.sport} · {m.matchSize}</p>
                          </div>
                        </div>

                        {/* 경기장 & 날짜 */}
                        <div className="mt-2 space-y-1">
                          {m.location && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <MapPin size={11} className="text-slate-400 shrink-0" />
                              <span>경기장: {m.location}</span>
                            </div>
                          )}
                          {dtStr && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500">
                              <Clock size={11} className="text-slate-400 shrink-0" />
                              <span>{dtStr}</span>
                            </div>
                          )}
                        </div>

                        {/* 역할 배지 */}
                        <div className="mt-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            m.isAuthor ? 'bg-primary/10 text-primary' : 'bg-accent/10 text-accent'
                          }`}>
                            {m.isAuthor ? '매치 주최자' : '매치 신청자'}
                          </span>
                        </div>
                      </div>

                      {/* 취소 버튼 */}
                      <button
                        onClick={() => handleCancelMatch(m.matchId)}
                        disabled={cancellingId === m.matchId}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-500 border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50 shrink-0"
                      >
                        {cancellingId === m.matchId ? (
                          <div className="w-3 h-3 border border-red-400/40 border-t-red-500 rounded-full animate-spin" />
                        ) : (
                          <><XCircle size={13} /> 매치 취소</>
                        )}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* 내 공모전 */}
      {activeTab === '내 공모전' && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy size={18} className="text-yellow-500" />
              <h2 className="font-bold text-slate-800">내 공모전</h2>
            </div>
            <span className="text-sm text-slate-400 bg-slate-100 px-2.5 py-0.5 rounded-full">
              {myContestEvents.length}개
            </span>
          </div>

          {myContestEvents.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <Trophy size={32} className="text-slate-200 mx-auto" />
              <p className="text-slate-400 text-sm">참여 중인 공모전이 없습니다</p>
              <p className="text-slate-300 text-xs">공모전 팀원 모집에 신청하거나 직접 모집하면 여기에 표시됩니다</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myContestEvents.map((c) => {
                const colorClass = (CATEGORY_COLORS as Record<string, string>)[c.category] ?? 'bg-slate-100 text-slate-600'
                const today = new Date()
                today.setHours(0, 0, 0, 0)
                const deadlineDate = new Date(c.deadline)
                const diffDays = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                const dDayLabel =
                  diffDays < 0 ? '마감됨' :
                  diffDays === 0 ? 'D-Day' :
                  `D-${diffDays}`
                const dDayColor =
                  diffDays < 0 ? 'bg-slate-100 text-slate-400' :
                  diffDays <= 3 ? 'bg-red-100 text-red-600' :
                  diffDays <= 7 ? 'bg-yellow-100 text-yellow-700' :
                  'bg-green-100 text-green-700'

                return (
                  <div
                    key={c.id}
                    className="rounded-xl p-4 bg-yellow-50 border-l-4 border-yellow-400 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-800 text-sm leading-snug">{c.contestName}</p>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${colorClass}`}>
                            {c.category}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600">
                            {c.region}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            c.isAuthor ? 'bg-yellow-200 text-yellow-800' : 'bg-primary/10 text-primary'
                          }`}>
                            {c.isAuthor ? '내가 모집' : '참여중'}
                          </span>
                        </div>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold shrink-0 ${dDayColor}`}>
                        {dDayLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <CalendarDays size={11} className="text-yellow-500" />
                      <span>마감일: {c.deadline}</span>
                      <span className="text-slate-300">·</span>
                      <Users size={11} className="text-yellow-500" />
                      <span>팀원 {c.teamSize}명</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* 캘린더 */}
      {activeTab === '캘린더' && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <CalendarDays size={18} className="text-primary" />
            <h2 className="font-bold text-slate-800">경기 캘린더</h2>
          </div>
          <p className="text-xs text-slate-400">확정된 경기 일정을 달력에서 확인하세요</p>
          <MatchCalendar matches={myConfirmedMatches} contestEvents={myContestEvents} />
        </div>
      )}

      {/* 매너 평가 */}
      {activeTab === '매너 평가' && (
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
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatDate(r.created_at)} · {r.reviewer?.nickname}
                    </p>
                  </div>
                  <StarRating value={r.rating} readonly size={16} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 매치글 수정 모달 ── */}
      {editingMatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl">
              <h3 className="text-lg font-bold text-slate-800">매치글 수정</h3>
              <button onClick={() => setEditingMatch(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* 팀명 */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">팀명</label>
                <input type="text" className="input-field" placeholder="팀 이름을 입력하세요"
                  value={editForm.teamName}
                  onChange={(e) => setEditForm({ ...editForm, teamName: e.target.value })} maxLength={20} />
              </div>

              {/* 종목 */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">종목</label>
                <div className="grid grid-cols-2 gap-2">
                  {sports.map((s) => (
                    <button key={s} type="button"
                      onClick={() => {
                        const sizes = SPORT_ALLOWED_SIZES[s]
                        setEditForm((prev) => ({
                          ...prev, sport: s,
                          matchSize: sizes.includes(prev.matchSize as MatchSize) ? prev.matchSize : '',
                        }))
                      }}
                      className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                        editForm.sport === s ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-slate-300'
                      }`}>
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
                      <button key={size} type="button" disabled={disabled}
                        onClick={() => !disabled && setEditForm({ ...editForm, matchSize: size })}
                        className={`px-4 py-2 rounded-xl border-2 font-semibold text-sm transition-all ${
                          editForm.matchSize === size ? 'border-primary bg-primary text-white'
                          : disabled ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                          : 'border-slate-200 text-slate-600 hover:border-primary/50'
                        }`}>
                        {size}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 장소 */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  <span className="flex items-center gap-1.5"><MapPin size={14} className="text-slate-500" /> 장소</span>
                </label>
                <input type="text" className="input-field" placeholder="경기 장소를 입력하세요"
                  value={editForm.location}
                  onChange={(e) => setEditForm({ ...editForm, location: e.target.value })} maxLength={50} />
              </div>

              {/* 날짜 & 시간 */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">경기 날짜 &amp; 시간</label>
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" className="input-field" min={today}
                    value={editForm.matchDate}
                    onChange={(e) => setEditForm({ ...editForm, matchDate: e.target.value })} />
                  <input type="time" className="input-field"
                    value={editForm.matchTime}
                    onChange={(e) => setEditForm({ ...editForm, matchTime: e.target.value })} />
                </div>
              </div>

              {/* 소개글 */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  소개글
                  <span className="ml-2 text-xs font-normal text-slate-400">{editForm.description.length}/500</span>
                </label>
                <textarea className="input-field resize-none" rows={4}
                  placeholder="팀 소개, 경기 스타일, 원하는 상대팀 조건 등 (최소 10자)"
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} maxLength={500} />
              </div>

              {/* 원하는 수준 */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">원하는 상대 수준</label>
                <div className="flex gap-2">
                  {levels.map((l) => (
                    <button key={l} type="button"
                      onClick={() => setEditForm({ ...editForm, requiredLevel: l })}
                      className={`flex-1 py-2.5 rounded-xl border-2 font-semibold text-sm transition-all ${
                        editForm.requiredLevel === l ? 'border-accent bg-accent text-white' : 'border-slate-200 text-slate-600 hover:border-accent/50'
                      }`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-5 border-t border-slate-100">
              <button onClick={() => setEditingMatch(null)}
                className="flex-1 py-2.5 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold text-sm hover:bg-slate-50 transition-colors">
                취소
              </button>
              <button onClick={handleEditSave} disabled={savingMatch}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-70 flex items-center justify-center gap-2">
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
