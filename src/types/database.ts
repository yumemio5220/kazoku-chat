export type Profile = {
  id: string
  username: string
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export type Message = {
  id: string
  user_id: string
  content: string | null
  file_url: string | null
  file_type: 'image' | 'video' | null
  created_at: string
}

export type MessageWithProfile = Message & {
  profiles: Profile
}

export type MessageRead = {
  id: string
  message_id: string
  user_id: string
  read_at: string
}

// Presence関連の型
export type OnlineUser = {
  userId: string
  username: string
}

// 型ガード関数
export function isOnlineUserPresence(
  value: unknown
): value is { userId: string; username: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    'userId' in value &&
    'username' in value &&
    typeof (value as { userId: unknown }).userId === 'string' &&
    typeof (value as { username: unknown }).username === 'string'
  )
}
