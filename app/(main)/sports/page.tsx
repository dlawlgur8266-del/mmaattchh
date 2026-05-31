'use client'

import { useState, useEffect, useCallback } from 'react'
import { Clock, ChevronLeft, ChevronRight, Loader2, ExternalLink } from 'lucide-react'

const RESERVATION_STATUS_URL = 'https://sports.chungbuk.ac.kr/cbnu_facilities3_2'
const RESERVATION_APPLY_URL  = 'https://sports.chungbuk.ac.kr/cbnu_facilities3_1'


const FACILITIES = [
  { id: 'main_field',   name: '대운동장'  },
  { id: 'futsal_a',     name: '풋살장A'   },
  { id: 'futsal_b',     name: '풋살장B'   },
  { id: 'basketball_a', name: '농구장A'   },
  { id: 'basketball_b', name: '농구장B'   },
  { id: 'tennis_a',     name: '테니스장A' },
  { id: 'tennis_b',     name: '테니스장B' },
  { id: 'tennis_c',     name: '테니스장C' },
  { id: 'tennis_d',     name: '테니스장D' },
  { id: 'tennis_e',     name: '테니스장E' },
] as const

type FacilityId = typeof FACILITIES[number]['id']

interface Slot {
  id: string
  start_time: string
  end_time: string
  status: 'available' | 'reserved' | 'closed'
}

function formatDate(d: Date) {
  return d.toISOString().split('T')[0]
}

// ── 미니 캘린더 ─────────────────────────────────────────────────────────────
const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

function MiniCalendar({ selected, onChange }: { selected: Date; onChange: (d: Date) => void }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [viewDate, setViewDate] = useState(() => {
    const d = new Date(selected)
    d.setDate(1); d.setHours(0, 0, 0, 0)
    return d
  })

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (Date | null)[] = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    const day = new Date(year, month, d); day.setHours(0, 0, 0, 0)
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
        <span className="font-semibold text-gray-800 text-sm">{year}년 {month + 1}월</span>
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
    const d = new Date(); d.setHours(0, 0, 0, 0); return d
  })
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(false)
  const [lastCrawled, setLastCrawled] = useState<string | null>(null)
  const [isLive, setIsLive] = useState(false)
  const [dataUnavailable, setDataUnavailable] = useState(false)

  const currentFacility = FACILITIES.find(f => f.id === selectedFacility)!

  const fetchSlots = useCallback(async () => {
    setLoading(true)
    setSlots([])
    setIsLive(false)
    setDataUnavailable(false)
    try {
      const res = await fetch(
        `/api/sports/reservations?facility=${selectedFacility}&date=${formatDate(selectedDate)}`
      )
      if (!res.ok) throw new Error()
      const json = await res.json()
      const fetched: Slot[] = json.slots ?? []
      if (fetched.length > 0) {
        setSlots(fetched)
        setLastCrawled(json.last_crawled_at ?? null)
        setIsLive(json.source === 'live' || json.source === 'db')
      } else {
        setSlots([])
        setLastCrawled(null)
        setIsLive(false)
        setDataUnavailable(true)
      }
    } catch {
      setSlots([])
      setLastCrawled(null)
      setIsLive(false)
      setDataUnavailable(true)
    } finally {
      setLoading(false)
    }
  }, [selectedFacility, selectedDate])

  useEffect(() => { fetchSlots() }, [fetchSlots])

  // 1시간마다 자동 갱신
  useEffect(() => {
    const id = setInterval(fetchSlots, 60 * 60 * 1000)
    return () => clearInterval(id)
  }, [fetchSlots])

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">스포츠 시설 예약 현황</h1>

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

      {/* 예약 현황 */}
      <div className="bg-white rounded-2xl shadow-sm border p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-semibold text-gray-800">
              {currentFacility.name} ·{' '}
              {selectedDate.toLocaleDateString('ko-KR', {
                month: 'long', day: 'numeric', weekday: 'short',
              })}
            </h2>
            {isLive && lastCrawled && (
              <p className="text-xs text-green-500 mt-0.5">
                실시간 데이터 수신 완료
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {lastCrawled && (
              <span className="text-xs text-gray-400">
                수집:{' '}
                {new Date(lastCrawled).toLocaleTimeString('ko-KR', {
                  hour: '2-digit', minute: '2-digit',
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

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : dataUnavailable ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-sm text-gray-500">
              실시간 예약 현황을 불러올 수 없습니다.
            </p>
            <p className="text-xs text-gray-400">
              공식 사이트에서 직접 예약 가능 시간을 확인해주세요.
            </p>
            <a
              href={RESERVATION_STATUS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              <ExternalLink size={14} />
              공식 사이트에서 예약 현황 확인
            </a>
          </div>
        ) : (
          <div className="space-y-2">
            {slots.map(slot => (
              <SlotRow key={slot.id} slot={slot} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function SlotRow({ slot }: { slot: Slot }) {
  const start = slot.start_time.slice(0, 5)
  const end   = slot.end_time.slice(0, 5)
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
