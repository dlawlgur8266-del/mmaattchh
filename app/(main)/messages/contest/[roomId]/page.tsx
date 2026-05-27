'use client'

import { useState, useEffect, useRef, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Send, Users, Trophy } from 'lucide-react'
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

export default function ContestChatPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params)
  const router = useRouter()
  const supabase = createClient()

  const [userId, setUserId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [roomName, setRoomName] = useState('팀 채팅')
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUserId(user?.id || null))
  }, [])

  useEffect(() => {
    if (!roomId) return

    // 방 정보 & 메시지 로드
    async function load() {
      const [roomRes, msgRes, memberRes] = await Promise.all([
        fetch(`/api/contest-rooms`),
        fetch(`/api/contest-rooms/${roomId}/messages`),
        supabase
          .from('contest_chat_members')
          .select('user_id, user:profiles!contest_chat_members_user_id_fkey(nickname)')
          .eq('room_id', roomId),
      ])

      if (msgRes.ok) {
        const msgs = await msgRes.json()
        setMessages(msgs)
      }

      if (memberRes.data) {
        setMembers(
          memberRes.data.map((m) => ({
            user_id: m.user_id,
            user: Array.isArray(m.user) ? m.user[0] : (m.user ?? undefined),
          }))
        )
      }

      // 방 이름 가져오기
      const { data: room } = await supabase
        .from('contest_chat_rooms')
        .select('name, contest_match:contest_matches!contest_chat_rooms_contest_match_id_fkey(contest_name)')
        .eq('id', roomId)
        .single()

      if (room) {
        const cm = room.contest_match as any
        setRoomName(cm?.contest_name || room.name || '팀 채팅')
      }

      setLoading(false)
    }

    load()
  }, [roomId, supabase])

  // 실시간 메시지 구독
  useEffect(() => {
    const channel = supabase
      .channel(`contest-chat:${roomId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'contest_chat_messages',
        filter: `room_id=eq.${roomId}`,
      }, async (payload) => {
        const msg = payload.new as Message
        // 발신자 닉네임 조회
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
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [roomId, supabase])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

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
        {/* 멤버 목록 */}
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
    </div>
  )
}
