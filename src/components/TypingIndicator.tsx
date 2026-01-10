'use client'

import { OnlineUser } from '@/types/database'

type Props = {
  onlineUsers: OnlineUser[]
  currentUserId: string
}

export default function TypingIndicator({ onlineUsers, currentUserId }: Props) {
  // 自分以外で入力中のユーザーを取得
  const typingUsers = onlineUsers.filter(
    (user) => user.userId !== currentUserId && user.isTyping
  )

  if (typingUsers.length === 0) {
    return null
  }

  // 入力中のユーザー名を整形
  const displayText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].username}が入力中`
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].username}と${typingUsers[1].username}が入力中`
    } else {
      return `${typingUsers[0].username}、${typingUsers[1].username}、他${typingUsers.length - 2}人が入力中`
    }
  }

  return (
    <div className="px-4 py-2 text-sm text-gray-500 flex items-center gap-2">
      <span>{displayText()}</span>
      <div className="flex gap-1">
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  )
}
