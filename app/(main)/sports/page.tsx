'use client'

import { useState, useEffect, useCallback } from 'react'
import { Clock, Users, ChevronLeft, ChevronRight, Loader2, User, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'

const RESERVATION_STATUS_URL = 'https://sports.chungbuk.ac.kr/cbnu_facilities3_2'
const RESERVATION_APPLY_URL  = 'https://sports.chungbuk.ac.kr/cbnu_facilities3_1'

const DEFAULT_HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]

const FACILITIES = [
  { id: 'main_field',   name: '대운동장',  sport: '축구' },
  { id: 'futsal_a',     name: '풋살장A',   sport: '풋살' },
  { id: 'futsal_b',     name: '풋살장B',   sport: '풋살' },
  { id: 'basketball_a', name: '농구장A',   sport: '농구' },
  { id: 'basketball_b', name: '농구장B',   sport: '농구' },
  { id: 'tennis_a',     name: '테니스장A', sport: '테니스' },
  { id: 'tennis_b',     name: '테니스장B', sport: '테니스' },
  { id: 'tennis_c',     name: '테니스장C', sport: '테니스' },
  { id: 'tennis_d',     name: '테니스장D', sport: '테니스' },
  { id: 'tennis_e',     name: '테니스장E', sport: '테니스' },
] as const

type FacilityId = typeof FACILITIES[number]['id']

interface Slot {
  id: string
  start_time: string
  end_time: string
  status: 'available' | 'reserved' | 'closed'
}

interface Partner {
  id: string
  user_id: string
  sports: string[]
  career_years: number
  is_pro: boolean
  intro: string | null
  gender: string | null
  age: number | null
  profiles: { id: string; nickname: string; avatar_url: string | null }
}

function formatDate(d: Date) {
  return d.toISOString().split('T')[0]
}

function pad2(n: number) { return String(n).padStart(2, '0') }

function makeDefaultSlots(): Slot[] {
  return DEFAULT_HOURS.map(h => ({
    id: `default-${h}`,
    start_time: `${pad2(h)}:00:00`,
    end_time: `${pad2(h + 1)}:00:00`,
    status: 'available' as const,
  }))
}

// ── 미니 캘린더 ─────────────────────────────────────────────────────────────
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

