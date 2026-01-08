'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Props = {
  username: string
}

export default function ChatHeader({ username }: Props) {
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
        <span className="text-sm text-gray-600">{username}</span>
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
