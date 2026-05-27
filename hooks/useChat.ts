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

    // 읽음 처리
    if (userId) {
      supabase
        .from('messages')
        .update({ is_read: true })
        .eq('room_id', roomId)
        .neq('sender_id', userId)
        .then(() => {})
    }

    // 실시간 구독 — 상대방이 보낸 새 메시지 수신 (중복 방지)
    const channel = supabase
      .channel(`chat:${roomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
        async (payload) => {
          const msg = payload.new as Message

          // 내가 보낸 메시지는 낙관적 업데이트가 이미 처리 → ID 기준 중복 방지
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev

            // temp 메시지를 실제 메시지로 교체 (sender_id, content 일치 여부로 판단)
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

            // 읽음 처리
            supabase.from('messages').update({ is_read: true }).eq('id', msg.id).then(() => {})
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, userId, supabase, scrollToBottom])

  /**
   * 메시지 전송
   * - 낙관적 업데이트: 전송 즉시 화면에 표시
   * - API 라우트로 전송 (supabaseAdmin → RLS 우회 + 알림 포함)
   * - 전송 실패 시 임시 메시지 제거 + false 반환
   */
  const sendMessage = async (content: string): Promise<boolean> => {
    if (!roomId || !userId || !content.trim() || sending) return false
    setSending(true)

    // 1️⃣ 낙관적 업데이트: 임시 ID로 즉시 표시
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
        // 전송 실패 → 임시 메시지 제거
        setMessages((prev) => prev.filter((m) => m.id !== tempId))
        const err = await res.json()
        console.error('메시지 전송 실패:', err.error)
        return false
      }

      // 2️⃣ 서버 응답(실제 메시지)으로 임시 메시지 교체
      const realMsg: Message = await res.json()
      setMessages((prev) => {
        // 혹시 Realtime이 이미 실제 ID를 추가했으면 temp만 제거
        const withoutTemp = prev.filter((m) => m.id !== tempId)
        if (withoutTemp.some((m) => m.id === realMsg.id)) return withoutTemp
        return [...withoutTemp, realMsg]
      })
      scrollToBottom()
      return true
    } catch (err) {
      // 네트워크 오류 → 임시 메시지 제거
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      console.error('메시지 전송 오류:', err)
      return false
    } finally {
      setSending(false)
    }
  }

  return { messages, loading, sending, sendMessage, bottomRef }
}
