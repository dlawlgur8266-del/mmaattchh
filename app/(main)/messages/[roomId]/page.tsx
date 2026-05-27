'use client'

import { useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Send } from 'lucide-react'
import { ChatBubble } from '@/components/chat/ChatBubble'
import { PageSpinner } from '@/components/ui/Spinner'
import { useChat } from '@/hooks/useChat'
import { createClient } from '@/lib/supabase/client'
import { useEffect, useRef } from 'react'
import toast from 'react-hot-toast'

export default function ChatRoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params)
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const { messages, loading, sending, sendMessage, bottomRef } = useChat(roomId, userId)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => setUserId(user?.id || null))
  }, [])

  const handleSend = async () => {
    if (!input.trim() || sending) return
    const content = input
    setInput('') // 즉시 입력창 초기화
    const ok = await sendMessage(content)
    if (!ok) {
      toast.error('메시지 전송에 실패했습니다. 다시 시도해주세요.')
      setInput(content) // 실패 시 복구
    }
    inputRef.current?.focus()
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
          onClick={() => router.push('/messages')}
          className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="font-bold text-slate-800">매치 채팅</h2>
          <p className="text-xs text-slate-400">매치 확정 상대와의 실시간 대화</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-1 space-y-1">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400 text-sm">
            첫 메시지를 보내보세요 👋
          </div>
        ) : (
          messages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} isOwn={msg.sender_id === userId} />
          ))
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
            className="p-3 bg-primary text-white rounded-xl hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
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
