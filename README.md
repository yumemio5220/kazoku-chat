# kazoku-chat

Next.js + TypeScript + Tailwind CSS + Supabase で作成されたリアルタイムグループチャットアプリケーションです。

## 機能

- ✅ 複数人での同時チャット機能
- ✅ リアルタイムメッセージ配信（Supabase Realtime）
- ✅ Supabase 認証およびユーザ名などのアカウント情報の設定機能
- ✅ 未読、既読管理
- ✅ 画像や動画ファイルの送信およびプレビュー
- ✅ オンラインユーザー表示
- ✅ レスポンシブデザイン（PC・スマホ・タブレット対応）

## 技術スタック

- **フレームワーク**: Next.js 16.1.1 (App Router)
- **言語**: TypeScript 5
- **UI**: React 19.2.3
- **スタイリング**: Tailwind CSS 4
- **認証・データベース**: Supabase (@supabase/supabase-js 2.90.0, @supabase/ssr 0.8.0)
- **状態管理**: React Hooks

## プロジェクト構成

```
kazoku-chat/
├── src/
│   ├── app/              # Next.js App Router ページ
│   │   ├── auth/         # 認証コールバック
│   │   ├── login/        # ログインページ
│   │   ├── signup/       # サインアップページ
│   │   ├── profile/      # プロフィール設定ページ
│   │   ├── page.tsx      # メインチャットページ
│   │   └── layout.tsx    # ルートレイアウト
│   ├── components/       # Reactコンポーネント
│   │   ├── ChatRoom.tsx  # チャットルーム全体
│   │   ├── ChatHeader.tsx    # ヘッダー
│   │   ├── ChatMessage.tsx   # メッセージ表示
│   │   ├── ChatInput.tsx     # メッセージ入力
│   │   ├── OnlineUsers.tsx   # オンラインユーザー一覧
│   │   └── ImageModal.tsx    # 画像モーダル
│   ├── lib/
│   │   ├── supabase/     # Supabase設定
│   │   │   ├── client.ts     # クライアント側
│   │   │   ├── server.ts     # サーバー側
│   │   │   └── middleware.ts # ミドルウェア
│   │   └── imageUtils.ts # 画像処理ユーティリティ
│   ├── types/
│   │   └── database.ts   # データベース型定義
│   └── middleware.ts     # Next.jsミドルウェア
├── public/               # 静的ファイル
└── package.json
```

## セットアップ方法

### 1. 前提条件

- Node.js 20以上
- Supabaseアカウント

### 2. リポジトリのクローン

```bash
git clone <repository-url>
cd kazoku-chat
```

### 3. 依存関係のインストール

```bash
npm install
```

### 4. 環境変数の設定

`.env.example` を `.env.local` にコピーし、Supabaseの情報を入力してください。

```bash
cp .env.example .env.local
```

`.env.local` の内容を編集:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 5. Supabaseデータベースのセットアップ

Supabaseプロジェクトで以下のテーブルを作成してください：

- `profiles` - ユーザープロフィール情報
- `messages` - チャットメッセージ
- `message_reads` - メッセージ既読管理
- `user_presence` - ユーザーのオンライン状態

詳細なスキーマは `.CLAUDE.md` を参照してください。

### 6. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてアプリケーションにアクセスできます。

## 使い方

### 1. アカウント登録

1. サインアップページでメールアドレスとパスワードを入力
2. 認証メールを確認（開発環境では自動ログイン）
3. プロフィールページでユーザー名を設定

### 2. チャット

1. ログイン後、自動的にメインチャットページに遷移
2. 画面下部の入力フォームからメッセージを送信
3. 画像・動画ファイルはドラッグ&ドロップまたは📎ボタンから添付
4. 他のユーザーのメッセージはリアルタイムで表示されます

### 3. オンラインユーザー

- 画面右上のアイコンをクリックすると、現在オンラインのユーザー一覧が表示されます

## スクリプト

```bash
# 開発サーバー起動
npm run dev

# プロダクションビルド
npm run build

# プロダクションサーバー起動
npm start

# Lintチェック
npm run lint
```

## ライセンス

Private
