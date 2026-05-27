'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, UserPlus, CheckCircle, XCircle, Trophy, Swords, GraduationCap, ChevronDown, Search, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import type { SkillLevel } from '@/types/database'
import { CBNU_DEPARTMENTS } from '@/data/departments'

interface FormState {
  username: string
  password: string
  passwordConfirm: string
  fullName: string
  nickname: string
  studentId: string
  department: string
  skillLevel: SkillLevel
  contestCount: number
}

interface CheckState {
  username: boolean | null
  nickname: boolean | null
}

const CONTEST_COUNTS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

export default function SignupPage() {
  const router = useRouter()
  const [form, setForm] = useState<FormState>({
    username: '',
    password: '',
    passwordConfirm: '',
    fullName: '',
    nickname: '',
    studentId: '',
    department: '',
    skillLevel: '초급',
    contestCount: 0,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checkLoading, setCheckLoading] = useState({ username: false, nickname: false })
  const [checked, setChecked] = useState<CheckState>({ username: null, nickname: null })
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | 'general', string>>>({})
  const [privacyConsent, setPrivacyConsent] = useState(false)

  // 학과 검색 드롭다운
  const [deptSearch, setDeptSearch] = useState('')
  const [showDeptDropdown, setShowDeptDropdown] = useState(false)
  const deptRef = useRef<HTMLDivElement>(null)

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (deptRef.current && !deptRef.current.contains(e.target as Node)) {
        setShowDeptDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // 검색어로 필터링된 학과 목록
  const filteredColleges = CBNU_DEPARTMENTS.map((col) => ({
    college: col.college,
    departments: col.departments.filter((d) =>
      d.includes(deptSearch) || col.college.includes(deptSearch)
    ),
  })).filter((col) => col.departments.length > 0)

  const validate = () => {
    const newErrors: Partial<Record<keyof FormState | 'general', string>> = {}
    if (!/^[a-z0-9]{4,20}$/.test(form.username)) {
      newErrors.username = '영문 소문자와 숫자, 4~20자로 입력해주세요.'
    }
    if (form.password.length < 8 || !/(?=.*[a-zA-Z])(?=.*[0-9])/.test(form.password)) {
      newErrors.password = '영문과 숫자를 포함하여 8자 이상 입력해주세요.'
    }
    if (form.password !== form.passwordConfirm) {
      newErrors.passwordConfirm = '비밀번호가 일치하지 않습니다.'
    }
    if (!/^[가-힣]{2,5}$/.test(form.fullName)) {
      newErrors.fullName = '한글 2~5자로 입력해주세요.'
    }
    if (form.nickname.length < 2 || form.nickname.length > 10) {
      newErrors.nickname = '2~10자로 입력해주세요.'
    }
    if (!/^\d{10}$/.test(form.studentId)) {
      newErrors.studentId = '학번은 10자리 숫자여야 합니다. (예: 2024123456)'
    }
    if (!form.department) {
      newErrors.department = '학과를 선택해주세요.'
    }
    return newErrors
  }

  const checkDuplicate = async (field: 'username' | 'nickname') => {
    const value = form[field]
    if (!value) return
    setCheckLoading((prev) => ({ ...prev, [field]: true }))
    try {
      const res = await fetch(
        `/api/auth/check-${field === 'username' ? 'username' : 'nickname'}?value=${value}`
      )
      const data = await res.json()
      setChecked((prev) => ({ ...prev, [field]: !data.exists }))
      if (data.exists) {
        toast.error(`이미 사용 중인 ${field === 'username' ? '아이디' : '닉네임'}입니다.`)
      } else {
        toast.success(`사용 가능한 ${field === 'username' ? '아이디' : '닉네임'}입니다.`)
      }
    } finally {
      setCheckLoading((prev) => ({ ...prev, [field]: false }))
    }
  }

  const handleChange = (field: keyof FormState, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (field === 'username') setChecked((prev) => ({ ...prev, username: null }))
    if (field === 'nickname') setChecked((prev) => ({ ...prev, nickname: null }))
    if (errors[field as keyof FormState]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const isFormValid =
    form.username.length >= 4 &&
    form.password.length >= 8 &&
    form.password === form.passwordConfirm &&
    form.fullName.length >= 2 &&
    form.nickname.length >= 2 &&
    form.studentId.length === 10 &&
    !!form.department &&
    privacyConsent

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const validationErrors = validate()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    if (!checked.username || !checked.nickname) {
      toast.error('아이디와 닉네임 중복 확인을 완료해주세요.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username,
          password: form.password,
          fullName: form.fullName,
          nickname: form.nickname,
          studentId: form.studentId,
          department: form.department,
          skillLevel: form.skillLevel,
          contestCount: form.contestCount,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrors({ general: data.error || '회원가입에 실패했습니다.' })
        return
      }
      toast.success('회원가입이 완료되었습니다!')
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const CheckIcon = ({ field }: { field: 'username' | 'nickname' }) => {
    if (checked[field] === null) return null
    return checked[field] ? (
      <CheckCircle size={16} className="text-green-500" />
    ) : (
      <XCircle size={16} className="text-red-500" />
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-800 mb-1">회원가입</h2>
      <p className="text-slate-500 text-sm mb-6">충북대 학번으로 가입하세요</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 아이디 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">아이디</label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                className="input-field pr-8"
                placeholder="영문 소문자+숫자, 4~20자"
                value={form.username}
                onChange={(e) => handleChange('username', e.target.value)}
                maxLength={20}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <CheckIcon field="username" />
              </div>
            </div>
            <button
              type="button"
              onClick={() => checkDuplicate('username')}
              disabled={!form.username || checkLoading.username}
              className="px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              중복확인
            </button>
          </div>
          {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
        </div>

        {/* 비밀번호 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">비밀번호</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              className="input-field pr-12"
              placeholder="영문+숫자 포함 8자 이상"
              value={form.password}
              onChange={(e) => handleChange('password', e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
        </div>

        {/* 비밀번호 확인 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">비밀번호 확인</label>
          <div className="relative">
            <input
              type={showPasswordConfirm ? 'text' : 'password'}
              className="input-field pr-12"
              placeholder="비밀번호를 다시 입력하세요"
              value={form.passwordConfirm}
              onChange={(e) => handleChange('passwordConfirm', e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            >
              {showPasswordConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {form.passwordConfirm && form.password !== form.passwordConfirm && (
            <p className="text-red-500 text-xs mt-1">비밀번호가 일치하지 않습니다.</p>
          )}
          {form.passwordConfirm && form.password === form.passwordConfirm && (
            <p className="text-green-500 text-xs mt-1">비밀번호가 일치합니다.</p>
          )}
        </div>

        {/* 이름 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">이름(실명)</label>
          <input
            type="text"
            className="input-field"
            placeholder="한글 2~5자"
            value={form.fullName}
            onChange={(e) => handleChange('fullName', e.target.value)}
            maxLength={5}
          />
          {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
        </div>

        {/* 닉네임 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">닉네임</label>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                className="input-field pr-8"
                placeholder="2~10자"
                value={form.nickname}
                onChange={(e) => handleChange('nickname', e.target.value)}
                maxLength={10}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <CheckIcon field="nickname" />
              </div>
            </div>
            <button
              type="button"
              onClick={() => checkDuplicate('nickname')}
              disabled={!form.nickname || checkLoading.nickname}
              className="px-3 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-medium transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              중복확인
            </button>
          </div>
          {errors.nickname && <p className="text-red-500 text-xs mt-1">{errors.nickname}</p>}
        </div>

        {/* ─── 학과 선택 (검색 드롭다운) ─── */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-1.5">
            <GraduationCap size={15} className="text-primary" />
            소속 학과
          </label>
          <div className="relative" ref={deptRef}>
            {/* 선택된 학과 표시 / 검색 입력 */}
            <button
              type="button"
              onClick={() => {
                setShowDeptDropdown((prev) => !prev)
                setDeptSearch('')
              }}
              className={`input-field w-full text-left flex items-center justify-between pr-10 ${
                form.department ? 'text-slate-800' : 'text-slate-400'
              }`}
            >
              <span className="truncate">
                {form.department || '학과를 선택해주세요'}
              </span>
              <ChevronDown
                size={16}
                className={`absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-transform ${
                  showDeptDropdown ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* 드롭다운 */}
            {showDeptDropdown && (
              <div className="absolute z-50 mt-1 w-full bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
                {/* 검색창 */}
                <div className="p-2 border-b border-slate-100">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:border-primary"
                      placeholder="학과/단과대학 검색..."
                      value={deptSearch}
                      onChange={(e) => setDeptSearch(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>

                {/* 학과 목록 */}
                <div className="max-h-56 overflow-y-auto">
                  {filteredColleges.length === 0 ? (
                    <p className="text-center text-slate-400 text-sm py-4">검색 결과가 없습니다</p>
                  ) : (
                    filteredColleges.map((col) => (
                      <div key={col.college}>
                        {/* 단과대학 헤더 */}
                        <div className="px-3 py-1.5 text-xs font-bold text-slate-400 bg-slate-50 sticky top-0">
                          {col.college}
                        </div>
                        {/* 학과 목록 */}
                        {col.departments.map((dept) => (
                          <button
                            key={dept}
                            type="button"
                            onClick={() => {
                              handleChange('department', dept)
                              setShowDeptDropdown(false)
                              setDeptSearch('')
                            }}
                            className={`w-full text-left px-4 py-2 text-sm hover:bg-primary/5 transition-colors ${
                              form.department === dept
                                ? 'text-primary font-semibold bg-primary/5'
                                : 'text-slate-700'
                            }`}
                          >
                            {dept}
                          </button>
                        ))}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department}</p>}
          {form.department && (
            <p className="text-green-500 text-xs mt-1">✓ {form.department}</p>
          )}
        </div>

        {/* 학번 */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">학번</label>
          <input
            type="text"
            inputMode="numeric"
            className="input-field"
            placeholder="10자리 학번 (예: 2024123456)"
            value={form.studentId}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 10)
              handleChange('studentId', val)
            }}
          />
          {errors.studentId && <p className="text-red-500 text-xs mt-1">{errors.studentId}</p>}
          {form.studentId.length === 10 && !errors.studentId && (
            <p className="text-green-500 text-xs mt-1">✓ 올바른 형식의 학번입니다.</p>
          )}
        </div>

        {/* ─── 스포츠 실력 ─── */}
        <div className="border border-slate-100 rounded-2xl p-4 space-y-3 bg-slate-50">
          <div className="flex items-center gap-2">
            <Swords size={16} className="text-primary" />
            <p className="text-sm font-semibold text-slate-700">스포츠 실력 수준</p>
          </div>
          <div className="flex gap-2">
            {(['초급', '중급', '고수'] as SkillLevel[]).map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => handleChange('skillLevel', level)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors border-2 ${
                  form.skillLevel === level
                    ? 'bg-primary text-white border-primary'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-primary/50'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400">축구·풋살·농구·e스포츠 등 스포츠 매치에 사용됩니다</p>
        </div>

        {/* ─── 공모전 출전 횟수 ─── */}
        <div className="border border-slate-100 rounded-2xl p-4 space-y-3 bg-amber-50">
          <div className="flex items-center gap-2">
            <Trophy size={16} className="text-yellow-600" />
            <p className="text-sm font-semibold text-slate-700">공모전 출전 횟수</p>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {CONTEST_COUNTS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => handleChange('contestCount', n)}
                className={`py-2 rounded-xl text-sm font-semibold transition-colors border-2 ${
                  form.contestCount === n
                    ? 'bg-yellow-500 text-white border-yellow-500'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-yellow-400'
                }`}
              >
                {n}회
              </button>
            ))}
            <button
              type="button"
              onClick={() => handleChange('contestCount', 10)}
              className={`py-2 rounded-xl text-sm font-semibold transition-colors border-2 ${
                form.contestCount === 10
                  ? 'bg-yellow-500 text-white border-yellow-500'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-yellow-400'
              }`}
            >
              10회+
            </button>
          </div>
          <p className="text-xs text-slate-500">현재까지 참가한 공모전 횟수를 선택해주세요</p>
        </div>

        {/* ─── 개인정보보호법 동의 ─── */}
        <div className="border border-slate-200 rounded-2xl overflow-hidden">
          <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
            <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <Shield size={14} className="text-primary" />
              개인정보 수집 및 이용 동의
              <span className="text-red-500 text-xs font-normal">(필수)</span>
            </p>
          </div>
          <div className="p-4 space-y-2 max-h-44 overflow-y-auto text-xs text-slate-500 leading-relaxed bg-white">
            <p className="font-semibold text-slate-700">■ 개인정보 수집·이용에 관한 사항</p>
            <p>충북 매치(CHUNGBUK-MATCH)는 대한민국 개인정보보호법에 따라 이용자의 개인정보를 안전하게 관리합니다.</p>
            <p className="font-semibold text-slate-700 mt-2">1. 수집하는 개인정보 항목</p>
            <p>· 필수: 아이디, 비밀번호, 성명(실명), 닉네임, 학번, 소속 학과</p>
            <p>· 선택: 스포츠 실력 수준, 공모전 출전 횟수</p>
            <p className="font-semibold text-slate-700 mt-2">2. 개인정보의 수집·이용 목적</p>
            <p>· 회원제 서비스 제공 및 본인 확인</p>
            <p>· 스포츠 매치 및 공모전 팀 매칭 서비스 제공</p>
            <p>· 서비스 이용 통계 및 서비스 개선</p>
            <p className="font-semibold text-slate-700 mt-2">3. 개인정보의 보유·이용 기간</p>
            <p>회원 탈퇴 시 즉시 파기합니다. 단, 관련 법령에 의해 보존이 필요한 경우 해당 법령에서 정한 기간 동안 보관됩니다.</p>
            <p className="font-semibold text-slate-700 mt-2">4. 동의 거부 권리 및 불이익</p>
            <p>개인정보 수집·이용에 동의하지 않을 수 있으나, 동의하지 않을 경우 회원가입 및 서비스 이용이 제한됩니다.</p>
            <p className="font-semibold text-slate-700 mt-2">■ 관계 법령</p>
            <p>개인정보보호법 제15조(개인정보의 수집·이용), 제16조(개인정보의 수집 제한), 제22조(동의를 받는 방법)</p>
          </div>
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={privacyConsent}
                onChange={(e) => setPrivacyConsent(e.target.checked)}
                className="w-4 h-4 accent-primary"
              />
              <span className="text-sm font-semibold text-slate-700">
                위 개인정보 수집·이용 내용을 확인하였으며,{' '}
                <span className="text-primary">동의합니다</span>
              </span>
            </label>
          </div>
        </div>

        {errors.general && (
          <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{errors.general}</p>
        )}

        <button
          type="submit"
          disabled={loading || !isFormValid}
          className="btn-accent w-full py-3 flex items-center justify-center gap-2 mt-2"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <UserPlus size={18} />
              가입하기
            </>
          )}
        </button>
      </form>

      <p className="text-center text-sm text-slate-500 mt-6">
        이미 계정이 있으신가요?{' '}
        <Link href="/login" className="text-primary font-semibold hover:underline">
          로그인
        </Link>
      </p>
    </div>
  )
}
