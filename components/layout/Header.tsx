'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { LogOut, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { NotificationBell } from './NotificationBell'
import { CbnuMark } from '@/components/ui/CbnuLogo'
import toast from 'react-hot-toast'

interface Props {
  userId: string
  nickname: string
}

export function Header({ userId, nickname }: Props) {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    toast.success('로그아웃 되었습니다.')
    router.refresh()
    router.push('/login')
  }

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/match" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <CbnuMark size={30} />
          <span className="text-lg font-bold tracking-tight text-[#1E3A5F]">
            chungbuk-match
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <NotificationBell userId={userId} />

          <Link
            href="/profile"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:text-primary hover:bg-slate-100 rounded-xl transition-colors"
          >
            <User size={16} />
            <span className="font-medium">{nickname}</span>
          </Link>

          <button
            onClick={handleLogout}
            className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
            aria-label="로그아웃"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  )
}
