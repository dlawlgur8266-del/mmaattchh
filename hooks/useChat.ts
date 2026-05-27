'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Message, Profile } from '@/types/database'

export function useChat(roomId: string | null, userId: string | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const scrollToBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }, [])

  useEffect(() => {
    if (!roomId) return
    setLoading(true)

    supabase
      .from('messages')
      .select('*, sender:profiles!messages_sender_id_fkey(id,nickname,username)')
      .eq('room_id', roomId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setMessages(data || [])
        setLoading(false)
        scrollToBottom()
      })

    // Mark messages as read
    if (userId) {
      supabase
        .from('messages')
        .update({ is_read: true })
        .eq('room_id', roomId)
        .neq('sender_id', userId)
        .then(() => {})
    }

    // 실시간 구독 — 새 메시지 INSERT 감지
    const channel = supabase
      .channel(`chat:${roomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
        async (payload) => {
          const msg = payload.new as Message
          // 발신자 정보 조회
          const { data: sender } = await supabase
            .from('profiles')
            .select('id,nickname,username')
            .eq('id', msg.sender_id)
            .single()
          setMessages((prev) => {
            // 중복 방지
            if (prev.some((m) => m.id === msg.id)) return prev
            return [...prev, { ...msg, sender: sender ? (sender as unknown as Profile) : undefined }]
          })
          scrollToBottom()
          // 채팅방에 있는 동안 수신 메시지 읽음 처리
          if (userId && msg.sender_id !== userId) {
            supabase.from('messages').update({ is_read: true }).eq('id', msg.id).then(() => {})
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, userId, supabase, scrollToBottom])

  // API 라우트를 통해 메시지 전송 (RLS 우회, 알림 포함)
  const sendMessage = async (content: string): Promise<boolean> => {
    if (!roomId || !userId || !content.trim() || sending) return false
    setSending(true)
    try {
      const res = await fetch(`/api/messages/${roomId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      })
      if (!res.ok) {
        const data = await res.json()
        console.error('메시지 전송 실패:', data.error)
        return false
      }
      // 실시간 구독이 새 메시지를 자동으로 반영하므로 별도 추가 불필요
      return true
    } catch (err) {
      console.error('메시지 전송 오류:', err)
      return false
    } finally {
      setSending(false)
    }
  }

  return { messages, loading, sending, sendMessage, bottomRef }
}
