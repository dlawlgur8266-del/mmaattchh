'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Message, Profile } from '@/types/database'

export function useChat(roomId: string | null, userId: string | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  // 싱글턴이므로 안정된 참조 — deps에 넣어도 무한루프 없음
  const supabase = createClient()

  const scrollToBottom = useCallback(() => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }, [])

  // ─── 메시지 초기 로드 ───────────────────────────────────────
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

    // 읽음 처리
    if (userId) {
      supabase
        .from('messages')
        .update({ is_read: true })
        .eq('room_id', roomId)
        .neq('sender_id', userId)
        .then(() => {})
    }
  }, [roomId, userId]) // supabase 싱글턴이므로 제거 가능, scrollToBottom은 stable

  // ─── Realtime 구독 (채널 안정화) ────────────────────────────
  useEffect(() => {
    if (!roomId) return

    const channel = supabase
      .channel(`chat:${roomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
        async (payload) => {
          const msg = payload.new as Message

          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev

            // temp 메시지를 실제 메시지로 교체
            const tempIdx = prev.findIndex(
              (m) =>
                m.id.startsWith('temp-') &&
                m.sender_id === msg.sender_id &&
                m.content === msg.content
            )
            if (tempIdx !== -1) {
              const next = [...prev]
              next[tempIdx] = { ...msg }
              return next
            }

            return [...prev, msg]
          })

          // 발신자 정보 보완 (상대방 메시지만)
          if (msg.sender_id !== userId) {
            const { data: sender } = await supabase
              .from('profiles')
              .select('id,nickname,username')
              .eq('id', msg.sender_id)
              .single()

            setMessages((prev) =>
              prev.map((m) =>
                m.id === msg.id
                  ? { ...m, sender: sender ? (sender as unknown as Profile) : undefined }
                  : m
              )
            )
            scrollToBottom()

            supabase.from('messages').update({ is_read: true }).eq('id', msg.id).then(() => {})
          }
        }
      )
      .subscribe((status) => {
        // CHANNEL_ERROR 시 3초 후 새 메시지를 polling으로 보완
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn(`[useChat] Realtime status: ${status} — polling fallback active`)
        }
      })

    // ── 폴링 폴백: Realtime이 불안정할 때 3초마다 최신 메시지 확인 ──
    let lastId = ''
    const poll = setInterval(async () => {
      const { data } = await supabase
        .from('messages')
        .select('*, sender:profiles!messages_sender_id_fkey(id,nickname,username)')
        .eq('room_id', roomId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (data && data.id !== lastId) {
        lastId = data.id
        setMessages((prev) => {
          if (prev.some((m) => m.id === data.id)) return prev
          return [...prev, data]
        })
        scrollToBottom()
      }
    }, 3000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(poll)
    }
  }, [roomId, userId]) // 싱글턴 supabase, stable scrollToBottom은 의존성 불필요

  // ─── 메시지 전송 ────────────────────────────────────────────
  const sendMessage = async (content: string): Promise<boolean> => {
    if (!roomId || !userId || !content.trim() || sending) return false
    setSending(true)

    const tempId = `temp-${Date.now()}`
    const optimisticMsg: Message = {
      id: tempId,
      room_id: roomId,
      sender_id: userId,
      content: content.trim(),
      is_read: false,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimisticMsg])
    scrollToBottom()

    try {
      const res = await fetch(`/api/messages/${roomId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      })

      if (!res.ok) {
        setMessages((prev) => prev.filter((m) => m.id !== tempId))
        const err = await res.json()
        console.error('메시지 전송 실패:', err.error)
        return false
      }

      const realMsg: Message = await res.json()
      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => m.id !== tempId)
        if (withoutTemp.some((m) => m.id === realMsg.id)) return withoutTemp
        return [...withoutTemp, realMsg]
      })
      scrollToBottom()
      return true
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      console.error('메시지 전송 오류:', err)
      return false
    } finally {
      setSending(false)
    }
  }

  return { messages, loading, sending, sendMessage, bottomRef }
}
