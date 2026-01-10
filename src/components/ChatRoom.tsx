'use client'

import { useEffect, useState, useRef, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RealtimeChannel } from '@supabase/supabase-js'
import { MessageWithProfile, Profile, OnlineUser, isOnlineUserPresence } from '@/types/database'
import ChatMessage from './ChatMessage'
import ChatInput from './ChatInput'
import ChatHeader from './ChatHeader'
import OnlineUsers from './OnlineUsers'
import ImageModal from './ImageModal'
import TypingIndicator from './TypingIndicator'

type Props = {
  initialMessages: MessageWithProfile[]
  currentUser: Profile
}

export default function ChatRoom({ initialMessages, currentUser }: Props) {
  const [messages, setMessages] = useState<MessageWithProfile[]>(initialMessages)
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([])
  const [selectedImage, setSelectedImage] = useState<{ url: string; username: string } | null>(null)
  const [presenceChannel, setPresenceChannel] = useState<RealtimeChannel | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const supabase = useMemo(() => createClient(), [])

  // アバタークリック時の処理
  const handleAvatarClick = useCallback((imageUrl: string, username: string) => {
    setSelectedImage({ url: imageUrl, username })
  }, [])

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
    let visibilityTimeoutId: NodeJS.Timeout | null = null

    const channel = supabase.channel('online-users', {
      config: {
        presence: {
          key: currentUser.id,
        },
      },
    })

    // stateに保存
    setPresenceChannel(channel)

    const trackUser = async () => {
      try {
        await channel.track({
          userId: currentUser.id,
          username: currentUser.username,
          avatarUrl: currentUser.avatar_url,
          isTyping: false,
        })
      } catch (error) {
        console.error('Presence track error:', error, { userId: currentUser.id })
      }
    }

    const handleVisibilityChange = () => {
      // デバウンス: 連続したタブ切り替えによる複数回のtrack/untrackを防ぐ
      if (visibilityTimeoutId) {
        clearTimeout(visibilityTimeoutId)
      }

      visibilityTimeoutId = setTimeout(() => {
        if (document.visibilityState === 'visible') {
          // 復帰時にtrackし直す
          trackUser()
        } else {
          // バックグラウンド時にuntrack
          channel.untrack()
        }
      }, 300)
    }

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const users: OnlineUser[] = []

        Object.keys(state).forEach((key) => {
          const presences = state[key]
          if (presences.length > 0 && isOnlineUserPresence(presences[0])) {
            users.push({
              userId: presences[0].userId,
              username: presences[0].username,
              avatarUrl: presences[0].avatarUrl,
              isTyping: presences[0].isTyping,
            })
          }
        })

        setOnlineUsers(users)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await trackUser()
        }
      })

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      if (visibilityTimeoutId) {
        clearTimeout(visibilityTimeoutId)
      }
      channel.untrack()
      supabase.removeChannel(channel)
      setPresenceChannel(null)
    }
  }, [supabase, currentUser.id, currentUser.username, currentUser.avatar_url])

  return (
    <div className="flex flex-col h-dvh bg-gray-100">
      <ChatHeader username={currentUser.username} avatarUrl={currentUser.avatar_url} />

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
              onAvatarClick={handleAvatarClick}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 入力中インジケーター */}
      <TypingIndicator onlineUsers={onlineUsers} currentUserId={currentUser.id} />

      <ChatInput userId={currentUser.id} presenceChannel={presenceChannel || undefined} />

      {/* 画像拡大モーダル */}
      {selectedImage && (
        <ImageModal
          imageUrl={selectedImage.url}
          username={selectedImage.username}
          onClose={() => setSelectedImage(null)}
        />
      )}
    </div>
  )
}
