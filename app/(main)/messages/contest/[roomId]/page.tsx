'use client'

import { useState, useEffect, useRef, use, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Send, Users, Trophy, UserPlus, LogOut, X, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { PageSpinner } from '@/components/ui/Spinner'
import toast from 'react-hot-toast'

interface Message {
  id: string
  room_id: string
  sender_id: string
  content: string
  created_at: string
  sender?: { id: string; nickname: string }
}

interface Member {
  user_id: string
  user?: { nickname: string }
}

interface Invitee {
  userId: string
  nickname: string
}

export default function ContestChatPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params)
  const router = useRouter()
  const supabase = createClient()

  const [userId, setUserId] = useState<string | null>(null)
  const [isAuthor, setIsAuthor] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [roomName, setRoomName] = useState('팀 채팅')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  // 초대 모달
  const [showInvite, setShowInvite] = useState(false)
  const [invitees, setInvitees] = useState<Invitee[]>([])
  const [loadingInvitees, setLoadingInvitees] = useState(false)
  const [invitingId, setInvitingId] = useState<string | null>(null)

  // 나가기
  const [leaving, setLeaving] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const userIdRef = useRef<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null)
      userIdRef.current = user?.id || null
    })
  }, [])

  // ─── 초기 데이터 로드 ───────────────────────────────────────
  const loadMessages = useCallback(async () => {
    const res = await fetch(`/api/contest-rooms/${roomId}/messages`)
    if (res.ok) setMessages(await res.json())
  }, [roomId])

  useEffect(() => {
    if (!roomId) return

    async function load() {
      await loadMessages()

      const memberRes = await supabase
        .from('contest_chat_members')
        .select('user_id, user:profiles!contest_chat_members_user_id_fkey(nickname)')
        .eq('room_id', roomId)

      if (memberRes.data) {
        setMembers(
          memberRes.data.map((m) => ({
            user_id: m.user_id,
            user: Array.isArray(m.user) ? m.user[0] : (m.user ?? undefined),
          }))
        )
      }

      const { data: room } = await supabase
        .from('contest_chat_rooms')
        .select('name, contest_match:contest_matches!contest_chat_rooms_contest_match_id_fkey(contest_name, author_id)')
        .eq('id', roomId)
        .single()

      if (room) {
        const cm = room.contest_match as any
        setRoomName(cm?.contest_name || room.name || '팀 채팅')
        // 팀장(게시글 작성자) 여부 확인
        const currentUser = (await supabase.auth.getUser()).data.user
        if (currentUser && cm?.author_id === currentUser.id) {
          setIsAuthor(true)
        }
      }

      setLoading(false)
    }

    load()
  }, [roomId])

  // ─── Realtime 구독 + 폴링 폴백 ─────────────────────────────
  useEffect(() => {
    if (!roomId) return

    const channel = supabase
      .channel(`contest-chat:${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'contest_chat_messages',
        filter: `room_id=eq.${roomId}`,
      }, async (payload) => {
        const msg = payload.new as Message
        const { data: sender } = await supabase
          .from('profiles')
          .select('id, nickname')
          .eq('id', msg.sender_id)
          .single()
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev
          return [...prev, { ...msg, sender: sender || undefined }]
        })
      })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn(`[ContestChat] Realtime ${status}`)
        }
      })

    let lastId = ''
    const poll = setInterval(async () => {
      const res = await fetch(`/api/contest-rooms/${roomId}/messages`)
      if (!res.ok) return
      const msgs: Message[] = await res.json()
      if (!msgs.length) return
      const latest = msgs[msgs.length - 1]
      if (latest.id !== lastId) {
        lastId = latest.id
        setMessages((prev) => {
          const missing = msgs.filter((m) => !prev.some((p) => p.id === m.id))
          return missing.length > 0 ? [...prev, ...missing] : prev
        })
      }
    }, 3000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(poll)
    }
  }, [roomId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ─── 메시지 전송 ────────────────────────────────────────────
  const handleSend = async () => {
    if (!input.trim() || sending) return
    const content = input
    setInput('')
    setSending(true)
    try {
      const res = await fetch(`/api/contest-rooms/${roomId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (!res.ok) {
        toast.error('메시지 전송에 실패했습니다.')
        setInput(content)
      }
    } finally {
      setSending(false)
      inputRef.current?.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ─── 팀원 초대 ───────────────────────────────────────────────
  const openInviteModal = async () => {
    setShowInvite(true)
    setLoadingInvitees(true)
    try {
      const res = await fetch(`/api/contest-rooms/${roomId}/invite`)
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || '초대 목록을 불러오지 못했습니다.')
        setShowInvite(false)
        return
      }
      setInvitees(await res.json())
    } finally {
      setLoadingInvitees(false)
    }
  }

  const handleInvite = async (targetUserId: string) => {
    setInvitingId(targetUserId)
    try {
      const res = await fetch(`/api/contest-rooms/${roomId}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUserId }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || '초대에 실패했습니다.')
        return
      }
      toast.success('팀원을 초대했습니다!')
      setInvitees((prev) => prev.filter((p) => p.userId !== targetUserId))
      // 멤버 목록 새로고침
      const memberRes = await supabase
        .from('contest_chat_members')
        .select('user_id, user:profiles!contest_chat_members_user_id_fkey(nickname)')
        .eq('room_id', roomId)
      if (memberRes.data) {
        setMembers(
          memberRes.data.map((m) => ({
            user_id: m.user_id,
            user: Array.isArray(m.user) ? m.user[0] : (m.user ?? undefined),
          }))
        )
      }
    } finally {
      setInvitingId(null)
    }
  }

  // ─── 채팅방 나가기 ───────────────────────────────────────────
  const handleLeave = async () => {
    if (!window.confirm('팀 채팅방을 나가시겠습니까?\n나가도 채팅 내역은 팀원에게 유지됩니다.')) return
    setLeaving(true)
    try {
      const res = await fetch(`/api/contest-rooms/${roomId}/leave`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        toast.error(data.error || '나가기에 실패했습니다.')
        return
      }
      toast.success('채팅방을 나갔습니다.')
      router.push('/messages?tab=contest')
    } finally {
      setLeaving(false)
    }
  }

  if (loading || !userId) return <PageSpinner />

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] md:h-[calc(100vh-10rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-4">
        <button
          onClick={() => router.push('/messages?tab=contest')}
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="w-9 h-9 bg-yellow-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Trophy size={18} className="text-yellow-600" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-slate-800 truncate text-sm">{roomName}</h2>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <Users size={10} />
              팀원 {members.length}명
            </p>
          </div>
        </div>

        {/* 멤버 아바타 */}
        <div className="flex -space-x-1">
          {members.slice(0, 4).map((m) => (
            <div
              key={m.user_id}
              className="w-7 h-7 bg-yellow-500 rounded-full flex items-center justify-center text-white text-[10px] font-bold border-2 border-white"
              title={m.user?.nickname || ''}
            >
              {(m.user?.nickname || '?').charAt(0)}
            </div>
          ))}
        </div>

        {/* 팀원 초대 버튼 (팀장만) */}
        {isAuthor && (
          <button
            onClick={openInviteModal}
            className="p-2 rounded-xl hover:bg-yellow-50 text-yellow-600 transition-colors flex-shrink-0"
            title="팀원 초대하기"
          >
            <UserPlus size={18} />
          </button>
        )}

        {/* 나가기 버튼 */}
        <button
          onClick={handleLeave}
          disabled={leaving}
          className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
          title="채팅방 나가기"
        >
          {leaving ? (
            <div className="w-[18px] h-[18px] border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
          ) : (
            <LogOut size={18} />
          )}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-1 space-y-2">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 text-sm gap-2">
            <Trophy size={32} className="text-yellow-400 opacity-50" />
            <p>첫 메시지를 보내보세요 🏆</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_id === userId
            return (
              <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} gap-2`}>
                {!isOwn && (
                  <div className="w-7 h-7 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-700 text-xs font-bold flex-shrink-0 mt-1">
                    {(msg.sender?.nickname || '?').charAt(0)}
                  </div>
                )}
                <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                  {!isOwn && (
                    <span className="text-xs text-slate-400 ml-1">{msg.sender?.nickname}</span>
                  )}
                  <div
                    className={`px-3.5 py-2.5 rounded-2xl text-sm ${
                      isOwn
                        ? 'bg-primary text-white rounded-br-sm'
                        : 'bg-slate-100 text-slate-800 rounded-bl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-slate-300 mx-1">
                    {new Date(msg.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="pt-4 border-t border-slate-100">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            className="input-field flex-1"
            placeholder="메시지를 입력하세요..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            disabled={sending}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="p-3 bg-yellow-500 text-white rounded-xl hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
          >
            {sending ? (
              <div className="w-[18px] h-[18px] border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
      </div>

      {/* ── 팀원 초대 모달 ────────────────────────────────────── */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                  <UserPlus size={18} className="text-yellow-500" />
                  팀원 초대하기
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  공모전 신청을 수락한 팀원만 초대할 수 있습니다
                </p>
              </div>
              <button
                onClick={() => setShowInvite(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* 초대 목록 */}
            <div className="p-4 max-h-72 overflow-y-auto">
              {loadingInvitees ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-slate-200 border-t-yellow-500 rounded-full animate-spin" />
                </div>
              ) : invitees.length === 0 ? (
                <div className="text-center py-8">
                  <Users size={32} className="mx-auto mb-2 text-slate-200" />
                  <p className="text-sm text-slate-500 font-medium">초대 가능한 팀원이 없습니다</p>
                  <p className="text-xs text-slate-400 mt-1">
                    수락된 신청자가 모두 채팅방에 있거나<br />아직 수락된 신청이 없습니다
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {invitees.map((person) => (
                    <div
                      key={person.userId}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-yellow-100 rounded-full flex items-center justify-center text-yellow-700 font-bold text-sm">
                          {person.nickname.charAt(0)}
                        </div>
                        <span className="font-medium text-slate-800 text-sm">{person.nickname}</span>
                      </div>
                      <button
                        onClick={() => handleInvite(person.userId)}
                        disabled={invitingId === person.userId}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500 text-white text-xs font-semibold rounded-lg hover:bg-yellow-600 disabled:opacity-50 transition-colors"
                      >
                        {invitingId === person.userId ? (
                          <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <Check size={12} />
                            초대
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 pt-0">
              <button
                onClick={() => setShowInvite(false)}
                className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
