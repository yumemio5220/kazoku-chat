import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ChatRoom from '@/components/ChatRoom'

export default async function Home() {
  const supabase = await createClient()

  // 現在のユーザーを取得
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // プロフィールを取得
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    redirect('/login')
  }

  // メッセージ一覧を取得（プロフィール情報付き）
  const { data: messages } = await supabase
    .from('messages')
    .select(`
      *,
      profiles (*)
    `)
    .order('created_at', { ascending: true })

  return <ChatRoom initialMessages={messages || []} currentUser={profile} />
}
