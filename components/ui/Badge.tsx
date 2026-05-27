import { cn } from '@/lib/utils'
import { SPORT_META, LEVEL_META } from '@/types/database'
import type { Sport, SkillLevel, MatchStatus } from '@/types/database'

export function SportBadge({ sport }: { sport: Sport }) {
  const meta = SPORT_META[sport]
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ backgroundColor: meta.bgColor, color: meta.color }}
    >
      {meta.emoji} {sport}
    </span>
  )
}

export function LevelBadge({ level }: { level: SkillLevel }) {
  const meta = LEVEL_META[level]
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold"
      style={{ backgroundColor: meta.bgColor, color: meta.color }}
    >
      {level}
    </span>
  )
}

export function StatusBadge({ status }: { status: MatchStatus }) {
  const styles =
    status === '모집중'
      ? { badge: 'bg-green-100 text-green-700', dot: 'bg-green-500' }
      : status === '취소됨'
      ? { badge: 'bg-red-100 text-red-500', dot: 'bg-red-400' }
      : { badge: 'bg-slate-100 text-slate-500', dot: 'bg-slate-400' }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold',
        styles.badge
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', styles.dot)} />
      {status}
    </span>
  )
}

export function Badge({
  children,
  variant = 'default',
  className,
}: {
  children: React.ReactNode
  variant?: 'default' | 'primary' | 'success' | 'danger' | 'warning'
  className?: string
}) {
  const variants = {
    default: 'bg-slate-100 text-slate-700',
    primary: 'bg-primary/10 text-primary',
    success: 'bg-green-100 text-green-700',
    danger: 'bg-red-100 text-red-700',
    warning: 'bg-yellow-100 text-yellow-700',
  }
  return (
    <span className={cn('inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold', variants[variant], className)}>
      {children}
    </span>
  )
}
