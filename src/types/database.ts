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
