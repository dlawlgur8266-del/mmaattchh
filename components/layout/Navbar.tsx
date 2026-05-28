'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Trophy, PenSquare, Star, User, MessageCircle, Swords, Dumbbell } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/match', label: '매치', icon: Swords },
  { href: '/contest', label: '공모전', icon: Trophy },
  { href: '/sports', label: '시설 예약', icon: Dumbbell },
  { href: '/match/write', label: '매치글 작성', icon: PenSquare },
  { href: '/review', label: '팀 후기', icon: Star },
  { href: '/messages', label: '메시지', icon: MessageCircle },
  { href: '/profile', label: '내 정보', icon: User },
]

export function Navbar() {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden md:flex flex-col gap-1 w-52 flex-shrink-0">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== '/match' && href !== '/contest' && href !== '/sports' && pathname.startsWith(href)) ||
            (href === '/contest' && pathname.startsWith('/contest')) ||
            (href === '/sports' && pathname.startsWith('/sports'))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-colors',
                active
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-100 px-1 pb-safe">
        <div className="flex justify-around">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href ||
              (href !== '/match' && href !== '/contest' && href !== '/sports' && pathname.startsWith(href)) ||
              (href === '/contest' && pathname.startsWith('/contest')) ||
              (href === '/sports' && pathname.startsWith('/sports'))
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex flex-col items-center gap-0.5 py-2 px-2 rounded-xl transition-colors',
                  active ? 'text-primary' : 'text-slate-400'
                )}
              >
                <Icon size={20} />
                <span className="text-[9px] font-medium">{label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
