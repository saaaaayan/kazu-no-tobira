# 数のトビラ：公開・検証フロー

## 運用は一本化
- **GitHub**: 唯一のソース管理場所。`main` = 本番版、`codex/*` = 開発中。
- **Vercel**: Web版の本番配信先。プロジェクトは非公開GitHubリポジトリ `saaaaayan/kazu-no-tobira` に接続。Production Branch は `main`。
- **本番URL**: Vercelが払い出す固定のProduction Domain（アカウント接続・初回デプロイ後に確定）。仮のURLをユーザーに案内しない。
- **localhost**: Codexが開発するときのみ内部で利用。ユーザーに案内する確認URLとしては使用しない。

## 公開まで
1. `codex/*` で改修。
2. CI（.github/workflows/verify.yml）でtypecheck、全テスト、Web exportを実行。
3. Webで必要な受け入れ確認ができたら `main` にマージ。
4. Vercelが `main` の更新を自動ビルド・本番公開。
5. 毎回**同じProduction Domain**で確認。デプロイ成功前に「公開済み」と言わない。

## 初期設定（1回のみ）
VercelアカウントからGitHubリポジトリへの読み取り許可を与え、Vercelプロジェクトを作成。Framework Preset = Other、Root Directory = .、Build Command = `pnpm build:web`、Output Directory = `dist`。プロジェクトの Production Branch = `main`。
`vercel.json` がビルドとSPAリライトを設定する。

## 大切な区別
プライベートリポジトリのソースは非公開だが、本番Webで配信するJavaScriptやアセットは閲覧者に取得される。ブラウザに秘密鍵や管理者パスワードを含めない。課金・個人情報・学習記録のクラウド同期は、公開に先立って別途認証・セキュリティ設計が必要。

## 検証
- 公開画面で数字パネルから3+5=8を正解、3+5=9を不正解として表示できる
- 正解時は緑の大きな〇、不正解は赤の大きな✕
- 手書き・キーボード・パネルの入力切替と学習記録を検証
- Vercelのデプロイ成功ステータスと本番URLのHTTP応答を確認
