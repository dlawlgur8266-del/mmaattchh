'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Shield, Flag, Users, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Report {
  id: string
  reason: string
  detail: string | null
  status: string
  created_at: string
  reporter: { id: string; nickname: string }
  reported: { id: string; nickname: string; is_active: boolean }
}

type Action = 'warn' | 'suspend_30' | 'ban' | 'dismiss'

const ACTION_LABELS: Record<Action, string> = {
  warn: '경고',
  suspend_30: '30일 정지',
  ban: '영구 퇴출',
  dismiss: '기각',
}

const ACTION_COLORS: Record<Action, string> = {
  warn: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200',
  suspend_30: 'bg-orange-100 text-orange-700 hover:bg-orange-200',
  ban: 'bg-red-100 text-red-700 hover:bg-red-200',
  dismiss: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
}

export default function AdminPage() {
  const router = useRouter()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<'pending' | 'resolved' | 'dismissed'>('pending')

  useEffect(() => {
    fetchReports()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  async function fetchReports() {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/reports?status=${statusFilter}`)
      if (res.status === 403) {
        toast.error('관리자 권한이 필요합니다.')
        router.push('/match')
        return
      }
      if (!res.ok) throw new Error()
      const data = await res.json()
      setReports(data)
    } catch {
      toast.error('신고 목록을 불러오지 못했습니다.')
    } finally {
      setLoading(false)
    }
  }

  async function handleAction(reportId: string, action: Action) {
    if (!confirm(`"${ACTION_LABELS[action]}" 처리하시겠습니까?`)) return
    setProcessing(reportId)
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (!res.ok) throw new Error()
      toast.success(`${ACTION_LABELS[action]} 처리 완료`)
      setReports(prev => prev.filter(r => r.id !== reportId))
    } catch {
      toast.error('처리에 실패했습니다.')
    } finally {
      setProcessing(null)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">관리자 대시보드</h1>
      </div>

      {/* 탭 */}
      <div className="flex gap-2 border-b">
        {(['pending', 'resolved', 'dismissed'] as const).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              statusFilter === s
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {s === 'pending' ? '처리 대기' : s === 'resolved' ? '처리 완료' : '기각됨'}
          </button>
        ))}
      </div>

      {/* 신고 목록 */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Flag className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p>신고 내역이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map(r => (
            <div key={r.id} className="bg-white rounded-2xl shadow-sm border p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Users className="w-4 h-4" />
                    <span>신고자: <strong className="text-gray-800">{r.reporter.nickname}</strong></span>
                    <span>→</span>
                    <span>피신고자: <strong className="text-gray-800">{r.reported.nickname}</strong></span>
                    {!r.reported.is_active && (
                      <span className="px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-xs">비활성</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    <span className="font-medium text-gray-900">{r.reason}</span>
                  </div>
                  {r.detail && (
                    <p className="text-sm text-gray-600 mt-1 bg-gray-50 rounded-lg px-3 py-2">{r.detail}</p>
                  )}
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {new Date(r.created_at).toLocaleDateString('ko-KR')}
                </span>
              </div>

              {statusFilter === 'pending' && (
                <div className="flex gap-2 flex-wrap">
                  {(Object.keys(ACTION_LABELS) as Action[]).map(action => (
                    <button
                      key={action}
                      onClick={() => handleAction(r.id, action)}
                      disabled={processing === r.id}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${ACTION_COLORS[action]} disabled:opacity-50`}
                    >
                      {processing === r.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        ACTION_LABELS[action]
                      )}
                    </button>
                  ))}
                </div>
              )}

              {statusFilter !== 'pending' && (
                <div className="flex items-center gap-2 text-sm">
                  {statusFilter === 'resolved' ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="text-gray-500">
                    {statusFilter === 'resolved' ? '처리 완료' : '기각됨'}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
