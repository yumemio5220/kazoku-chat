'use client'

type OnlineUser = {
  userId: string
  username: string
}

type Props = {
  users: OnlineUser[]
  currentUserId: string
}

export default function OnlineUsers({ users, currentUserId }: Props) {
  // 自分以外のオンラインユーザーをフィルタリング
  const otherUsers = users.filter((user) => user.userId !== currentUserId)

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-gray-500">オンライン:</span>
      {otherUsers.length === 0 ? (
        <span className="text-gray-400">自分だけ</span>
      ) : (
        <div className="flex items-center gap-1">
          {otherUsers.map((user) => (
            <div
              key={user.userId}
              className="flex items-center gap-1 bg-green-100 text-green-800 px-2 py-0.5 rounded-full"
            >
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>{user.username}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
