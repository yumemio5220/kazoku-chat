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
  avatarUrl?: string | null
  isTyping?: boolean
}

// 型ガード関数
export function isOnlineUserPresence(
  value: unknown
): value is { userId: string; username: string; avatarUrl?: string | null; isTyping?: boolean } {
  const obj = value as { userId: unknown; username: unknown; avatarUrl?: unknown; isTyping?: unknown }
  return (
    typeof value === 'object' &&
    value !== null &&
    'userId' in value &&
    'username' in value &&
    typeof obj.userId === 'string' &&
    typeof obj.username === 'string' &&
    (!('avatarUrl' in value) ||
      obj.avatarUrl === null ||
      obj.avatarUrl === undefined ||
      typeof obj.avatarUrl === 'string') &&
    (!('isTyping' in value) ||
      obj.isTyping === undefined ||
      typeof obj.isTyping === 'boolean')
  )
}
