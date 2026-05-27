'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight, MapPin, Clock, Trophy, X } from 'lucide-react'
import { SPORT_META } from '@/types/database'
import type { MyMatch } from '@/types/database'

export interface ContestEvent {
  id: string
  contestName: string
  deadline: string   // YYYY-MM-DD
  category: string
  region: string
  teamSize: number
  isAuthor: boolean
}

interface CalendarProps {
  matches: MyMatch[]
  contestEvents?: ContestEvent[]
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']
const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}
function getFirstDayOfWeek(year: number, month: number): number {
  return new Date(year, month, 1).getDay()
}

export function MatchCalendar({ matches, contestEvents = [] }: CalendarProps) {
  const today = new Date()
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<number | null>(null)

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDow = getFirstDayOfWeek(viewYear, viewMonth)

  // 매치 날짜별 인덱싱
  const matchesByDay: Record<number, MyMatch[]> = {}
  for (const m of matches) {
    if (!m.matchDatetime) continue
    const d = new Date(m.matchDatetime)
    if (d.getFullYear() === viewYear && d.getMonth() === viewMonth) {
      const day = d.getDate()
      if (!matchesByDay[day]) matchesByDay[day] = []
      matchesByDay[day].push(m)
    }
  }

  // 공모전 마감일별 인덱싱
  const contestsByDay: Record<number, ContestEvent[]> = {}
  for (const c of contestEvents) {
    if (!c.deadline) continue
    const [y, mo, d] = c.deadline.split('-').map(Number)
    if (y === viewYear && mo - 1 === viewMonth) {
      if (!contestsByDay[d]) contestsByDay[d] = []
      contestsByDay[d].push(c)
    }
  }

  const selectedMatches  = selectedDay ? (matchesByDay[selectedDay]  || []) : []
  const selectedContests = selectedDay ? (contestsByDay[selectedDay] || []) : []

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11) }
    else setViewMonth((m) => m - 1)
    setSelectedDay(null)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0) }
    else setViewMonth((m) => m + 1)
    setSelectedDay(null)
  }

  const cells: (number | null)[] = [
    ...Array(firstDow).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  while (cells.length % 7 !== 0) cells.push(null)

  const isToday = (day: number) =>
    day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear()

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <p className="text-lg font-bold text-slate-800">{viewYear}년</p>
          <p className="text-sm text-slate-500">{MONTHS[viewMonth]}</p>
        </div>
        <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors">
          <ChevronRight size={18} />
        </button>
      </div>

      {/* 범례 */}
      <div className="flex items-center gap-4 text-xs text-slate-400 justify-center">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-accent inline-block" /> 스포츠 매치
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> 공모전 마감
        </span>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 text-center">
        {WEEKDAYS.map((d, i) => (
          <div key={d} className={`text-xs font-semibold py-1 ${i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-slate-400'}`}>
            {d}
          </div>
        ))}
      </div>

      {/* 달력 그리드 */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, idx) => {
          if (day === null) return <div key={`empty-${idx}`} />
          const hasMatch   = !!matchesByDay[day]
          const hasContest = !!contestsByDay[day]
          const isSelected = selectedDay === day
          const isSun = idx % 7 === 0
          const isSat = idx % 7 === 6

          return (
            <button
              key={day}
              onClick={() => setSelectedDay(isSelected ? null : day)}
              className={`
                relative flex flex-col items-center justify-start py-1.5 rounded-xl text-sm font-medium transition-all
                ${isSelected ? 'bg-primary text-white shadow-sm' : ''}
                ${isToday(day) && !isSelected ? 'bg-primary/10 text-primary font-bold' : ''}
                ${!isSelected && !isToday(day) ? (isSun ? 'text-red-400' : isSat ? 'text-blue-400' : 'text-slate-700') : ''}
                ${(hasMatch || hasContest) ? 'hover:bg-primary/20' : 'hover:bg-slate-50'}
              `}
            >
              <span>{day}</span>
              {/* 점 표시 */}
              {(hasMatch || hasContest) && (
                <div className="flex gap-0.5 mt-0.5">
                  {hasMatch && (
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-accent'}`} />
                  )}
                  {hasContest && (
                    <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-yellow-200' : 'bg-yellow-400'}`} />
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* 선택된 날짜의 일정 */}
      {selectedDay && (selectedMatches.length > 0 || selectedContests.length > 0) && (
        <div className="mt-2 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-slate-700">
              {viewMonth + 1}월 {selectedDay}일 일정
            </p>
            <button onClick={() => setSelectedDay(null)} className="p-1 text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          </div>

          {/* 스포츠 매치 */}
          {selectedMatches.map((m) => {
            const meta = SPORT_META[m.sport]
            const dt = m.matchDatetime ? new Date(m.matchDatetime) : null
            const timeStr = dt
              ? dt.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
              : null
            return (
              <div key={m.matchId} className="rounded-xl p-3.5 border-l-4 bg-slate-50 space-y-1.5" style={{ borderLeftColor: meta.color }}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{meta.emoji}</span>
                  <div>
                    <p className="font-bold text-slate-800 text-sm">
                      {m.teamName} <span className="font-normal text-slate-400 text-xs">vs</span>{' '}
                      <span className="text-primary">{m.opponentNickname}</span>
                    </p>
                    <p className="text-xs text-slate-400">{m.sport} · {m.matchSize}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                  {m.location && <span className="flex items-center gap-1"><MapPin size={11} /> {m.location}</span>}
                  {timeStr && <span className="flex items-center gap-1"><Clock size={11} /> {timeStr}</span>}
                </div>
              </div>
            )
          })}

          {/* 공모전 마감 */}
          {selectedContests.map((c) => (
            <div key={c.id} className="rounded-xl p-3.5 border-l-4 border-yellow-400 bg-yellow-50 space-y-1">
              <div className="flex items-center gap-2">
                <Trophy size={16} className="text-yellow-500 flex-shrink-0" />
                <p className="font-bold text-slate-800 text-sm leading-snug">{c.contestName}</p>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 ml-6">
                <span>{c.category}</span>
                <span>{c.region}</span>
                <span className={c.isAuthor ? 'text-yellow-600 font-medium' : 'text-slate-400'}>
                  {c.isAuthor ? '내가 모집' : '참여중'}
                </span>
              </div>
              <p className="text-xs font-semibold text-yellow-600 ml-6">📅 마감일: {c.deadline}</p>
            </div>
          ))}
        </div>
      )}

      {selectedDay && selectedMatches.length === 0 && selectedContests.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-3 bg-slate-50 rounded-xl">
          이날 일정이 없습니다
        </p>
      )}
    </div>
  )
}
