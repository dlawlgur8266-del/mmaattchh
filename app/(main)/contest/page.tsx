'use client'

import { useState, useEffect } from 'react'
import { Trophy, MapPin, Calendar, Users, ExternalLink, Star } from 'lucide-react'
import {
  CONTESTS,
  CONTEST_CATEGORIES,
  CATEGORY_COLORS,
  getContestsByCategory,
  getDaysUntilDeadline,
  type ContestCategory,
  type ContestRegion,
} from '@/data/contests'
import { useRouter } from 'next/navigation'

const REGIONS: ContestRegion[] = ['충청북도', '충청남도', '세종특별자치시', '대전광역시']

const REGION_META: Record<ContestRegion, { color: string; bg: string; emoji: string }> = {
  충청북도:    { color: '#1D4ED8', bg: '#DBEAFE', emoji: '🏔️' },
  충청남도:    { color: '#0F766E', bg: '#CCFBF1', emoji: '🌊' },
  세종특별자치시: { color: '#7C3AED', bg: '#EDE9FE', emoji: '🏛️' },
  대전광역시:  { color: '#B45309', bg: '#FEF3C7', emoji: '⚗️' },
}

const FAVORITES_KEY = 'contest_favorites'

export default function ContestPage() {
  const router = useRouter()
  const [selectedRegion, setSelectedRegion] = useState<ContestRegion | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<ContestCategory>('전체')
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())

  const filteredContests = selectedRegion
    ? getContestsByCategory(selectedRegion, selectedCategory)
    : []

  const favoriteContests = CONTESTS.filter((c) => favoriteIds.has(c.id))

  useEffect(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_KEY)
      if (stored) setFavoriteIds(new Set(JSON.parse(stored)))
    } catch {}
  }, [])

  const toggleFavorite = (id: string) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      try {
        localStorage.setItem(FAVORITES_KEY, JSON.stringify([...next]))
      } catch {}
      return next
    })
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Trophy className="text-yellow-500" size={24} />
            <h1 className="text-2xl font-bold text-slate-800">공모전</h1>
          </div>
          <p className="text-slate-500 text-sm mt-0.5">충청북도·충청남도·세종·대전 공모전을 찾아보세요</p>
        </div>
        <button
          onClick={() => router.push('/contest/write')}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-xl font-medium text-sm hover:bg-yellow-600 transition-colors shadow-sm"
        >
          <Users size={16} />
          <span className="hidden sm:inline">팀원 모집</span>
        </button>
      </div>

      {/* ── 즐겨찾기 섹션 ── */}
      <div>
        <div className="flex items-center gap-1.5 mb-3">
          <Star size={14} className="text-yellow-500 fill-yellow-500" />
          <p className="text-sm font-semibold text-slate-600">즐겨찾기</p>
          {favoriteContests.length > 0 && (
            <span className="ml-1 text-yellow-600 font-bold text-sm">{favoriteContests.length}개</span>
          )}
        </div>

        {favoriteContests.length === 0 ? (
          <div className="bg-slate-50 rounded-2xl p-6 text-center">
            <Star size={32} className="mx-auto mb-2 text-slate-300" />
            <p className="text-sm text-slate-500 font-medium">즐겨찾기한 공모전이 없습니다</p>
            <p className="text-xs text-slate-400 mt-1">아래 공모전 목록에서 ★ 버튼을 눌러 추가하세요</p>
          </div>
        ) : (
          <div className="space-y-3">
            {favoriteContests.map((contest) => {
              const daysLeft = getDaysUntilDeadline(contest.deadline)
              const colors = CATEGORY_COLORS[contest.category]
              const isUrgent = daysLeft >= 0 && daysLeft <= 7
              const isExpired = daysLeft < 0

              return (
                <div key={contest.id} className="card p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-wrap gap-1.5">
                      <span
                        className="px-2.5 py-1 rounded-full text-xs font-semibold"
                        style={{ backgroundColor: colors.bg, color: colors.color }}
                      >
                        {contest.category}
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                        {contest.region}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold whitespace-nowrap px-2.5 py-1 rounded-full ${
                          isExpired
                            ? 'bg-slate-100 text-slate-400'
                            : isUrgent
                            ? 'bg-red-100 text-red-600'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {isExpired ? '마감' : `D-${daysLeft}`}
                      </span>
                      <button
                        onClick={() => toggleFavorite(contest.id)}
                        className="p-1 rounded-lg hover:bg-yellow-50 transition-colors"
                        title="즐겨찾기 삭제"
                      >
                        <Star size={16} className="text-yellow-500 fill-yellow-500" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-bold text-slate-800 mt-2 text-base leading-snug">
                    {contest.name}
                  </h3>
                  <p className="text-sm text-slate-500 mt-0.5">{contest.organizer}</p>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-slate-400" />
                      <span>마감: <strong className="text-slate-700">{contest.deadline}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users size={12} className="text-slate-400" />
                      <span>팀원: <strong className="text-slate-700">최대 {contest.maxTeamSize}명</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 col-span-2">
                      <MapPin size={12} className="text-slate-400" />
                      <span>{contest.region}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">{contest.description}</p>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <ExternalLink size={10} />
                      {contest.source === 'all-con' ? '올콘 (all-con.co.kr)' : '링커리어 (linkareer.com)'}
                    </span>
                    {!isExpired && (
                      <button
                        onClick={() =>
                          router.push(
                            `/contest/write?name=${encodeURIComponent(contest.name)}&category=${encodeURIComponent(contest.category)}&region=${encodeURIComponent(contest.region)}&deadline=${contest.deadline}`
                          )
                        }
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500 text-white text-xs font-semibold rounded-lg hover:bg-yellow-600 transition-colors"
                      >
                        <Users size={11} />
                        팀원 모집
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <hr className="border-slate-100" />

      {/* ── 지역별 공모전 (정적 데이터) ── */}
      <div>
        <p className="text-sm font-semibold text-slate-600 mb-3">📍 지역별 공모전</p>
        <div className="grid grid-cols-2 gap-3">
          {REGIONS.map((region) => {
            const meta = REGION_META[region]
            const count = CONTESTS.filter((c) => c.region === region).length
            return (
              <button
                key={region}
                onClick={() => {
                  setSelectedRegion(region)
                  setSelectedCategory('전체')
                }}
                className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all text-left ${
                  selectedRegion === region
                    ? 'border-blue-500 shadow-md'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
                style={selectedRegion === region ? { backgroundColor: meta.bg } : {}}
              >
                <span className="text-3xl">{meta.emoji}</span>
                <div>
                  <p className="font-bold text-slate-800 text-sm">{region}</p>
                  <p className="text-xs text-slate-500 mt-0.5">공모전 {count}개</p>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* 지역 선택 후 */}
      {selectedRegion && (
        <>
          {/* 분야 필터 */}
          <div>
            <p className="text-sm font-semibold text-slate-600 mb-3">🏷️ 공모전 분야</p>
            <div className="flex gap-2 flex-wrap">
              {CONTEST_CATEGORIES.map((cat) => {
                const colors = CATEGORY_COLORS[cat]
                const isSelected = selectedCategory === cat
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all border ${
                      isSelected
                        ? 'border-transparent shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                    }`}
                    style={
                      isSelected
                        ? { backgroundColor: colors.bg, color: colors.color, borderColor: colors.color }
                        : {}
                    }
                  >
                    {cat}
                  </button>
                )
              })}
            </div>
          </div>

          {/* 공모전 목록 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-600">
                {selectedRegion} · {selectedCategory === '전체' ? '전체 분야' : selectedCategory}
                <span className="ml-2 text-primary font-bold">{filteredContests.length}개</span>
              </p>
              <p className="text-xs text-slate-400">마감일 기준 정렬</p>
            </div>

            {filteredContests.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Trophy size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">해당 분야의 공모전이 없습니다</p>
                <p className="text-sm mt-1">다른 분야를 선택해보세요</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredContests.map((contest) => {
                  const daysLeft = getDaysUntilDeadline(contest.deadline)
                  const colors = CATEGORY_COLORS[contest.category]
                  const isUrgent = daysLeft <= 7
                  const isExpired = daysLeft < 0
                  const isFav = favoriteIds.has(contest.id)

                  return (
                    <div
                      key={contest.id}
                      className="card p-4 hover:shadow-md transition-shadow"
                    >
                      {/* 헤더 */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap gap-1.5">
                          <span
                            className="px-2.5 py-1 rounded-full text-xs font-semibold"
                            style={{ backgroundColor: colors.bg, color: colors.color }}
                          >
                            {contest.category}
                          </span>
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600">
                            {contest.region}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-xs font-bold whitespace-nowrap px-2.5 py-1 rounded-full ${
                              isExpired
                                ? 'bg-slate-100 text-slate-400'
                                : isUrgent
                                ? 'bg-red-100 text-red-600'
                                : 'bg-green-100 text-green-700'
                            }`}
                          >
                            {isExpired ? '마감' : `D-${daysLeft}`}
                          </span>
                          <button
                            onClick={() => toggleFavorite(contest.id)}
                            className="p-1 rounded-lg hover:bg-yellow-50 transition-colors"
                            title={isFav ? '즐겨찾기 삭제' : '즐겨찾기 추가'}
                          >
                            <Star
                              size={16}
                              className={isFav ? 'text-yellow-500 fill-yellow-500' : 'text-slate-300'}
                              fill={isFav ? 'currentColor' : 'none'}
                            />
                          </button>
                        </div>
                      </div>

                      {/* 공모전명 */}
                      <h3 className="font-bold text-slate-800 mt-2 text-base leading-snug">
                        {contest.name}
                      </h3>
                      <p className="text-sm text-slate-500 mt-0.5">{contest.organizer}</p>

                      {/* 상세 정보 */}
                      <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={12} className="text-slate-400" />
                          <span>마감: <strong className="text-slate-700">{contest.deadline}</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users size={12} className="text-slate-400" />
                          <span>팀원: <strong className="text-slate-700">최대 {contest.maxTeamSize}명</strong></span>
                        </div>
                        <div className="flex items-center gap-1.5 col-span-2">
                          <MapPin size={12} className="text-slate-400" />
                          <span>{contest.region}</span>
                        </div>
                      </div>

                      {/* 설명 */}
                      <p className="text-xs text-slate-500 mt-2 line-clamp-2">{contest.description}</p>

                      {/* 출처 & 팀원 모집 버튼 */}
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <ExternalLink size={10} />
                          {contest.source === 'all-con' ? '올콘 (all-con.co.kr)' : '링커리어 (linkareer.com)'}
                        </span>
                        {!isExpired && (
                          <button
                            onClick={() =>
                              router.push(
                                `/contest/write?name=${encodeURIComponent(contest.name)}&category=${encodeURIComponent(contest.category)}&region=${encodeURIComponent(contest.region)}&deadline=${contest.deadline}`
                              )
                            }
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500 text-white text-xs font-semibold rounded-lg hover:bg-yellow-600 transition-colors"
                          >
                            <Users size={11} />
                            팀원 모집
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* 지역 미선택 시 안내 */}
      {!selectedRegion && (
        <div className="text-center py-8 text-slate-400">
          <Trophy size={40} className="mx-auto mb-3 text-yellow-400 opacity-70" />
          <p className="font-semibold text-slate-600">지역을 선택해주세요</p>
          <p className="text-sm mt-1">충청북도·충청남도·세종·대전 중 선택하면 공모전 목록이 표시됩니다</p>
        </div>
      )}
    </div>
  )
}
