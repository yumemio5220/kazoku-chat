'use client'

import { useEffect } from 'react'

type Props = {
  imageUrl: string
  username: string
  mediaType?: 'image' | 'video' | 'avatar'
  onClose: () => void
}

export default function ImageModal({ imageUrl, username, mediaType = 'avatar', onClose }: Props) {
  // ESCキーで閉じる
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl max-h-[90vh] w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 閉じるボタン */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-gray-300 transition"
          aria-label="閉じる"
        >
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {/* メディア表示 */}
        {mediaType === 'video' ? (
          <video
            src={imageUrl}
            controls
            autoPlay
            muted
            playsInline
            className="w-full h-full object-contain rounded-lg max-h-[80vh]"
          />
        ) : (
          <img
            src={imageUrl}
            alt={mediaType === 'avatar' ? `${username}のアバター` : '送信画像'}
            className="w-full h-full object-contain rounded-lg"
          />
        )}

        {/* ユーザー名 */}
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4 rounded-b-lg">
          <p className="text-center text-lg font-medium">{username}</p>
        </div>
      </div>
    </div>
  )
}
