'use client'

import { useMemo } from 'react'
import { OnlineUser } from '@/types/database'

type Props = {
  users: OnlineUser[]
  currentUserId: string
}

export default function OnlineUsers({ users, currentUserId }: Props) {
  // 自分以外のオンラインユーザーをフィルタリング（メモ化）
  const otherUsers = useMemo(
    () => users.filter((user) => user.userId !== currentUserId),
    [users, currentUserId]
  )

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-gray-500">オンライン:</span>
      {otherUsers.length === 0 ? (
        <span className="text-gray-400">自分だけ</span>
      ) : (
        <div className="flex items-center gap-2">
          {otherUsers.map((user) => (
            <div
              key={user.userId}
              className="flex items-center gap-2 bg-green-100 text-green-800 px-2 py-1 rounded-full"
            >
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.username}
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-green-300 flex items-center justify-center text-xs font-medium text-green-800">
                  {user.username.charAt(0)}
                </div>
              )}
              <span>{user.username}</span>
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
