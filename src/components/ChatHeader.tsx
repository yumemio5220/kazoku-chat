'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Props = {
  username: string
  avatarUrl?: string | null
}

export default function ChatHeader({ username, avatarUrl }: Props) {
  const supabase = createClient()
  const router = useRouter()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="bg-white border-b px-4 py-3 flex items-center justify-between">
      <h1 className="text-xl font-bold text-gray-900">KAZOKUChat</h1>
      <div className="flex items-center gap-4">
        <Link
          href="/profile"
          className="flex items-center gap-2 hover:opacity-80 transition"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={username}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-600">
              {username.charAt(0)}
            </div>
          )}
          <span className="text-sm text-gray-600">{username}</span>
        </Link>
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ログアウト
        </button>
      </div>
    </header>
  )
}
