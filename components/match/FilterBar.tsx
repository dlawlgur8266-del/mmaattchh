'use client'

import { cn } from '@/lib/utils'
import { SPORT_META } from '@/types/database'
import type { Sport, SkillLevel } from '@/types/database'

interface FilterBarProps {
  selectedSport: Sport | 'all'
  selectedLevel: SkillLevel | 'all'
  onSportChange: (sport: Sport | 'all') => void
  onLevelChange: (level: SkillLevel | 'all') => void
}

const sports: (Sport | 'all')[] = ['all', '축구', '풋살', '농구', 'e스포츠', '테니스']
const levels: (SkillLevel | 'all')[] = ['all', '초급', '중급', '고수']

export function FilterBar({ selectedSport, selectedLevel, onSportChange, onLevelChange }: FilterBarProps) {
  return (
    <div className="space-y-3">
      {/* Sport filters */}
      <div className="flex gap-2 flex-wrap">
        {sports.map((sport) => (
          <button
            key={sport}
            onClick={() => onSportChange(sport)}
            className={cn(
              'px-3 py-1.5 rounded-xl text-sm font-medium transition-all border',
              selectedSport === sport
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:border-primary/50 hover:text-primary'
            )}
          >
            {sport === 'all' ? '전체' : `${SPORT_META[sport].emoji} ${sport}`}
          </button>
        ))}
      </div>
      {/* Level filters */}
      <div className="flex gap-2 flex-wrap">
        {levels.map((level) => (
          <button
            key={level}
            onClick={() => onLevelChange(level)}
            className={cn(
              'px-3 py-1.5 rounded-xl text-sm font-medium transition-all border',
              selectedLevel === level
                ? 'bg-accent text-white border-accent shadow-sm'
                : 'bg-white text-slate-600 border-slate-200 hover:border-accent/50 hover:text-accent'
            )}
          >
            {level === 'all' ? '전체 수준' : level}
          </button>
        ))}
      </div>
    </div>
  )
}