function MiniCalendar({ selected, onChange }: { selected: Date; onChange: (d: Date) => void }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [viewDate, setViewDate] = useState(() => {
    const d = new Date(selected)
    d.setDate(1)
    d.setHours(0, 0, 0, 0)
    return d
  })

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (Date | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const day = new Date(year, month, d)
    day.setHours(0, 0, 0, 0)
    cells.push(day)
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border p-4">
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
          className="p-1.5 rounded-full hover:bg-gray-100"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="font-semibold text-gray-800 text-sm">
          {year}년 {month + 1}월
        </span>
        <button
          onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
          className="p-1.5 rounded-full hover:bg-gray-100"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={`text-center text-xs font-medium py-1 ${
              i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-gray-500'
            }`}
          >
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, idx) => {
          if (!day) return <div key={`e-${idx}`} />
          const isPast = day < today
          const isToday = day.getTime() === today.getTime()
          const isSel = formatDate(day) === formatDate(selected)
          const dow = day.getDay()

          return (
            <button
              key={day.getDate()}
              onClick={() => !isPast && onChange(day)}
              disabled={isPast}
              className={[
                'aspect-square flex items-center justify-center rounded-full text-sm transition-colors mx-auto w-8 h-8',
                isPast ? 'text-gray-300 cursor-not-allowed' : 'cursor-pointer',
                isSel ? 'bg-blue-600 text-white font-semibold' : '',
                isToday && !isSel ? 'border-2 border-blue-400 text-blue-600 font-semibold' : '',
                !isPast && !isSel && !isToday
                  ? dow === 0
                    ? 'text-red-500 hover:bg-red-50'
                    : dow === 6
                    ? 'text-blue-500 hover:bg-blue-50'
                    : 'text-gray-700 hover:bg-gray-100'
                  : '',
              ].join(' ')}
            >
              {day.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── 메인 페이지 ──────────────────────────────────────────────────────────────
export default function SportsPage() {
  const [selectedFacility, setSelectedFacility] = useState<FacilityId>('futsal_a')
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  })
  const [slots, setSlots] = useState<Slot[]>([])
  const [partners, setPartners] = useState<Partner[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [loadingPartners, setLoadingPartners] = useState(false)
  const [showPartners, setShowPartners] = useState(false)
  const [lastCrawled, setLastCrawled] = useState<string | null>(null)
  const [usingDefault, setUsingDefault] = useState(false)

  const currentFacility = FACILITIES.find(f => f.id === selectedFacility)!

  const fetchSlots = useCallback(async () => {
    setLoadingSlots(true)
    try {
      const res = await fetch(
        `/api/sports/reservations?facility=${selectedFacility}&date=${formatDate(selectedDate)}`
      )
      if (!res.ok) throw new Error()
      const json = await res.json()
      const fetched: Slot[] = json.slots ?? []
      if (fetched.length > 0) {
        setSlots(fetched)
        setLastCrawled(json.last_crawled_at)
        setUsingDefault(false)
      } else {
        setSlots(makeDefaultSlots())
        setLastCrawled(null)
        setUsingDefault(true)
      }
    } catch {
      setSlots(makeDefaultSlots())
      setLastCrawled(null)
      setUsingDefault(true)
    } finally {
      setLoadingSlots(false)
    }
  }, [selectedFacility, selectedDate])

  useEffect(() => {
    fetchSlots()
    setShowPartners(false)
  }, [fetchSlots])

  // 1시간마다 자동 갱신
  useEffect(() => {
    const id = setInterval(fetchSlots, 60 * 60 * 1000)
    return () => clearInterval(id)
  }, [fetchSlots])

  async function fetchPartners() {
    setLoadingPartners(true)
    try {
      const res = await fetch(`/api/sports/partners?sport=${currentFacility.sport}`)
      if (!res.ok) throw new Error()
      const json = await res.json()
      setPartners(json)
    } catch {
      toast.error('파트너 목록을 불러오지 못했습니다.')
    } finally {
      setLoadingPartners(false)
    }
  }

  async function handleMatchRequest(partnerId: string) {
    const res = await fetch('/api/profile-matches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        receiver_id: partnerId,
        type: 'sports',
        message: `${formatDate(selectedDate)} ${currentFacility.name}에서 같이 운동해요!`,
      }),
    })
    if (res.ok) {
      toast.success('매칭 신청을 보냈습니다!')
    } else {
      const { error } = await res.json()
      toast.error(error ?? '신청에 실패했습니다.')
    }
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">스포츠 시설 예약 현황</h1>
        <a
          href={RESERVATION_APPLY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <ExternalLink size={13} />
          예약 신청
        </a>
      </div>

      {/* 시설 선택 */}
      <div>
        <p className="text-sm text-gray-500 mb-2">시설 선택</p>
        <div className="flex flex-wrap gap-2">
          {FACILITIES.map(f => (
            <button
              key={f.id}
              onClick={() => setSelectedFacility(f.id)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedFacility === f.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {f.name}
            </button>
          ))}
        </div>
      </div>

      {/* 캘린더 */}
      <MiniCalendar selected={selectedDate} onChange={setSelectedDate} />

      {/* 예약 현황 타임라인 */}
      <div className="bg-white rounded-2xl shadow-sm border p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-semibold text-gray-800">
              {currentFacility.name} ·{' '}
              {selectedDate.toLocaleDateString('ko-KR', {
                month: 'long',
                day: 'numeric',
                weekday: 'short',
              })}
            </h2>
            {usingDefault && (
              <p className="text-xs text-amber-500 mt-0.5">
                실시간 데이터 없음 — 공식 사이트에서 확인 후 신청하세요
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {lastCrawled && (
              <span className="text-xs text-gray-400">
                수집:{' '}
                {new Date(lastCrawled).toLocaleTimeString('ko-KR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            )}
            <a
              href={RESERVATION_STATUS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-500 hover:underline flex items-center gap-1"
            >
              <ExternalLink size={11} />
              현황 보기
            </a>
          </div>
        </div>

        {loadingSlots ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="space-y-2">
            {slots.map(slot => (
              <SlotRow key={slot.id} slot={slot} />
            ))}
          </div>
        )}
      </div>

      {/* 파트너 찾기 */}
      <div className="bg-white rounded-2xl shadow-sm border p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-gray-800">
              {currentFacility.name} 파트너 찾기
            </h2>
          </div>
          <button
            onClick={() => {
              setShowPartners(true)
              fetchPartners()
            }}
            className="text-sm px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium"
          >
            파트너 검색
          </button>
        </div>

        {!showPartners && (
          <p className="text-sm text-gray-400 text-center py-4">
            파트너 검색 버튼을 눌러 함께 운동할 파트너를 찾아보세요.
          </p>
        )}

        {showPartners && loadingPartners && (
          <div className="flex justify-center py-6">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        )}

        {showPartners && !loadingPartners && partners.length === 0 && (
          <div className="text-center py-6 text-gray-400 text-sm">
            <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
            현재 매칭 가능한 파트너가 없습니다.
          </div>
        )}

        {showPartners && !loadingPartners && partners.length > 0 && (
          <div className="space-y-3">
            {partners.map(p => (
              <div key={p.id} className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold flex-shrink-0">
                  {p.profiles?.nickname?.[0] ?? '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-900">{p.profiles?.nickname}</span>
                    {p.is_pro && (
                      <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">
                        선출
                      </span>
                    )}
                    {p.age && <span className="text-xs text-gray-500">{p.age}세</span>}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {p.sports.map(s => (
                      <span key={s} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">
                        {s}
                      </span>
                    ))}
                  </div>
                  {p.career_years > 0 && (
                    <p className="text-xs text-gray-500 mt-1">경력 {p.career_years}년</p>
                  )}
                  {p.intro && (
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{p.intro}</p>
                  )}
                </div>
                <button
                  onClick={() => handleMatchRequest(p.user_id)}
                  className="flex-shrink-0 px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  신청
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function SlotRow({ slot }: { slot: Slot }) {
  const start = slot.start_time.slice(0, 5)
  const end = slot.end_time.slice(0, 5)
  const timeLabel = `${start} ~ ${end}`

  if (slot.status === 'available') {
    return (
      <div className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-green-50 border border-green-200">
        <div className="flex items-center gap-2 text-sm font-medium text-green-700">
          <Clock className="w-4 h-4" />
          <span>{timeLabel}</span>
        </div>
        <a
          href={RESERVATION_APPLY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          <ExternalLink size={11} />
          예약 신청
        </a>
      </div>
    )
  }

  const isReserved = slot.status === 'reserved'
  return (
    <div
      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl ${
        isReserved ? 'bg-red-50 border border-red-100' : 'bg-gray-50'
      }`}
    >
      <div
        className={`flex items-center gap-2 text-sm font-medium ${
          isReserved ? 'text-red-400' : 'text-gray-400'
        }`}
      >
        <Clock className="w-4 h-4" />
        <span>{timeLabel}</span>
      </div>
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold cursor-not-allowed ${
          isReserved ? 'bg-red-100 text-red-500' : 'bg-gray-200 text-gray-500'
        }`}
      >
        예약 마감
      </span>
    </div>
  )
}
