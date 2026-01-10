'use client'

import { useEffect, useState, useMemo, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Profile } from '@/types/database'
import { resizeImage, isImageFile, isFileSizeValid } from '@/lib/imageUtils'

export default function ProfilePage() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const [profile, setProfile] = useState<Profile | null>(null)
  const [username, setUsername] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // プロフィール情報を取得
  useEffect(() => {
    async function loadProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
          router.push('/login')
          return
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) throw error

        setProfile(data)
        setUsername(data.username)
        setAvatarPreview(data.avatar_url)
      } catch (err) {
        console.error('プロフィール取得エラー:', err)
        setError('プロフィール情報の取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase])

  // タイムアウトのクリーンアップ
  useEffect(() => {
    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current)
      }
    }
  }, [])

  // 画像ファイル選択時の処理
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // バリデーション
    if (!isImageFile(file)) {
      setError('画像ファイルを選択してください')
      return
    }

    if (!isFileSizeValid(file, 5)) {
      setError('ファイルサイズは5MB以下にしてください')
      return
    }

    setAvatarFile(file)
    setError(null)

    // プレビュー表示
    const reader = new FileReader()
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  // プロフィール保存
  const handleSave = async () => {
    if (!profile) return

    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      let avatarUrl = profile.avatar_url

      // 画像がアップロードされている場合
      if (avatarFile) {
        // 画像をリサイズ
        const resizedBlob = await resizeImage(avatarFile, 300, 0.8)

        // ファイル名を生成（ユーザーID/タイムスタンプ.jpg）
        const fileName = `${Date.now()}.jpg`
        const filePath = `${profile.id}/${fileName}`

        // 古い画像を削除（存在する場合）
        if (profile.avatar_url) {
          try {
            const url = new URL(profile.avatar_url)
            const pathname = url.pathname
            const avatarsIndex = pathname.indexOf('/avatars/')

            if (avatarsIndex !== -1) {
              const storageKey = pathname.substring(avatarsIndex + '/avatars/'.length)
              if (storageKey) {
                await supabase.storage.from('avatars').remove([storageKey])
              }
            }
          } catch (e) {
            console.log('古い画像の削除をスキップ:', e)
          }
        }

        // 新しい画像をアップロード
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, resizedBlob, {
            contentType: 'image/jpeg',
            upsert: false,
          })

        if (uploadError) throw uploadError

        // 公開URLを取得
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath)

        avatarUrl = publicUrl
      }

      // プロフィール情報を更新
      const trimmedUsername = username.trim()
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          username: trimmedUsername,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id)

      if (updateError) throw updateError

      setSuccess(true)

      // 2秒後にチャットページにリダイレクト
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current)
      }
      redirectTimeoutRef.current = setTimeout(() => {
        router.push('/')
        router.refresh()
      }, 2000)
    } catch (err) {
      console.error('保存エラー:', err)
      setError('保存に失敗しました')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">プロフィール編集</h1>
          <button
            onClick={() => router.push('/')}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {/* 成功メッセージ */}
        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-md">
            保存しました！チャットページに戻ります...
          </div>
        )}

        {/* アバター */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            プロフィール画像
          </label>
          <div className="flex items-center gap-4">
            {/* アバタープレビュー */}
            <div className="flex-shrink-0">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="アバター"
                  className="w-20 h-20 rounded-full object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center text-2xl font-medium text-gray-600">
                  {username.charAt(0)}
                </div>
              )}
            </div>

            {/* ファイル選択ボタン */}
            <div>
              <input
                type="file"
                id="avatar"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <label
                htmlFor="avatar"
                className="cursor-pointer inline-block px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition"
              >
                画像を選択
              </label>
              <p className="text-xs text-gray-500 mt-1">
                JPG, PNG, WebP（最大5MB）
              </p>
            </div>
          </div>
        </div>

        {/* ユーザー名 */}
        <div className="mb-6">
          <label
            htmlFor="username"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            ユーザー名
          </label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="ユーザー名を入力"
            maxLength={20}
          />
          <p className="text-xs text-gray-500 mt-1">
            {username.length}/20文字
          </p>
        </div>

        {/* 保存ボタン */}
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving || !username.trim()}
            className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
          >
            {saving ? '保存中...' : '保存'}
          </button>
          <button
            onClick={() => router.push('/')}
            disabled={saving}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 transition"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  )
}
