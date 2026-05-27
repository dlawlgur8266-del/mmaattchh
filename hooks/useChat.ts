'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Message, Profile } from '@/types/database'

export function useChat(roomId: string | null, userId: string | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
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

    const channel = supabase
      .channel(`chat:${roomId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `room_id=eq.${roomId}` },
        async (payload) => {
          const msg = payload.new as Message
          // Fetch sender info
          const { data: sender } = await supabase
            .from('profiles')
            .select('id,nickname,username')
            .eq('id', msg.sender_id)
            .single()
          setMessages((prev) => [...prev, { ...msg, sender: sender ? (sender as unknown as Profile) : undefined }])
          scrollToBottom()
          // Mark as read if we're in the room
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

  const sendMessage = async (content: string) => {
    if (!roomId || !userId || !content.trim()) return
    await supabase.from('messages').insert({
      room_id: roomId,
      sender_id: userId,
      content: content.trim(),
    })
  }

  return { messages, loading, sendMessage, bottomRef }
}
