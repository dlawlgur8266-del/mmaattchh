'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, UserPlus, CheckCircle, XCircle, Trophy, Swords } from 'lucide-react'
import toast from 'react-hot-toast'
import type { SkillLevel } from '@/types/database'

interface FormState {
  username: string
  password: string
  passwordConfirm: string
  fullName: string
  nickname: string
  studentId: string
  skillLevel: SkillLevel     // 스포츠 실력
  contestCount: number       // 공모전 출전 횟수 (0~10)
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
    skillLevel: '초급',
    contestCount: 0,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checkLoading, setCheckLoading] = useState({ username: false, nickname: false })
  const [checked, setChecked] = useState<CheckState>({ username: null, nickname: null })
  const [errors, setErrors] = useState<Partial<Record<keyof FormState | 'general', string>>>({})

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
    form.studentId.length === 10

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
