export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-primary-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            chungbuk-match
          </h1>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
