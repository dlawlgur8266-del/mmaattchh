'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, MapPin, Users, ChevronLeft, ChevronRight, Loader2, User, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'

const RESERVATION_STATUS_URL = 'https://sports.chungbuk.ac.kr/cbnu_facilities3_2'
const RESERVATION_APPLY_URL  = 'https://sports.chungbuk.ac.kr/cbnu_facilities3_1'

const FACILITIES = [
  { id: 'main_field',   name: '종합운동장', sport: '축구' },
  { id: 'futsal_a',     name: '풋살장 A',   sport: '풋살' },
  { id: 'futsal_b',     name: '풋살장 B',   sport: '풋살' },
  { id: 'basketball_a', name: '농구장 A',   sport: '농구' },
  { id: 'basketball_b', name: '농구장 B',   sport: '농구' },
  { id: 'tennis_a',     name: '테니스 A',   sport: '테니스' },
  { id: 'tennis_b',     name: '테니스 B',   sport: '테니스' },
  { id: 'tennis_c',     name: '테니스 C',   sport: '테니스' },
  { id: 'tennis_d',     name: '테니스 D',   sport: '테니스' },
  { id: 'tennis_e',     name: '테니스 E',   sport: '테니스' },
  { id: 'small_field',  name: '소운동장',   sport: '축구' },
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

function addDays(d: Date, n: number) {
  const copy = new Date(d)
  copy.setDate(copy.getDate() + n)
  return copy
}

export default function SportsPage() {
  const [selectedFacility, setSelectedFacility] = useState<FacilityId>('futsal_a')
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [slots, setSlots] = useState<Slot[]>([])
  const [partners, setPartners] = useState<Partner[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [loadingPartners, setLoadingPartners] = useState(false)
  const [showPartners, setShowPartners] = useState(false)
  const [lastCrawled, setLastCrawled] = useState<string | null>(null)

  const currentFacility = FACILITIES.find(f => f.id === selectedFacility)!

  useEffect(() => {
    fetchSlots()
    setShowPartners(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFacility, selectedDate])

  async function fetchSlots() {
    setLoadingSlots(true)
    setSlots([])
    try {
      const res = await fetch(
        `/api/sports/reservations?facility=${selectedFacility}&date=${formatDate(selectedDate)}`
      )
      if (!res.ok) throw new Error()
      const json = await res.json()
      setSlots(json.slots ?? [])
      setLastCrawled(json.last_crawled_at)
    } catch {
      // 테이블 미생성이거나 데이터 없는 경우 — 토스트 없이 빈 상태 처리
      setSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

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
          href={RESERVATION_STATUS_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <ExternalLink size={13} />
          충북대 예약 사이트
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

      {/* 날짜 선택 */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSelectedDate(d => addDays(d, -1))}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Calendar className="w-5 h-5 text-blue-600" />
          {selectedDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
        </div>
        <button
          onClick={() => setSelectedDate(d => addDays(d, 1))}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* 예약 신청 / 예약 현황 타임라인 */}
      <div className="bg-white rounded-2xl shadow-sm border p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800">{currentFacility.name} 예약 신청</h2>
          <div className="flex items-center gap-3">
            {lastCrawled && (
              <span className="text-xs text-gray-400">
                수집: {new Date(lastCrawled).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
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
        ) : slots.length === 0 ? (
          /* DB 데이터 없을 때: 공식 사이트 안내 */
          <div className="text-center py-8 space-y-3">
            <MapPin className="w-8 h-8 mx-auto text-gray-300" />
            <div>
              <p className="text-sm font-medium text-gray-600">예약 현황 정보를 불러오지 못했습니다.</p>
              <p className="text-xs text-gray-400 mt-1">
                충북대 스포츠 시설 예약 시스템에서 직접 확인하세요.
              </p>
            </div>
            <a
              href={RESERVATION_STATUS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors"
            >
              <ExternalLink size={14} />
              예약 현황 확인하기
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
                      <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">선출</span>
                    )}
                    {p.age && <span className="text-xs text-gray-500">{p.age}세</span>}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {p.sports.map(s => (
                      <span key={s} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">{s}</span>
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
  const timeLabel = `${slot.start_time} ~ ${slot.end_time}`

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
          예약 가능
        </a>
      </div>
    )
  }

  // reserved 또는 closed — 클릭 불가
  const isReserved = slot.status === 'reserved'
  return (
    <div className={`w-full flex items-center justify-between px-4 py-3 rounded-xl ${isReserved ? 'bg-red-50 border border-red-100' : 'bg-gray-50'}`}>
      <div className={`flex items-center gap-2 text-sm font-medium ${isReserved ? 'text-red-400' : 'text-gray-400'}`}>
        <Clock className="w-4 h-4" />
        <span>{timeLabel}</span>
      </div>
      <span className={`px-3 py-1 rounded-full text-xs font-semibold cursor-not-allowed ${isReserved ? 'bg-red-100 text-red-500' : 'bg-gray-200 text-gray-500'}`}>
        예약 마감
      </span>
    </div>
  )
}
