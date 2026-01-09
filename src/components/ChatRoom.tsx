'use client'

import { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageWithProfile, Profile, OnlineUser, isOnlineUserPresence } from '@/types/database'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'
import ChatHeader from './ChatHeader'
import OnlineUsers from './OnlineUsers'

type Props = {
  initialMessages: MessageWithProfile[]
  currentUser: Profile
}

export default function ChatRoom({ initialMessages, currentUser }: Props) {
  const [messages, setMessages] = useState<MessageWithProfile[]>(initialMessages)
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = useMemo(() => createClient(), [])

  // 自動スクロール
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // メッセージを再取得する関数（既存メッセージとマージして競合を防ぐ）
  const fetchMessages = useCallback(async () => {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        profiles (*)
      `)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('メッセージ取得エラー:', error)
      return
    }

    if (data && data.length > 0) {
      setMessages((prevMessages) => {
        // IDをキーにしたMapでマージ（新しいデータを優先）
        const messageMap = new Map<string, MessageWithProfile>()

        // 既存メッセージを追加
        prevMessages.forEach((msg) => messageMap.set(msg.id, msg))

        // 新しいデータで上書き・追加
        data.forEach((msg) => messageMap.set(msg.id, msg as MessageWithProfile))

        // created_at順にソートして返す
        return Array.from(messageMap.values()).sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
      })
    }
  }, [supabase])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // バックグラウンドから復帰時にメッセージを再取得（デバウンス付き）
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (timeoutId) {
          clearTimeout(timeoutId)
        }
        timeoutId = setTimeout(() => {
          fetchMessages()
        }, 300)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [fetchMessages])

  // リアルタイム購読
  useEffect(() => {
    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        async (payload) => {
          // 新しいメッセージのプロフィール情報を取得
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', payload.new.user_id)
            .single()

          if (profile) {
            const newMessage: MessageWithProfile = {
              ...payload.new as MessageWithProfile,
              profiles: profile,
            }
            // 重複防止: 既に存在するメッセージは追加しない
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMessage.id)) {
                return prev
              }
              return [...prev, newMessage]
            })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          setMessages((prev) => prev.filter((m) => m.id !== payload.old.id))
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  // オンラインユーザーのPresence
  useEffect(() => {
    const presenceChannel = supabase.channel('online-users', {
      config: {
        presence: {
          key: currentUser.id,
        },
      },
    })

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState()
        const users: OnlineUser[] = []

        Object.keys(state).forEach((key) => {
          const presences = state[key]
          if (presences.length > 0 && isOnlineUserPresence(presences[0])) {
            users.push({
              userId: presences[0].userId,
              username: presences[0].username,
            })
          }
        })

        setOnlineUsers(users)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            userId: currentUser.id,
            username: currentUser.username,
          })
        }
      })

    return () => {
      presenceChannel.untrack()
      supabase.removeChannel(presenceChannel)
    }
  }, [supabase, currentUser.id, currentUser.username])

  return (
    <div className="flex flex-col h-dvh bg-gray-100">
      <ChatHeader username={currentUser.username} />

      {/* オンラインユーザー表示 */}
      <div className="bg-white border-b px-4 py-2">
        <OnlineUsers users={onlineUsers} currentUserId={currentUser.id} />
      </div>

      {/* メッセージ一覧 */}
      <div className="flex-1 overflow-y-auto p-4 min-h-0">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            メッセージはまだありません
          </div>
        ) : (
          messages.map((message) => (
            <ChatMessage
              key={message.id}
              message={message}
              isOwnMessage={message.user_id === currentUser.id}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput userId={currentUser.id} />
    </div>
  )
}
