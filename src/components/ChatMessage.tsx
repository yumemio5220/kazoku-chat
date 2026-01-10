'use client'

import { MessageWithProfile } from '@/types/database'

type Props = {
  message: MessageWithProfile
  isOwnMessage: boolean
  onAvatarClick?: (imageUrl: string, username: string) => void
}

export default function ChatMessage({ message, isOwnMessage, onAvatarClick }: Props) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`flex ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 max-w-[80%]`}>
        {/* アバター */}
        <div className="flex-shrink-0">
          {message.profiles.avatar_url ? (
            <img
              src={message.profiles.avatar_url}
              alt={message.profiles.username}
              className="w-8 h-8 rounded-full object-cover cursor-pointer hover:opacity-80 transition"
              onClick={() => onAvatarClick?.(message.profiles.avatar_url!, message.profiles.username)}
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-600">
              {message.profiles.username.charAt(0)}
            </div>
          )}
        </div>

        <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'}`}>
          {/* ユーザー名 */}
          {!isOwnMessage && (
            <span className="text-xs text-gray-500 mb-1">
              {message.profiles.username}
            </span>
          )}

          {/* メッセージ本体 */}
          <div
            className={`rounded-2xl px-4 py-2 ${
              isOwnMessage
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-900'
            }`}
          >
            {/* 画像/動画 */}
            {message.file_url && message.file_type === 'image' && (
              <img
                src={message.file_url}
                alt="送信画像"
                className="max-w-full rounded-lg mb-2"
              />
            )}
            {message.file_url && message.file_type === 'video' && (
              <video
                src={message.file_url}
                controls
                className="max-w-full rounded-lg mb-2"
              />
            )}

            {/* テキスト */}
            {message.content && (
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
            )}
          </div>

          {/* 時刻 */}
          <span className="text-xs text-gray-400 mt-1">
            {formatTime(message.created_at)}
          </span>
        </div>
      </div>
    </div>
  )
}
