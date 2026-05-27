import { CbnuMarkWhite } from '@/components/ui/CbnuLogo'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* 로고 영역 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-3">
            <CbnuMarkWhite size={52} />
            <div className="text-left">
              <h1 className="text-2xl font-bold text-white leading-tight">
                충북대<span className="text-accent">Match</span>
              </h1>
              <p className="text-xs text-slate-300 font-medium tracking-wider">CHUNGBUK NATIONAL UNIVERSITY</p>
            </div>
          </div>
          <p className="text-slate-300 text-sm">충북대학교 스포츠 팀 매칭 플랫폼</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
